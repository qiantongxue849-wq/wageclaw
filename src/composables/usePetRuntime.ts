import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { petStageSeries, petTouchProfiles, workEvents } from "@/data/catalog";
import { getPetAscensionView } from "@/composables/petAscension";
import {
  addDailyPetGrowth,
  ensureDailyPetGrowth,
  PET_DOUBLE_CLICK_GROWTH,
  PET_PASSIVE_GROWTH_CAP,
  PET_REMINDER_GROWTH
} from "@/composables/petDailyGrowth";
import type { DailyPawLedger, PawLedgerBucket, PetStage, WageClawState, WorkEventEffect } from "@/types";
import { getWageClawStorageKey, loadState } from "@/state/persistence";
import { sanitizeState } from "@/state/sanitize";

type TouchKey = keyof typeof petTouchProfiles;
type TouchHeatTier = "low" | "warm" | "tired";
type PetMotionAction = "idle" | "play" | "sleep";
type PetDelta = {
  rage?: number;
  light?: number;
  satiety?: number;
  affection?: number;
  mana?: number;
  bloodPressure?: number;
  touchHeat?: number;
  bloodPressureFloor?: number;
};

const STATE_SAVE_THROTTLE_MS = 4000;
const DAILY_PAW_ATTENDANCE_CAP = 120;
const DAILY_PAW_INTERACTION_CAP = 48;
const DAILY_PAW_EVENT_CAP = 140;
const PAW_ATTENDANCE_RATE_PER_MINUTE = 0.45;
const WORK_EVENT_MIN_GAP_MS = 8 * 60 * 1000;
const WORK_EVENT_RANDOM_GAP_MS = 12 * 60 * 1000;
const WORK_EVENT_DAILY_LIMIT = 5;
const PET_SATIETY_DECAY_PER_SECOND = 0.0018;
const PET_TOUCH_HEAT_DECAY_PER_SECOND = 0.004;
const BLOOD_PRESSURE_MIN = 80;
const BLOOD_PRESSURE_IDEAL = 118;
const BLOOD_PRESSURE_MAX = 180;
const RELAX_BLOOD_PRESSURE_FLOOR = 96;
const DEFAULT_SEDENTARY_REMINDER_MINUTES = 45;
const DEFAULT_PET_FOCUS_REMINDER_MINUTES = 50;
const PET_SINGLE_CLICK_DELAY_MS = 520;

const rawViewMode = new URLSearchParams(window.location.search).get("view");
const viewMode = rawViewMode === "float" ? "float" : "main";

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

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function normalizeClockTime(value: unknown, fallback = "") {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampBloodPressure(value: number) {
  return clamp(value, BLOOD_PRESSURE_MIN, BLOOD_PRESSURE_MAX);
}

function settleDailyBloodPressure(value: number) {
  const current = clampBloodPressure(value);
  if (current >= 120) return clampBloodPressure(current - Math.min(10, current - BLOOD_PRESSURE_IDEAL));
  if (current < 90) return clampBloodPressure(current + Math.min(4, BLOOD_PRESSURE_IDEAL - current));
  return current;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number, withSeconds = true) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let time = "";
  if (hours > 0) time += `${hours}小时`;
  if (minutes > 0 || hours > 0) time += `${minutes}分`;
  if (withSeconds) time += `${seconds}秒`;
  return time || "0秒";
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

function formatPawCoins(value: number) {
  return `${Math.round(value || 0)} 爪币`;
}

function formatRage(value: number) {
  return `${Math.round(value || 0)} 怨气`;
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

export function usePetRuntime() {
  const state = reactive<WageClawState>(loadState());
  const now = ref(new Date());
  const summonedBubble = ref("");
  const petDialog = ref("");
  const petReaction = ref("");
  const petMotionAction = ref<PetMotionAction>("idle");
  const petMotionKey = ref(0);
  const petDragging = ref(false);
  const mainRuntimeActive = ref(false);
  const petPos = reactive({ x: 0, y: 0 });
  const petDragOffset = { x: 0, y: 0 };
  const petDragStart = { x: 0, y: 0, screenX: 0, screenY: 0 };
  let lastFloatPetInteractive: boolean | null = null;
  let tickTimer: number | undefined;
  let bubbleTimer: number | undefined;
  let desktopPetClickTimer: number | undefined;
  let desktopPetTouchTimer: number | undefined;
  let desktopPetClickCount = 0;
  let reactionTimer: number | undefined;
  let saveTimer: number | undefined;
  let lastSaveAt = 0;
  let syncingFromStorage = false;
  let bridgeCleanup: Array<() => void> = [];

  const activePetStages = computed(() => petStageSeries[state.petStyle] || petStageSeries.rageBlob);
  const currentPetStage = computed<PetStage>(() => {
    return [...activePetStages.value].reverse().find((stage) => state.pet.growth >= stage.threshold) || activePetStages.value[0];
  });
  const nextPetStage = computed(() => activePetStages.value.find((stage) => stage.threshold > state.pet.growth) || null);
  const petAscension = computed(() => getPetAscensionView(state.pet.growth, currentPetStage.value, nextPetStage.value));
  const activeWorkEvent = computed(() => workEvents.find((event) => event.id === state.activeWorkEventId) || null);
  const petManaMax = computed(() => 60 + currentPetStage.value.level * 12 + state.pet.manaBonus + Math.min(72, petAscension.value.completedTier * 6));
  const hasValidWorkTime = computed(() => {
    const start = normalizeClockTime(state.startTime, "");
    const end = normalizeClockTime(state.endTime, "");
    return Boolean(start && end && timeToMinutes(end) > timeToMinutes(start));
  });
  const isProfileReady = computed(() => state.salary > 0 && hasValidWorkTime.value && Boolean(state.activeWishId));
  const floatingPetStyle = computed<CSSProperties>(() => {
    if (viewMode === "float") return {};
    return { transform: `translate3d(${petPos.x}px, ${petPos.y}px, 0)` };
  });

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

  function addPetLog(title: string, detail: string) {
    state.petLog.unshift({ title, detail, time: formatTime() });
    state.petLog = state.petLog.slice(0, 80);
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
        ? `昨天的${formatRage(yesterdayRage)}已经沉淀，桌宠回到 Lv.1，今天重新进化。`
        : "新工作日开始，桌宠回到 Lv.1，今天重新进化。";
      addPetLog("每日成长重置", state.pet.lastLine);
    } else if (growthReset) {
      state.pet.lastLine = "新工作日开始，桌宠回到 Lv.1，今天重新进化。";
      addPetLog("每日成长重置", state.pet.lastLine);
    }
    if (!Array.isArray(state.dailyRage.triggered)) state.dailyRage.triggered = [];
    return state.dailyRage;
  }

  function ensureDailyPawLedger() {
    const today = getLocalDateKey(now.value);
    if (!state.dailyPaw || state.dailyPaw.date !== today) {
      state.dailyPaw = createDailyPawLedger(today, now.value.getTime());
      addPetLog("爪币日报刷新", "桌宠开始记录今天的常驻收益。");
    }
    if (!Array.isArray(state.dailyPaw.handledEvents)) state.dailyPaw.handledEvents = [];
    return state.dailyPaw;
  }

  function ensureMonthlyPawLedger() {
    const month = getCurrentMonthKey(now.value);
    if (!state.monthlyPaw || state.monthlyPaw.month !== month) {
      state.monthlyPaw = { month, earned: 0 };
    }
    return state.monthlyPaw;
  }

  function applyPetDelta(delta: PetDelta) {
    const rage = Math.round(Number(delta.rage) || 0);
    const light = Math.round(Number(delta.light) || 0);
    const satiety = Number(delta.satiety) || 0;
    const affection = Math.round(Number(delta.affection) || 0);
    const mana = Number(delta.mana) || 0;
    const bloodPressure = Number(delta.bloodPressure) || 0;
    const touchHeat = Number(delta.touchHeat) || 0;

    if (rage) state.pet.rage = Math.max(0, state.pet.rage + rage);
    if (light) state.pet.light += light;
    if (satiety) state.pet.satiety = clamp(state.pet.satiety + satiety, 0, 100);
    if (affection) state.pet.affection = clamp(state.pet.affection + affection, 0, 100);
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

  function addPawCoins(amount: number, source = "爪币变动", bucket: Exclude<PawLedgerBucket, "supply"> = "event", silent = false) {
    const ledger = ensureDailyPawLedger();
    const delta = Number(amount) || 0;
    if (!delta) return 0;
    const cap = bucket === "attendance"
      ? DAILY_PAW_ATTENDANCE_CAP
      : bucket === "interaction" ? DAILY_PAW_INTERACTION_CAP : DAILY_PAW_EVENT_CAP;
    const earned = bucket === "attendance"
      ? ledger.attendanceEarned
      : bucket === "interaction" ? ledger.interactionEarned : ledger.eventEarned;
    const actual = delta > 0 ? Math.min(delta, Math.max(0, cap - earned)) : delta;
    if (!actual) return 0;
    state.pawBalance = Math.max(0, state.pawBalance + actual);
    if (bucket === "attendance") ledger.attendanceEarned += actual;
    if (bucket === "interaction") ledger.interactionEarned += actual;
    if (bucket === "event") ledger.eventEarned += actual;
    if (actual > 0) ensureMonthlyPawLedger().earned += actual;
    if (!silent) addPetLog(source, `${actual > 0 ? "获得" : "扣除"} ${formatPawCoins(Math.abs(actual))}。`);
    return actual;
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
  }

  function collectBroadcastGrowth(amount: number, source: string) {
    const actual = addDailyPetGrowth(state, amount, "broadcast", getLocalDateKey(now.value));
    if (actual > 0) {
      addPetLog(source, `今日成长 +${Math.round(actual)}。`);
      saveStateNow();
    }
    return actual;
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
        const line = `久坐提醒：离开椅子活动一下，喝口水，肩颈也该下线维护了。${growth ? ` 今日成长 +${Math.round(growth)}。` : ""}`;
        state.pet.lastLine = line;
        addPetLog("久坐活动提醒", line);
        showPetBubble(line);
      }
    }

    if (state.petFocusReminderEnabled) {
      const intervalMs = clamp(Number(state.petFocusReminderMinutes) || DEFAULT_PET_FOCUS_REMINDER_MINUTES, 15, 180) * 60 * 1000;
      const anchor = Math.max(bounds.startAt, Number(state.pet.lastInteractionAt) || 0, Number(state.lastPetFocusReminderAt) || 0);
      if (current - anchor >= intervalMs) {
        state.lastPetFocusReminderAt = current;
        const pawGain = addPawCoins(2, "专注太久提醒", "interaction", true);
        const growth = collectBroadcastGrowth(PET_REMINDER_GROWTH, "专注提醒收集");
        const line = `你已经专注太久没理我了。伸个懒腰、摸我一下再继续${pawGain ? `，我先把 ${formatPawCoins(pawGain)} 放进爪账` : ""}${growth ? `，今日成长 +${Math.round(growth)}` : ""}。`;
        state.pet.lastLine = line;
        addPetLog("专注太久提醒", line);
        showPetBubble(line);
      }
    }
  }

  function updatePetDecay() {
    state.pet.satiety = clamp(state.pet.satiety - PET_SATIETY_DECAY_PER_SECOND, 0, 100);
    state.pet.touchHeat = clamp(state.pet.touchHeat - PET_TOUCH_HEAT_DECAY_PER_SECOND, 0, 100);
    const dailyRageNorm = Math.min(100, (ensureDailyRageBucket().value / 500) * 100);
    const pressureAdd = dailyRageNorm > 20 ? ((dailyRageNorm - 20) / 80) * 0.002 : 0;
    state.pet.bloodPressure = clampBloodPressure(state.pet.bloodPressure + pressureAdd);
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

  function maybeTriggerWorkEvent() {
    const ledger = ensureDailyPawLedger();
    if (state.activeWorkEventId) return;
    if (ledger.handledEvents.length >= Math.min(WORK_EVENT_DAILY_LIMIT, workEvents.length)) return;
    if (now.value.getTime() < ledger.nextEventAt) return;
    const candidates = workEvents.filter((event) => !ledger.handledEvents.includes(event.id));
    const next = candidates[Math.floor(Math.random() * candidates.length)] || workEvents[0];
    if (!next) return;
    state.activeWorkEventId = next.id;
    state.pet.lastLine = `打工来消息：${next.title}。选一个最像你此刻心情的回应。`;
    addPetLog("桌宠打工事件", next.prompt);
    summonedBubble.value = "";
    petDialog.value = "";
  }

  function scheduleNextWorkEvent() {
    ensureDailyPawLedger().nextEventAt = getNextWorkEventAt(now.value.getTime());
  }

  function applyWorkEventEffect(effect: WorkEventEffect) {
    const actualPaw = effect.paw ? addPawCoins(effect.paw, "打工选择结算", "event", true) : 0;
    const actualGrowth = effect.growth
      ? addDailyPetGrowth(state, effect.growth, "event", getLocalDateKey(now.value))
      : 0;
    const rage = Number(effect.rage) || 0;
    if (rage) {
      applyPetDelta({ rage });
      if (rage > 0) ensureDailyRageBucket().value += rage;
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
    if (!ledger.handledEvents.includes(event.id)) ledger.handledEvents.push(event.id);
    state.activeWorkEventId = "";
    scheduleNextWorkEvent();
    const growthLine = actualGrowth ? `成长 +${Math.round(actualGrowth)}` : "成长已到今日上限";
    const pawLine = choice.effect.paw ? `，爪币${actualPaw >= 0 ? "+" : ""}${Math.round(actualPaw)}` : "";
    const detail = choice.detail.replace(/[。！？!?，,；;：:\s]+$/g, "");
    state.pet.lastLine = `${choice.label}：${detail}，${growthLine}${pawLine}。`;
    addPetLog(`打工事件：${event.title}`, state.pet.lastLine);
    showPetBubble(state.pet.lastLine);
    saveStateNow();
  }

  function showPetBubble(message: string) {
    petDialog.value = "";
    summonedBubble.value = message;
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      summonedBubble.value = "";
    }, 3600);
  }

  function playPetReaction(reaction: string, durationMs = 500, action: PetMotionAction = "idle") {
    petMotionKey.value += 1;
    petReaction.value = "";
    petMotionAction.value = action;
    window.requestAnimationFrame(() => {
      petReaction.value = reaction;
    });
    if (reactionTimer) window.clearTimeout(reactionTimer);
    reactionTimer = window.setTimeout(() => {
      petReaction.value = "";
      petMotionAction.value = "idle";
    }, durationMs);
  }

  function clearPendingDesktopPetTouch() {
    if (!desktopPetTouchTimer) return;
    window.clearTimeout(desktopPetTouchTimer);
    desktopPetTouchTimer = undefined;
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
    const heatLine = tier === "warm" ? "，互动有点频繁" : tier === "tired" ? "，软团已经有点累" : "";
    const line = `${profile.label}成功，软团进入「${state.pet.touchMood}」状态${heatLine}${pawGain ? `，顺手赚到${formatPawCoins(pawGain)}` : ""}。`;
    state.pet.lastLine = line;
    showPetBubble(line);
    saveStateNow();
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

  function startPetDrag(event: MouseEvent) {
    if ((event.target as HTMLElement | null)?.closest(".pet-work-event")) return;
    clearPendingDesktopPetTouch();
    markPetInteraction();
    petDragging.value = true;
    setFloatPetInteractive(true);
    petDragOffset.x = event.clientX - petPos.x;
    petDragOffset.y = event.clientY - petPos.y;
    petDragStart.x = event.clientX;
    petDragStart.y = event.clientY;
    petDragStart.screenX = event.screenX;
    petDragStart.screenY = event.screenY;
    window.wageclawDesktop?.petDragStart?.(event.screenX, event.screenY);
    window.addEventListener("mousemove", onWindowPetMove);
    window.addEventListener("mouseup", onWindowPetUp);
  }

  function onWindowPetMove(event: MouseEvent) {
    if (!petDragging.value) return;
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragMove?.(event.screenX, event.screenY);
      return;
    }
    petPos.x = event.clientX - petDragOffset.x;
    petPos.y = event.clientY - petDragOffset.y;
  }

  function onWindowPetUp(event: MouseEvent) {
    const dx = event.screenX - petDragStart.screenX || event.clientX - petDragStart.x;
    const dy = event.screenY - petDragStart.screenY || event.clientY - petDragStart.y;
    const dragged = Math.abs(dx) > 4 || Math.abs(dy) > 4;
    petDragging.value = false;
    window.removeEventListener("mousemove", onWindowPetMove);
    window.removeEventListener("mouseup", onWindowPetUp);
    window.wageclawDesktop?.petDragEnd?.();
    if (!dragged) {
      triggerPetClickFromEvent(event);
    }
    if (viewMode === "float") {
      setFloatPetInteractive(isFloatPetPointInteractive(event.clientX, event.clientY));
    }
  }

  function triggerPetClickFromEvent(event: MouseEvent) {
    if (viewMode === "float") {
      desktopPetClickCount += 1;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
      if (desktopPetClickCount >= 3) {
        desktopPetClickCount = 0;
        clearPendingDesktopPetTouch();
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
    const relY = (event.clientY - rect.top) / rect.height;
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
    const runTouch = () => {
      playPetReaction(reaction, 500);
      handlePetTouch(touchKey);
    };
    if (viewMode === "float") {
      clearPendingDesktopPetTouch();
      desktopPetTouchTimer = window.setTimeout(() => {
        desktopPetTouchTimer = undefined;
        runTouch();
      }, PET_SINGLE_CLICK_DELAY_MS);
      return;
    }
    runTouch();
  }

  async function openMainPanelFromPet() {
    state.pet.lastLine = "控制台已经叫醒。";
    showPetBubble(state.pet.lastLine);
    saveStateNow();
    await window.wageclawDesktop?.openMainPanel?.();
  }

  function showPetDialog(growthGain = 0) {
    summonedBubble.value = "";
    if (!state.onboardingDone || !isProfileReady.value) {
      petDialog.value = `<span class="line">先完成首次设置，桌宠就能开始替你记录工资进度。</span>`;
      void window.wageclawDesktop?.openMainPanel?.();
    } else {
      const current = now.value;
      const end = new Date(current);
      const [hour = "18", minute = "00"] = state.endTime.split(":");
      end.setHours(Number(hour), Number(minute), 0, 0);
      const offWorkMs = Math.max(0, end.getTime() - current.getTime());
      const offWorkText = current >= end ? "已经下班" : `离下班还有 ${formatDuration(offWorkMs)}`;
      const line = state.activeWorkEventId
        ? `${offWorkText}。后台还有一个打工事件没处理，先别让它挤满脑子。`
        : `${offWorkText}。我在桌面值班，主界面不用一直开着。`;
      const growthLine = growthGain > 0 ? `<span class="growth-line">本次报时收集成长 +${Math.round(growthGain)}</span>` : "";
      petDialog.value = `<span class="line">${line}</span>${growthLine}`;
    }
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      petDialog.value = "";
    }, 8000);
  }

  function handleFloatPetDoubleClick() {
    clearPendingDesktopPetTouch();
    markPetInteraction();
    const growth = isProfileReady.value ? collectBroadcastGrowth(PET_DOUBLE_CLICK_GROWTH, "双击报时收集") : 0;
    showPetDialog(growth);
  }

  async function triggerBlackoutSkill(options: { automatic?: boolean } = {}) {
    await window.wageclawDesktop?.triggerBlackout?.({ duration: options.automatic ? 4200 : 3200, automatic: Boolean(options.automatic) });
  }

  function executePetCommand(payload: Record<string, unknown> = {}) {
    const action = String(payload.action || "");
    if (action === "blackout") void triggerBlackoutSkill({ automatic: Boolean(payload.automatic) });
    if (action === "play") playPetReaction("play", 1300, "play");
    if (action === "sleep") playPetReaction("sleep", 2800, "sleep");
    if (["ricochet", "storm", "nuke"].includes(action)) {
      state.pet.lastLine = `桌面事件「${action}」已触发。`;
      showPetBubble(state.pet.lastLine);
      playPetReaction("shake", 700);
    }
  }

  function bindDesktopBridge() {
    if (window.wageclawDesktop?.onPetCommand) {
      bridgeCleanup.push(window.wageclawDesktop.onPetCommand(executePetCommand));
    }
    if (window.wageclawDesktop?.onMainVisibility) {
      bridgeCleanup.push(
        window.wageclawDesktop.onMainVisibility((payload) => {
          mainRuntimeActive.value = Boolean(payload.visible);
          if (payload.visible) syncStateFromStorage();
          else {
            syncStateFromStorage();
            ensureDailyPawLedger().lastAttendanceAt = now.value.getTime();
          }
        })
      );
    }
  }

  function tick() {
    now.value = new Date();
    if (mainRuntimeActive.value) return;
    if (state.onboardingDone) {
      ensureDailyRageBucket();
      ensureDailyPawLedger();
      updatePetDecay();
      updatePawAttendance();
      maybeTriggerCareReminders();
      maybeTriggerWorkEvent();
    }
  }

  watch(state, scheduleStateSave, { deep: true });

  onMounted(() => {
    petPos.x = Math.max(0, window.innerWidth - 180);
    petPos.y = Math.max(0, window.innerHeight - 210);
    window.addEventListener("storage", syncStateFromStorage);
    window.addEventListener("beforeunload", saveStateNow);
    window.addEventListener("mousemove", handleFloatHitTest);
    window.addEventListener("mouseleave", handleFloatMouseLeave);
    bindDesktopBridge();
    setFloatPetInteractive(false);
    tickTimer = window.setInterval(tick, 1000);
    if (!state.onboardingDone || !isProfileReady.value) {
      window.setTimeout(() => {
        void window.wageclawDesktop?.openMainPanel?.();
      }, 350);
    }
  });

  onUnmounted(() => {
    saveStateNow();
    if (tickTimer) window.clearInterval(tickTimer);
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    if (desktopPetTouchTimer) window.clearTimeout(desktopPetTouchTimer);
    if (reactionTimer) window.clearTimeout(reactionTimer);
    if (saveTimer) window.clearTimeout(saveTimer);
    window.removeEventListener("storage", syncStateFromStorage);
    window.removeEventListener("beforeunload", saveStateNow);
    window.removeEventListener("mousemove", handleFloatHitTest);
    window.removeEventListener("mouseleave", handleFloatMouseLeave);
    window.removeEventListener("mousemove", onWindowPetMove);
    window.removeEventListener("mouseup", onWindowPetUp);
    bridgeCleanup.forEach((cleanup) => cleanup());
    bridgeCleanup = [];
    setFloatPetInteractive(true);
  });

  return {
    viewMode,
    state,
    now,
    summonedBubble,
    petDialog,
    petReaction,
    petMotionAction,
    petMotionKey,
    petDragging,
    mainRuntimeActive,
    floatingPetStyle,
    currentPetStage,
    petAscension,
    activeWorkEvent,
    isProfileReady,
    startPetDrag,
    handleFloatPetDoubleClick,
    resolveWorkEventChoice,
    openMainPanelFromPet
  };
}
