export type PetStyle = 'rageBlob' | 'capybaraZen' | 'lazyCat' | 'lazyDog' | 'honestCow';
export const PET_STYLES: PetStyle[] = ['capybaraZen', 'rageBlob', 'lazyCat', 'lazyDog', 'honestCow'];
export const PET_STYLE_LABELS: Record<PetStyle, string> = {
  capybaraZen: '卡皮巴拉',
  rageBlob: '怨气团',
  lazyCat: '懒猫',
  lazyDog: '懒狗',
  honestCow: '老实牛'
};
/** 每个形象的形态总数。 */
export const PET_STAGE_COUNT = 10;
/** 同一模样要累计这么多次互动，才换成下一种。 */
export const INTERACTIONS_PER_STAGE = 20;
/** 第 10 种之后不再累加。 */
export const MAX_BOND_COUNT = (PET_STAGE_COUNT - 1) * INTERACTIONS_PER_STAGE;

export interface LiteSettings {
  version: 2;
  configured: boolean;
  salary: number;
  startTime: string;
  endTime: string;
  /** 夏季作息生效区间，格式 MM-DD；两项都填才启用，含起止当天。 */
  summerFrom: string;
  summerTo: string;
  summerStartTime: string;
  summerEndTime: string;
  workweek: number[];
  overrides: Record<string, boolean>;
  payday: number | null;
  /** 春节假期起止，格式 MM-DD，每年重复；只填开始日期时仅当天休息。 */
  springStart: string;
  springEnd: string;
  /** 年终奖预计发放日，格式 MM-DD，每年重复。 */
  bonusDate: string;
  bonusAmount: number | null;
  /** 标记「本轮已收到」的日期（YYYY-MM-DD，空字符串表示未标记）。按发放周期自然失效。 */
  bonusReceivedAt: string;
  privacy: boolean;
  theme: 'light' | 'dark';
  pet: {
    visible: boolean; onTop: boolean; size: 100 | 128 | 156; style: PetStyle;
    motion: 'authored' | 'classic'; form: number | null; x: number | null; y: number | null;
    /** 今天已经记下的互动次数；日期不是今天时，形象计算会把它当作 0。 */
    bondDate: string; bondCount: number;
  };
  broadcast: { enabled: boolean; pauseUntil: number; quietDate: string; news: boolean };
  autoStart: boolean;
}

export function defaults(): LiteSettings {
  return { version: 2, configured: false, salary: 0, startTime: '08:30', endTime: '18:00',
    summerFrom: '05-01', summerTo: '10-01', summerStartTime: '08:30', summerEndTime: '18:00',
    workweek: [1, 2, 3, 4, 5], overrides: {}, payday: 15, springStart: '02-04', springEnd: '',
    bonusDate: '02-03', bonusAmount: null, bonusReceivedAt: '', privacy: false,
    theme: 'light', pet: { visible: true, onTop: true, size: 128, style: 'capybaraZen', motion: 'authored', form: null, x: null, y: null, bondDate: '', bondCount: 0 },
    broadcast: { enabled: true, pauseUntil: 0, quietDate: '', news: true }, autoStart: false };
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200) return null;
  const result = new Date(year, month - 1, day);
  return dateKey(result) === value ? result : null;
}
export function dayGap(from: Date, to: Date): number {
  const ordinal = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  return ordinal(to) - ordinal(from);
}
/** 每年重复的月日区间端点，格式 MM-DD。2 月 29 日按闰年判定为合法。 */
export function parseMonthDay(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{2}-\d{2}$/.test(value)) return '';
  const [month, day] = value.split('-').map(Number);
  const probe = new Date(2024, month - 1, day);
  return probe.getMonth() === month - 1 && probe.getDate() === day ? value : '';
}
/**
 * 兼容旧档：早期版本把春节与年终奖存成带年份的完整日期，
 * 这里统一收敛成每年重复的「月-日」，取不到有效值就返回空。
 */
export function migrateMonthDay(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return parseMonthDay(/^\d{4}-\d{2}-\d{2}$/.test(text) ? text.slice(5) : text);
}
/** 某个「月-日」在指定年份的日期；平年的 2 月 29 日顺延到 2 月 28 日。 */
function monthDayIn(year: number, monthDay: string): Date {
  const [month, day] = monthDay.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, lastDay));
}
/** 今天或之后最近一次出现的「月-日」。 */
export function nextMonthDay(now: Date, value: string): Date | null {
  const monthDay = parseMonthDay(value);
  if (!monthDay) return null;
  const thisYear = monthDayIn(now.getFullYear(), monthDay);
  return dayGap(now, thisYear) >= 0 ? thisYear : monthDayIn(now.getFullYear() + 1, monthDay);
}
/** 今天或之前最近一次出现过的「月-日」，用于判断当前所处的年度周期。 */
export function previousMonthDay(now: Date, value: string): Date | null {
  const monthDay = parseMonthDay(value);
  if (!monthDay) return null;
  const thisYear = monthDayIn(now.getFullYear(), monthDay);
  return dayGap(now, thisYear) <= 0 ? thisYear : monthDayIn(now.getFullYear() - 1, monthDay);
}
/** 月-日 key 是否落在 [from, to] 区间内（含端点，支持跨年区间）。 */
export function inMonthDayRange(key: string, from: string, to: string): boolean {
  return from <= to ? key >= from && key <= to : key >= from || key <= to;
}
export function clockMinutes(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}
export interface Shift { startTime: string; endTime: string; summer: boolean }
/** 当天实际生效的上下班时间：落在夏季区间内用夏季作息，否则用常规作息。 */
export function activeShift(date: Date, s: LiteSettings): Shift {
  const from = parseMonthDay(s.summerFrom), to = parseMonthDay(s.summerTo);
  const regular: Shift = { startTime: s.startTime, endTime: s.endTime, summer: false };
  if (!from || !to) return regular;
  const key = dateKey(date).slice(5);
  if (!inMonthDayRange(key, from, to)) return regular;
  return { startTime: s.summerStartTime, endTime: s.summerEndTime, summer: true };
}
export function validateSettings(s: LiteSettings): string {
  if (!Number.isFinite(s.salary) || s.salary <= 0 || s.salary > 100000000) return '请填写大于 0 的有效月薪。';
  if (!(clockMinutes(s.endTime) > clockMinutes(s.startTime))) return '下班时间需晚于上班时间；首版暂不支持跨夜班次。';
  const summerFrom = parseMonthDay(s.summerFrom), summerTo = parseMonthDay(s.summerTo);
  if ((s.summerFrom || s.summerTo) && (!summerFrom || !summerTo)) return '夏季作息请同时填写起止日期，格式为 月-日（如 05-01）。';
  if (summerFrom && summerTo && !(clockMinutes(s.summerEndTime) > clockMinutes(s.summerStartTime))) return '夏季下班时间需晚于夏季上班时间。';
  if (!s.workweek.length) return '请至少选择一个每周工作日。';
  if (s.payday !== null && (!Number.isInteger(s.payday) || s.payday < 1 || s.payday > 31)) return '发薪日请填写 1～31，或留空。';
  for (const value of [s.springStart, s.springEnd, s.bonusDate]) {
    if (value && !parseMonthDay(value)) return '请填写有效日期，格式为 月-日（如 02-04）。';
  }
  if (s.springEnd && (!s.springStart || s.springEnd < s.springStart)) return '春节假期结束日期不能早于开始日期。';
  if (s.bonusAmount !== null && (!Number.isFinite(s.bonusAmount) || s.bonusAmount < 0 || s.bonusAmount > 100000000)) return '请填写有效的预计奖金金额，或留空。';
  return '';
}

export function sanitizeSettings(raw: unknown): LiteSettings {
  const s = defaults();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
  const r = raw as Record<string, unknown>;
  if (typeof r.salary === 'number' && Number.isFinite(r.salary) && r.salary >= 0 && r.salary <= 100000000) s.salary = r.salary;
  if (typeof r.startTime === 'string' && Number.isFinite(clockMinutes(r.startTime))) s.startTime = r.startTime;
  if (typeof r.endTime === 'string' && clockMinutes(r.endTime) > clockMinutes(s.startTime)) s.endTime = r.endTime;
  if (!(clockMinutes(s.endTime) > clockMinutes(s.startTime))) { s.startTime = '08:30'; s.endTime = '18:00'; }
  s.summerFrom = parseMonthDay(r.summerFrom);
  s.summerTo = parseMonthDay(r.summerTo);
  // 区间端点必须成对出现，缺一即视为未启用夏季作息。
  if (!s.summerFrom || !s.summerTo) { s.summerFrom = ''; s.summerTo = ''; }
  if (typeof r.summerStartTime === 'string' && Number.isFinite(clockMinutes(r.summerStartTime))) s.summerStartTime = r.summerStartTime;
  if (typeof r.summerEndTime === 'string' && clockMinutes(r.summerEndTime) > clockMinutes(s.summerStartTime)) s.summerEndTime = r.summerEndTime;
  if (!(clockMinutes(s.summerEndTime) > clockMinutes(s.summerStartTime))) { s.summerStartTime = '08:30'; s.summerEndTime = '18:00'; }
  if (Array.isArray(r.workweek)) {
    const days = [...new Set(r.workweek.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))];
    if (days.length) s.workweek = days;
  }
  if (r.overrides && typeof r.overrides === 'object' && !Array.isArray(r.overrides)) {
    for (const [key, value] of Object.entries(r.overrides)) if (parseDate(key) && typeof value === 'boolean') s.overrides[key] = value;
  }
  if (typeof r.payday === 'number' && Number.isInteger(r.payday) && r.payday >= 1 && r.payday <= 31) s.payday = r.payday;
  else if (r.payday === null) s.payday = null;
  // 春节与年终奖按「月-日」每年重复；旧档的完整日期在这里收敛成月-日。
  for (const key of ['springStart', 'springEnd', 'bonusDate'] as const) s[key] = migrateMonthDay(r[key]);
  if (!s.springStart || s.springEnd < s.springStart) s.springEnd = '';
  if (typeof r.bonusAmount === 'number' && Number.isFinite(r.bonusAmount) && r.bonusAmount >= 0 && r.bonusAmount <= 100000000) s.bonusAmount = r.bonusAmount;
  // 旧档只有布尔标记，无法判断属于哪一轮发放周期，直接作废，由用户重新标记。
  s.bonusReceivedAt = parseDate(r.bonusReceivedAt) ? r.bonusReceivedAt as string : '';
  for (const key of ['privacy', 'autoStart'] as const) s[key] = r[key] === true;
  const pet = r.pet && typeof r.pet === 'object' ? r.pet as Record<string, unknown> : {};
  s.pet.visible = pet.visible !== false;
  s.pet.onTop = typeof pet.onTop === 'boolean' ? pet.onTop : typeof r.miniOnTop === 'boolean' ? r.miniOnTop : true;
  if ([100, 128, 156].includes(Number(pet.size))) s.pet.size = Number(pet.size) as 100 | 128 | 156;
  if (typeof pet.form === 'number' && Number.isInteger(pet.form) && pet.form >= 1 && pet.form <= PET_STAGE_COUNT) s.pet.form = pet.form;
  s.pet.bondDate = parseDate(pet.bondDate) ? pet.bondDate as string : '';
  s.pet.bondCount = s.pet.bondDate && Number.isInteger(pet.bondCount) && (pet.bondCount as number) >= 0 && (pet.bondCount as number) <= MAX_BOND_COUNT ? pet.bondCount as number : 0;
  // Keep an explicitly chosen legacy form; automatic companions adopt authored motion.
  s.pet.motion = pet.motion === 'classic' || (pet.motion !== 'authored' && s.pet.form !== null) ? 'classic' : 'authored';
  // 旧版把形象偏好存在顶层 petStyle，这里一并沿用。
  const style = typeof pet.style === 'string' ? pet.style : r.petStyle;
  if (typeof style === 'string' && (PET_STYLES as string[]).includes(style)) s.pet.style = style as PetStyle;
  for (const key of ['x', 'y'] as const) if (typeof pet[key] === 'number' && Number.isFinite(pet[key]) && Math.abs(pet[key]) < 100000) s.pet[key] = Math.round(pet[key]);
  const broadcast = r.broadcast && typeof r.broadcast === 'object' ? r.broadcast as Record<string, unknown> : {};
  s.broadcast.enabled = broadcast.enabled !== false;
  if (typeof broadcast.pauseUntil === 'number' && Number.isFinite(broadcast.pauseUntil)) s.broadcast.pauseUntil = Math.max(0, broadcast.pauseUntil);
  if (parseDate(broadcast.quietDate)) s.broadcast.quietDate = broadcast.quietDate as string;
  s.broadcast.news = broadcast.news !== false;
  s.theme = r.theme === 'dark' ? 'dark' : 'light';
  s.configured = r.configured === true && !validateSettings(s);
  return s;
}
