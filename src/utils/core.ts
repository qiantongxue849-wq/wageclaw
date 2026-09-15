/**
 * 通用纯函数：日期键、时间换算、数值夹取、HTML 转义等无副作用工具。
 */
import type { InteractionPromptItem, NewsApiSource } from "@/types";

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function clonePromptItem(item: InteractionPromptItem): InteractionPromptItem {
  return { ...item };
}

export function cloneNewsSource(item: NewsApiSource): NewsApiSource {
  return { ...item };
}

export function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function percentOf(value: number, max = 100) {
  return clamp(Math.round((value / Math.max(1, max)) * 100), 0, 100);
}

export function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function randomPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
