import { PET_STAGE_COUNT, activeShift, dateKey, dayGap, parseDate, clockMinutes, type LiteSettings } from './model';

export const HOLIDAY_SOURCE = 'https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html';
export interface Holiday { name: string; start: string; end: string }
// 国办发明电〔2025〕7号，2025-11-04 发布。按年份维护，禁止推测尚未公布的安排。
export const calendars: Record<number, { source: string; holidays: Holiday[]; makeup: string[] }> = {
  2026: { source: HOLIDAY_SOURCE, holidays: [
    { name: '元旦', start: '2026-01-01', end: '2026-01-03' },
    { name: '春节', start: '2026-02-15', end: '2026-02-23' },
    { name: '清明节', start: '2026-04-04', end: '2026-04-06' },
    { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
    { name: '端午节', start: '2026-06-19', end: '2026-06-21' },
    { name: '中秋节', start: '2026-09-25', end: '2026-09-27' },
    { name: '国庆节', start: '2026-10-01', end: '2026-10-07' }
  ], makeup: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'] }
};
export function isWorkday(date: Date, s: LiteSettings): boolean {
  const key = dateKey(date);
  if (typeof s.overrides[key] === 'boolean') return s.overrides[key];
  // Only the explicit start day is known if no end date was provided.
  if (s.springStart && key >= s.springStart && key <= (s.springEnd || s.springStart)) return false;
  const calendar = calendars[date.getFullYear()];
  if (calendar?.makeup.includes(key)) return true;
  if (calendar?.holidays.some(h => key >= h.start && key <= h.end)) return false;
  return s.workweek.includes(date.getDay());
}
export function monthWorkdays(date: Date, s: LiteSettings): number[] {
  const length = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length }, (_, i) => i + 1).filter(day => isWorkday(new Date(date.getFullYear(), date.getMonth(), day), s));
}
export function earnings(now: Date, s: LiteSettings, days = monthWorkdays(now, s)) {
  const working = days.includes(now.getDate());
  const shift = activeShift(now, s);
  const start = new Date(now); start.setHours(0, clockMinutes(shift.startTime), 0, 0);
  const end = new Date(now); end.setHours(0, clockMinutes(shift.endTime), 0, 0);
  const progress = working ? Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()))) : 0;
  const daily = days.length ? s.salary / days.length : 0;
  const today = daily * progress;
  const monthly = Math.min(s.salary, daily * days.filter(d => d < now.getDate()).length + today);
  const status = !working ? 'rest' : now < start ? 'before' : now >= end ? 'after' : 'working';
  return { today, monthly, daily, progress, status, offSeconds: status === 'working' ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 1000)) : 0, workdays: days.length };
}
export function duration(seconds: number): string {
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(v => String(v).padStart(2, '0')).join(':');
}
/**
 * 当天班次进度平均切成十阶：上班前 Lv.1，下班时刻 Lv.10，休息日回到 Lv.1。
 * 只用当天作息，不累计历史，所以每天自然重置。
 */
export function petStage(now: Date, s: LiteSettings): number {
  if (!isWorkday(now, s)) return 1;
  const shift = activeShift(now, s);
  const start = new Date(now); start.setHours(0, clockMinutes(shift.startTime), 0, 0);
  const end = new Date(now); end.setHours(0, clockMinutes(shift.endTime), 0, 0);
  const progress = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  return Math.max(1, Math.min(PET_STAGE_COUNT, Math.floor(progress * PET_STAGE_COUNT) + 1));
}
export function nextHoliday(now: Date) {
  const key = dateKey(now);
  // Stop at unknown years instead of skipping them and showing an unrelated later holiday.
  for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
    const calendar = calendars[year];
    if (!calendar) return null;
    const h = calendar.holidays.find(h => h.end >= key);
    if (h) {
      const start = parseDate(h.start), end = parseDate(h.end);
      if (!start || !end) return null;
      return { ...h, days: dayGap(now, start), length: dayGap(start, end) + 1, remaining: dayGap(now, end) + 1 };
    }
  }
  return null;
}
export function springCountdown(now: Date, s: LiteSettings) {
  const start = parseDate(s.springStart);
  if (!start) return { state: 'unset', days: 0 };
  const days = dayGap(now, start);
  if (days > 0) return { state: 'upcoming', days };
  if (!s.springEnd) return { state: 'started', days: 0 };
  const end = parseDate(s.springEnd);
  if (!end) return { state: 'started', days: 0 };
  const remaining = dayGap(now, end) + 1;
  return { state: remaining > 0 ? 'active' : 'ended', days: Math.max(0, remaining) };
}
export function bonusCountdown(now: Date, s: LiteSettings) {
  const date = parseDate(s.bonusDate);
  if (!date) return { state: 'unset', days: 0 };
  const days = dayGap(now, date);
  return { state: s.bonusReceived ? 'received' : days > 0 ? 'upcoming' : days === 0 ? 'today' : 'past', days: Math.max(0, days) };
}
export function paydayCountdown(now: Date, payday: number | null) {
  if (!payday) return null;
  const targetIn = (month: number) => new Date(now.getFullYear(), month, Math.min(payday, new Date(now.getFullYear(), month + 1, 0).getDate()));
  let target = targetIn(now.getMonth());
  if (dayGap(now, target) < 0) target = targetIn(now.getMonth() + 1);
  return { days: dayGap(now, target), date: dateKey(target) };
}
