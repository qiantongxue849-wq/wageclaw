<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { petStage } from './calendar';
import { petFrame, petStyleUrls, type PetFrame } from './petAssets';
import { PET_STYLE_LABELS, defaults, type PetStyle } from './model';
import { loadSettings } from './storage';
import { manualReport } from './broadcast';
import type { DesktopSnapshot } from './desktop';
const desktop = window.wageclawLite;
const view = new URLSearchParams(location.search).get('view');
const preview = !desktop;
const state = ref<DesktopSnapshot>(window.wageclawInitial || { settings: preview ? loadSettings(localStorage).settings : defaults(), recovery: false, bubble: null });
const canvas = ref<HTMLCanvasElement>();
const isBubble = view === 'bubble';
const bubble = computed(() => state.value.bubble);
const size = computed(() => state.value.settings.pet.size);
const now = ref(new Date());
const style = computed<PetStyle>(() => state.value.settings.pet.style);
const styleLabel = computed(() => PET_STYLE_LABELS[style.value] || '桌宠');
/** 十阶随当天班次进度推进，每 10% 换一阶。 */
const stage = computed(() => petStage(now.value, state.value.settings));
let mask: Uint8ClampedArray | undefined;
let motion: Animation | undefined;
let activeAction: 'play' | 'sleep' | undefined;
let clickTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let stageTimer: ReturnType<typeof setInterval> | undefined;
let lastInteractive = true;
let start: { x: number; y: number; pointer: number } | null = null;
let dragging = false, disposed = false, paused = false;
let renderToken = 0;
const loaded = new Map<string, HTMLImageElement>();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const cleanup: Array<() => void> = [];
function image(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
}
async function ensureImage(url: string) {
  const cached = loaded.get(url);
  if (cached) return cached;
  try { const img = await image(url); loaded.set(url, img); return img; } catch { return null; }
}
function draw(img: HTMLImageElement, frame: PetFrame) {
  const ctx = canvas.value?.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  // 合图按格裁切，独立图整张缩放；两者都归一到 288 见方。
  const source = frame.cell || img.naturalWidth;
  ctx.clearRect(0, 0, 288, 288);
  ctx.drawImage(img, frame.sx, 0, source, source, 0, 0, 288, 288);
  mask = ctx.getImageData(0, 0, 288, 288).data;
}
async function render() {
  if (isBubble) return;
  const token = ++renderToken;
  const frame = await petFrame(style.value, stage.value);
  if (token !== renderToken || disposed) return;
  const img = await ensureImage(frame.url);
  if (token !== renderToken || disposed || !img) return;
  draw(img, frame);
}
/** 静默预热当前形象的全部形态，换阶时不必等加载。 */
async function preload(value: PetStyle) {
  try { for (const url of await petStyleUrls(value)) void ensureImage(url); } catch { /* Assets are optional. */ }
}
function stopMotion() {
  motion?.cancel(); motion = undefined; activeAction = undefined;
}
function animate(action: 'play' | 'sleep') {
  const target = canvas.value;
  if (!target || !mask || paused || disposed || dragging || isBubble || document.hidden || reducedMotion.matches) return;
  // Let a response settle before another click; idle movement never interrupts it.
  if (motion && (activeAction === 'play' || action === 'sleep')) return;
  const from = getComputedStyle(target).transform;
  stopMotion();
  const rest = 'translateY(0%) scale(1, 1)';
  const poses = action === 'play' ? [
    { offset: 0, transform: from === 'none' ? rest : from },
    { offset: 0.18, transform: 'translateY(0%) scale(1.035, 0.96)' },
    { offset: 0.43, transform: 'translateY(-2%) scale(0.985, 1.025)' },
    { offset: 0.7, transform: 'translateY(0%) scale(1.012, 0.987)' },
    { offset: 1, transform: rest },
  ] : [
    { offset: 0, transform: rest },
    { offset: 0.45, transform: 'translateY(0%) scale(1.018, 0.975)' },
    { offset: 1, transform: rest },
  ];
  // One intact image, a planted base, and finite compositor motion. No idle frame loop.
  const next = target.animate(poses.map(pose => ({ ...pose, easing: 'cubic-bezier(.4, 0, .2, 1)' })), {
    duration: action === 'play' ? 820 : 1800,
    iterations: 1,
  });
  motion = next; activeAction = action;
  next.onfinish = () => { if (motion === next) stopMotion(); };
}
function hit(event: MouseEvent) {
  if (dragging) return true;
  const rect = canvas.value?.getBoundingClientRect();
  if (!rect || !mask) return true;
  const x = Math.floor((event.clientX - rect.left) / rect.width * 288), y = Math.floor((event.clientY - rect.top) / rect.height * 288);
  return x >= 0 && x < 288 && y >= 0 && y < 288 && mask[(y * 288 + x) * 4 + 3] > 18;
}
function interactive(value: boolean) {
  if (value === lastInteractive) return;
  lastInteractive = value;
  void desktop?.hitTest(value);
  // 离开时留一点时间，让鼠标能移到浮层上；进入浮层会取消这次隐藏。
  if (desktop) void desktop.hoverCard(value, 320);
}
function hover(event: MouseEvent) { interactive(hit(event)); }
function move(event: PointerEvent) {
  interactive(hit(event));
  if (!start) return;
  if (!dragging && Math.hypot(event.screenX - start.x, event.screenY - start.y) > 6) {
    dragging = true; clearTimeout(clickTimer); clickTimer = undefined;
    desktop?.drag({ kind: 'start', x: start.x, y: start.y });
  }
  if (dragging) desktop?.drag({ kind: 'move', x: event.screenX, y: event.screenY });
}
function down(event: PointerEvent) {
  if (event.button !== 0 || !hit(event)) return;
  start = { x: event.screenX, y: event.screenY, pointer: event.pointerId };
  canvas.value?.setPointerCapture(event.pointerId);
}
function up() {
  if (!start) return;
  if (canvas.value?.hasPointerCapture(start.pointer)) canvas.value.releasePointerCapture(start.pointer);
  start = null;
  if (dragging) { dragging = false; desktop?.drag({ kind: 'end' }); return; }
  animate('play');
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = undefined; openPanel(); }
  else clickTimer = setTimeout(() => { clickTimer = undefined; report(); }, 450);
}
function cancel() { start = null; if (dragging) desktop?.drag({ kind: 'end' }); dragging = false; clearTimeout(clickTimer); clickTimer = undefined; }
function report() {
  animate('play');
  if (desktop) void desktop.report();
  else {
    state.value.bubble = manualReport(new Date(), state.value.settings, bubble.value?.topic);
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { state.value.bubble = null; }, 8000);
  }
}
function openPanel() { void desktop?.hoverCard(false, 0); if (desktop) void desktop.openMain(); else window.open('./', '_blank'); }
function dismiss() { if (desktop) void desktop.dismiss(); else state.value.bubble = null; }
function menu(event: MouseEvent) { event.preventDefault(); void desktop?.hoverCard(false, 0); if (desktop) void desktop.petMenu(); else report(); }
function apply(snapshot: DesktopSnapshot) {
  const changedPrivacy = snapshot.settings.privacy !== state.value.settings.privacy;
  state.value = snapshot;
  if (changedPrivacy && preview) state.value.bubble = null;
}
watch([style, stage], () => { void render(); });
watch(style, value => { void preload(value); });
onMounted(async () => {
  document.documentElement.classList.add(preview ? 'pet-preview-document' : 'pet-document');
  if (desktop) {
    cleanup.push(desktop.onSnapshot(apply));
    cleanup.push(desktop.onAnimate(animate));
    cleanup.push(desktop.onPaused(value => { paused = value; if (paused) stopMotion(); }));
    apply(await desktop.getSnapshot());
  }
  if (disposed) return;
  await render();
  void preload(style.value);
  if (disposed) return;
  // 形态每 10% 才跳一阶，30 秒校准一次足够，不必逐秒唤醒。
  stageTimer = setInterval(() => { now.value = new Date(); }, 30000);
  const visibility = () => { if (document.hidden) stopMotion(); };
  const preference = () => { if (reducedMotion.matches) stopMotion(); };
  document.addEventListener('visibilitychange', visibility);
  reducedMotion.addEventListener('change', preference);
  cleanup.push(() => document.removeEventListener('visibilitychange', visibility), () => reducedMotion.removeEventListener('change', preference));
  window.addEventListener('pointermove', move);
  window.addEventListener('mousemove', hover);
});
onUnmounted(() => {
  disposed = true; stopMotion(); clearTimeout(clickTimer); clearTimeout(hideTimer); if (stageTimer) clearInterval(stageTimer);
  window.removeEventListener('pointermove', move); window.removeEventListener('mousemove', hover); cleanup.forEach(fn => fn());
});
</script>
<template>
  <div :class="['pet-surface', { 'pet-preview': preview, 'bubble-only': isBubble }]" :data-theme="state.settings.theme">
    <header v-if="preview" class="preview-heading"><span>忍了吧 · 桌宠预览</span><h1>桌上有个小伙伴，陪你等好日子。</h1><p>单击听一句，双击打开详情。这里模拟桌面效果，跨应用悬浮请使用桌面版。</p></header>
    <div v-if="isBubble || preview" class="speech-slot">
    <div v-if="bubble" class="speech" role="status" @mouseenter="desktop?.hoverBubble(true)" @mouseleave="desktop?.hoverBubble(false)">
      <p>{{ bubble.text }}</p>
      <footer><button @click="openPanel">查看详情 ↗</button><button aria-label="关闭气泡" @click="dismiss">×</button></footer>
    </div>
    </div>
    <div v-if="!isBubble" class="pet-target" :style="{ width: `${size}px`, height: `${size}px` }">
      <canvas ref="canvas" width="288" height="288" role="button" tabindex="0" :aria-label="`${styleLabel} Lv.${stage}：单击播报，双击打开详情`" @pointerdown="down" @pointerup="up" @pointercancel="cancel" @pointerleave="!dragging && interactive(false)" @contextmenu="menu" @keydown.enter="openPanel" @keydown.space.prevent="report"></canvas>
    </div>
    <footer v-if="preview" class="preview-controls"><button @click="report">听它说一句</button><button @click="openPanel">打开详情面板</button><span>{{ styleLabel }} Lv.{{ stage }} · 随今天的工作进度进化，不用喂养</span></footer>
  </div>
</template>
<style>
.pet-document,.pet-document body,.pet-document #app { margin:0; width:100%; height:100%; overflow:hidden; background:transparent!important; }
.pet-surface { color:#304738; font-family:"PingFang SC","Microsoft YaHei",sans-serif; user-select:none; }
.pet-target canvas { width:100%; height:100%; display:block; cursor:grab; touch-action:none; transform-origin:50% 90%; }
.pet-target canvas:active { cursor:grabbing; }
.pet-target canvas:focus-visible { outline:1px dashed #62826b; outline-offset:-3px; }
.speech { margin:4px; box-sizing:border-box; width:282px; min-height:94px; border:1px solid #dce4d8; border-radius:16px; background:#fafbf7; box-shadow:0 2px 7px #1b35221c; padding:13px 15px 8px; }
.speech p { font-size:13px; line-height:1.6; margin:0; min-height:40px; }
.speech footer { display:flex; justify-content:space-between; margin-top:5px; }
.speech button { padding:0; color:#6c836e; border:0; background:transparent; cursor:pointer; font-size:11px; }
.speech button:last-child { font-size:17px; }
.pet-surface[data-theme=dark] .speech { background:#243329; color:#e4eee2; border-color:#425746; }
.pet-preview-document body { margin:0; background:#eef2e9; }
.pet-preview { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; gap:20px; box-sizing:border-box; padding:32px 20px; }
.preview-heading { text-align:center; margin-bottom:8px; }
.preview-heading>span { font-size:12px; letter-spacing:2px; color:#718371; }
.preview-heading h1 { font-weight:500; font-size:clamp(21px,3vw,30px); }
.preview-heading p { font-size:12px; color:#718371; line-height:1.8; max-width:500px; }
.preview-controls { margin-top:25px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
.preview-controls button { padding:10px 15px; border-radius:10px; border:1px solid #cfdbcb; background:#fbfcf9; color:#38513c; cursor:pointer; }
.preview-controls span { width:100%; text-align:center; font-size:11px; color:#718371; padding-top:12px; }
.pet-preview .speech-slot { width:290px; height:112px; flex-shrink:0; }
.pet-preview .speech { margin-bottom:0; }
</style>
