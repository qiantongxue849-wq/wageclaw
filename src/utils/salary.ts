/**
 * 薪资周期纯函数：发薪日计算与周期起止。
 */

export function getPaydayDate(year: number, month: number, payday: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(lastDay, Math.max(1, Math.round(payday || 1)));
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function getSalaryCycle(current: Date, payday: number) {
  const thisPayday = getPaydayDate(current.getFullYear(), current.getMonth(), payday);
  if (current >= thisPayday) {
    return {
      start: thisPayday,
      end: getPaydayDate(current.getFullYear(), current.getMonth() + 1, payday)
    };
  }
  return {
    start: getPaydayDate(current.getFullYear(), current.getMonth() - 1, payday),
    end: thisPayday
  };
}
