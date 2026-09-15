import type { DailyPetGrowth, WageClawState } from "@/types";

export type DailyPetGrowthSource = "passive" | "broadcast" | "event";

export const PET_DAILY_GROWTH_MAX = 2200;
export const PET_PASSIVE_GROWTH_CAP = 520;
export const PET_BROADCAST_GROWTH_CAP = 600;
export const PET_DOUBLE_CLICK_GROWTH = 100;
export const PET_REMINDER_GROWTH = 45;

const SOURCE_CAPS: Record<DailyPetGrowthSource, number> = {
  passive: PET_PASSIVE_GROWTH_CAP,
  broadcast: PET_BROADCAST_GROWTH_CAP,
  event: PET_DAILY_GROWTH_MAX
};

export function createDailyPetGrowth(date: string): DailyPetGrowth {
  return {
    date,
    passive: 0,
    broadcast: 0,
    event: 0
  };
}

export function normalizeDailyPetGrowth(input: Partial<DailyPetGrowth> | undefined, date: string): DailyPetGrowth {
  if (!input || input.date !== date) return createDailyPetGrowth(date);
  return {
    date,
    passive: clampSource(input.passive, PET_PASSIVE_GROWTH_CAP),
    broadcast: clampSource(input.broadcast, PET_BROADCAST_GROWTH_CAP),
    event: clampSource(input.event, PET_DAILY_GROWTH_MAX)
  };
}

export function getDailyPetGrowthTotal(growth: DailyPetGrowth) {
  return Math.min(PET_DAILY_GROWTH_MAX, Math.max(0, growth.passive) + Math.max(0, growth.broadcast) + Math.max(0, growth.event));
}

export function ensureDailyPetGrowth(state: WageClawState, date: string) {
  if (state.dailyPetGrowth?.date === date) return false;
  state.dailyPetGrowth = createDailyPetGrowth(date);
  state.pet.growth = 0;
  return true;
}

export function addDailyPetGrowth(
  state: WageClawState,
  amount: number,
  source: DailyPetGrowthSource,
  date: string
) {
  ensureDailyPetGrowth(state, date);
  const requested = Math.max(0, Number(amount) || 0);
  if (!requested || state.pet.growth >= PET_DAILY_GROWTH_MAX) return 0;

  const sourceRemaining = Math.max(0, SOURCE_CAPS[source] - state.dailyPetGrowth[source]);
  const totalRemaining = Math.max(0, PET_DAILY_GROWTH_MAX - state.pet.growth);
  const actual = Math.min(requested, sourceRemaining, totalRemaining);
  if (!actual) return 0;

  state.dailyPetGrowth[source] += actual;
  state.pet.growth = Math.min(PET_DAILY_GROWTH_MAX, state.pet.growth + actual);
  return actual;
}

function clampSource(value: unknown, max: number) {
  return Math.min(max, Math.max(0, Number(value) || 0));
}
