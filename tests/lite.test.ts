import { describe, expect, it } from 'vitest';
import { INTERACTIONS_PER_STAGE, MAX_BOND_COUNT, PET_STAGE_COUNT, PET_STYLES, activeShift, dateKey, defaults, dayGap, parseDate, sanitizeSettings, validateSettings } from '../src/lite/model';
import { bonusCountdown, earnings, isWorkday, mergePetBond, monthWorkdays, nextHoliday, paydayCountdown, petStage, recordPetInteraction, springCountdown } from '../src/lite/calendar';
import { autoReport, candidates, freshDelivery, manualReport, nextWake, normalizeDelivery, randomDue, recordDelivery } from '../src/lite/broadcast';
import { backupContents, LITE_KEY, loadSettings, OLD_KEY, resetSettings } from '../src/lite/storage';
// 固定为 09:00—18:00 且关闭夏季作息，与出厂默认解耦。
const settings = () => ({ ...defaults(), configured: true, salary: 22000, startTime: '09:00', endTime: '18:00', summerFrom: '', summerTo: '' });
const at = (date: string) => new Date(date);
class MemoryStorage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
}
describe('lightweight income and work calendar', () => {
  it('computes income directly across a whole shift without claiming or ticking', () => {
    const s = settings();
    const daily = s.salary / monthWorkdays(at('2026-09-15T12:00:00'), s).length;
    const before = earnings(at('2026-09-15T08:00:00'), s);
    expect(before.today).toBe(0); expect(before.status).toBe('before');
    expect(earnings(at('2026-09-15T09:00:00'), s).today).toBe(0);
    const half = earnings(at('2026-09-15T13:30:00'), s);
    expect(half.today).toBeCloseTo(daily / 2); expect(half.offSeconds).toBe(16200);
    expect(earnings(at('2026-09-15T18:00:00'), s).today).toBeCloseTo(daily);
    expect(earnings(at('2026-09-15T23:59:59'), s).today).toBeCloseTo(daily);
    expect(earnings(at('2026-09-15T18:00:00'), s).status).toBe('after');
    expect(earnings(at('2026-09-15T13:30:00'), JSON.parse(JSON.stringify(s)))).toEqual(half);
  });
  it('counts the lunch break as working time instead of pausing accrual', () => {
    const s = settings(); // 09:00—18:00 单段连续班次
    const rate = (from: string, to: string) =>
      (earnings(at(to), s).today - earnings(at(from), s).today) / ((at(to).getTime() - at(from).getTime()) / 60000);
    const morning = rate('2026-09-15T10:00:00', '2026-09-15T11:00:00');
    // 午休整段与上下午的每分钟增量完全一致：既不暂停，也不折减。
    expect(rate('2026-09-15T12:00:00', '2026-09-15T13:30:00')).toBeCloseTo(morning, 10);
    expect(rate('2026-09-15T14:00:00', '2026-09-15T15:00:00')).toBeCloseTo(morning, 10);
    // 12:00 与 13:30 落在同一条直线上（09:00—18:00 的 1/3 与 1/2 进度）。
    const daily = s.salary / monthWorkdays(at('2026-09-15T12:00:00'), s).length;
    expect(earnings(at('2026-09-15T12:00:00'), s).today).toBeCloseTo(daily / 3);
    expect(earnings(at('2026-09-15T13:30:00'), s).today).toBeCloseTo(daily / 2);
    // 午休期间状态仍是「工作中」，下班倒计时不中断。
    expect(earnings(at('2026-09-15T12:00:00'), s).status).toBe('working');
    expect(earnings(at('2026-09-15T13:00:00'), s).status).toBe('working');
    expect(earnings(at('2026-09-15T12:00:00'), s).offSeconds).toBe(6 * 3600);
  });
  it('observes holiday, makeup, personal leave and explicit override priority', () => {
    const s = settings();
    expect(isWorkday(at('2026-09-19T12:00:00'), s)).toBe(false);
    expect(isWorkday(at('2026-09-20T12:00:00'), s)).toBe(true);
    expect(isWorkday(at('2026-09-25T12:00:00'), s)).toBe(false);
    s.springStart = '09-20'; s.springEnd = '09-21';
    expect(isWorkday(at('2026-09-20T12:00:00'), s)).toBe(false);
    s.overrides['2026-09-20'] = true;
    expect(isWorkday(at('2026-09-20T12:00:00'), s)).toBe(true);
    expect(earnings(at('2026-09-25T12:00:00'), s).today).toBe(0);
    expect(earnings(at('2026-09-25T12:00:00'), s).status).toBe('rest');
  });
  it('caps monthly income, handles zero workdays and changes configuration deterministically', () => {
    const s = settings();
    expect(earnings(at('2026-09-30T23:00:00'), s).monthly).toBeCloseTo(s.salary);
    expect(earnings(at('2026-10-01T12:00:00'), s).monthly).toBe(0);
    const twice = { ...s, salary: s.salary * 2 };
    expect(earnings(at('2026-09-15T13:30:00'), twice).today).toBeCloseTo(earnings(at('2026-09-15T13:30:00'), s).today * 2);
    for (let d = 1; d <= 30; d++) s.overrides[`2026-09-${String(d).padStart(2, '0')}`] = false;
    const none = earnings(at('2026-09-30T23:00:00'), s);
    expect(none.today).toBe(0); expect(none.monthly).toBe(0); expect(none.workdays).toBe(0);
  });
  it('does not project an end date for personal leave and rolls it to next year', () => {
    const s = { ...settings(), springStart: '09-15' };
    expect(isWorkday(at('2026-09-15T12:00:00'), s)).toBe(false);
    expect(isWorkday(at('2026-09-16T12:00:00'), s)).toBe(true);
    // 只填开始日期时，当天是「假期开始」，第二天起滚到下一年的同一天。
    expect(springCountdown(at('2026-09-15T12:00:00'), s)).toEqual({ state: 'started', days: 0 });
    expect(springCountdown(at('2026-09-16T12:00:00'), s)).toEqual({ state: 'upcoming', days: 364 });
  });
});
describe('date boundaries and anticipated events', () => {
  it('handles local dates, leap days and a daylight saving boundary', () => {
    expect(parseDate('2026-02-29')).toBeNull(); expect(parseDate('2028-02-29')).not.toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(dayGap(new Date(2026, 2, 7, 23, 50), new Date(2026, 2, 9, 0, 5))).toBe(2);
    expect(dayGap(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
  });
  it('counts to official leave start, shows active holiday and never invents next year', () => {
    expect(nextHoliday(at('2026-02-14T12:00:00'))).toMatchObject({ name: '春节', days: 1, length: 9 });
    expect(nextHoliday(at('2026-02-15T23:59:00'))).toMatchObject({ days: 0, remaining: 9 });
    expect(nextHoliday(at('2026-02-23T23:59:00'))).toMatchObject({ remaining: 1 });
    expect(nextHoliday(at('2026-02-24T00:00:00'))?.name).toBe('清明节');
    expect(nextHoliday(at('2026-12-31T12:00:00'))).toBeNull();
    expect(nextHoliday(at('2027-01-01T12:00:00'))).toBeNull();
    expect(isWorkday(at('2027-01-04T12:00:00'), settings())).toBe(true);
  });
  it('keeps payday today for the whole day and clamps month ends', () => {
    expect(paydayCountdown(at('2026-02-28T23:59:59'), 31)).toEqual({ days: 0, date: '2026-02-28' });
    expect(paydayCountdown(at('2028-02-28T12:00:00'), 31)).toEqual({ days: 1, date: '2028-02-29' });
    expect(paydayCountdown(at('2026-12-31T23:59:59'), 15)?.date).toBe('2027-01-15');
    expect(paydayCountdown(at('2026-09-15T12:00:00'), null)).toBeNull();
  });
  it('does not turn an expected bonus into received income', () => {
    const s = { ...settings(), bonusDate: '09-15', bonusAmount: 50000 };
    expect(bonusCountdown(at('2026-09-14T12:00:00'), s)).toEqual({ state: 'upcoming', days: 1 });
    expect(bonusCountdown(at('2026-09-15T23:59:00'), s).state).toBe('today');
    expect(bonusCountdown(at('2026-09-16T12:00:00'), s).state).toBe('past');
    expect(s.bonusReceivedAt).toBe('');
    expect(earnings(at('2026-09-15T12:00:00'), s)).toEqual(earnings(at('2026-09-15T12:00:00'), settings()));
    expect(bonusCountdown(at('2026-09-16T12:00:00'), { ...s, bonusReceivedAt: '2026-09-16' }).state).toBe('received');
  });
  it('tracks personal leave independently of the public holiday', () => {
    const s = { ...settings(), springStart: '02-01', springEnd: '02-10' };
    expect(springCountdown(at('2027-01-31T12:00:00'), s)).toEqual({ state: 'upcoming', days: 1 });
    expect(springCountdown(at('2027-02-01T12:00:00'), s)).toEqual({ state: 'active', days: 10 });
    expect(springCountdown(at('2027-02-11T12:00:00'), s)).toEqual({ state: 'upcoming', days: 355 });
  });
});
describe('yearly recurring leave and bonus dates', () => {
  it('rolls the spring leave to the next year instead of freezing after the holiday', () => {
    const s = { ...settings(), springStart: '02-04', springEnd: '02-10' };
    expect(springCountdown(at('2027-01-30T12:00:00'), s)).toEqual({ state: 'upcoming', days: 5 });
    expect(springCountdown(at('2027-02-04T12:00:00'), s)).toEqual({ state: 'active', days: 7 });
    expect(springCountdown(at('2027-02-10T12:00:00'), s)).toEqual({ state: 'active', days: 1 });
    // 假期结束后直接滚到下一年的同一天，而不是永久停在「已结束」。
    expect(springCountdown(at('2027-02-11T12:00:00'), s)).toEqual({ state: 'upcoming', days: 358 });
    expect(springCountdown(at('2028-02-03T12:00:00'), s)).toEqual({ state: 'upcoming', days: 1 });
  });
  it('keeps the leave a rest day on the same month-day every year', () => {
    const s = { ...settings(), springStart: '02-04', springEnd: '02-10' };
    for (const year of [2027, 2028, 2029]) {
      expect(isWorkday(at(`${year}-02-04T12:00:00`), s)).toBe(false);
      expect(isWorkday(at(`${year}-02-10T12:00:00`), s)).toBe(false);
    }
    // 假期之外的日子照常按每周排班判断（2027-02-11 是周四）。
    expect(isWorkday(at('2027-02-11T12:00:00'), s)).toBe(true);
    // 显式覆盖仍然优先于每年重复的假期。
    s.overrides['2028-02-04'] = true;
    expect(isWorkday(at('2028-02-04T12:00:00'), s)).toBe(true);
  });
  it('repeats the bonus date every year and expires last year mark', () => {
    const s = { ...settings(), bonusDate: '02-03', bonusReceivedAt: '2027-02-03' };
    expect(bonusCountdown(at('2027-02-03T12:00:00'), s)).toEqual({ state: 'received', days: 0 });
    expect(bonusCountdown(at('2027-03-05T12:00:00'), s)).toEqual({ state: 'received', days: 0 });
    // 宽限期一过就进入下一年的倒数，去年的标记不再生效。
    expect(bonusCountdown(at('2027-03-06T12:00:00'), s)).toEqual({ state: 'upcoming', days: 334 });
    expect(bonusCountdown(at('2027-04-01T12:00:00'), s).days).toBe(308);
    // 下一年发放日当天不会沿用去年的「已收到」。
    expect(bonusCountdown(at('2028-02-03T12:00:00'), s)).toEqual({ state: 'today', days: 0 });
  });
  it('keeps the mark-received window open for a month after the payout date', () => {
    const s = { ...settings(), bonusDate: '02-03', bonusReceivedAt: '' };
    expect(bonusCountdown(at('2027-02-03T12:00:00'), s)).toEqual({ state: 'today', days: 0 });
    expect(bonusCountdown(at('2027-02-04T12:00:00'), s)).toEqual({ state: 'past', days: 0 });
    expect(bonusCountdown(at('2027-03-05T12:00:00'), s)).toEqual({ state: 'past', days: 0 });
    expect(bonusCountdown(at('2027-03-06T12:00:00'), s).state).toBe('upcoming');
  });
  it('accepts month-day input and migrates legacy full dates', () => {
    const base = { ...defaults(), configured: true, salary: 22000 };
    expect(validateSettings({ ...base, springStart: '02-04', springEnd: '02-10', bonusDate: '02-03' })).toBe('');
    expect(validateSettings({ ...base, springStart: '2027-02-04' })).toContain('月-日');
    expect(validateSettings({ ...base, springStart: '02-30' })).toContain('月-日');
    expect(validateSettings({ ...base, springStart: '02-10', springEnd: '02-04' })).toContain('春节');
    expect(sanitizeSettings({ ...base, springStart: '2027-02-04', springEnd: '2027-02-10', bonusDate: '2028-02-03' }))
      .toMatchObject({ springStart: '02-04', springEnd: '02-10', bonusDate: '02-03' });
    expect(sanitizeSettings({ ...base, springStart: '13-01', bonusDate: 'nope' })).toMatchObject({ springStart: '', bonusDate: '' });
    // 旧的布尔标记无法判断属于哪一轮，迁移时直接作废。
    expect(sanitizeSettings({ ...base, bonusReceived: true }).bonusReceivedAt).toBe('');
    expect(sanitizeSettings({ ...base, bonusReceivedAt: '2027-02-03' }).bonusReceivedAt).toBe('2027-02-03');
  });
});
describe('seasonal shift and shipped defaults', () => {
  it('ships the personal schedule, spring leave and bonus defaults', () => {
    expect(defaults()).toMatchObject({
      configured: false, salary: 0,
      startTime: '08:30', endTime: '17:30',
      summerFrom: '05-01', summerTo: '10-01', summerStartTime: '08:30', summerEndTime: '18:00',
      springStart: '02-04', springEnd: '', bonusDate: '02-03', bonusAmount: null, bonusReceivedAt: ''
    });
  });
  it('switches between regular and summer shifts by month-day, endpoints included', () => {
    const s = { ...defaults(), configured: true, salary: 22000 };
    const shift = (day: string) => activeShift(new Date(`${day}T12:00:00`), s);
    expect(shift('2026-04-30')).toEqual({ startTime: '08:30', endTime: '17:30', summer: false });
    expect(shift('2026-05-01')).toEqual({ startTime: '08:30', endTime: '18:00', summer: true });
    expect(shift('2026-10-01')).toEqual({ startTime: '08:30', endTime: '18:00', summer: true });
    expect(shift('2026-10-02')).toEqual({ startTime: '08:30', endTime: '17:30', summer: false });
    // The range repeats every year instead of being pinned to one.
    expect(shift('2027-05-01').summer).toBe(true);
    expect(shift('2030-01-15').summer).toBe(false);
  });
  it('falls back to the regular shift when the range is incomplete or unset', () => {
    const half = { ...defaults(), configured: true, salary: 22000, summerTo: '' };
    expect(activeShift(new Date('2026-06-01T12:00:00'), half).summer).toBe(false);
    const off = { ...defaults(), configured: true, salary: 22000, summerFrom: '', summerTo: '' };
    expect(activeShift(new Date('2026-06-01T12:00:00'), off)).toEqual({ startTime: '08:30', endTime: '17:30', summer: false });
  });
  it('drives income and the off-work countdown from the active shift', () => {
    const s = { ...defaults(), configured: true, salary: 22000 };
    const days = monthWorkdays(at('2026-06-15T12:00:00'), s);
    const summer = earnings(at('2026-06-15T13:00:00'), s);
    expect(summer.status).toBe('working');
    expect(summer.offSeconds).toBe(5 * 3600);
    expect(summer.today).toBeCloseTo(s.salary / days.length * (4.5 / 9.5));
    const winter = earnings(at('2026-11-16T13:00:00'), s);
    expect(winter.status).toBe('working');
    expect(winter.offSeconds).toBe(4.5 * 3600);
    expect(winter.today).toBeCloseTo(s.salary / monthWorkdays(at('2026-11-16T12:00:00'), s).length / 2);
  });
  it('rejects malformed, half-filled and reversed summer ranges', () => {
    const base = { ...defaults(), configured: true, salary: 22000 };
    expect(validateSettings(base)).toBe('');
    expect(validateSettings({ ...base, summerTo: '' })).toContain('夏季作息');
    expect(validateSettings({ ...base, summerFrom: '13-01' })).toContain('夏季作息');
    expect(validateSettings({ ...base, summerFrom: '02-30' })).toContain('夏季作息');
    expect(validateSettings({ ...base, summerStartTime: '20:00' })).toContain('夏季下班时间');
  });
  it('drops a half-filled summer range while sanitizing and keeps a complete one', () => {
    expect(sanitizeSettings({ ...defaults(), summerFrom: '05-01', summerTo: '' })).toMatchObject({ summerFrom: '', summerTo: '' });
    expect(sanitizeSettings({ ...defaults(), summerFrom: '11-01', summerTo: '03-31' })).toMatchObject({ summerFrom: '11-01', summerTo: '03-31' });
    // A cross-year range stays usable through activeShift.
    const crossYear = { ...defaults(), configured: true, salary: 22000, summerFrom: '11-01', summerTo: '03-31' };
    expect(activeShift(new Date('2026-12-20T12:00:00'), crossYear).summer).toBe(true);
    expect(activeShift(new Date('2026-02-10T12:00:00'), crossYear).summer).toBe(true);
    expect(activeShift(new Date('2026-07-10T12:00:00'), crossYear).summer).toBe(false);
  });
  it('carries the summer range through legacy migration', () => {
    const storage = new MemoryStorage();
    storage.setItem(`${OLD_KEY}:signed-out`, JSON.stringify({ salary: 18000, startTime: '09:00', endTime: '18:00' }));
    const result = loadSettings(storage);
    expect(result.settings).toMatchObject({ summerFrom: '05-01', summerTo: '10-01', summerStartTime: '08:30', summerEndTime: '18:00' });
  });
});
describe('pet style and daily evolution', () => {
  it('ships all five styles with the capybara selected by default', () => {
    expect(PET_STYLES).toHaveLength(5);
    expect(PET_STYLES[0]).toBe('capybaraZen');
    expect(PET_STAGE_COUNT).toBe(10);
    expect(defaults().pet.style).toBe('capybaraZen');
  });
  it('advances one form per work hour and another every twenty interactions', () => {
    const base = { ...defaults(), configured: true, salary: 22000, summerFrom: '', summerTo: '', startTime: '09:00', endTime: '18:00' };
    const withCount = (count: number) => ({ ...base, pet: { ...base.pet, bondDate: '2026-09-15', bondCount: count } });
    expect(INTERACTIONS_PER_STAGE).toBe(20);
    expect(petStage(at('2026-09-15T08:59:00'), withCount(40))).toBe(1);
    expect(petStage(at('2026-09-15T09:00:00'), base)).toBe(1);
    expect(petStage(at('2026-09-15T09:59:00'), base)).toBe(1);
    expect(petStage(at('2026-09-15T10:00:00'), base)).toBe(2);
    expect(petStage(at('2026-09-15T10:00:00'), withCount(19))).toBe(2);
    expect(petStage(at('2026-09-15T10:00:00'), withCount(20))).toBe(3);
    expect(petStage(at('2026-09-15T12:00:00'), base)).toBe(4);
    expect(petStage(at('2026-09-15T18:00:00'), base)).toBe(10);
    expect(petStage(at('2026-09-15T20:00:00'), base)).toBe(10);
    expect(petStage(at('2026-09-16T09:00:00'), withCount(MAX_BOND_COUNT))).toBe(1);
    expect(petStage(at('2026-09-16T10:00:00'), withCount(MAX_BOND_COUNT))).toBe(2);
    let settings = withCount(MAX_BOND_COUNT - 1);
    settings = recordPetInteraction(at('2026-09-15T10:00:00'), settings);
    expect(settings.pet.bondCount).toBe(MAX_BOND_COUNT);
    expect(recordPetInteraction(at('2026-09-15T10:00:00'), settings)).toBe(settings);
    expect(sanitizeSettings({ pet: { bondDate: '2026-09-15', bondCount: 20 } }).pet.bondCount).toBe(20);
    expect(sanitizeSettings({ pet: { bondDate: '2026-09-15', bondCount: MAX_BOND_COUNT + 1 } }).pet.bondCount).toBe(0);
  });
  it('keeps a locally counted form when an older snapshot has no bond field', () => {
    const today = dateKey(new Date());
    const local = { ...defaults(), pet: { ...defaults().pet, bondDate: today, bondCount: 3 } };
    const stale = { ...defaults(), pet: { ...defaults().pet } };
    delete (stale.pet as { bondCount?: number }).bondCount;
    expect(mergePetBond(local, stale).pet.bondCount).toBe(3);
    expect(mergePetBond(local, { ...defaults(), pet: { ...defaults().pet, bondDate: today, bondCount: 0 } }).pet.bondCount).toBe(0);
  });
  it('stays on the first form on rest days and ignores interactions then', () => {
    const s = { ...defaults(), configured: true, salary: 22000, pet: { ...defaults().pet, bondDate: '2026-09-19', bondCount: 6 } };
    expect(petStage(at('2026-09-19T14:00:00'), s)).toBe(1);
    expect(petStage(at('2026-10-05T14:00:00'), s)).toBe(1);
    expect(recordPetInteraction(at('2026-09-19T14:00:00'), s)).toBe(s);
  });
  it('sanitizes a stored style and rejects unknown ones', () => {
    expect(sanitizeSettings({ ...defaults(), pet: { ...defaults().pet, style: 'lazyCat' } }).pet.style).toBe('lazyCat');
    expect(sanitizeSettings({ ...defaults(), pet: { ...defaults().pet, style: 'nope' } }).pet.style).toBe('capybaraZen');
    const legacy = { ...defaults(), pet: { visible: true, onTop: true, size: 128, x: null, y: null }, petStyle: 'lazyDog' };
    expect(sanitizeSettings(legacy).pet.style).toBe('lazyDog');
  });
  it('carries the legacy petStyle preference through migration', () => {
    const storage = new MemoryStorage();
    storage.setItem(`${OLD_KEY}:signed-out`, JSON.stringify({ salary: 18000, petStyle: 'honestCow' }));
    expect(loadSettings(storage).settings.pet.style).toBe('honestCow');
  });
});
describe('broadcast cadence', () => {
  it('schedules the next report 25 to 45 minutes out', () => {
    const now = at('2026-09-15T13:00:00');
    expect(randomDue(now, () => 0)).toBe(now.getTime() + 25 * 60000);
    expect(randomDue(now, () => 1)).toBe(now.getTime() + 45 * 60000);
  });
  it('keeps reporting through the lunch break instead of going quiet', () => {
    const s = settings(), now = at('2026-09-15T12:30:00');
    const due = { ...freshDelivery(now), nextAt: now.getTime(), lastAt: now.getTime() - 11 * 60000 };
    expect(autoReport(now, s, due, false)).not.toBeNull();
  });
  it('still refuses two reports inside ten minutes', () => {
    const s = settings(), now = at('2026-09-15T13:00:00');
    const recent = { ...freshDelivery(now), nextAt: now.getTime(), lastAt: now.getTime() - 5 * 60000 };
    expect(autoReport(now, s, recent, false)).toBeNull();
    const due = { ...freshDelivery(now), nextAt: now.getTime(), lastAt: now.getTime() - 11 * 60000 };
    expect(autoReport(now, s, due, false)).not.toBeNull();
  });
});
describe('safe local storage migration', () => {
  it('migrates only the active profile and leaves legacy balances untouched', () => {
    const storage = new MemoryStorage();
    storage.setItem('wageclaw-active-user-id', 'alice');
    const original = JSON.stringify({ salary: 18000, startTime: '08:30', endTime: '18:00', payday: 31, privacyMode: true, walletBalance: 999999 });
    storage.setItem(`${OLD_KEY}:user:alice`, original);
    storage.setItem(`${OLD_KEY}:user:bob`, JSON.stringify({ salary: 90000 }));
    const result = loadSettings(storage);
    expect(result.key).toBe(`${LITE_KEY}:user:alice`);
    expect(result.settings).toMatchObject({ salary: 18000, configured: true, privacy: true, payday: 31 });
    expect(result.settings.pet.visible).toBe(true);
    expect(result.settings).not.toHaveProperty('walletBalance');
    expect(storage.getItem(`${OLD_KEY}:user:alice`)).toBe(original);
    storage.setItem(result.key, JSON.stringify({ ...result.settings, salary: 19000 }));
    expect(loadSettings(storage).settings.salary).toBe(19000);
    expect(backupContents(storage, result.key, result.settings)).not.toContain('bob');
  });
  it('does not adopt a random signed-out account', () => {
    const storage = new MemoryStorage(); storage.setItem(`${OLD_KEY}:user:bob`, JSON.stringify({ salary: 90000 }));
    expect(loadSettings(storage).settings.configured).toBe(false);
  });
  it('preserves broken archives and backs them up before reset', () => {
    const storage = new MemoryStorage(); const key = `${LITE_KEY}:local`;
    storage.setItem(key, '{broken');
    expect(loadSettings(storage).recovery).toBe(true);
    expect(storage.getItem(key)).toBe('{broken');
    resetSettings(storage, key);
    expect([...storage.data.entries()].find(([k]) => k.startsWith(`${key}:backup:`))?.[1]).toBe('{broken');
    expect(loadSettings(storage).settings.configured).toBe(false);
  });
  it('handles failed storage access without crashing and validates configuration', () => {
    const storage = new MemoryStorage(); storage.getItem = () => { throw new Error('Storage blocked'); };
    expect(loadSettings(storage).recovery).toBe(true);
    expect(validateSettings({ ...settings(), endTime: '08:00' })).toContain('跨夜');
    expect(validateSettings({ ...settings(), springEnd: '01-01' })).not.toBe('');
    expect(sanitizeSettings({ salary: Infinity, bonusAmount: NaN, workweek: [9], startTime: '99:99' })).toMatchObject({ salary: 0, bonusAmount: null, workweek: [1, 2, 3, 4, 5], startTime: defaults().startTime });
  });
});
describe('broadcast policy and delivery tracking', () => {
  it('candidates return welcome when unconfigured and rich topics when configured', () => {
    const unconf = defaults();
    expect(candidates(at('2026-09-15T12:00:00'), unconf)).toEqual([
      expect.objectContaining({ id: 'welcome', priority: 4 })
    ]);
    const s = settings();
    const rows = candidates(at('2026-09-15T14:00:00'), s);
    expect(rows.some(r => r.topic === 'offwork')).toBe(true);
    expect(rows.some(r => r.topic === 'income')).toBe(true);
    // In privacy mode, income message must not leak actual salary or numbers
    const priv = { ...s, privacy: true };
    const privRows = candidates(at('2026-09-15T14:00:00'), priv);
    const privIncome = privRows.find(r => r.topic === 'income');
    expect(privIncome?.text).toBe('今天的付出，已经慢慢变成回报。');
    expect(privIncome?.text).not.toMatch(/\d/);
  });
  it('rotates topic on manual report', () => {
    const s = settings();
    const first = manualReport(at('2026-09-15T14:00:00'), s);
    const second = manualReport(at('2026-09-15T14:00:00'), s, first.topic);
    expect(second.topic).not.toBe(first.topic);
  });
  it('enforces quiet mode, pauses, resting days and daily quotas in autoReport', () => {
    const s = settings();
    const d = freshDelivery(at('2026-09-15T14:00:00'));
    // Blocked by panel or dragging
    expect(autoReport(at('2026-09-15T14:00:00'), s, d, true)).toBeNull();
    // Rest day (Saturday 2026-09-19)
    expect(autoReport(at('2026-09-19T14:00:00'), s, d, false)).toBeNull();
    // Quiet today
    const quietToday = { ...s, broadcast: { ...s.broadcast, quietDate: '2026-09-15' } };
    expect(autoReport(at('2026-09-15T14:00:00'), quietToday, d, false)).toBeNull();
    // Paused for an hour
    const paused = { ...s, broadcast: { ...s.broadcast, pauseUntil: at('2026-09-15T15:00:00').getTime() } };
    expect(autoReport(at('2026-09-15T14:00:00'), paused, d, false)).toBeNull();
    // Total quota exhausted
    const maxTotal = { ...d, total: 32 };
    expect(autoReport(at('2026-09-15T14:00:00'), s, maxTotal, false)).toBeNull();
    // Spacing interval (< 10 mins)
    const recent = { ...d, lastAt: at('2026-09-15T13:55:00').getTime() };
    expect(autoReport(at('2026-09-15T14:00:00'), s, recent, false)).toBeNull();
  });
  it('triggers critical milestones at shift end and 30 mins before end', () => {
    const s = settings(); // 09:00 - 18:00
    const d = freshDelivery(at('2026-09-15T17:30:00'));
    // 30 mins before end (17:30)
    const soon = autoReport(at('2026-09-15T17:30:30'), s, d, false);
    expect(soon).toMatchObject({ id: 'soon', priority: 2, topic: 'offwork' });
    expect(soon).not.toBeNull();
    const dAfterSoon = recordDelivery(at('2026-09-15T17:30:30'), d, soon || { id: 'soon', priority: 2, topic: 'offwork', signature: 's', text: 't' });
    expect(dAfterSoon.events).toContain('soon');
    expect(autoReport(at('2026-09-15T17:31:00'), s, dAfterSoon, false)).toBeNull();
    // At shift end (18:00) with priority 3
    const end = autoReport(at('2026-09-15T18:00:30'), s, dAfterSoon, false);
    expect(end).toMatchObject({ id: 'end', priority: 3, topic: 'offwork' });
    // Expired milestone (> 2 mins past end) does not fire
    expect(autoReport(at('2026-09-15T18:03:00'), s, d, false)).toBeNull();
  });
  it('normalizes delivery across midnight and calculates next wake', () => {
    const s = settings();
    const prevDay = { ...freshDelivery(at('2026-09-14T12:00:00')), total: 4, ordinary: 3, events: ['end'] };
    const normalized = normalizeDelivery(prevDay, at('2026-09-15T09:00:00'));
    expect(normalized.date).toBe('2026-09-15');
    expect(normalized.total).toBe(0);
    expect(normalized.events).toEqual([]);
    const wake = nextWake(at('2026-09-15T14:00:00'), s, normalized);
    expect(wake).toBeGreaterThan(0);
    expect(wake).toBeLessThanOrEqual(4 * 3600000);
  });
});
