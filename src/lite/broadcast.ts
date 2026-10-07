import { activeShift, dateKey, clockMinutes, type LiteSettings } from './model';
import { earnings, nextHoliday, springCountdown, bonusCountdown, paydayCountdown, isWorkday } from './calendar';
export interface Delivery { date: string; ordinary: number; total: number; events: string[]; lastAt: number; lastTopic: string; lastSignature: string; lastNewsSignature: string; nextAt: number }
export interface NewsHeadline { title: string; digest?: string }
export interface Report { id: string; topic: string; signature: string; text: string; priority: number }
export function freshDelivery(now: Date): Delivery {
  return { date: dateKey(now), ordinary: 0, total: 0, events: [], lastAt: 0, lastTopic: '', lastSignature: '', lastNewsSignature: '', nextAt: 0 };
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
  if (typeof r.lastNewsSignature === 'string') d.lastNewsSignature = r.lastNewsSignature;
  return d;
}
export function randomDue(now: Date, random = Math.random): number { return now.getTime() + (25 + random() * 20) * 60000; }
function clipNews(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim().replace(/[。！？]+$/g, '');
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}
/** Preserve the headline first; only include a digest when it fits the small bubble. */
export function newsText(item: NewsHeadline): string {
  const title = clipNews(item.title || '', 36);
  if (!title) return '今天的热点还没到，先按自己的节奏来。';
  const headline = `热点：${title}。`;
  const rawDigest = (item.digest || '').replace(/^[.…\s]+|[.…\s]+$/g, '');
  const digest = headline.length <= 26 ? clipNews(rawDigest, 42 - headline.length - 1) : '';
  return digest && digest !== title ? `${headline}${digest}。` : headline;
}
const CARE = [
  '肩膀松一松，手离开键盘歇一会儿。', '杯子还在手边吗？喝口水再继续。',
  '看看窗外，把目光从屏幕上挪开一会儿。', '坐了好久的话，起来走两步吧。',
  '午饭慢慢吃，这一会儿不用赶。', '伸个懒腰，给自己留一点空隙。',
  '消息可以稍后回，先把手头这件做完。', '把下一件事写下来，脑袋就少装一件。'
];
const LIGHT = [
  '我的待办只有一项：陪你等下班。', '今日小目标：准时下班，晚饭好吃。',
  '下班后的你，拥有沙发的优先使用权。', '进度条慢慢走，快乐可以先预约。',
  '工作先告一段落，晚饭值得认真期待。', '脑袋开了太多标签？先关掉一个。',
  '桌面可以乱一点，晚饭不能将就。', '今日好运：事情少一点，收工早一点。'
];
const VOICES = {
  capybaraZen: ['嗯，收到摸摸。今天也可以慢慢来。', '事情再多，也先一件一件来。', '我在呢，发会儿呆也没关系。', '水面慢慢晃，心也可以慢慢放。', '不急着追赶，这一刻先站稳。', '陪你坐一会儿，再出发也来得及。'],
  lazyCat: ['呼噜呼噜，这一小会儿留给你。', '猫猫批准：肩膀可以放松了。', '让我贴贴，烦心事先放旁边。', '晒太阳的位置，给你留了一半。', '忙完这一件，就和我伸个懒腰。', '呼噜声已就位，陪你慢慢收工。'],
  lazyDog: ['收到摸摸！今天也站在你这边。', '尾巴摇一摇，陪你等收工。', '辛苦啦，等会儿去走走吧。', '晚风和散步，都在等下班的你。', '开心的事告诉我，我负责摇尾巴。', '今天的小烦恼，我陪你一起甩掉。'],
  honestCow: ['辛苦归辛苦，记得照顾自己。', '陪你慢慢来，不催你。', '咱们的时间，也要留给生活。', '这一小步也算数，歇口气再走。', '做了不少事了，给自己一点肯定。', '晚饭要吃饱，辛苦要有人知道。'],
  rageBlob: ['怨气我先收着，你松口气。', '今天的烦心事，让它飘走一点。', '别急，我陪你一起等下班。', '烦恼丢给我，晚饭留给你。', '今天也很努力，允许自己吐槽一下。', '不开心先放这里，下班记得带走快乐。']
};
const STRETCH = ['一起伸个懒腰，肩膀松一松。接下来的事慢慢来。', '手腕转一转，这一小会儿不用赶。', '背靠椅子歇一会儿，我替你看着桌面。', '放下鼠标，和我一起松口气。', '站起来活动一下，再回来也来得及。', '眉头松开一点，今天已经很努力了。'];
function contentIndex(now: Date, sequence: number) { return now.getDate() * 97 + now.getMonth() * 31 + Math.floor((now.getHours() * 60 + now.getMinutes()) / 15) + sequence; }
export function candidates(now: Date, s: LiteSettings, news: NewsHeadline[] = [], sequence = 0, lastNewsSignature = ''): Report[] {
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
  const payday = paydayCountdown(now, s.payday);
  if (payday) add('payday', `payday:${payday.date}`, payday.days === 0 ? '按设置，今天是发薪日。到账以公司安排为准。' : `离下次发薪还有 ${payday.days} 天，收获又近了一点。`);
  if (isWorkday(now, s)) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let gap = 1; gap <= 14; gap++) {
      day.setDate(day.getDate() + 1);
      if (!isWorkday(day, s)) {
        add('break', `break:${dateKey(day)}`, gap === 1 ? '按你的排班，明天休息。想好怎么过了吗？' : `按你的排班，再过 ${gap} 天就能歇一天。`);
        break;
      }
    }
  }
  const index = contentIndex(now, sequence);
  const care = CARE[index % CARE.length], light = LIGHT[index % LIGHT.length], voice = VOICES[s.pet.style][index % VOICES[s.pet.style].length];
  add('care', `care:${care}`, care);
  add('light', `light:${light}`, light);
  add('company', `company:${s.pet.style}:${voice}`, voice);
  if (s.broadcast.news !== false) {
    const usable = news.filter((item, i, all) => item.title.trim() && all.findIndex(other => other.title.trim() === item.title.trim()) === i);
    const previous = usable.findIndex(item => `news:${item.title.trim()}` === lastNewsSignature);
    const item = usable.length ? usable[(previous >= 0 ? previous + 1 : index) % usable.length] : undefined;
    if (item) add('news', `news:${item.title.trim()}`, newsText(item));
  }
  return rows;
}
export function manualReport(now: Date, s: LiteSettings, previousTopic = '', news: NewsHeadline[] = [], options: { sequence?: number; lastNewsSignature?: string } = {}): Report {
  const rows = candidates(now, s, news, options.sequence, options.lastNewsSignature);
  const newsIndex = rows.findIndex(row => row.topic === 'news');
  if (newsIndex >= 0) rows.splice(Math.min(2, rows.length - 1), 0, ...rows.splice(newsIndex, 1));
  const previous = rows.findIndex(row => row.topic === previousTopic);
  return rows[(previous + 1) % rows.length];
}
export const REPORT_TOPICS = ['income', 'offwork', 'holiday', 'spring', 'bonus', 'news'] as const;
export type ReportTopic = typeof REPORT_TOPICS[number];
/** User-requested topics share the same real calculations as the dashboard. */
export function requestedReport(now: Date, s: LiteSettings, topic: ReportTopic, news: NewsHeadline[] = [], lastNewsSignature = ''): Report {
  const rows = candidates(now, s, news, 0, lastNewsSignature);
  if (!s.configured) return rows[0];
  const found = rows.find(row => row.topic === topic);
  if (found) return found;
  const make = (id: string, text: string): Report => ({ id, topic, signature: `${topic}:${id}`, priority: 4, text });
  if (topic === 'news') return make('news-unavailable', s.broadcast.news === false ? '热点消息已关闭，可以在设置中开启。' : '热点暂时没取到，稍后再听一条吧。');
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
export function autoReport(now: Date, s: LiteSettings, delivery: Delivery, blocked: boolean, random = Math.random, news: NewsHeadline[] = []): Report | null {
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
  const rows = candidates(now, s, news, d.ordinary, d.lastNewsSignature).filter(r => r.topic !== d.lastTopic && r.signature !== d.lastSignature);
  const headline = rows.find(row => row.topic === 'news');
  if (d.ordinary % 3 === 0 && headline) return headline;
  return rows.length ? rows[Math.min(rows.length - 1, Math.floor(random() * rows.length))] : null;
}
export function recordDelivery(now: Date, delivery: Delivery, report: Report, random = Math.random): Delivery {
  const d = normalizeDelivery(delivery, now);
  return { ...d, ordinary: d.ordinary + (report.priority === 1 ? 1 : 0), total: d.total + 1,
    events: report.priority > 1 ? [...d.events, report.id] : d.events,
    lastAt: now.getTime(), lastTopic: report.topic, lastSignature: report.signature,
    lastNewsSignature: report.topic === 'news' ? report.signature : d.lastNewsSignature, nextAt: randomDue(now, random) };
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
  const lines = action === 'stretch' ? STRETCH : VOICES[style];
  const text = lines[Math.abs(Math.trunc(count)) % lines.length];
  return { id: action, topic: 'comfort', signature: `${style}:${action}:${count}`, priority: 4, text };
}
