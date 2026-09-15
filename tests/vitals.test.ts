import { describe, expect, it } from "vitest";
import {
  adjustTouchPressureDelta,
  bloodPressurePercent,
  clampBloodPressure,
  getTouchHeatTier,
  normalizeBloodPressure,
  settleDailyBloodPressure,
  softenPositiveDelta
} from "@/utils/vitals";

describe("utils/vitals · 血压", () => {
  it("clampBloodPressure 限制在 80-180", () => {
    expect(clampBloodPressure(50)).toBe(80);
    expect(clampBloodPressure(200)).toBe(180);
    expect(clampBloodPressure(118)).toBe(118);
  });

  it("normalizeBloodPressure 兼容旧版小数值血压（<80 按 90+0.9x 折算）", () => {
    expect(normalizeBloodPressure(70)).toBe(153); // 90 + 70*0.9
    expect(normalizeBloodPressure(100)).toBe(100); // 已是收缩压口径，直通
    expect(normalizeBloodPressure("abc")).toBe(118); // 非法输入回默认
    expect(normalizeBloodPressure(undefined, 130)).toBe(130);
    expect(normalizeBloodPressure(120)).toBe(120);
  });

  it("bloodPressurePercent 相对 80-180 区间取百分比", () => {
    expect(bloodPressurePercent(80)).toBe(0);
    expect(bloodPressurePercent(180)).toBe(100);
    expect(bloodPressurePercent(130)).toBe(50);
  });

  it("settleDailyBloodPressure 高血压回落、低血压回升", () => {
    expect(settleDailyBloodPressure(160)).toBeLessThan(160);
    expect(settleDailyBloodPressure(85)).toBeGreaterThan(85);
    expect(settleDailyBloodPressure(110)).toBe(110); // 安全区不动
  });
});

describe("utils/vitals · 触摸热度", () => {
  it("getTouchHeatTier 分层阈值", () => {
    expect(getTouchHeatTier(0)).toBe("low");
    expect(getTouchHeatTier(60)).toBe("warm");
    expect(getTouchHeatTier(85)).toBe("tired");
  });

  it("softenPositiveDelta 疲劳时收益归零、发热减半", () => {
    expect(softenPositiveDelta(10, "low")).toBe(10);
    expect(softenPositiveDelta(10, "warm")).toBe(5);
    expect(softenPositiveDelta(10, "tired")).toBe(0);
    expect(softenPositiveDelta(-5, "tired")).toBe(-5);
    expect(softenPositiveDelta(Number.NaN, "low")).toBe(0);
  });

  it("adjustTouchPressureDelta 疲劳时负面血压归零、正面加压", () => {
    expect(adjustTouchPressureDelta(-2, "tired")).toBe(0);
    expect(adjustTouchPressureDelta(2, "tired")).toBe(3);
    expect(adjustTouchPressureDelta(-4, "warm")).toBe(-2);
    expect(adjustTouchPressureDelta(3, "low")).toBe(3);
  });
});
