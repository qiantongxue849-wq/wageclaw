/**
 * 首页/桌宠页共用的「快速照料」面板状态：喂食/喂药选择器与快捷动作。
 */
import { computed, ref } from "vue";
import type { MallItem } from "@/types";
import type { WageClawStore } from "@/composables/useWageClaw";

export function useHomePetSupply(wc: WageClawStore) {
  const homePetSupplyPicker = ref<"food" | "medicine" | null>(null);
  const homePetFoodItems = computed(() =>
    wc.inventoryItems.filter((entry) => Boolean(entry.item.petBoost) && entry.item.category === "food")
  );
  const homePetMedicineItems = computed(() =>
    wc.inventoryItems.filter((entry) => Boolean(entry.item.petBoost) && entry.item.category === "medicine")
  );
  const homePetSupplyEntries = computed(() => (homePetSupplyPicker.value === "medicine" ? homePetMedicineItems.value : homePetFoodItems.value));
  const homePetSupplyTitle = computed(() => (homePetSupplyPicker.value === "medicine" ? "背包药品" : "背包食物"));
  const homePetSupplyEmptyText = computed(() => (homePetSupplyPicker.value === "medicine" ? "背包里暂时没有药品。" : "背包里暂时没有食物。"));

  function toggleHomePetSupplyPicker(kind: "food" | "medicine") {
    homePetSupplyPicker.value = homePetSupplyPicker.value === kind ? null : kind;
  }

  function playWithHomePet() {
    homePetSupplyPicker.value = null;
    wc.quickCarePet("play");
  }

  function napWithHomePet() {
    homePetSupplyPicker.value = null;
    wc.quickCarePet("sleep");
  }

  function useHomePetSupplyItem(item: MallItem) {
    wc.useItem(item);
    homePetSupplyPicker.value = null;
  }

  function openHomePetSupplyShop() {
    homePetSupplyPicker.value = null;
    wc.mallTab = "supplyShop";
    wc.setActiveScreen("mall");
  }

  return {
    homePetSupplyPicker,
    homePetFoodItems,
    homePetMedicineItems,
    homePetSupplyEntries,
    homePetSupplyTitle,
    homePetSupplyEmptyText,
    toggleHomePetSupplyPicker,
    playWithHomePet,
    napWithHomePet,
    useHomePetSupplyItem,
    openHomePetSupplyShop
  };
}
