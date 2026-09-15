import { describe, expect, it } from "vitest";
import { clamp, escapeHtml, formatMonthDay, getCurrentMonthKey, getLocalDateKey, percentOf, randomPick, timeToMinutes } from "@/utils/core";

describe("utils/core", () => {
  it("clamp 夹取数值边界", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("percentOf 归一为 0-100", () => {
    expect(percentOf(50)).toBe(50);
    expect(percentOf(5, 200)).toBe(3);
    expect(percentOf(-10)).toBe(0);
    expect(percentOf(999)).toBe(100);
    // 分母为 0 时不产生 Infinity
    expect(percentOf(10, 0)).toBe(100);
  });

  it("timeToMinutes 解析 HH:MM", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("18:05")).toBe(1085);
  });

  it("escapeHtml 转义危险字符", () => {
    expect(escapeHtml('<script src="x">\'a\'&</script>')).toBe(
      "&lt;script src=&quot;x&quot;&gt;&#39;a&#39;&amp;&lt;/script&gt;"
    );
    expect(escapeHtml(null)).toBe("");
  });

  it("日期键格式固定为补零字符串", () => {
    expect(getLocalDateKey(new Date(2026, 7, 9))).toBe("2026-08-09");
    expect(getCurrentMonthKey(new Date(2026, 11, 31))).toBe("2026-12");
  });

  it("formatMonthDay 输出中文月日", () => {
    expect(formatMonthDay(new Date(2026, 0, 3))).toBe("1月3日");
  });

  it("randomPick 返回集合内元素", () => {
    const pool = [1, 2, 3];
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(randomPick(pool));
    }
  });
});
