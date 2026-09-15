import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { UnwrapNestedRefs } from "vue";
import type { CSSProperties } from "vue";
import {
  dailyRageMilestones,
  mallItems,
  modeLabels,
  moodCopy,
  parts,
  petStageSeries,
  petStyleLabels,
  petTouchProfiles,
  screenTitles,
  themeLabels,
  transactionCategories,
  workEvents
} from "@/data/catalog";
import { getPetAscensionView } from "@/composables/petAscension";
import {
  addDailyPetGrowth,
  createDailyPetGrowth,
  ensureDailyPetGrowth,
  PET_BROADCAST_GROWTH_CAP,
  PET_DAILY_GROWTH_MAX,
  PET_DOUBLE_CLICK_GROWTH,
  PET_PASSIVE_GROWTH_CAP,
  PET_REMINDER_GROWTH
} from "@/composables/petDailyGrowth";
import type {
  Currency,
  DailyPawLedger,
  InteractionPromptItem,
  InteractionPromptKind,
  MallItem,
  PawLedgerBucket,
  PawLedgerItem,
  PetBoost,
  ScreenKey,
  TransactionCategory,
  UsageLogItem,
  WageClawState,
  WorkEventEffect
} from "@/types";

import {
  adjustTouchPressureDelta,
  bloodPressurePercent,
  clampBloodPressure,
  getTouchHeatTier,
  settleDailyBloodPressure,
  softenPositiveDelta
} from "@/utils/vitals";
import { escapeHtml, clamp, formatMonthDay, formatTime, getCurrentMonthKey, getLocalDateKey, percentOf, randomPick, timeToMinutes } from "@/utils/core";
import { getSalaryCycle } from "@/utils/salary";
import { buildHolidayLine, formatDuration, getCountdowns, getWorkdaysInMonth } from "@/utils/countdown";
import { createDuelGame, createGomokuGame, createRunnerGame } from "@/composables/games";
import {
  BLOOD_PRESSURE_IDEAL,
  BLOOD_PRESSURE_MAX,
  DAILY_PAW_ATTENDANCE_CAP,
  DAILY_PAW_EVENT_CAP,
  DAILY_PAW_INTERACTION_CAP,
  DEFAULT_PET_FOCUS_REMINDER_MINUTES,
  DEFAULT_SEDENTARY_REMINDER_MINUTES,
  MALL_PAGE_SIZE,
  MEDICINE_BLOOD_PRESSURE_FLOOR,
  PAW_ATTENDANCE_RATE_PER_MINUTE,
  PAGE_SIZE,
  PET_MANA_BONUS_MAX,
  PET_SATIETY_DECAY_PER_SECOND,
  PET_TOUCH_HEAT_DECAY_PER_SECOND,
  RELAX_BLOOD_PRESSURE_FLOOR,
  STATE_SAVE_THROTTLE_MS,
  LOG_CAPS,
  WORK_EVENT_DAILY_LIMIT,
  getNextWorkEventAt,
} from "@/state/tuning";
import type { MallTab, PageKey, PetDelta, QuickCareAction, TouchKey } from "@/state/session-types";
import { createDailyPawLedger, createMonthlyPawLedger, getDailyPawEarned, normalizeDailyPawLedger, normalizeMonthlyPawLedger } from "@/state/paw-ledger";
import { achievements, achievementCategories, evaluateAchievements } from "@/data/achievements";
import { buildDailyQuestViews } from "@/data/quests";
import type { QuestMetric } from "@/data/quests";
import { createDefaultState, createFirstRunState } from "@/state/defaults";
import { normalizeClockTime, normalizeEarnedGood, sanitizeState } from "@/state/sanitize";
import { getWageClawStorageKey, loadState } from "@/state/persistence";

const rawViewMode = new URLSearchParams(window.location.search).get("view");
const viewMode = (rawViewMode === "pet" ? "pet" : rawViewMode === "float" ? "float" : "main") as "main" | "pet" | "float";
const availableScreens = new Set<ScreenKey>(["converter", "mall", "pet", "settings"]);

/** useWageClaw 返回值的响应式视图类型：供屏幕组件的 wc prop 使用（ref 已解包，与模板访问语义一致）。 */
export type WageClawStore = UnwrapNestedRefs<ReturnType<typeof useWageClaw>>;

export function useWageClaw() {
  const state = reactive<WageClawState>(loadState());
  const now = ref(new Date());
  const activeScreen = ref<ScreenKey>("converter");
  const accountTab = ref<"split" | "realized">("split");
  const mallTab = ref<MallTab>("wishShop");
  const inventorySubTab = ref<"items" | "log">("items");
  const petTab = ref<"status" | "refine" | "feed" | "log">("status");
  const settingsTab = ref<"account" | "profile" | "appearance" | "prompts" | "data">("profile");
  const pages = reactive<Record<PageKey, number>>({
    transactions: 1,
    pawLedger: 1,
    mall: 1,
    wishShop: 1,
    supplyShop: 1,
    inventory: 1,
    usage: 1,
    petSupply: 1,
    petLog: 1
  });
  const notification = ref("");
  const rantText = ref("");
  const blackoutActive = ref(false);
  const summonedBubble = ref("");
  const petReaction = ref("");
  const petMotionKey = ref(0);
  const petPos = reactive({ x: 0, y: 0 });
  const petDragging = ref(false);
  const goldRush = ref(false);
  const assembly = reactive({
    visible: false,
    line: "你不是在奖励加班，你是在把忍耐换回选择权。"
  });
  const petDialog = ref("");
  const petDragOffset = { x: 0, y: 0 };
  const petDragStart = { x: 0, y: 0, screenX: 0, screenY: 0 };
  let consolePetClickCount = 0;
  let desktopPetClickCount = 0;
  let lastFloatPetInteractive = false;
  let tickTimer: number | undefined;
  let notifyTimer: number | undefined;
  let blackoutTimer: number | undefined;
  let bubbleTimer: number | undefined;
  let consolePetClickTimer: number | undefined;
  let desktopPetClickTimer: number | undefined;
  const petDialogHistory: string[] = [];
  let petReactionTimer: number | undefined;
  let petReactionToken = 0;
  let syncingFromStorage = false;
  let saveTimer: number | undefined;
  let lastSaveAt = 0;
  let bridgeCleanup: Array<() => void> = [];

  const hasClaimedToday = computed(() => {
    if (!state.lastClaimTime) return false;
    const stored = new Date(Number(state.lastClaimTime));
    const today = now.value;
    return stored.getFullYear() === today.getFullYear() &&
      stored.getMonth() === today.getMonth() &&
      stored.getDate() === today.getDate();
  });
  const workdaysInMonth = computed(() => getWorkdaysInMonth(now.value.getFullYear(), now.value.getMonth()));
  const shiftSeconds = computed(() => Math.max(1, (timeToMinutes(state.endTime) - timeToMinutes(state.startTime)) * 60));
  const dailySalary = computed(() => Math.round(state.salary / Math.max(1, workdaysInMonth.value)));
  const secondSalary = computed(() => state.salary / Math.max(1, workdaysInMonth.value * shiftSeconds.value));
  const claimableToday = computed(() => {
    const current = now.value;
    const seconds = (current.getHours() * 60 + current.getMinutes()) * 60 + current.getSeconds();
    const startSeconds = timeToMinutes(state.startTime) * 60;
    const endSeconds = startSeconds + shiftSeconds.value;
    const cappedSeconds = clamp(seconds, startSeconds, endSeconds);
    let sinceSeconds = startSeconds;
    if (state.lastClaimTime) {
      const lastClaim = new Date(Number(state.lastClaimTime));
      const today = new Date(current);
      if (lastClaim.getFullYear() === today.getFullYear() &&
          lastClaim.getMonth() === today.getMonth() &&
          lastClaim.getDate() === today.getDate()) {
        const lastClaimDaySeconds = lastClaim.getHours() * 3600 + lastClaim.getMinutes() * 60 + lastClaim.getSeconds();
        sinceSeconds = Math.max(startSeconds, clamp(lastClaimDaySeconds, startSeconds, endSeconds));
      }
    }
    const elapsed = Math.max(0, cappedSeconds - sinceSeconds);
    return Math.max(0, elapsed * secondSalary.value);
  });
  const todayClaimedSalary = computed(() => {
    const today = getLocalDateKey(now.value);
    return state.transactions
      .filter((item) => item.date === today && item.title === "领取今日薪资额度" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);
  });
  const walletCoins = computed(() => Math.max(0, state.walletBalance));
  const totalAvailable = computed(() => Math.max(0, state.walletBalance + claimableToday.value));
  const salaryCycleProgress = computed(() => {
    const current = now.value;
    const cycle = getSalaryCycle(current, state.payday);
    const duration = Math.max(1, cycle.end.getTime() - cycle.start.getTime());
    const elapsed = clamp(current.getTime() - cycle.start.getTime(), 0, duration);
    const percent = clamp(elapsed / duration, 0, 1);
    const accumulated = Math.min(state.salary, Math.max(0, state.salary * percent));
    return {
      accumulated,
      percent,
      startLabel: formatMonthDay(cycle.start),
      endLabel: formatMonthDay(cycle.end)
    };
  });
  const physicalMallItems = computed(() => mallItems.filter((item) => item.kind === "physical"));
  const activeWishItem = computed(() => physicalMallItems.value.find((item) => item.id === state.activeWishId));
  const hasValidWorkTime = computed(() => {
    const start = normalizeClockTime(state.startTime, "");
    const end = normalizeClockTime(state.endTime, "");
    return Boolean(start && end && timeToMinutes(end) > timeToMinutes(start));
  });
  const isProfileReady = computed(() => state.salary > 0 && hasValidWorkTime.value && Boolean(activeWishItem.value));
  const activeParts = computed(() => parts.filter((part) => part.wishItemId === activeWishItem.value?.id));
  const unlockedCount = computed(() => activeParts.value.filter((part) => state.unlockedParts.includes(part.id)).length);
  const wishSpent = computed(() => activeParts.value.reduce((total, part) => (state.unlockedParts.includes(part.id) ? total + getPartPrice(part.id) : total), 0));
  const wishRemaining = computed(() => Math.max(0, state.price - wishSpent.value));
  const wishProgress = computed(() => activeParts.value.length ? unlockedCount.value / activeParts.value.length : 0);
  const wishReady = computed(() => wishProgress.value >= 1);
  const wishCollected = computed(() => state.earnedGoods.some((item) => item.itemId === state.activeWishId));
  const daysNeeded = computed(() => Math.max(0, Math.ceil(wishRemaining.value / Math.max(1, dailySalary.value))));
  const activePetStages = computed(() => petStageSeries[state.petStyle] || petStageSeries.rageBlob);
  const currentPetStage = computed(() => {
    return [...activePetStages.value].reverse().find((stage) => state.pet.growth >= stage.threshold) || activePetStages.value[0];
  });
  const nextPetStage = computed(() => activePetStages.value.find((stage) => stage.threshold > state.pet.growth) || null);
  const petAscension = computed(() => getPetAscensionView(state.pet.growth, currentPetStage.value, nextPetStage.value));
  const petGrowthGoal = computed(() => Math.round(nextPetStage.value?.threshold || petAscension.value.nextThreshold));
  const petProgress = computed(() => {
    const next = nextPetStage.value;
    if (!next) return petAscension.value.active ? petAscension.value.progress : 1;
    const current = currentPetStage.value;
    return clamp((state.pet.growth - current.threshold) / Math.max(1, next.threshold - current.threshold), 0, 1);
  });
  const dailyGrowthStats = computed(() => ({
    passive: Math.round(state.dailyPetGrowth.passive),
    broadcast: Math.round(state.dailyPetGrowth.broadcast),
    event: Math.round(state.dailyPetGrowth.event),
    total: Math.round(state.pet.growth),
    passiveCap: PET_PASSIVE_GROWTH_CAP,
    broadcastCap: PET_BROADCAST_GROWTH_CAP,
    max: PET_DAILY_GROWTH_MAX
  }));
  const petManaMax = computed(() => 60 + currentPetStage.value.level * 12 + state.pet.manaBonus + Math.min(72, petAscension.value.completedTier * 6));
  const petEnergyMax = computed(() => Math.max(1, Math.round(petManaMax.value)));
  const petAffinity = computed(() => {
    const diff = state.pet.light - state.pet.rage * 0.28;
    if (diff > 90) return { label: "澄明", type: "light" };
    if (diff > 20) return { label: "温和", type: "warm" };
    if (diff < -120) return { label: "暴戾", type: "dark" };
    return { label: "混沌", type: "neutral" };
  });
  const petSatietyLabel = computed(() => {
    const satiety = state.pet.satiety;
    if (satiety >= 80) return { label: "撑到了", color: "#e8a838" };
    if (satiety >= 50) return { label: "吃饱了", color: "#56b886" };
    if (satiety >= 25) return { label: "有点饿", color: "#d4a64a" };
    if (satiety >= 10) return { label: "很饿了", color: "#d4783b" };
    return { label: "饿晕了", color: "#d44a4a" };
  });
  const petBloodPressurePercent = computed(() => bloodPressurePercent(state.pet.bloodPressure));
  const petAttributes = computed(() => [
    {
      key: "satiety",
      label: "饱食度",
      icon: "🍐",
      value: Math.round(state.pet.satiety),
      max: 100,
      percent: percentOf(state.pet.satiety),
      color: "#58a96f"
    },
    {
      key: "mood",
      label: "心情值",
      icon: "🙂",
      value: Math.round(state.pet.affection),
      max: 100,
      percent: percentOf(state.pet.affection),
      color: "#f0a457"
    },
    {
      key: "bloodPressure",
      label: "血压",
      icon: "💓",
      value: Math.round(state.pet.bloodPressure),
      max: BLOOD_PRESSURE_MAX,
      unit: " mmHg",
      percent: petBloodPressurePercent.value,
      color: petPressureLabel.value.color
    },
    {
      key: "energy",
      label: "能量",
      icon: "⚡",
      value: Math.round(state.pet.mana),
      max: petEnergyMax.value,
      percent: percentOf(state.pet.mana, petEnergyMax.value),
      color: "#f2a43f"
    },
    {
      key: "growth",
      label: "成长值",
      icon: "⭐",
      value: petAscension.value.active ? petAscension.value.progressGrowth : Math.round(state.pet.growth),
      max: petAscension.value.active ? petAscension.value.cycle : petGrowthGoal.value,
      percent: petAscension.value.active ? Math.round(petAscension.value.progress * 100) : percentOf(state.pet.growth, petGrowthGoal.value),
      color: "#e7a84c"
    }
  ].map((row) => row.key === "growth" && petAscension.value.active ? { ...row, label: petAscension.value.label, icon: "✦" } : row));
  const petPressureLabel = computed(() => {
    const bp = state.pet.bloodPressure;
    if (bp >= 160) return { label: "高压警报", color: "#d44a4a" };
    if (bp >= 140) return { label: "二级偏高", color: "#d45c3b" };
    if (bp >= 130) return { label: "一级偏高", color: "#d4783b" };
    if (bp >= 120) return { label: "略高", color: "#d4a64a" };
    if (bp >= 90) return { label: "正常", color: "#56b886" };
    return { label: "偏低", color: "#5b93c8" };
  });
  const petStageLore = computed(() => {
    const lore = currentPetStage.value.features.join(" · ");
    return petAscension.value.active ? `${lore} · ${petAscension.value.title}` : lore;
  });
  const activeWorkEvent = computed(() => workEvents.find((event) => event.id === state.activeWorkEventId) || null);
  const pawTodayEarned = computed(() => {
    const ledger = state.dailyPaw;
    return getDailyPawEarned(ledger);
  });
  const monthlyPawEarned = computed(() => ensureMonthlyPawLedger().earned);
  const pawAttendanceProgress = computed(() => clamp(state.dailyPaw.attendanceEarned / DAILY_PAW_ATTENDANCE_CAP, 0, 1));
  const dailyPawSummaryEntries = computed<PawLedgerItem[]>(() => {
    const ledger = state.dailyPaw;
    const entries: PawLedgerItem[] = [
      {
        id: `paw-summary-${ledger.date}-attendance`,
        title: "今日出勤累计",
        amount: ledger.attendanceEarned,
        note: `桌宠自动值班，上限 ${formatPawCoins(DAILY_PAW_ATTENDANCE_CAP)}`,
        time: "今日",
        date: ledger.date,
        bucket: "attendance"
      },
      {
        id: `paw-summary-${ledger.date}-interaction`,
        title: "今日互动摸鱼",
        amount: ledger.interactionEarned,
        note: `摸摸与陪伴奖励，上限 ${formatPawCoins(DAILY_PAW_INTERACTION_CAP)}`,
        time: "今日",
        date: ledger.date,
        bucket: "interaction"
      },
      {
        id: `paw-summary-${ledger.date}-event`,
        title: "今日打工事件",
        amount: ledger.eventEarned,
        note: `处理突发职场事件，上限 ${formatPawCoins(DAILY_PAW_EVENT_CAP)}`,
        time: "今日",
        date: ledger.date,
        bucket: "event"
      }
    ];
    return entries.filter((item) => Math.round(item.amount) !== 0);
  });
  const pawLedgerItems = computed(() => [...dailyPawSummaryEntries.value, ...state.pawLedger]);
  const monthlyPawStats = computed(() => {
    const month = getCurrentMonthKey(now.value);
    const spent = Math.abs(
      state.pawLedger
        .filter((item) => item.date.startsWith(month) && item.amount < 0)
        .reduce((sum, item) => sum + item.amount, 0)
    );
    return {
      earned: monthlyPawEarned.value,
      spent,
      net: monthlyPawEarned.value - spent,
      count: pawLedgerItems.value.filter((item) => item.date.startsWith(month)).length
    };
  });

  function updatePetDecay() {
    state.pet.satiety = clamp(state.pet.satiety - PET_SATIETY_DECAY_PER_SECOND, 0, 100);
    state.pet.touchHeat = clamp(state.pet.touchHeat - PET_TOUCH_HEAT_DECAY_PER_SECOND, 0, 100);
    const dailyRageNorm = Math.min(100, (ensureDailyRageBucket().value / 500) * 100);
    const pressureAdd = dailyRageNorm > 20 ? ((dailyRageNorm - 20) / 80) * 0.002 : 0;
    state.pet.bloodPressure = clampBloodPressure(state.pet.bloodPressure + pressureAdd);
  }
  const monthlyStats = computed(() => {
    const month = getCurrentMonthKey(now.value);
    const current = state.transactions.filter((item) => item.date.startsWith(month));
    const income = current.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const expense = Math.abs(current.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
    return { income, expense, net: income - expense, count: current.length };
  });
  const filteredTransactions = computed(() => {
    return state.transactionFilter === "all" ? state.transactions : state.transactions.filter((item) => item.category === state.transactionFilter);
  });
  const pagedTransactions = computed(() => pageItems(filteredTransactions.value, pages.transactions));
  const pagedPawLedger = computed(() => pageItems(pawLedgerItems.value, pages.pawLedger));
  const wishShopItems = computed(() => mallItems.filter((item) => item.kind === "physical"));
  const supplyShopItems = computed(() => mallItems.filter((item) => item.kind !== "physical"));
  const filteredSupplyShopItems = computed(() => {
    if (state.mallFilter === "all" || state.mallFilter === "real") return supplyShopItems.value;
    return supplyShopItems.value.filter((item) => item.category === state.mallFilter);
  });
  const filteredMallItems = computed(() => state.mallFilter === "all" ? mallItems : mallItems.filter((item) => item.category === state.mallFilter));
  const pagedMallItems = computed(() => pageItems(filteredMallItems.value, pages.mall));
  const pagedWishShopItems = computed(() => pageItems(wishShopItems.value, pages.wishShop, MALL_PAGE_SIZE));
  const pagedSupplyShopItems = computed(() => pageItems(filteredSupplyShopItems.value, pages.supplyShop, MALL_PAGE_SIZE));
  const inventoryItems = computed(() => {
    return Object.entries(state.inventory)
      .map(([id, quantity]) => ({ item: mallItems.find((candidate) => candidate.id === id), quantity }))
      .filter((entry): entry is { item: MallItem; quantity: number } => Boolean(entry.item) && entry.quantity > 0);
  });
  const earnedGoods = computed(() => state.earnedGoods.map(normalizeEarnedGood));
  const pagedInventoryItems = computed(() => pageItems(inventoryItems.value, pages.inventory, MALL_PAGE_SIZE));
  const petSupplyItems = computed(() => inventoryItems.value.filter((entry) => Boolean(entry.item.petBoost)));
  const pagedPetSupplyItems = computed(() => pageItems(petSupplyItems.value, pages.petSupply));
  const pagedUsageLog = computed(() => pageItems(state.usageLog, pages.usage));
  const pagedPetLog = computed(() => pageItems(state.petLog, pages.petLog));
  const countdowns = computed(() => getCountdowns(now.value, state.endTime, state.payday));
  const pushCopies = computed(() => {
    return {
      morning: `${state.nickname}，今天先把 ${state.wish} 的进度守住。预计今日可产生 ${formatMoney(dailySalary.value)} 忍耐额度。`,
      evening: `离下班还有 ${countdowns.value.offWorkText}。先别接新的大坑，今天已硬扛 ${formatDuration(now.value.getTime() - appStartedAt, false)}。`,
      followUp: `如果情绪开始顶不住，把一句糟心事炼成怨气，软团会把它收进账本。`
    };
  });
  const appStartedAt = Date.now();

  function saveStateNow() {
    if (syncingFromStorage) return;
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    localStorage.setItem(getWageClawStorageKey(), JSON.stringify(state));
    lastSaveAt = Date.now();
  }

  function scheduleStateSave() {
    if (syncingFromStorage) return;
    const elapsed = Date.now() - lastSaveAt;
    if (elapsed >= STATE_SAVE_THROTTLE_MS) {
      saveStateNow();
      return;
    }
    if (saveTimer) return;
    saveTimer = window.setTimeout(saveStateNow, STATE_SAVE_THROTTLE_MS - elapsed);
  }

  watch(state, scheduleStateSave, { deep: true });

  function syncStateFromStorage() {
    const raw = localStorage.getItem(getWageClawStorageKey());
    if (!raw) return;
    try {
      syncingFromStorage = true;
      Object.assign(state, sanitizeState(JSON.parse(raw)));
    } finally {
      syncingFromStorage = false;
    }
  }

  onMounted(() => {
    window.addEventListener("storage", syncStateFromStorage);
    window.addEventListener("beforeunload", saveStateNow);
    if (viewMode === "float") {
      document.documentElement.style.cssText = "margin:0;padding:0;width:100%;height:100%;background:transparent;overflow:hidden;";
      document.body.style.cssText = "margin:0;padding:0;width:100%;height:100%;background:transparent;overflow:hidden;";
      const app = document.getElementById("app");
      if (app) app.style.cssText = "width:100%;height:100%;background:transparent;overflow:hidden;";
      window.addEventListener("mousemove", handleFloatHitTest);
      window.addEventListener("mouseleave", handleFloatMouseLeave);
    } else if (viewMode === "main" && window.wageclawDesktop?.togglePet && state.pet.summoned) {
      window.wageclawDesktop.togglePet(true);
    }
    petPos.x = window.innerWidth - 180;
    petPos.y = window.innerHeight - 220;
    ensureDailyRageBucket();
    ensureDailyPawLedger();
    ensureDailyQuests();
    checkAchievements();
    tickTimer = window.setInterval(() => {
      now.value = new Date();
      if (state.onboardingDone) {
        ensureDailyRageBucket();
        ensureDailyPawLedger();
        updatePetDecay();
        updatePawAttendance();
        maybeTriggerCareReminders();
        maybeTriggerWorkEvent();
        checkAchievements();
      }
    }, 1000);
    bindDesktopBridge();
    window.addEventListener("keydown", handleGlobalKeydown);
    window.addEventListener("keyup", handleGlobalKeyup);
  });

  onUnmounted(() => {
    saveStateNow();
    if (tickTimer) window.clearInterval(tickTimer);
    if (saveTimer) window.clearTimeout(saveTimer);
    if (notifyTimer) window.clearTimeout(notifyTimer);
    if (blackoutTimer) window.clearTimeout(blackoutTimer);
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    if (consolePetClickTimer) window.clearTimeout(consolePetClickTimer);
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    if (petReactionTimer) window.clearTimeout(petReactionTimer);
    disposeRunner();
    window.removeEventListener("keydown", handleGlobalKeydown);
    window.removeEventListener("keyup", handleGlobalKeyup);
    window.removeEventListener("storage", syncStateFromStorage);
    window.removeEventListener("beforeunload", saveStateNow);
    window.removeEventListener("mousemove", handleFloatHitTest);
    window.removeEventListener("mouseleave", handleFloatMouseLeave);
    bridgeCleanup.forEach((cleanup) => cleanup());
    bridgeCleanup = [];
  });

  function notify(message: string) {
    notification.value = message;
    if (notifyTimer) window.clearTimeout(notifyTimer);
    notifyTimer = window.setTimeout(() => {
      notification.value = "";
    }, 2800);
  }

  function playPetReaction(reaction: string, durationMs = 500) {
    const token = ++petReactionToken;
    petMotionKey.value += 1;
    if (petReactionTimer) window.clearTimeout(petReactionTimer);
    const applyReaction = () => {
      if (token === petReactionToken) petReaction.value = reaction;
    };
    if (petReaction.value === reaction) {
      petReaction.value = "";
      window.requestAnimationFrame(applyReaction);
    } else {
      applyReaction();
    }
    petReactionTimer = window.setTimeout(() => {
      if (token === petReactionToken) {
        petReaction.value = "";
        petReactionTimer = undefined;
      }
    }, durationMs);
  }

  function pageItems<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = clamp(page, 1, totalPages);
    const start = (current - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      current,
      totalPages,
      totalItems: items.length,
      pageSize
    };
  }

  function getPageSize(key: PageKey) {
    return key === "wishShop" || key === "supplyShop" || key === "inventory" ? MALL_PAGE_SIZE : PAGE_SIZE;
  }

  function setPage(key: PageKey, direction: number) {
    const map = {
      transactions: filteredTransactions.value.length,
      pawLedger: pawLedgerItems.value.length,
      mall: filteredMallItems.value.length,
      wishShop: wishShopItems.value.length,
      supplyShop: filteredSupplyShopItems.value.length,
      inventory: inventoryItems.value.length,
      usage: state.usageLog.length,
      petSupply: petSupplyItems.value.length,
      petLog: state.petLog.length,
    };
    const totalPages = Math.max(1, Math.ceil(map[key] / getPageSize(key)));
    pages[key] = clamp(pages[key] + direction, 1, totalPages);
  }

  function setActiveScreen(screen: ScreenKey) {
    activeScreen.value = availableScreens.has(screen) ? screen : "converter";
  }

  function closeMainWindow() {
    if (window.wageclawDesktop?.closeMainWindow) {
      window.wageclawDesktop.closeMainWindow();
    }
  }

  function minimizeMainWindow() {
    if (window.wageclawDesktop?.minimizeMainWindow) {
      window.wageclawDesktop.minimizeMainWindow();
    }
  }

  function maximizeMainWindow() {
    if (window.wageclawDesktop?.maximizeMainWindow) {
      window.wageclawDesktop.maximizeMainWindow();
    }
  }

  async function openScreenFromPet(screen: ScreenKey) {
    activeScreen.value = screen;
    if (viewMode === "pet" && window.wageclawDesktop?.focusScreen) {
      await window.wageclawDesktop.focusScreen(screen);
    }
  }

  function petStageStyle(stage = currentPetStage.value) {
    const ascension = petAscension.value;
    const useAscension = ascension.active && stage.id === currentPetStage.value.id;
    const ascensionProgress = useAscension ? ascension.progress : 0;
    return {
      "--pet-body": stage.palette.body,
      "--pet-belly": stage.palette.belly,
      "--pet-accent": stage.palette.accent,
      "--pet-glow": stage.palette.glow,
      "--pet-eye": stage.palette.eye,
      "--pet-shadow": stage.palette.shadow,
      "--pet-ascension-progress": String(ascensionProgress),
      "--pet-ascension-tier": String(useAscension ? ascension.tier : 0),
      "--pet-ascension-tone": String(useAscension ? ascension.tone : 0),
      "--pet-ascension-hue": `${useAscension ? (ascension.tone - 1) * 46 + Math.round(ascensionProgress * 30) : 0}deg`,
      "--pet-ascension-boost": String(useAscension ? 0.2 + ascensionProgress * 0.55 : 0),
      "--pet-ascension-brightness": String(useAscension ? 1.04 + ascensionProgress * 0.16 : 1)
    } as CSSProperties;
  }

  function setTransactionFilter(filter: "all" | TransactionCategory) {
    state.transactionFilter = filter;
    pages.transactions = 1;
  }

  function setMallFilter(filter: string) {
    state.mallFilter = filter;
    pages.mall = 1;
    pages.supplyShop = 1;
  }

  function getMallItemCurrency(item: MallItem): Currency {
    if (item.kind === "physical") return "wallet";
    return item.currency || "paw";
  }

  function setWishItem(item: MallItem) {
    if (item.kind !== "physical" || !item.wishable) {
      notify("这件商品暂时不能许愿。");
      return;
    }
    if (state.activeWishId === item.id) {
      activeScreen.value = "converter";
      notify(`${item.name} 已经在主页心愿位。`);
      return;
    }
    if (state.activeWishId && !wishCollected.value && state.unlockedParts.length > 0) {
      notify("当前版本先限制一个心愿，先把这件完成。");
      return;
    }
    state.activeWishId = item.id;
    state.wish = item.name;
    state.price = item.price;
    state.unlockedParts = [];
    activeScreen.value = "converter";
    addPetLog("实体心愿已立项", `${item.name} 已进入主页拆分台。`);
    notify(`${item.name} 已设为心愿。`);
  }

  function completeOnboarding() {
    if (!hasValidWorkTime.value) {
      notify("请先设置有效的上下班时间。");
      return false;
    }
    if (state.salary <= 0) {
      notify("请先填写月薪。");
      return false;
    }
    const item = activeWishItem.value;
    if (!item) {
      notify("请先选择一个心愿。");
      return false;
    }
    state.activeWishId = item.id;
    state.wish = item.name;
    state.price = item.price;
    state.unlockedParts = [];
    state.onboardingDone = true;
    ensureDailyRageBucket();
    ensureDailyPawLedger();
    activeScreen.value = "converter";
    notify("设置完成，今天的工资进度开始记录。");
    return true;
  }

  function getPartPrice(partId: string) {
    const part = activeParts.value.find((item) => item.id === partId);
    return part ? Math.round(state.price * part.ratio) : 0;
  }

  function formatMoney(value: number, decimals = 2) {
    return `¥${Number(value || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function roundMoney(value: number) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function formatBalance(value: number, decimals = 2) {
    if (state.privacyMode) return "¥****";
    return formatMoney(value, decimals);
  }

  function formatRage(value: number) {
    return `${Math.round(value || 0)} 怨气`;
  }

  function formatPawCoins(value: number) {
    return `${Math.round(value || 0)} 爪币`;
  }

  function formatLight(value: number) {
    return `${Math.round(value || 0)} 气质`;
  }

  function formatBloodPressureDelta(value: number) {
    const delta = Math.round(value || 0);
    return `血压 ${delta > 0 ? "+" : ""}${delta}mmHg`;
  }

  function formatStatDelta(label: string, value: number | undefined, unit = "") {
    const delta = Math.round(Number(value) || 0);
    if (!delta) return "";
    return `${label} ${delta > 0 ? "+" : ""}${delta}${unit}`;
  }

  function applyPetDelta(delta: PetDelta) {
    const rage = Math.round(Number(delta.rage) || 0);
    const growth = Math.round(Number(delta.growth) || 0);
    const light = Math.round(Number(delta.light) || 0);
    const satiety = Number(delta.satiety) || 0;
    const affection = Math.round(Number(delta.affection) || 0);
    const manaCap = Math.round(Number(delta.manaCap) || 0);
    const mana = Number(delta.mana) || 0;
    const bloodPressure = Number(delta.bloodPressure) || 0;
    const touchHeat = Number(delta.touchHeat) || 0;

    if (rage) state.pet.rage = Math.max(0, state.pet.rage + rage);
    if (growth) state.pet.growth = Math.max(0, state.pet.growth + growth);
    if (light) state.pet.light += light;
    if (satiety) state.pet.satiety = clamp(state.pet.satiety + satiety, 0, 100);
    if (affection) state.pet.affection = clamp(state.pet.affection + affection, 0, 100);
    if (manaCap) state.pet.manaBonus = clamp(state.pet.manaBonus + manaCap, 0, PET_MANA_BONUS_MAX);
    if (mana) state.pet.mana = clamp(state.pet.mana + mana, 0, petManaMax.value);
    if (bloodPressure) {
      const current = clampBloodPressure(state.pet.bloodPressure);
      const next = clampBloodPressure(current + bloodPressure);
      const floor = delta.bloodPressureFloor;
      state.pet.bloodPressure = bloodPressure < 0 && typeof floor === "number"
        ? Math.max(next, Math.min(current, floor))
        : next;
    }
    if (touchHeat) state.pet.touchHeat = clamp(state.pet.touchHeat + touchHeat, 0, 100);
  }

  function formatPetDeltaSummary(delta: Pick<PetDelta, "affection" | "light" | "mana" | "satiety" | "bloodPressure">) {
    return [
      formatStatDelta("心情", delta.affection),
      formatStatDelta("气质", delta.light),
      formatStatDelta("法力", delta.mana),
      formatStatDelta("饱食", delta.satiety),
      delta.bloodPressure ? formatBloodPressureDelta(delta.bloodPressure) : ""
    ].filter(Boolean).join("，");
  }

  function addTransaction(title: string, amount: number, note = "", category: TransactionCategory = "expense") {
    state.transactions.unshift({
      id: crypto.randomUUID(),
      title,
      amount,
      note,
      category,
      time: formatTime(),
      date: getLocalDateKey()
    });
    state.transactions = state.transactions.slice(0, LOG_CAPS.transactions);
  }

  function addPawLedgerEntry(title: string, amount: number, note = "", bucket: PawLedgerBucket = "event") {
    state.pawLedger.unshift({
      id: crypto.randomUUID(),
      title,
      amount,
      note,
      bucket,
      time: formatTime(),
      date: getLocalDateKey()
    });
    state.pawLedger = state.pawLedger.slice(0, LOG_CAPS.pawLedger);
    pages.pawLedger = 1;
  }

  function addPetLog(title: string, detail: string) {
    state.petLog.unshift({ title, detail, time: formatTime() });
    state.petLog = state.petLog.slice(0, LOG_CAPS.petLog);
  }

  function addEarnedGood(item = activeWishItem.value) {
    if (!item || state.earnedGoods.some((good) => good.itemId === item.id)) return;
    state.earnedGoods.unshift({
      id: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      icon: item.icon,
      amount: item.price,
      source: "忍耐白捡",
      time: formatTime()
    });
  }

  function deleteEarnedGood(goodId: string) {
    const index = state.earnedGoods.findIndex((item) => item.id === goodId);
    if (index < 0) return;
    const good = normalizeEarnedGood(state.earnedGoods[index]);
    const refundAmount = roundMoney(good.amount);
    if (!window.confirm(`确定删除「${good.name}」吗？会退回 ${formatMoney(refundAmount)} 到工资余额。`)) return;
    state.earnedGoods.splice(index, 1);
    if (refundAmount > 0) {
      state.walletBalance += refundAmount;
      addTransaction(`删除已实现心愿退款 ${good.name}`, refundAmount, "已实现心愿删除回退", "income");
    }
    addPetLog("已实现心愿删除", `${good.name} 已从陈列移除，工资余额退回 ${formatMoney(refundAmount)}。`);
    notify(`已删除 ${good.name}，退回 ${formatMoney(refundAmount)}。`);
  }

  function claimWishReward() {
    if (!wishReady.value) {
      notify("部件还没集齐，继续点亮。");
      return;
    }
    const item = activeWishItem.value;
    const alreadyCollected = wishCollected.value;
    addEarnedGood(item);
    assembly.line = randomPick([
      `拼装完成。${state.nickname}，这不是冲动消费，这是你把每一次忍住都结成了看得见的选择权。`,
      `这台 ${state.wish} 已经收进背包。你不是只能硬扛的人，你也能把目标一点点拿回来。`,
      "所有零件归位。今天的积极暗示：钱不是安慰奖，它是你给自己留出的退路和可能性。"
    ]);
    assembly.visible = true;
    state.pet.lastLine = `${state.wish} 拼装完成。软团宣布：你今天拥有一块真正属于自己的进度。`;
    if (!alreadyCollected) {
      addTransaction(`心愿达成 ${state.wish}`, 0, "通过忍耐拆分拼装获得", "wish");
      addPetLog("心愿拼装完成", `${state.wish} 已作为「忍耐白捡」商品放入背包。`);
    }
  }

  function closeAssembly() {
    assembly.visible = false;
  }

  function claimDailyWallet() {
    const amount = roundMoney(claimableToday.value);
    if (amount <= 0) {
      notify("今日暂无可领取额度。");
      return;
    }
    state.walletBalance += amount;
    state.lastClaimTime = String(now.value.getTime());
    addTransaction("领取今日薪资额度", amount, `${state.startTime} - ${state.endTime}`, "income");
    goldRush.value = true;
    setTimeout(() => { goldRush.value = false; }, 1200);
    notify(`已领取 ${formatMoney(amount)}。`);
    trackQuest("claim");
  }

  function spendWallet(amount: number, title = "支出") {
    if (totalAvailable.value < amount) {
      notify(`${title} 还差 ${formatMoney(amount - totalAvailable.value)}。`);
      return false;
    }
    if (state.walletBalance < amount && claimableToday.value > 0) {
      const claimed = claimableToday.value;
      state.walletBalance += claimed;
      state.lastClaimTime = String(now.value.getTime());
      addTransaction("自动领取今日薪资额度", claimed, "用于完成本次支出", "income");
    }
    state.walletBalance -= amount;
    return true;
  }

  function buyPart(partId: string) {
    if (state.unlockedParts.includes(partId)) return;
    if (wishCollected.value) {
      notify("这个心愿已经收进背包了。");
      return;
    }
    const part = activeParts.value.find((item) => item.id === partId);
    if (!part) return;
    const price = getPartPrice(part.id);
    if (!spendWallet(price, `点亮 ${part.name}`)) return;
    state.unlockedParts.push(part.id);
    trackQuest("wishPart");
    addTransaction(`点亮 ${part.name}`, -price, state.wish, "wish");
    state.pet.lastLine = `你把 ${part.name} 点亮了。花出去的钱终于有点像在给自己铺路。`;
    addPetLog("软团围观消费", `${part.name} 已点亮，${state.wish} 更近了一步。`);
    if (state.unlockedParts.length >= activeParts.value.length) {
      notify(`${part.name} 已点亮，开始拼装 ${state.wish}。`);
      claimWishReward();
      return;
    }
    notify(`${part.name} 已点亮。`);
  }

  function getResourceBalance(currency: Currency) {
    if (currency === "paw") return state.pawBalance;
    if (currency === "rage") return state.rageBalance;
    return totalAvailable.value;
  }

  function buyMallItem(item: MallItem) {
    if (item.kind === "physical") {
      setWishItem(item);
      return;
    }
    const currency = getMallItemCurrency(item);
    if (getResourceBalance(currency) < item.price) {
      notify(currency === "paw" ? "爪币不够，让软团多出勤一会儿，或帮它处理一个打工事件。" : currency === "rage" ? "怨气不够，先炼一段糟心事。" : "账户余额不够，先领额度或继续攒。");
      return;
    }
    if (currency === "paw") {
      state.pawBalance = Math.max(0, state.pawBalance - item.price);
      addPawLedgerEntry(`兑换 ${item.name}`, -item.price, "供销社补给", "supply");
      addPetLog("爪币购买补给", `${item.name} 已收入背包，花费 ${formatPawCoins(item.price)}。`);
    } else if (currency === "rage") {
      state.rageBalance -= item.price;
      addPetLog("怨气兑换供品", `${item.name} 已收入背包。`);
    } else if (!spendWallet(item.price, `购买 ${item.name}`)) {
      return;
    }
    if (currency === "wallet") {
      addTransaction(`购买 ${item.name}`, -item.price, item.petBoost ? "滋养软团" : "情绪补给", item.petBoost ? "pet" : "mall");
    }
    state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
    notify(`${item.name} 已放入背包。`);
    trackQuest("purchase");
  }

  function useItem(item: MallItem) {
    const count = state.inventory[item.id] || 0;
    if (count <= 0) return;
    state.inventory[item.id] = count - 1;
    trackQuest("useItem");
    if (state.inventory[item.id] <= 0) delete state.inventory[item.id];
    if (item.petBoost) {
      feedPet(item);
      return;
    }
    const log: UsageLogItem = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      effect: item.effect,
      time: formatTime()
    };
    state.usageLog.unshift(log);
    state.usageLog = state.usageLog.slice(0, LOG_CAPS.usageLog);
    if (item.category === "heal") {
      state.pet.lastLine = "你总算对自己好一点了。继续保持，别只会硬扛。";
      addPetLog("软团观察到回血", `${item.name} 已使用，软团情绪稳定度略有提升。`);
    }
    notify(`${item.name} 已使用。`);
  }

  function restorePetMana(amount?: number) {
    const target = amount ?? Math.round(petManaMax.value * 0.35);
    applyPetDelta({ mana: target });
  }

  function formatPetBoost(boost: PetBoost = {}) {
    const result = [
      formatStatDelta("怨气", boost.rage),
      formatStatDelta("气质", boost.light),
      formatStatDelta("心情", boost.affection),
      formatStatDelta("法力上限", boost.manaCap),
      formatStatDelta("法力", boost.mana),
      formatStatDelta("饱食", boost.satiety),
      boost.bloodPressure ? formatBloodPressureDelta(boost.bloodPressure) : ""
    ].filter(Boolean);
    return result.join(" / ");
  }

  function feedPet(item: MallItem) {
    trackQuest("feed");
    const boost = item.petBoost || {};
    const beforeStage = currentPetStage.value.id;
    const rageBoost = Number(boost.rage) || 0;
    if (rageBoost > 0) {
      addRageCoins(rageBoost, "补给怨气", Number(boost.bloodPressure) || 0, Math.max(0, rageBoost));
    } else if (rageBoost < 0) {
      applyPetDelta({ rage: rageBoost });
    }
    const pressure = Number(boost.bloodPressure) || 0;
    applyPetDelta({
      light: boost.light,
      satiety: boost.satiety,
      affection: boost.affection,
      manaCap: boost.manaCap,
      mana: boost.mana,
      bloodPressure: rageBoost > 0 ? 0 : pressure,
      bloodPressureFloor: pressure < 0
        ? item.category === "medicine" ? MEDICINE_BLOOD_PRESSURE_FLOOR : RELAX_BLOOD_PRESSURE_FLOOR
        : undefined
    });
    const evolved = beforeStage !== currentPetStage.value.id;
    state.pet.lastLine = evolved
      ? `${item.name} 很对胃口。我进化成 ${currentPetStage.value.name} 了。`
      : `${item.name} 收下了。${formatPetBoost(boost) || "状态稳定"}。`;
    addPetLog(evolved ? "软团进化" : "投喂成功", `${item.name} 生效：${formatPetBoost(boost) || "状态稳定"}。`);
    notify(`${item.name} 已投喂。`);
  }

  function addRageCoins(amount: number, source = "怨气增长", pressureGain?: number, growthGain?: number) {
    const gained = Math.max(0, Math.round(amount));
    if (!gained) return 0;
    const growth = Math.max(0, Math.round(growthGain || 0));
    const actualGrowth = growth ? addDailyPetGrowth(state, growth, "event", getLocalDateKey(now.value)) : 0;
    const pressure = pressureGain ?? Math.min(8, Math.max(1, Math.round(gained * 0.06)));
    applyPetDelta({
      rage: gained,
      bloodPressure: pressure,
      bloodPressureFloor: pressure < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined
    });
    const bucket = ensureDailyRageBucket();
    bucket.value += gained;
    dailyRageMilestones.forEach((milestone) => {
      if (bucket.value >= milestone.threshold && !bucket.triggered.includes(milestone.id)) {
        bucket.triggered.push(milestone.id);
        state.pet.lastBusinessHint = `${milestone.title} 已触发`;
        playRageMilestone(milestone);
      }
    });
    const growthLine = actualGrowth ? `，成长 +${Math.round(actualGrowth)}` : "";
    addPetLog(source, `新增 ${formatRage(gained)}${growthLine}${pressure ? `，${formatBloodPressureDelta(pressure)}` : ""}。`);
    return gained;
  }

  function playRageMilestone(milestone: (typeof dailyRageMilestones)[number]) {
    const desktop = window.wageclawDesktop;
    switch (milestone.action) {
      case "blackout":
        void triggerBlackoutSkill({ automatic: true });
        break;
      case "ricochet":
        void desktop?.petRicochet?.()?.catch(() => {});
        break;
      case "storm":
        void desktop?.petStorm?.()?.catch(() => {});
        break;
      case "nuke":
        void desktop?.petNuke?.()?.catch(() => {});
        break;
      default:
        // ripple / crack / overdrive / awaken：主进程暂无对应演出，先以窗口内反馈兜底
        playPetReaction("shake", 700);
        notify(`${milestone.title}！软团情绪波动剧烈。`);
        break;
    }
  }

  function ensureDailyRageBucket() {
    const today = getLocalDateKey(now.value);
    const growthReset = ensureDailyPetGrowth(state, today);
    if (!state.dailyRage || state.dailyRage.date !== today) {
      const yesterdayRage = Math.round(state.dailyRage?.value || state.pet.rage || 0);
      state.dailyRage = { date: today, value: 0, triggered: [] };
      state.pet.rage = 0;
      state.pet.cultivation = 0;
      state.pet.touchHeat = 0;
      state.pet.bloodPressure = settleDailyBloodPressure(state.pet.bloodPressure);
      state.pet.lastLine = yesterdayRage > 0
        ? `昨天的 ${formatRage(yesterdayRage)} 已沉淀，桌宠回到 Lv.1，今天重新进化。`
        : "新工作日开始，桌宠回到 Lv.1，今天的成长重新计算。";
      addPetLog("每日成长重置", state.pet.lastLine);
    } else if (growthReset) {
      state.pet.lastLine = "新工作日开始，桌宠回到 Lv.1，今天的成长重新计算。";
      addPetLog("每日成长重置", state.pet.lastLine);
    }
    if (!Array.isArray(state.dailyRage.triggered)) state.dailyRage.triggered = [];
    return state.dailyRage;
  }

  function ensureDailyPawLedger() {
    const today = getLocalDateKey(now.value);
    if (!state.dailyPaw || state.dailyPaw.date !== today) {
      const oldLedger = state.dailyPaw;
      const oldEarned = oldLedger
        ? oldLedger.attendanceEarned + oldLedger.interactionEarned + oldLedger.eventEarned
        : 0;
      state.dailyPaw = createDailyPawLedger(today, now.value.getTime());
      state.activeWorkEventId = "";
      addPetLog("爪币日报刷新", `昨日软团赚到 ${formatPawCoins(oldEarned)}，余额保留，今日重新出勤。`);
    }
    state.dailyPaw = normalizeDailyPawLedger(state.dailyPaw, createDailyPawLedger(today, now.value.getTime()));
    if (state.activeWorkEventId && !workEvents.some((event) => event.id === state.activeWorkEventId)) {
      state.activeWorkEventId = "";
    }
    return state.dailyPaw;
  }

  function ensureMonthlyPawLedger() {
    const month = getCurrentMonthKey(now.value);
    if (!state.monthlyPaw || state.monthlyPaw.month !== month) {
      state.monthlyPaw = createMonthlyPawLedger(month);
    }
    state.monthlyPaw = normalizeMonthlyPawLedger(state.monthlyPaw, createMonthlyPawLedger(month));
    return state.monthlyPaw;
  }

  function ensureDailyQuests() {
    const today = getLocalDateKey(now.value);
    if (state.dailyQuests.date !== today) {
      state.dailyQuests.date = today;
      state.dailyQuests.progress = {};
      state.dailyQuests.claimed = [];
    }
  }

  function trackQuest(metric: QuestMetric, amount = 1) {
    ensureDailyQuests();
    state.dailyQuests.progress[metric] = (state.dailyQuests.progress[metric] ?? 0) + amount;
  }

  function claimQuest(questId: string) {
    ensureDailyQuests();
    const quest = buildDailyQuestViews(state).find((entry) => entry.id === questId);
    if (!quest || quest.claimed || !quest.claimable) return;
    state.dailyQuests.claimed.push(questId);
    addPawCoins(quest.reward, `每日任务：${quest.name}`, "event");
    addPetLog("每日任务", `完成「${quest.name}」，领取 ${quest.reward} 爪币。`);
    notify(`任务完成：${quest.icon} ${quest.name}，+${quest.reward} 爪币。`);
  }

  function checkAchievements() {
    const { unlocked, newly } = evaluateAchievements(state);
    if (!newly.length) return;
    state.achievements = unlocked;
    for (const item of newly) {
      if (item.reward > 0) addPawCoins(item.reward, `成就：${item.name}`, "event", true);
      notify(`解锁成就 ${item.icon} 「${item.name}」 +${item.reward} 爪币`);
      addPetLog("成就解锁", `「${item.name}」——${item.description}`);
    }
  }

  const dailyQuestViews = computed(() => {
    ensureDailyQuests();
    return buildDailyQuestViews(state);
  });
  const achievementViews = computed(() =>
    achievements.map((item) => ({
      ...item,
      categoryLabel: achievementCategories[item.category].label,
      current: Math.min(item.target, item.value(state)),
      unlocked: state.achievements.includes(item.id)
    }))
  );

  function getPawBucketCap(bucket: "attendance" | "interaction" | "event") {
    if (bucket === "attendance") return DAILY_PAW_ATTENDANCE_CAP;
    if (bucket === "interaction") return DAILY_PAW_INTERACTION_CAP;
    return DAILY_PAW_EVENT_CAP;
  }

  function getPawBucketEarned(ledger: DailyPawLedger, bucket: "attendance" | "interaction" | "event") {
    if (bucket === "attendance") return ledger.attendanceEarned;
    if (bucket === "interaction") return ledger.interactionEarned;
    return ledger.eventEarned;
  }

  function setPawBucketEarned(ledger: DailyPawLedger, bucket: "attendance" | "interaction" | "event", value: number) {
    if (bucket === "attendance") ledger.attendanceEarned = value;
    else if (bucket === "interaction") ledger.interactionEarned = value;
    else ledger.eventEarned = value;
  }

  function addPawCoins(amount: number, source = "爪币变动", bucket: "attendance" | "interaction" | "event" = "event", silent = false) {
    const ledger = ensureDailyPawLedger();
    const delta = Number(amount) || 0;
    if (!delta) return 0;
    let actual = delta;
    if (delta > 0) {
      const cap = getPawBucketCap(bucket);
      const earned = getPawBucketEarned(ledger, bucket);
      actual = Math.min(delta, Math.max(0, cap - earned));
    }
    if (!actual) return 0;
    state.pawBalance = Math.max(0, state.pawBalance + actual);
    setPawBucketEarned(ledger, bucket, getPawBucketEarned(ledger, bucket) + actual);
    if (actual > 0) {
      ensureMonthlyPawLedger().earned += actual;
    }
    if (bucket !== "attendance") {
      addPawLedgerEntry(source, actual, actual > 0 ? "软团收入" : "软团支出", bucket);
    }
    if (!silent) {
      addPetLog(source, `${actual > 0 ? "获得" : "扣除"} ${formatPawCoins(Math.abs(actual))}。`);
    }
    return actual;
  }

  function updatePawAttendance() {
    const ledger = ensureDailyPawLedger();
    const current = now.value.getTime();
    const previous = ledger.lastAttendanceAt || current;
    const elapsedMs = clamp(current - previous, 0, 60 * 1000);
    ledger.lastAttendanceAt = current;
    if (elapsedMs <= 0) return;

    const bounds = getTodayShiftBounds(now.value);
    if (bounds && current >= bounds.startAt && current <= bounds.endAt) {
      const shiftMinutes = Math.max(1, (bounds.endAt - bounds.startAt) / 60000);
      const passiveGrowth = (elapsedMs / 60000) * (PET_PASSIVE_GROWTH_CAP / shiftMinutes);
      addDailyPetGrowth(state, passiveGrowth, "passive", getLocalDateKey(now.value));
    }

    if (ledger.attendanceEarned < DAILY_PAW_ATTENDANCE_CAP) {
      addPawCoins((elapsedMs / 60000) * PAW_ATTENDANCE_RATE_PER_MINUTE, "桌宠出勤", "attendance", true);
    }
  }

  function getTodayShiftBounds(current = now.value) {
    const start = normalizeClockTime(state.startTime, "");
    const end = normalizeClockTime(state.endTime, "");
    if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) return null;
    const [startHour = "0", startMinute = "0"] = start.split(":");
    const [endHour = "0", endMinute = "0"] = end.split(":");
    const startAt = new Date(current);
    startAt.setHours(Number(startHour), Number(startMinute), 0, 0);
    const endAt = new Date(current);
    endAt.setHours(Number(endHour), Number(endMinute), 0, 0);
    return { startAt: startAt.getTime(), endAt: endAt.getTime() };
  }

  function isWithinWorkShift(current = now.value) {
    const bounds = getTodayShiftBounds(current);
    if (!bounds) return false;
    const time = current.getTime();
    return time >= bounds.startAt && time <= bounds.endAt;
  }

  function markPetInteraction() {
    state.pet.lastInteractionAt = now.value.getTime();
    trackQuest("touch");
  }

  function collectBroadcastGrowth(amount: number, source: string) {
    const actual = addDailyPetGrowth(state, amount, "broadcast", getLocalDateKey(now.value));
    if (actual > 0) {
      addPetLog(source, `今日成长 +${Math.round(actual)}。`);
      saveStateNow();
    }
    return actual;
  }

  function promptListFor(kind: InteractionPromptKind) {
    if (kind === "health") return state.interactionPrompts.healthPrompts;
    if (kind === "clock") return state.interactionPrompts.clockPrompts;
    return state.interactionPrompts.touchPrompts;
  }

  function renderPromptTemplate(template: string, replacements: Record<string, string | number> = {}) {
    return String(template || "")
      .replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => escapeHtml(replacements[key] ?? ""))
      .trim();
  }

  function stripTrailingPunctuation(value: string) {
    return value.trim().replace(/[。！？.!?]+$/u, "");
  }

  function pickWeightedPrompt(items: InteractionPromptItem[], fallback: string, replacements: Record<string, string | number> = {}) {
    const enabled = items.filter((item) => item.enabled && item.text.trim());
    const usable = enabled.length > 0 ? enabled : fallback ? [{ text: fallback, weight: 1 } as InteractionPromptItem] : [];
    if (!usable.length) return "";
    const pool = usable.reduce<InteractionPromptItem[]>((result, item) => {
      const weight = clamp(Math.round(Number(item.weight) || 1), 1, 12);
      for (let i = 0; i < weight; i += 1) result.push(item);
      return result;
    }, []);
    const picked = randomPick(pool.length > 0 ? pool : usable);
    return renderPromptTemplate(picked.text, replacements);
  }

  function addInteractionPrompt(kind: InteractionPromptKind) {
    const copy: Record<InteractionPromptKind, { label: string; text: string }> = {
      health: { label: "自定义提醒", text: "站起来伸个懒腰，给身体一点加载时间。" },
      clock: { label: "自定义报时", text: "现在离下班还有 {offWork}，今天已工作 {worked}。" },
      touch: { label: "自定义触摸", text: "{touch}收到，软团现在是「{mood}」。" }
    };
    const item = copy[kind];
    promptListFor(kind).push({
      id: crypto.randomUUID(),
      label: item.label,
      text: item.text,
      weight: 2,
      enabled: true,
      custom: true
    });
    notify("已新增一条提示语。");
  }

  function removeInteractionPrompt(kind: InteractionPromptKind, id: string) {
    const list = promptListFor(kind);
    const index = list.findIndex((item) => item.id === id && item.custom);
    if (index >= 0) {
      list.splice(index, 1);
      notify("自定义提示已删除。");
    }
  }

  function addNewsSource() {
    state.interactionPrompts.newsSources.push({
      id: crypto.randomUUID(),
      name: "自定义新闻源",
      url: "https://example.com/news.json",
      enabled: true,
      weight: 2,
      apiKeyHeader: "",
      apiKeyValue: "",
      note: "可填写聚合新闻、RSS 转 JSON 或自建代理接口。",
      custom: true
    });
    notify("已新增一个新闻 API 源。");
  }

  function removeNewsSource(id: string) {
    const list = state.interactionPrompts.newsSources;
    const index = list.findIndex((item) => item.id === id && item.custom);
    if (index >= 0) {
      list.splice(index, 1);
      notify("自定义新闻源已删除。");
    }
  }

  function markStretchBreak() {
    const current = now.value.getTime();
    state.lastStretchAt = current;
    state.lastSedentaryReminderAt = current;
    trackQuest("stretch");
    const pawGain = addPawCoins(3, "久坐活动打卡", "event", true);
    const prompt = pickWeightedPrompt(state.interactionPrompts.healthPrompts, "站起来走两步、转转肩颈。");
    const line = `活动打卡收到。${prompt}${pawGain ? ` 顺手赚到 ${formatPawCoins(pawGain)}。` : " 这次先记在身体账本里。"}`;
    state.pet.lastLine = line;
    addPetLog("久坐活动打卡", line);
    showPetBubble(line);
    notify("活动打卡已记录。");
  }

  function maybeTriggerCareReminders() {
    const current = now.value.getTime();
    const bounds = getTodayShiftBounds(now.value);
    if (!bounds || !isWithinWorkShift(now.value)) return;

    if (state.sedentaryReminderEnabled) {
      const intervalMs = clamp(Number(state.sedentaryReminderMinutes) || DEFAULT_SEDENTARY_REMINDER_MINUTES, 20, 180) * 60 * 1000;
      const anchor = Math.max(bounds.startAt, Number(state.lastStretchAt) || 0, Number(state.lastSedentaryReminderAt) || 0);
      if (current - anchor >= intervalMs) {
        state.lastSedentaryReminderAt = current;
        const growth = collectBroadcastGrowth(PET_REMINDER_GROWTH, "久坐提醒收集");
        const growthLine = growth ? ` 今日成长 +${Math.round(growth)}。` : "";
        const line = `久坐提醒：${pickWeightedPrompt(state.interactionPrompts.healthPrompts, "离开椅子活动一下，喝口水，肩颈也该下线维护了。")}${growthLine}`;
        state.pet.lastLine = line;
        addPetLog("久坐活动提醒", line);
        showPetBubble(line);
        notify("久坐提醒：该活动一下了。");
      }
    }

    if (state.petFocusReminderEnabled) {
      const intervalMs = clamp(Number(state.petFocusReminderMinutes) || DEFAULT_PET_FOCUS_REMINDER_MINUTES, 15, 180) * 60 * 1000;
      const anchor = Math.max(bounds.startAt, Number(state.pet.lastInteractionAt) || 0, Number(state.lastPetFocusReminderAt) || 0);
      if (current - anchor >= intervalMs) {
        state.lastPetFocusReminderAt = current;
        const pawGain = addPawCoins(2, "专注太久提醒", "interaction", true);
        const prompt = pickWeightedPrompt(state.interactionPrompts.healthPrompts, "你已经专注太久没理我了。伸个懒腰、摸我一下再继续。");
        const growth = collectBroadcastGrowth(PET_REMINDER_GROWTH, "专注提醒收集");
        const line = `专注太久提醒：${prompt}${pawGain ? ` 我先把 ${formatPawCoins(pawGain)} 放进爪账。` : ""}${growth ? ` 今日成长 +${Math.round(growth)}。` : ""}`;
        state.pet.lastLine = line;
        addPetLog("专注太久提醒", line);
        showPetBubble(line);
        notify("专注太久提醒：和桌宠互动一下。");
      }
    }
  }

  function maybeTriggerWorkEvent() {
    const ledger = ensureDailyPawLedger();
    if (state.activeWorkEventId) return;
    if (ledger.handledEvents.length >= Math.min(WORK_EVENT_DAILY_LIMIT, workEvents.length)) return;
    if (now.value.getTime() < ledger.nextEventAt) return;
    const candidates = workEvents.filter((event) => !ledger.handledEvents.includes(event.id));
    const next = randomPick(candidates.length ? candidates : workEvents);
    state.activeWorkEventId = next.id;
    state.pet.lastLine = `打工来消息：${next.title}。你来替我选一下。`;
    showPetBubble(state.pet.lastLine);
    addPetLog("桌宠打工事件", next.prompt);
  }

  function scheduleNextWorkEvent() {
    const ledger = ensureDailyPawLedger();
    ledger.nextEventAt = getNextWorkEventAt(now.value.getTime());
  }

  function formatWorkEventEffect(effect: WorkEventEffect) {
    const result = [
      effect.growth ? `成长 +${effect.growth}` : "",
      effect.paw ? (effect.paw > 0 ? `爪币 +${effect.paw}` : `爪币 ${effect.paw}`) : "",
      effect.rage ? (effect.rage > 0 ? `怨气 +${effect.rage}` : `怨气 ${effect.rage}`) : "",
      effect.bloodPressure ? formatBloodPressureDelta(effect.bloodPressure) : "",
      effect.satiety ? (effect.satiety > 0 ? `饱食 +${effect.satiety}` : `饱食 ${effect.satiety}`) : "",
      effect.affection ? (effect.affection > 0 ? `心情 +${effect.affection}` : `心情 ${effect.affection}`) : "",
      effect.light ? (effect.light > 0 ? `气质 +${effect.light}` : `气质 ${effect.light}`) : "",
      effect.mana ? (effect.mana > 0 ? `法力 +${effect.mana}` : `法力 ${effect.mana}`) : ""
    ].filter(Boolean);
    return result.join(" / ") || "状态稳定";
  }

  function applyWorkEventEffect(effect: WorkEventEffect) {
    const pawDelta = Number(effect.paw) || 0;
    const actualPaw = pawDelta ? addPawCoins(pawDelta, "打工选择结算", "event", true) : 0;
    const actualGrowth = effect.growth
      ? addDailyPetGrowth(state, effect.growth, "event", getLocalDateKey(now.value))
      : 0;
    if (effect.rage) {
      const rage = Number(effect.rage) || 0;
      if (rage > 0) addRageCoins(rage, "打工怨气", 0);
      else applyPetDelta({ rage });
    }
    applyPetDelta({
      bloodPressure: effect.bloodPressure,
      bloodPressureFloor: Number(effect.bloodPressure) < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined,
      satiety: effect.satiety,
      affection: effect.affection,
      light: effect.light,
      mana: effect.mana
    });
    return { actualPaw, actualGrowth };
  }

  function resolveWorkEventChoice(choiceId: string) {
    const event = activeWorkEvent.value;
    if (!event) return;
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    const ledger = ensureDailyPawLedger();
    const { actualPaw, actualGrowth } = applyWorkEventEffect(choice.effect);
    if (!ledger.handledEvents.includes(event.id)) {
      ledger.handledEvents.push(event.id);
    }
    state.activeWorkEventId = "";
    scheduleNextWorkEvent();
    const pawLine = choice.effect.paw ? `，爪币${actualPaw >= 0 ? "+" : ""}${Math.round(actualPaw)}` : "";
    const growthLine = actualGrowth ? `，成长 +${Math.round(actualGrowth)}` : "";
    const detail = choice.detail.replace(/[。！？!?，,；;：:\s]+$/g, "");
    state.pet.lastLine = `${choice.label}：${detail}${growthLine}${pawLine}。`;
    addPetLog(`打工事件：${event.title}`, `${choice.label}。${formatWorkEventEffect(choice.effect)}。`);
    notify(`${event.title} 已处理：${formatWorkEventEffect(choice.effect)}。`);
  }

  const REFINE_COOLDOWN_MS = 3 * 60 * 1000;
  let lastRefineAt = 0;

  function refineRageFromRant() {
    const text = rantText.value.trim();
    if (!text) {
      notify("先写两句糟心事，再炼怨气。");
      return;
    }
    trackQuest("refine");
    const refineElapsed = Date.now() - lastRefineAt;
    if (lastRefineAt && refineElapsed < REFINE_COOLDOWN_MS) {
      const waitMinutes = Math.max(1, Math.ceil((REFINE_COOLDOWN_MS - refineElapsed) / 60000));
      notify(`炉子还在升温，约 ${waitMinutes} 分钟后再来炼化。`);
      return;
    }
    const base = clamp(Math.round(text.length * 0.9), 12, 120);
    const moodBonus = state.mood === "rage" ? 12 : state.mood === "numb" ? 8 : 6;
    const workBonus = Math.min(40, Math.round(state.rageMinutes / 6));
    const gained = base + moodBonus + workBonus;
    addRageCoins(gained, "糟心事炼化", -4);
    const manaRecover = Math.max(8, Math.round(gained * 0.22));
    restorePetMana(manaRecover);
    applyPetDelta({ affection: 2 });
    state.pet.lastLine = `炼出 ${formatRage(gained)}，顺手回了 ${manaRecover} 点法力。这段糟心事我先收着。今日进化主要看报时提醒和职场选择。`;
    rantText.value = "";
    lastRefineAt = Date.now();
    notify(`炼化完成：${formatRage(gained)}。`);
  }

  function cultivatePet() {
    const cost = 18 + state.pet.cultivation * 10 + currentPetStage.value.level * 6;
    if (state.pet.mana < cost) {
      notify(`法力还差 ${Math.round(cost - state.pet.mana)} 点，先投喂或转化一点心事。`);
      return;
    }
    applyPetDelta({ mana: -cost });
    state.pet.cultivation += 1;
    const rageGain = 12 + currentPetStage.value.level * 5 + Math.floor(cost / 14);
    addRageCoins(rageGain, "怨气修炼", 2);
    applyPetDelta({ affection: 3 });
    state.pet.lastLine = `闭关结束，当前修炼 ${state.pet.cultivation} 重。`;
    addPetLog("怨气修炼", `消耗 ${Math.round(cost)} 点法力，新增 ${formatRage(rageGain)}。`);
  }

  function quickCarePet(action: QuickCareAction) {
    if (action === "feed") {
      const food = inventoryItems.value.find((entry) => entry.item.petBoost && entry.item.category === "food");
      if (food) {
        useItem(food.item);
        return;
      }
      mallTab.value = "supplyShop";
      activeScreen.value = "mall";
      notify("背包里暂时没有吃的，已打开补给仓。");
      return;
    }

    if (action === "play") {
      const tier = getTouchHeatTier(state.pet.touchHeat);
      const baseCost = Math.max(6, Math.round(petManaMax.value * 0.08));
      const manaCost = tier === "tired" ? Math.max(3, Math.round(baseCost / 2)) : baseCost;
      if (state.pet.mana < manaCost) {
        state.pet.touchMood = "电量不足";
        state.pet.lastLine = "软团已经困到追不动光点了，先让它小睡一会儿。";
        notify("能量不够玩耍，先小睡恢复一下。");
        showPetBubble(state.pet.lastLine);
        return;
      }
      const affectionDelta = tier === "low" ? 4 : tier === "warm" ? 2 : 0;
      const pressureDelta = tier === "low" ? -3 : tier === "warm" ? -1 : 1;
      const heatDelta = tier === "low" ? 12 : tier === "warm" ? 10 : 6;
      applyPetDelta({
        mana: -manaCost,
        affection: affectionDelta,
        bloodPressure: pressureDelta,
        bloodPressureFloor: pressureDelta < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined,
        touchHeat: heatDelta
      });
      state.pet.touchMood = tier === "tired" ? "玩累了" : "开心打滚";
      state.pet.lastLine = tier === "tired"
        ? "软团还是扑了一下小光点，但明显已经玩累了，得缓一缓。"
        : "软团追着桌面小光点绕了一圈，回来时尾巴都快摇成残影了。";
      addPetLog("陪玩放电", `${formatPetDeltaSummary({ affection: affectionDelta, bloodPressure: pressureDelta, mana: -manaCost }) || "状态稳定"}，热度 +${heatDelta}。`);
      notify(tier === "tired" ? "软团玩累了，这次没有继续涨心情。" : "软团玩累了一点，但心情明显变好了。");
      showPetBubble(state.pet.lastLine);
      playPetReaction("play", 1300);
      return;
    }

    const shouldRecover = state.pet.mana < petManaMax.value * 0.9 || state.pet.bloodPressure > BLOOD_PRESSURE_IDEAL || state.pet.touchHeat > 30;
    const manaRecover = shouldRecover ? Math.round(petManaMax.value * 0.3) : 0;
    const pressureDelta = shouldRecover ? -8 : 0;
    const heatDelta = shouldRecover ? -35 : -8;
    applyPetDelta({
      mana: manaRecover,
      bloodPressure: pressureDelta,
      bloodPressureFloor: pressureDelta < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined,
      touchHeat: heatDelta
    });
    state.pet.touchMood = "安心打盹";
    state.pet.lastLine = shouldRecover
      ? "软团打了个小盹，能量慢慢回来了，呼吸也平稳了一些。"
      : "软团已经挺精神了，只是闭眼趴了一小会儿。";
    addPetLog("小睡恢复", shouldRecover
      ? `${formatPetDeltaSummary({ mana: manaRecover, bloodPressure: pressureDelta })}，热度 ${heatDelta}。`
      : `状态已经稳定，只降低一点互动热度。`);
    notify(shouldRecover ? "软团睡醒后精神了一点。" : "软团现在不困，短暂趴了一会儿。");
    showPetBubble(state.pet.lastLine);
    playPetReaction("sleep", 2800);
  }

  async function setPetSummoned(enabled = !state.pet.summoned) {
    state.pet.summoned = Boolean(enabled);
    state.pet.lastLine = state.pet.summoned
      ? "召唤成功。我现在趴在桌面边缘，负责盯着那些离谱需求。"
      : "行，我先缩回怨气壶里。需要我时再叫一声。";
    addPetLog(state.pet.summoned ? "软团被召唤" : "软团被收回", state.pet.lastLine);
    if (viewMode !== "pet" && window.wageclawDesktop?.togglePet) {
      await window.wageclawDesktop.togglePet(state.pet.summoned);
    }
  }

  function showPetBubble(message: string) {
    petDialog.value = "";
    summonedBubble.value = message;
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      summonedBubble.value = "";
    }, 3600);
  }

  function handlePetTouch(key: string) {
    if (!(key in petTouchProfiles)) return;
    markPetInteraction();
    const profile = petTouchProfiles[key as TouchKey];
    const tier = getTouchHeatTier(state.pet.touchHeat);
    const affectionDelta = softenPositiveDelta(profile.affection, tier);
    const lightDelta = softenPositiveDelta(profile.light, tier);
    const pressureDelta = adjustTouchPressureDelta(profile.bloodPressure, tier);
    const heatDelta = Number(profile.heat) || 0;
    state.pet.touchCount += 1;
    applyPetDelta({
      affection: affectionDelta,
      light: lightDelta,
      bloodPressure: pressureDelta,
      bloodPressureFloor: pressureDelta < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined,
      touchHeat: heatDelta
    });
    state.pet.touchMood = tier === "tired" ? "需要休息" : profile.mood;
    const pawGain = addPawCoins(profile.nourish, profile.logTitle, "interaction", true);
    const heatLine = tier === "warm"
      ? "，互动有点频繁，收益减半"
      : tier === "tired" ? "，软团已经玩累了，先让它休息一下" : "";
    const effectLine = formatPetDeltaSummary({ affection: affectionDelta, light: lightDelta, bloodPressure: pressureDelta });
    const touchPrompt = stripTrailingPunctuation(pickWeightedPrompt(
      state.interactionPrompts.touchPrompts,
      `${profile.label}成功，软团进入「${state.pet.touchMood}」状态`,
      {
        touch: profile.label,
        mood: state.pet.touchMood,
        pawGain: pawGain ? formatPawCoins(pawGain) : "这次先记在心情账上"
      }
    ));
    const line = `${touchPrompt}${effectLine ? `，${effectLine}` : ""}${heatLine}${pawGain ? `，顺手赚到 ${formatPawCoins(pawGain)}` : ""}。`;
    state.pet.lastLine = line;
    showPetBubble(line);
  }

  function setFloatPetInteractive(interactive: boolean) {
    if (viewMode !== "float" || lastFloatPetInteractive === interactive) return;
    lastFloatPetInteractive = interactive;
    window.wageclawDesktop?.petHitTest?.(interactive);
  }

  function isFloatPetPointInteractive(x: number, y: number) {
    return document
      .elementsFromPoint(x, y)
      .some((element) => Boolean(element.closest(".pet-sprite, .pet-bubble, .pet-dialog, .pet-work-event")));
  }

  function handleFloatHitTest(event: MouseEvent) {
    if (viewMode !== "float") return;
    const interactive = petDragging.value || isFloatPetPointInteractive(event.clientX, event.clientY);
    setFloatPetInteractive(interactive);
  }

  function handleFloatMouseLeave() {
    if (!petDragging.value) setFloatPetInteractive(false);
  }

  function startPetDrag(e: MouseEvent) {
    if ((e.target as HTMLElement | null)?.closest(".pet-work-event")) return;
    markPetInteraction();
    petDragging.value = true;
    setFloatPetInteractive(true);
    petDragOffset.x = e.clientX - petPos.x;
    petDragOffset.y = e.clientY - petPos.y;
    petDragStart.x = e.clientX;
    petDragStart.y = e.clientY;
    petDragStart.screenX = e.screenX;
    petDragStart.screenY = e.screenY;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragStart(e.screenX, e.screenY);
    }
    window.addEventListener("mousemove", onWindowPetMove);
    window.addEventListener("mouseup", onWindowPetUp);
  }

  function onWindowPetMove(e: MouseEvent) {
    if (!petDragging.value) return;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragMove(e.screenX, e.screenY);
      return;
    }
    petPos.x = e.clientX - petDragOffset.x;
    petPos.y = e.clientY - petDragOffset.y;
  }

  function onWindowPetUp(e: MouseEvent) {
    const dx = e.screenX - petDragStart.screenX || e.clientX - petDragStart.x;
    const dy = e.screenY - petDragStart.screenY || e.clientY - petDragStart.y;
    const dragged = Math.abs(dx) > 4 || Math.abs(dy) > 4;
    petDragging.value = false;
    window.removeEventListener("mousemove", onWindowPetMove);
    window.removeEventListener("mouseup", onWindowPetUp);
    if (!dragged) {
      triggerPetClickFromEvent(e);
    }
    if (viewMode === "float") {
      setFloatPetInteractive(isFloatPetPointInteractive(e.clientX, e.clientY));
    }
  }

  function triggerPetClickFromEvent(e: MouseEvent) {
    if (viewMode === "float") {
      desktopPetClickCount += 1;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
      if (desktopPetClickCount >= 3) {
        desktopPetClickCount = 0;
        void openMainPanelFromPet();
        return;
      }
      desktopPetClickTimer = window.setTimeout(() => {
        desktopPetClickCount = 0;
      }, 900);
    }
    const el = document.querySelector(".floating-pet");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    let touchKey: string;
    let reaction: string;
    if (relY < 0.35) {
      touchKey = Math.random() < 0.6 ? "head" : "face";
      reaction = "frown";
    } else if (relY < 0.7) {
      touchKey = "belly";
      reaction = "squish";
    } else {
      touchKey = Math.random() < 0.5 ? "horn" : "tail";
      reaction = "shake";
    }
    playPetReaction(reaction, 500);
    handlePetTouch(touchKey);
  }

  async function openMainPanelFromPet() {
    state.pet.lastLine = "控制台已叫醒。软团把主界面推到你面前了。";
    showPetBubble(state.pet.lastLine);
    if (window.wageclawDesktop?.openMainPanel) {
      await window.wageclawDesktop.openMainPanel();
      return;
    }
    if (window.wageclawDesktop?.focusScreen) {
      await window.wageclawDesktop.focusScreen("converter");
    }
  }

  function handleFloatPetDoubleClick() {
    markPetInteraction();
    const growth = isProfileReady.value ? collectBroadcastGrowth(PET_DOUBLE_CLICK_GROWTH, "双击报时收集") : 0;
    showPetDialog(growth);
  }

  function popPet() {
    petReaction.value = "pop";
    setTimeout(() => {
      petReaction.value = "";
    }, 400);
  }

  function handleConsolePetSummonClick() {
    markPetInteraction();
    consolePetClickCount += 1;
    if (consolePetClickTimer) window.clearTimeout(consolePetClickTimer);
    if (consolePetClickCount >= 3) {
      consolePetClickCount = 0;
      state.pet.lastLine = "三连点收到，我出来值班。双击我可以看下班倒计时和摸鱼提醒。";
      void setPetSummoned(true);
      showPetBubble(state.pet.lastLine);
      notify("桌宠已被三连点召唤。");
      return;
    }
    consolePetClickTimer = window.setTimeout(() => {
      consolePetClickCount = 0;
    }, 900);
  }

  function showPetDialog(growthGain = 0) {
    summonedBubble.value = "";
    if (!state.onboardingDone || !isProfileReady.value) {
      petDialog.value = `<span class="line">先去完成首次设置：上班时间、下班时间、月薪和心愿都填好后，我再帮你盯下班倒计时。</span>`;
      if (bubbleTimer) window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => {
        petDialog.value = "";
      }, 8000);
      return;
    }

    const cd = countdowns.value;
    const current = now.value;
    const seconds = (current.getHours() * 60 + current.getMinutes()) * 60 + current.getSeconds();
    const startSeconds = timeToMinutes(state.startTime) * 60;
    const endSeconds = startSeconds + shiftSeconds.value;
    const cappedSeconds = clamp(seconds, startSeconds, endSeconds);
    const workedSeconds = Math.max(0, cappedSeconds - startSeconds);
    const earned = dailySalary.value * (workedSeconds / shiftSeconds.value);
    const workedLabel = formatDuration(workedSeconds * 1000, false) || "刚刚开工";
    const workRatio = clamp(workedSeconds / shiftSeconds.value, 0, 1);
    const wishPercent = Math.round(wishProgress.value * 100);
    const safeWish = escapeHtml(state.wish || activeWishItem.value?.name || "当前心愿");
    const nextPart = activeParts.value.find((part) => !state.unlockedParts.includes(part.id));
    const activeEvent = activeWorkEvent.value;
    const timeBroadcasts: Array<{ kind: string; line: string; weight: number; reaction?: string }> = [];
    const unrelatedBroadcasts: Array<{ kind: string; line: string; weight: number; reaction?: string }> = [];
    const getBroadcastKind = (line: string) => {
      const plain = line.replace(/<[^>]*>/g, "");
      const marker = plain.indexOf("：");
      return marker > 0 && marker <= 6 ? plain.slice(0, marker) : plain.slice(0, 8);
    };
    const addTimeBroadcast = (extra: string, weight = 1, reaction?: string) => {
      const line = `${offWorkLine}；${extra}`;
      timeBroadcasts.push({ kind: getBroadcastKind(line), line, weight, reaction });
    };
    const addUnrelatedBroadcast = (line: string, weight = 1, reaction?: string) => {
      unrelatedBroadcasts.push({ kind: getBroadcastKind(line), line, weight, reaction });
    };
    const offWorkLine = cd.isOffWork
      ? `下班雷达：已经下班，今天已扛 <b>${workedLabel}</b>，新需求明天再排队`
      : `下班雷达：距离下班还有 <b>${cd.offWorkText}</b>，今天已扛 <b>${workedLabel}</b>`;

    addTimeBroadcast(`上班到现在已经白嫖 <b class="gold">${formatBalance(earned, 2)}</b>，每一分钟都在回收选择权`, 4, "pop");
    addTimeBroadcast(`摸鱼账户今日已进账 <b>${formatPawCoins(pawTodayEarned.value)}</b>，余额 ${formatPawCoins(state.pawBalance)}`, 3);
    addTimeBroadcast(`离最近的${cd.nextHoliday.name}还有 <b>${cd.nextHoliday.natural}</b> 个自然日，通常能放 ${cd.nextHoliday.daysOff} 天`, 3);
    addTimeBroadcast(`发薪日是 ${cd.paydayLabel}，本周期工资进度 <b>${Math.round(salaryCycleProgress.value.percent * 100)}%</b>`, 2);
    addTimeBroadcast(`心愿「${safeWish}」完成 <b>${wishPercent}%</b>，还差 ${formatBalance(wishRemaining.value, 0)}，今天这段班正在变成它`, 3);
    addTimeBroadcast(
      workRatio > 0.82 && !cd.isOffWork
        ? `今天已经走完 <b>${Math.round(workRatio * 100)}%</b>，现在开始少接新坑`
        : randomPick([
            "先喝一口水，回来再和这个世界继续周旋",
            "肩膀放下来十秒，别让工位偷走你的脖子",
            "你没有拖慢世界，你只是在合理限速",
            "今天允许低功耗运行，不必每秒都满血",
            "能按时下线也是一种职业素养"
          ]),
      4,
      "squish"
    );
    addTimeBroadcast(
      randomPick([
        "冷知识：工资条不会拥抱你，但它至少会承认你今天来过",
        "冷笑话：闹钟最大的梦想是退休，因为它每天都被人第一时间打脸",
        "冷笑话：键盘最羡慕空格键，什么都不用说，也能让句子喘口气",
        "冷笑话：日历每天撕掉一页还不崩溃，可能是全公司情绪最稳定的同事"
      ]),
      2,
      "pop"
    );
    const clockReplacements = {
      offWork: cd.isOffWork ? "已下班" : cd.offWorkText,
      worked: workedLabel,
      earned: formatBalance(earned, 2),
      pawToday: formatPawCoins(pawTodayEarned.value),
      pawBalance: formatPawCoins(state.pawBalance),
      wish: state.wish || activeWishItem.value?.name || "当前心愿",
      wishPercent,
      wishRemaining: formatBalance(wishRemaining.value, 0),
      payday: cd.paydayLabel,
      holiday: cd.nextHoliday.name,
      holidayDays: cd.nextHoliday.natural
    };
    state.interactionPrompts.clockPrompts
      .filter((item) => item.enabled && item.text.trim())
      .forEach((item) => {
        const line = renderPromptTemplate(item.text, clockReplacements);
        if (line) {
          timeBroadcasts.push({
            kind: getBroadcastKind(line),
            line,
            weight: clamp(Math.round(Number(item.weight) || 1), 1, 12),
            reaction: "pop"
          });
        }
      });

    addUnrelatedBroadcast(`到账播报：本班已炼成 <b class="gold">${formatBalance(earned, 2)}</b>，每一分钟都在回收选择权`, 4, "pop");
    addUnrelatedBroadcast(`心愿雷达：「${safeWish}」完成 <b>${wishPercent}%</b>，还差 ${formatBalance(wishRemaining.value, 0)}`, 4);
    addUnrelatedBroadcast(
      nextPart
        ? `拼装建议：下一块先盯 <b>${escapeHtml(nextPart.name)}</b>，别让心愿只停在购物车里`
        : `心愿拼装完成：「${safeWish}」已经可以被正式领取`,
      3,
      "pop"
    );
    addUnrelatedBroadcast(`发薪日播报：${cd.paydayLabel}，本周期进度 <b>${Math.round(salaryCycleProgress.value.percent * 100)}%</b>`, 2);
    addUnrelatedBroadcast(buildHolidayLine(cd.nextHoliday), 2);
    addUnrelatedBroadcast(`摸鱼爪账：今天已赚 <b>${formatPawCoins(pawTodayEarned.value)}</b>，本月净赚 ${formatPawCoins(monthlyPawStats.value.net)}`, 3);
    addUnrelatedBroadcast(
      `摸鱼指令：${randomPick([
            "去接一杯水，回来再处理这个世界",
            "肩膀放下来十秒，别让工位偷走你的脖子",
            "先眨眼三次，屏幕不会因为你喘口气就跑路",
            "把最烦的一件事写成一句话，先把它从脑子里拿出来",
            "今天允许低功耗运行，不必每秒都满血"
          ])}`,
      3,
      "squish"
    );
    if (activeEvent) {
      const choice = activeEvent.choices.length > 0 ? randomPick(activeEvent.choices) : null;
      addUnrelatedBroadcast(
        choice
          ? `工位事件：「${escapeHtml(activeEvent.title)}」还没处理，建议先试试「${escapeHtml(choice.label)}」`
          : `工位事件：「${escapeHtml(activeEvent.title)}」还没处理，先别让它在脑子里占满内存`,
        4,
        "shake"
      );
    }
    if (petSupplyItems.value.length > 0) {
      const supply = randomPick(petSupplyItems.value);
      addUnrelatedBroadcast(`背包播报：还有 <b>${escapeHtml(supply.item.name)} x${supply.quantity}</b>，需要回血时别舍不得用`, 2);
    }

    let picked: { kind: string; line: string; weight: number; reaction?: string };
    const pickBroadcast = (items: Array<{ kind: string; line: string; weight: number; reaction?: string }>) => {
      const recentKinds = petDialogHistory.map(getBroadcastKind);
      const freshChannelCandidates = items.filter((item) => !petDialogHistory.includes(item.line) && !recentKinds.includes(item.kind));
      const freshLineCandidates = items.filter((item) => !petDialogHistory.includes(item.line));
      const usable = freshChannelCandidates.length > 0 ? freshChannelCandidates : freshLineCandidates.length > 0 ? freshLineCandidates : items;
      const weightedPool = usable.reduce<Array<{ kind: string; line: string; weight: number; reaction?: string }>>((pool, item) => {
        for (let i = 0; i < item.weight; i += 1) pool.push(item);
        return pool;
      }, []);
      return randomPick(weightedPool.length > 0 ? weightedPool : usable);
    };
    if (Math.random() < 0.9 || unrelatedBroadcasts.length === 0) {
      picked = pickBroadcast(timeBroadcasts);
    } else {
      picked = pickBroadcast(unrelatedBroadcasts);
    }

    petDialogHistory.unshift(picked.line);
    petDialogHistory.splice(6);
    if (picked.reaction) playPetReaction(picked.reaction, 520);
    const growthLine = growthGain > 0 ? `<span class="growth-line">本次报时收集成长 +${Math.round(growthGain)}</span>` : "";
    petDialog.value = `<span class="line">${picked.line}。</span>${growthLine}`;
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      petDialog.value = "";
    }, 8000);
    return;

  }

  async function triggerBlackoutSkill(options: { automatic?: boolean } = {}) {
    blackoutActive.value = true;
    if (blackoutTimer) window.clearTimeout(blackoutTimer);
    blackoutTimer = window.setTimeout(() => {
      blackoutActive.value = false;
    }, options.automatic ? 4200 : 3200);
    if (window.wageclawDesktop?.triggerBlackout) {
      await window.wageclawDesktop.triggerBlackout({ duration: options.automatic ? 4200 : 3200, automatic: Boolean(options.automatic) });
    }
  }

  async function exportBackup() {
    const payload = JSON.stringify(state, null, 2);
    const bridge = window.wageclawDesktop;
    if (bridge?.exportBackup) {
      const result = await bridge.exportBackup(payload);
      if (result.ok && result.filePath) {
        notify(`备份已导出：${result.filePath}`);
      } else if (result.canceled) {
        notify("已取消导出。");
      } else {
        notify(result.message || "备份导出失败。");
      }
      return;
    }
    // Web 模式（无桌面桥）：退化为浏览器下载
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wageclaw-backup-${getLocalDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("备份文件已导出到浏览器默认下载目录。");
  }

  async function importBackup(file: File) {
    if (!window.confirm("导入备份会覆盖当前全部数据（余额、背包、桌宠、账本），确定继续吗？")) return;
    try {
      const restored = sanitizeState(JSON.parse(await file.text()));
      Object.assign(state, restored);
      ensureDailyRageBucket();
      ensureDailyPawLedger();
      ensureDailyQuests();
      checkAchievements();
      saveStateNow();
      addPetLog("导入备份", "从备份文件恢复了全部本地数据。");
      notify("备份已导入，数据已恢复。");
    } catch {
      notify("备份解析失败，请确认选择的是本应用导出的 JSON 文件。");
    }
  }

  function resetAllData() {
    if (!window.confirm("确定要重置所有数据吗？此操作不可撤销。")) return;
    localStorage.removeItem(getWageClawStorageKey());
    Object.assign(state, createFirstRunState());
    notify("数据已重置。");
  }

  function resetPetStatus() {
    if (!window.confirm("确定要重置桌宠状态吗？爪币、背包和账本都会保留。")) return;
    const freshPet = createDefaultState().pet;
    Object.assign(state.pet, freshPet);
    state.dailyPetGrowth = createDailyPetGrowth(getLocalDateKey(now.value));
    state.lastPetFocusReminderAt = now.value.getTime();
    addPetLog("桌宠状态重置", "桌宠属性、热度、互动状态和战斗记录已恢复初始值，余额与背包未改动。");
    notify("桌宠状态已重置。");
  }

  function clearWalletBalance() {
    const current = roundMoney(state.walletBalance);
    if (Math.abs(current) < 0.01) {
      notify("工资余额已经是 0。");
      return;
    }
    if (!window.confirm(`确定清除工资余额 ${formatMoney(current, 2)} 吗？流水会保留，并新增一条清除记录。`)) return;
    state.walletBalance = 0;
    addTransaction("清除工资余额", roundMoney(-current), "数据管理", current >= 0 ? "expense" : "income");
    pages.transactions = 1;
    notify("工资余额已清零。");
  }

  function clearPawBalance() {
    const current = Math.max(0, Number(state.pawBalance) || 0);
    if (current <= 0) {
      notify("爪币余额已经是 0。");
      return;
    }
    if (!window.confirm(`确定清除爪币余额 ${formatPawCoins(current)} 吗？爪币账本会保留，并新增一条清除记录。`)) return;
    state.pawBalance = 0;
    addPawLedgerEntry("清除爪币余额", -current, "数据管理", "event");
    notify("爪币余额已清零。");
  }

  const { duel, startDuel, performDuelSkill, previewOnlineBattle } = createDuelGame({
    state,
    petManaMax: () => petManaMax.value,
    petLevel: () => currentPetStage.value.level,
    addPawCoins,
    addPetLog,
    notify,
    onGameEnd: () => trackQuest("minigame")
  });
  const { gomoku, startGomoku, stopGomoku, handleGomokuMove } = createGomokuGame({ addPawCoins, addPetLog, onGameEnd: () => trackQuest("minigame") });
  const { runner, startRunner, runnerAction, stopRunner, pauseRunner, resumeRunner, disposeRunner } = createRunnerGame({ state, addPawCoins, addPetLog, onGameEnd: () => trackQuest("minigame") });

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (duel.visible) {
      const keyMap: Record<string, Parameters<typeof performDuelSkill>[0]> = {
        j: "punch",
        k: "kick",
        i: "uppercut",
        l: "blast",
        h: "heal",
        Shift: "guard",
        q: "dash",
        e: "dash"
      };
      const skill = keyMap[event.key] || keyMap[event.key.toLowerCase()];
      if (skill) {
        event.preventDefault();
        performDuelSkill(skill);
      }
    }
    if (runner.visible) {
      if (event.key === " " || event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        event.preventDefault();
        runnerAction("jump");
      }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        runnerAction("duck");
      }
    }
  }

  function handleGlobalKeyup() {
    return;
  }

  function bindDesktopBridge() {
    if (window.wageclawDesktop?.onNavigate) {
      bridgeCleanup.push(
        window.wageclawDesktop.onNavigate((payload: { screen?: string }) => {
          if (payload.screen && payload.screen in screenTitles) {
            setActiveScreen(payload.screen as ScreenKey);
          }
        })
      );
    }
    if (window.wageclawDesktop?.onPetCommand) {
      bridgeCleanup.push(
        window.wageclawDesktop.onPetCommand((payload: Record<string, unknown>) => {
          executePetCommand(payload);
        })
      );
    }
  }

  function executePetCommand(payload: Record<string, unknown> = {}) {
    const action = String(payload.action || "");
    if (action === "duel") startDuel();
    if (action === "blackout") triggerBlackoutSkill({ automatic: Boolean(payload.automatic) });
    if (action === "gomoku") startGomoku();
    if (action === "runner") startRunner();
    if (["ricochet", "storm", "nuke"].includes(action)) {
      state.pet.lastLine = `桌面事件「${action}」已触发，软团正在巡视。`;
      showPetBubble(state.pet.lastLine);
    }
  }

  return {
    PAGE_SIZE,
    MALL_PAGE_SIZE,
    viewMode,
    state,
    now,
    activeScreen,
    accountTab,
    mallTab,
    inventorySubTab,
    petTab,
    settingsTab,
    pages,
    notification,
    rantText,
    blackoutActive,
    summonedBubble,
    petReaction,
    petMotionKey,
    petPos,
    petDragging,
    goldRush,
    assembly,
    petDialog,
    duel,
    gomoku,
    runner,
    hasClaimedToday,
    dailySalary,
    secondSalary,
    claimableToday,
    todayClaimedSalary,
    walletCoins,
    totalAvailable,
    salaryCycleProgress,
    physicalMallItems,
    activeWishItem,
    hasValidWorkTime,
    isProfileReady,
    unlockedCount,
    wishSpent,
    wishRemaining,
    wishProgress,
    wishReady,
    wishCollected,
    daysNeeded,
    currentPetStage,
    nextPetStage,
    petAscension,
    petProgress,
    petManaMax,
    petEnergyMax,
    petGrowthGoal,
    dailyGrowthStats,
    petAttributes,
    petAffinity,
    petSatietyLabel,
    petBloodPressurePercent,
    petPressureLabel,
    petStageLore,
    activeWorkEvent,
    pawTodayEarned,
    monthlyPawEarned,
    pawAttendanceProgress,
    monthlyStats,
    monthlyPawStats,
    filteredTransactions,
    pagedTransactions,
    pawLedgerItems,
    pagedPawLedger,
    wishShopItems,
    supplyShopItems,
    filteredSupplyShopItems,
    filteredMallItems,
    pagedMallItems,
    pagedWishShopItems,
    pagedSupplyShopItems,
    inventoryItems,
    earnedGoods,
    pagedInventoryItems,
    petSupplyItems,
    pagedPetSupplyItems,
    pagedUsageLog,
    pagedPetLog,
    countdowns,
    pushCopies,
    parts: activeParts,
    mallItems,
    petStages: activePetStages,
    workEvents,
    moodCopy,
    screenTitles,
    themeLabels,
    petStyleLabels,
    modeLabels,
    transactionCategories,
    setActiveScreen,
    openScreenFromPet,
    closeMainWindow,
     minimizeMainWindow,
     maximizeMainWindow,
    petStageStyle,
    setTransactionFilter,
    setMallFilter,
    setPage,
    getMallItemCurrency,
    setWishItem,
    completeOnboarding,
    getPartPrice,
    formatMoney,
    formatBalance,
    formatRage,
    formatPawCoins,
    formatLight,
    formatWorkEventEffect,
    formatDuration,
    markStretchBreak,
    addInteractionPrompt,
    removeInteractionPrompt,
    addNewsSource,
    removeNewsSource,
    claimDailyWallet,
    buyPart,
    claimWishReward,
    closeAssembly,
    deleteEarnedGood,
    buyMallItem,
    useItem,
    feedPet,
    formatPetBoost,
    refineRageFromRant,
    resolveWorkEventChoice,
    cultivatePet,
    quickCarePet,
    setPetSummoned,
    startPetDrag,
    popPet,
    handleConsolePetSummonClick,
    showPetDialog,
    handleFloatPetDoubleClick,
    handlePetTouch,
    triggerBlackoutSkill,
    resetAllData,
    resetPetStatus,
    clearWalletBalance,
    clearPawBalance,
    dailyQuestViews,
    achievementViews,
    claimQuest,
    exportBackup,
    importBackup,
    startDuel,
    performDuelSkill,
    previewOnlineBattle,
    startGomoku,
    stopGomoku,
    handleGomokuMove,
    startRunner,
    runnerAction,
    stopRunner,
    pauseRunner,
    resumeRunner
  };
}
