import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import { loadPosePack, packName, poseClip } from './petMotionAssets';
import { clampStage, petFrame } from './petAssets';
import { drawPetFrame } from './petDrawing';
import { drawPetTransition, transitionNames } from './petStageMotion';
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  let token = 0, disposed = false, mode: 'idle' | 'action' | 'transition' = 'idle';
  let pending: PetAction | undefined;
  let current: Form | undefined;
  const cache = new Map<string, Promise<Form>>();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const key = (style: PetStyle, stage: number) => `${style}:${stage}`;
  const wanted = () => key(options.style(), clampStage(options.stage()));
  const active = () => current && key(current.style, current.stage);
  const allowed = () => !disposed && !options.blocked?.() && !document.hidden && !preference.matches;
  function publish() {
    const ctx = target.value?.getContext('2d');
    if (ctx && options.drawn) options.drawn(ctx.getImageData(0, 0, 288, 288).data);
  }
  function still(form: Form) {
    const canvas = target.value, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 288, 288); ctx.drawImage(form.canvas, 0, 0);
    Object.assign(canvas.dataset, { motion: 'classic', moving: 'false', transitioning: 'false', character: form.style, stage: String(form.stage) });
    publish();
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
  function cancel() { token++; clearTimeout(timer); timer = undefined; mode = 'idle'; }
  // Finite wall-clock playback. No idle animation loop; delayed frames skip ahead.
  function run(duration: number, request: number, draw: (progress: number) => void, done: () => void) {
    const start = performance.now();
    function step() {
      if (disposed || request !== token) return;
      const progress = Math.min(1, (performance.now() - start) / duration);
      draw(progress); publish();
      if (progress < 1) timer = setTimeout(step, 1000 / 30);
      else { timer = undefined; done(); }
    }
    step();
  }
  function finish() {
    mode = 'idle';
    if (current) still(current);
    if (wanted() !== active()) { void present(); return; }
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
      mark('authored');
      run(duration + 360, request, progress => {
        const time = progress * (duration + 360), clipTime = Math.max(0, Math.min(duration, time - 180));
        let at = 0, index = 0;
        for (const [frame, ms] of clip) { index = frame; at += ms; if (clipTime < at) break; }
        const f = pack.frames[index], s = pack.scale;
        poseCtx.clearRect(0, 0, 288, 288);
        poseCtx.drawImage(pack.image, f.sx, f.sy, f.sw, f.sh, (pack.originX ?? 144)-f.anchor*s, (pack.originY ?? 266)-f.ground*s, f.sw*s, f.sh*s);
        const mix = Math.max(0, Math.min(1, time/180, (duration+360-time)/180));
        ctx.clearRect(0, 0, 288, 288);
        ctx.globalAlpha = 1-mix; ctx.drawImage(form.canvas, 0, 0);
        ctx.globalAlpha = mix; ctx.drawImage(pose, 0, 0); ctx.globalAlpha = 1;
      }, finish);
    } catch { if (request === token) finish(); }
  }
  function stop(reset = true) {
    cancel(); pending = undefined;
    if (reset && !disposed) { if (current) still(current); if (wanted() !== active()) void present(false); }
  }
  watch(() => [options.style(), clampStage(options.stage()), options.enabled()], (value, before) => {
    if (value[0] !== before[0] || value[2] !== before[2]) { pending = undefined; void present(); }
    else if (mode !== 'action') void present(); // Finish the gesture before changing outfits.
  });
  const visibility = () => { if (document.hidden) stop(); };
  const reduce = () => { if (preference.matches) stop(); };
  document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', reduce);
  onMounted(() => { void present(false); });
  onUnmounted(() => { disposed = true; stop(false); current = undefined; cache.clear(); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', reduce); });
  return { play, stop, refresh: present, playing: () => mode !== 'idle' };
}
