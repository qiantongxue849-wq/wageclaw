import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { petStageSeries, petTouchProfiles } from "@/data/catalog";
import type { DailyPawLedger, PawLedgerBucket, PetInteractionMode, PetStage, WageClawState } from "@/types";
import { loadState, sanitizeState, STORAGE_KEY } from "@/composables/useWageClaw";

type TouchKey = keyof typeof petTouchProfiles;
type TouchHeatTier = "low" | "warm" | "tired";
type PetMotionAction = "idle" | "play" | "sleep";
type PetDelta = {
  rage?: number;
  growth?: number;
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
const PAW_ATTENDANCE_RATE_PER_MINUTE = 0.45;
const PET_SATIETY_DECAY_PER_SECOND = 0.0018;
const PET_TOUCH_HEAT_DECAY_PER_SECOND = 0.004;
const BLOOD_PRESSURE_MIN = 80;
const BLOOD_PRESSURE_IDEAL = 118;
const BLOOD_PRESSURE_MAX = 180;
const RELAX_BLOOD_PRESSURE_FLOOR = 96;
const PET_SHAKE_MIN_HORIZONTAL_TRAVEL = 120;
const PET_SHAKE_MIN_HORIZONTAL_RANGE = 48;
const PET_SHAKE_MIN_DIRECTION_CHANGES = 2;
const PET_SHAKE_MAX_VERTICAL_DRIFT = 160;
const PET_SHAKE_HORIZONTAL_DOMINANCE = 1.35;
const PET_SHAKE_MIN_DIRECTION_RUN = 20;
const PET_SHAKE_PICKER_REVEAL_DELAY_MS = 120;

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

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
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

function formatBloodPressureDelta(value: number) {
  const delta = Math.round(value || 0);
  return `血压${delta > 0 ? "+" : ""}${delta}mmHg`;
}

function createDailyPawLedger(date = getLocalDateKey(), base = Date.now()): DailyPawLedger {
  return {
    date,
    attendanceEarned: 0,
    interactionEarned: 0,
    eventEarned: 0,
    handledEvents: [],
    lastAttendanceAt: base,
    nextEventAt: base + 20 * 60 * 1000
  };
}

export function usePetRuntime() {
  const state = reactive<WageClawState>(loadState());
  const now = ref(new Date());
  const summonedBubble = ref("");
  const petDialog = ref("");
  const petReaction = ref("");
  const petModePicker = ref(false);
  const petMotionAction = ref<PetMotionAction>("idle");
  const petMotionKey = ref(0);
  const petDragging = ref(false);
  const mainRuntimeActive = ref(false);
  const petPos = reactive({ x: 0, y: 0 });
  const petDragOffset = { x: 0, y: 0 };
  const petDragStart = { x: 0, y: 0, screenX: 0, screenY: 0 };
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
  let lastFloatPetInteractive: boolean | null = null;
  let tickTimer: number | undefined;
  let bubbleTimer: number | undefined;
  let desktopPetClickTimer: number | undefined;
  let desktopPetClickCount = 0;
  let reactionTimer: number | undefined;
  let saveTimer: number | undefined;
  let lastSaveAt = 0;
  let syncingFromStorage = false;
  let bridgeCleanup: Array<() => void> = [];

  const activePetStages = computed(() => petStageSeries[state.petStyle] || petStageSeries.rageBlob);
  const currentPetStage = computed<PetStage>(() => {
    return (
      [...activePetStages.value].reverse().find((stage) => state.pet.growth >= stage.threshold) ||
      activePetStages.value[0]
    );
  });
  const petManaMax = computed(() => 60 + currentPetStage.value.level * 12 + state.pet.manaBonus);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
    if (!state.dailyRage || state.dailyRage.date !== today) {
      const yesterdayRage = Math.round(state.dailyRage?.value || state.pet.rage || 0);
      state.dailyRage = { date: today, value: 0, triggered: [] };
      state.pet.rage = 0;
      state.pet.cultivation = 0;
      state.pet.touchHeat = 0;
      state.pet.bloodPressure = settleDailyBloodPressure(state.pet.bloodPressure);
      state.pet.lastLine =
        yesterdayRage > 0
          ? `昨天的${formatRage(yesterdayRage)}已经沉淀，今天重新开始。`
          : "新工作日开始，软团已经开始值班。";
      addPetLog("每日怨气重置", state.pet.lastLine);
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
    const growth = Math.round(Number(delta.growth) || 0);
    const light = Math.round(Number(delta.light) || 0);
    const satiety = Number(delta.satiety) || 0;
    const affection = Math.round(Number(delta.affection) || 0);
    const mana = Number(delta.mana) || 0;
    const bloodPressure = Number(delta.bloodPressure) || 0;
    const touchHeat = Number(delta.touchHeat) || 0;

    if (rage) state.pet.rage = Math.max(0, state.pet.rage + rage);
    if (growth) state.pet.growth = Math.max(0, state.pet.growth + growth);
    if (light) state.pet.light += light;
    if (satiety) state.pet.satiety = clamp(state.pet.satiety + satiety, 0, 100);
    if (affection) state.pet.affection = clamp(state.pet.affection + affection, 0, 100);
    if (mana) state.pet.mana = clamp(state.pet.mana + mana, 0, petManaMax.value);
    if (bloodPressure) {
      const current = clampBloodPressure(state.pet.bloodPressure);
      const next = clampBloodPressure(current + bloodPressure);
      const floor = delta.bloodPressureFloor;
      state.pet.bloodPressure =
        bloodPressure < 0 && typeof floor === "number" ? Math.max(next, Math.min(current, floor)) : next;
    }
    if (touchHeat) state.pet.touchHeat = clamp(state.pet.touchHeat + touchHeat, 0, 100);
  }

  function addPawCoins(
    amount: number,
    source = "爪币变动",
    bucket: Exclude<PawLedgerBucket, "supply"> = "event",
    silent = false
  ) {
    const ledger = ensureDailyPawLedger();
    const delta = Number(amount) || 0;
    if (!delta) return 0;
    const cap = bucket === "attendance" ? DAILY_PAW_ATTENDANCE_CAP : DAILY_PAW_INTERACTION_CAP;
    const earned = bucket === "attendance" ? ledger.attendanceEarned : ledger.interactionEarned;
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
    ensureDailyRageBucket().value += gained;
    addPetLog(source, `新增 ${formatRage(gained)}，成长+${growth}，${formatBloodPressureDelta(pressure)}。`);
    return gained;
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
    if (elapsedMs <= 0 || ledger.attendanceEarned >= DAILY_PAW_ATTENDANCE_CAP) return;
    addPawCoins((elapsedMs / 60000) * PAW_ATTENDANCE_RATE_PER_MINUTE, "桌宠出勤", "attendance", true);
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

  function showPetModePicker() {
    summonedBubble.value = "";
    petDialog.value = "";
    petModePicker.value = true;
    desktopPetClickCount = 0;
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    playPetReaction("shake", 500);
  }

  function selectPetInteractionMode(mode: PetInteractionMode) {
    state.pet.interactionMode = mode;
    desktopPetClickCount = 0;
    if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    const line =
      mode === "rage"
        ? "已切到怨气收集模式。点击会敲一下软团，顺手收集怨气。"
        : "已切回陪伴模式。点击摸摸，双击播报，三击打开主界面。";
    state.pet.lastLine = line;
    addPetLog("桌宠互动模式", line);
    showPetBubble(line);
    saveStateNow();
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
    const heatLine = tier === "warm" ? "，互动有点频繁" : tier === "tired" ? "，软团已经有点累" : "";
    const line = `${profile.label}成功，软团进入「${state.pet.touchMood}」状态${heatLine}${pawGain ? `，顺手赚到${formatPawCoins(pawGain)}` : ""}。`;
    state.pet.lastLine = line;
    showPetBubble(line);
    saveStateNow();
  }

  function handlePetHammerTouch(key: string) {
    if (!(key in petTouchProfiles)) return;
    const profile = petTouchProfiles[key as TouchKey];
    const touchKey = key as TouchKey;
    const tier = getTouchHeatTier(state.pet.touchHeat);
    const moodDeltaByTouch: Record<TouchKey, number> = { head: 0, face: -1, belly: 0, horn: -1, tail: -3 };
    state.pet.touchCount += 1;
    applyPetDelta({ affection: moodDeltaByTouch[touchKey], touchHeat: 18 });
    const pawGain = addPawCoins(profile.nourish, "小锤互动", "interaction", true);
    const baseRageGain = randomInt(4, 10) + Math.floor(currentPetStage.value.level / 3);
    const rageGain = tier === "tired" ? Math.max(1, Math.round(baseRageGain * 0.5)) : baseRageGain;
    const pressureGain = randomInt(2, 5) + (tier === "tired" ? 1 : 0);
    const actualRage = addRageCoins(rageGain, "小锤怨气收集", pressureGain);
    const line = `小锤敲击成功，收集${formatRage(actualRage)}，${formatBloodPressureDelta(pressureGain)}${pawGain ? `，爪币+${Math.round(pawGain)}` : ""}。`;
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
      .some((element) => Boolean(element.closest(".pet-sprite, .pet-mode-picker, .pet-bubble, .pet-dialog")));
  }

  function handleFloatHitTest(event: MouseEvent) {
    if (viewMode !== "float") return;
    const interactive = petDragging.value || isFloatPetPointInteractive(event.clientX, event.clientY);
    setFloatPetInteractive(interactive);
  }

  function handleFloatMouseLeave() {
    if (!petDragging.value) setFloatPetInteractive(false);
  }

  function resetPetShakeTracker(event: MouseEvent) {
    petShake = {
      lastX: event.clientX,
      lastY: event.clientY,
      lastScreenX: event.screenX,
      lastScreenY: event.screenY,
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

  function trackPetShake(event: MouseEvent) {
    const screenDx = event.screenX - petShake.lastScreenX;
    const screenDy = event.screenY - petShake.lastScreenY;
    const dx = screenDx || event.movementX || event.clientX - petShake.lastX;
    const dy = screenDy || event.movementY || event.clientY - petShake.lastY;
    petShake.lastX = event.clientX;
    petShake.lastY = event.clientY;
    petShake.lastScreenX = event.screenX;
    petShake.lastScreenY = event.screenY;
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

  function startPetDrag(event: MouseEvent) {
    if ((event.target as HTMLElement | null)?.closest(".pet-mode-picker")) return;
    petDragging.value = true;
    setFloatPetInteractive(true);
    petModePicker.value = false;
    resetPetShakeTracker(event);
    petDragOffset.x = event.clientX - petPos.x;
    petDragOffset.y = event.clientY - petPos.y;
    petDragStart.x = event.clientX;
    petDragStart.y = event.clientY;
    petDragStart.screenX = event.screenX;
    petDragStart.screenY = event.screenY;
    window.wageclawDesktop?.petDragStart?.();
    window.addEventListener("mousemove", onWindowPetMove);
    window.addEventListener("mouseup", onWindowPetUp);
  }

  function onWindowPetMove(event: MouseEvent) {
    if (!petDragging.value) return;
    const dragDelta = trackPetShake(event);
    if (!petShake.modePickerReady && didShakePet()) {
      petShake.modePickerReady = true;
      desktopPetClickCount = 0;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
    }
    if (viewMode === "float") {
      window.wageclawDesktop?.petDragMove?.(dragDelta.dx, dragDelta.dy);
      return;
    }
    petPos.x = event.clientX - petDragOffset.x;
    petPos.y = event.clientY - petDragOffset.y;
  }

  function onWindowPetUp(event: MouseEvent) {
    const dx = event.screenX - petDragStart.screenX || event.clientX - petDragStart.x;
    const dy = event.screenY - petDragStart.screenY || event.clientY - petDragStart.y;
    const dragged = Math.abs(dx) > 4 || Math.abs(dy) > 4;
    const shouldOpenModePicker = petShake.modePickerReady || didShakePet();
    petDragging.value = false;
    window.removeEventListener("mousemove", onWindowPetMove);
    window.removeEventListener("mouseup", onWindowPetUp);
    window.wageclawDesktop?.petDragEnd?.();
    if (!dragged && !shouldOpenModePicker) {
      triggerPetClickFromEvent(event);
    } else if (shouldOpenModePicker) {
      petReaction.value = "";
      window.setTimeout(showPetModePicker, PET_SHAKE_PICKER_REVEAL_DELAY_MS);
    }
    if (viewMode === "float") {
      setFloatPetInteractive(shouldOpenModePicker || isFloatPetPointInteractive(event.clientX, event.clientY));
    }
  }

  function triggerPetClickFromEvent(event: MouseEvent) {
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
    }
    const el = document.querySelector(".floating-pet");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relY = (event.clientY - rect.top) / rect.height;
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
    if (isRageCollection) handlePetHammerTouch(touchKey);
    else handlePetTouch(touchKey);
  }

  async function openMainPanelFromPet() {
    state.pet.lastLine = "控制台已经叫醒。";
    showPetBubble(state.pet.lastLine);
    saveStateNow();
    await window.wageclawDesktop?.openMainPanel?.();
  }

  function showPetDialog() {
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
      petDialog.value = `<span class="line">${line}</span>`;
    }
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      petDialog.value = "";
    }, 8000);
  }

  function handleFloatPetDoubleClick() {
    if (state.pet.interactionMode === "rage") {
      desktopPetClickCount = 0;
      if (desktopPetClickTimer) window.clearTimeout(desktopPetClickTimer);
      return;
    }
    showPetDialog();
  }

  async function triggerBlackoutSkill(options: { automatic?: boolean } = {}) {
    await window.wageclawDesktop?.triggerBlackout?.({
      duration: options.automatic ? 4200 : 3200,
      automatic: Boolean(options.automatic)
    });
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
    petModePicker,
    petMotionAction,
    petMotionKey,
    petDragging,
    mainRuntimeActive,
    floatingPetStyle,
    currentPetStage,
    isProfileReady,
    startPetDrag,
    handleFloatPetDoubleClick,
    selectPetInteractionMode,
    openMainPanelFromPet
  };
}
