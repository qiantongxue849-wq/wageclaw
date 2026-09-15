/**
 * 默认状态与默认交互提示词：新档工厂函数集中在这里。
 */
import type { InteractionPromptItem, InteractionPromptSettings, NewsApiSource, WageClawState } from "@/types";
import { createDailyPetGrowth } from "@/composables/petDailyGrowth";
import { cloneNewsSource, clonePromptItem, getLocalDateKey } from "@/utils/core";
import { createDailyPawLedger, createMonthlyPawLedger } from "@/state/paw-ledger";
import {
  BLOOD_PRESSURE_IDEAL,
  DEFAULT_END_TIME,
  DEFAULT_PAYDAY,
  DEFAULT_PET_FOCUS_REMINDER_MINUTES,
  DEFAULT_SEDENTARY_REMINDER_MINUTES,
  DEFAULT_START_TIME
} from "@/state/tuning";

export const defaultHealthPrompts: InteractionPromptItem[] = [
  {
    id: "health-water",
    label: "喝水",
    text: "先喝一口水，回来再和这个世界继续周旋。",
    weight: 4,
    enabled: true
  },
  {
    id: "health-shoulder",
    label: "肩颈",
    text: "肩膀放下来十秒，别让工位偷走你的脖子。",
    weight: 4,
    enabled: true
  },
  {
    id: "health-eye",
    label: "眼睛",
    text: "眨眼三次，看远处二十秒，屏幕不会因为你喘口气就跑路。",
    weight: 3,
    enabled: true
  },
  {
    id: "health-focus",
    label: "专注复位",
    text: "把最烦的一件事写成一句话，先把它从脑子里拿出来。",
    weight: 2,
    enabled: true
  }
];
export const defaultClockPrompts: InteractionPromptItem[] = [
  {
    id: "clock-offwork",
    label: "下班雷达",
    text: "下班雷达：距离下班还有 <b>{offWork}</b>，今天已扛 <b>{worked}</b>。",
    weight: 5,
    enabled: true
  },
  {
    id: "clock-wallet",
    label: "工资回收",
    text: "到账播报：本班已炼成 <b class=\"gold\">{earned}</b>，每一分钟都在回收选择权。",
    weight: 4,
    enabled: true
  },
  {
    id: "clock-paw",
    label: "爪账",
    text: "摸鱼爪账：今天已赚 <b>{pawToday}</b>，余额 {pawBalance}。",
    weight: 3,
    enabled: true
  },
  {
    id: "clock-wish",
    label: "心愿雷达",
    text: "心愿「{wish}」完成 <b>{wishPercent}%</b>，还差 {wishRemaining}。",
    weight: 3,
    enabled: true
  }
];
export const defaultTouchPrompts: InteractionPromptItem[] = [
  {
    id: "touch-soft",
    label: "温和反馈",
    text: "{touch}成功，软团进入「{mood}」状态。",
    weight: 4,
    enabled: true
  },
  {
    id: "touch-heat",
    label: "热度提醒",
    text: "触摸会累积热度，软团喜欢你，但也需要一点点缓冲。",
    weight: 2,
    enabled: true
  },
  {
    id: "touch-paw",
    label: "爪币反馈",
    text: "这次互动顺手记进爪账：{pawGain}。",
    weight: 2,
    enabled: true
  }
];
export const defaultNewsSources: NewsApiSource[] = [
  {
    id: "gdelt-doc",
    name: "GDELT DOC 2.0 全球新闻",
    url: "https://api.gdeltproject.org/api/v2/doc/doc?query=workplace%20OR%20technology&mode=ArtList&format=json&maxrecords=10",
    enabled: true,
    weight: 5,
    apiKeyHeader: "",
    apiKeyValue: "",
    note: "公开全球新闻开放数据，无需默认密钥。"
  }
];


export function createDefaultInteractionPrompts(): InteractionPromptSettings {
  return {
    healthPrompts: defaultHealthPrompts.map(clonePromptItem),
    clockPrompts: defaultClockPrompts.map(clonePromptItem),
    touchPrompts: defaultTouchPrompts.map(clonePromptItem),
    newsEnabled: true,
    newsSources: defaultNewsSources.map(cloneNewsSource)
  };
}

export function createDefaultState(): WageClawState {
  return {
    nickname: "工位逃兵",
    onboardingDone: false,
    salary: 0,
    wish: "",
    price: 0,
    rageMinutes: 0,
    mood: "rage",
    theme: "forest",
    petStyle: "capybaraZen",
    countMode: "natural",
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    payday: DEFAULT_PAYDAY,
    walletBalance: 0,
    rageBalance: 0,
    pawBalance: 0,
    dailyRage: {
      date: getLocalDateKey(),
      value: 0,
      triggered: []
    },
    dailyPaw: createDailyPawLedger(),
    monthlyPaw: createMonthlyPawLedger(),
    dailyPetGrowth: createDailyPetGrowth(getLocalDateKey()),
    activeWorkEventId: "",
    lastClaimTime: "",
    activeWishId: "",
    unlockedParts: [],
    inventory: {},
    earnedGoods: [],
    pet: {
      name: "怨息雾团",
      rage: 0,
      growth: 0,
      light: 0,
      mana: 46,
      manaBonus: 0,
      cultivation: 0,
      satiety: 56,
      affection: 40,
      bloodPressure: BLOOD_PRESSURE_IDEAL,
      summoned: false,
      gameBest: 0,
      lastLine: "把今天吞下去的那口气给我，我会慢慢长成能保护你的样子。",
      lastAmbientPeriod: "",
      touchCount: 0,
      touchHeat: 0,
      touchMood: "乖巧待机",
      battleWins: 0,
      battleLosses: 0,
      battleBestCombo: 0,
      lastBusinessHint: "",
      lastInteractionAt: Date.now()
    },
    transactions: [],
    pawLedger: [],
    usageLog: [],
    petLog: [],
    transactionFilter: "all",
    mallFilter: "all",
    privacyMode: false,
    sedentaryReminderEnabled: true,
    sedentaryReminderMinutes: DEFAULT_SEDENTARY_REMINDER_MINUTES,
    petFocusReminderEnabled: true,
    petFocusReminderMinutes: DEFAULT_PET_FOCUS_REMINDER_MINUTES,
    lastStretchAt: Date.now(),
    lastSedentaryReminderAt: 0,
    lastPetFocusReminderAt: 0,
    interactionPrompts: createDefaultInteractionPrompts(),
    achievements: [],
    dailyQuests: {
      date: getLocalDateKey(),
      progress: {},
      claimed: []
    }
  };
}

export function createFirstRunState(): WageClawState {
  const state = createDefaultState();
  state.transactions = [];
  state.pawLedger = [];
  state.usageLog = [];
  state.petLog = [];
  return state;
}
