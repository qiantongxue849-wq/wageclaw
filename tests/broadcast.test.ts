import { describe, it, expect } from 'vitest';
import { defaults, dateKey } from '../src/lite/model';
import { autoReport, candidates, comfortReport, freshDelivery, manualReport, newsText, normalizeDelivery, recordDelivery, nextWake, requestedReport } from '../src/lite/broadcast';
const at = (time: string) => new Date(`2026-09-15T${time}:00`);
// 固定为 09:00—18:00 且关闭夏季作息，与出厂默认解耦。
const s = () => ({ ...defaults(), configured: true, salary: 18000, springStart: '02-01', bonusDate: '01-29', startTime: '09:00', endTime: '18:00', summerFrom: '', summerTo: '' });
describe('pet broadcast scheduler', () => {
  it('rotates meaningful topics without inventing settings or leaking money', () => {
    const settings = s();
    const rows = candidates(at('13:00'), settings);
    expect(rows.map(r => r.topic)).toEqual(['offwork', 'income', 'holiday', 'spring', 'bonus', 'payday', 'break', 'care', 'light', 'company']);
    expect(manualReport(at('13:00'), settings, 'income').topic).toBe('holiday');
    expect(candidates(at('13:00'), { ...settings, privacy: true }).find(r => r.topic === 'income')?.text).not.toMatch(/\d|¥/);
    expect(candidates(at('13:00'), { ...settings, bonusDate: '', springStart: '' }).some(r => ['bonus', 'spring'].includes(r.topic))).toBe(false);
  });
  it('folds one hot headline into the rotation and keeps it short enough for the bubble', () => {
    const settings = s();
    const news = [{ title: '广东东莞报告2例无症状感染者', digest: '两名返莞人员核酸检测中发现，已转运隔离治疗。' }];
    const row = candidates(at('13:00'), settings, news).find(item => item.topic === 'news');
    expect(row?.text.startsWith('热点：')).toBe(true);
    expect(row?.text).toContain(news[0].title);
    expect(row?.text.length).toBeLessThanOrEqual(42);
    expect(candidates(at('13:00'), { ...settings, broadcast: { ...settings.broadcast, news: false } }, news).some(item => item.topic === 'news')).toBe(false);
    expect(newsText({ title: '短标题' })).toBe('热点：短标题。');
    expect(newsText({ title: '短标题', digest: '... ' })).toBe('热点：短标题。');
  });
  it('uses the actual payday and rest-day overrides rather than assuming weekends', () => {
    const settings = { ...s(), payday: 15, overrides: { '2026-09-16': false } };
    const rows = candidates(at('13:00'), settings);
    expect(rows.find(row => row.topic === 'payday')?.text).toContain('今天是发薪日');
    expect(rows.find(row => row.topic === 'break')?.text).toContain('明天休息');
    expect(candidates(at('13:00'), { ...settings, payday: null }).some(row => row.topic === 'payday')).toBe(false);
    expect(candidates(new Date('2026-09-16T13:00:00'), settings).some(row => row.topic === 'break')).toBe(false);
    const continuous = { ...s(), overrides: Object.fromEntries(Array.from({ length: 15 }, (_, n) => [`2026-09-${15 + n}`, true])) };
    expect(candidates(at('13:00'), continuous).some(row => row.topic === 'break')).toBe(false);
  });
  it('varies local copy on repeated clicks and keeps each pet distinct', () => {
    const variants = Array.from({ length: 8 }, (_, sequence) => candidates(at('13:00'), s(), [], sequence));
    for (const topic of ['care', 'light']) expect(new Set(variants.map(rows => rows.find(row => row.topic === topic)?.text)).size).toBe(8);
    expect(new Set(Array.from({ length: 6 }, (_, n) => comfortReport('lazyDog', 'pat', n).text)).size).toBe(6);
    expect(new Set(Array.from({ length: 6 }, (_, n) => comfortReport('lazyDog', 'stretch', n).text)).size).toBe(6);
    expect(candidates(at('13:00'), { ...s(), pet: { ...s().pet, style: 'lazyCat' } }).find(row => row.topic === 'company')?.text).not.toBe(variants[0].find(row => row.topic === 'company')?.text);
  });
  it('rotates headlines across a complete manual topic cycle and remembers automatic news', () => {
    const now = at('13:00'), settings = s();
    const news = [{ title: '第一条新闻' }, { title: '第二条新闻' }, { title: '第二条新闻' }, { title: '第三条新闻' }];
    const first = manualReport(now, settings, 'income', news);
    let topic = first.topic, next = first;
    for (let i = 0; i < candidates(now, settings, news).length; i++) {
      next = manualReport(now, settings, topic, news, { lastNewsSignature: first.signature, sequence: i });
      topic = next.topic;
    }
    expect(next.topic).toBe('news'); expect(next.signature).not.toBe(first.signature);
    const saved = recordDelivery(now, freshDelivery(now), first);
    const afterLocal = recordDelivery(now, saved, candidates(now, settings)[0]);
    expect(normalizeDelivery(JSON.parse(JSON.stringify(afterLocal)), now).lastNewsSignature).toBe(first.signature);
    expect(candidates(now, settings, news, 0, afterLocal.lastNewsSignature).find(row => row.topic === 'news')?.signature).not.toBe(first.signature);
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
  it('makes headlines reachable early and prefers them every third ordinary slot without bypassing quiet rules', () => {
    const now = at('13:00'), settings = s(), news = [{ title: '城市公园开放新步道' }];
    let topic = '';
    const topics = Array.from({ length: 3 }, () => { topic = manualReport(now, settings, topic, news).topic; return topic; });
    expect(topics).toEqual(['offwork', 'income', 'news']);
    expect(requestedReport(now, settings, 'news', news).text).toContain(news[0].title);
    expect(requestedReport(now, settings, 'news').text).toContain('暂时没取到');
    expect(requestedReport(now, { ...settings, broadcast: { ...settings.broadcast, news: false } }, 'news', news).text).toContain('已关闭');
    const due = { ...freshDelivery(now), nextAt: now.getTime() };
    for (const ordinary of [0, 3, 6, 9]) expect(autoReport(now, settings, { ...due, ordinary }, false, () => 0, news)?.topic).toBe('news');
    expect(autoReport(now, settings, { ...due, ordinary: 1 }, false, () => 0, news)?.topic).toBe('offwork');
    expect(autoReport(now, settings, due, true, () => 0, news)).toBeNull();
    expect(autoReport(now, { ...settings, broadcast: { ...settings.broadcast, enabled: false } }, due, false, () => 0, news)).toBeNull();
    expect(autoReport(at('17:30'), settings, freshDelivery(at('17:30')), false, () => 0, news)?.id).toBe('soon');
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
      { enabled: false, pauseUntil: 0, quietDate: '', news: true },
      { enabled: true, pauseUntil: now.getTime() + 1000, quietDate: '', news: true },
      { enabled: true, pauseUntil: 0, quietDate: dateKey(now), news: true }
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
