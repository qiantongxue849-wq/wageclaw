import { describe, it, expect } from "vitest";
import { createDefaultState, createFirstRunState, sanitizeState, STORAGE_KEY } from "./useWageClaw";

describe("createDefaultState", () => {
  it("returns a valid default state object", () => {
    const state = createDefaultState();
    expect(state).toBeDefined();
    expect(state.nickname).toBe("工位逃兵");
    expect(state.salary).toBe(0);
    expect(state.mood).toBe("rage");
    expect(state.theme).toBe("forest");
    expect(state.petStyle).toBe("capybaraZen");
    expect(state.privacyMode).toBe(false);
    expect(state.onboardingDone).toBe(false);
  });

  it("initializes pet with default values", () => {
    const state = createDefaultState();
    expect(state.pet.name).toBe("怨息雾团");
    expect(state.pet.rage).toBe(35);
    expect(state.pet.growth).toBe(35);
    expect(state.pet.light).toBe(0);
    expect(state.pet.satiety).toBe(56);
    expect(state.pet.affection).toBe(40);
    expect(state.pet.summoned).toBe(false);
  });

  it("initializes empty arrays and records", () => {
    const state = createDefaultState();
    expect(state.transactions).toEqual([]);
    expect(state.pawLedger).toEqual([]);
    expect(state.usageLog).toEqual([]);
    expect(state.petLog).toEqual([]);
    expect(state.unlockedParts).toEqual([]);
    expect(state.inventory).toEqual({});
    expect(state.earnedGoods).toEqual([]);
  });

  it("sets valid default constants", () => {
    const state = createDefaultState();
    expect(state.payday).toBe(15);
    expect(state.walletBalance).toBe(0);
    expect(state.rageBalance).toBe(0);
    expect(state.pawBalance).toBe(0);
  });
});

describe("createFirstRunState", () => {
  it("returns a clean state for first run", () => {
    const state = createFirstRunState();
    expect(state.transactions).toEqual([]);
    expect(state.pawLedger).toEqual([]);
    expect(state.usageLog).toEqual([]);
    expect(state.petLog).toEqual([]);
  });

  it("preserves default values from createDefaultState", () => {
    const state = createFirstRunState();
    expect(state.nickname).toBe("工位逃兵");
    expect(state.pet.name).toBe("怨息雾团");
  });
});

describe("sanitizeState", () => {
  it("returns first-run state for null input", () => {
    const state = sanitizeState(null);
    expect(state.transactions).toEqual([]);
    expect(state.salary).toBe(0);
  });

  it("returns first-run state for non-object input", () => {
    expect(sanitizeState("string").transactions).toEqual([]);
    expect(sanitizeState(42).transactions).toEqual([]);
    expect(sanitizeState(undefined).transactions).toEqual([]);
  });

  it("merges valid stored data with defaults", () => {
    const stored = {
      salary: 15000,
      nickname: "测试用户",
      walletBalance: 500
    };
    const state = sanitizeState(stored);
    expect(state.salary).toBe(15000);
    expect(state.nickname).toBe("测试用户");
    expect(state.walletBalance).toBe(500);
    expect(state.pet.name).toBe("怨息雾团"); // default preserved
  });

  it("clamps negative salary to 0", () => {
    const state = sanitizeState({ salary: -1000 });
    expect(state.salary).toBe(0);
  });

  it("clamps negative rageBalance to 0", () => {
    const state = sanitizeState({ rageBalance: -50 });
    expect(state.rageBalance).toBe(0);
  });

  it("clamps negative pawBalance to 0", () => {
    const state = sanitizeState({ pawBalance: -100 });
    expect(state.pawBalance).toBe(0);
  });

  it("validates theme falls back to forest for unknown theme", () => {
    const state = sanitizeState({ theme: "nonexistent" });
    expect(state.theme).toBe("forest");
  });

  it("preserves valid theme", () => {
    const state = sanitizeState({ theme: "arcade" });
    expect(state.theme).toBe("arcade");
  });

  it("validates petStyle falls back to rageBlob for unknown style", () => {
    const state = sanitizeState({ petStyle: "nonexistent" });
    expect(state.petStyle).toBe("rageBlob");
  });

  it("validates mood falls back to rage for unknown mood", () => {
    const state = sanitizeState({ mood: "nonexistent" });
    expect(state.mood).toBe("rage");
  });

  it("validates countMode falls back to natural", () => {
    const state = sanitizeState({ countMode: "nonexistent" });
    expect(state.countMode).toBe("natural");
  });

  it("clamps pet rage to non-negative", () => {
    const state = sanitizeState({ pet: { rage: -50 } });
    expect(state.pet.rage).toBe(0);
  });

  it("clamps pet satiety to 0-100 range", () => {
    const stateHigh = sanitizeState({ pet: { satiety: 150 } });
    expect(stateHigh.pet.satiety).toBe(100);

    const stateLow = sanitizeState({ pet: { satiety: -10 } });
    expect(stateLow.pet.satiety).toBe(0);
  });

  it("clamps pet affection to 0-100 range", () => {
    const state = sanitizeState({ pet: { affection: 200 } });
    expect(state.pet.affection).toBe(100);
  });

  it("ensures payday is between 1 and 31", () => {
    expect(sanitizeState({ payday: 0 }).payday).toBe(15); // 0 is falsy, falls back to DEFAULT_PAYDAY
    expect(sanitizeState({ payday: 40 }).payday).toBe(31); // clamped to 31
    expect(sanitizeState({ payday: 15 }).payday).toBe(15); // valid, preserved
    expect(sanitizeState({ payday: -5 }).payday).toBe(1); // negative is truthy, clamped to 1
  });

  it("handles privacyMode boolean coercion", () => {
    expect(sanitizeState({ privacyMode: true }).privacyMode).toBe(true);
    expect(sanitizeState({ privacyMode: false }).privacyMode).toBe(false);
    expect(sanitizeState({ privacyMode: "truthy" as unknown }).privacyMode).toBe(true);
  });

  it("normalizes partial transaction entries", () => {
    const state = sanitizeState({
      transactions: [
        { id: "1", title: "Test", amount: 100, time: "10:00", date: "2026-01-01", category: "income" },
        { amount: 200 }
      ]
    });
    expect(state.transactions).toHaveLength(2);
    expect(state.transactions[0].id).toBe("1");
    expect(state.transactions[1].title).toBe("未命名交易");
  });

  it("normalizes transaction with defaults", () => {
    const state = sanitizeState({
      transactions: [{ amount: 50 }]
    });
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].title).toBe("未命名交易");
    expect(state.transactions[0].category).toBe("expense");
  });

  it("handles legacy hunger to satiety migration", () => {
    const state = sanitizeState({ pet: { hunger: 75 } });
    expect(state.pet.satiety).toBe(75);
  });

  it("onboardingDone is true when salary, time, and wish are set", () => {
    const state = sanitizeState({
      salary: 10000,
      startTime: "09:00",
      endTime: "18:00",
      activeWishId: "iphone16_pro_max_1tb"
    });
    expect(state.onboardingDone).toBe(true);
  });

  it("handles dailyRage with missing triggered array", () => {
    const state = sanitizeState({ dailyRage: { date: "2026-01-01", value: 10 } });
    expect(state.dailyRage.triggered).toEqual([]);
  });
});

describe("STORAGE_KEY", () => {
  it("has the correct storage key", () => {
    expect(STORAGE_KEY).toBe("wageclaw-state-v3");
  });
});
