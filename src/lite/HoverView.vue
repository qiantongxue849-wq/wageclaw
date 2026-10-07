<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { cardArt } from './cardArt';
import { bonusCountdown, duration, earnings, nextHoliday, paydayCountdown } from './calendar';
import { defaults } from './model';
import { loadSettings } from './storage';
import type { DesktopSnapshot } from './desktop';
import { usePopupFit } from './usePopupFit';

const desktop = window.wageclawLite;
const preview = !desktop;
const card = ref<HTMLElement>();
usePopupFit(card);
const now = ref(new Date());
const state = ref<DesktopSnapshot>(window.wageclawInitial || {
  settings: preview ? loadSettings(localStorage).settings : defaults(),
  recovery: false,
  bubble: null
});
const settings = computed(() => state.value.settings);
const income = computed(() => earnings(now.value, settings.value));
const payday = computed(() => paydayCountdown(now.value, settings.value.payday));
const holiday = computed(() => nextHoliday(now.value));
const bonus = computed(() => bonusCountdown(now.value, settings.value));

const money = (value: number) => settings.value.privacy ? '¥ ••••' : `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = computed(() => settings.value.configured ? money(income.value.today) : '¥ —');
const offwork = computed(() => {
  if (!settings.value.configured) return '待设置';
  return { before: '还没上班', after: '今天收工了', rest: '今天休息', working: duration(income.value.offSeconds) }[income.value.status];
});
const paydayText = computed(() => {
  const value = payday.value;
  if (!value) return '未设置';
  return value.days === 0 ? '今天发薪' : `${value.days} 天`;
});
const holidayText = computed(() => {
  const value = holiday.value;
  if (!value) return '待公布';
  return value.days > 0 ? `${value.name} · ${value.days} 天` : `${value.name} · 剩 ${value.remaining} 天`;
});
const bonusText = computed(() => {
  const value = bonus.value;
  if (value.state === 'unset') return '未设置';
  if (value.state === 'received') return '已收到';
  if (value.state === 'today') return '今天发放';
  if (value.state === 'past') return '已过';
  return `${value.days} 天`;
});

let timer: ReturnType<typeof setInterval> | undefined;
const cleanups: Array<() => void> = [];
function enter() { void desktop?.hoverCard(true); }
function leave() { void desktop?.hoverCard(false, 0); }
onMounted(() => {
  document.documentElement.classList.add(preview ? 'hover-preview-document' : 'hover-document');
  if (desktop) {
    cleanups.push(desktop.onSnapshot(snapshot => { state.value = snapshot; }));
    void desktop.getSnapshot().then(snapshot => { state.value = snapshot; }).catch(() => undefined);
  }
  timer = setInterval(() => { now.value = new Date(); }, 1000);
});
onUnmounted(() => { if (timer) clearInterval(timer); cleanups.forEach(cleanup => cleanup()); });
</script>
<template>
  <div ref="card" class="hover-card" :data-theme="settings.theme" role="status" aria-label="今日概览" @mouseenter="enter" @mouseleave="leave">
    <div class="hover-list">
      <div class="hover-row"><img class="hover-mini" :src="cardArt.income" alt="" /><span class="hover-label">今日已赚</span><span class="hover-value" data-testid="hover-today">{{ today }}</span></div>
      <div class="hover-row"><img class="hover-mini" :src="cardArt.offwork" alt="" /><span class="hover-label">距离下班</span><span class="hover-value" data-testid="hover-offwork">{{ offwork }}</span></div>
      <div class="hover-row"><img class="hover-mini" :src="cardArt.payday" alt="" /><span class="hover-label">距离发薪</span><span class="hover-value" data-testid="hover-payday">{{ paydayText }}</span></div>
      <div class="hover-row"><img class="hover-mini" :src="cardArt.holiday" alt="" /><span class="hover-label">最近假期</span><span class="hover-value" data-testid="hover-holiday">{{ holidayText }}</span></div>
      <div class="hover-row"><img class="hover-mini" :src="cardArt.bonus" alt="" /><span class="hover-label">距离年终奖</span><span class="hover-value" data-testid="hover-bonus">{{ bonusText }}</span></div>
    </div>
  </div>
</template>
<style>
.hover-document,.hover-document body,.hover-document #app { margin:0; width:100%; height:100%; overflow:hidden; background:transparent!important; }
.hover-preview-document body { margin:0; background:#f2eadd; }
.hover-preview-document #app { width:max-content; }
.hover-card {
  box-sizing:border-box; width:max-content; max-width:248px; height:auto; margin:4px;
  display:flex; flex-direction:column; padding:5px 8px;
  border:1px solid #eadfce; border-radius:12px; color:#563f2d;
  font-family:"PingFang SC","Microsoft YaHei",sans-serif; font-size:11px;
  background:
    radial-gradient(72px 48px at 100% 0%, rgba(226, 196, 132, 0.36), transparent 72%),
    linear-gradient(180deg, #fffcf5 0%, #f7eddd 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.92), 0 3px 8px rgba(27,53,34,.12);
}
.hover-list { display:grid; grid-template-columns:14px max-content minmax(0,max-content); align-items:center; gap:3px 6px; }
.hover-row { display:contents; }
.hover-mini { width:14px; height:14px; object-fit:contain; }
.hover-label { color:#8b745f; white-space:nowrap; }
.hover-value { max-width:124px; min-height:17px; line-height:17px; font-weight:600; font-variant-numeric:tabular-nums; text-align:right; overflow-wrap:anywhere; }
.hover-card[data-theme=dark] {
  background:
    radial-gradient(72px 48px at 100% 0%, rgba(196,168,96,.16), transparent 72%),
    linear-gradient(180deg, #332d26 0%, #29241f 100%);
  border-color:#504338; color:#f0e5d5;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 3px 8px rgba(0,0,0,.28);
}
.hover-card[data-theme=dark] .hover-label { color:#c0ad97; }
</style>
