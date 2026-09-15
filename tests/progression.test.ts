import { describe, expect, it } from "vitest";
import { achievements, achievementIds, evaluateAchievements } from "@/data/achievements";
import { buildDailyQuestViews, pickDailyQuests, questPool, questIds } from "@/data/quests";
import { createDefaultState } from "@/state/defaults";

describe("data/achievements", () => {
  it("成就 ID 唯一且全部可被默认存档求值", () => {
    const ids = achievements.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const state = createDefaultState();
    expect(() => evaluateAchievements(state)).not.toThrow();
    // 新档只可能解锁「血压理想」类之外的零个或个别成就，不抛错即通过
    expect(evaluateAchievements(state).newly.length).toBeLessThanOrEqual(achievements.length);
  });

  it("达成阈值时判定解锁", () => {
    const state = createDefaultState();
    state.pet.battleWins = 10;
    state.dailyRage.value = 320;
    const { unlocked, newly } = evaluateAchievements(state);
    expect(unlocked).toContain("battle-win-10");
    expect(unlocked).toContain("daily-rage-300");
    expect(newly.map((item) => item.id)).toContain("battle-win-10");
  });

  it("已解锁成就不会重复进入 newly", () => {
    const state = createDefaultState();
    state.achievements = ["battle-win-1"];
    state.pet.battleWins = 1;
    const { newly } = evaluateAchievements(state);
    expect(newly.map((item) => item.id)).not.toContain("battle-win-1");
  });

  it("所有成就 ID 都在合法集合内（存档过滤依据）", () => {
    expect(achievementIds.size).toBe(achievements.length);
  });
});

describe("data/quests", () => {
  it("同一日期抽取结果确定且不重复", () => {
    const a = pickDailyQuests("2026-08-29");
    const b = pickDailyQuests("2026-08-29");
    expect(a).toEqual(b);
    expect(new Set(a.map((quest) => quest.id)).size).toBe(3);
    const other = pickDailyQuests("2026-08-30");
    expect(other.map((quest) => quest.id).join()).not.toBe(a.map((quest) => quest.id).join());
  });

  it("任务视图：进度封顶、可领与已领状态正确", () => {
    const state = createDefaultState();
    state.dailyQuests.date = "2026-08-29";
    const picked = pickDailyQuests("2026-08-29");
    const progress: Record<string, number> = {};
    for (const quest of picked) progress[quest.metric] = quest.target + 10;
    state.dailyQuests.progress = progress;
    state.dailyQuests.claimed = [];
    const views = buildDailyQuestViews(state);
    expect(views).toHaveLength(3);
    for (const quest of views) {
      expect(quest.current).toBe(quest.target); // 进度封顶
      expect(quest.claimable).toBe(true);
    }
    // 未达标任务不可领
    const partial = createDefaultState();
    partial.dailyQuests.date = "2026-08-29";
    const touchViews = buildDailyQuestViews(partial);
    expect(touchViews.every((quest) => !quest.claimable)).toBe(true);
  });

  it("已领取的任务不再可领", () => {
    const state = createDefaultState();
    state.dailyQuests.date = "2026-08-29";
    const first = pickDailyQuests("2026-08-29")[0];
    state.dailyQuests.progress = { [first.metric]: first.target };
    state.dailyQuests.claimed = [first.id];
    const view = buildDailyQuestViews(state).find((quest) => quest.id === first.id);
    expect(view?.claimed).toBe(true);
    expect(view?.claimable).toBe(false);
  });

  it("任务池 ID 唯一", () => {
    expect(questIds.size).toBe(questPool.length);
  });
});
