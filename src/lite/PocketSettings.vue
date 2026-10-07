<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { dateKey, parseDate, parseMonthDay, validateSettings, type LiteSettings } from './model';
import type { LiteDesktop } from './desktop';
import type { UpdateState } from '../auth-types';
const props = defineProps<{ settings: LiteSettings; recovery: boolean; notice: string; desktop?: LiteDesktop }>();
const emit = defineEmits<{ close: []; save: [settings: LiteSettings]; export: []; reset: []; import: []; dismissNotice: [] }>();
const draft = ref<LiteSettings>(JSON.parse(JSON.stringify(props.settings)));
const groups = ['工资与发薪', '日常作息', '夏季作息', '春节假期', '年终奖', '临时安排', '外观', '桌面', '气泡播报', '数据与更新'];
const step = ref(props.recovery ? 9 : 0);
const error = ref('');
const dialog = ref<HTMLElement>();
const overrideDate = ref('');
const overrideWork = ref('rest');
const overridePage = ref(0);
const overrides = computed(() => Object.entries(draft.value.overrides).sort(([a], [b]) => a.localeCompare(b)));
const overrideCount = computed(() => Math.max(1, Math.ceil(overrides.value.length / 2)));
const confirmReset = ref(false);
const update = ref<UpdateState>();
const updateBusy = ref(false);
let cleanUpdate: (() => void) | undefined;
const previousFocus = document.activeElement as HTMLElement | null;
const week = [{ day: 1, name: '一' }, { day: 2, name: '二' }, { day: 3, name: '三' }, { day: 4, name: '四' }, { day: 5, name: '五' }, { day: 6, name: '六' }, { day: 0, name: '日' }];
watch(() => props.settings, (value, before) => { draft.value = JSON.parse(JSON.stringify(value)); confirmReset.value = false; if (before.configured && !value.configured && !props.recovery) step.value = 0; }, { deep: true });
watch(overrideCount, count => { overridePage.value = Math.min(overridePage.value, count - 1); });
function submit() {
  const value = { ...draft.value, configured: true };
  value.salary = Number(value.salary);
  value.payday = String(value.payday ?? '') === '' ? null : Number(value.payday);
  value.bonusAmount = String(value.bonusAmount ?? '') === '' ? null : Number(value.bonusAmount);
  if (value.bonusDate !== props.settings.bonusDate) value.bonusReceivedAt = '';
  error.value = validateSettings(value);
  if (!error.value) emit('save', value);
  else {
    // Bring the invalid group into view; hidden inputs never block submission.
    const why = error.value;
    step.value = /月薪|发薪/.test(why) ? 0 : /夏季/.test(why) ? 2 : /春节/.test(why) ? 3 : /年终奖|奖金/.test(why) ? 4 : /临时/.test(why) ? 5 : 1;
    if (/有效日期/.test(why)) step.value = [value.springStart, value.springEnd].some(date => date && !parseMonthDay(date)) ? 3 : 4;
  }
}
function addOverride() {
  if (!parseDate(overrideDate.value)) { error.value = '请先选择临时安排的日期。'; return; }
  draft.value.overrides[overrideDate.value] = overrideWork.value === 'work';
  overridePage.value = Math.floor(overrides.value.findIndex(([date]) => date === overrideDate.value) / 2);
  overrideDate.value = ''; error.value = '';
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { if (confirmReset.value) confirmReset.value = false; else if (!props.recovery) emit('close'); }
  if (event.key !== 'Tab') return;
  const nodes = [...(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') || [])].filter(el => el.offsetParent !== null);
  const first = nodes[0], last = nodes.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
async function updateAction(install = false) {
  if (!props.desktop) return;
  updateBusy.value = true;
  try { update.value = await (install ? props.desktop.installUpdate() : props.desktop.checkForUpdates()); }
  catch { error.value = '更新暂不可用，离线功能仍可使用。'; }
  finally { updateBusy.value = false; }
}
onMounted(async () => {
  await nextTick(); dialog.value?.focus();
  if (props.desktop) {
    cleanUpdate = props.desktop.onUpdate(state => { update.value = state; });
    try { update.value = await props.desktop.getUpdateState(); } catch { /* Optional. */ }
  }
});
onUnmounted(() => { cleanUpdate?.(); previousFocus?.focus(); });
</script>
<template>
  <div class="pocket-settings-backdrop">
    <section ref="dialog" class="pocket-settings" role="dialog" aria-modal="true" aria-labelledby="pocket-settings-title" tabindex="-1" @keydown="keydown">
      <header class="pocket-settings-title"><strong id="pocket-settings-title">{{ settings.configured ? '设置' : '开始我的小记' }}</strong><button v-if="!recovery" aria-label="关闭设置" @click="emit('close')">×</button></header>
      <form novalidate @submit.prevent="submit">
        <div class="pocket-settings-content">
          <div class="settings-group"><select v-model.number="step" aria-label="设置分组"><option v-for="(name, n) in groups" :key="name" :value="n">{{ name }}</option></select><span>{{ step + 1 }} / {{ groups.length }}</span></div>
          <fieldset v-if="step === 0" :disabled="recovery"><div class="compact-fields"><label>月薪（元）<input v-model.number="draft.salary" aria-label="月薪" type="number" min="0.01" max="100000000" step="0.01" placeholder="建议税后月薪" /></label><label>每月发薪日<input v-model.number="draft.payday" aria-label="每月发薪日" type="number" min="1" max="31" placeholder="选填 1～31" /></label></div><p class="compact-help">收入按排班估算，设置仅保存在本机。</p></fieldset>
          <fieldset v-else-if="step === 1" :disabled="recovery"><div class="compact-fields"><label>上班时间<input v-model="draft.startTime" aria-label="上班时间" type="time" /></label><label>下班时间<input v-model="draft.endTime" aria-label="下班时间" type="time" /></label></div><div class="compact-week"><span>工作日</span><label v-for="item in week" :key="item.day" :class="{ selected: draft.workweek.includes(item.day) }"><input v-model="draft.workweek" type="checkbox" :value="item.day" :aria-label="`周${item.name}上班`" /><span>{{ item.name }}</span></label></div><p class="compact-help">午休计入工时；不支持跨夜班次。</p></fieldset>
          <fieldset v-else-if="step === 2" :disabled="recovery"><div class="compact-fields"><label>开始（月-日）<input v-model="draft.summerFrom" aria-label="夏季作息生效开始" maxlength="5" placeholder="05-01" /></label><label>结束（月-日）<input v-model="draft.summerTo" aria-label="夏季作息生效结束" maxlength="5" placeholder="10-01" /></label><label>夏季上班<input v-model="draft.summerStartTime" aria-label="夏季上班时间" type="time" /></label><label>夏季下班<input v-model="draft.summerEndTime" aria-label="夏季下班时间" type="time" /></label></div></fieldset>
          <fieldset v-else-if="step === 3" :disabled="recovery"><div class="compact-fields"><label>开始（月-日）<input v-model="draft.springStart" aria-label="春节放假开始" maxlength="5" placeholder="02-04" /></label><label>结束（月-日）<input v-model="draft.springEnd" aria-label="春节放假结束" maxlength="5" placeholder="选填 02-10" /></label></div><p class="compact-help">按公司安排填写，每年重复。<br />只填开始日期时，仅当天休息。</p></fieldset>
          <fieldset v-else-if="step === 4" :disabled="recovery"><div class="compact-fields"><label>预计日期（月-日）<input v-model="draft.bonusDate" aria-label="年终奖预计发放日期" maxlength="5" placeholder="02-03" /></label><label>预计金额（元）<input v-model.number="draft.bonusAmount" aria-label="年终奖预计金额" type="number" min="0" step="0.01" placeholder="选填" /></label></div><label class="compact-switch"><span>本轮已收到</span><input :disabled="!draft.bonusDate" :checked="Boolean(draft.bonusReceivedAt)" type="checkbox" @change="draft.bonusReceivedAt = ($event.target as HTMLInputElement).checked ? dateKey(new Date()) : ''" /></label><p class="compact-help">预计奖金不计入已赚收入。</p></fieldset>
          <fieldset v-else-if="step === 5" :disabled="recovery"><div class="compact-override"><input v-model="overrideDate" aria-label="临时安排日期" type="date" min="1900-01-01" max="2200-12-31" /><select v-model="overrideWork" aria-label="临时安排类型"><option value="rest">休息</option><option value="work">上班</option></select><button type="button" @click="addOverride">添加</button></div><div class="compact-override-list"><div v-for="([date, working]) in overrides.slice(overridePage * 2, overridePage * 2 + 2)" :key="date"><span>{{ date }} · {{ working ? '上班' : '休息' }}</span><button type="button" :aria-label="`移除 ${date} 的安排`" @click="delete draft.overrides[date]">移除</button></div><p v-if="!overrides.length" class="compact-help">优先于内置调休和个人假期。</p></div><nav v-if="overrideCount > 1" class="compact-list-pages" aria-label="临时安排分页"><button type="button" :disabled="overridePage === 0" @click="overridePage--">‹</button><span>{{ overridePage + 1 }} / {{ overrideCount }}</span><button type="button" :disabled="overridePage === overrideCount - 1" @click="overridePage++">›</button></nav></fieldset>
          <fieldset v-else-if="step === 6" :disabled="recovery" class="compact-toggles"><label class="compact-switch"><span>隐藏金额</span><input v-model="draft.privacy" type="checkbox" /></label><label class="compact-switch"><span>深色外观</span><input :checked="draft.theme === 'dark'" type="checkbox" @change="draft.theme = ($event.target as HTMLInputElement).checked ? 'dark' : 'light'" /></label><label class="compact-switch"><span>显示桌宠</span><input v-model="draft.pet.visible" type="checkbox" /></label><label class="compact-switch"><span>桌宠置顶</span><input v-model="draft.pet.onTop" type="checkbox" /></label></fieldset>
          <fieldset v-else-if="step === 7" :disabled="recovery"><label class="compact-inline">桌宠大小<select v-model.number="draft.pet.size" aria-label="桌宠大小"><option :value="100">小</option><option :value="128">中</option><option :value="156">大</option></select></label><label v-if="desktop" class="compact-switch"><span>开机自启（安装版）</span><input v-model="draft.autoStart" type="checkbox" /></label><p class="compact-help">形象与十种形态在「桌宠」页选择。</p></fieldset>
          <fieldset v-else-if="step === 8" :disabled="recovery"><div class="compact-toggles"><label class="compact-switch"><span>自动播报</span><input v-model="draft.broadcast.enabled" type="checkbox" /></label><label class="compact-switch"><span>热点消息</span><input v-model="draft.broadcast.news" type="checkbox" /></label></div><div class="compact-actions"><button type="button" @click="draft.broadcast.pauseUntil = Date.now() + 3600000">暂停一小时</button><button type="button" @click="draft.broadcast.quietDate = dateKey(new Date())">今天安静</button><button type="button" @click="draft.broadcast.pauseUntil = 0; draft.broadcast.quietDate = ''; draft.broadcast.enabled = true">恢复</button></div><p class="compact-help">{{ draft.broadcast.quietDate === dateKey(new Date()) ? '今天安静，保存后生效。' : draft.broadcast.pauseUntil > Date.now() ? '暂停一小时，保存后生效。' : '工作时偶尔说一句，默认静音。' }}</p></fieldset>
          <div v-else class="compact-data"><p class="compact-help">{{ recovery ? '存档无法读取，请先导出备份再重置。' : '重置、导入前会保留本机存档备份。' }}</p><div class="compact-actions"><button type="button" @click="emit('export')">导出备份</button><button v-if="desktop" type="button" @click="emit('import')">导入</button><button type="button" @click="confirmReset = true">重置</button><button v-if="desktop" type="button" :disabled="updateBusy || update?.status === 'downloading'" @click="updateAction(update?.status === 'available')">{{ update?.status === 'available' ? '安装更新' : '检查更新' }}</button></div><p v-if="update?.message" class="compact-update" :title="update.message">{{ update.message }}</p></div>
        </div>
        <footer class="pocket-settings-footer"><button type="button" :disabled="step === 0" @click="step--">‹ 上一页</button><button type="submit" class="pocket-save" :disabled="recovery">{{ settings.configured ? '保存设置' : '开始我的倒计时' }}</button><button type="button" :disabled="step === groups.length - 1" @click="step++">下一页 ›</button></footer>
      </form>
      <div v-if="error || notice" class="compact-feedback" role="alert"><span>{{ error || notice }}</span><button type="button" aria-label="关闭提示" @click="error = ''; emit('dismissNotice')">×</button></div>
      <div v-if="confirmReset" class="compact-reset" role="alertdialog" aria-label="恢复默认设置"><p>清空当前设置，并在本机保留存档备份。</p><div><button @click="confirmReset = false">取消</button><button @click="emit('reset')">确认重置</button></div></div>
    </section>
  </div>
</template>
