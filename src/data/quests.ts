/**
 * 每日任务：任务池 + 按日期确定性的每日三题抽取。
 * 进度通过 trackQuest(metric) 在业务动作处累计，达成后手动领取爪币奖励。
 */
import type { WageClawState } from "@/types";

export type QuestMetric =
  | "claim"
  | "touch"
  | "stretch"
  | "minigame"
  | "purchase"
  | "feed"
  | "refine"
  | "useItem"
  | "wishPart";

export const questMetricLabels: Record<QuestMetric, string> = {
  claim: "领工资",
  touch: "抚摸桌宠",
  stretch: "健康提醒打卡",
  minigame: "小游戏",
  purchase: "商城购物",
  feed: "投喂桌宠",
  refine: "炼化糟心事",
  useItem: "使用物品",
  wishPart: "点亮心愿碎片"
};

export type DailyQuest = {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: QuestMetric;
  target: number;
  reward: number;
};

export const questPool: DailyQuest[] = [
  { id: "q-claim", name: "落袋为安", description: "领取 1 次今日工资", icon: "🪙", metric: "claim", target: 1, reward: 8 },
  { id: "q-touch5", name: "顺毛五连", description: "抚摸桌宠 5 次", icon: "🖐️", metric: "touch", target: 5, reward: 6 },
  { id: "q-touch15", name: "摸鱼高手", description: "抚摸桌宠 15 次", icon: "🐱", metric: "touch", target: 15, reward: 12 },
  { id: "q-stretch", name: "工位养生局", description: "完成 2 次健康提醒打卡", icon: "🧘", metric: "stretch", target: 2, reward: 8 },
  { id: "q-minigame", name: "解压一下", description: "完成 1 局桌面小游戏", icon: "🎮", metric: "minigame", target: 1, reward: 10 },
  { id: "q-minigame3", name: "三局两胜", description: "完成 3 局桌面小游戏", icon: "🕹️", metric: "minigame", target: 3, reward: 18 },
  { id: "q-purchase", name: "今天买点好的", description: "在商城购买 1 次商品", icon: "🛒", metric: "purchase", target: 1, reward: 8 },
  { id: "q-feed", name: "投喂时间", description: "给桌宠投喂 1 次", icon: "🍡", metric: "feed", target: 1, reward: 6 },
  { id: "q-refine", name: "变废为怨", description: "炼化 1 次糟心事", icon: "🔥", metric: "refine", target: 1, reward: 8 },
  { id: "q-useitem", name: "背包管理员", description: "使用 2 次背包物品", icon: "🎒", metric: "useItem", target: 2, reward: 8 },
  { id: "q-wishpart", name: "点亮一块", description: "点亮 1 块心愿碎片", icon: "🧩", metric: "wishPart", target: 1, reward: 15 }
];

export const questIds = new Set(questPool.map((quest) => quest.id));

/** 按日期做确定性抽取：同一天所有窗口抽到同一组任务 */
export function pickDailyQuests(dateKey: string, count = 3): DailyQuest[] {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const pool = [...questPool];
  const picked: DailyQuest[] = [];
  while (picked.length < count && pool.length > 0) {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    const index = Math.abs(hash) % pool.length;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export type QuestView = DailyQuest & {
  current: number;
  claimable: boolean;
  claimed: boolean;
};

/** 组装今日任务的视图数据（进度、是否可领、是否已领） */
export function buildDailyQuestViews(state: WageClawState): QuestView[] {
  const progress = state.dailyQuests?.progress ?? {};
  const claimed = new Set(state.dailyQuests?.claimed ?? []);
  return pickDailyQuests(state.dailyQuests?.date ?? "").map((quest) => {
    const current = Math.min(quest.target, progress[quest.metric] ?? 0);
    return {
      ...quest,
      current,
      claimed: claimed.has(quest.id),
      claimable: !claimed.has(quest.id) && current >= quest.target
    };
  });
}
