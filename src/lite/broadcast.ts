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
export function randomDue(now: Date, random = Math.random): number { return now.getTime() + (25 + random() * 20) * 60000; }
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
export const REPORT_TOPICS = ['income', 'offwork', 'holiday', 'spring', 'bonus'] as const;
export type ReportTopic = typeof REPORT_TOPICS[number];
/** User-requested topics share the same real calculations as the dashboard. */
export function requestedReport(now: Date, s: LiteSettings, topic: ReportTopic): Report {
  const rows = candidates(now, s);
  if (!s.configured) return rows[0];
  const found = rows.find(row => row.topic === topic);
  if (found) return found;
  const make = (id: string, text: string): Report => ({ id, topic, signature: `${topic}:${id}`, priority: 4, text });
  if (topic === 'offwork') return rows.find(row => row.topic === 'rest') ?? rows[0];
  if (topic === 'income') return make('income-zero', s.privacy ? '还没开始今天的积累，先按自己的节奏来。' : '今天暂时积累了 ¥0.00，休息和等待也有自己的价值。');
  if (topic === 'holiday') return make('holiday-unset', '下一段法定假期安排还未收录，可以先看看自己的春节假期。');
  if (topic === 'spring') {
    const spring = springCountdown(now, s);
    return make('spring-rest', spring.state === 'unset' ? '在设置里填上春节放假日期，给回家留个盼头。' : spring.state === 'active' ? `春节假期中，还有 ${spring.days} 天，安心休息。` : '你的春节假期开始了，把时间留给自己和家人。');
  }
  const bonus = bonusCountdown(now, s);
  if (bonus.state === 'received') return make('bonus-received', '这一轮年终奖已标记收到，这份辛苦终于有了回报。');
  return make('bonus-wait', bonus.state === 'unset' ? '在设置里填上年终奖预计日期，给收获留个盼头。' : bonus.state === 'today' ? '预计今天发年终奖，到账时间以公司实际安排为准。' : '预计发放日期已经到了，实际到账后记得标记已收到。');
}
function shiftEnd(now: Date, s: LiteSettings) { const end = new Date(now); end.setHours(0, clockMinutes(activeShift(now, s).endTime), 0, 0); return end.getTime(); }
export function autoReport(now: Date, s: LiteSettings, delivery: Delivery, blocked: boolean, random = Math.random): Report | null {
  const d = normalizeDelivery(delivery, now), time = now.getTime();
  if (blocked || !s.configured || !s.pet.visible || !s.broadcast.enabled || s.broadcast.pauseUntil > time || s.broadcast.quietDate === dateKey(now) || !isWorkday(now, s)) return null;
  if (d.total >= 14 || (d.lastAt && time - d.lastAt < 10 * 60000)) return null;
  const end = shiftEnd(now, s);
  for (const [id, target, text, priority] of [
    ['end', end, '今天辛苦了，接下来的时间留给自己。', 3],
    ['soon', end - 30 * 60000, '还有半小时，今天就可以收工了。', 2]
  ] as const) {
    if ((id === 'end' || earnings(now, s).status === 'working') && time >= target && time < target + 120000 && !d.events.includes(id)) return { id, topic: 'offwork', signature: `${d.date}:${id}`, text, priority };
  }
  if (earnings(now, s).status !== 'working' || d.ordinary >= 12 || !d.nextAt || time < d.nextAt || time - d.nextAt > 120000) return null;
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

/** Local, non-scoring reactions: comfort never modifies earnings or adds a chore. */
export function comfortReport(style: LiteSettings['pet']['style'], action: 'pat' | 'stretch', count = 0): Report {
  const voices = {
    capybaraZen: ['嗯，收到摸摸。今天也可以慢慢来。', '事情再多，也先一件一件来。', '我在呢，发会儿呆也没关系。'],
    lazyCat: ['呼噜呼噜，这一小会儿留给你。', '猫猫批准：肩膀可以放松了。', '让我贴贴，烦心事先放旁边。'],
    lazyDog: ['收到摸摸！今天也站在你这边。', '尾巴摇一摇，陪你等收工。', '辛苦啦，等会儿去走走吧。'],
    honestCow: ['辛苦归辛苦，记得照顾自己。', '陪你慢慢来，不催你。', '咱们的时间，也要留给生活。'],
    rageBlob: ['怨气我先收着，你松口气。', '今天的烦心事，让它飘走一点。', '别急，我陪你一起等下班。']
  };
  const text = action === 'stretch' ? '一起伸个懒腰，肩膀松一松。接下来的事慢慢来。' : voices[style][Math.abs(Math.trunc(count)) % 3];
  return { id: action, topic: 'comfort', signature: `${style}:${action}:${count}`, priority: 4, text };
}
