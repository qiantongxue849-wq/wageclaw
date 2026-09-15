import { describe, expect, it } from "vitest";
import { createDailyPawLedger, createMonthlyPawLedger, getDailyPawEarned, normalizeDailyPawLedger, normalizeMonthlyPawLedger } from "@/state/paw-ledger";
import { getNextWorkEventAt } from "@/state/tuning";

describe("state/paw-ledger", () => {
  it("日账本初始值：三个桶都是 0，下一次事件时间在未来", () => {
    const base = Date.now();
    const ledger = createDailyPawLedger("2026-08-29", base);
    expect(ledger.attendanceEarned).toBe(0);
    expect(ledger.interactionEarned).toBe(0);
    expect(ledger.eventEarned).toBe(0);
    expect(ledger.handledEvents).toEqual([]);
    expect(ledger.nextEventAt).toBeGreaterThan(base);
  });

  it("下一次工作事件时间落在节流区间内", () => {
    const base = 1_000_000;
    const at = getNextWorkEventAt(base);
    expect(at).toBeGreaterThanOrEqual(base + 8 * 60 * 1000);
    expect(at).toBeLessThanOrEqual(base + 20 * 60 * 1000);
  });

  it("getDailyPawEarned 汇总三个非负桶", () => {
    expect(getDailyPawEarned({ date: "d", attendanceEarned: 10, interactionEarned: 5, eventEarned: -3, handledEvents: [], lastAttendanceAt: 0, nextEventAt: 0 })).toBe(15);
  });

  it("月账本归一化补齐缺失字段", () => {
    expect(normalizeMonthlyPawLedger(undefined, createMonthlyPawLedger("2026-08"))).toEqual({ month: "2026-08", earned: 0 });
    expect(normalizeMonthlyPawLedger({ month: "2026-09" }, createMonthlyPawLedger("2026-08")).month).toBe("2026-09");
    expect(normalizeMonthlyPawLedger({ earned: -5 }, createMonthlyPawLedger("2026-08")).earned).toBe(0);
  });

  it("日账本归一化丢弃非法桶值并保留回退时间", () => {
    const fallback = createDailyPawLedger("2026-08-29", 1000);
    const normalized = normalizeDailyPawLedger({ attendanceEarned: -8, eventEarned: 12 }, fallback);
    expect(normalized.attendanceEarned).toBe(0);
    expect(normalized.eventEarned).toBe(12);
    expect(normalized.lastAttendanceAt).toBe(1000);
  });
});
