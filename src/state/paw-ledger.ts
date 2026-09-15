/**
 * 爪币账本工厂与归一化：日/月账本的创建、读取、旧档修复。
 */
import type { DailyPawLedger, MonthlyPawLedger } from "@/types";
import { workEvents } from "@/data/events";
import { getNextWorkEventAt } from "@/state/tuning";
import { getCurrentMonthKey, getLocalDateKey } from "@/utils/core";

export function createDailyPawLedger(date = getLocalDateKey(), base = Date.now()): DailyPawLedger {
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

export function createMonthlyPawLedger(month = getCurrentMonthKey()): MonthlyPawLedger {
  return {
    month,
    earned: 0
  };
}

export function getDailyPawEarned(ledger: DailyPawLedger) {
  return Math.max(0, ledger.attendanceEarned) + Math.max(0, ledger.interactionEarned) + Math.max(0, ledger.eventEarned);
}

export function normalizeDailyPawLedger(input: Partial<DailyPawLedger> | undefined, fallback: DailyPawLedger): DailyPawLedger {
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

export function normalizeMonthlyPawLedger(input: Partial<MonthlyPawLedger> | undefined, fallback: MonthlyPawLedger): MonthlyPawLedger {
  return {
    month: input?.month || fallback.month,
    earned: Math.max(0, Number(input?.earned ?? fallback.earned) || 0)
  };
}

