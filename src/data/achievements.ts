/**
 * 成就殿堂：全部成就用「数据 + 判定函数」描述，新增成就只需在本文件加一条。
 * 判定值一律从存档可推导的字段读取，不引入额外计数器，避免存档迁移负担。
 */
import type { WageClawState } from "@/types";

export type AchievementCategory = "salary" | "rage" | "pet" | "games" | "wish";

export const achievementCategories: Record<AchievementCategory, { label: string; icon: string }> = {
  salary: { label: "忍耐资产", icon: "🏦" },
  rage: { label: "怨气修行", icon: "🔥" },
  pet: { label: "软团养成", icon: "🐾" },
  games: { label: "桌面战绩", icon: "🎮" },
  wish: { label: "心愿陈列", icon: "🎁" }
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** 解锁一次性爪币奖励 */
  reward: number;
  target: number;
  value: (state: WageClawState) => number;
};

function sumIncome(state: WageClawState): number {
  return state.transactions
    .filter((item) => item.category === "income" && item.amount > 0)
    .reduce((total, item) => total + item.amount, 0);
}

export const achievements: Achievement[] = [
  // ── 忍耐资产 ──
  { id: "first-claim", name: "第一桶忍耐金", description: "第一次把今日工资领进钱包", icon: "🪙", category: "salary", reward: 5, target: 1, value: (s) => (s.lastClaimTime ? 1 : 0) },
  { id: "income-50k", name: "五万忍耐金", description: "累计领取工资 ¥50,000", icon: "💵", category: "salary", reward: 30, target: 50_000, value: sumIncome },
  { id: "income-500k", name: "半百万俱乐部", description: "累计领取工资 ¥500,000", icon: "💰", category: "salary", reward: 120, target: 500_000, value: sumIncome },
  { id: "wallet-5000", name: "存下了一笔", description: "工资余额同时握有 ¥5,000", icon: "🏦", category: "salary", reward: 40, target: 5_000, value: (s) => Math.max(0, s.walletBalance) },

  // ── 怨气修行 ──
  { id: "daily-rage-50", name: "今日怨气有点多", description: "单日怨气积累到 50", icon: "😤", category: "rage", reward: 8, target: 50, value: (s) => s.dailyRage.value },
  { id: "daily-rage-300", name: "怨气行精通关", description: "单日怨气积累到 300", icon: "🌋", category: "rage", reward: 45, target: 300, value: (s) => s.dailyRage.value },
  { id: "rage-balance-2000", name: "怨气银行家", description: "怨气余额攒到 2000", icon: "🔥", category: "rage", reward: 60, target: 2_000, value: (s) => s.rageBalance },
  { id: "overtime-120", name: "被折磨两小时", description: "今日被折磨时长达到 120 分钟", icon: "⏳", category: "rage", reward: 15, target: 120, value: (s) => s.rageMinutes },

  // ── 软团养成 ──
  { id: "growth-1000", name: "软团长大了", description: "桌宠累计成长值达到 1000", icon: "🌱", category: "pet", reward: 25, target: 1_000, value: (s) => s.pet.growth },
  { id: "affection-80", name: "双向奔赴", description: "桌宠亲密度达到 80", icon: "💞", category: "pet", reward: 30, target: 80, value: (s) => s.pet.affection },
  { id: "touch-100", name: "百摸之手", description: "累计抚摸桌宠 100 次", icon: "🖐️", category: "pet", reward: 20, target: 100, value: (s) => s.pet.touchCount },
  { id: "light-200", name: "灵光乍现", description: "桌宠灵光值达到 200", icon: "✨", category: "pet", reward: 35, target: 200, value: (s) => s.pet.light },
  { id: "cultivation-5", name: "五重修炼", description: "桌宠修炼达到第 5 重", icon: "🧘", category: "pet", reward: 50, target: 5, value: (s) => s.pet.cultivation },
  { id: "calm-bp", name: "血压稳如老狗", description: "把血压维持在理想值 118 以下", icon: "🩺", category: "pet", reward: 25, target: 1, value: (s) => (s.pet.bloodPressure <= 118 ? 1 : 0) },

  // ── 桌面战绩 ──
  { id: "battle-win-1", name: "初次反击", description: "在桌面切磋中赢下老板怨念体", icon: "🥊", category: "games", reward: 10, target: 1, value: (s) => s.pet.battleWins },
  { id: "battle-win-10", name: "怨念体克星", description: "累计战胜老板怨念体 10 场", icon: "🏆", category: "games", reward: 50, target: 10, value: (s) => s.pet.battleWins },
  { id: "combo-8", name: "连击艺术家", description: "单场连击达到 8", icon: "🎯", category: "games", reward: 30, target: 8, value: (s) => s.pet.battleBestCombo },
  { id: "runner-300", name: "怨气闯关高手", description: "怨气闯关单局得分达到 300", icon: "🏃", category: "games", reward: 40, target: 300, value: (s) => s.pet.gameBest },

  // ── 心愿陈列 ──
  { id: "first-part", name: "第一块碎片", description: "点亮心愿的第一个碎片", icon: "🧩", category: "wish", reward: 10, target: 1, value: (s) => s.unlockedParts.length },
  { id: "all-parts", name: "拼出完整心愿", description: "点亮当前心愿的全部碎片（6 块）", icon: "🧷", category: "wish", reward: 60, target: 6, value: (s) => s.unlockedParts.length },
  { id: "first-realized", name: "心愿毕业礼", description: "第一件心愿礼物从工资进度毕业", icon: "🎓", category: "wish", reward: 40, target: 1, value: (s) => s.earnedGoods.length },
  { id: "realized-3", name: "心愿收藏家", description: "攒齐 3 件已实现心愿", icon: "🖼️", category: "wish", reward: 100, target: 3, value: (s) => s.earnedGoods.length },
  { id: "variety-inventory", name: "补给小仓库", description: "背包里囤过 5 种不同物品", icon: "📦", category: "wish", reward: 20, target: 5, value: (s) => Object.keys(s.inventory).length },
  { id: "usage-20", name: "物尽其用", description: "累计使用背包物品 20 次", icon: "🧰", category: "wish", reward: 25, target: 20, value: (s) => s.usageLog.length }
];

export const achievementIds = new Set(achievements.map((item) => item.id));

/** 与存档比对，返回全部已解锁 ID 与本次新解锁的成就 */
export function evaluateAchievements(state: WageClawState): { unlocked: string[]; newly: Achievement[] } {
  const owned = new Set(state.achievements);
  const unlocked: string[] = [];
  const newly: Achievement[] = [];
  for (const item of achievements) {
    if (owned.has(item.id)) {
      unlocked.push(item.id);
      continue;
    }
    if (item.value(state) >= item.target) {
      unlocked.push(item.id);
      newly.push(item);
    }
  }
  return { unlocked, newly };
}
