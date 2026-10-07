<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { usePetMotion } from './petMotion';
import { mergePetBond, petStage, recordPetInteraction } from './calendar';
import { petThumbs } from './petAssets';
import { PET_STYLES, PET_STYLE_LABELS, defaults, type PetStyle } from './model';
import { loadSettings } from './storage';
import { artForTopic } from './cardArt';
import { manualReport, requestedReport, comfortReport, type ReportTopic } from './broadcast';
import { reportAction } from './petReactions';
import type { DesktopSnapshot } from './desktop';
import { usePopupFit } from './usePopupFit';
const desktop = window.wageclawLite;
const view = new URLSearchParams(location.search).get('view');
const preview = !desktop;
const state = ref<DesktopSnapshot>(window.wageclawInitial || { settings: preview ? loadSettings(localStorage).settings : defaults(), recovery: false, bubble: null });
const canvas = ref<HTMLCanvasElement>();
const isBubble = view === 'bubble';
const speechCard = ref<HTMLElement>();
usePopupFit(speechCard, isBubble);
const bubble = computed(() => state.value.bubble);
const speechArt = computed(() => artForTopic(bubble.value?.topic || ''));
const size = computed(() => state.value.settings.pet.size);
const now = ref(new Date());
const style = computed<PetStyle>(() => state.value.settings.pet.style);
const styleLabel = computed(() => PET_STYLE_LABELS[style.value] || '桌宠');
/** 固定形态优先；否则每天一上班从第 1 种开始，20 次互动或每满一小时再换。 */
const authored = computed(() => state.value.settings.pet.motion === 'authored');
const stage = computed(() => state.value.settings.pet.form ?? petStage(now.value, state.value.settings));
let mask: Uint8ClampedArray | undefined;

let clickTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let stageTimer: ReturnType<typeof setInterval> | undefined;
let lastInteractive = true;
let start: { x: number; y: number; pointer: number } | null = null;
let dragging = false, disposed = false, paused = false;
const motion = usePetMotion(canvas, {
  style: () => style.value, stage: () => stage.value, enabled: () => authored.value && !isBubble,
  blocked: () => paused || disposed || dragging || isBubble,
  drawn: pixels => { mask = pixels; }
});
const animate = motion.play;
const stopMotion = motion.stop;
const cleanup: Array<() => void> = [];
function syncStageClock() {
  clearInterval(stageTimer); stageTimer = undefined;
  now.value = new Date();
  if (!isBubble && !paused && !disposed && !document.hidden && state.value.settings.pet.form === null) {
    stageTimer = setInterval(() => { now.value = new Date(); }, 30000);
  }
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
    stopMotion();
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
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = undefined; openPanel(); }
  else clickTimer = setTimeout(() => { clickTimer = undefined; report(); }, 450);
}
function cancel() { start = null; if (dragging) desktop?.drag({ kind: 'end' }); dragging = false; clearTimeout(clickTimer); clickTimer = undefined; }
function remember() {
  const next = recordPetInteraction(now.value, state.value.settings);
  if (next === state.value.settings) return;
  state.value = { ...state.value, settings: next };
  if (desktop) void desktop.setPetBond?.(next.pet.bondDate, next.pet.bondCount)?.catch(() => undefined);
  else {
    try {
      const current = loadSettings(localStorage);
      if (!current.recovery) localStorage.setItem(current.key, JSON.stringify(next));
    } catch { /* 预览页记不住时，这一次互动仍然会换上眼前的模样。 */ }
  }
}
function report(topic?: ReportTopic) {
  remember();
  if (desktop) void desktop.report(topic);
  else {
    state.value.bubble = topic ? requestedReport(new Date(), state.value.settings, topic) : manualReport(new Date(), state.value.settings, bubble.value?.topic);
    const action = reportAction(state.value.bubble); if (action) void animate(action);
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { state.value.bubble = null; }, 8000);
  }
}
function choosePet(value: PetStyle) {
  const current = loadSettings(localStorage);
  if (current.recovery) return;
  try {
    const settings = { ...current.settings, pet: { ...current.settings.pet, style: value } };
    localStorage.setItem(current.key, JSON.stringify(settings));
    apply({ ...state.value, settings, bubble: null });
  } catch { state.value.bubble = { id: 'save-error', topic: 'error', signature: 'save-error', priority: 4, text: '暂时无法保存，请检查本机存储空间。' }; }
}
function openPanel() { void desktop?.hoverCard(false, 0); if (desktop) void desktop.openMain(); else window.open('./', '_blank'); }
function pat() {
  remember();
  if (desktop) void desktop.interact('pat');
  else {
    void animate('play'); state.value.bubble = comfortReport(style.value, 'pat');
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { state.value.bubble = null; }, 8000);
  }
}
function stretch() {
  remember();
  animate('stretch');
  if (desktop) void desktop.interact('stretch');
  else { state.value.bubble = { id: 'stretch', topic: 'comfort', signature: 'stretch', priority: 4, text: '肩膀松一松，接下来的事慢慢来。' }; clearTimeout(hideTimer); hideTimer = setTimeout(() => { state.value.bubble = null; }, 8000); }
}
function dismiss() { if (desktop) void desktop.dismiss(); else state.value.bubble = null; }
function menu(event: MouseEvent) { event.preventDefault(); void desktop?.hoverCard(false, 0); if (desktop) void desktop.petMenu(); else report(); }
function apply(snapshot: DesktopSnapshot) {
  const settings = mergePetBond(state.value.settings, snapshot.settings);
  const changedPrivacy = settings.privacy !== state.value.settings.privacy;
  state.value = { ...snapshot, settings };
  if (changedPrivacy && preview) state.value.bubble = null;
}
watch(() => [state.value.settings.pet.form, authored.value], syncStageClock);
onMounted(async () => {
  document.documentElement.classList.add(preview ? 'pet-preview-document' : 'pet-document');
  if (desktop) {
    cleanup.push(desktop.onSnapshot(apply));
    cleanup.push(desktop.onAnimate(animate));
    cleanup.push(desktop.onPaused(value => { paused = value; if (paused) stopMotion(); syncStageClock(); }));
    apply(await desktop.getSnapshot());
  }
  if (disposed) return;
  if (!isBubble) await motion.refresh(false);
  if (disposed) return;
  // Fixed forms and hidden/paused windows need no stage polling.
  syncStageClock();
  document.addEventListener('visibilitychange', syncStageClock);
  cleanup.push(() => document.removeEventListener('visibilitychange', syncStageClock));
  const storage = () => { if (preview) apply({ ...state.value, settings: loadSettings(localStorage).settings }); };
  window.addEventListener('storage', storage);
  cleanup.push(() => window.removeEventListener('storage', storage));
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
    <div v-if="bubble" ref="speechCard" class="speech" role="status" @mouseenter="desktop?.hoverBubble(true)" @mouseleave="desktop?.hoverBubble(false)">
      <svg v-if="bubble.topic === 'news'" class="speech-art" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="17" height="16" rx="3" fill="#f5e4c6" stroke="#ad7950"/><path d="M7 8h9M7 16h9M12 12h4" stroke="#ad7950" stroke-width="1.4" stroke-linecap="round"/><rect x="7" y="11" width="3" height="3" rx=".6" fill="#bb7149"/></svg>
      <img v-else class="speech-art" :src="speechArt" alt="" />
      <p>{{ bubble.text }}</p>
      <button class="speech-close" aria-label="关闭气泡" @click="dismiss">×</button>
    </div>
    </div>
    <div v-if="!isBubble" class="pet-target" :style="{ width: `${size}px`, height: `${size}px` }">
      <canvas ref="canvas" width="288" height="288" role="button" tabindex="0" :aria-label="`${styleLabel} Lv.${stage}：单击播报，双击打开详情`" @pointerdown="down" @pointerup="up" @pointercancel="cancel" @pointerleave="!dragging && interactive(false)" @contextmenu="menu" @keydown.enter="openPanel" @keydown.s.prevent="stretch" @keydown.space.prevent="report()"></canvas>
    </div>
    <div v-if="preview" class="preview-pets" aria-label="已有的五组桌宠"><button v-for="pet in PET_STYLES" :key="pet" :aria-label="`选择${PET_STYLE_LABELS[pet]}`" :aria-pressed="pet === style" :disabled="state.recovery" @click="choosePet(pet)"><img :src="petThumbs[pet]" alt="" /><span>{{ PET_STYLE_LABELS[pet] }}</span></button></div>
    <nav v-if="preview" class="companion-topics" aria-label="让搭子报个信"><button @click="report('income')">攒了多少</button><button @click="report('offwork')">多久下班</button><button @click="report('holiday')">多久放假</button><button @click="report('spring')">春节回家</button><button @click="report('bonus')">年终奖</button></nav>
    <footer v-if="preview" class="preview-controls"><button @click="pat">摸摸它</button><button @click="report()">听它说一句</button><button @click="stretch">一起松口气</button><button @click="openPanel">打开详情面板</button><span>{{ styleLabel }} · {{ state.settings.pet.form ? '固定的第 ' + stage + ' 种模样' : '今天的第 ' + stage + ' 种模样' }} · 不用喂养，想起来就陪你玩</span></footer>
  </div>
</template>
<style>
.pet-document,.pet-document body,.pet-document #app { margin:0; width:100%; height:100%; overflow:hidden; background:transparent!important; }
.pet-surface { color:#304738; font-family:"PingFang SC","Microsoft YaHei",sans-serif; user-select:none; }
.bubble-only { height:100%; }
.bubble-only .speech-slot { height:auto; }
.pet-target canvas { width:100%; height:100%; display:block; cursor:grab; touch-action:none; transform-origin:50% 90%; }
.pet-target canvas:active { cursor:grabbing; }
.pet-target canvas:focus-visible { outline:1px dashed #62826b; outline-offset:-3px; }
.speech {
  margin:4px; box-sizing:border-box; width:max-content; max-width:268px; height:auto; min-height:36px;
  display:grid; grid-template-columns:22px minmax(0,1fr) 18px;
  align-content:center; align-items:center; column-gap:6px; padding:6px 7px;
  border:1px solid #eadfce; border-radius:14px; color:#563f2d;
  background:
    radial-gradient(70px 52px at 0% 0%, rgba(226,196,132,.36), transparent 70%),
    linear-gradient(180deg, #fffcf5 0%, #f7eddd 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.92), 0 3px 8px rgba(27,53,34,.12);
}
.speech-art { width:22px; height:22px; object-fit:contain; }
.speech p { grid-column:2; grid-row:1; margin:0; max-width:194px; font-size:12px; line-height:1.45; overflow-wrap:anywhere; }
.speech button { border:0; cursor:pointer; font-family:inherit; }
.speech-close { width:18px; height:18px; padding:0; border-radius:50%; background:transparent; color:#8aa08c; font-size:13px; line-height:18px; }
.speech-close:hover { background:rgba(48,71,56,.08); color:#304738; }
.speech button:focus-visible { outline:2px solid #527d61; outline-offset:2px; }
.pet-surface[data-theme=dark] .speech {
  background:
    radial-gradient(92px 72px at 0% 0%, rgba(196,168,96,.18), transparent 70%),
    linear-gradient(180deg, #332d26 0%, #29241f 100%);
  color:#f0e5d5; border-color:#504338;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 8px 18px rgba(0,0,0,.28);
}
.pet-surface[data-theme=dark] .speech-close { color:#a9bfae; }
.pet-surface[data-theme=dark] .speech-close:hover { background:rgba(255,255,255,.08); color:#e7f0e4; }
.pet-preview-document body { margin:0; background:#eef2e9; }
.pet-preview { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; gap:20px; box-sizing:border-box; padding:32px 20px; }
.preview-heading { text-align:center; margin-bottom:8px; }
.preview-heading>span { font-size:12px; letter-spacing:2px; color:#718371; }
.preview-heading h1 { font-weight:500; font-size:clamp(21px,3vw,30px); }
.preview-heading p { font-size:12px; color:#718371; line-height:1.8; max-width:500px; }
.preview-controls { margin-top:25px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
.preview-controls button { padding:10px 15px; border-radius:10px; border:1px solid #cfdbcb; background:#fbfcf9; color:#38513c; cursor:pointer; }
.preview-controls span { width:100%; text-align:center; font-size:11px; color:#718371; padding-top:12px; }
.pet-preview .speech-slot { width:max-content; height:auto; flex-shrink:0; }
</style>

<style>
.preview-pets { display:flex;gap:12px; }.preview-pets img { width:42px;height:42px;object-fit:contain;border-radius:12px;padding:4px; }.preview-pets button { border:1px solid transparent;background:none;border-radius:12px;padding:3px;color:#526657;cursor:pointer; }.preview-pets button[aria-pressed=true] { background:#dde6cd;border-color:#a5b896; }.preview-pets span { display:block;font-size:10px; }.preview-pets img { display:block; }.pet-preview-document body { background:#f6f5f0; }.pet-preview .preview-controls { margin-top:0; }
</style>

<style>
.pet-preview .companion-topics { display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:0;max-width:100%; }
.pet-preview .companion-topics button { padding:8px 12px;border:1px solid #d7dfcf;border-radius:20px;background:#fffdf7;color:#5b7257;font:inherit;font-size:12px;cursor:pointer; }
.pet-preview .companion-topics button:hover { border-color:#91a77e;background:#edf1e5; }
.pet-preview .companion-topics button:focus-visible { outline:2px solid #6f9056;outline-offset:3px; }
</style>
