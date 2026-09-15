import { describe, expect, it } from "vitest";
import { sanitizeState } from "@/state/sanitize";
import { createDefaultState, createFirstRunState } from "@/state/defaults";

describe("state/sanitize", () => {
  it("空输入返回全新首启存档", () => {
    const state = sanitizeState(null);
    expect(state.onboardingDone).toBe(false);
    expect(state.nickname.length).toBeGreaterThan(0);
    expect(state.transactions).toEqual([]);
    expect(state.pet.satiety).toBeGreaterThanOrEqual(0);
  });

  it("非对象输入不抛错", () => {
    expect(() => sanitizeState("garbage")).not.toThrow();
    expect(() => sanitizeState(42)).not.toThrow();
    expect(sanitizeState("garbage").salary).toBe(0);
  });

  it("合法存档字段保留", () => {
    const base = createDefaultState();
    base.salary = 12345;
    base.nickname = "测试工友";
    base.onboardingDone = true;
    const restored = sanitizeState(JSON.parse(JSON.stringify(base)));
    expect(restored.salary).toBe(12345);
    expect(restored.nickname).toBe("测试工友");
    expect(restored.onboardingDone).toBe(true);
  });

  it("非法数值被收敛：负数薪资归零", () => {
    const stored = { ...createFirstRunState(), salary: -500, rageBalance: -20 };
    const restored = sanitizeState(stored);
    expect(restored.salary).toBe(0);
    expect(restored.rageBalance).toBe(0);
  });

  it("旧版 hunger 字段迁移为 satiety", () => {
    const stored = { pet: { hunger: 77 } };
    expect(sanitizeState(stored).pet.satiety).toBe(77);
  });

  it("旧版默认上下班时间迁移为新默认值", () => {
    const stored = { startTime: "09:30", endTime: "18:30" };
    const restored = sanitizeState(stored);
    expect(restored.startTime).toBe("08:30");
    expect(restored.endTime).toBe("18:00");
  });

  it("旧版 iphone16 碎片迁移到对应心愿", () => {
    const stored = { activeWishId: "iphone17_pro_max_1tb", unlockedParts: ["iphone_frame", "iphone_screen"] };
    const restored = sanitizeState(stored);
    expect(restored.activeWishId).toBe("iphone16_pro_max_1tb");
    expect(restored.unlockedParts.every((id) => id.startsWith("iphone_"))).toBe(true);
  });

  it("爪币余额从旧版怨气余额兜底（仅在 pawBalance 字段缺失时）", () => {
    expect(sanitizeState({ rageBalance: 66 }).pawBalance).toBe(66);
    // 字段存在但为 0 时尊重现值，不回退
    expect(sanitizeState({ rageBalance: 66, pawBalance: 0 }).pawBalance).toBe(0);
  });

  it("爪币账本中未知事件 ID 被剔除", () => {
    const stored = { dailyPaw: { handledEvents: ["overtime-meeting", "not-exists"] } };
    const restored = sanitizeState(stored);
    expect(restored.dailyPaw.handledEvents).toEqual(["overtime-meeting"]);
  });

  it("非法工作时间被归一化", () => {
    const restored = sanitizeState({ startTime: "25:99", endTime: "bad" });
    expect(restored.startTime).toBe("08:30");
    expect(restored.endTime).toBe("18:00");
  });
});

describe("state/sanitize · 日志条目上限", () => {
  it("超限的流水/账本/日志在净化时裁剪到上限", () => {
    const bloated = {
      transactions: Array.from({ length: 500 }, (_, i) => ({ id: `t${i}`, title: `x${i}`, amount: 1 })),
      pawLedger: Array.from({ length: 500 }, (_, i) => ({ id: `p${i}`, title: `x${i}`, amount: 1 })),
      petLog: Array.from({ length: 500 }, (_, i) => ({ title: `x${i}`, detail: "" })),
      usageLog: Array.from({ length: 500 }, (_, i) => ({ id: `u${i}`, name: `x${i}` }))
    };
    const restored = sanitizeState(bloated);
    expect(restored.transactions.length).toBe(120); // LOG_CAPS.transactions
    expect(restored.pawLedger.length).toBe(120);
    expect(restored.petLog.length).toBe(80);
    expect(restored.usageLog.length).toBe(80);
    // 保留的是最新的前 120 条（unshift 语义：索引 0 最新）
    expect(restored.transactions[0].id).toBe("t0");
    expect(restored.transactions[119].id).toBe("t119");
  });

  it("未超限的日志原样保留", () => {
    const restored = sanitizeState({ transactions: [{ id: "only", title: "一笔", amount: 9 }] });
    expect(restored.transactions).toHaveLength(1);
  });
});
