/**
 * 存档净化：把任意来源（旧版本/损坏 JSON）的存档修整为合法 WageClawState。
 */
import type {
  CountMode,
  EarnedGood,
  InteractionPromptItem,
  InteractionPromptSettings,
  Mood,
  NewsApiSource,
  PawLedgerBucket,
  PawLedgerItem,
  Transaction,
  WageClawState
} from "@/types";
import { mallItems } from "@/data/items";
import { modeLabels, moodCopy, themeLabels } from "@/data/labels";
import { petStageSeries } from "@/data/pets";
import { workEvents } from "@/data/events";
import { parts } from "@/data/wishes";
import { getDailyPetGrowthTotal, normalizeDailyPetGrowth } from "@/composables/petDailyGrowth";
import { achievementIds } from "@/data/achievements";
import { questIds } from "@/data/quests";
import type { DailyQuestState } from "@/types";
import { createDefaultState, createFirstRunState, defaultClockPrompts, defaultHealthPrompts, defaultNewsSources, defaultTouchPrompts } from "@/state/defaults";
import {
  DEFAULT_END_TIME,
  DEFAULT_PAYDAY,
  DEFAULT_PET_FOCUS_REMINDER_MINUTES,
  DEFAULT_SEDENTARY_REMINDER_MINUTES,
  DEFAULT_START_TIME,
  LEGACY_DEFAULT_END_TIME,
  LEGACY_DEFAULT_PAYDAY,
  LEGACY_DEFAULT_START_TIME,
  PET_MANA_BONUS_MAX,
  legacyIphone16PartIds,
  LOG_CAPS
} from "@/state/tuning";
import { getDailyPawEarned, normalizeDailyPawLedger, normalizeMonthlyPawLedger } from "@/state/paw-ledger";
import { clamp, getCurrentMonthKey, getLocalDateKey } from "@/utils/core";
import { normalizeBloodPressure } from "@/utils/vitals";

export function sanitizeState(input: unknown): WageClawState {
  const base = createDefaultState();
  if (!input || typeof input !== "object") return createFirstRunState();
  const stored = input as Partial<WageClawState>;
  const storedPet = (stored.pet || {}) as Partial<WageClawState["pet"]> & { hunger?: number };
  const { hunger: legacyHunger, ...storedPetWithoutLegacy } = storedPet;
  const dailyPaw = normalizeDailyPawLedger(stored.dailyPaw, base.dailyPaw);
  const today = getLocalDateKey();
  const hasDailyGrowthState = Boolean(stored.dailyPetGrowth);
  const dailyPetGrowth = normalizeDailyPetGrowth(stored.dailyPetGrowth, today);
  const currentMonth = getCurrentMonthKey();
  const monthlyPawFallback = {
    ...base.monthlyPaw,
    earned: dailyPaw.date.startsWith(currentMonth) ? getDailyPawEarned(dailyPaw) : 0
  };
  const merged: WageClawState = {
    ...base,
    ...stored,
    pet: { ...base.pet, ...storedPetWithoutLegacy },
    dailyRage: { ...base.dailyRage, ...(stored.dailyRage || {}) },
    dailyPaw,
    monthlyPaw: normalizeMonthlyPawLedger(stored.monthlyPaw, monthlyPawFallback),
    dailyPetGrowth,
    inventory: { ...base.inventory, ...(stored.inventory || {}) },
    unlockedParts: Array.isArray(stored.unlockedParts) ? stored.unlockedParts.filter((id) => parts.some((part) => part.id === id)) : base.unlockedParts,
    earnedGoods: Array.isArray(stored.earnedGoods) ? stored.earnedGoods.map(normalizeEarnedGood) : base.earnedGoods,
    transactions: Array.isArray(stored.transactions) ? stored.transactions.map(normalizeTransaction) : [],
    pawLedger: Array.isArray(stored.pawLedger) ? stored.pawLedger.map(normalizePawLedgerItem) : [],
    usageLog: Array.isArray(stored.usageLog) ? stored.usageLog : [],
    petLog: Array.isArray(stored.petLog) ? stored.petLog : []
  };
  const legacySatiety = Number(legacyHunger);
  const storedSatiety = Number(storedPetWithoutLegacy.satiety);
  merged.pet.satiety = clamp(Number.isFinite(legacySatiety) ? legacySatiety : Number.isFinite(storedSatiety) ? storedSatiety : base.pet.satiety, 0, 100);
  merged.pet.affection = clamp(Number(merged.pet.affection) || 0, 0, 100);
  merged.pet.bloodPressure = normalizeBloodPressure(merged.pet.bloodPressure, base.pet.bloodPressure);
  merged.pet.rage = Math.max(0, Number(merged.pet.rage) || 0);
  merged.pet.growth = hasDailyGrowthState ? getDailyPetGrowthTotal(dailyPetGrowth) : 0;
  merged.pet.manaBonus = clamp(Number(merged.pet.manaBonus) || 0, 0, PET_MANA_BONUS_MAX);
  merged.pet.lastInteractionAt = normalizeTimestamp(merged.pet.lastInteractionAt);
  if (merged.activeWishId === "iphone17_pro_max_1tb" && merged.unlockedParts.some((id) => legacyIphone16PartIds.includes(id))) {
    merged.activeWishId = "iphone16_pro_max_1tb";
  }
  const storedWishName = typeof stored.wish === "string" ? stored.wish.trim() : "";
  const wishedItem = mallItems.find((item) => item.id === merged.activeWishId && item.kind === "physical")
    || (storedWishName ? mallItems.find((item) => item.kind === "physical" && item.name === storedWishName) : undefined);
  merged.activeWishId = wishedItem?.id || "";
  merged.wish = wishedItem?.name || "";
  merged.price = wishedItem?.price || 0;
  merged.unlockedParts = merged.unlockedParts.filter((id) => parts.some((part) => part.id === id && part.wishItemId === merged.activeWishId));
  merged.salary = Math.max(0, Number(merged.salary) || 0);
  merged.price = Math.max(0, Number(merged.price) || 0);
  merged.rageMinutes = Math.max(0, Number(merged.rageMinutes) || 0);
  merged.walletBalance = Number(merged.walletBalance) || 0;
  merged.rageBalance = Math.max(0, Number(merged.rageBalance) || 0);
  merged.pawBalance = Math.max(0, Number(stored.pawBalance ?? stored.rageBalance ?? merged.pawBalance) || 0);
  if (!Array.isArray(stored.pawLedger)) {
    merged.pawLedger = merged.pawBalance > 0
      ? [{
          id: crypto.randomUUID(),
          title: "当前爪币余额",
          amount: merged.pawBalance,
          note: "从旧版本小金库迁入",
          time: "刚刚",
          bucket: "event",
          date: getLocalDateKey()
        }]
      : [];
  }
  const hasLegacyDefaultWorkTime = stored.startTime === LEGACY_DEFAULT_START_TIME && stored.endTime === LEGACY_DEFAULT_END_TIME;
  merged.startTime = hasLegacyDefaultWorkTime ? DEFAULT_START_TIME : normalizeClockTime(merged.startTime, base.startTime);
  merged.endTime = hasLegacyDefaultWorkTime ? DEFAULT_END_TIME : normalizeClockTime(merged.endTime, base.endTime);
  merged.payday = Math.min(31, Math.max(1, Number(merged.payday) || DEFAULT_PAYDAY));
  if (Number(stored.payday) === LEGACY_DEFAULT_PAYDAY) {
    merged.payday = DEFAULT_PAYDAY;
  }
  merged.theme = (Object.keys(themeLabels).includes(merged.theme) ? merged.theme : "forest") as WageClawState["theme"];
  merged.petStyle = (Object.keys(petStageSeries).includes(merged.petStyle) ? merged.petStyle : "rageBlob") as WageClawState["petStyle"];
  merged.countMode = (Object.keys(modeLabels).includes(merged.countMode) ? merged.countMode : "natural") as CountMode;
  merged.mood = (Object.keys(moodCopy).includes(merged.mood) ? merged.mood : "rage") as Mood;
  merged.privacyMode = Boolean(merged.privacyMode);
  merged.sedentaryReminderEnabled = stored.sedentaryReminderEnabled !== false;
  merged.sedentaryReminderMinutes = clamp(Math.round(Number(merged.sedentaryReminderMinutes) || DEFAULT_SEDENTARY_REMINDER_MINUTES), 20, 180);
  merged.petFocusReminderEnabled = stored.petFocusReminderEnabled !== false;
  merged.petFocusReminderMinutes = clamp(Math.round(Number(merged.petFocusReminderMinutes) || DEFAULT_PET_FOCUS_REMINDER_MINUTES), 15, 180);
  merged.lastStretchAt = normalizeTimestamp(merged.lastStretchAt);
  merged.lastSedentaryReminderAt = Number(merged.lastSedentaryReminderAt) > 0 ? Number(merged.lastSedentaryReminderAt) : 0;
  merged.lastPetFocusReminderAt = Number(merged.lastPetFocusReminderAt) > 0 ? Number(merged.lastPetFocusReminderAt) : 0;
  const prompts = (stored.interactionPrompts || {}) as Partial<InteractionPromptSettings>;
  merged.interactionPrompts = {
    healthPrompts: normalizePromptList(prompts.healthPrompts, defaultHealthPrompts),
    clockPrompts: normalizePromptList(prompts.clockPrompts, defaultClockPrompts),
    touchPrompts: normalizePromptList(prompts.touchPrompts, defaultTouchPrompts),
    newsEnabled: prompts.newsEnabled !== false,
    newsSources: normalizeNewsSources(prompts.newsSources)
  };
  merged.achievements = Array.isArray(stored.achievements)
    ? stored.achievements.filter((id) => achievementIds.has(id))
    : [];
  const storedQuests = (stored.dailyQuests || {}) as Partial<DailyQuestState>;
  merged.dailyQuests = {
    date: typeof storedQuests.date === "string" && storedQuests.date ? storedQuests.date : getLocalDateKey(),
    progress: storedQuests.progress && typeof storedQuests.progress === "object" ? { ...storedQuests.progress } : {},
    claimed: Array.isArray(storedQuests.claimed) ? storedQuests.claimed.filter((id) => questIds.has(id)) : []
  };
  merged.onboardingDone = typeof stored.onboardingDone === "boolean"
    ? stored.onboardingDone
    : Boolean(merged.salary > 0 && merged.startTime && merged.endTime && merged.activeWishId);
  if (!merged.dailyRage.triggered) merged.dailyRage.triggered = [];
  if (merged.activeWorkEventId && !workEvents.some((event) => event.id === merged.activeWorkEventId)) {
    merged.activeWorkEventId = "";
  }
  // 日志类列表统一裁剪到上限，防止外部来源（旧档/导入/手工改档）撑爆存档
  merged.transactions = merged.transactions.slice(0, LOG_CAPS.transactions);
  merged.pawLedger = merged.pawLedger.slice(0, LOG_CAPS.pawLedger);
  merged.petLog = merged.petLog.slice(0, LOG_CAPS.petLog);
  merged.usageLog = merged.usageLog.slice(0, LOG_CAPS.usageLog);
  return merged;
}

export function normalizeTransaction(item: Partial<Transaction>): Transaction {
  return {
    id: item.id || crypto.randomUUID(),
    title: item.title || "未命名交易",
    amount: Number(item.amount) || 0,
    note: item.note || "",
    time: item.time || "刚刚",
    date: item.date || getLocalDateKey(),
    category: item.category || "expense"
  };
}

export function normalizePawLedgerItem(item: Partial<PawLedgerItem>): PawLedgerItem {
  const bucket = item.bucket && ["attendance", "interaction", "event", "supply"].includes(item.bucket)
    ? item.bucket
    : "event";
  return {
    id: item.id || crypto.randomUUID(),
    title: item.title || "爪币变动",
    amount: Number(item.amount) || 0,
    note: item.note || "",
    time: item.time || "刚刚",
    date: item.date || getLocalDateKey(),
    bucket: bucket as PawLedgerBucket
  };
}

export function normalizeEarnedGood(item: Partial<EarnedGood>): EarnedGood {
  const itemId = item.itemId || "macbook_pro_14";
  const mallItem = mallItems.find((entry) => entry.id === itemId);
  return {
    id: item.id || crypto.randomUUID(),
    itemId,
    name: item.name || mallItem?.name || "MacBook Pro 14",
    icon: item.icon || mallItem?.icon || "💻",
    amount: Math.max(0, Number(item.amount) || mallItem?.price || 0),
    source: item.source || "忍耐白捡",
    time: item.time || "刚刚"
  };
}

export function normalizeClockTime(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return fallback;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function normalizeTimestamp(value: unknown, fallback = Date.now()) {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function normalizePromptList(input: unknown, defaults: InteractionPromptItem[]): InteractionPromptItem[] {
  const stored = Array.isArray(input) ? input : [];
  const seen = new Set<string>();
  const normalize = (item: Partial<InteractionPromptItem>, fallback?: InteractionPromptItem): InteractionPromptItem | null => {
    const id = String(item.id || fallback?.id || crypto.randomUUID());
    if (seen.has(id)) return null;
    const text = String(item.text ?? fallback?.text ?? "").trim();
    if (!text) return null;
    seen.add(id);
    return {
      id,
      label: String(item.label ?? fallback?.label ?? "自定义").trim() || "自定义",
      text,
      weight: clamp(Math.round(Number(item.weight ?? fallback?.weight ?? 1) || 1), 1, 12),
      enabled: item.enabled ?? fallback?.enabled ?? true,
      custom: Boolean(item.custom ?? fallback?.custom)
    };
  };
  const defaultMap = new Map(defaults.map((item) => [item.id, item]));
  const merged = stored
    .map((item) => normalize(item as Partial<InteractionPromptItem>, defaultMap.get(String((item as Partial<InteractionPromptItem>)?.id || ""))))
    .filter((item): item is InteractionPromptItem => Boolean(item));
  for (const item of defaults) {
    if (!seen.has(item.id)) {
      const normalized = normalize(item, item);
      if (normalized) merged.push(normalized);
    }
  }
  return merged;
}

export function normalizeNewsSources(input: unknown): NewsApiSource[] {
  const stored = Array.isArray(input) ? input : [];
  const seen = new Set<string>();
  const normalize = (item: Partial<NewsApiSource>, fallback?: NewsApiSource): NewsApiSource | null => {
    const id = String(item.id || fallback?.id || crypto.randomUUID());
    if (seen.has(id)) return null;
    const url = String(item.url ?? fallback?.url ?? "").trim();
    if (!/^https?:\/\//i.test(url)) return null;
    seen.add(id);
    return {
      id,
      name: String(item.name ?? fallback?.name ?? "新闻源").trim() || "新闻源",
      url,
      enabled: item.enabled ?? fallback?.enabled ?? true,
      weight: clamp(Math.round(Number(item.weight ?? fallback?.weight ?? 1) || 1), 1, 12),
      apiKeyHeader: String(item.apiKeyHeader ?? fallback?.apiKeyHeader ?? "").trim(),
      apiKeyValue: String(item.apiKeyValue ?? fallback?.apiKeyValue ?? "").trim(),
      note: String(item.note ?? fallback?.note ?? "").trim(),
      custom: Boolean(item.custom ?? fallback?.custom)
    };
  };
  const defaultMap = new Map(defaultNewsSources.map((item) => [item.id, item]));
  const merged = stored
    .map((item) => normalize(item as Partial<NewsApiSource>, defaultMap.get(String((item as Partial<NewsApiSource>)?.id || ""))))
    .filter((item): item is NewsApiSource => Boolean(item));
  for (const item of defaultNewsSources) {
    if (!seen.has(item.id)) {
      const normalized = normalize(item, item);
      if (normalized) merged.push(normalized);
    }
  }
  return merged;
}

