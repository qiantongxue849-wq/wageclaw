/**
 * useWageClaw 会话内部使用的视图状态类型。
 */
import { petTouchProfiles } from "@/data/pets";

export type PageKey = "transactions" | "pawLedger" | "mall" | "wishShop" | "supplyShop" | "inventory" | "usage" | "petSupply" | "petLog";
export type MallTab = "wishShop" | "supplyShop" | "inventory";
export type TouchKey = keyof typeof petTouchProfiles;
export type QuickCareAction = "feed" | "play" | "sleep";
export type PetDelta = {
  rage?: number;
  growth?: number;
  light?: number;
  satiety?: number;
  affection?: number;
  manaCap?: number;
  mana?: number;
  bloodPressure?: number;
  touchHeat?: number;
  bloodPressureFloor?: number;
};
