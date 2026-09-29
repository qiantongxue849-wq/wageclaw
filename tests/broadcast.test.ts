import { describe, it, expect } from 'vitest';
import { defaults, dateKey } from '../src/lite/model';
import { autoReport, candidates, freshDelivery, manualReport, normalizeDelivery, recordDelivery, nextWake } from '../src/lite/broadcast';
const at = (time: string) => new Date(`2026-09-15T${time}:00`);
// 固定为 09:00—18:00 且关闭夏季作息，与出厂默认解耦。
const s = () => ({ ...defaults(), configured: true, salary: 18000, springStart: '02-01', bonusDate: '01-29', startTime: '09:00', endTime: '18:00', summerFrom: '', summerTo: '' });
describe('pet broadcast scheduler', () => {
  it('rotates meaningful topics without inventing settings or leaking money', () => {
    const settings = s();
    const rows = candidates(at('13:00'), settings);
    expect(rows.map(r => r.topic)).toEqual(['offwork', 'income', 'holiday', 'spring', 'bonus']);
    expect(manualReport(at('13:00'), settings, 'income').topic).toBe('holiday');
    expect(candidates(at('13:00'), { ...settings, privacy: true }).find(r => r.topic === 'income')?.text).not.toMatch(/\d|¥/);
    expect(candidates(at('13:00'), { ...settings, bonusDate: '', springStart: '' }).some(r => ['bonus', 'spring'].includes(r.topic))).toBe(false);
  });
  it('delivers ordinary reports only when due, then persists quota and cooldown', () => {
    const now = at('13:00'), settings = s();
    const d = { ...freshDelivery(now), nextAt: now.getTime() };
    const report = autoReport(now, settings, d, false, () => 0);
    expect(report?.priority).toBe(1);
    const next = recordDelivery(now, d, (report || manualReport(now, settings)), () => 0);
    expect(next.total).toBe(1); expect(next.ordinary).toBe(1);
    expect(autoReport(at('13:05'), settings, next, false)).toBeNull();
    expect(next.nextAt).toBe(at('13:25').getTime());
    expect(autoReport(at('13:00'), settings, { ...d, ordinary: 12 }, false)).toBeNull();
  });
  it('sends each close-of-day event once and never sends expired events', () => {
    const settings = s(), now = at('17:30');
    const initial = freshDelivery(now);
    const report = autoReport(now, settings, initial, false);
    expect(report?.id).toBe('soon');
    const saved = recordDelivery(now, initial, report || manualReport(now, settings));
    expect(autoReport(at('17:31'), settings, normalizeDelivery(JSON.parse(JSON.stringify(saved)), at('17:31')), false)).toBeNull();
    expect(autoReport(at('18:00'), settings, saved, false)?.id).toBe('end');
    expect(autoReport(at('18:03'), settings, initial, false)).toBeNull();
    expect(autoReport(at('18:00'), settings, { ...initial, total: 14 }, false)).toBeNull();
  });
  it('honors pause, quiet mode, hidden pet, lock and rest days', () => {
    const now = at('18:00'), settings = s(), d = freshDelivery(now);
    expect(autoReport(now, settings, d, true)).toBeNull();
    expect(autoReport(now, { ...settings, pet: { ...settings.pet, visible: false } }, d, false)).toBeNull();
    for (const broadcast of [
      { enabled: false, pauseUntil: 0, quietDate: '' },
      { enabled: true, pauseUntil: now.getTime() + 1000, quietDate: '' },
      { enabled: true, pauseUntil: 0, quietDate: dateKey(now) }
    ]) expect(autoReport(now, { ...settings, broadcast }, d, false)).toBeNull();
    const rest = new Date('2026-09-19T18:00:00');
    expect(autoReport(rest, settings, freshDelivery(rest), false)).toBeNull();
  });
  it('rejects missed random reports and resets daily counters across midnight', () => {
    const now = at('13:00');
    expect(autoReport(now, s(), { ...freshDelivery(now), nextAt: at('11:00').getTime() }, false)).toBeNull();
    const tomorrow = new Date('2026-09-16T09:00:00');
    expect(normalizeDelivery({ ...freshDelivery(now), total: 5 }, tomorrow).total).toBe(0);
    expect(nextWake(at('17:20'), s(), freshDelivery(now))).toBe(10 * 60000);
  });
  it('does not announce the half-hour milestone before a short shift starts', () => {
    const now = at('17:30');
    expect(autoReport(now, { ...s(), startTime: '17:50' }, freshDelivery(now), false)).toBeNull();
  });
  it('reserves a quiet interval around key events', () => {
    const now = at('17:20');
    expect(autoReport(now, s(), { ...freshDelivery(now), nextAt: now.getTime() }, false)).toBeNull();
  });
  it('follows the summer shift for the close-of-day milestones', () => {
    const summer = { ...defaults(), configured: true, salary: 18000, summerFrom: '05-01', summerTo: '10-01', summerStartTime: '08:30', summerEndTime: '18:00' };
    const atSix = at('18:00');
    expect(autoReport(atSix, summer, freshDelivery(atSix), false)?.id).toBe('end');
    const winter = { ...summer, summerFrom: '', summerTo: '', startTime: '08:30', endTime: '17:30' };
    const atHalf = at('17:30');
    expect(autoReport(atHalf, winter, freshDelivery(atHalf), false)?.id).toBe('end');
    expect(nextWake(at('17:20'), winter, freshDelivery(atHalf))).toBe(10 * 60000);
  });
});
