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
  transactionCategories
} from "@/data/catalog";
import type {
  CountMode,
  Currency,
  MallItem,
  Mood,
  PetBoost,
  ScreenKey,
  Transaction,
  TransactionCategory,
  UsageLogItem,
  WageClawState
} from "@/types";

const STORAGE_KEY = "wageclaw-state-v3";
const PAGE_SIZE = 10;

type PageKey = "transactions" | "mall" | "inventory" | "usage" | "petSupply" | "petLog" | "community";
type TouchKey = keyof typeof petTouchProfiles;

const rawViewMode = new URLSearchParams(window.location.search).get("view");
const viewMode = (rawViewMode === "pet" ? "pet" : rawViewMode === "float" ? "float" : "main") as "main" | "pet" | "float";

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
    salary: 12000,
    wish: "MacBook Pro",
    price: 15000,
    rageMinutes: 45,
    mood: "rage",
    theme: "forest",
    petStyle: "rageBlob",
    countMode: "natural",
    startTime: "09:30",
    endTime: "18:30",
    payday: 10,
    walletBalance: 4242,
    rageBalance: 88,
    dailyRage: {
      date: getLocalDateKey(),
      value: 0,
      triggered: []
    },
    lastClaimTime: "",
    unlockedParts: ["trackpad"],
    inventory: {
      coffee: 1,
      meeting_jar: 1
    },
    pet: {
      name: "怨息雾团",
      rage: 35,
      light: 0,
      mana: 46,
      manaBonus: 0,
      cultivation: 0,
      satiety: 62,
      affection: 18,
      hunger: 20,
      bloodPressure: 30,
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
      lastBusinessHint: ""
    },
    transactions: [
      {
        id: crypto.randomUUID(),
        title: "初始薪资账户余额",
        amount: 6380,
        note: "来自前几天硬扛记录",
        time: "刚刚",
        category: "income",
        date: getLocalDateKey()
      },
      {
        id: crypto.randomUUID(),
        title: "点亮 触控板",
        amount: -2100,
        note: "MacBook Pro",
        time: "刚刚",
        category: "wish",
        date: getLocalDateKey()
      },
      {
        id: crypto.randomUUID(),
        title: "购买 带薪续命咖啡券",
        amount: -38,
        note: "情绪补给",
        time: "刚刚",
        category: "mall",
        date: getLocalDateKey()
      }
    ],
    usageLog: [],
    petLog: [
      {
        title: "怨气软团醒了",
        detail: "一团怨气在桌角成形，正在等你投喂。",
        time: "刚刚"
      }
    ],
    transactionFilter: "all",
    mallFilter: "all",
    privacyMode: false
  };
}

function sanitizeState(input: unknown): WageClawState {
  const base = createDefaultState();
  if (!input || typeof input !== "object") return base;
  const stored = input as Partial<WageClawState>;
  const merged: WageClawState = {
    ...base,
    ...stored,
    pet: { ...base.pet, ...(stored.pet || {}) },
    dailyRage: { ...base.dailyRage, ...(stored.dailyRage || {}) },
    inventory: { ...base.inventory, ...(stored.inventory || {}) },
    unlockedParts: Array.isArray(stored.unlockedParts) ? stored.unlockedParts : base.unlockedParts,
    transactions: Array.isArray(stored.transactions) ? stored.transactions.map(normalizeTransaction) : base.transactions,
    usageLog: Array.isArray(stored.usageLog) ? stored.usageLog : base.usageLog,
    petLog: Array.isArray(stored.petLog) ? stored.petLog : base.petLog
  };
  merged.salary = Math.max(1, Number(merged.salary) || base.salary);
  merged.price = Math.max(1, Number(merged.price) || base.price);
  merged.rageMinutes = Math.max(0, Number(merged.rageMinutes) || 0);
  merged.walletBalance = Number(merged.walletBalance) || 0;
  merged.rageBalance = Math.max(0, Number(merged.rageBalance) || 0);
  merged.payday = Math.min(31, Math.max(1, Number(merged.payday) || 10));
  merged.theme = (Object.keys(themeLabels).includes(merged.theme) ? merged.theme : "forest") as WageClawState["theme"];
  merged.petStyle = (Object.keys(petStageSeries).includes(merged.petStyle) ? merged.petStyle : "rageBlob") as WageClawState["petStyle"];
  merged.countMode = (Object.keys(modeLabels).includes(merged.countMode) ? merged.countMode : "natural") as CountMode;
  merged.mood = (Object.keys(moodCopy).includes(merged.mood) ? merged.mood : "rage") as Mood;
  merged.privacyMode = Boolean(merged.privacyMode);
  if (!merged.dailyRage.triggered) merged.dailyRage.triggered = [];
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return createDefaultState();
  }
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

function randomPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function useWageClaw() {
  const state = reactive<WageClawState>(loadState());
  const now = ref(new Date());
  const activeScreen = ref<ScreenKey>("converter");
  const accountTab = ref<"wallet" | "wish">("wallet");
  const mallTab = ref<"inventory" | "shop">("inventory");
  const inventorySubTab = ref<"items" | "log">("items");
  const petTab = ref<"status" | "refine" | "feed" | "log">("status");
  const settingsTab = ref<"profile" | "appearance" | "schedule" | "data">("profile");
  const pages = reactive<Record<PageKey, number>>({
    transactions: 1,
    mall: 1,
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
  const petPos = reactive({ x: 0, y: 0 });
  const petDragging = ref(false);
  const goldRush = ref(false);
  const petDialog = ref("");
  let petDragOffset = { x: 0, y: 0 };
  let petDragStart = { x: 0, y: 0 };
  let consolePetClickCount = 0;
  let desktopPetClickCount = 0;
  let lastFloatPetInteractive = false;
  let tickTimer: number | undefined;
  let notifyTimer: number | undefined;
  let blackoutTimer: number | undefined;
  let bubbleTimer: number | undefined;
  let consolePetClickTimer: number | undefined;
  let desktopPetClickTimer: number | undefined;
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
  const walletCoins = computed(() => Math.max(0, state.walletBalance));
  const totalAvailable = computed(() => Math.max(0, state.walletBalance + claimableToday.value));
  const unlockedCount = computed(() => parts.filter((part) => state.unlockedParts.includes(part.id)).length);
  const wishSpent = computed(() => parts.reduce((total, part) => (state.unlockedParts.includes(part.id) ? total + getPartPrice(part.id) : total), 0));
  const wishRemaining = computed(() => Math.max(0, state.price - wishSpent.value));
  const wishProgress = computed(() => unlockedCount.value / parts.length);
  const daysNeeded = computed(() => Math.max(0, Math.ceil(wishRemaining.value / Math.max(1, dailySalary.value))));
  const activePetStages = computed(() => petStageSeries[state.petStyle] || petStageSeries.rageBlob);
  const currentPetStage = computed(() => {
    return [...activePetStages.value].reverse().find((stage) => state.pet.rage >= stage.threshold) || activePetStages.value[0];
  });
  const nextPetStage = computed(() => activePetStages.value.find((stage) => stage.threshold > state.pet.rage) || null);
  const petProgress = computed(() => {
    const next = nextPetStage.value;
    if (!next) return 1;
    const current = currentPetStage.value;
    return clamp((state.pet.rage - current.threshold) / Math.max(1, next.threshold - current.threshold), 0, 1);
  });
  const petManaMax = computed(() => 60 + currentPetStage.value.level * 12 + state.pet.manaBonus);
  const petAffinity = computed(() => {
    const diff = state.pet.light - state.pet.rage * 0.28;
    if (diff > 90) return { label: "澄明", type: "light" };
    if (diff > 20) return { label: "温和", type: "warm" };
    if (diff < -120) return { label: "暴戾", type: "dark" };
    return { label: "混沌", type: "neutral" };
  });
  const petHungerLabel = computed(() => {
    const h = state.pet.hunger;
    if (h >= 80) return { label: "撑到了", color: "#e8a838" };
    if (h >= 50) return { label: "吃饱了", color: "#56b886" };
    if (h >= 25) return { label: "有点饿", color: "#d4a64a" };
    if (h >= 10) return { label: "很饿了", color: "#d4783b" };
    return { label: "饿晕了", color: "#d44a4a" };
  });
  const petPressureLabel = computed(() => {
    const bp = state.pet.bloodPressure;
    if (bp >= 80) return { label: "血压爆表", color: "#d44a4a" };
    if (bp >= 55) return { label: "血压偏高", color: "#d4783b" };
    if (bp >= 30) return { label: "正常偏高", color: "#d4a64a" };
    if (bp >= 10) return { label: "血压正常", color: "#56b886" };
    return { label: "过于平稳", color: "#5b93c8" };
  });
  const petStageLore = computed(() => currentPetStage.value.features.join(" · "));

  function updatePetDecay() {
    state.pet.hunger = clamp(state.pet.hunger - 0.03, 0, 100);
    const dailyRageNorm = Math.min(100, (ensureDailyRageBucket().value / 500) * 100);
    const pressureAdd = Math.max(0, (dailyRageNorm - state.pet.bloodPressure * 0.2) * 0.02);
    state.pet.bloodPressure = clamp(state.pet.bloodPressure + pressureAdd, 0, 100);
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
  const filteredMallItems = computed(() => state.mallFilter === "all" ? mallItems : mallItems.filter((item) => item.category === state.mallFilter));
  const pagedMallItems = computed(() => pageItems(filteredMallItems.value, pages.mall));
  const inventoryItems = computed(() => {
    return Object.entries(state.inventory)
      .map(([id, quantity]) => ({ item: mallItems.find((candidate) => candidate.id === id), quantity }))
      .filter((entry): entry is { item: MallItem; quantity: number } => Boolean(entry.item) && entry.quantity > 0);
  });
  const pagedInventoryItems = computed(() => pageItems(inventoryItems.value, pages.inventory));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    { deep: true }
  );

  onMounted(() => {
    if (viewMode === "float") {
      document.documentElement.style.cssText = "margin:0;padding:0;width:100%;height:100%;background:transparent;overflow:hidden;";
      document.body.style.cssText = "margin:0;padding:0;width:100%;height:100%;background:transparent;overflow:hidden;";
      const app = document.getElementById("app");
      if (app) app.style.cssText = "width:100%;height:100%;background:transparent;overflow:hidden;";
      window.addEventListener("storage", () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            Object.assign(state, JSON.parse(raw));
          } catch (_) {}
        }
      });
      window.addEventListener("mousemove", handleFloatHitTest);
      window.addEventListener("mouseleave", handleFloatMouseLeave);
    } else if (viewMode === "main" && window.wageclawDesktop?.togglePet) {
      window.wageclawDesktop.togglePet(state.pet.summoned);
    }
    petPos.x = window.innerWidth - 180;
    petPos.y = window.innerHeight - 220;
    ensureDailyRageBucket();
    tickTimer = window.setInterval(() => {
      now.value = new Date();
      ensureDailyRageBucket();
      updatePetDecay();
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
    if (runnerTimer) window.clearInterval(runnerTimer);
    window.removeEventListener("keydown", handleGlobalKeydown);
    window.removeEventListener("keyup", handleGlobalKeyup);
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

  function pageItems<T>(items: T[], page: number) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const current = clamp(page, 1, totalPages);
    const start = (current - 1) * PAGE_SIZE;
    return {
      items: items.slice(start, start + PAGE_SIZE),
      current,
      totalPages,
      totalItems: items.length
    };
  }

  function setPage(key: PageKey, direction: number) {
    const map = {
      transactions: filteredTransactions.value.length,
      mall: filteredMallItems.value.length,
      inventory: inventoryItems.value.length,
      usage: state.usageLog.length,
      petSupply: petSupplyItems.value.length,
      petLog: state.petLog.length,
      community: sampleStories.length
    };
    const totalPages = Math.max(1, Math.ceil(map[key] / PAGE_SIZE));
    pages[key] = clamp(pages[key] + direction, 1, totalPages);
  }

  function setActiveScreen(screen: ScreenKey) {
    activeScreen.value = screen;
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
  }

  function getPartPrice(partId: string) {
    const part = parts.find((item) => item.id === partId);
    return part ? Math.round(state.price * part.ratio) : 0;
  }

  function formatMoney(value: number, decimals = 2) {
    return `¥${Number(value || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function formatBalance(value: number, decimals = 2) {
    if (state.privacyMode) return "¥****";
    return formatMoney(value, decimals);
  }

  function formatRage(value: number) {
    return `${Math.round(value || 0)} 怨气`;
  }

  function formatLight(value: number) {
    return `${Math.round(value || 0)} 灵力`;
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

  function addPetLog(title: string, detail: string) {
    state.petLog.unshift({ title, detail, time: formatTime() });
    state.petLog = state.petLog.slice(0, 80);
  }

  function claimDailyWallet() {
    const amount = Math.max(0.01, claimableToday.value);
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
    const part = parts.find((item) => item.id === partId);
    if (!part) return;
    const price = getPartPrice(part.id);
    if (!spendWallet(price, `点亮 ${part.name}`)) return;
    state.unlockedParts.push(part.id);
    addTransaction(`点亮 ${part.name}`, -price, state.wish, "wish");
    state.pet.lastLine = `你把 ${part.name} 点亮了。花出去的钱终于有点像在给自己铺路。`;
    addPetLog("软团围观消费", `${part.name} 已点亮，${state.wish} 更近了一步。`);
    notify(`${part.name} 已点亮。`);
  }

  function getResourceBalance(currency: Currency) {
    return currency === "rage" ? state.rageBalance : totalAvailable.value;
  }

  function buyMallItem(item: MallItem) {
    const currency = item.currency || "wallet";
    if (getResourceBalance(currency) < item.price) {
      notify(currency === "rage" ? "怨气不够，先炼一段糟心事。" : "账户余额不够，先领额度或继续攒。");
      return;
    }
    if (currency === "rage") {
      state.rageBalance -= item.price;
      addPetLog("怨气兑换供品", `${item.name} 已收入背包。`);
    } else if (!spendWallet(item.price, `购买 ${item.name}`)) {
      return;
    }
    if (currency !== "rage") {
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
    state.pet.mana = clamp(state.pet.mana + target, 0, petManaMax.value);
  }

  function formatPetBoost(boost: PetBoost = {}) {
    const result = [
      boost.rage ? `怨气 +${boost.rage}` : "",
      boost.light ? `灵力 +${boost.light}` : "",
      boost.satiety ? `饱食 +${boost.satiety}` : "",
      boost.affection ? `亲密 +${boost.affection}` : "",
      boost.manaCap ? `法力上限 +${boost.manaCap}` : "",
      boost.mana ? `法力 +${boost.mana}` : "",
      boost.hunger ? `饥饿 -${boost.hunger}` : "",
      boost.bloodPressure ? (boost.bloodPressure < 0 ? `血压 ${boost.bloodPressure}` : `血压 +${boost.bloodPressure}`) : ""
    ].filter(Boolean);
    return result.join(" / ");
  }

  function feedPet(item: MallItem) {
    const boost = item.petBoost || {};
    const beforeStage = currentPetStage.value.id;
    state.pet.rage += Number(boost.rage) || 0;
    state.pet.light += Number(boost.light) || 0;
    state.pet.satiety = clamp(state.pet.satiety + (Number(boost.satiety) || 0), 0, 100);
    state.pet.affection = clamp(state.pet.affection + (Number(boost.affection) || 0), 0, 100);
    state.pet.manaBonus += Number(boost.manaCap) || 0;
    state.pet.hunger = clamp(state.pet.hunger + (Number(boost.hunger) || 0), 0, 100);
    state.pet.bloodPressure = clamp(state.pet.bloodPressure + (Number(boost.bloodPressure) || 0), 0, 100);
    restorePetMana(Number(boost.mana) || 0);
    const evolved = beforeStage !== currentPetStage.value.id;
    state.pet.lastLine = evolved
      ? `${item.name} 很对胃口。我进化成 ${currentPetStage.value.name} 了。`
      : `${item.name} 收下了。${formatPetBoost(boost) || "状态稳定"}。`;
    addPetLog(evolved ? "软团进化" : "投喂成功", `${item.name} 生效：${formatPetBoost(boost) || "状态稳定"}。`);
    notify(`${item.name} 已投喂。`);
  }

  function addRageCoins(amount: number, source = "怨气增长") {
    const gained = Math.max(0, Math.round(amount));
    if (!gained) return 0;
    state.rageBalance += gained;
    const bucket = ensureDailyRageBucket();
    bucket.value += gained;
    dailyRageMilestones.forEach((milestone) => {
      if (bucket.value >= milestone.threshold && !bucket.triggered.includes(milestone.id)) {
        bucket.triggered.push(milestone.id);
        state.pet.lastBusinessHint = `${milestone.title} 已触发`;
        if (milestone.action === "blackout") triggerBlackoutSkill({ automatic: true });
      }
    });
    addPetLog(source, `新增 ${formatRage(gained)}。`);
    return gained;
  }

  function ensureDailyRageBucket() {
    const today = getLocalDateKey(now.value);
    if (!state.dailyRage || state.dailyRage.date !== today) {
      state.dailyRage = { date: today, value: 0, triggered: [] };
    }
    if (!Array.isArray(state.dailyRage.triggered)) state.dailyRage.triggered = [];
    return state.dailyRage;
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
    addRageCoins(gained, "糟心事炼化");
    const manaRecover = Math.max(8, Math.round(gained * 0.28));
    restorePetMana(manaRecover);
    state.pet.affection = clamp(state.pet.affection + 2, 0, 100);
    state.pet.lastLine = `炼出 ${formatRage(gained)}，顺手回了 ${manaRecover} 点法力。这段糟心事我先收着。`;
    rantText.value = "";
    notify(`炼化完成：${formatRage(gained)}。`);
  }

  function refineLightFromRant() {
    const text = rantText.value.trim();
    if (!text) {
      notify("先写下想转化的心事。");
      return;
    }
    const base = clamp(Math.round(text.length * 0.9), 12, 120);
    const moodBonus = state.mood === "numb" ? 8 : 6;
    const workBonus = Math.min(40, Math.round(state.rageMinutes / 6));
    const gained = base + moodBonus + workBonus;
    state.pet.light += gained;
    restorePetMana(Math.max(8, Math.round(gained * 0.28)));
    state.pet.affection = clamp(state.pet.affection + 3, 0, 100);
    state.pet.lastLine = `转化出 ${formatLight(gained)}。现在体内是${petAffinity.value.label}的气息。`;
    addPetLog("心事转化", `新增 ${formatLight(gained)}。`);
    rantText.value = "";
    notify(`已转化 ${formatLight(gained)}。`);
  }

  function cultivatePet() {
    const cost = 24 + state.pet.cultivation * 14 + currentPetStage.value.level * 8;
    if (state.rageBalance < cost) {
      notify(`修炼还差 ${formatRage(cost - state.rageBalance)}。`);
      return;
    }
    state.rageBalance -= cost;
    state.pet.cultivation += 1;
    state.pet.rage += 12 + currentPetStage.value.level * 5 + Math.floor(cost / 14);
    state.pet.affection = clamp(state.pet.affection + 3, 0, 100);
    restorePetMana(24 + currentPetStage.value.level * 8);
    state.pet.lastLine = `闭关结束，当前修炼 ${state.pet.cultivation} 重。`;
    addPetLog("怨气修炼", `消耗 ${formatRage(cost)}，修炼提升到 ${state.pet.cultivation} 重。`);
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
    const profile = petTouchProfiles[key as TouchKey];
    state.pet.touchCount += 1;
    state.pet.touchHeat = clamp(state.pet.touchHeat + profile.rage + 1, 0, 100);
    state.pet.touchMood = profile.mood;
    state.pet.rage += profile.nourish;
    state.pet.light += profile.light;
    state.pet.satiety = clamp(state.pet.satiety + profile.satiety, 0, 100);
    state.pet.affection = clamp(state.pet.affection + profile.affection, 0, 100);
    const line = `${profile.label}成功，软团进入「${profile.mood}」状态。`;
    state.pet.lastLine = line;
    showPetBubble(line);
    addRageCoins(profile.rage, profile.logTitle);
  }

  function setFloatPetInteractive(interactive: boolean) {
    if (viewMode !== "float" || lastFloatPetInteractive === interactive) return;
    lastFloatPetInteractive = interactive;
    window.wageclawDesktop?.petHitTest?.(interactive);
  }

  function isFloatPetPointInteractive(x: number, y: number) {
    return document
      .elementsFromPoint(x, y)
      .some((element) => Boolean(element.closest(".pet-sprite")));
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
    petDragging.value = true;
    setFloatPetInteractive(true);
    petDragOffset.x = e.clientX - petPos.x;
    petDragOffset.y = e.clientY - petPos.y;
    petDragStart.x = e.clientX;
    petDragStart.y = e.clientY;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragStart();
    }
    window.addEventListener("mousemove", onWindowPetMove);
    window.addEventListener("mouseup", onWindowPetUp);
  }

  function onWindowPetMove(e: MouseEvent) {
    if (!petDragging.value) return;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragMove(e.movementX, e.movementY);
      return;
    }
    petPos.x = e.clientX - petDragOffset.x;
    petPos.y = e.clientY - petDragOffset.y;
  }

  function onWindowPetUp(e: MouseEvent) {
    const dx = e.clientX - petDragStart.x;
    const dy = e.clientY - petDragStart.y;
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
    if (relY < 0.35) {
      touchKey = Math.random() < 0.6 ? "head" : "face";
      petReaction.value = "frown";
    } else if (relY < 0.7) {
      touchKey = "belly";
      petReaction.value = "squish";
    } else {
      touchKey = Math.random() < 0.5 ? "horn" : "tail";
      petReaction.value = "shake";
    }
    handlePetTouch(touchKey);
    setTimeout(() => {
      petReaction.value = "";
    }, 500);
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
    const cd = countdowns.value;
    const current = now.value;
    const seconds = (current.getHours() * 60 + current.getMinutes()) * 60 + current.getSeconds();
    const startSeconds = timeToMinutes(state.startTime) * 60;
    const endSeconds = startSeconds + shiftSeconds.value;
    const cappedSeconds = clamp(seconds, startSeconds, endSeconds);
    const workedSeconds = Math.max(0, cappedSeconds - startSeconds);
    const earned = dailySalary.value * (workedSeconds / shiftSeconds.value);

    const mood = state.mood;
    const stageLevel = currentPetStage.value.level;
    const petName = currentPetStage.value.name;

    const tonePool: string[] = [];
    if (stageLevel <= 2) tonePool.push("软团缩了缩身子");
    if (stageLevel >= 3 && stageLevel <= 5) tonePool.push(`${petName}凑过来`);
    if (stageLevel >= 6 && stageLevel <= 8) tonePool.push(`${petName}低声道`);
    if (stageLevel >= 9) tonePool.push(`${petName}用沉稳的声音说`);

    const reminderPool: string[] = [
      `「${state.wish}」正在一点点靠近`,
      `${mood === "rage" ? "生气才是正常的反应，别憋着" : mood === "numb" ? "麻了也没关系，机器才全天在线" : "稳住了，但该休息还是要休息"}`,
      "工作只是生活的一部分，不是你的全部",
      "别忘了呼吸，你已经做得够多了",
      "这破班不值得咬牙硬撑，该摸就摸",
      "软团帮你记账，下班再算",
      "每一分钟都在帮自己攒底气"
    ];

    const tone = tonePool.length > 0 ? tonePool[Math.floor(Math.random() * tonePool.length)] : "";
    const toneHtml = tone ? `<span class="tone">${tone}：</span>` : "";
    const facts = [
      `还有 <b>${cd.offWorkText}</b> 下班`,
      `离周六 <b>${cd.saturday.natural}</b> 天`,
      `今天已扛 <b>${formatDuration(workedSeconds * 1000, false)}</b>`,
      `攒了 <b class="gold">${formatMoney(earned, 2)}</b>`
    ];
    petDialog.value = `<span class="line">${toneHtml}${facts.join("，")}。${randomPick(reminderPool)}。</span>`;
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      petDialog.value = "";
    }, 8000);
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
    if (end < current) end.setDate(end.getDate() + 1);
    const saturday = new Date(current);
    const daysUntilSaturday = (6 - saturday.getDay() + 7) % 7 || 7;
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    const payday = new Date(current.getFullYear(), current.getMonth(), Math.min(28, state.payday));
    if (payday < current) payday.setMonth(payday.getMonth() + 1);
    const offWorkMs = end.getTime() - current.getTime();
    return {
      offWorkMs,
      offWorkText: formatDuration(offWorkMs),
      saturday: getWorkdayGap(current, saturday),
      holiday: getWorkdayGap(current, payday),
      paydayLabel: `${payday.getMonth() + 1}月${payday.getDate()}日发薪`
    };
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
    Object.assign(state, createDefaultState());
    notify("数据已重置。");
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
    petPos,
    petDragging,
    goldRush,
    petDialog,
    duel,
    gomoku,
    runner,
    hasClaimedToday,
    dailySalary,
    secondSalary,
    claimableToday,
    walletCoins,
    totalAvailable,
    unlockedCount,
    wishSpent,
    wishRemaining,
    wishProgress,
    daysNeeded,
    currentPetStage,
    nextPetStage,
    petProgress,
    petManaMax,
    petAffinity,
    petHungerLabel,
    petPressureLabel,
    petStageLore,
    monthlyStats,
    filteredTransactions,
    pagedTransactions,
    filteredMallItems,
    pagedMallItems,
    inventoryItems,
    pagedInventoryItems,
    petSupplyItems,
    pagedPetSupplyItems,
    pagedUsageLog,
    pagedPetLog,
    pagedCommunity,
    countdowns,
    safePost,
    pushCopies,
    parts,
    mallItems,
    petStages: activePetStages,
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
    getPartPrice,
    formatMoney,
    formatBalance,
    formatRage,
    formatLight,
    formatDuration,
    claimDailyWallet,
    buyPart,
    buyMallItem,
    useItem,
    feedPet,
    formatPetBoost,
    refineRageFromRant,
    refineLightFromRant,
    cultivatePet,
    setPetSummoned,
    startPetDrag,
    popPet,
    handleConsolePetSummonClick,
    showPetDialog,
    handlePetTouch,
    triggerBlackoutSkill,
    generateCoach,
    publishCommunityDraft,
    resetAllData,
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
