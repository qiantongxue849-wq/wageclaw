export const ACTIVE_USER_KEY = "wageclaw-active-user-id";

export function setActiveUserId(userId: string) {
  const normalized = String(userId || "").trim();
  if (normalized) {
    localStorage.setItem(ACTIVE_USER_KEY, normalized);
  } else {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

export function getActiveUserId() {
  return localStorage.getItem(ACTIVE_USER_KEY) || "";
}

export function getUserStorageKey(baseKey: string) {
  const userId = getActiveUserId();
  return userId ? `${baseKey}:user:${userId}` : `${baseKey}:signed-out`;
}

export function migrateLegacyUserStorage(baseKey: string, userId: string) {
  if (!userId) return;
  const scopedKey = `${baseKey}:user:${userId}`;
  if (localStorage.getItem(scopedKey) !== null) return;
  const legacyValue = localStorage.getItem(baseKey);
  if (legacyValue !== null) {
    localStorage.setItem(scopedKey, legacyValue);
    localStorage.removeItem(baseKey);
  }
}
