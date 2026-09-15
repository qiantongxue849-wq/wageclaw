/**
 * 生命体征纯函数：血压夹取/归一化/结算，触摸热度分层与增量软化。
 */
import { BLOOD_PRESSURE_IDEAL, BLOOD_PRESSURE_MAX, BLOOD_PRESSURE_MIN } from "@/state/tuning";
import { clamp, percentOf } from "@/utils/core";

export type TouchHeatTier = "low" | "warm" | "tired";

export function clampBloodPressure(value: number) {
  return clamp(value, BLOOD_PRESSURE_MIN, BLOOD_PRESSURE_MAX);
}

export function normalizeBloodPressure(value: unknown, fallback = BLOOD_PRESSURE_IDEAL) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return fallback;
  const systolic = raw > 0 && raw < BLOOD_PRESSURE_MIN ? 90 + raw * 0.9 : raw;
  return clampBloodPressure(systolic);
}

export function bloodPressurePercent(value: number) {
  return percentOf(clampBloodPressure(value) - BLOOD_PRESSURE_MIN, BLOOD_PRESSURE_MAX - BLOOD_PRESSURE_MIN);
}

export function settleDailyBloodPressure(value: number) {
  const current = clampBloodPressure(value);
  if (current >= 120) return clampBloodPressure(current - Math.min(10, current - BLOOD_PRESSURE_IDEAL));
  if (current < 90) return clampBloodPressure(current + Math.min(4, BLOOD_PRESSURE_IDEAL - current));
  return current;
}

export function getTouchHeatTier(heat: number): TouchHeatTier {
  if (heat >= 85) return "tired";
  if (heat >= 60) return "warm";
  return "low";
}

export function softenPositiveDelta(value: number, tier: TouchHeatTier) {
  const delta = Math.round(Number(value) || 0);
  if (delta <= 0) return delta;
  if (tier === "tired") return 0;
  if (tier === "warm") return Math.max(1, Math.round(delta / 2));
  return delta;
}

export function adjustTouchPressureDelta(value: number, tier: TouchHeatTier) {
  const delta = Math.round(Number(value) || 0);
  if (tier === "tired") {
    if (delta < 0) return 0;
    if (delta > 0) return delta + 1;
  }
  if (tier === "warm" && delta < 0) return -Math.max(1, Math.round(Math.abs(delta) / 2));
  return delta;
}
