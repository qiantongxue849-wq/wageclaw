import { defaults, sanitizeSettings, type LiteSettings } from './model';
export const LITE_KEY = 'wageclaw-lite-v1';
export const OLD_KEY = 'wageclaw-state-v3';
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'key' | 'length'>;
export interface Loaded { settings: LiteSettings; key: string; notice: string; recovery: boolean }
export function profileKey(storage: StorageLike): string {
  const user = storage.getItem('wageclaw-active-user-id');
  return user ? `${LITE_KEY}:user:${user}` : `${LITE_KEY}:local`;
}
export function loadSettings(storage: StorageLike): Loaded {
  let key = `${LITE_KEY}:local`;
  try {
    key = profileKey(storage);
    const saved = storage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || ![1, 2].includes(parsed.version)) throw new Error('Invalid archive');
      return { settings: sanitizeSettings(parsed), key, notice: '', recovery: false };
    }
    const active = storage.getItem('wageclaw-active-user-id');
    // Never pick or combine an arbitrary account when the user is signed out.
    const candidates = active ? [`${OLD_KEY}:user:${active}`] : [`${OLD_KEY}:signed-out`, OLD_KEY];
    const oldKey = candidates.find(candidate => storage.getItem(candidate) !== null);
    if (!oldKey) return { settings: defaults(), key, notice: '', recovery: false };
    const old = JSON.parse(storage.getItem(oldKey) || 'null');
    if (!old || typeof old !== 'object' || Array.isArray(old)) throw new Error('Invalid legacy archive');
    const base = defaults();
    const pet: Record<string, unknown> = { ...base.pet };
    // 旧档把形象偏好存在顶层 petStyle，删掉默认值让位给它。
    delete pet.style;
    const settings = sanitizeSettings({ ...base, pet, salary: old.salary, startTime: old.startTime,
      endTime: old.endTime, payday: old.payday, privacy: old.privacyMode, petStyle: old.petStyle,
      configured: old.salary > 0 });
    storage.setItem(key, JSON.stringify(settings));
    return { settings, key, notice: '已沿用工资与作息。旧版存档原样保留，钱包余额不计入收入。', recovery: false };
  } catch {
    return { settings: defaults(), key, notice: '存档暂时无法读取，原始数据仍保留。可先导出备份，再恢复默认设置。', recovery: true };
  }
}
export function backupContents(storage: StorageLike, key: string, settings: LiteSettings) {
  const records: Record<string, string> = {};
  const user = key.startsWith(`${LITE_KEY}:user:`) ? key.slice(`${LITE_KEY}:user:`.length) : '';
  const scopedOld = user ? `${OLD_KEY}:user:${user}` : `${OLD_KEY}:signed-out`;
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && (k === key || k.startsWith(`${key}:backup:`) || k === scopedOld || (!user && k === OLD_KEY))) records[k] = storage.getItem(k) ?? '';
  }
  return JSON.stringify({ format: 'wageclaw-lite-backup', exportedAt: new Date().toISOString(), settings, records }, null, 2);
}
export function resetSettings(storage: StorageLike, key: string) {
  const raw = storage.getItem(key);
  if (raw !== null) storage.setItem(`${key}:backup:${Date.now()}`, raw);
  const settings = defaults();
  storage.setItem(key, JSON.stringify(settings));
  return settings;
}
