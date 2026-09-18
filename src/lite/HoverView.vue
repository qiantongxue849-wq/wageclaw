<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { bonusCountdown, duration, earnings, nextHoliday, paydayCountdown } from './calendar';
import { defaults } from './model';
import { loadSettings } from './storage';
import type { DesktopSnapshot } from './desktop';

const desktop = window.wageclawLite;
const preview = !desktop;
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
  <div class="hover-card" :data-theme="settings.theme" role="status" aria-label="今日概览" @mouseenter="enter" @mouseleave="leave">
    <div class="hover-row"><span class="hover-label">今日已赚</span><span class="hover-value" data-testid="hover-today">{{ today }}</span></div>
    <div class="hover-row"><span class="hover-label">距离下班</span><span class="hover-value" data-testid="hover-offwork">{{ offwork }}</span></div>
    <div class="hover-row"><span class="hover-label">距离发薪</span><span class="hover-value" data-testid="hover-payday">{{ paydayText }}</span></div>
    <div class="hover-row"><span class="hover-label">最近假期</span><span class="hover-value" data-testid="hover-holiday">{{ holidayText }}</span></div>
    <div class="hover-row"><span class="hover-label">距离年终奖</span><span class="hover-value" data-testid="hover-bonus">{{ bonusText }}</span></div>
  </div>
</template>
<style>
.hover-document,.hover-document body,.hover-document #app { margin:0; width:100%; height:100%; overflow:hidden; background:transparent!important; }
.hover-preview-document body { margin:0; background:#eef2e9; }
.hover-preview-document #app { padding:20px; }
.hover-card { box-sizing:border-box; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; gap:5px; padding:10px 14px; border:1px solid #dce4d8; border-radius:14px; background:#fafbf7; color:#304738; font-family:"PingFang SC","Microsoft YaHei",sans-serif; font-size:12px; box-shadow:0 2px 7px #1b35221c; }
.hover-row { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.hover-label { color:#6c836e; }
.hover-value { font-weight:500; font-variant-numeric:tabular-nums; text-align:right; }
.hover-card[data-theme=dark] { background:#243329; border-color:#425746; color:#e4eee2; }
.hover-card[data-theme=dark] .hover-label { color:#9db3a0; }
</style>
