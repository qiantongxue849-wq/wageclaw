import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import { loadPosePack, packName, poseClip } from './petMotionAssets';
import { clampStage, petFrame } from './petAssets';
import { drawPetFrame } from './petDrawing';
import { drawPetTransition, transitionNames } from './petStageMotion';
import { samplePose } from './petPosePlayback';
import type { PetStyle } from './model';
import type { PetAction } from './petReactions';
export type { PetAction } from './petReactions';

type Form = { style: PetStyle; stage: number; canvas: HTMLCanvasElement };
const surface = () => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 288; return canvas; };

/** One finite renderer owns actions and changes of form, including cancellation.
 * Every level plays actual drawn poses from its own atlas; no procedural warp.
 */
export function usePetMotion(target: Ref<HTMLCanvasElement | undefined>, options: {
  style: () => PetStyle;
  stage: () => number;
  enabled: () => boolean;
  transitions?: () => boolean;
  blocked?: () => boolean;
  drawn?: (pixels: Uint8ClampedArray) => void;
  failed?: (value: boolean) => void;
}) {
  let frameRequest: number | undefined;
  let warmTimer: ReturnType<typeof setTimeout> | undefined;
  let observer: IntersectionObserver | undefined;
  let lastPublish = -Infinity;
  // Read the alpha mask separately so the visible canvas can keep GPU-backed drawing.
  const maskCanvas = options.drawn ? surface() : undefined;
  const maskContext = maskCanvas?.getContext('2d', { willReadFrequently: true });
  let token = 0, disposed = false, mode: 'idle' | 'action' | 'transition' = 'idle';
  let pending: PetAction | undefined;
  let current: Form | undefined;
  const cache = new Map<string, Promise<Form>>();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const key = (style: PetStyle, stage: number) => `${style}:${stage}`;
  const wanted = () => key(options.style(), clampStage(options.stage()));
  const active = () => current && key(current.style, current.stage);
  const allowed = () => !disposed && !options.blocked?.() && !document.hidden && !preference.matches;
  function publish(force = false) {
    if (!maskContext || !target.value || !options.drawn) return;
    const now = performance.now();
    if (!force && now - lastPublish < 80) return;
    lastPublish = now;
    maskContext.clearRect(0, 0, 288, 288);
    maskContext.drawImage(target.value, 0, 0);
    options.drawn(maskContext.getImageData(0, 0, 288, 288).data);
  }
  function still(form: Form) {
    const canvas = target.value, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 288, 288); ctx.drawImage(form.canvas, 0, 0);
    Object.assign(canvas.dataset, { motion: 'classic', moving: 'false', transitioning: 'false', character: form.style, stage: String(form.stage) });
    publish(true);
  }
  async function load(style: PetStyle, stage: number): Promise<Form> {
    const id = key(style, stage), saved = cache.get(id);
    if (saved) { cache.delete(id); cache.set(id, saved); return saved; }
    const result = (async () => {
      const frame = await petFrame(style, stage), image = new Image();
      image.src = frame.url; await image.decode();
      const canvas = surface(), ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      drawPetFrame(ctx, image, frame);
      return { style, stage, canvas };
    })().catch(error => { cache.delete(id); throw error; });
    cache.set(id, result);
    const oldest = cache.keys().next().value;
    if (cache.size > 3 && oldest) cache.delete(oldest);
    return result;
  }
  function cancel() { token++; if (frameRequest !== undefined) cancelAnimationFrame(frameRequest); frameRequest = undefined; mode = 'idle'; }
  function warmCurrent() {
    clearTimeout(warmTimer);
    if (!current || mode !== 'idle' || wanted() !== active() || !options.enabled() || !allowed() || !target.value?.getClientRects().length) return;
    const form = current;
    warmTimer = setTimeout(() => {
      warmTimer = undefined;
      if (current !== form || mode !== 'idle' || wanted() !== active() || !options.enabled() || !allowed() || !target.value?.getClientRects().length) return;
      const names = new Set(['play', 'stretch'].map(action => packName(form.style, action as PetAction, form.stage)));
      for (const name of names) void loadPosePack(name).catch(() => undefined);
    }, 120);
  }
  // Only active gestures schedule frames; elapsed time also handles an occasional delayed paint.
  function run(duration: number, request: number, draw: (progress: number) => void, done: () => void) {
    let start: number | undefined;
    function step(now: number) {
      frameRequest = undefined;
      if (disposed || request !== token) return;
      if (!allowed() || !target.value?.getClientRects().length) { stop(); return; }
      start ??= now;
      const progress = Math.min(1, (now - start) / duration);
      draw(progress); publish();
      if (progress < 1) frameRequest = requestAnimationFrame(step);
      else done();
    }
    frameRequest = requestAnimationFrame(step);
  }
  function finish() {
    mode = 'idle';
    if (current) still(current);
    if (wanted() !== active()) { void present(); return; }
    warmCurrent();
    const next = pending; pending = undefined;
    if (next) void play(next);
  }
  async function present(animate = true) {
    if (disposed || !target.value) return;
    cancel(); mode = 'transition';
    const request = token, style = options.style(), stage = clampStage(options.stage());
    try {
      const next = await load(style, stage);
      if (request !== token || disposed || !target.value) return;
      const ctx = target.value.getContext('2d'); if (!ctx) return;
      options.failed?.(false);
      if (current && animate && options.transitions?.() !== false && allowed() && (active() !== key(style, stage) || target.value.dataset.transitioning === 'true')) {
        // Capture the currently visible pixels, including an interrupted transition.
        const before = surface(); before.getContext('2d')?.drawImage(target.value, 0, 0);
        const from = current.style;
        Object.assign(target.value.dataset, { moving: 'true', transitioning: 'true', transition: transitionNames[style], motion: 'transition' });
        run(style === 'rageBlob' ? 620 : 480, request,
          t => drawPetTransition(ctx, before, next.canvas, from, style, t),
          () => { current = next; finish(); });
      } else { current = next; finish(); }
    } catch {
      if (request !== token || disposed) return;
      mode = 'idle'; pending = undefined;
      if (current) still(current);
      options.failed?.(true);
    }
  }
  async function play(action: PetAction) {
    if (!options.enabled() || !allowed()) return;
    if (mode !== 'idle') { pending = action; return; }
    if (!current) { pending = action; void present(false); return; }
    mode = 'action'; const request = ++token, form = current;
    const canvas = target.value, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) { mode = 'idle'; return; }
    const mark = (renderer: string) => Object.assign(canvas.dataset, { motion: renderer, action, character: form.style, stage: String(form.stage), moving: 'true', transitioning: 'false' });
    try {
      const pack = await loadPosePack(packName(form.style, action, form.stage));
      if (request !== token || !allowed() || !options.enabled()) return;
      const clip = poseClip(form.style, action, form.stage), duration = clip.reduce((sum, [, ms]) => sum + ms, 0);
      const pose = surface(), poseCtx = pose.getContext('2d');
      if (!poseCtx) { finish(); return; }
      // Keep only three prepared poses per gesture, avoiding atlas cropping and scaling on every paint.
      const poses = new Map<number, HTMLCanvasElement>();
      function prepared(index: number) {
        const saved = poses.get(index);
        if (saved) { poses.delete(index); poses.set(index, saved); return saved; }
        const image = surface(), context = image.getContext('2d');
        const f = pack.frames[index], s = pack.scale;
        context?.drawImage(pack.image, f.sx, f.sy, f.sw, f.sh, (pack.originX ?? 144)-f.anchor*s, (pack.originY ?? 266)-f.ground*s, f.sw*s, f.sh*s);
        poses.set(index, image);
        const oldest = poses.keys().next().value;
        if (poses.size > 3 && oldest !== undefined) poses.delete(oldest);
        return image;
      }
      mark('authored');
      const fade = 120, total = duration + fade * 2;
      run(total, request, progress => {
        const time = progress * total, clipTime = Math.max(0, Math.min(duration, time - fade));
        const { from, to, mix: poseMix } = samplePose(clip, clipTime);
        poseCtx.clearRect(0, 0, 288, 288);
        poseCtx.globalAlpha = 1 - poseMix; poseCtx.drawImage(prepared(from), 0, 0);
        if (poseMix > 0) {
          poseCtx.globalCompositeOperation = 'lighter'; poseCtx.globalAlpha = poseMix; poseCtx.drawImage(prepared(to), 0, 0);
          poseCtx.globalCompositeOperation = 'source-over';
        }
        poseCtx.globalAlpha = 1;
        const mix = Math.max(0, Math.min(1, time/fade, (total-time)/fade));
        ctx.clearRect(0, 0, 288, 288);
        ctx.globalAlpha = 1-mix; ctx.drawImage(form.canvas, 0, 0);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = mix; ctx.drawImage(pose, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }, finish);
    } catch { if (request === token) finish(); }
  }
  function stop(reset = true) {
    cancel(); clearTimeout(warmTimer); warmTimer = undefined; pending = undefined;
    if (reset && !disposed) { if (current) still(current); if (wanted() !== active()) void present(false); }
  }
  watch(() => [options.style(), clampStage(options.stage()), options.enabled()], (value, before) => {
    if (value[0] !== before[0] || value[2] !== before[2]) { pending = undefined; void present(); }
    else if (mode !== 'action') void present(); // Finish the gesture before changing outfits.
  });
  const visibility = () => { if (document.hidden) stop(); };
  const reduce = () => { if (preference.matches) stop(); };
  document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', reduce);
  onMounted(() => {
    void present(false);
    observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) warmCurrent(); });
    if (target.value) observer.observe(target.value);
  });
  onUnmounted(() => { disposed = true; stop(false); observer?.disconnect(); current = undefined; cache.clear(); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', reduce); });
  return { play, stop, refresh: present, playing: () => mode !== 'idle' };
}
