import { activeShift, dateKey, clockMinutes, type LiteSettings } from './model';
import { earnings, nextHoliday, springCountdown, bonusCountdown, isWorkday } from './calendar';
export interface Delivery { date: string; ordinary: number; total: number; events: string[]; lastAt: number; lastTopic: string; lastSignature: string; nextAt: number }
export interface Report { id: string; topic: string; signature: string; text: string; priority: number }
export function freshDelivery(now: Date): Delivery {
  return { date: dateKey(now), ordinary: 0, total: 0, events: [], lastAt: 0, lastTopic: '', lastSignature: '', nextAt: 0 };
}
export function normalizeDelivery(raw: unknown, now: Date): Delivery {
  const d = freshDelivery(now);
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Delivery>;
  if (r.date !== d.date) return d;
  for (const key of ['ordinary', 'total', 'lastAt', 'nextAt'] as const) if (Number.isFinite(r[key]) && Number(r[key]) >= 0) d[key] = Number(r[key]);
  if (Array.isArray(r.events)) d.events = r.events.filter(v => typeof v === 'string').slice(-10);
  if (typeof r.lastTopic === 'string') d.lastTopic = r.lastTopic;
  if (typeof r.lastSignature === 'string') d.lastSignature = r.lastSignature;
  return d;
}
export function randomDue(now: Date, random = Math.random): number { return now.getTime() + (10 + random() * 10) * 60000; }
export function candidates(now: Date, s: LiteSettings): Report[] {
  if (!s.configured) return [{ id: 'welcome', topic: 'welcome', signature: 'welcome', priority: 4, text: '点我看一句，双击看全部。先填好工资和作息，让盼头开始。' }];
  const income = earnings(now, s), holiday = nextHoliday(now), spring = springCountdown(now, s), bonus = bonusCountdown(now, s);
  const rows: Report[] = [];
  const add = (topic: string, signature: string, text: string) => rows.push({ id: topic, topic, signature, text, priority: 1 });
  if (income.status === 'working') {
    const minutes = Math.ceil(income.offSeconds / 60);
    add('offwork', `offwork:${minutes}`, `还有 ${minutes} 分钟，今天就可以收工了。`);
  } else if (income.status === 'after') add('rest', 'after', '今天辛苦了，接下来的时间留给自己。');
  else if (income.status === 'rest') add('rest', 'rest', '今天休息，慢一点也没关系。');
  else add('rest', 'before', '还没上班，先按自己的节奏来。');
  if (income.today > 0) add('income', `income:${Math.floor(income.today / 10)}`, s.privacy ? '今天的付出，已经慢慢变成回报。' : `今天已经攒了 ¥${income.today.toFixed(2)}，辛苦没有白费。`);
  if (holiday) add('holiday', `holiday:${holiday.start}:${holiday.days}`, holiday.days > 0 ? `再过 ${holiday.days} 天就是${holiday.name}假期，能休息 ${holiday.length} 天。` : `${holiday.name}假期中，还有 ${holiday.remaining} 天，安心休息。`);
  if (spring.state === 'upcoming') add('spring', `spring:${s.springStart}:${spring.days}`, `离你的春节假期还有 ${spring.days} 天，回家的日子近了。`);
  if (bonus.state === 'upcoming') add('bonus', `bonus:${s.bonusDate}:${bonus.days}`, `离预计发年终奖还有 ${bonus.days} 天，留个盼头。`);
  return rows;
}
export function manualReport(now: Date, s: LiteSettings, previousTopic = ''): Report {
  const rows = candidates(now, s);
  const previous = rows.findIndex(row => row.topic === previousTopic);
  return rows[(previous + 1) % rows.length];
}
function shiftEnd(now: Date, s: LiteSettings) { const end = new Date(now); end.setHours(0, clockMinutes(activeShift(now, s).endTime), 0, 0); return end.getTime(); }
export function autoReport(now: Date, s: LiteSettings, delivery: Delivery, blocked: boolean, random = Math.random): Report | null {
  const d = normalizeDelivery(delivery, now), time = now.getTime();
  if (blocked || !s.configured || !s.pet.visible || !s.broadcast.enabled || s.broadcast.pauseUntil > time || s.broadcast.quietDate === dateKey(now) || !isWorkday(now, s)) return null;
  if (d.total >= 32 || (d.lastAt && time - d.lastAt < 10 * 60000)) return null;
  const end = shiftEnd(now, s);
  for (const [id, target, text, priority] of [
    ['end', end, '今天辛苦了，接下来的时间留给自己。', 3],
    ['soon', end - 30 * 60000, '还有半小时，今天就可以收工了。', 2]
  ] as const) {
    if ((id === 'end' || earnings(now, s).status === 'working') && time >= target && time < target + 120000 && !d.events.includes(id)) return { id, topic: 'offwork', signature: `${d.date}:${id}`, text, priority };
  }
  if (earnings(now, s).status !== 'working' || d.ordinary >= 30 || !d.nextAt || time < d.nextAt || time - d.nextAt > 120000) return null;
  if ([end, end - 30 * 60000].some(t => Math.abs(time - t) <= 15 * 60000)) return null;
  const rows = candidates(now, s).filter(r => r.topic !== d.lastTopic && r.signature !== d.lastSignature);
  return rows.length ? rows[Math.min(rows.length - 1, Math.floor(random() * rows.length))] : null;
}
export function recordDelivery(now: Date, delivery: Delivery, report: Report, random = Math.random): Delivery {
  const d = normalizeDelivery(delivery, now);
  return { ...d, ordinary: d.ordinary + (report.priority === 1 ? 1 : 0), total: d.total + 1,
    events: report.priority > 1 ? [...d.events, report.id] : d.events,
    lastAt: now.getTime(), lastTopic: report.topic, lastSignature: report.signature, nextAt: randomDue(now, random) };
}
export function nextWake(now: Date, s: LiteSettings, d: Delivery): number {
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const shift = activeShift(now, s);
  const start = new Date(now); start.setHours(0, clockMinutes(shift.startTime), 0, 0);
  const end = shiftEnd(now, s), time = now.getTime();
  const targets = [midnight.getTime(), start.getTime(), end - 30 * 60000, end, d.nextAt, s.broadcast.pauseUntil];
  return Math.max(1000, Math.min(...targets.filter(t => t > time)) - time);
}
