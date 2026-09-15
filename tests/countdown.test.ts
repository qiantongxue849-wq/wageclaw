import { describe, expect, it } from "vitest";
import { buildHolidayLine, formatDuration, getCountdowns, getNextHoliday, getWorkdayGap, getWorkdaysInMonth } from "@/utils/countdown";

describe("utils/countdown", () => {
  it("getWorkdaysInMonth 排除周末", () => {
    // 2026 年 9 月共 30 天，周末 8 天（9/5,6,12,13,19,20,26,27）→ 22 个工作日
    expect(getWorkdaysInMonth(2026, 8)).toBe(22);
    // 2026 年 2 月 28 天，周末 8 天 → 20 个工作日
    expect(getWorkdaysInMonth(2026, 1)).toBe(20);
  });

  it("getWorkdayGap 分别统计自然日与工作日", () => {
    const gap = getWorkdayGap(new Date(2026, 7, 31), new Date(2026, 8, 4)); // 周一 8/31 → 周五 9/4
    expect(gap.natural).toBe(4);
    expect(gap.workday).toBe(4);
    const overWeekend = getWorkdayGap(new Date(2026, 8, 4), new Date(2026, 8, 7)); // 周五 → 下周一
    expect(overWeekend.natural).toBe(3);
    expect(overWeekend.workday).toBe(1);
  });

  it("getNextHoliday 返回今天及之后的下一个法定假日", () => {
    const holiday = getNextHoliday(new Date(2026, 0, 20)); // 1/20 → 元旦已过，下一个是 2/17 春节
    expect(holiday.name).toBe("春节");
    expect(holiday.date.getMonth()).toBe(1);
    expect(holiday.date.getDate()).toBe(17);
    // 年末取次年元旦
    const nye = getNextHoliday(new Date(2026, 11, 30));
    expect(nye.name).toBe("元旦");
    expect(nye.date.getFullYear()).toBe(2027);
  });

  it("buildHolidayLine 输出包含假日名", () => {
    const holiday = getNextHoliday(new Date(2026, 8, 29)); // 国庆 10/1 前夕
    expect(buildHolidayLine(holiday)).toContain("国庆节");
  });

  it("formatDuration 人类可读时长", () => {
    expect(formatDuration(0)).toBe("0秒");
    expect(formatDuration(30 * 1000)).toBe("30秒");
    expect(formatDuration(90 * 60 * 1000)).toBe("1小时30分0秒");
    expect(formatDuration(26 * 3600 * 1000)).toBe("1天2小时0分0秒");
    expect(formatDuration(90 * 60 * 1000, false)).toBe("1小时30分");
  });

  it("getCountdowns 汇总下班/发薪/假日信息", () => {
    // 工作时间内
    const onShift = getCountdowns(new Date(2026, 7, 5, 14, 0), "18:00", 15);
    expect(onShift.isOffWork).toBe(false);
    expect(onShift.offWorkText).toBe("4小时0分0秒");
    // 已下班
    const offShift = getCountdowns(new Date(2026, 7, 5, 19, 30), "18:00", 15);
    expect(offShift.isOffWork).toBe(true);
    expect(offShift.offWorkText).toBe("已经下班");
    // 发薪日标签
    expect(onShift.paydayLabel).toContain("发薪");
    expect(onShift.nextHoliday.name.length).toBeGreaterThan(0);
  });
});
