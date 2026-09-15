/**
 * 全局调参常量：工作事件节流、桌宠衰减速率、血压边界、默认作息等。
 * 集中放置便于平衡性调整，业务模块按需引用。
 */

export const STATE_SAVE_THROTTLE_MS = 4000;
export const PAGE_SIZE = 10;
export const MALL_PAGE_SIZE = 9;
export const legacyIphone16PartIds = ["iphone_frame", "iphone_screen", "iphone_battery", "iphone_camera", "iphone_chip", "iphone_storage"];
export const DAILY_PAW_ATTENDANCE_CAP = 120;
export const DAILY_PAW_INTERACTION_CAP = 48;
export const DAILY_PAW_EVENT_CAP = 140;
export const PAW_ATTENDANCE_RATE_PER_MINUTE = 0.45;
export const WORK_EVENT_MIN_GAP_MS = 8 * 60 * 1000;
export const WORK_EVENT_RANDOM_GAP_MS = 12 * 60 * 1000;
export const WORK_EVENT_DAILY_LIMIT = 5;
export const DEFAULT_START_TIME = "08:30";
export const DEFAULT_END_TIME = "18:00";
export const DEFAULT_PAYDAY = 15;
export const LEGACY_DEFAULT_START_TIME = "09:30";
export const LEGACY_DEFAULT_END_TIME = "18:30";
export const LEGACY_DEFAULT_PAYDAY = 10;
export const PET_SATIETY_DECAY_PER_SECOND = 0.0018;
export const PET_TOUCH_HEAT_DECAY_PER_SECOND = 0.004;
export const PET_MANA_BONUS_MAX = 60;
export const BLOOD_PRESSURE_MIN = 80;
export const BLOOD_PRESSURE_IDEAL = 118;
export const BLOOD_PRESSURE_MAX = 180;
export const RELAX_BLOOD_PRESSURE_FLOOR = 96;
export const MEDICINE_BLOOD_PRESSURE_FLOOR = 90;
export const DEFAULT_SEDENTARY_REMINDER_MINUTES = 45;
export const DEFAULT_PET_FOCUS_REMINDER_MINUTES = 50;

export function getNextWorkEventAt(base = Date.now()) {
  return base + WORK_EVENT_MIN_GAP_MS + Math.floor(Math.random() * WORK_EVENT_RANDOM_GAP_MS);
}


export const holidayCountdowns = [
  { name: "元旦", month: 1, day: 1, daysOff: 1 },
  { name: "春节", month: 2, day: 17, daysOff: 8 },
  { name: "清明节", month: 4, day: 5, daysOff: 3 },
  { name: "劳动节", month: 5, day: 1, daysOff: 5 },
  { name: "端午节", month: 6, day: 19, daysOff: 3 },
  { name: "中秋节", month: 9, day: 25, daysOff: 3 },
  { name: "国庆节", month: 10, day: 1, daysOff: 7 }
];


/** 日志类列表的条目上限：写入（useWageClaw）与存档净化（sanitize）统一裁剪，防止存档无限膨胀 */
export const LOG_CAPS = {
  transactions: 120,
  pawLedger: 120,
  petLog: 80,
  usageLog: 80
} as const;
