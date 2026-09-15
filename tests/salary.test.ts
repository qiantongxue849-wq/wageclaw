import { describe, expect, it } from "vitest";
import { getPaydayDate, getSalaryCycle } from "@/utils/salary";

describe("utils/salary", () => {
  it("发薪日超过当月天数时收敛到月末", () => {
    expect(getPaydayDate(2026, 1, 31).getDate()).toBe(28); // 2026 年 2 月
    expect(getPaydayDate(2024, 1, 31).getDate()).toBe(29); // 2024 年闰年 2 月
    expect(getPaydayDate(2026, 7, 15).getDate()).toBe(15);
  });

  it("发薪日非法输入收敛到 1 号", () => {
    expect(getPaydayDate(2026, 3, 0).getDate()).toBe(1);
    expect(getPaydayDate(2026, 3, -5).getDate()).toBe(1);
  });

  it("当前时间在发薪日之前时，周期为上月发薪日到本月发薪日", () => {
    const cycle = getSalaryCycle(new Date(2026, 2, 10, 12), 15);
    expect(cycle.start.getMonth()).toBe(1);
    expect(cycle.start.getDate()).toBe(15);
    expect(cycle.end.getMonth()).toBe(2);
    expect(cycle.end.getDate()).toBe(15);
  });

  it("当前时间在发薪日及之后时，周期从本月发薪日开始", () => {
    const cycle = getSalaryCycle(new Date(2026, 2, 20, 12), 15);
    expect(cycle.start.getDate()).toBe(15);
    expect(cycle.start.getMonth()).toBe(2);
    expect(cycle.end.getMonth()).toBe(3);
    expect(cycle.end.getDate()).toBe(15);
  });

  it("周期首尾相接：上一个周期的结束等于下一个周期的开始", () => {
    const a = getSalaryCycle(new Date(2026, 4, 3), 15);
    const b = getSalaryCycle(new Date(2026, 4, 25), 15);
    expect(a.end.getTime()).toBe(b.start.getTime());
  });
});
