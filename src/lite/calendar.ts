import { INTERACTIONS_PER_STAGE, MAX_BOND_COUNT, PET_STAGE_COUNT, activeShift, dateKey, dayGap, inMonthDayRange, nextMonthDay, parseDate, parseMonthDay, previousMonthDay, clockMinutes, type LiteSettings } from './model';

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
  // 春节假期按「月-日」每年重复；只填开始日期时，仅把当天记为休息日。
  if (s.springStart && inMonthDayRange(key.slice(5), s.springStart, s.springEnd || s.springStart)) return false;
  const calendar = calendars[date.getFullYear()];
  if (calendar?.makeup.includes(key)) return true;
  if (calendar?.holidays.some(h => key >= h.start && key <= h.end)) return false;
  return s.workweek.includes(date.getDay());
}
/**
 * 从 from 的次日数到 to（含）的工作日。同一天是 0。
 * 周末、法定节假日、个人春节假期不算；调休上班日和排班里的工作日算。
 */
export function workdayGap(from: Date, to: Date, s: LiteSettings): number {
  const gap = dayGap(from, to);
  if (gap === 0) return 0;
  if (gap < 0) return -workdayGap(to, from, s);
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  cursor.setDate(cursor.getDate() + 1);
  let count = 0;
  while (dayGap(cursor, end) >= 0) {
    if (isWorkday(cursor, s)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
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
/** 当天班次的上班时刻。休息日没有班次，返回 null。 */
function shiftStart(now: Date, s: LiteSettings): Date | null {
  if (!isWorkday(now, s)) return null;
  const start = new Date(now);
  start.setHours(0, clockMinutes(activeShift(now, s).startTime), 0, 0);
  return start;
}
/** 今天、并且已经上班之后，才算数的互动次数。 */
function bondCount(now: Date, s: LiteSettings): number {
  const start = shiftStart(now, s);
  if (!start || now < start || s.pet.bondDate !== dateKey(now)) return 0;
  return s.pet.bondCount;
}
/** 从上班时刻起，每满一小时进一档；下班后不再继续加。 */
function hourSteps(now: Date, s: LiteSettings): number {
  const start = shiftStart(now, s);
  if (!start || now < start) return 0;
  const end = new Date(now);
  end.setHours(0, clockMinutes(activeShift(now, s).endTime), 0, 0);
  const until = Math.min(now.getTime(), end.getTime());
  return Math.max(0, Math.floor((until - start.getTime()) / 3600000));
}
/**
 * 每种桌宠 10 种模样。每天一上班是第 1 种。
 * 两种条件都会再进一档：累计 20 次互动，或上班后又满一小时。两者相加，最高第 10 种。
 * 休息日和上班前固定第 1 种。下班后小时不再增加，停在当时的模样，第二天重新开始。
 */
export function petStage(now: Date, s: LiteSettings): number {
  const steps = hourSteps(now, s) + Math.floor(bondCount(now, s) / INTERACTIONS_PER_STAGE);
  return Math.max(1, Math.min(PET_STAGE_COUNT, 1 + steps));
}
/**
 * 主进程若还是旧版本，快照里没有 bondCount，不能把界面上已经加上的次数清掉。
 * 新快照自己带了次数时，以它为准（包括恢复默认后的 0）。
 */
export function mergePetBond(local: LiteSettings, incoming: LiteSettings): LiteSettings {
  const pet = incoming.pet;
  if (!pet || typeof pet.bondCount === 'number') return incoming;
  const count = local.pet?.bondDate === dateKey(new Date()) ? local.pet.bondCount : 0;
  if (!count) return incoming;
  return { ...incoming, pet: { ...pet, bondDate: dateKey(new Date()), bondCount: count } };
}
/** 记一次陪伴。上班前、休息日、以及已经到第 10 种时，原样返回。 */
export function recordPetInteraction(now: Date, s: LiteSettings): LiteSettings {
  const start = shiftStart(now, s);
  if (!start || now < start) return s;
  const key = dateKey(now);
  const count = s.pet.bondDate === key ? s.pet.bondCount : 0;
  const next = Math.min(MAX_BOND_COUNT, count + 1);
  if (s.pet.bondDate === key && s.pet.bondCount === next) return s;
  return { ...s, pet: { ...s.pet, bondDate: key, bondCount: next } };
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
/**
 * 春节假期倒计时。日期存成「月-日」，每年重复，假期结束后自动滚到下一次，
 * 不会像早期版本那样停在「已结束」。
 */
export function springCountdown(now: Date, s: LiteSettings) {
  const start = parseMonthDay(s.springStart);
  const startDate = start ? nextMonthDay(now, start) : null;
  if (!start || !startDate) return { state: 'unset', days: 0 };
  const end = parseMonthDay(s.springEnd);
  const month = dateKey(now).slice(5);
  // 假期进行中：今天落在起止区间内（含端点）。
  if (end && inMonthDayRange(month, start, end)) {
    const endDate = nextMonthDay(now, end);
    return { state: 'active', days: Math.max(0, endDate ? dayGap(now, endDate) + 1 : 1) };
  }
  // 只填开始日期时，当天算「假期开始」，第二天起滚到下一年的倒数。
  if (!end && month === start) return { state: 'started', days: 0 };
  return { state: 'upcoming', days: dayGap(now, startDate) };
}
/** 发放日之后仍保留「已到/已收到」提示的天数，超过后进入下一年的倒数。 */
export const BONUS_GRACE_DAYS = 30;
/**
 * 年终奖倒计时。发放日同样每年重复；「已收到」标记只在本轮发放周期内有效，
 * 因此不需要用户每年手动清除，也不会在下一年发放日当天误报「已收到」。
 */
export function bonusCountdown(now: Date, s: LiteSettings) {
  const date = parseMonthDay(s.bonusDate);
  const cycle = date ? previousMonthDay(now, date) : null;
  const next = date ? nextMonthDay(now, date) : null;
  if (!cycle || !next) return { state: 'unset', days: 0 };
  const since = dayGap(cycle, now);
  const marked = parseDate(s.bonusReceivedAt);
  if (marked && since <= BONUS_GRACE_DAYS && dayGap(cycle, marked) >= 0 && dayGap(marked, now) >= 0) return { state: 'received', days: 0 };
  if (since === 0) return { state: 'today', days: 0 };
  if (since <= BONUS_GRACE_DAYS) return { state: 'past', days: 0 };
  return { state: 'upcoming', days: dayGap(now, next) };
}
export function paydayCountdown(now: Date, payday: number | null) {
  if (!payday) return null;
  const targetIn = (month: number) => new Date(now.getFullYear(), month, Math.min(payday, new Date(now.getFullYear(), month + 1, 0).getDate()));
  let target = targetIn(now.getMonth());
  if (dayGap(now, target) < 0) target = targetIn(now.getMonth() + 1);
  return { days: dayGap(now, target), date: dateKey(target) };
}
