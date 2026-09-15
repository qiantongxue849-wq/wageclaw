/**
 * 倒计时簇纯函数：下班/周六/发薪日/法定节假日倒数与时长文案。
 */
import { holidayCountdowns } from "@/state/tuning";
import { randomPick } from "@/utils/core";

export function getWorkdaysInMonth(year: number, monthIndex: number) {
  const total = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, monthIndex, day);
    const week = date.getDay();
    if (week !== 0 && week !== 6) count += 1;
  }
  return count;
}

export function getWorkdayGap(start: Date, end: Date) {
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const target = new Date(end);
  target.setHours(0, 0, 0, 0);
  let natural = 0;
  let workday = 0;
  while (cursor < target) {
    natural += 1;
    const week = cursor.getDay();
    if (week !== 0 && week !== 6) workday += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return { natural, workday };
}

export type HolidayCountdown = (typeof holidayCountdowns)[number] & { date: Date; natural: number; workday: number };

export function getNextHoliday(current: Date): HolidayCountdown {
  const candidates = [current.getFullYear(), current.getFullYear() + 1].flatMap((year) => {
    return holidayCountdowns.map((holiday) => {
      const date = new Date(year, holiday.month - 1, holiday.day);
      date.setHours(0, 0, 0, 0);
      return { ...holiday, date };
    });
  });
  const currentDay = new Date(current);
  currentDay.setHours(0, 0, 0, 0);
  const target = candidates
    .filter((holiday) => holiday.date >= currentDay)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const gap = getWorkdayGap(current, target.date);
  return { ...target, ...gap };
}

export function buildHolidayLine(holiday: HolidayCountdown) {
  return randomPick([
    `${holiday.name}在路上了，前面还有 <b>${holiday.workday}</b> 个工作日，先把今天这格走完`,
    `再过 <b>${holiday.natural}</b> 个自然日就是${holiday.name}，通常能放 ${holiday.daysOff} 天，已经能看到一点光了`,
    `${holiday.name}正在加载中：<b>${holiday.workday}</b> 个工作日后，允许暂时从工位撤退`,
    `离${holiday.name}不算远了，<b>${holiday.natural}</b> 个自然日后给自己安排点真正的休息`,
    `下一站${holiday.name}，通常 ${holiday.daysOff} 天假，软团先帮你把盼头记上`
  ]);
}

export function formatDuration(ms: number, withSeconds = true) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let time = "";
  if (hours > 0) time += `${hours}小时`;
  if (minutes > 0 || hours > 0) time += `${minutes}分`;
  if (withSeconds) time += `${seconds}秒`;
  return days > 0 ? `${days}天${time}` : time;
}

export function getCountdowns(current: Date, endTime: string, payday: number) {
  const end = new Date(current);
  const [hour = "18", minute = "30"] = endTime.split(":");
  end.setHours(Number(hour), Number(minute), 0, 0);
  const offWorkMs = Math.max(0, end.getTime() - current.getTime());
  const isOffWork = current >= end;
  const saturday = new Date(current);
  const daysUntilSaturday = (6 - saturday.getDay() + 7) % 7;
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const paydayDate = new Date(current.getFullYear(), current.getMonth(), Math.min(28, payday));
  if (paydayDate < current) paydayDate.setMonth(paydayDate.getMonth() + 1);
  const nextHoliday = getNextHoliday(current);
  return {
    offWorkMs,
    offWorkText: isOffWork ? "已经下班" : formatDuration(offWorkMs),
    isOffWork,
    saturday: getWorkdayGap(current, saturday),
    saturdayText: daysUntilSaturday === 0 ? "今天是周六" : `离周六 <b>${daysUntilSaturday}</b> 天`,
    holiday: getWorkdayGap(current, paydayDate),
    nextHoliday,
    paydayLabel: `${paydayDate.getMonth() + 1}月${paydayDate.getDate()}日发薪`
  };
}
