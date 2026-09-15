/**
 * localStorage 持久化：存储键与读取入口，统一按用户隔离。
 */
import { getUserStorageKey } from "@/services/user-storage";
import { createFirstRunState } from "@/state/defaults";
import { sanitizeState } from "@/state/sanitize";

export const STORAGE_KEY = "wageclaw-state-v3";
export function getWageClawStorageKey() {
  return getUserStorageKey(STORAGE_KEY);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(getWageClawStorageKey());
    return sanitizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return createFirstRunState();
  }
}
