import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
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
  sampleStories,
  screenTitles,
  themeLabels,
  transactionCategories,
  workEvents
} from "@/data/catalog";
import type {
  CountMode,
  Currency,
  DailyPawLedger,
  EarnedGood,
  MallItem,
  MonthlyPawLedger,
  Mood,
  PawLedgerBucket,
  PawLedgerItem,
  PetBoost,
  PetInteractionMode,
  ScreenKey,
  Transaction,
  TransactionCategory,
  UsageLogItem,
  WageClawState,
  WorkEventEffect
} from "@/types";

const STORAGE_KEY = "wageclaw-state-v3";
const PAGE_SIZE = 10;
const MALL_PAGE_SIZE = 9;
const legacyIphone16PartIds = ["iphone_frame", "iphone_screen", "iphone_battery", "iphone_camera", "iphone_chip", "iphone_storage"];
const DAILY_PAW_ATTENDANCE_CAP = 120;
const DAILY_PAW_INTERACTION_CAP = 48;
const DAILY_PAW_EVENT_CAP = 140;
const PAW_ATTENDANCE_RATE_PER_MINUTE = 0.45;
const WORK_EVENT_MIN_GAP_MS = 8 * 60 * 1000;
const WORK_EVENT_RANDOM_GAP_MS = 12 * 60 * 1000;
const WORK_EVENT_DAILY_LIMIT = 5;
const PET_SHAKE_MIN_HORIZONTAL_TRAVEL = 120;
const PET_SHAKE_MIN_HORIZONTAL_RANGE = 48;
const PET_SHAKE_MIN_DIRECTION_CHANGES = 2;
const PET_SHAKE_MAX_VERTICAL_DRIFT = 160;
const PET_SHAKE_HORIZONTAL_DOMINANCE = 1.35;
const PET_SHAKE_MIN_DIRECTION_RUN = 20;
const PET_SHAKE_PICKER_REVEAL_DELAY_MS = 120;
const DEFAULT_START_TIME = "08:30";
const DEFAULT_END_TIME = "18:00";
const DEFAULT_PAYDAY = 15;
const LEGACY_DEFAULT_START_TIME = "09:30";
const LEGACY_DEFAULT_END_TIME = "18:30";
const LEGACY_DEFAULT_PAYDAY = 10;
const PET_SATIETY_DECAY_PER_SECOND = 0.0018;
const PET_TOUCH_HEAT_DECAY_PER_SECOND = 0.004;
const PET_MANA_BONUS_MAX = 60;
const BLOOD_PRESSURE_MIN = 80;
const BLOOD_PRESSURE_IDEAL = 118;
const BLOOD_PRESSURE_MAX = 180;
const RELAX_BLOOD_PRESSURE_FLOOR = 96;
const MEDICINE_BLOOD_PRESSURE_FLOOR = 90;

type PageKey = "transactions" | "pawLedger" | "mall" | "wishShop" | "supplyShop" | "inventory" | "usage" | "petSupply" | "petLog" | "community";
type MallTab = "wishShop" | "supplyShop" | "inventory";
type TouchKey = keyof typeof petTouchProfiles;
type QuickCareAction = "feed" | "play" | "sleep";
type TouchHeatTier = "low" | "warm" | "tired";
type PetDelta = {
  rage?: number;
  growth?: number;
  light?: number;
  satiety?: number;
  affection?: number;
  manaCap?: number;
  mana?: number;
  bloodPressure?: number;
  touchHeat?: number;
  bloodPressureFloor?: number;
};

const rawViewMode = new URLSearchParams(window.location.search).get("view");
const viewMode = (rawViewMode === "pet" ? "pet" : rawViewMode === "float" ? "float" : "main") as "main" | "pet" | "float";
const availableScreens = new Set<ScreenKey>(["converter", "mall", "pet", "settings"]);

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function createDefaultState(): WageClawState {
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
    startTime: "",
    endTime: "",
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
    activeWorkEventId: "",
    lastClaimTime: "",
    activeWishId: "",
    unlockedParts: [],
    inventory: {},
    earnedGoods: [],
    pet: {
      name: "怨息雾团",
      rage: 35,
      growth: 35,
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
      interactionMode: "normal",
      battleWins: 0,
      battleLosses: 0,
      battleBestCombo: 0,
      lastBusinessHint: ""
    },
    transactions: [],
    pawLedger: [],
    usageLog: [],
    petLog: [],
    transactionFilter: "all",
    mallFilter: "all",
    privacyMode: false
  };
}

function createFirstRunState(): WageClawState {
  const state = createDefaultState();
  state.transactions = [];
  state.pawLedger = [];
  state.usageLog = [];
  state.petLog = [];
  return state;
}

function sanitizeState(input: unknown): WageClawState {
  const base = createDefaultState();
  if (!input || typeof input !== "object") return createFirstRunState();
  const stored = input as Partial<WageClawState>;
  const storedPet = (stored.pet || {}) as Partial<WageClawState["pet"]> & { hunger?: number };
  const { hunger: legacyHunger, ...storedPetWithoutLegacy } = storedPet;
  const dailyPaw = normalizeDailyPawLedger(stored.dailyPaw, base.dailyPaw);
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
  merged.pet.growth = Math.max(0, Number(merged.pet.growth ?? merged.pet.rage) || 0);
  merged.pet.manaBonus = clamp(Number(merged.pet.manaBonus) || 0, 0, PET_MANA_BONUS_MAX);
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
  merged.pet.interactionMode = merged.pet.interactionMode === "rage" ? "rage" : "normal";
  merged.privacyMode = Boolean(merged.privacyMode);
  merged.onboardingDone = typeof stored.onboardingDone === "boolean"
    ? stored.onboardingDone
    : Boolean(merged.salary > 0 && merged.startTime && merged.endTime && merged.activeWishId);
  if (!merged.dailyRage.triggered) merged.dailyRage.triggered = [];
  if (!workEvents.some((event) => event.id === merged.activeWorkEventId)) {
    merged.activeWorkEventId = merged.onboardingDone ? workEvents[0]?.id || "" : "";
  }
  return merged;
}

function normalizeTransaction(item: Partial<Transaction>): Transaction {
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

function normalizePawLedgerItem(item: Partial<PawLedgerItem>): PawLedgerItem {
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

function normalizeEarnedGood(item: Partial<EarnedGood>): EarnedGood {
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return createFirstRunState();
  }
}

function normalizeClockTime(value: unknown, fallback: string) {
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

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percentOf(value: number, max = 100) {
  return clamp(Math.round((value / Math.max(1, max)) * 100), 0, 100);
}

function clampBloodPressure(value: number) {
  return clamp(value, BLOOD_PRESSURE_MIN, BLOOD_PRESSURE_MAX);
}

function normalizeBloodPressure(value: unknown, fallback = BLOOD_PRESSURE_IDEAL) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return fallback;
  const systolic = raw > 0 && raw < BLOOD_PRESSURE_MIN ? 90 + raw * 0.9 : raw;
  return clampBloodPressure(systolic);
}

function bloodPressurePercent(value: number) {
  return percentOf(clampBloodPressure(value) - BLOOD_PRESSURE_MIN, BLOOD_PRESSURE_MAX - BLOOD_PRESSURE_MIN);
}

function settleDailyBloodPressure(value: number) {
  const current = clampBloodPressure(value);
  if (current >= 120) return clampBloodPressure(current - Math.min(10, current - BLOOD_PRESSURE_IDEAL));
  if (current < 90) return clampBloodPressure(current + Math.min(4, BLOOD_PRESSURE_IDEAL - current));
  return current;
}

function getTouchHeatTier(heat: number): TouchHeatTier {
  if (heat >= 85) return "tired";
  if (heat >= 60) return "warm";
  return "low";
}

function softenPositiveDelta(value: number, tier: TouchHeatTier) {
  const delta = Math.round(Number(value) || 0);
  if (delta <= 0) return delta;
  if (tier === "tired") return 0;
  if (tier === "warm") return Math.max(1, Math.round(delta / 2));
  return delta;
}

function adjustTouchPressureDelta(value: number, tier: TouchHeatTier) {
  const delta = Math.round(Number(value) || 0);
  if (tier === "tired") {
    if (delta < 0) return 0;
    if (delta > 0) return delta + 1;
  }
  if (tier === "warm" && delta < 0) return -Math.max(1, Math.round(Math.abs(delta) / 2));
  return delta;
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getPaydayDate(year: number, month: number, payday: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(lastDay, Math.max(1, Math.round(payday || 1)));
  return new Date(year, month, day, 0, 0, 0, 0);
}

function getSalaryCycle(current: Date, payday: number) {
  const thisPayday = getPaydayDate(current.getFullYear(), current.getMonth(), payday);
  if (current >= thisPayday) {
    return {
      start: thisPayday,
      end: getPaydayDate(current.getFullYear(), current.getMonth() + 1, payday)
    };
  }
  return {
    start: getPaydayDate(current.getFullYear(), current.getMonth() - 1, payday),
    end: thisPayday
  };
}

function randomPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getNextWorkEventAt(base = Date.now()) {
  return base + WORK_EVENT_MIN_GAP_MS + Math.floor(Math.random() * WORK_EVENT_RANDOM_GAP_MS);
}

function createDailyPawLedger(date = getLocalDateKey(), base = Date.now()): DailyPawLedger {
  return {
    date,
    attendanceEarned: 0,
    interactionEarned: 0,
    eventEarned: 0,
    handledEvents: [],
    lastAttendanceAt: base,
    nextEventAt: getNextWorkEventAt(base)
  };
}

function createMonthlyPawLedger(month = getCurrentMonthKey()): MonthlyPawLedger {
  return {
    month,
    earned: 0
  };
}

function getDailyPawEarned(ledger: DailyPawLedger) {
  return Math.max(0, ledger.attendanceEarned) + Math.max(0, ledger.interactionEarned) + Math.max(0, ledger.eventEarned);
}

function normalizeDailyPawLedger(input: Partial<DailyPawLedger> | undefined, fallback: DailyPawLedger): DailyPawLedger {
  return {
    date: input?.date || fallback.date,
    attendanceEarned: Math.max(0, Number(input?.attendanceEarned) || 0),
    interactionEarned: Math.max(0, Number(input?.interactionEarned) || 0),
    eventEarned: Number(input?.eventEarned) || 0,
    handledEvents: Array.isArray(input?.handledEvents) ? input.handledEvents.filter((id) => workEvents.some((event) => event.id === id)) : [],
    lastAttendanceAt: Number(input?.lastAttendanceAt) || fallback.lastAttendanceAt,
    nextEventAt: Number(input?.nextEventAt) || fallback.nextEventAt
  };
}

function normalizeMonthlyPawLedger(input: Partial<MonthlyPawLedger> | undefined, fallback: MonthlyPawLedger): MonthlyPawLedger {
  return {
    month: input?.month || fallback.month,
    earned: Math.max(0, Number(input?.earned ?? fallback.earned) || 0)
  };
}

const holidayCountdowns = [
  { name: "元旦", month: 1, day: 1, daysOff: 1 },
  { name: "春节", month: 2, day: 17, daysOff: 8 },
  { name: "清明节", month: 4, day: 5, daysOff: 3 },
  { name: "劳动节", month: 5, day: 1, daysOff: 5 },
  { name: "端午节", month: 6, day: 19, daysOff: 3 },
  { name: "中秋节", month: 9, day: 25, daysOff: 3 },
  { name: "国庆节", month: 10, day: 1, daysOff: 7 }
];

export function useWageClaw() {
  const state = reactive<WageClawState>(loadState());
  const now = ref(new Date());
  const activeScreen = ref<ScreenKey>("converter");
  const accountTab = ref<"split" | "realized">("split");
  const mallTab = ref<MallTab>("wishShop");
  const inventorySubTab = ref<"items" | "log">("items");
  const petTab = ref<"status" | "refine" | "feed" | "log">("status");
  const settingsTab = ref<"profile" | "appearance" | "data">("profile");
  const pages = reactive<Record<PageKey, number>>({
    transactions: 1,
    pawLedger: 1,
    mall: 1,
    wishShop: 1,
    supplyShop: 1,
    inventory: 1,
    usage: 1,
    petSupply: 1,
    petLog: 1,
    community: 1
  });
  const notification = ref("");
  const rantText = ref("");
  const coachInput = ref("");
  const coachResponse = ref("");
  const communityDraft = ref("王总在上海 XX 科技会议室让我把客户赵总的数据今晚重新跑完，还不能告诉任何人。");
  const blackoutActive = ref(false);
  const summonedBubble = ref("");
  const petReaction = ref("");
  const petMotionKey = ref(0);
  const petModePicker = ref(false);
  const petPos = reactive({ x: 0, y: 0 });
  const petDragging = ref(false);
  const goldRush = ref(false);
  const assembly = reactive({
    visible: false,
    line: "你不是在奖励加班，你是在把忍耐换回选择权。"
  });
  const petDialog = ref("");
  let petDragOffset = { x: 0, y: 0 };
  let petDragStart = { x: 0, y: 0, screenX: 0, screenY: 0 };
  let petShake = {
    lastX: 0,
    lastY: 0,
    lastScreenX: 0,
    lastScreenY: 0,
    gestureX: 0,
    gestureY: 0,
    minGestureX: 0,
    maxGestureX: 0,
    lastDir: 0,
    directionChanges: 0,
    horizontalTravel: 0,
    verticalTravel: 0,
    directionRun: 0,
    modePickerReady: false
  };
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
  let bridgeCleanup: Array<() => void> = [];

  const duel = reactive({
    visible: false,
    active: false,
    playerHp: 100,
    enemyHp: 100,
    energy: 42,
    mana: 32,
    combo: 0,
    phase: "待命中",
    status: "点击开战后，可用 J/K/I/L/H 或按钮出招。",
    result: ""
  });

  const gomoku = reactive({
    visible: false,
    active: false,
    size: 15,
    board: Array.from({ length: 15 }, () => Array<number>(15).fill(0)),
    playerTurn: true,
    wins: 0,
    losses: 0,
    draws: 0,
    result: ""
  });

  const runner = reactive({
    visible: false,
    active: false,
    score: 0,
    best: state.pet.gameBest,
    pose: "ready",
    obstacle: "会议",
    result: ""
  });
  let runnerTimer: number | undefined;

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
  const petGrowthGoal = computed(() => Math.round(nextPetStage.value?.threshold || Math.max(currentPetStage.value.threshold, state.pet.growth, 1)));
  const petProgress = computed(() => {
    const next = nextPetStage.value;
    if (!next) return 1;
    const current = currentPetStage.value;
    return clamp((state.pet.growth - current.threshold) / Math.max(1, next.threshold - current.threshold), 0, 1);
  });
  const petManaMax = computed(() => 60 + currentPetStage.value.level * 12 + state.pet.manaBonus);
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
      value: Math.round(state.pet.growth),
      max: petGrowthGoal.value,
      percent: percentOf(state.pet.growth, petGrowthGoal.value),
      color: "#e7a84c"
    }
  ]);
  const petPressureLabel = computed(() => {
    const bp = state.pet.bloodPressure;
    if (bp >= 160) return { label: "高压警报", color: "#d44a4a" };
    if (bp >= 140) return { label: "二级偏高", color: "#d45c3b" };
    if (bp >= 130) return { label: "一级偏高", color: "#d4783b" };
    if (bp >= 120) return { label: "略高", color: "#d4a64a" };
    if (bp >= 90) return { label: "正常", color: "#56b886" };
    return { label: "偏低", color: "#5b93c8" };
  });
  const petStageLore = computed(() => currentPetStage.value.features.join(" · "));
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
        note: `摸摸、敲敲和陪伴奖励，上限 ${formatPawCoins(DAILY_PAW_INTERACTION_CAP)}`,
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
  const pagedCommunity = computed(() => pageItems(sampleStories, pages.community));
  const countdowns = computed(() => getCountdowns(now.value));
  const safePost = computed(() => sanitizePost(communityDraft.value));
  const pushCopies = computed(() => {
    return {
      morning: `${state.nickname}，今天先把 ${state.wish} 的进度守住。预计今日可产生 ${formatMoney(dailySalary.value)} 忍耐额度。`,
      evening: `离下班还有 ${countdowns.value.offWorkText}。先别接新的大坑，今天已硬扛 ${formatDuration(now.value.getTime() - appStartedAt, false)}。`,
      followUp: `如果情绪开始顶不住，把一句糟心事炼成怨气，软团会把它收进账本。`
    };
  });
  const appStartedAt = Date.now();

  watch(
    state,
    () => {
      if (syncingFromStorage) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    { deep: true }
  );

  function syncStateFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    tickTimer = window.setInterval(() => {
      now.value = new Date();
      if (state.onboardingDone) {
        ensureDailyRageBucket();
        ensureDailyPawLedger();
        updatePetDecay();
        updatePawAttendance();
        maybeTriggerWorkEvent();
      }
    }, 1000);
    bindDesktopBridge();
    window.addEventListener("keydown", handleGlobalKeydown);
    window.addEventListener("keyup", handleGlobalKeyup);
  });

  onUnmounted(() => {
    if (tickTimer) window.clearInterval(tickTimer);
    if (notifyTimer) window.clearTimeout(notifyTimer);
    if (blackoutTimer) window.clearTimeout(blackoutTimer);
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    if (consolePetClickTimer) window.clearTimeout(consolePetClickTimer);
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    if (petReactionTimer) window.clearTimeout(petReactionTimer);
    if (runnerTimer) window.clearInterval(runnerTimer);
    window.removeEventListener("keydown", handleGlobalKeydown);
    window.removeEventListener("keyup", handleGlobalKeyup);
    window.removeEventListener("storage", syncStateFromStorage);
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
      community: sampleStories.length
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
    return {
      "--pet-body": stage.palette.body,
      "--pet-belly": stage.palette.belly,
      "--pet-accent": stage.palette.accent,
      "--pet-glow": stage.palette.glow,
      "--pet-eye": stage.palette.eye,
      "--pet-shadow": stage.palette.shadow
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
    if (!state.activeWorkEventId) state.activeWorkEventId = workEvents[0]?.id || "";
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
    state.transactions = state.transactions.slice(0, 120);
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
    state.pawLedger = state.pawLedger.slice(0, 120);
    pages.pawLedger = 1;
  }

  function addPetLog(title: string, detail: string) {
    state.petLog.unshift({ title, detail, time: formatTime() });
    state.petLog = state.petLog.slice(0, 80);
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
  }

  function useItem(item: MallItem) {
    const count = state.inventory[item.id] || 0;
    if (count <= 0) return;
    state.inventory[item.id] = count - 1;
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
    state.usageLog = state.usageLog.slice(0, 80);
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
    const growth = Math.max(0, Math.round(growthGain ?? gained));
    const pressure = pressureGain ?? Math.min(8, Math.max(1, Math.round(gained * 0.06)));
    applyPetDelta({
      rage: gained,
      growth,
      bloodPressure: pressure,
      bloodPressureFloor: pressure < 0 ? RELAX_BLOOD_PRESSURE_FLOOR : undefined
    });
    const bucket = ensureDailyRageBucket();
    bucket.value += gained;
    dailyRageMilestones.forEach((milestone) => {
      if (bucket.value >= milestone.threshold && !bucket.triggered.includes(milestone.id)) {
        bucket.triggered.push(milestone.id);
        state.pet.lastBusinessHint = `${milestone.title} 已触发`;
        if (milestone.action === "blackout") triggerBlackoutSkill({ automatic: true });
      }
    });
    const growthLine = growth !== gained ? `，成长 +${growth}` : "";
    addPetLog(source, `新增 ${formatRage(gained)}${growthLine}${pressure ? `，${formatBloodPressureDelta(pressure)}` : ""}。`);
    return gained;
  }

  function ensureDailyRageBucket() {
    const today = getLocalDateKey(now.value);
    if (!state.dailyRage || state.dailyRage.date !== today) {
      const yesterdayRage = Math.round(state.dailyRage?.value || state.pet.rage || 0);
      state.dailyRage = { date: today, value: 0, triggered: [] };
      state.pet.rage = 0;
      state.pet.cultivation = 0;
      state.pet.touchHeat = 0;
      state.pet.bloodPressure = settleDailyBloodPressure(state.pet.bloodPressure);
      state.pet.lastLine = yesterdayRage > 0
        ? `昨天的 ${formatRage(yesterdayRage)} 已沉淀，今天重新从一小团怨气开始养。`
        : "新工作日开始，软团把怨气炉清空，等你投喂今天的糟心事。";
      addPetLog("每日怨气重置", state.pet.lastLine);
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
      state.activeWorkEventId = workEvents[0]?.id || "";
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
    if (elapsedMs <= 0 || ledger.attendanceEarned >= DAILY_PAW_ATTENDANCE_CAP) return;
    addPawCoins((elapsedMs / 60000) * PAW_ATTENDANCE_RATE_PER_MINUTE, "桌宠出勤", "attendance", true);
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
    return actualPaw;
  }

  function resolveWorkEventChoice(choiceId: string) {
    const event = activeWorkEvent.value;
    if (!event) return;
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    const ledger = ensureDailyPawLedger();
    const actualPaw = applyWorkEventEffect(choice.effect);
    if (!ledger.handledEvents.includes(event.id)) {
      ledger.handledEvents.push(event.id);
    }
    state.activeWorkEventId = "";
    scheduleNextWorkEvent();
    const pawLine = choice.effect.paw ? `，爪币${actualPaw >= 0 ? "+" : ""}${Math.round(actualPaw)}` : "";
    state.pet.lastLine = `${choice.label}：${choice.detail}${pawLine}。`;
    addPetLog(`打工事件：${event.title}`, `${choice.label}。${formatWorkEventEffect(choice.effect)}。`);
    notify(`${event.title} 已处理：${formatWorkEventEffect(choice.effect)}。`);
  }

  function refineRageFromRant() {
    const text = rantText.value.trim();
    if (!text) {
      notify("先写两句糟心事，再炼怨气。");
      return;
    }
    const base = clamp(Math.round(text.length * 0.9), 12, 120);
    const moodBonus = state.mood === "rage" ? 12 : state.mood === "numb" ? 8 : 6;
    const workBonus = Math.min(40, Math.round(state.rageMinutes / 6));
    const gained = base + moodBonus + workBonus;
    const growthGain = Math.min(80, Math.round(gained * 0.65));
    addRageCoins(gained, "糟心事炼化", -4, growthGain);
    const manaRecover = Math.max(8, Math.round(gained * 0.22));
    restorePetMana(manaRecover);
    applyPetDelta({ affection: 2 });
    state.pet.lastLine = `炼出 ${formatRage(gained)}，沉淀 ${growthGain} 点成长，顺手回了 ${manaRecover} 点法力。这段糟心事我先收着。`;
    rantText.value = "";
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
    petModePicker.value = false;
    summonedBubble.value = message;
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      summonedBubble.value = "";
    }, 3600);
  }

  function showPetModePicker() {
    summonedBubble.value = "";
    petDialog.value = "";
    petModePicker.value = true;
    desktopPetClickCount = 0;
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    petReaction.value = "shake";
    setTimeout(() => {
      if (petReaction.value === "shake") petReaction.value = "";
    }, 500);
  }

  function selectPetInteractionMode(mode: PetInteractionMode) {
    state.pet.interactionMode = mode;
    desktopPetClickCount = 0;
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    const line = mode === "rage"
      ? "已切到怨气收集模式。下次点击会变成小锤敲击，随机收集怨气和血压，同时照常赚爪币。"
        : "已切回陪伴模式。点击只赚爪币，双击播报，三击打开后台。";
    state.pet.lastLine = line;
    addPetLog("桌宠互动模式", line);
    showPetBubble(line);
  }

  function handlePetTouch(key: string) {
    if (!(key in petTouchProfiles)) return;
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
    const line = `${profile.label}成功，软团进入「${state.pet.touchMood}」状态${effectLine ? `，${effectLine}` : ""}${heatLine}${pawGain ? `，顺手赚到 ${formatPawCoins(pawGain)}` : ""}。`;
    state.pet.lastLine = line;
    showPetBubble(line);
  }

  function handlePetHammerTouch(key: string) {
    if (!(key in petTouchProfiles)) return;
    const profile = petTouchProfiles[key as TouchKey];
    const touchKey = key as TouchKey;
    const tier = getTouchHeatTier(state.pet.touchHeat);
    const moodDeltaByTouch: Record<TouchKey, number> = { head: 0, face: -1, belly: 0, horn: -1, tail: -3 };
    state.pet.touchCount += 1;
    applyPetDelta({ affection: moodDeltaByTouch[touchKey], touchHeat: 18 });
    state.pet.touchMood = "怨气收集中";
    const pawGain = addPawCoins(profile.nourish, "小锤互动", "interaction", true);
    const baseRageGain = randomInt(4, 10) + Math.floor(currentPetStage.value.level / 3);
    const rageGain = tier === "tired" ? Math.max(1, Math.round(baseRageGain * 0.5)) : baseRageGain;
    const pressureGain = randomInt(2, 5) + (tier === "tired" ? 1 : 0);
    const actualRage = addRageCoins(rageGain, "小锤怨气收集", pressureGain);
    const moodLine = moodDeltaByTouch[touchKey] ? `，心情 ${moodDeltaByTouch[touchKey]}` : "";
    const tiredLine = tier === "tired" ? "，软团太烦了，收集效率下降" : "";
    const line = `小锤敲击成功，收集 ${formatRage(actualRage)}，${formatBloodPressureDelta(pressureGain)}${moodLine}${tiredLine}${pawGain ? `，爪币 +${Math.round(pawGain)}` : ""}。`;
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
      .some((element) => Boolean(element.closest(".pet-sprite, .pet-mode-picker")));
  }

  function handleFloatHitTest(event: MouseEvent) {
    if (viewMode !== "float") return;
    const interactive = petDragging.value || isFloatPetPointInteractive(event.clientX, event.clientY);
    setFloatPetInteractive(interactive);
  }

  function handleFloatMouseLeave() {
    if (!petDragging.value) setFloatPetInteractive(false);
  }

  function resetPetShakeTracker(e: MouseEvent) {
    petShake = {
      lastX: e.clientX,
      lastY: e.clientY,
      lastScreenX: e.screenX,
      lastScreenY: e.screenY,
      gestureX: 0,
      gestureY: 0,
      minGestureX: 0,
      maxGestureX: 0,
      lastDir: 0,
      directionChanges: 0,
      horizontalTravel: 0,
      verticalTravel: 0,
      directionRun: 0,
      modePickerReady: false
    };
  }

  function trackPetShake(e: MouseEvent) {
    const screenDx = e.screenX - petShake.lastScreenX;
    const screenDy = e.screenY - petShake.lastScreenY;
    const dx = screenDx || e.movementX || e.clientX - petShake.lastX;
    const dy = screenDy || e.movementY || e.clientY - petShake.lastY;
    petShake.lastX = e.clientX;
    petShake.lastY = e.clientY;
    petShake.lastScreenX = e.screenX;
    petShake.lastScreenY = e.screenY;
    petShake.gestureX += dx;
    petShake.gestureY += dy;
    petShake.minGestureX = Math.min(petShake.minGestureX, petShake.gestureX);
    petShake.maxGestureX = Math.max(petShake.maxGestureX, petShake.gestureX);
    petShake.horizontalTravel += Math.abs(dx);
    petShake.verticalTravel += Math.abs(dy);
    const horizontalStep = Math.abs(dx);
    if (horizontalStep < 3) return { dx, dy };
    const dir = dx > 0 ? 1 : -1;
    if (!petShake.lastDir) {
      petShake.lastDir = dir;
      petShake.directionRun = horizontalStep;
      return { dx, dy };
    }
    if (petShake.lastDir === dir) {
      petShake.directionRun += horizontalStep;
      return { dx, dy };
    }
    if (petShake.directionRun >= PET_SHAKE_MIN_DIRECTION_RUN) {
      petShake.directionChanges += 1;
    }
    petShake.lastDir = dir;
    petShake.directionRun = horizontalStep;
    return { dx, dy };
  }

  function didShakePet() {
    const mostlyHorizontal = petShake.horizontalTravel >= petShake.verticalTravel * PET_SHAKE_HORIZONTAL_DOMINANCE;
    const horizontalRange = petShake.maxGestureX - petShake.minGestureX;
    return (
      petShake.horizontalTravel >= PET_SHAKE_MIN_HORIZONTAL_TRAVEL &&
      horizontalRange >= PET_SHAKE_MIN_HORIZONTAL_RANGE &&
      petShake.directionChanges >= PET_SHAKE_MIN_DIRECTION_CHANGES &&
      petShake.verticalTravel <= PET_SHAKE_MAX_VERTICAL_DRIFT &&
      mostlyHorizontal
    );
  }

  function armPetShakeModePicker() {
    petShake.modePickerReady = true;
    desktopPetClickCount = 0;
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
  }

  function startPetDrag(e: MouseEvent) {
    if ((e.target as HTMLElement | null)?.closest(".pet-mode-picker")) return;
    petDragging.value = true;
    setFloatPetInteractive(true);
    petModePicker.value = false;
    resetPetShakeTracker(e);
    petDragOffset.x = e.clientX - petPos.x;
    petDragOffset.y = e.clientY - petPos.y;
    petDragStart.x = e.clientX;
    petDragStart.y = e.clientY;
    petDragStart.screenX = e.screenX;
    petDragStart.screenY = e.screenY;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragStart();
    }
    window.addEventListener("mousemove", onWindowPetMove);
    window.addEventListener("mouseup", onWindowPetUp);
  }

  function onWindowPetMove(e: MouseEvent) {
    if (!petDragging.value) return;
    const dragDelta = trackPetShake(e);
    if (!petShake.modePickerReady && didShakePet()) armPetShakeModePicker();
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragMove(dragDelta.dx, dragDelta.dy);
      return;
    }
    petPos.x = e.clientX - petDragOffset.x;
    petPos.y = e.clientY - petDragOffset.y;
  }

  function onWindowPetUp(e: MouseEvent) {
    const dx = e.screenX - petDragStart.screenX || e.clientX - petDragStart.x;
    const dy = e.screenY - petDragStart.screenY || e.clientY - petDragStart.y;
    const dragged = Math.abs(dx) > 4 || Math.abs(dy) > 4;
    const shouldOpenModePicker = petShake.modePickerReady || didShakePet();
    petDragging.value = false;
    window.removeEventListener("mousemove", onWindowPetMove);
    window.removeEventListener("mouseup", onWindowPetUp);
    if (!dragged && !shouldOpenModePicker) {
      triggerPetClickFromEvent(e);
    } else if (shouldOpenModePicker) {
      petReaction.value = "";
      window.setTimeout(showPetModePicker, PET_SHAKE_PICKER_REVEAL_DELAY_MS);
    }
    if (viewMode === "float") {
      setFloatPetInteractive(shouldOpenModePicker || isFloatPetPointInteractive(e.clientX, e.clientY));
    }
  }

  function triggerPetClickFromEvent(e: MouseEvent) {
    const isRageCollection = state.pet.interactionMode === "rage";
    if (viewMode === "float" && !isRageCollection) {
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
    } else if (isRageCollection) {
      desktopPetClickCount = 0;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    }
    const el = document.querySelector(".floating-pet");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    let touchKey: string;
    let reaction: string;
    if (relY < 0.35) {
      touchKey = Math.random() < 0.6 ? "head" : "face";
      reaction = isRageCollection ? "hammer" : "frown";
    } else if (relY < 0.7) {
      touchKey = "belly";
      reaction = isRageCollection ? "hammer" : "squish";
    } else {
      touchKey = Math.random() < 0.5 ? "horn" : "tail";
      reaction = isRageCollection ? "hammer" : "shake";
    }
    playPetReaction(reaction, isRageCollection ? 340 : 500);
    if (isRageCollection) {
      handlePetHammerTouch(touchKey);
    } else {
      handlePetTouch(touchKey);
    }
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
    if (state.pet.interactionMode === "rage") {
      desktopPetClickCount = 0;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
      return;
    }
    showPetDialog();
  }

  function popPet() {
    petReaction.value = "pop";
    setTimeout(() => {
      petReaction.value = "";
    }, 400);
  }

  function handleConsolePetSummonClick() {
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

  function showPetDialog() {
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
    petDialog.value = `<span class="line">${picked.line}。</span>`;
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

  function generateCoach() {
    const mood = moodCopy[state.mood];
    const context = coachInput.value.trim() || "今天的工位消耗让我有点顶不住。";
    coachResponse.value = [
      `1. 情绪确认：${mood.comfort}`,
      `2. 目标锚定：你现在不是为了证明自己能忍，而是在把每一分钟换成「${state.wish}」的进度。`,
      `3. 战术建议：${mood.tactic} 针对这件事：${context}`
    ].join("\n");
  }

  function sanitizePost(raw: string) {
    return raw
      .replace(/[王李张赵刘陈杨黄周吴郑孙][\u4e00-\u9fa5]{0,2}(总|经理|主管|老师|哥|姐)?/g, "[某同事]")
      .replace(/[\u4e00-\u9fa5A-Za-z0-9]+(科技|信息|网络|集团|公司|部门)/g, "[某公司]")
      .replace(/(上海|北京|深圳|广州|杭州|成都|武汉|南京|苏州|西安)[\u4e00-\u9fa5A-Za-z0-9\s-]*/g, "[某地]")
      .replace(/客户[\u4e00-\u9fa5A-Za-z0-9]+/g, "[某客户]");
  }

  function publishCommunityDraft() {
    communityDraft.value = safePost.value;
    notify("已生成脱敏版本，可复制到匿名树洞。");
  }

  function getWorkdaysInMonth(year: number, monthIndex: number) {
    const total = new Date(year, monthIndex + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(year, monthIndex, day);
      const week = date.getDay();
      if (week !== 0 && week !== 6) count += 1;
    }
    return count;
  }

  function getWorkdayGap(start: Date, end: Date) {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const target = new Date(end);
    target.setHours(0, 0, 0, 0);
    let natural = 0;
    let workday = 0;
    while (cursor < target) {
      natural += 1;
      const week = cursor.getDay();
      if (week !== 0 && week !== 6) workday += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { natural, workday };
  }

  function getCountdowns(current: Date) {
    const end = new Date(current);
    const [hour = "18", minute = "30"] = state.endTime.split(":");
    end.setHours(Number(hour), Number(minute), 0, 0);
    const offWorkMs = Math.max(0, end.getTime() - current.getTime());
    const isOffWork = current >= end;
    const saturday = new Date(current);
    const daysUntilSaturday = (6 - saturday.getDay() + 7) % 7;
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    const payday = new Date(current.getFullYear(), current.getMonth(), Math.min(28, state.payday));
    if (payday < current) payday.setMonth(payday.getMonth() + 1);
    const nextHoliday = getNextHoliday(current);
    return {
      offWorkMs,
      offWorkText: isOffWork ? "已经下班" : formatDuration(offWorkMs),
      isOffWork,
      saturday: getWorkdayGap(current, saturday),
      saturdayText: daysUntilSaturday === 0 ? "今天是周六" : `离周六 <b>${daysUntilSaturday}</b> 天`,
      holiday: getWorkdayGap(current, payday),
      nextHoliday,
      paydayLabel: `${payday.getMonth() + 1}月${payday.getDate()}日发薪`
    };
  }

  function getNextHoliday(current: Date) {
    const candidates = [current.getFullYear(), current.getFullYear() + 1].flatMap((year) => {
      return holidayCountdowns.map((holiday) => {
        const date = new Date(year, holiday.month - 1, holiday.day);
        date.setHours(0, 0, 0, 0);
        return { ...holiday, date };
      });
    });
    const currentDay = new Date(current);
    currentDay.setHours(0, 0, 0, 0);
    const target = candidates
      .filter((holiday) => holiday.date >= currentDay)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const gap = getWorkdayGap(current, target.date);
    return { ...target, ...gap };
  }

  function buildHolidayLine(holiday: ReturnType<typeof getNextHoliday>) {
    return randomPick([
      `${holiday.name}在路上了，前面还有 <b>${holiday.workday}</b> 个工作日，先把今天这格走完`,
      `再过 <b>${holiday.natural}</b> 个自然日就是${holiday.name}，通常能放 ${holiday.daysOff} 天，已经能看到一点光了`,
      `${holiday.name}正在加载中：<b>${holiday.workday}</b> 个工作日后，允许暂时从工位撤退`,
      `离${holiday.name}不算远了，<b>${holiday.natural}</b> 个自然日后给自己安排点真正的休息`,
      `下一站${holiday.name}，通常 ${holiday.daysOff} 天假，软团先帮你把盼头记上`
    ]);
  }

  function formatDuration(ms: number, withSeconds = true) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let time = "";
    if (hours > 0) time += `${hours}小时`;
    if (minutes > 0 || hours > 0) time += `${minutes}分`;
    if (withSeconds) time += `${seconds}秒`;
    return days > 0 ? `${days}天${time}` : time;
  }

  function resetAllData() {
    if (!window.confirm("确定要重置所有数据吗？此操作不可撤销。")) return;
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, createFirstRunState());
    notify("数据已重置。");
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

  function startDuel() {
    duel.visible = true;
    duel.active = true;
    duel.playerHp = 100;
    duel.enemyHp = 100;
    duel.energy = 42;
    duel.mana = Math.min(petManaMax.value, Math.max(32, state.pet.mana));
    duel.combo = 0;
    duel.phase = "开战";
    duel.status = "老板怨念体已出现，先用 J/K 试探距离。";
    duel.result = "";
  }

  function performDuelSkill(skill: "punch" | "kick" | "uppercut" | "blast" | "heal" | "guard" | "dash") {
    if (!duel.active) startDuel();
    if (!duel.active) return;
    const moves = {
      punch: { label: "普通拳", damage: 10, cost: 0, gain: 12 },
      kick: { label: "反弹脚", damage: 16, cost: 0, gain: 9 },
      uppercut: { label: "嘴替暴击", damage: 24, cost: 24, gain: 4 },
      blast: { label: "怨气波", damage: 30, cost: 36, gain: 0 },
      heal: { label: "安抚回血", damage: -18, cost: 22, gain: 0 },
      guard: { label: "格挡", damage: 0, cost: 0, gain: 18 },
      dash: { label: "闪身", damage: 4, cost: 8, gain: 10 }
    };
    const move = moves[skill];
    if (move.cost > duel.energy) {
      duel.status = `${move.label} 需要 ${move.cost} 爆发，当前不够。`;
      return;
    }
    duel.energy = clamp(duel.energy - move.cost + move.gain, 0, 100);
    if (skill === "heal") {
      duel.playerHp = clamp(duel.playerHp + Math.abs(move.damage), 0, 100);
      duel.status = "你先把自己的血条拉回来。";
    } else if (skill === "guard") {
      duel.status = "格挡成功，下一波离谱需求被弹开一半。";
    } else {
      const crit = Math.random() * 100 < 15;
      const damage = Math.round(move.damage * (crit ? 1.6 : 1) + 30 * 0.08);
      duel.enemyHp = clamp(duel.enemyHp - damage, 0, 100);
      duel.combo += 1;
      duel.status = `${move.label}${crit ? "暴击" : "命中"}，造成 ${damage} 点伤害。`;
    }
    if (duel.enemyHp <= 0) {
      endDuel(true);
      return;
    }
    enemyTurn(skill === "guard");
  }

  function enemyTurn(guarding = false) {
    const damage = Math.max(4, Math.round(14 + Math.random() * 12 - 20 * 0.08));
    const finalDamage = guarding ? Math.round(damage * 0.4) : damage;
    duel.playerHp = clamp(duel.playerHp - finalDamage, 0, 100);
    duel.phase = guarding ? "格挡反击" : "交锋中";
    if (duel.playerHp <= 0) {
      endDuel(false);
    }
  }

  function endDuel(win: boolean) {
    duel.active = false;
    duel.result = win ? "胜利" : "失败";
    duel.phase = win ? "你赢了" : "软团被打散";
    duel.status = win ? "老板怨念体暂时退散。" : "这局先撤，补给一下再来。";
    if (win) state.pet.battleWins += 1;
    else state.pet.battleLosses += 1;
    state.pet.battleBestCombo = Math.max(state.pet.battleBestCombo, duel.combo);
    addPetLog(win ? "工位对战胜利" : "工位对战失利", `连击 ${duel.combo}，当前战绩 ${state.pet.battleWins} 胜 / ${state.pet.battleLosses} 负。`);
  }

  function previewOnlineBattle() {
    notify(randomPick(["联机协议层已预留，可接房间号和战绩榜。", "当前先开放本地对战，联机入口保留。"]));
  }

  function startGomoku() {
    gomoku.visible = true;
    gomoku.active = true;
    gomoku.playerTurn = true;
    gomoku.result = "";
    gomoku.board = Array.from({ length: gomoku.size }, () => Array<number>(gomoku.size).fill(0));
  }

  function stopGomoku() {
    gomoku.visible = false;
    gomoku.active = false;
  }

  function handleGomokuMove(row: number, col: number) {
    if (!gomoku.active || !gomoku.playerTurn || gomoku.board[row][col]) return;
    gomoku.board[row][col] = 1;
    if (checkGomokuWin(1)) {
      gomoku.wins += 1;
      gomoku.result = "你赢了。软团承认你这步有点东西。";
      gomoku.active = false;
      return;
    }
    gomoku.playerTurn = false;
    window.setTimeout(() => {
      const move = findGomokuMove();
      if (!move) {
        gomoku.draws += 1;
        gomoku.result = "棋盘下满，平局。";
        gomoku.active = false;
        return;
      }
      gomoku.board[move.row][move.col] = 2;
      if (checkGomokuWin(2)) {
        gomoku.losses += 1;
        gomoku.result = "软团赢了。它看起来很得意。";
        gomoku.active = false;
      }
      gomoku.playerTurn = true;
    }, 240);
  }

  function findGomokuMove() {
    const center = Math.floor(gomoku.size / 2);
    const candidates: Array<{ row: number; col: number; score: number }> = [];
    for (let row = 0; row < gomoku.size; row += 1) {
      for (let col = 0; col < gomoku.size; col += 1) {
        if (gomoku.board[row][col]) continue;
        let score = 10 - Math.abs(row - center) - Math.abs(col - center);
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (!dr && !dc) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < gomoku.size && nc >= 0 && nc < gomoku.size) {
              if (gomoku.board[nr][nc] === 2) score += 6;
              if (gomoku.board[nr][nc] === 1) score += 5;
            }
          }
        }
        candidates.push({ row, col, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function checkGomokuWin(player: number) {
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ];
    for (let row = 0; row < gomoku.size; row += 1) {
      for (let col = 0; col < gomoku.size; col += 1) {
        if (gomoku.board[row][col] !== player) continue;
        for (const [dr, dc] of dirs) {
          let count = 1;
          for (let step = 1; step < 5; step += 1) {
            const nr = row + dr * step;
            const nc = col + dc * step;
            if (nr < 0 || nr >= gomoku.size || nc < 0 || nc >= gomoku.size || gomoku.board[nr][nc] !== player) break;
            count += 1;
          }
          if (count >= 5) return true;
        }
      }
    }
    return false;
  }

  function startRunner() {
    runner.visible = true;
    runner.active = true;
    runner.score = 0;
    runner.pose = "run";
    runner.result = "";
    if (runnerTimer) window.clearInterval(runnerTimer);
    runnerTimer = window.setInterval(() => {
      if (!runner.active) return;
      runner.score += runner.pose === "duck" ? 2 : 1;
      if (runner.score % 60 === 0) runner.obstacle = randomPick(["会议", "甩锅", "周报", "临需"]);
      if (Math.random() < 0.035 && runner.pose === "run") {
        runner.result = `被「${runner.obstacle}」撞到，得分 ${runner.score}。`;
        stopRunner(false);
      }
    }, 90);
  }

  function runnerAction(action: "jump" | "duck") {
    if (!runner.active) startRunner();
    runner.pose = action;
    runner.score += action === "jump" ? 8 : 5;
    window.setTimeout(() => {
      if (runner.active) runner.pose = "run";
    }, action === "jump" ? 460 : 320);
  }

  function stopRunner(close = true) {
    runner.active = false;
    runner.best = Math.max(runner.best, runner.score);
    state.pet.gameBest = runner.best;
    if (runnerTimer) window.clearInterval(runnerTimer);
    if (close) runner.visible = false;
  }

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
    coachInput,
    coachResponse,
    communityDraft,
    blackoutActive,
    summonedBubble,
    petReaction,
    petMotionKey,
    petModePicker,
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
    petProgress,
    petManaMax,
    petEnergyMax,
    petGrowthGoal,
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
    pagedCommunity,
    countdowns,
    safePost,
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
    selectPetInteractionMode,
    popPet,
    handleConsolePetSummonClick,
    showPetDialog,
    handleFloatPetDoubleClick,
    handlePetTouch,
    triggerBlackoutSkill,
    generateCoach,
    publishCommunityDraft,
    resetAllData,
    clearWalletBalance,
    clearPawBalance,
    startDuel,
    performDuelSkill,
    previewOnlineBattle,
    startGomoku,
    stopGomoku,
    handleGomokuMove,
    startRunner,
    runnerAction,
    stopRunner
  };
}
