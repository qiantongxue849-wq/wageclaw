<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { dateKey, parseDate, validateSettings, PET_STYLES, PET_STYLE_LABELS, type LiteSettings } from './model';
import { HOLIDAY_SOURCE } from './calendar';
import type { LiteDesktop } from './desktop';
import type { UpdateState } from '../auth-types';
const props = defineProps<{ settings: LiteSettings; recovery: boolean; notice: string; desktop?: LiteDesktop }>();
const emit = defineEmits<{ close: []; save: [settings: LiteSettings]; export: []; reset: []; import: [] }>();
const draft = ref<LiteSettings>(JSON.parse(JSON.stringify(props.settings)));
const error = ref('');
const overrideDate = ref('');
const overrideWork = ref('rest');
const confirmReset = ref(false);
const dialog = ref<HTMLElement>();
const update = ref<UpdateState>();
const updateBusy = ref(false);
let cleanUpdate: (() => void) | undefined;
const previousFocus = document.activeElement as HTMLElement | null;
const week = [{ day: 1, name: '一' }, { day: 2, name: '二' }, { day: 3, name: '三' }, { day: 4, name: '四' }, { day: 5, name: '五' }, { day: 6, name: '六' }, { day: 0, name: '日' }];
watch(() => props.settings, value => { draft.value = JSON.parse(JSON.stringify(value)); confirmReset.value = false; }, { deep: true });
function submit() {
  const value = { ...draft.value, configured: true };
  value.payday = String(value.payday ?? '') === '' ? null : Number(value.payday);
  value.bonusAmount = String(value.bonusAmount ?? '') === '' ? null : Number(value.bonusAmount);
  value.salary = Number(value.salary);
  if (value.bonusDate !== props.settings.bonusDate) value.bonusReceivedAt = '';
  error.value = validateSettings(value);
  if (!error.value) emit('save', value);
}
function addOverride() {
  if (!parseDate(overrideDate.value)) { error.value = '请先选择有效日期。'; return; }
  draft.value.overrides[overrideDate.value] = overrideWork.value === 'work'; overrideDate.value = ''; error.value = '';
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.settings.configured && !props.recovery) emit('close');
  if (event.key !== 'Tab') return;
  const nodes = [...(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]') || [])].filter(el => el.offsetParent !== null);
  const first = nodes[0], last = nodes.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
async function updateAction(install = false) {
  if (!props.desktop) return;
  updateBusy.value = true;
  try { update.value = await (install ? props.desktop.installUpdate() : props.desktop.checkForUpdates()); }
  catch { error.value = '更新暂不可用，离线功能可继续使用。'; }
  finally { updateBusy.value = false; }
}
onMounted(async () => {
  await nextTick(); dialog.value?.focus();
  if (props.desktop) {
    cleanUpdate = props.desktop.onUpdate(state => { update.value = state; });
    try { update.value = await props.desktop.getUpdateState(); } catch { /* Updates are optional. */ }
  }
});
onUnmounted(() => { cleanUpdate?.(); previousFocus?.focus(); });
</script>
<template>
  <div class="modal-backdrop" @click.self="settings.configured && !recovery && emit('close')">
    <section ref="dialog" class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1" @keydown="keydown">
      <header class="settings-head">
        <div>
          <p class="eyebrow">{{ settings.configured ? '自己的节奏，自己设定' : '只需要一分钟' }}</p>
          <h2 id="settings-title">{{ settings.configured ? '设置' : '从你的工资和作息开始' }}</h2>
        </div>
        <button v-if="!recovery" class="icon-button" aria-label="关闭设置" @click="emit('close')">×</button>
      </header>
      <form @submit.prevent="submit">
        <div class="settings-body">
          <p v-if="notice" class="notice" role="status">{{ notice }}</p>
          <p v-if="recovery" class="form-error">存档无法读取。原始数据仍保留，请先导出备份，再恢复默认设置。</p>
          <fieldset :disabled="recovery">
            <legend>工资与作息</legend>
            <p class="field-help">只在这台设备保存。修改后，会重新估算当月收入。</p>
            <label>
              用于估算的月薪（元）
              <input v-model.number="draft.salary" aria-label="月薪" type="number" min="0.01" max="100000000" step="0.01" required placeholder="建议填写税后月薪" />
            </label>
            <div class="form-grid">
              <label>
                上班时间
                <input v-model="draft.startTime" type="time" required />
              </label>
              <label>
                下班时间
                <input v-model="draft.endTime" type="time" required />
              </label>
            </div>
            <p class="field-help">午休照常计入工时（不扣除、不暂停）；暂不支持跨夜班次。下面两段留空，则全年都按这组时间。</p>
            <span class="field-label">夏季作息（选填）</span>
            <div class="form-grid">
              <label>
                生效开始（月-日）
                <input v-model="draft.summerFrom" maxlength="5" placeholder="05-01" aria-label="夏季作息生效开始" />
              </label>
              <label>
                生效结束（月-日）
                <input v-model="draft.summerTo" maxlength="5" placeholder="10-01" aria-label="夏季作息生效结束" />
              </label>
            </div>
            <div class="form-grid">
              <label>
                夏季上班时间
                <input v-model="draft.summerStartTime" type="time" />
              </label>
              <label>
                夏季下班时间
                <input v-model="draft.summerEndTime" type="time" />
              </label>
            </div>
            <p class="field-help">这两段日期之间改用夏季作息，含起止当天；每年自动重复。</p>
            <span class="field-label">每周工作日</span>
            <div class="week-picker">
              <label v-for="item in week" :key="item.day" :class="{ selected: draft.workweek.includes(item.day) }">
                <input v-model="draft.workweek" type="checkbox" :value="item.day" />
                <span>{{ item.name }}</span>
              </label>
            </div>
            <label>
              每月发薪日（选填）
              <input v-model.number="draft.payday" type="number" min="1" max="31" step="1" placeholder="1～31；不足该日期时按月末" />
            </label>
          </fieldset>
          <fieldset :disabled="recovery">
            <legend>给未来留一点盼头</legend>
            <div class="form-grid">
              <label>
                春节放假开始（月-日）
                <input v-model="draft.springStart" maxlength="5" placeholder="02-04" aria-label="春节放假开始" />
              </label>
              <label>
                春节放假结束（月-日，选填）
                <input v-model="draft.springEnd" maxlength="5" placeholder="02-10" aria-label="春节放假结束" />
              </label>
            </div>
            <p class="field-help">按你公司的实际安排填写，每年自动重复。只填开始日期时，仅将当天记为休息日。</p>
            <div class="form-grid">
              <label>
                年终奖预计发放日期（月-日）
                <input v-model="draft.bonusDate" maxlength="5" placeholder="02-03" aria-label="年终奖预计发放日期" />
              </label>
              <label>
                预计金额（元，选填）
                <input v-model.number="draft.bonusAmount" type="number" min="0" max="100000000" step="0.01" />
              </label>
            </div>
            <label v-if="draft.bonusDate" class="switch-row">
              <span>年终奖已收到（本轮）</span>
              <input :checked="Boolean(draft.bonusReceivedAt)" type="checkbox" @change="draft.bonusReceivedAt = ($event.target as HTMLInputElement).checked ? dateKey(new Date()) : ''" />
            </label>
            <p class="field-help">预计奖金不计入已赚收入，以实际发放为准；「已收到」标记只在本轮发放周期内有效。</p>
          </fieldset>
          <fieldset :disabled="recovery">
            <legend>临时上班与休息</legend>
            <p class="field-help">
              优先于公共调休和个人假期。已内置
              <a :href="HOLIDAY_SOURCE" target="_blank" rel="noopener noreferrer">2026 年官方假期安排 ↗</a>
              。
            </p>
            <div class="override-form">
              <input v-model="overrideDate" aria-label="临时安排日期" type="date" min="1900-01-01" max="2200-12-31" />
              <select v-model="overrideWork" aria-label="临时安排类型">
                <option value="rest">休息</option>
                <option value="work">上班</option>
              </select>
              <button class="secondary-button" type="button" @click="addOverride">添加</button>
            </div>
            <ul v-if="Object.keys(draft.overrides).length" class="override-list">
              <li v-for="(working, date) in draft.overrides" :key="date">
                <span>{{ date }} · {{ working ? '上班' : '休息' }}</span>
                <button type="button" :aria-label="`移除 ${date} 的安排`" @click="delete draft.overrides[date]">移除</button>
              </li>
            </ul>
          </fieldset>
          <fieldset :disabled="recovery">
            <legend>外观与桌面</legend>
            <label class="switch-row">
              <span>隐藏金额</span>
              <input v-model="draft.privacy" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>深色外观</span>
              <input :checked="draft.theme === 'dark'" type="checkbox" @change="draft.theme = ($event.target as HTMLInputElement).checked ? 'dark' : 'light'" />
            </label>
            <label class="switch-row"><span>显示桌宠</span><input v-model="draft.pet.visible" type="checkbox" /></label>
            <label class="switch-row"><span>桌宠置顶</span><input v-model="draft.pet.onTop" type="checkbox" /></label>
            <label>桌宠大小<select v-model.number="draft.pet.size"><option :value="100">小</option><option :value="128">中</option><option :value="156">大</option></select></label>
            <label>桌宠形象<select v-model="draft.pet.style" aria-label="桌宠形象"><option v-for="item in PET_STYLES" :key="item" :value="item">{{ PET_STYLE_LABELS[item] }}</option></select></label>
            <p class="field-help">五组形象，每组十种模样。每天一上班从第一种开始。互动 20 次，或上班后每满一小时，都会换成下一种。也可以在详情页里固定一种。</p>
            <label class="switch-row"><span>自动气泡播报</span><input v-model="draft.broadcast.enabled" type="checkbox" /></label>
            <p class="field-help">工作时约 25～45 分钟说一句，每天最多 12 条日常播报，另有临近下班和收工提醒。默认静音，休息日不打扰。</p>
            <div class="data-actions"><button class="secondary-button" type="button" @click="draft.broadcast.pauseUntil = Date.now() + 3600000">暂停一小时</button><button class="secondary-button" type="button" @click="draft.broadcast.quietDate = dateKey(new Date())">今天安静</button><button class="text-action" type="button" @click="draft.broadcast.pauseUntil = 0; draft.broadcast.quietDate = ''">恢复播报</button></div>
            <p class="field-help">{{ draft.broadcast.quietDate === dateKey(new Date()) ? '今天安静（保存后生效）' : draft.broadcast.pauseUntil > Date.now() ? '已选择暂停一小时（保存后生效）' : '按设置自动播报' }}</p>
            <label v-if="desktop" class="switch-row"><span>开机自启（安装版生效）</span><input v-model="draft.autoStart" type="checkbox" /></label>
            <p class="field-help">卡皮巴拉 · 点一下看一句，双击看全部，拖动换位置。无需喂养。</p>
            <a v-if="!desktop" href="?view=pet-preview" target="_blank" class="text-action">预览桌宠与气泡 ↗</a>
          </fieldset>
          <section class="data-settings">
            <h3>本地数据</h3>
            <p class="field-help">旧版存档原样保留，虚拟钱包不计入收入。备份仅包含当前本地档案及对应旧存档。</p>
            <div class="data-actions">
              <button type="button" class="secondary-button" @click="emit('export')">导出备份</button>
              <button v-if="desktop" type="button" class="secondary-button" @click="emit('import')">导入备份</button>
              <button type="button" class="text-action" @click="confirmReset = true">恢复默认设置</button>
            </div>
            <div v-if="confirmReset" class="reset-confirm">
              <p>将清空当前工资、日期与外观设置。重置前会在本机保留原始存档备份。</p>
              <button type="button" class="secondary-button" @click="confirmReset = false">取消</button>
              <button type="button" class="danger-button" @click="emit('reset')">确认重置并保留备份</button>
            </div>
          </section>
          <section v-if="desktop" class="update-settings">
            <h3>版本更新</h3>
            <p class="field-help">{{ update?.message || '可手动检查更新，不影响离线使用。' }}</p>
            <button v-if="update?.status === 'available'" type="button" class="secondary-button" :disabled="updateBusy" @click="updateAction(true)">下载并重启安装</button>
            <button v-else type="button" class="secondary-button" :disabled="updateBusy || update?.status === 'downloading'" @click="updateAction()">检查更新</button>
          </section>
        </div>
        <footer class="settings-footer">
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <div>
            <span>让应用适应你的生活。</span>
            <button type="submit" class="primary-button" :disabled="recovery">{{ settings.configured ? '保存设置' : '开始我的倒计时' }}</button>
          </div>
        </footer>
      </form>
    </section>
  </div>
</template>
