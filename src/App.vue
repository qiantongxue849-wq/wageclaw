<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { mallFilters, navItems, petTouchProfiles, transactionFilters } from "@/data/catalog";
import { useWageClaw } from "@/composables/useWageClaw";
import PetSprite from "@/components/PetSprite.vue";
import rageBlobPreview from "@/assets/pet-stages-preview.png";
import capybaraZenPreview from "@/assets/pet-previews/capybara-zen.png";
import lazyCatPreview from "@/assets/pet-previews/lazy-cat.png";
import lazyDogPreview from "@/assets/pet-previews/lazy-dog.png";
import honestCowPreview from "@/assets/pet-previews/honest-cow.png";
import walletCardArt from "@/assets/ui-art/wallet-paw-coins.png";
import headerProgressArt from "@/assets/ui-art/header-progress.png";
import headerSettingsArt from "@/assets/ui-art/header-settings.png";
import headerSupplyArt from "@/assets/ui-art/header-supply.png";
import headerPetArt from "@/assets/ui-art/header-pet.png";
import alchemyFurnaceArt from "@/assets/pet-ui/alchemy-furnace.png";
import feedTeaArt from "@/assets/pet-ui/feed-tea.png";
import feedMuffinArt from "@/assets/pet-ui/feed-muffin.png";
import feedStrawberryArt from "@/assets/pet-ui/feed-strawberry.png";
import feedRageCandyArt from "@/assets/pet-ui/feed-rage-candy.png";
import macbookBatteryArt from "@/assets/wishlist/macbook-battery.png";
import macbookFullArt from "@/assets/wishlist/macbook-full-card.png";
import macbookKeyboardArt from "@/assets/wishlist/macbook-keyboard.png";
import macbookMemoryArt from "@/assets/wishlist/macbook-memory.png";
import macbookScreenArt from "@/assets/wishlist/macbook-screen.png";
import macbookShellArt from "@/assets/wishlist/macbook-shell.png";
import macbookTrackpadArt from "@/assets/wishlist/macbook-trackpad.png";
import iphone16BatteryArt from "@/assets/wishlist/iphone16-battery.png";
import iphone16CameraArt from "@/assets/wishlist/iphone16-camera.png";
import iphone16ChipArt from "@/assets/wishlist/iphone16-chip.png";
import iphone16FrameArt from "@/assets/wishlist/iphone16-frame.png";
import iphone16FullArt from "@/assets/wishlist/iphone16-full.png";
import iphone16ScreenArt from "@/assets/wishlist/iphone16-screen.png";
import iphone16StorageArt from "@/assets/wishlist/iphone16-storage.png";
import iphone17BatteryArt from "@/assets/wishlist/iphone17-battery.png";
import iphone17CameraArt from "@/assets/wishlist/iphone17-camera.png";
import iphone17ChipArt from "@/assets/wishlist/iphone17-chip.png";
import iphone17FrameArt from "@/assets/wishlist/iphone17-frame.png";
import iphone17FullArt from "@/assets/wishlist/iphone17-full.png";
import iphone17ScreenArt from "@/assets/wishlist/iphone17-screen.png";
import iphone17StorageArt from "@/assets/wishlist/iphone17-storage.png";
import phuket7BoatArt from "@/assets/wishlist/phuket7-boat.png";
import phuket7FlightArt from "@/assets/wishlist/phuket7-flight.png";
import phuket7FoodArt from "@/assets/wishlist/phuket7-food.png";
import phuket7FullArt from "@/assets/wishlist/phuket7-full.png";
import phuket7FundArt from "@/assets/wishlist/phuket7-fund.png";
import phuket7ResortArt from "@/assets/wishlist/phuket7-resort.png";
import phuket7SnorkelArt from "@/assets/wishlist/phuket7-snorkel.png";
import ergochairBackrestArt from "@/assets/wishlist/ergochair-backrest.png";
import ergochairBaseArt from "@/assets/wishlist/ergochair-base.png";
import ergochairCasterArt from "@/assets/wishlist/ergochair-caster.png";
import ergochairCushionArt from "@/assets/wishlist/ergochair-cushion.png";
import ergochairFullArt from "@/assets/wishlist/ergochair-full.png";
import ergochairHeadrestArt from "@/assets/wishlist/ergochair-headrest.png";
import ergochairLumbarArt from "@/assets/wishlist/ergochair-lumbar.png";
import robovacBagArt from "@/assets/wishlist/robovac-bag.png";
import robovacBrushArt from "@/assets/wishlist/robovac-brush.png";
import robovacDockArt from "@/assets/wishlist/robovac-dock.png";
import robovacFullArt from "@/assets/wishlist/robovac-full.png";
import robovacMopArt from "@/assets/wishlist/robovac-mop.png";
import robovacRobotArt from "@/assets/wishlist/robovac-robot.png";
import robovacTankArt from "@/assets/wishlist/robovac-tank.png";
import type { MallItem, PetStyle } from "@/types";

const wc = reactive(useWageClaw());
const ledgerDialogOpen = ref(false);
const ledgerMode = ref<"wallet" | "paw">("wallet");
const wishVisuals: Record<string, { full: string; parts: Record<string, string> }> = {
  macbook_pro_14: {
    full: macbookFullArt,
    parts: {
      shell: macbookShellArt,
      screen: macbookScreenArt,
      battery: macbookBatteryArt,
      memory: macbookMemoryArt,
      keyboard: macbookKeyboardArt,
      trackpad: macbookTrackpadArt
    }
  },
  iphone16_pro_max_1tb: {
    full: iphone16FullArt,
    parts: {
      iphone_frame: iphone16FrameArt,
      iphone_screen: iphone16ScreenArt,
      iphone_battery: iphone16BatteryArt,
      iphone_camera: iphone16CameraArt,
      iphone_chip: iphone16ChipArt,
      iphone_storage: iphone16StorageArt
    }
  },
  iphone17_pro_max_1tb: {
    full: iphone17FullArt,
    parts: {
      iphone17_frame: iphone17FrameArt,
      iphone17_screen: iphone17ScreenArt,
      iphone17_battery: iphone17BatteryArt,
      iphone17_camera_plateau: iphone17CameraArt,
      iphone17_chip: iphone17ChipArt,
      iphone17_storage: iphone17StorageArt
    }
  },
  phuket_7_day_trip: {
    full: phuket7FullArt,
    parts: {
      phuket_flight: phuket7FlightArt,
      phuket_resort: phuket7ResortArt,
      phuket_boat: phuket7BoatArt,
      phuket_snorkel: phuket7SnorkelArt,
      phuket_food: phuket7FoodArt,
      phuket_fund: phuket7FundArt
    }
  },
  ergonomic_chair: {
    full: ergochairFullArt,
    parts: {
      chair_headrest: ergochairHeadrestArt,
      chair_backrest: ergochairBackrestArt,
      chair_lumbar: ergochairLumbarArt,
      chair_cushion: ergochairCushionArt,
      chair_base: ergochairBaseArt,
      chair_caster: ergochairCasterArt
    }
  },
  robot_vacuum_mop: {
    full: robovacFullArt,
    parts: {
      robovac_robot: robovacRobotArt,
      robovac_dock: robovacDockArt,
      robovac_tank: robovacTankArt,
      robovac_mop: robovacMopArt,
      robovac_brush: robovacBrushArt,
      robovac_bag: robovacBagArt
    }
  }
};

const explodedSlots = [
  { left: "5%", top: "8%", width: "34%", height: "34%", transform: "rotate(-5deg)" },
  { left: "39%", top: "6%", width: "28%", height: "34%", transform: "rotate(2deg)" },
  { left: "68%", top: "8%", width: "27%", height: "32%", transform: "rotate(5deg)" },
  { left: "6%", top: "53%", width: "31%", height: "34%", transform: "rotate(2deg)" },
  { left: "38%", top: "52%", width: "28%", height: "34%", transform: "rotate(-3deg)" },
  { left: "68%", top: "55%", width: "27%", height: "31%", transform: "rotate(4deg)" }
];
const miniSlots = [
  { left: "3%", top: "6%", width: "33%", height: "34%", transform: "rotate(-5deg)" },
  { left: "36%", top: "5%", width: "29%", height: "34%", transform: "rotate(2deg)" },
  { left: "66%", top: "7%", width: "28%", height: "32%", transform: "rotate(5deg)" },
  { left: "4%", top: "55%", width: "31%", height: "33%", transform: "rotate(2deg)" },
  { left: "36%", top: "55%", width: "29%", height: "33%", transform: "rotate(-3deg)" },
  { left: "67%", top: "58%", width: "27%", height: "30%", transform: "rotate(4deg)" }
];

function getWishVisual(itemId?: string) {
  return wishVisuals[itemId || wc.state.activeWishId] || wishVisuals.macbook_pro_14;
}

const activeWishVisual = computed(() => getWishVisual(wc.state.activeWishId));
const wishTooltip = reactive({
  partId: "",
  x: 0,
  y: 0,
  placement: "bottom" as "top" | "bottom"
});

const rootClass = computed(() => ({
  "pet-only": wc.viewMode === "pet",
  "float-only": wc.viewMode === "float"
}));
const isMainView = computed(() => wc.viewMode === "main");
const activeTitle = computed(() => wc.screenTitles[wc.activeScreen]);
const topbarArt = computed(() => {
  if (wc.activeScreen === "mall") return headerSupplyArt;
  if (wc.activeScreen === "pet") return headerPetArt;
  if (wc.activeScreen === "settings") return headerSettingsArt;
  return headerProgressArt;
});

const wishParts = computed(() =>
  wc.parts.map((part, index) => ({
    ...part,
    image: activeWishVisual.value.parts[part.id] || activeWishVisual.value.full,
    artStyle: explodedSlots[index % explodedSlots.length],
    miniStyle: miniSlots[index % miniSlots.length],
    price: wc.getPartPrice(part.id),
    unlocked: wc.state.unlockedParts.includes(part.id)
  }))
);
const activeWishTooltipPart = computed(() => wishParts.value.find((part) => part.id === wishTooltip.partId));

function showWishPartTooltip(partId: string, event: MouseEvent | FocusEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const margin = 14;
  const gap = 10;
  const estimatedWidth = Math.min(236, Math.max(160, window.innerWidth - margin * 2));
  const estimatedHeight = 112;
  const halfWidth = estimatedWidth / 2;
  const centerX = rect.left + rect.width / 2;
  const hasRoomBelow = rect.bottom + gap + estimatedHeight <= window.innerHeight - margin;
  const hasRoomAbove = rect.top - gap - estimatedHeight >= margin;
  const placement = hasRoomBelow || !hasRoomAbove ? "bottom" : "top";

  wishTooltip.partId = partId;
  wishTooltip.x = Math.min(window.innerWidth - margin - halfWidth, Math.max(margin + halfWidth, centerX));
  wishTooltip.y =
    placement === "bottom"
      ? Math.min(window.innerHeight - margin - estimatedHeight, Math.max(margin, rect.bottom + gap))
      : Math.max(margin + estimatedHeight, Math.min(window.innerHeight - margin, rect.top - gap));
  wishTooltip.placement = placement;
}

function hideWishPartTooltip(partId: string) {
  if (wishTooltip.partId === partId) {
    wishTooltip.partId = "";
  }
}

function wishTooltipStyle(partId: string) {
  return wishTooltip.partId === partId ? { left: `${wishTooltip.x}px`, top: `${wishTooltip.y}px` } : undefined;
}

function wishTooltipClass(partId: string) {
  const visible = wishTooltip.partId === partId;
  return {
    visible,
    "place-top": visible && wishTooltip.placement === "top",
    "place-bottom": visible && wishTooltip.placement === "bottom"
  };
}

const themeEntries = computed(() => Object.entries(wc.themeLabels));
const petStyleEntries = computed(() => Object.entries(wc.petStyleLabels) as Array<[PetStyle, string]>);
const modeEntries = computed(() => Object.entries(wc.modeLabels));
const touchEntries = computed(() => Object.entries(petTouchProfiles));
const petStylePreview = {
  rageBlob: {
    image: rageBlobPreview,
    summary: "原始怨气软团，适合战斗感和职场反击感。"
  },
  capybaraZen: {
    image: capybaraZenPreview,
    summary: "卡皮巴拉佛系路线，越升级越稳、越无争。"
  },
  lazyCat: {
    image: lazyCatPreview,
    summary: "可爱但摆烂，主打午睡、躺平和反内耗。"
  },
  lazyDog: {
    image: lazyDogPreview,
    summary: "慵懒陪伴犬系，温吞守护、慢速回血。"
  },
  honestCow: {
    image: honestCowPreview,
    summary: "老实巴交牛牛系，黑白斑纹、凶眉护主，嘴上很怂但眼神很硬。"
  }
} satisfies Record<PetStyle, { image: string; summary: string }>;

const petFeedFallbackIds = ["milk_tea", "cake_slice", "ice_cream", "chocolate_bar", "bp_pill", "sedative", "stomach_pill", "vitamin"];
const petFeedArtById: Record<string, string> = {
  milk_tea: feedTeaArt,
  cake_slice: feedMuffinArt,
  steamed_bun: feedMuffinArt,
  dumpling: feedMuffinArt,
  rice_ball: feedMuffinArt,
  ice_cream: feedStrawberryArt,
  sushi_platter: feedStrawberryArt,
  steamed_fish: feedStrawberryArt,
  chocolate_bar: feedRageCandyArt,
  hotpot: feedRageCandyArt,
  bp_pill: feedRageCandyArt,
  heart_pill: feedRageCandyArt,
  sedative: feedTeaArt,
  stomach_pill: feedTeaArt,
  oxygen_mask: feedRageCandyArt,
  vitamin: feedStrawberryArt,
  blood_tonic: feedTeaArt,
  emergency_kit: feedRageCandyArt
};

function getPetFeedArt(item: MallItem) {
  if (petFeedArtById[item.id]) return petFeedArtById[item.id];
  if (item.category === "food") return feedMuffinArt;
  if (item.category === "medicine") return feedRageCandyArt;
  return feedTeaArt;
}

function formatPetFeedEffect(item: MallItem) {
  const boost = item.petBoost || {};
  return [
    boost.hunger ? `饱食 +${boost.hunger}` : "",
    boost.affection ? `亲密 +${boost.affection}` : "",
    boost.rage ? `怨气 +${boost.rage}` : "",
    boost.mana || boost.manaCap ? "法力池恢复" : "",
    boost.bloodPressure ? (boost.bloodPressure < 0 ? `血压 ${boost.bloodPressure}` : `血压 +${boost.bloodPressure}`) : ""
  ].filter(Boolean).slice(0, 2).join(" / ") || item.tag;
}

const petAttributeRows = computed(() => [
  {
    label: "爪币",
    value: wc.formatPawCoins(wc.state.pawBalance),
    detail: "可在补给仓换投喂物和养成素材。",
    tone: "gold"
  },
  {
    label: "怨气",
    value: wc.state.pet.rage >= 500 ? "满溢" : wc.formatRage(wc.state.pet.rage),
    detail: "持续积攒，可用于炼化和进化。",
    tone: "rage"
  },
  {
    label: "法力池",
    value: `${Math.round(wc.state.pet.mana)} / ${wc.petManaMax}`,
    detail: "炼化时会回复，修炼时会消耗。",
    tone: "mana"
  },
  {
    label: "战绩",
    value: `${wc.state.pet.battleWins}胜${wc.state.pet.battleLosses}负`,
    detail: "历史记录保留为纪念，不再占用功能入口。",
    tone: "plain"
  },
  {
    label: "饥饿",
    value: wc.petHungerLabel.label,
    detail: `饱食 ${Math.round(wc.state.pet.hunger)}%，投喂背包物品可恢复。`,
    tone: "food",
    color: wc.petHungerLabel.color
  },
  {
    label: "血压",
    value: wc.petPressureLabel.label,
    detail: `压力 ${Math.round(wc.state.pet.bloodPressure)}%，炼化糟心事或使用补给可缓解。`,
    tone: "pressure",
    color: wc.petPressureLabel.color
  }
]);

const petBackpackItems = computed(() => {
  const owned = wc.petSupplyItems.slice(0, 8);
  if (owned.length) return owned;
  return petFeedFallbackIds
    .map((id) => wc.mallItems.find((item) => item.id === id))
    .filter((item): item is MallItem => Boolean(item))
    .map((item) => ({ item, quantity: 0 }));
});
const nextPetStageDistanceLabel = computed(() => (wc.nextPetStage ? `距 ${wc.nextPetStage.name}` : "已达顶阶"));
const activeWorkEventChoices = computed(() => wc.activeWorkEvent?.choices || []);

const inventoryTotal = computed(() => wc.inventoryItems.reduce((total, entry) => total + entry.quantity, 0) + wc.earnedGoods.length);
const latestTransaction = computed(() => wc.state.transactions[0] || null);
const transactionLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedTransactions.items.length));
const pawLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedPawLedger.items.length));
const inventoryCategoryCount = computed(() => wc.inventoryItems.length);
const shopPhysicalCount = computed(() => wc.mallItems.filter((item) => item.kind === "physical").length);
const shopSupplyCount = computed(() => wc.mallItems.filter((item) => item.kind !== "physical").length);
const activeMallFilterLabel = computed(() => mallFilters.find((filter) => filter.key === wc.state.mallFilter)?.label || "全部");
const wishShopEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedWishShopItems.items.length));
const supplyShopEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedSupplyShopItems.items.length));
const inventoryEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedInventoryItems.items.length));
const supplyFilters = computed(() => mallFilters.filter((filter) => filter.key !== "real"));
const supplyHubTabs = computed(() => [
  {
    key: "wishShop",
    label: "心愿商城",
    hint: "工资余额兑换实体礼物",
    count: `${shopPhysicalCount.value} 件`
  },
  {
    key: "supplyShop",
    label: "供销社",
    hint: "爪币购买桌宠日常",
    count: `${shopSupplyCount.value} 件`
  },
  {
    key: "inventory",
    label: "背包",
    hint: "桌宠物品与最近使用",
    count: `${inventoryTotal.value} 件`
  }
] as const);
const dailyRagePercent = computed(() => Math.min(100, Math.round((wc.state.dailyRage.value / 500) * 100)));
const monthlyProgressPercent = computed(() => Math.min(100, Math.round(wc.salaryCycleProgress.percent * 100)));
const QUICK_SLOT_COUNT = 4;
const quickBuyRecommendationIds = ["noodle_soup", "cake_slice", "bp_pill", "oxygen_mask"];
const homeQuickBuyItems = computed(() => {
  const recommended = quickBuyRecommendationIds
    .map((id) => wc.mallItems.find((item) => item.id === id && item.kind !== "physical"))
    .filter((item): item is MallItem => Boolean(item));
  const fallback = wc.mallItems.filter((item) => item.kind !== "physical" && !recommended.some((candidate) => candidate.id === item.id));
  return [...recommended, ...fallback].slice(0, QUICK_SLOT_COUNT);
});
const homeQuickFeedSlots = computed(() => {
  const entries = wc.inventoryItems.filter((entry) => Boolean(entry.item.petBoost)).slice(0, QUICK_SLOT_COUNT);
  return Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => entries[index] || null);
});
const navIconMap = {
  converter: "home",
  mall: "cup",
  pet: "pet",
  ninja: "ninja",
  community: "tree",
  sync: "calendar",
  settings: "gear"
} as const;
const screenMoodLine = computed(() => {
  if (wc.activeScreen === "converter") return "把每一分钟硬扛都换成看得见的进度。";
  if (wc.activeScreen === "mall") return "工资余额只对实体目标负责，桌宠补给交给爪币小金库。";
  if (wc.activeScreen === "pet") return "把糟心事丢给软团，它负责记仇，你负责喘气。";
  if (wc.activeScreen === "ninja") return "先稳住情绪，再把边界说得像一份正式纪要。";
  if (wc.activeScreen === "community") return "可以吐槽，但先把姓名、公司和地点藏好。";
  if (wc.activeScreen === "sync") return "倒计时不是焦虑，是把今天切成能走完的小段。";
  return "把资料调成适合自己的节奏，别让应用反过来消耗你。";
});
const pageLabels = {
  transactions: "交易",
  pawLedger: "爪币",
  mall: "商品",
  wishShop: "心愿商城",
  supplyShop: "供销社",
  inventory: "背包",
  usage: "使用记录",
  petSupply: "供品",
  petLog: "记录",
  community: "帖子"
} as const;
const pawBucketLabels = {
  attendance: "出勤",
  interaction: "互动",
  event: "事件",
  supply: "补给"
} as const;

function formatPawLedgerAmount(amount: number) {
  const rounded = Math.round(amount || 0);
  return `${rounded >= 0 ? "+" : "-"}${wc.formatPawCoins(Math.abs(rounded))}`;
}

function openWishWorkbench(tab: "split" | "realized" = "split") {
  wc.accountTab = tab;
  wc.setActiveScreen("converter");
}

function openSupplyShop() {
  wc.mallTab = "supplyShop";
  wc.setActiveScreen("mall");
}

function openInventory() {
  wc.mallTab = "inventory";
  wc.setActiveScreen("mall");
}

function openLedgerDialog() {
  ledgerDialogOpen.value = true;
}

function closeLedgerDialog() {
  ledgerDialogOpen.value = false;
}
</script>

<template>
  <div class="app-root" :class="rootClass" :data-theme="wc.state.theme" :data-pet-style="wc.state.petStyle">
    <div class="surface-grid" aria-hidden="true"></div>

    <section v-if="wc.notification" class="toast" role="status">{{ wc.notification }}</section>

    <section v-if="wc.blackoutActive" class="blackout-layer" @click="wc.blackoutActive = false">
      <div>
        <strong>黑屏结界</strong>
        <span>离谱需求临时隔离，先呼吸。</span>
      </div>
    </section>

    <template v-if="wc.viewMode === 'float'">
      <div
        class="floating-pet float-mode"
        :class="wc.petReaction"
        @mousedown="wc.startPetDrag"
        @dblclick="wc.handleFloatPetDoubleClick"
      >
        <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
        <div class="pet-dialog" v-if="wc.petDialog" v-html="wc.petDialog"></div>
        <div
          v-if="wc.petModePicker"
          class="pet-mode-picker"
          role="dialog"
          aria-label="桌宠互动模式"
          @mousedown.stop
          @mouseup.stop
          @click.stop
          @dblclick.stop
        >
          <strong>选择互动模式</strong>
          <div>
            <button type="button" @click="wc.selectPetInteractionMode('normal')">普通模式</button>
            <button type="button" @click="wc.selectPetInteractionMode('rage')">怨气收集</button>
          </div>
        </div>
        <span v-if="wc.petReaction === 'hammer'" class="pet-hammer-visual" aria-hidden="true">
          <span class="pet-hammer-handle"></span>
          <span class="pet-hammer-head"></span>
          <span class="pet-hammer-band"></span>
          <span class="pet-hammer-charm"></span>
          <span class="pet-hammer-trail pet-hammer-trail-a"></span>
          <span class="pet-hammer-trail pet-hammer-trail-b"></span>
        </span>
        <span v-if="wc.petReaction === 'hammer'" class="pet-impact-burst" aria-hidden="true">
          <span class="pet-impact-ring"></span>
          <span class="pet-impact-chip pet-impact-chip-a"></span>
          <span class="pet-impact-chip pet-impact-chip-b"></span>
          <span class="pet-impact-chip pet-impact-chip-c"></span>
        </span>
        <PetSprite :stage="wc.currentPetStage" mode="compact" />
      </div>
    </template>

    <div v-if="wc.goldRush" class="gold-rush" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="gold-coin" :style="{ animationDelay: `${(n - 1) * 0.06}s`, left: `${40 + Math.random() * 20}%` }">🪙</span>
    </div>

    <section v-if="wc.viewMode === 'pet'" class="summoned-pet embedded">
      <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
      <button type="button" class="pet-avatar-button" @click="wc.handlePetTouch('head')" @dblclick="wc.openScreenFromPet('pet')">
        <PetSprite :stage="wc.currentPetStage" :mode="wc.viewMode === 'pet' ? 'hero' : 'compact'" />
      </button>
      <div class="pet-identity">
        <strong>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</strong>
        <small>{{ wc.currentPetStage.title }}</small>
        <em>{{ wc.state.pet.touchMood }} · {{ wc.formatPawCoins(wc.state.pawBalance) }}</em>
      </div>
      <p v-if="wc.viewMode === 'pet'" class="pet-desktop-line">{{ wc.currentPetStage.line }}</p>
      <div v-if="wc.viewMode === 'pet'" class="pet-core-actions">
        <button type="button" @click="wc.openScreenFromPet('converter')">控制台</button>
        <button type="button" @click="wc.openScreenFromPet('mall')">补给</button>
        <button type="button" @click="wc.openScreenFromPet('pet')">养成</button>
        <button type="button" @click="wc.openScreenFromPet('settings')">设置</button>
      </div>
      <div class="pet-radial-actions">
        <button v-if="wc.viewMode !== 'pet'" type="button" @click="wc.setPetSummoned(false)">收回</button>
        <button v-else type="button" @click="wc.openScreenFromPet('settings')">设置</button>
        <button type="button" @click="wc.triggerBlackoutSkill()">结界</button>
        <button type="button" @click="openSupplyShop">补给</button>
        <button type="button" @click="wc.startGomoku()">五子棋</button>
        <button type="button" @click="wc.startRunner()">闯关</button>
      </div>
    </section>

    <template v-if="isMainView">
      <div class="desktop-shell">
        <div class="title-bar">
          <div class="title-tools">
            <button class="window-tool pet-tool" title="桌宠" @click="wc.setActiveScreen('pet')"></button>
            <button class="title-btn" @click="wc.minimizeMainWindow()" title="最小化"><svg width="10" height="10" viewBox="0 0 10 10"><rect y="4.5" width="10" height="1" fill="currentColor"/></svg></button>
            <button class="title-btn" @click="wc.maximizeMainWindow()" title="最大化"><svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
            <button class="title-btn title-btn-close" @click="wc.closeMainWindow()" title="关闭"><svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.4"/></svg></button>
          </div>
        </div>
        <aside class="sidebar">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">
              <i class="paw-pad"></i>
              <i class="paw-toe toe-a"></i>
              <i class="paw-toe toe-b"></i>
              <i class="paw-toe toe-c"></i>
              <i class="paw-toe toe-d"></i>
            </span>
            <div>
              <strong>忍了吧</strong>
              <small>WageClaw · 怨气管理器</small>
            </div>
          </div>

          <div class="nav-scroll">
            <section class="desk-note" aria-label="今日工位状态">
              <span>今日情绪气压</span>
              <strong>{{ wc.moodCopy[wc.state.mood].label }}</strong>
              <i><b :style="{ width: `${dailyRagePercent}%` }"></b></i>
              <small>怨气 {{ Math.round(wc.state.dailyRage.value) }} / 500</small>
            </section>

            <nav class="nav-list" aria-label="主导航">
              <button
                v-for="item in navItems"
                :key="item.key"
                type="button"
                :class="{ active: wc.activeScreen === item.key }"
                @click="wc.setActiveScreen(item.key)"
              >
                <i class="nav-icon" :class="`nav-${navIconMap[item.key]}`" aria-hidden="true"></i>
                <span>{{ item.label }}</span>
                <small>{{ item.hint }}</small>
              </button>
            </nav>
          </div>

          <section class="sidebar-summary">
            <span>今日可领</span>
            <strong>{{ wc.formatBalance(wc.claimableToday) }}</strong>
            <small>{{ wc.countdowns.offWorkText }} 后下班，别把终点前的时间白送出去。</small>
            <button type="button" class="primary-button full" @click="wc.claimDailyWallet">
              领取 {{ wc.formatBalance(wc.claimableToday) }}
            </button>
          </section>
        </aside>

        <main class="workspace">
          <header class="topbar">
            <div class="topbar-title">
              <h1>{{ wc.activeScreen === 'converter' ? `晚上好，${wc.state.nickname}` : activeTitle }}</h1>
              <p v-if="wc.activeScreen === 'mall'">
                工资买心愿，爪币养桌宠，背包只放补给。
              </p>
              <p v-else>{{ screenMoodLine }}</p>
            </div>
            <div class="topbar-art" aria-hidden="true">
              <img :src="topbarArt" alt="" draggable="false" />
            </div>
            <div class="top-metrics">
              <article>
                <span>账户</span>
                <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
              </article>
              <article>
                <span>爪币</span>
                <strong>{{ Math.round(wc.state.pawBalance) }}</strong>
              </article>
              <article>
                <span>今日怨气</span>
                <strong>{{ Math.round(wc.state.dailyRage.value) }}</strong>
              </article>
              <article>
                <span>下班</span>
                <strong>{{ wc.countdowns.offWorkText }}</strong>
              </article>
            </div>
          </header>

          <section v-show="wc.activeScreen === 'converter'" class="screen-grid">
            <section class="home-hero-grid">
              <article class="hero-wallet-card">
                <div class="hero-wallet-copy">
                  <span class="eyebrow">工资余额</span>
                  <h2>{{ wc.formatBalance(wc.walletCoins, 2) }}</h2>
                  <p>可用于实体心愿</p>
                  <div class="wallet-paw-balance">
                    <span>爪币</span>
                    <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                  </div>
                </div>
                <div class="wallet-object" aria-hidden="true">
                  <img class="wallet-card-art" :src="walletCardArt" alt="" draggable="false" />
                </div>
                <footer>
                  <span>本月工资入账 <strong class="plus">{{ wc.formatMoney(wc.monthlyStats.income) }}</strong></span>
                  <span>摸鱼额外所得 <strong class="plus">{{ wc.formatPawCoins(wc.monthlyPawEarned) }}</strong></span>
                </footer>
              </article>

              <article class="salary-progress-card">
                <div class="salary-progress-content">
                  <header class="salary-progress-head">
                    <div>
                      <span class="eyebrow">忍耐进度</span>
                      <p>本月工资转化</p>
                      <small class="salary-cycle-label">{{ wc.salaryCycleProgress.startLabel }} 起至此刻</small>
                    </div>
                    <strong>{{ monthlyProgressPercent }}<small>%</small></strong>
                  </header>
                  <div class="salary-meter" aria-label="本月工资进度">
                    <i><b :style="{ width: `${monthlyProgressPercent}%` }"></b></i>
                    <div>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <footer class="salary-progress-foot">
                    <span>{{ wc.formatMoney(wc.salaryCycleProgress.accumulated, 2) }} / {{ wc.formatMoney(wc.state.salary, 2) }}</span>
                    <button type="button" class="soft-pill" @click="wc.claimDailyWallet">
                      领取
                    </button>
                  </footer>
                </div>
                <div class="patience-pet-wrap">
                  <div class="patience-pet-scene" :style="wc.petStageStyle()" aria-hidden="true">
                    <span class="patience-light"></span>
                    <PetSprite :stage="wc.currentPetStage" mode="mini" />
                    <div class="patience-stage-base">
                      <i><b :style="{ width: `${monthlyProgressPercent}%` }"></b></i>
                    </div>
                  </div>
                  <button type="button" class="pet-squeeze-button" @click="wc.handlePetTouch('head')">捏一捏</button>
                </div>
              </article>
            </section>

            <section class="home-cards quick-actions-grid">
              <article class="quick-module-card">
                <header class="quick-module-head">
                  <div>
                    <span class="eyebrow">供销推荐</span>
                    <h3>快速购买</h3>
                  </div>
                  <button type="button" class="quick-module-link" @click="openSupplyShop">去供销社</button>
                </header>
                <div class="quick-product-grid">
                  <button
                    v-for="item in homeQuickBuyItems"
                    :key="`quick-buy-${item.id}`"
                    type="button"
                    class="quick-product-card"
                    @click="wc.buyMallItem(item)"
                  >
                    <span :class="['quick-product-shot', `quick-${item.category}`, `quick-item-${item.id}`]">
                      <i>{{ item.icon }}</i>
                    </span>
                    <strong>{{ item.name }}</strong>
                    <small class="quick-product-effect">
                      {{ wc.formatPetBoost(item.petBoost) || item.tag }} ·
                      {{ wc.getMallItemCurrency(item) === 'paw' ? wc.formatPawCoins(item.price) : wc.getMallItemCurrency(item) === 'rage' ? wc.formatRage(item.price) : wc.formatMoney(item.price, 0) }}
                    </small>
                  </button>
                </div>
              </article>

              <article class="quick-module-card">
                <header class="quick-module-head">
                  <div>
                    <span class="eyebrow">背包补给</span>
                    <h3>快速投喂</h3>
                  </div>
                  <button type="button" class="quick-module-link" @click="openInventory">去背包</button>
                </header>
                <div class="quick-product-grid">
                  <button
                    v-for="(entry, index) in homeQuickFeedSlots"
                    :key="entry ? `quick-feed-${entry.item.id}` : `quick-feed-empty-${index}`"
                    type="button"
                    class="quick-product-card"
                    :class="{ empty: !entry }"
                    :disabled="!entry"
                    @click="entry && wc.useItem(entry.item)"
                  >
                    <template v-if="entry">
                      <span :class="['quick-product-shot', `quick-${entry.item.category}`, `quick-item-${entry.item.id}`]">
                        <i>{{ entry.item.icon }}</i>
                        <em>x{{ entry.quantity }}</em>
                      </span>
                      <strong>{{ entry.item.name }}</strong>
                      <small class="quick-product-effect">{{ wc.formatPetBoost(entry.item.petBoost) || entry.item.tag }} · x{{ entry.quantity }} · 点击投喂</small>
                    </template>
                    <template v-else>
                      <span class="quick-product-shot empty-shot">
                        <i>+</i>
                      </span>
                      <strong>空位</strong>
                      <small class="quick-product-effect">背包暂无可投喂补给 · 去供销社补货</small>
                    </template>
                  </button>
                </div>
              </article>
            </section>

            <section class="two-column">
              <article class="panel-block wish-workbench-panel">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">实体心愿拆分台</span>
                    <h3>{{ wc.state.wish }}</h3>
                  </div>
                  <strong>{{ wc.wishCollected ? '已入背包' : `${wc.formatMoney(wc.wishRemaining)} 待点亮` }}</strong>
                </header>
                <div class="segmented wish-workbench-tabs">
                  <button type="button" :class="{ active: wc.accountTab === 'split' }" @click="wc.accountTab = 'split'">当前拆分</button>
                  <button type="button" :class="{ active: wc.accountTab === 'realized' }" @click="wc.accountTab = 'realized'">
                    已实现心愿 <em>{{ wc.earnedGoods.length }}</em>
                  </button>
                </div>
                <div class="wish-workbench-body">
                  <template v-if="wc.accountTab === 'split'">
                    <div class="wish-progress">
                      <i :style="{ width: `${wc.wishProgress * 100}%` }"></i>
                      <span class="bar-label">{{ Math.round(wc.wishProgress * 100) }}%</span>
                    </div>
                    <div class="macbook-split asset-macbook" :class="{ complete: wc.wishReady }" :aria-label="`${wc.state.wish} 零件点亮图`" role="group">
                      <img v-if="wc.wishReady" :src="activeWishVisual.full" class="macbook-full-render" alt="" draggable="false" />
                      <button
                        v-else
                        v-for="part in wishParts"
                        :key="`object-${part.id}`"
                        type="button"
                        class="wish-part-hotspot"
                        :class="{ on: part.unlocked }"
                        :style="part.artStyle"
                        :aria-describedby="`wish-part-tip-${part.id}`"
                        :aria-disabled="part.unlocked || wc.wishCollected"
                        :aria-label="`${part.name}，${part.unlocked ? '已点亮' : wc.formatMoney(part.price, 0)}。${part.narrative}`"
                        @pointerenter="showWishPartTooltip(part.id, $event)"
                        @pointerleave="hideWishPartTooltip(part.id)"
                        @focus="showWishPartTooltip(part.id, $event)"
                        @blur="hideWishPartTooltip(part.id)"
                        @click="!part.unlocked && !wc.wishCollected && wc.buyPart(part.id)"
                      >
                        <img :src="part.image" :class="['mac-art-part', { on: part.unlocked }]" alt="" draggable="false" />
                      </button>
                      <em>{{ wc.wishReady ? 'READY TO ASSEMBLE' : '2D EXPLODED VIEW' }}</em>
                    </div>
                    <button v-if="wc.wishReady" type="button" class="primary-button full wish-assemble-button" @click="wc.claimWishReward">
                      {{ wc.wishCollected ? '重播拼装鼓励' : '开始零件拼装' }}
                    </button>
                  </template>
                  <div v-else class="realized-gallery realized-in-workbench" :class="{ empty: !wc.earnedGoods.length }">
                    <template v-if="wc.earnedGoods.length">
                      <article v-for="good in wc.earnedGoods" :key="`converter-realized-${good.id}`" class="realized-card">
                        <div class="realized-visual asset-macbook complete" aria-hidden="true">
                          <img :src="getWishVisual(good.itemId).full" class="macbook-full-render" alt="" draggable="false" />
                        </div>
                        <div>
                          <strong>{{ good.icon }} {{ good.name }}</strong>
                          <small>{{ good.source }} · {{ good.time }}</small>
                          <p>这件礼物已经从心愿系统毕业，留在这里做成就陈列。</p>
                        </div>
                      </article>
                    </template>
                    <article v-else class="realized-card realized-card-empty">
                      <div class="realized-visual asset-macbook complete" aria-hidden="true">
                        <img :src="activeWishVisual.full" class="macbook-full-render" alt="" draggable="false" />
                      </div>
                      <div>
                        <strong>还没有实现的心愿</strong>
                        <small>完成当前拆分后会自动入库</small>
                        <p>这里会陈列已经靠工资进度拿回来的实体礼物，不和桌宠背包混在一起。</p>
                      </div>
                    </article>
                  </div>
                </div>
              </article>

              <article class="panel-block ledger-summary-card">
                <header class="panel-header ledger-summary-head">
                  <div>
                    <span class="eyebrow">账本</span>
                    <h3>交易记录</h3>
                  </div>
                  <span>{{ wc.state.transactions.length }} 笔</span>
                </header>
                <div class="ledger-summary-metrics">
                  <article>
                    <span>本月收入</span>
                    <strong class="plus">{{ wc.formatMoney(wc.monthlyStats.income) }}</strong>
                  </article>
                  <article>
                    <span>本月支出</span>
                    <strong class="minus">{{ wc.formatMoney(-wc.monthlyStats.expense) }}</strong>
                  </article>
                  <article>
                    <span>净额</span>
                    <strong :class="wc.monthlyStats.net >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(wc.monthlyStats.net) }}</strong>
                  </article>
                </div>
                <article v-if="latestTransaction" class="ledger-latest-card">
                  <div class="badge">{{ wc.transactionCategories[latestTransaction.category].icon }}</div>
                  <div>
                    <span>最近一笔</span>
                    <strong>{{ latestTransaction.title }}</strong>
                    <small>{{ latestTransaction.note }} · {{ latestTransaction.time }}</small>
                  </div>
                  <em :class="latestTransaction.amount >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(latestTransaction.amount) }}</em>
                </article>
                <p v-else class="empty-state ledger-empty">账本还没有记录。</p>
                <button type="button" class="primary-button full ledger-open-button" @click="openLedgerDialog">打开账本</button>
              </article>
            </section>
          </section>

          <section
            v-if="ledgerDialogOpen"
            class="modal-layer ledger-modal-layer"
            role="dialog"
            aria-modal="true"
            aria-label="交易账本"
            @click.self="closeLedgerDialog"
          >
            <div class="panel-block ledger-modal">
              <header class="panel-header">
                <div>
                  <span class="eyebrow">账本</span>
                  <h3>{{ ledgerMode === 'wallet' ? '工资账本' : '爪币账本' }}</h3>
                </div>
                <span>{{ ledgerMode === 'wallet' ? wc.pagedTransactions.totalItems : wc.pagedPawLedger.totalItems }} 笔</span>
                <button type="button" class="icon-button" @click="closeLedgerDialog">×</button>
              </header>
              <div class="segmented ledger-type-tabs">
                <button type="button" :class="{ active: ledgerMode === 'wallet' }" @click="ledgerMode = 'wallet'">
                  工资账本<em>{{ wc.state.transactions.length }}</em>
                </button>
                <button type="button" :class="{ active: ledgerMode === 'paw' }" @click="ledgerMode = 'paw'">
                  爪币账本<em>{{ wc.pawLedgerItems.length }}</em>
                </button>
              </div>
              <div v-if="ledgerMode === 'wallet'" class="filter-row ledger-modal-filters">
                <button
                  v-for="filter in transactionFilters"
                  :key="filter.key"
                  type="button"
                  :class="{ active: wc.state.transactionFilter === filter.key }"
                  @click="wc.setTransactionFilter(filter.key)"
                >
                  {{ filter.label }}
                </button>
              </div>
              <div v-else class="ledger-modal-filters ledger-paw-overview">
                <article>
                  <span>本月入账</span>
                  <strong class="plus">{{ wc.formatPawCoins(wc.monthlyPawStats.earned) }}</strong>
                </article>
                <article>
                  <span>本月支出</span>
                  <strong class="minus">{{ wc.formatPawCoins(wc.monthlyPawStats.spent) }}</strong>
                </article>
                <article>
                  <span>爪币净额</span>
                  <strong :class="wc.monthlyPawStats.net >= 0 ? 'plus' : 'minus'">{{ formatPawLedgerAmount(wc.monthlyPawStats.net) }}</strong>
                </article>
              </div>
              <div v-if="ledgerMode === 'wallet'" class="list-stack ledger-modal-list">
                <article v-for="item in wc.pagedTransactions.items" :key="item.id" class="list-item">
                  <div class="badge">{{ wc.transactionCategories[item.category].icon }}</div>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.note }} · {{ item.time }}</small>
                  </div>
                  <em :class="item.amount >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(item.amount) }}</em>
                </article>
                <article
                  v-for="slot in transactionLedgerEmptyRowCount"
                  :key="`transaction-ledger-empty-${wc.pagedTransactions.current}-${wc.state.transactionFilter}-${slot}`"
                  class="list-item ledger-placeholder-row"
                  aria-hidden="true"
                >
                  <div class="badge">--</div>
                  <div>
                    <strong>{{ wc.pagedTransactions.totalItems === 0 && slot === 1 ? '当前筛选暂无记录' : '预留记录位' }}</strong>
                    <small>{{ wc.pagedTransactions.totalItems === 0 && slot === 1 ? '换个分类看看，账本高度会保持不变。' : '用于稳定 10 条账本行高度' }}</small>
                  </div>
                  <em>--</em>
                </article>
              </div>
              <div v-else class="list-stack ledger-modal-list paw-ledger-list">
                <article v-for="item in wc.pagedPawLedger.items" :key="item.id" class="list-item">
                  <div class="badge paw-badge">{{ pawBucketLabels[item.bucket] }}</div>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.note }} · {{ item.time }}</small>
                  </div>
                  <em :class="item.amount >= 0 ? 'plus' : 'minus'">{{ formatPawLedgerAmount(item.amount) }}</em>
                </article>
                <article
                  v-for="slot in pawLedgerEmptyRowCount"
                  :key="`paw-ledger-empty-${wc.pagedPawLedger.current}-${slot}`"
                  class="list-item ledger-placeholder-row"
                  aria-hidden="true"
                >
                  <div class="badge paw-badge">--</div>
                  <div>
                    <strong>{{ wc.pagedPawLedger.totalItems === 0 && slot === 1 ? '暂无爪币记录' : '预留记录位' }}</strong>
                    <small>{{ wc.pagedPawLedger.totalItems === 0 && slot === 1 ? '出勤、互动、供销社兑换都会记在这里。' : '用于稳定 10 条账本行高度' }}</small>
                  </div>
                  <em>--</em>
                </article>
              </div>
              <footer class="pager">
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', -1)">上一页</button>
                <button v-else type="button" @click="wc.setPage('pawLedger', -1)">上一页</button>
                <span v-if="ledgerMode === 'wallet'">{{ wc.pagedTransactions.current }} / {{ wc.pagedTransactions.totalPages }} · {{ pageLabels.transactions }}</span>
                <span v-else>{{ wc.pagedPawLedger.current }} / {{ wc.pagedPawLedger.totalPages }} · {{ pageLabels.pawLedger }}</span>
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', 1)">下一页</button>
                <button v-else type="button" @click="wc.setPage('pawLedger', 1)">下一页</button>
              </footer>
            </div>
          </section>

          <section v-show="wc.activeScreen === 'mall'" class="screen-grid mall-screen supply-hub-screen">
            <article class="supply-hub-bar" aria-label="补给仓分区">
              <div class="supply-hub-tabs">
                <button
                  v-for="tab in supplyHubTabs"
                  :key="tab.key"
                  type="button"
                  :class="{ active: wc.mallTab === tab.key }"
                  @click="wc.mallTab = tab.key"
                >
                  <strong>{{ tab.label }}</strong>
                  <small>{{ tab.hint }}</small>
                  <em>{{ tab.count }}</em>
                </button>
              </div>
              <div class="supply-hub-resources" aria-label="补给仓钱包">
                <div class="supply-wallet-card">
                  <i class="wallet-emblem" aria-hidden="true"></i>
                  <div class="wallet-ledger">
                    <div class="wallet-row wallet-row-wage">
                      <span>工资余额</span>
                      <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
                    </div>
                    <div class="wallet-row wallet-row-paw">
                      <span>爪币余额</span>
                      <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <section v-show="wc.mallTab === 'wishShop'" class="panel-block supply-module wish-market-panel">
              <header class="supply-module-head">
                <div>
                  <h3>心愿商城</h3>
                  <span>工资余额只用于实体目标，不再和桌宠补给混账。</span>
                </div>
                <button type="button" class="soft-pill" @click="openWishWorkbench('split')">查看拆分台</button>
              </header>
              <div class="wish-market-layout">
                <div class="wish-market-grid">
                  <article
                    v-for="item in wc.pagedWishShopItems.items"
                    :key="item.id"
                    class="wish-shop-card"
                    tabindex="0"
                    :aria-describedby="`wish-shop-detail-${item.id}`"
                  >
                    <div class="wish-shop-visual asset-macbook complete" aria-hidden="true">
                      <img :src="getWishVisual(item.id).full" class="macbook-full-render" alt="" draggable="false" />
                      <span>{{ item.tag }}</span>
                    </div>
                    <div class="wish-shop-body">
                      <div class="wish-shop-title">
                        <strong>{{ item.name }}</strong>
                      </div>
                      <span class="wish-shop-meta">{{ item.tag }}</span>
                      <p>{{ item.description }}</p>
                      <div class="wish-shop-progress" :class="{ active: wc.state.activeWishId === item.id }">
                        <i :style="{ width: `${wc.state.activeWishId === item.id ? wc.wishProgress * 100 : 0}%` }"></i>
                      </div>
                    </div>
                    <footer class="wish-shop-foot">
                      <div class="wish-shop-state">
                        <span>{{ wc.state.activeWishId === item.id ? `${Math.round(wc.wishProgress * 100)}% 点亮中` : '可设为实体心愿' }}</span>
                        <em class="wish-shop-price">{{ wc.formatMoney(item.price, 0) }}</em>
                      </div>
                      <button
                        type="button"
                        class="primary-button"
                        @click="wc.state.activeWishId === item.id ? wc.setActiveScreen('converter') : wc.setWishItem(item)"
                      >
                        {{ wc.state.activeWishId === item.id ? '查看拆分' : '设为心愿' }}
                      </button>
                    </footer>
                    <div :id="`wish-shop-detail-${item.id}`" class="wish-shop-detail-popover" role="tooltip">
                      <strong>{{ item.name }}</strong>
                      <span>{{ wc.formatMoney(item.price, 0) }} · {{ item.tag }}</span>
                      <p>{{ item.description }}</p>
                      <small>{{ item.effect }}</small>
                    </div>
                  </article>
                  <article
                    v-for="slot in wishShopEmptySlotCount"
                    :key="`wish-shop-empty-${wc.pagedWishShopItems.current}-${slot}`"
                    class="wish-shop-card wish-shop-empty-card"
                    aria-hidden="true"
                  >
                    <div class="wish-shop-visual wish-shop-empty-visual">
                      <i>+</i>
                    </div>
                    <div class="wish-shop-body">
                      <div class="wish-shop-title">
                        <strong>空心愿位</strong>
                      </div>
                      <span class="wish-shop-meta">等待上新</span>
                      <p>这里给下一件实体目标预留位置。</p>
                      <div class="wish-shop-progress"></div>
                    </div>
                    <footer class="wish-shop-foot">
                      <div class="wish-shop-state">
                        <span>预留空位</span>
                        <em class="wish-shop-price">--</em>
                      </div>
                    </footer>
                  </article>
                </div>
              </div>
              <footer class="supply-module-footer">
                <span>{{ wc.pagedWishShopItems.totalItems }} 件心愿礼物</span>
                <div class="pager compact">
                  <button type="button" @click="wc.setPage('wishShop', -1)">上一页</button>
                  <span>{{ wc.pagedWishShopItems.current }} / {{ wc.pagedWishShopItems.totalPages }}</span>
                  <button type="button" @click="wc.setPage('wishShop', 1)">下一页</button>
                </div>
              </footer>
            </section>

            <section v-show="wc.mallTab === 'supplyShop'" class="panel-block supply-module supply-market-panel">
              <header class="supply-module-head">
                <div>
                  <h3>供销社</h3>
                  <span>桌宠需要的吃喝、恢复和训练物资，统一走爪币余额。</span>
                </div>
                <div class="filter-row shelf-filter supply-filter">
                  <button
                    v-for="filter in supplyFilters"
                    :key="filter.key"
                    type="button"
                    :class="{ active: wc.state.mallFilter === filter.key || (filter.key === 'all' && wc.state.mallFilter === 'real') }"
                    @click="wc.setMallFilter(filter.key)"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </header>
              <div class="supply-market-grid">
                <article v-for="item in wc.pagedSupplyShopItems.items" :key="item.id" class="supply-shop-card">
                  <div class="supply-item-icon">{{ item.icon }}</div>
                  <div class="supply-shop-copy">
                    <div>
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.tag }}</span>
                    </div>
                    <small>{{ item.description }}</small>
                    <p>{{ item.effect }}</p>
                  </div>
                  <footer>
                    <em>{{ wc.formatPawCoins(item.price) }}</em>
                    <button type="button" @click="wc.buyMallItem(item)">兑换</button>
                  </footer>
                </article>
                <article
                  v-for="slot in supplyShopEmptySlotCount"
                  :key="`supply-shop-empty-${wc.pagedSupplyShopItems.current}-${wc.state.mallFilter}-${slot}`"
                  class="supply-shop-card supply-shop-empty-card"
                  aria-hidden="true"
                >
                  <div class="supply-item-icon">+</div>
                  <div class="supply-shop-copy">
                    <div>
                      <strong>{{ wc.pagedSupplyShopItems.totalItems === 0 && slot === 1 ? '这个分类暂时没有补给' : '空货位' }}</strong>
                      <span>{{ wc.pagedSupplyShopItems.totalItems === 0 && slot === 1 ? activeMallFilterLabel : '待补货' }}</span>
                    </div>
                    <small>{{ wc.pagedSupplyShopItems.totalItems === 0 && slot === 1 ? '换个分类看看，或者等软团采购回来。' : '这里给下一件补给预留位置。' }}</small>
                    <p>等待入架</p>
                  </div>
                  <footer>
                    <em>--</em>
                  </footer>
                </article>
              </div>
              <footer class="supply-module-footer">
                <span>{{ activeMallFilterLabel }} · {{ wc.pagedSupplyShopItems.totalItems }} 件供销社商品</span>
                <div class="pager compact">
                  <button type="button" @click="wc.setPage('supplyShop', -1)">上一页</button>
                  <span>{{ wc.pagedSupplyShopItems.current }} / {{ wc.pagedSupplyShopItems.totalPages }}</span>
                  <button type="button" @click="wc.setPage('supplyShop', 1)">下一页</button>
                </div>
              </footer>
            </section>

            <section v-show="wc.mallTab === 'inventory'" class="panel-block supply-module inventory-panel">
              <header class="supply-module-head">
                <div>
                  <h3>背包</h3>
                  <span>这里只放给桌宠买的东西；实体心愿转到已实现心愿陈列。</span>
                </div>
                <button type="button" class="soft-pill" @click="wc.mallTab = 'supplyShop'">去供销社</button>
              </header>
              <div class="inventory-workbench">
                <div class="inventory-slot-grid" :class="{ empty: wc.pagedInventoryItems.totalItems === 0 }">
                  <article v-for="entry in wc.pagedInventoryItems.items" :key="entry.item.id" class="inventory-slot-card">
                    <div class="inventory-slot-icon">
                      <span>{{ entry.item.icon }}</span>
                      <em>x{{ entry.quantity }}</em>
                    </div>
                    <strong>{{ entry.item.name }}</strong>
                    <small>{{ entry.item.effect }}</small>
                    <button type="button" @click="wc.useItem(entry.item)">使用</button>
                  </article>
                  <article
                    v-for="slot in inventoryEmptySlotCount"
                    :key="`empty-inventory-${wc.pagedInventoryItems.current}-${slot}`"
                    class="inventory-slot-card inventory-slot-empty"
                    aria-hidden="true"
                  >
                    <div class="inventory-slot-icon">
                      <span>{{ wc.pagedInventoryItems.totalItems === 0 && slot === 1 ? '空' : '+' }}</span>
                    </div>
                    <strong>{{ wc.pagedInventoryItems.totalItems === 0 && slot === 1 ? '背包里暂时没有补给' : '空槽位' }}</strong>
                    <small>{{ wc.pagedInventoryItems.totalItems === 0 && slot === 1 ? '去供销社换一点能救命的小东西。' : '等待入库' }}</small>
                  </article>
                </div>
              </div>
              <footer class="supply-module-footer">
                <span>{{ inventoryTotal }} 件物品 · {{ inventoryCategoryCount }} 类</span>
                <div class="pager compact">
                  <button type="button" @click="wc.setPage('inventory', -1)">上一页</button>
                  <span>{{ wc.pagedInventoryItems.current }} / {{ wc.pagedInventoryItems.totalPages }}</span>
                  <button type="button" @click="wc.setPage('inventory', 1)">下一页</button>
                </div>
              </footer>
            </section>

          </section>

          <section v-show="wc.activeScreen === 'pet'" class="screen-grid pet-screen-redesign">
            <article class="hero-panel pet-command-center">
              <div class="pet-command-copy">
                <div class="pet-title-row">
                  <div>
                    <span class="eyebrow">怨气桌宠</span>
                    <h2>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</h2>
                    <p>{{ wc.state.pet.lastLine }}</p>
                  </div>
                  <button type="button" class="primary-button" @click="wc.setPetSummoned()">
                    {{ wc.state.pet.summoned ? "收回软团" : "召唤软团" }}
                  </button>
                </div>

                <div class="pet-progress-inline pet-progress-redesign" :style="wc.petStageStyle()">
                  <div>
                    <strong>进化进度</strong>
                    <span>{{ Math.round(wc.petProgress * 100) }}%</span>
                  </div>
                  <div class="evolution-markers">
                    <span
                      v-for="stage in wc.petStages"
                      :key="`pet-redesign-progress-${stage.id}`"
                      :class="{ active: wc.state.pet.rage >= stage.threshold, current: wc.currentPetStage.id === stage.id }"
                    ></span>
                  </div>
                </div>

                <section class="pet-style-panel pet-style-panel-redesign" aria-label="桌宠切换">
                  <div class="pet-style-panel-head">
                    <span>桌宠切换</span>
                    <strong>{{ wc.petStyleLabels[wc.state.petStyle] }}</strong>
                  </div>
                  <div class="pet-style-switcher pet-style-switcher--compact">
                    <button
                      v-for="[key, label] in petStyleEntries"
                      :key="`pet-redesign-style-${key}`"
                      type="button"
                      :class="{ active: wc.state.petStyle === key }"
                      :aria-pressed="wc.state.petStyle === key"
                      @click="wc.state.petStyle = key"
                    >
                      <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
                      <strong>{{ label }}</strong>
                    </button>
                  </div>
                </section>
              </div>

              <div class="pet-stage-suite" :style="wc.petStageStyle()">
                <div class="pet-stage-visual">
                  <span class="desk-lamp" aria-hidden="true"></span>
                  <span class="desk-steam steam-a" aria-hidden="true"></span>
                  <span class="desk-steam steam-b" aria-hidden="true"></span>
                  <div class="pet-desk-platform" aria-hidden="true">
                    <span class="pet-laptop"></span>
                    <span class="pet-cup"></span>
                  </div>
                  <PetSprite :stage="wc.currentPetStage" mode="hero" />
                  <small>{{ wc.currentPetStage.title }}</small>
                </div>

                <aside class="pet-attribute-dock" aria-label="属性">
                  <header>
                    <div>
                      <span>属性</span>
                      <strong>悬停看详情</strong>
                    </div>
                    <em>{{ wc.state.pet.touchMood }}</em>
                  </header>
                  <button
                    v-for="row in petAttributeRows"
                    :key="row.label"
                    type="button"
                    class="pet-attribute-row"
                    :class="`tone-${row.tone}`"
                    :style="{ '--attribute-color': row.color || undefined }"
                  >
                    <span>{{ row.label }}</span>
                    <strong>{{ row.value }}</strong>
                    <small>{{ row.detail }}</small>
                  </button>
                </aside>
              </div>
            </article>

            <section class="pet-workbench-grid">
              <article class="panel-block pet-refine-lab">
                <div class="pet-refine-art">
                  <img :src="alchemyFurnaceArt" alt="炼化炉" draggable="false" />
                </div>
                <div class="pet-refine-body">
                  <header class="panel-header">
                    <div>
                      <span class="eyebrow">炼化</span>
                      <h3>把糟心事炼成怨气</h3>
                    </div>
                    <span>今日 {{ Math.round(wc.state.dailyRage.value) }}</span>
                  </header>
                  <textarea
                    v-model="wc.rantText"
                    rows="5"
                    placeholder="把今天最烦的一句话丢进炉子里，软团会帮你收好。"
                  ></textarea>
                  <div class="refine-meter">
                    <span>炉温</span>
                    <i><b :style="{ width: `${Math.min(100, 34 + wc.state.dailyRage.value / 10)}%` }"></b></i>
                    <strong>{{ wc.state.pet.rage >= 500 ? "满溢" : "可炼化" }}</strong>
                  </div>
                  <div class="action-row pet-refine-actions">
                    <button type="button" class="primary-button" @click="wc.refineRageFromRant">开始炼化</button>
                    <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
                  </div>
                </div>
              </article>

              <article class="panel-block pet-feed-bag">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">投喂</span>
                    <h3>背包</h3>
                  </div>
                  <button type="button" class="secondary-button" @click="openSupplyShop">去补给</button>
                </header>
                <div class="pet-feed-grid">
                  <article
                    v-for="entry in petBackpackItems"
                    :key="`pet-feed-${entry.item.id}`"
                    class="pet-feed-slot"
                    :class="{ empty: entry.quantity <= 0 }"
                  >
                    <div class="pet-feed-art">
                      <img :src="getPetFeedArt(entry.item)" :alt="entry.item.name" draggable="false" />
                      <em>x{{ entry.quantity }}</em>
                    </div>
                    <strong>{{ entry.item.name }}</strong>
                    <small>{{ formatPetFeedEffect(entry.item) }}</small>
                    <button type="button" :disabled="entry.quantity <= 0" @click="wc.useItem(entry.item)">喂给软团</button>
                  </article>
                </div>
              </article>
            </section>
          </section>

          <section v-if="false" class="screen-grid">
            <article class="hero-panel pet-hero">
              <div class="pet-hero-main">
                <div class="pet-hero-copy">
                  <span class="eyebrow">怨气桌宠</span>
                  <h2>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</h2>
                  <p>{{ wc.state.pet.lastLine }}</p>
                  <div class="tag-row">
                    <span>{{ wc.currentPetStage.title }}</span>
                    <span>{{ wc.petAffinity.label }}</span>
                    <span>{{ wc.state.pet.touchMood }}</span>
                    <span>修炼 {{ wc.state.pet.cultivation }} 重</span>
                  </div>
                </div>
                <div class="pet-progress-inline" :style="wc.petStageStyle()">
                  <div>
                    <strong>进化进度</strong>
                    <span>{{ Math.round(wc.petProgress * 100) }}%</span>
                  </div>
                  <div class="evolution-markers">
                    <span
                      v-for="stage in wc.petStages"
                      :key="`pet-progress-line-${stage.id}`"
                      :class="{ active: wc.state.pet.rage >= stage.threshold, current: wc.currentPetStage.id === stage.id }"
                    ></span>
                  </div>
                </div>
                <div class="button-stack pet-hero-actions">
                  <button type="button" class="primary-button" @click="wc.setPetSummoned()">{{ wc.state.pet.summoned ? "收回软团" : "召唤软团" }}</button>
                  <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
                </div>
                <section class="pet-style-panel" aria-label="桌宠切换">
                  <div class="pet-style-panel-head">
                    <span>桌宠切换</span>
                    <strong>{{ wc.petStyleLabels[wc.state.petStyle] }}</strong>
                  </div>
                  <div class="pet-style-switcher pet-style-switcher--compact">
                    <button
                      v-for="[key, label] in petStyleEntries"
                      :key="`pet-page-style-${key}`"
                      type="button"
                      :class="{ active: wc.state.petStyle === key }"
                      :aria-pressed="wc.state.petStyle === key"
                      @click="wc.state.petStyle = key"
                    >
                      <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
                      <strong>{{ label }}</strong>
                    </button>
                  </div>
                </section>
              </div>
              <div class="pet-aura" :style="wc.petStageStyle()" aria-hidden="true">
                <div class="evolution-vessel">
                  <i><b :style="{ height: `${wc.petProgress * 100}%` }"></b></i>
                  <PetSprite :stage="wc.currentPetStage" mode="mini" />
                </div>
                <div class="pet-tooltips" v-if="wc.state.pet.summoned">
                  <span class="pet-tip" :style="{ color: wc.petHungerLabel.color }">{{ wc.petHungerLabel.label }}</span>
                  <span class="pet-tip" :style="{ color: wc.petPressureLabel.color }">{{ wc.petPressureLabel.label }}</span>
                </div>
                <span>{{ wc.currentPetStage.title }}</span>
              </div>
            </article>

            <section class="pet-vital-strip">
              <article class="pet-vital-card vital-paw">
                <span>爪币小金库</span>
                <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                <i><b :style="{ width: `${Math.round(wc.pawAttendanceProgress * 100)}%` }"></b></i>
              </article>
              <article class="pet-vital-card vital-rage">
                <span>怨气储能</span>
                <strong>{{ wc.formatRage(wc.state.pet.rage) }}</strong>
                <i><b :style="{ width: `${Math.min(100, wc.state.pet.rage / 5)}%` }"></b></i>
              </article>
              <article class="pet-vital-card">
                <span>清气</span>
                <strong>{{ wc.formatLight(wc.state.pet.light) }}</strong>
                <i><b :style="{ width: `${Math.min(100, wc.state.pet.light)}%` }"></b></i>
              </article>
              <article class="pet-vital-card">
                <span>法力池</span>
                <strong>{{ Math.round(wc.state.pet.mana) }} / {{ wc.petManaMax }}</strong>
                <i><b :style="{ width: `${Math.min(100, (wc.state.pet.mana / wc.petManaMax) * 100)}%` }"></b></i>
              </article>
              <article class="pet-vital-card">
                <span>战绩</span>
                <strong>{{ wc.state.pet.battleWins }} 胜 / {{ wc.state.pet.battleLosses }} 负</strong>
                <i><b :style="{ width: `${Math.min(100, (wc.state.pet.battleWins / Math.max(1, wc.state.pet.battleWins + wc.state.pet.battleLosses)) * 100)}%` }"></b></i>
              </article>
              <article class="pet-vital-card warning" :style="{ '--vital-color': wc.petHungerLabel.color }">
                <span>饱食</span>
                <strong>{{ wc.petHungerLabel.label }}</strong>
                <i><b :style="{ width: `${Math.round(wc.state.pet.hunger)}%`, background: wc.petHungerLabel.color }"></b></i>
              </article>
              <article class="pet-vital-card warning" :style="{ '--vital-color': wc.petPressureLabel.color }">
                <span>血压</span>
                <strong>{{ wc.petPressureLabel.label }}</strong>
                <i><b :style="{ width: `${Math.round(wc.state.pet.bloodPressure)}%`, background: wc.petPressureLabel.color }"></b></i>
              </article>
            </section>

            <div class="segmented wide-tabs">
              <button type="button" :class="{ active: wc.petTab === 'status' }" @click="wc.petTab = 'status'">总览</button>
              <button type="button" :class="{ active: wc.petTab === 'refine' }" @click="wc.petTab = 'refine'">炼化</button>
              <button type="button" :class="{ active: wc.petTab === 'feed' }" @click="wc.petTab = 'feed'">投喂</button>
              <button type="button" :class="{ active: wc.petTab === 'log' }" @click="wc.petTab = 'log'">记录</button>
            </div>

            <section v-show="wc.petTab === 'status'" class="pet-status-console">
              <article class="panel-block pet-growth-card">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">成长仪表盘</span>
                    <h3>阶段总览</h3>
                  </div>
                  <span>{{ nextPetStageDistanceLabel }}</span>
                </header>
                <div class="pet-stage-summary" :style="wc.petStageStyle()">
                  <div class="stage-orb">
                    <strong>{{ wc.currentPetStage.level }}</strong>
                    <span>阶</span>
                  </div>
                  <div>
                    <strong>{{ wc.currentPetStage.name }}</strong>
                    <small>{{ wc.currentPetStage.title }}</small>
                    <p>{{ wc.petStageLore }}</p>
                  </div>
                </div>
                <div class="wish-progress pet-stage-progress">
                  <i :style="{ width: `${wc.petProgress * 100}%` }"></i>
                  <span class="bar-label">{{ Math.round(wc.petProgress * 100) }}%</span>
                </div>
                <div class="stat-bars pet-stat-bars">
                  <label><span>亲密</span><i><b :style="{ width: `${wc.state.pet.affection}%` }"></b><span class="bar-label">{{ wc.state.pet.affection }}%</span></i></label>
                  <label><span>饱食</span><i><b :style="{ width: `${wc.state.pet.hunger}%`, background: wc.petHungerLabel.color }"></b><span class="bar-label">{{ Math.round(wc.state.pet.hunger) }}%</span></i></label>
                  <label><span>血压</span><i><b :style="{ width: `${wc.state.pet.bloodPressure}%`, background: wc.petPressureLabel.color }"></b><span class="bar-label">{{ Math.round(wc.state.pet.bloodPressure) }}%</span></i></label>
                </div>
              </article>
              <article class="panel-block pet-touch-card">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">互动控制台</span>
                    <h3>触摸反馈</h3>
                  </div>
                  <span>{{ wc.state.pet.touchMood }}</span>
                </header>
                <div class="touch-heat-meter">
                  <span>触摸热度</span>
                  <strong>{{ wc.state.pet.touchHeat }}</strong>
                  <i><b :style="{ width: `${Math.min(100, wc.state.pet.touchHeat)}%` }"></b></i>
                </div>
                <div class="touch-grid pet-touch-grid">
                  <button v-for="[key, touch] in touchEntries" :key="key" type="button" @click="wc.handlePetTouch(key)">
                    <span class="touch-glyph">{{ touch.label.charAt(0) }}</span>
                    <strong>{{ touch.label }}</strong>
                    <small>{{ touch.mood }} · 怨气 +{{ touch.rage }} · 爪币 +{{ touch.nourish }}</small>
                  </button>
                </div>
                <div class="action-row pet-command-row">
                  <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
                  <button type="button" class="secondary-button" @click="wc.triggerBlackoutSkill()">黑屏结界</button>
                  <button type="button" class="secondary-button" @click="wc.previewOnlineBattle">联机预演</button>
                </div>
              </article>
              <article class="panel-block work-event-card">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">爪币系统</span>
                    <h3>桌宠出勤与打工事件</h3>
                  </div>
                  <span>{{ wc.activeWorkEvent?.tone || '出勤中' }}</span>
                </header>
                <div class="paw-ledger-grid">
                  <div>
                    <span>今日出勤</span>
                    <strong>{{ wc.formatPawCoins(wc.state.dailyPaw.attendanceEarned) }}</strong>
                  </div>
                  <div>
                    <span>互动摸鱼</span>
                    <strong>{{ wc.formatPawCoins(wc.state.dailyPaw.interactionEarned) }}</strong>
                  </div>
                  <div>
                    <span>事件净赚</span>
                    <strong>{{ wc.formatPawCoins(wc.state.dailyPaw.eventEarned) }}</strong>
                  </div>
                  <div>
                    <span>今日合计</span>
                    <strong>{{ wc.formatPawCoins(wc.pawTodayEarned) }}</strong>
                  </div>
                </div>
                <div v-if="wc.activeWorkEvent" class="work-event-box">
                  <span>{{ wc.activeWorkEvent?.title }}</span>
                  <p>{{ wc.activeWorkEvent?.prompt }}</p>
                  <div class="work-choice-grid">
                    <button
                      v-for="choice in activeWorkEventChoices"
                      :key="choice.id"
                      type="button"
                      @click="wc.resolveWorkEventChoice(choice.id)"
                    >
                      <strong>{{ choice.label }}</strong>
                      <small>{{ choice.detail }}</small>
                      <em>{{ wc.formatWorkEventEffect(choice.effect) }}</em>
                    </button>
                  </div>
                </div>
                <p v-else class="empty-state">软团正在出勤，下一条打工消息会自己冒出来。</p>
              </article>
            </section>

            <section v-show="wc.petTab === 'status'" class="panel-block evolution-codex">
              <header class="panel-header">
                <div>
                  <span class="eyebrow">十阶形象图鉴</span>
                  <h3>从怨息雾团到玄怨邪仙</h3>
                </div>
                <span>{{ wc.petStageLore }}</span>
              </header>
              <div class="stage-grid">
                <article
                  v-for="stage in wc.petStages"
                  :key="stage.id"
                  :class="{ current: wc.currentPetStage.id === stage.id, locked: wc.state.pet.rage < stage.threshold }"
                >
                  <PetSprite :stage="stage" mode="mini" />
                  <strong>Lv.{{ stage.level }} {{ stage.name }}</strong>
                  <small>{{ stage.title }}</small>
                  <p>{{ stage.visual }}</p>
                </article>
              </div>
            </section>

            <section v-show="wc.petTab === 'refine'" class="panel-block">
              <header class="panel-header">
                <h3>糟心事炼化炉</h3>
                <span>今日怨气 {{ Math.round(wc.state.dailyRage.value) }}</span>
              </header>
              <textarea v-model="wc.rantText" rows="8" placeholder="例：老板把临时起意说成我的成长机会，还问我为什么不够主动。"></textarea>
              <div class="action-row">
                <button type="button" class="primary-button" @click="wc.refineRageFromRant">炼化为怨气</button>
                <button type="button" class="secondary-button" @click="wc.refineLightFromRant">转化为清气</button>
              </div>
            </section>

            <section v-show="wc.petTab === 'feed'" class="panel-block">
              <header class="panel-header">
                <h3>可投喂供品</h3>
                <span>{{ wc.pagedPetSupplyItems.totalItems }} 类</span>
              </header>
              <div class="list-stack empty-ok">
                <article v-for="entry in wc.pagedPetSupplyItems.items" :key="entry.item.id" class="list-item">
                  <div class="badge">{{ entry.item.icon }}</div>
                  <div>
                    <strong>{{ entry.item.name }} x{{ entry.quantity }}</strong>
                    <small>{{ wc.formatPetBoost(entry.item.petBoost) }}</small>
                  </div>
                  <button type="button" @click="wc.useItem(entry.item)">投喂</button>
                </article>
                <p v-if="wc.pagedPetSupplyItems.totalItems === 0" class="empty-state">背包里暂时没有桌宠供品。</p>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('petSupply', -1)">上一页</button>
                <span>{{ wc.pagedPetSupplyItems.current }} / {{ wc.pagedPetSupplyItems.totalPages }}</span>
                <button type="button" @click="wc.setPage('petSupply', 1)">下一页</button>
              </footer>
            </section>

            <section v-show="wc.petTab === 'log'" class="panel-block">
              <header class="panel-header">
                <h3>软团记录</h3>
                <span>{{ wc.pagedPetLog.totalItems }} 条</span>
              </header>
              <div class="list-stack">
                <article v-for="item in wc.pagedPetLog.items" :key="`${item.title}-${item.time}`" class="list-item">
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.detail }} · {{ item.time }}</small>
                  </div>
                </article>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('petLog', -1)">上一页</button>
                <span>{{ wc.pagedPetLog.current }} / {{ wc.pagedPetLog.totalPages }}</span>
                <button type="button" @click="wc.setPage('petLog', 1)">下一页</button>
              </footer>
            </section>
          </section>

          <section v-show="wc.activeScreen === 'settings'" class="screen-grid">
            <article class="hero-panel compact">
              <div>
                <span class="eyebrow">基础设置</span>
                <h2>{{ wc.state.nickname }}</h2>
                <p>{{ wc.themeLabels[wc.state.theme] }} · {{ wc.petStyleLabels[wc.state.petStyle] }} · {{ wc.modeLabels[wc.state.countMode] }} · {{ wc.state.startTime }} - {{ wc.state.endTime }}</p>
              </div>
            </article>
            <div class="segmented wide-tabs">
              <button type="button" :class="{ active: wc.settingsTab === 'profile' }" @click="wc.settingsTab = 'profile'">资料</button>
              <button type="button" :class="{ active: wc.settingsTab === 'appearance' }" @click="wc.settingsTab = 'appearance'">外观</button>
              <button type="button" :class="{ active: wc.settingsTab === 'schedule' }" @click="wc.settingsTab = 'schedule'">时间</button>
              <button type="button" :class="{ active: wc.settingsTab === 'data' }" @click="wc.settingsTab = 'data'">数据</button>
            </div>
            <article v-show="wc.settingsTab === 'profile'" class="panel-block form-grid">
              <label>称呼<input v-model="wc.state.nickname" type="text" /></label>
              <label>月薪<input v-model.number="wc.state.salary" type="number" min="1" /></label>
              <label>当前实体心愿<input :value="wc.state.wish" type="text" readonly /></label>
              <label>目标价格<input :value="wc.formatMoney(wc.state.price, 0)" type="text" readonly /></label>
              <label>今日被折磨分钟<input v-model.number="wc.state.rageMinutes" type="number" min="0" /></label>
            </article>
            <article v-show="wc.settingsTab === 'appearance'" class="panel-block form-grid">
              <label>主题
                <select v-model="wc.state.theme">
                  <option v-for="[key, label] in themeEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <label>桌宠系列
                <select v-model="wc.state.petStyle">
                  <option v-for="[key, label] in petStyleEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <label>倒计时口径
                <select v-model="wc.state.countMode">
                  <option v-for="[key, label] in modeEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <div class="pet-style-switcher">
                <button
                  v-for="[key, label] in petStyleEntries"
                  :key="key"
                  type="button"
                  :class="{ active: wc.state.petStyle === key }"
                  @click="wc.state.petStyle = key"
                >
                  <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
                  <strong>{{ label }}</strong>
                  <small>{{ petStylePreview[key].summary }}</small>
                </button>
              </div>
              <label class="switch-label">
                <span>薪资隐私</span>
                <span class="switch-track" :class="{ on: wc.state.privacyMode }" @click="wc.state.privacyMode = !wc.state.privacyMode">
                  <span class="switch-knob"></span>
                </span>
                <small>{{ wc.state.privacyMode ? '已隐藏具体数额' : '公开显示' }}</small>
              </label>
            </article>
            <article v-show="wc.settingsTab === 'schedule'" class="panel-block form-grid">
              <label>上班时间<input v-model="wc.state.startTime" type="time" /></label>
              <label>下班时间<input v-model="wc.state.endTime" type="time" /></label>
              <label>发薪日<input v-model.number="wc.state.payday" type="number" min="1" max="31" /></label>
            </article>
            <article v-show="wc.settingsTab === 'data'" class="panel-block">
              <h3>数据管理</h3>
              <p>Vue 版继续使用原来的本地存储 key：wageclaw-state-v3。</p>
              <button type="button" class="danger-button" @click="wc.resetAllData">重置所有数据</button>
            </article>
          </section>
        </main>
      </div>
    </template>

    <section v-if="wc.assembly.visible" class="modal-layer wish-assembly-layer">
      <div class="wish-assembly-modal">
        <div class="assembly-glow" aria-hidden="true"></div>
        <div class="macbook-split asset-macbook assembly complete" aria-hidden="true">
          <img :src="activeWishVisual.full" class="macbook-full-render" alt="" draggable="false" />
          <em>ASSEMBLED</em>
        </div>
        <div class="assembly-copy">
          <span class="eyebrow">心愿达成</span>
          <h3>{{ wc.state.wish }} 拼装完成</h3>
          <p>{{ wc.assembly.line }}</p>
        </div>
        <button type="button" class="primary-button full" @click="wc.closeAssembly">收进背包</button>
      </div>
    </section>

    <section v-if="false" class="modal-layer">
      <div class="game-modal duel-modal">
        <header class="panel-header">
          <h3>桌面切磋</h3>
          <button type="button" class="icon-button" @click="wc.duel.visible = false">×</button>
        </header>
        <div class="duel-bars">
          <label><span>你</span><i><b :style="{ width: `${wc.duel.playerHp}%` }"></b></i><em>{{ wc.duel.playerHp }}/100</em></label>
          <label><span>老板怨念体</span><i><b :style="{ width: `${wc.duel.enemyHp}%` }"></b></i><em>{{ wc.duel.enemyHp }}/100</em></label>
          <label><span>爆发</span><i><b :style="{ width: `${wc.duel.energy}%` }"></b></i><em>{{ wc.duel.energy }}/100</em></label>
        </div>
        <div class="duel-stage">
          <div class="fighter player">你</div>
          <div>
            <strong>{{ wc.duel.phase }}</strong>
            <p>{{ wc.duel.status }}</p>
            <em>连击 x{{ wc.duel.combo }}</em>
          </div>
          <div class="fighter enemy"><PetSprite :stage="wc.currentPetStage" mode="mini" /></div>
        </div>
        <div class="skill-grid">
          <button type="button" @click="wc.performDuelSkill('punch')">J 普通拳</button>
          <button type="button" @click="wc.performDuelSkill('kick')">K 反弹脚</button>
          <button type="button" @click="wc.performDuelSkill('uppercut')">I 嘴替暴击</button>
          <button type="button" @click="wc.performDuelSkill('blast')">L 怨气波</button>
          <button type="button" @click="wc.performDuelSkill('heal')">H 安抚回血</button>
          <button type="button" @click="wc.performDuelSkill('guard')">Shift 格挡</button>
        </div>
        <footer class="action-row">
          <button type="button" class="primary-button" @click="wc.startDuel">再开一局</button>
          <button type="button" class="secondary-button" @click="wc.previewOnlineBattle">联机预演</button>
        </footer>
      </div>
    </section>

    <section v-if="wc.gomoku.visible" class="modal-layer">
      <div class="game-modal">
        <header class="panel-header">
          <h3>五子棋</h3>
          <span>胜 {{ wc.gomoku.wins }} / 负 {{ wc.gomoku.losses }} / 平 {{ wc.gomoku.draws }}</span>
          <button type="button" class="icon-button" @click="wc.stopGomoku">×</button>
        </header>
        <div class="gomoku-board">
          <button
            v-for="(_, index) in wc.gomoku.size * wc.gomoku.size"
            :key="index"
            type="button"
            :class="{
              black: wc.gomoku.board[Math.floor(index / wc.gomoku.size)][index % wc.gomoku.size] === 1,
              white: wc.gomoku.board[Math.floor(index / wc.gomoku.size)][index % wc.gomoku.size] === 2
            }"
            @click="wc.handleGomokuMove(Math.floor(index / wc.gomoku.size), index % wc.gomoku.size)"
          ></button>
        </div>
        <p class="game-result">{{ wc.gomoku.result || (wc.gomoku.playerTurn ? "轮到你落子。" : "软团思考中。") }}</p>
        <button type="button" class="primary-button full" @click="wc.startGomoku">重新开始</button>
      </div>
    </section>

    <section v-if="wc.runner.visible" class="modal-layer">
      <div class="game-modal runner-modal">
        <header class="panel-header">
          <h3>怨气闯关</h3>
          <span>得分 {{ wc.runner.score }} · 最佳 {{ wc.runner.best }}</span>
          <button type="button" class="icon-button" @click="wc.stopRunner()">×</button>
        </header>
        <div class="runner-stage" :class="wc.runner.pose">
          <div class="runner-track"></div>
          <div class="runner-player"><PetSprite :stage="wc.currentPetStage" mode="mini" /></div>
          <div class="runner-obstacle">{{ wc.runner.obstacle }}</div>
        </div>
        <p class="game-result">{{ wc.runner.result || "空格/↑ 跳跃，↓ 下蹲，躲避老板的怨念攻击。" }}</p>
        <footer class="action-row">
          <button type="button" class="primary-button" @click="wc.runnerAction('jump')">跳跃</button>
          <button type="button" class="secondary-button" @click="wc.runnerAction('duck')">下蹲</button>
          <button type="button" class="secondary-button" @click="wc.startRunner">重新开始</button>
        </footer>
      </div>
    </section>

    <span
      v-if="activeWishTooltipPart"
      :id="`wish-part-tip-${activeWishTooltipPart.id}`"
      class="wish-part-floating-tooltip visible"
      :class="wishTooltipClass(activeWishTooltipPart.id)"
      :style="wishTooltipStyle(activeWishTooltipPart.id)"
      role="tooltip"
    >
      <strong>{{ activeWishTooltipPart.name }}</strong>
      <em>{{ activeWishTooltipPart.unlocked ? "已点亮" : wc.formatMoney(activeWishTooltipPart.price, 0) }}</em>
      <small>{{ activeWishTooltipPart.narrative }}</small>
    </span>
  </div>
</template>
