import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { activeShift, dateKey, type LiteSettings, sanitizeSettings } from './model';
import { bonusCountdown, calendars, duration, earnings, monthWorkdays, nextHoliday, paydayCountdown, springCountdown } from './calendar';
import { backupContents, loadSettings, resetSettings } from './storage';

export function useLite() {
  const desktop = window.wageclawLite;
  const loaded = desktop && window.wageclawInitial ? { ...window.wageclawInitial, key: '', notice: '' } : loadSettings(localStorage);
  const settings = ref(loaded.settings);
  const notice = ref(loaded.notice);
  const recovery = ref(loaded.recovery);
  const now = ref(new Date());
  const day = ref(dateKey(now.value));

  const settingsOpen = ref(!settings.value.configured || recovery.value);
  let timer: ReturnType<typeof setInterval> | undefined;
  const cleanups: Array<() => void> = [];
  const days = computed(() => monthWorkdays(new Date(`${day.value}T12:00:00`), settings.value));
  const income = computed(() => earnings(now.value, settings.value, days.value));
  const shift = computed(() => activeShift(new Date(`${day.value}T12:00:00`), settings.value));
  const holidays = computed(() => nextHoliday(new Date(`${day.value}T12:00:00`)));
  const spring = computed(() => springCountdown(new Date(`${day.value}T12:00:00`), settings.value));
  const bonus = computed(() => bonusCountdown(new Date(`${day.value}T12:00:00`), settings.value));
  const payday = computed(() => paydayCountdown(new Date(`${day.value}T12:00:00`), settings.value.payday));
  const calendarKnown = computed(() => Boolean(calendars[Number(day.value.slice(0, 4))]));
  const offLabel = computed(() => !settings.value.configured ? '等你设置作息' : ({ before: '还没上班', after: '今天收工了', rest: '今天休息', working: duration(income.value.offSeconds) })[income.value.status]);
  const money = (value: number) => settings.value.privacy ? '¥ ••••' : `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  function refresh() { now.value = new Date(); day.value = dateKey(now.value); }
  function visibility() {
    if (timer) clearInterval(timer);
    timer = undefined;
    refresh();
    if (!document.hidden) timer = setInterval(refresh, 1000);
  }
  function accept(snapshot: import('./desktop').DesktopSnapshot) {
    if (JSON.stringify(settings.value) !== JSON.stringify(snapshot.settings)) settings.value = snapshot.settings;
    recovery.value = snapshot.recovery;
  }
  async function save(next: LiteSettings) {
    if (recovery.value) { notice.value = '请先导出备份并恢复默认设置。'; return false; }
    try {
      const valid = sanitizeSettings(next);
      if (desktop) accept(await desktop.saveSettings(JSON.parse(JSON.stringify(valid))));
      else { localStorage.setItem(loaded.key, JSON.stringify(valid)); settings.value = valid; }
      return true;
    } catch { notice.value = '未能保存设置，请检查本机存储空间。'; return false; }
  }
  function patch(values: Partial<LiteSettings>) { return save({ ...settings.value, ...values }); }
  // 「已收到」只在本轮发放周期内有效，因此记录标记当天而不是布尔值。
  function markBonus(received: boolean) { return patch({ bonusReceivedAt: received ? dateKey(new Date()) : '' }); }
  function storage(event: StorageEvent) {
    if (event.key !== loaded.key) return;
    const incoming = loadSettings(localStorage);
    settings.value = incoming.settings;
    recovery.value = incoming.recovery;
    if (incoming.notice) notice.value = incoming.notice;
    refresh();
  }
  async function exportBackup() {
    try {
      if (desktop) {
        const result = await desktop.exportBackup();
        notice.value = result.ok ? '备份已导出。' : result.canceled ? '' : '备份导出未完成，请重试。';
      } else {
        const contents = backupContents(localStorage, loaded.key, settings.value);
        const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = `wageclaw-backup-${day.value}.json`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notice.value = '备份已准备下载。';
      }
    } catch { notice.value = '备份导出失败，原始数据未改变。'; }
  }
  async function reset() {
    try {
      if (desktop) accept(await desktop.resetSettings());
      else settings.value = resetSettings(localStorage, loaded.key);
      recovery.value = false; settingsOpen.value = true;
      notice.value = '已恢复默认设置。此前数据已在本机保留备份。';
    } catch { notice.value = '无法保留备份，已取消重置。'; }
  }
  async function importBackup() {
    try { const state = await desktop?.importBackup(); if (state) { accept(state); notice.value = '备份已导入，此前档案已保留。'; } }
    catch (error) { notice.value = error instanceof Error ? error.message : '导入未完成。'; }
  }
  watch(settingsOpen, value => { if (desktop) void desktop.panelBusy(value); });
  onMounted(() => {
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', storage);
    if (desktop) {
      cleanups.push(desktop.onSnapshot(accept));
      void desktop.panelBusy(settingsOpen.value);
      cleanups.push(desktop.onNavigate(screen => { if (screen === 'settings') settingsOpen.value = true; }));
    }
  });
  onUnmounted(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('focus', refresh);
    window.removeEventListener('storage', storage);
    cleanups.forEach(cleanup => cleanup());
  });
  return { settings, settingsOpen, notice, recovery, now, day, desktop, income, shift, holidays, spring, bonus, payday, calendarKnown, offLabel, money, save, patch, markBonus, reset, exportBackup, importBackup };
}
