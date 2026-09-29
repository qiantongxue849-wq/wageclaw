import { describe, it, expect } from 'vitest';
import { defaults, sanitizeSettings } from '../src/lite/model';
import { requestedReport } from '../src/lite/broadcast';
import { reportAction } from '../src/lite/petReactions';
const settings = { ...defaults(), configured: true, salary: 18000, summerFrom: '', summerTo: '', startTime: '09:00', endTime: '18:00', bonusDate: '09-24' };
describe('business-driven authored reactions', () => {
  it('maps earnings, countdowns, rest and confirmed receipts without parsing copy', () => {
    for (const [id, topic, action] of [
      ['income', 'income', 'celebrate'], ['soon', 'offwork', 'notice'], ['end', 'offwork', 'celebrate'],
      ['holiday', 'holiday', 'notice'], ['spring', 'spring', 'notice'], ['bonus', 'bonus', 'notice'],
      ['bonus-received', 'bonus', 'celebrate'], ['rest', 'rest', 'sleep'], ['stretch', 'comfort', 'stretch'], ['pat', 'comfort', 'play']
    ]) expect(reportAction({ id, topic })).toBe(action);
    expect(reportAction({ id: 'error', topic: 'error' })).toBeNull();
  });
  it('answers using work status, handles zero income and protects private amounts', () => {
    const work = new Date('2026-09-24T15:00:00');
    expect(requestedReport(work, settings, 'income').text).toMatch(/¥\d+\.\d{2}/);
    expect(requestedReport(work, { ...settings, privacy: true }, 'income').text).not.toContain('¥');
    const before = requestedReport(new Date('2026-09-24T07:00:00'), settings, 'income');
    expect(before.id).toBe('income-zero'); expect(reportAction(before)).toBe('notice');
    expect(requestedReport(new Date('2026-09-24T18:00:00'), settings, 'offwork').topic).toBe('rest');
    expect(requestedReport(work, settings, 'offwork').text).toContain('180 分钟');
  });
  it('does not call an expected bonus paid and handles unset/unknown calendars', () => {
    const now = new Date('2026-09-24T15:00:00');
    expect(requestedReport(now, settings, 'bonus').text).toContain('预计今天');
    expect(reportAction(requestedReport(now, settings, 'bonus'))).toBe('notice');
    expect(reportAction(requestedReport(now, { ...settings, bonusReceivedAt: '2026-09-24' }, 'bonus'))).toBe('celebrate');
    expect(requestedReport(now, { ...settings, bonusDate: '' }, 'bonus').text).toContain('设置');
    expect(requestedReport(new Date('2028-09-24'), settings, 'holiday').text).toContain('未收录');
    expect(requestedReport(now, { ...settings, springStart: '' }, 'spring').text).toContain('设置');
    expect(requestedReport(now, defaults(), 'income').id).toBe('welcome');
  });
  it('preserves explicit classic forms and allows returning to authored mode', () => {
    expect(sanitizeSettings({ pet: { form: 10 } }).pet).toMatchObject({ motion: 'classic', form: 10 });
    expect(sanitizeSettings({ pet: { form: 10, motion: 'authored' } }).pet.motion).toBe('authored');
    expect(sanitizeSettings({ pet: { form: null, motion: 'classic' } }).pet.motion).toBe('classic');
    expect(sanitizeSettings({ pet: {} }).pet.motion).toBe('authored');
  });
});
