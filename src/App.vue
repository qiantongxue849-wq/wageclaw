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
import headerProgressArt from "@/assets/ui-art/header-progress.png";
import headerSettingsArt from "@/assets/ui-art/header-settings.png";
import headerSupplyArt from "@/assets/ui-art/header-supply.png";
import headerPetArt from "@/assets/ui-art/header-pet.png";
import profileArcadeArt from "@/assets/profile-avatars/profile-arcade.png";
import profileCitrusArt from "@/assets/profile-avatars/profile-citrus.png";
import profileForestArt from "@/assets/profile-avatars/profile-forest.png";
import profileInkArt from "@/assets/profile-avatars/profile-ink.png";
import profileSakuraArt from "@/assets/profile-avatars/profile-sakura.png";
import feedMuffinArt from "@/assets/pet-ui/feed-muffin.png";
import feedStrawberryArt from "@/assets/pet-ui/feed-strawberry.png";
import adrenalineArt from "@/assets/supplies/adrenaline.png";
import bloodTonicArt from "@/assets/supplies/blood-tonic.png";
import bpPillArt from "@/assets/supplies/bp-pill.png";
import cakeSliceArt from "@/assets/supplies/cake-slice.png";
import chocolateBarArt from "@/assets/supplies/chocolate-bar.png";
import dumplingArt from "@/assets/supplies/dumpling.png";
import emergencyKitArt from "@/assets/supplies/emergency-kit.png";
import eyeDropArt from "@/assets/supplies/eye-drop.png";
import friedChickenArt from "@/assets/supplies/fried-chicken.png";
import heartPillArt from "@/assets/supplies/heart-pill.png";
import hotpotArt from "@/assets/supplies/hotpot.png";
import iceCreamArt from "@/assets/supplies/ice-cream.png";
import massageGunArt from "@/assets/supplies/massage-gun.png";
import milkTeaArt from "@/assets/supplies/milk-tea.png";
import noodleSoupArt from "@/assets/supplies/noodle-soup.png";
import oxygenMaskArt from "@/assets/supplies/oxygen-mask.png";
import riceBallArt from "@/assets/supplies/rice-ball.png";
import sedativeArt from "@/assets/supplies/sedative.png";
import steamedBunArt from "@/assets/supplies/steamed-bun.png";
import steamedFishArt from "@/assets/supplies/steamed-fish.png";
import stomachPillArt from "@/assets/supplies/stomach-pill.png";
import sushiPlatterArt from "@/assets/supplies/sushi-platter.png";
import vitaminArt from "@/assets/supplies/vitamin.png";
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
import aiGlassesBatteryArt from "@/assets/wishlist/ai-glasses-battery.png";
import aiGlassesCameraMicArt from "@/assets/wishlist/ai-glasses-camera-mic.png";
import aiGlassesCaseArt from "@/assets/wishlist/ai-glasses-case.png";
import aiGlassesFrameArt from "@/assets/wishlist/ai-glasses-frame.png";
import aiGlassesFullArt from "@/assets/wishlist/ai-glasses-full.png";
import aiGlassesLensesArt from "@/assets/wishlist/ai-glasses-lenses.png";
import aiGlassesSpeakerArt from "@/assets/wishlist/ai-glasses-speaker.png";
import handheldConsoleBatteryArt from "@/assets/wishlist/handheld-console-battery.png";
import handheldConsoleChipArt from "@/assets/wishlist/handheld-console-chip.png";
import handheldConsoleControllersArt from "@/assets/wishlist/handheld-console-controllers.png";
import handheldConsoleDockArt from "@/assets/wishlist/handheld-console-dock.png";
import handheldConsoleFullArt from "@/assets/wishlist/handheld-console-full.png";
import handheldConsolePouchArt from "@/assets/wishlist/handheld-console-pouch.png";
import handheldConsoleScreenArt from "@/assets/wishlist/handheld-console-screen.png";
import concertWeekendFullArt from "@/assets/wishlist/concert-weekend-full.png";
import concertWeekendHotelArt from "@/assets/wishlist/concert-weekend-hotel.png";
import concertWeekendLightstickArt from "@/assets/wishlist/concert-weekend-lightstick.png";
import concertWeekendMerchArt from "@/assets/wishlist/concert-weekend-merch.png";
import concertWeekendTicketArt from "@/assets/wishlist/concert-weekend-ticket.png";
import concertWeekendTransitArt from "@/assets/wishlist/concert-weekend-transit.png";
import concertWeekendVoucherArt from "@/assets/wishlist/concert-weekend-voucher.png";
import sleepRecoveryBlanketArt from "@/assets/wishlist/sleep-recovery-blanket.png";
import sleepRecoveryDiffuserArt from "@/assets/wishlist/sleep-recovery-diffuser.png";
import sleepRecoveryFullArt from "@/assets/wishlist/sleep-recovery-full.png";
import sleepRecoveryLampArt from "@/assets/wishlist/sleep-recovery-lamp.png";
import sleepRecoveryMaskArt from "@/assets/wishlist/sleep-recovery-mask.png";
import sleepRecoveryPillowArt from "@/assets/wishlist/sleep-recovery-pillow.png";
import sleepRecoveryTrackerArt from "@/assets/wishlist/sleep-recovery-tracker.png";
import toycraftBoardArt from "@/assets/wishlist/toycraft-board.png";
import toycraftCardArt from "@/assets/wishlist/toycraft-card.png";
import toycraftDisplayArt from "@/assets/wishlist/toycraft-display.png";
import toycraftFullArt from "@/assets/wishlist/toycraft-full.png";
import toycraftPlushArt from "@/assets/wishlist/toycraft-plush.png";
import toycraftStandeeArt from "@/assets/wishlist/toycraft-standee.png";
import toycraftStickersArt from "@/assets/wishlist/toycraft-stickers.png";
import type { MallItem, PetStyle, Theme } from "@/types";

const wc = reactive(useWageClaw());
const ledgerDialogOpen = ref(false);
const ledgerMode = ref<"wallet" | "paw">("wallet");
const realizedDialogOpen = ref(false);
const appIconUrl = new URL("../electron/assets/app-icon.png", import.meta.url).href;
const ONBOARDING_WISHES_PER_PAGE = 4;
const onboardingWishPage = ref(0);
const onboardingWishTotalPages = computed(() =>
  Math.max(1, Math.ceil(wc.wishShopItems.length / ONBOARDING_WISHES_PER_PAGE))
);
const onboardingWishCurrentPage = computed(() =>
  Math.min(onboardingWishPage.value, onboardingWishTotalPages.value - 1)
);
const onboardingWishPageItems = computed(() => {
  const start = onboardingWishCurrentPage.value * ONBOARDING_WISHES_PER_PAGE;
  return wc.wishShopItems.slice(start, start + ONBOARDING_WISHES_PER_PAGE);
});

function changeOnboardingWishPage(delta: number) {
  onboardingWishPage.value = Math.min(
    onboardingWishTotalPages.value - 1,
    Math.max(0, onboardingWishCurrentPage.value + delta)
  );
}

function focusNumberField(event: Event) {
  const host = event.currentTarget as HTMLElement | null;
  const input = host instanceof HTMLInputElement ? host : host?.querySelector<HTMLInputElement>('input[type="number"]');
  input?.focus({ preventScroll: true });
}

function openTimeFieldPicker(event: Event) {
  const host = event.currentTarget as HTMLElement | null;
  const input = host instanceof HTMLInputElement ? host : host?.querySelector<HTMLInputElement>('input[type="time"]');
  if (!input) return;
  input.focus({ preventScroll: true });
  try {
    (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  } catch {
    // Older Electron builds only allow native pickers during direct pointer activation.
  }
}

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
  },
  ai_glasses_commute_kit: {
    full: aiGlassesFullArt,
    parts: {
      ai_glasses_frame: aiGlassesFrameArt,
      ai_glasses_lenses: aiGlassesLensesArt,
      ai_glasses_camera_mic: aiGlassesCameraMicArt,
      ai_glasses_speaker: aiGlassesSpeakerArt,
      ai_glasses_battery: aiGlassesBatteryArt,
      ai_glasses_case: aiGlassesCaseArt
    }
  },
  handheld_console_kit: {
    full: handheldConsoleFullArt,
    parts: {
      handheld_console_screen: handheldConsoleScreenArt,
      handheld_console_controllers: handheldConsoleControllersArt,
      handheld_console_chip: handheldConsoleChipArt,
      handheld_console_battery: handheldConsoleBatteryArt,
      handheld_console_dock: handheldConsoleDockArt,
      handheld_console_pouch: handheldConsolePouchArt
    }
  },
  concert_weekend_pass: {
    full: concertWeekendFullArt,
    parts: {
      concert_weekend_ticket: concertWeekendTicketArt,
      concert_weekend_transit: concertWeekendTransitArt,
      concert_weekend_hotel: concertWeekendHotelArt,
      concert_weekend_lightstick: concertWeekendLightstickArt,
      concert_weekend_merch: concertWeekendMerchArt,
      concert_weekend_voucher: concertWeekendVoucherArt
    }
  },
  sleep_recovery_kit: {
    full: sleepRecoveryFullArt,
    parts: {
      sleep_recovery_pillow: sleepRecoveryPillowArt,
      sleep_recovery_blanket: sleepRecoveryBlanketArt,
      sleep_recovery_mask: sleepRecoveryMaskArt,
      sleep_recovery_lamp: sleepRecoveryLampArt,
      sleep_recovery_diffuser: sleepRecoveryDiffuserArt,
      sleep_recovery_tracker: sleepRecoveryTrackerArt
    }
  },
  toycraft_mood_box: {
    full: toycraftFullArt,
    parts: {
      toycraft_plush: toycraftPlushArt,
      toycraft_board: toycraftBoardArt,
      toycraft_display: toycraftDisplayArt,
      toycraft_stickers: toycraftStickersArt,
      toycraft_standee: toycraftStandeeArt,
      toycraft_card: toycraftCardArt
    }
  }
};

const supplyVisuals: Record<string, string> = {
  noodle_soup: noodleSoupArt,
  cake_slice: cakeSliceArt,
  steamed_bun: steamedBunArt,
  dumpling: dumplingArt,
  hotpot: hotpotArt,
  milk_tea: milkTeaArt,
  fried_chicken: friedChickenArt,
  rice_ball: riceBallArt,
  ice_cream: iceCreamArt,
  chocolate_bar: chocolateBarArt,
  sushi_platter: sushiPlatterArt,
  steamed_fish: steamedFishArt,
  bp_pill: bpPillArt,
  heart_pill: heartPillArt,
  adrenaline: adrenalineArt,
  sedative: sedativeArt,
  stomach_pill: stomachPillArt,
  oxygen_mask: oxygenMaskArt,
  vitamin: vitaminArt,
  eye_drop: eyeDropArt,
  blood_tonic: bloodTonicArt,
  emergency_kit: emergencyKitArt,
  massage_gun: massageGunArt
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

function getSupplyVisual(itemId: string) {
  return supplyVisuals[itemId] || "";
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
const profileAvatarCopy: Record<Theme, { title: string; status: string; detail: string; image: string }> = {
  forest: {
    title: "林间工位牛马",
    status: "靠窗摸鱼中",
    detail: "一边装作认真盯屏，一边把下班倒计时藏进树影里。",
    image: profileForestArt
  },
  arcade: {
    title: "夜班低电量工位人",
    status: "电量告急中",
    detail: "霓虹还亮着，脑袋电池已经红了，代码和咖啡一起续命。",
    image: profileArcadeArt
  },
  sakura: {
    title: "便当困猫打工人",
    status: "午休失守中",
    detail: "便当摆好了，眼皮也快关机了，下午的待办还在排队。",
    image: profileSakuraArt
  },
  ink: {
    title: "公文墨团打工人",
    status: "纸海漂流中",
    detail: "公文堆到桌边，怨气凝成墨团，只剩一点体面撑着工牌。",
    image: profileInkArt
  },
  citrus: {
    title: "汽水卡皮打工人",
    status: "气泡续航中",
    detail: "靠一口柑橘汽水把魂拽回工位，表情平静但班味很重。",
    image: profileCitrusArt
  }
};
const profileAvatar = computed(() => profileAvatarCopy[wc.state.theme]);
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

const petStatusBadges = computed(() => {
  const calm = wc.state.pet.bloodPressure < 130 ? "血压稳定" : "需要降压";
  const mood = wc.state.pet.affection >= 60 ? "无忧无虑" : wc.state.pet.touchMood;
  return [calm, wc.petAffinity.label, mood];
});
const petMotionAction = computed(() =>
  wc.petReaction === "play" || wc.petReaction === "sleep" ? wc.petReaction : "idle"
);
const homePetSupplyPicker = ref<"food" | "medicine" | null>(null);
const homePetFoodItems = computed(() =>
  wc.inventoryItems.filter((entry) => Boolean(entry.item.petBoost) && entry.item.category === "food")
);
const homePetMedicineItems = computed(() =>
  wc.inventoryItems.filter((entry) => Boolean(entry.item.petBoost) && entry.item.category === "medicine")
);
const homePetSupplyEntries = computed(() =>
  homePetSupplyPicker.value === "medicine" ? homePetMedicineItems.value : homePetFoodItems.value
);
const homePetSupplyTitle = computed(() => (homePetSupplyPicker.value === "medicine" ? "背包药品" : "背包食物"));
const homePetSupplyEmptyText = computed(() =>
  homePetSupplyPicker.value === "medicine" ? "背包里暂时没有药品。" : "背包里暂时没有食物。"
);

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

function useHomePetSupply(item: MallItem) {
  wc.useItem(item);
  homePetSupplyPicker.value = null;
}

function openHomePetSupplyShop() {
  homePetSupplyPicker.value = null;
  openSupplyShop();
}
const petAttributeRows = computed(() => wc.petAttributes);

const nextPetStageDistanceLabel = computed(() => (wc.nextPetStage ? `距 ${wc.nextPetStage.name}` : "已达顶阶"));
const activeWorkEventChoices = computed(() => wc.activeWorkEvent?.choices || []);

const inventoryTotal = computed(
  () => wc.inventoryItems.reduce((total, entry) => total + entry.quantity, 0) + wc.earnedGoods.length
);
const transactionLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedTransactions.items.length));
const pawLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedPawLedger.items.length));
const inventoryCategoryCount = computed(() => wc.inventoryItems.length);
const shopPhysicalCount = computed(() => wc.mallItems.filter((item) => item.kind === "physical").length);
const shopSupplyCount = computed(() => wc.mallItems.filter((item) => item.kind !== "physical").length);
const activeMallFilterLabel = computed(
  () => mallFilters.find((filter) => filter.key === wc.state.mallFilter)?.label || "全部"
);
const wishShopEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedWishShopItems.items.length));
const supplyShopEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedSupplyShopItems.items.length));
const inventoryEmptySlotCount = computed(() => Math.max(0, wc.MALL_PAGE_SIZE - wc.pagedInventoryItems.items.length));
const supplyFilters = computed(() => mallFilters.filter((filter) => filter.key !== "real"));
const supplyHubTabs = computed(
  () =>
    [
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
    ] as const
);
const dailyRagePercent = computed(() => Math.min(100, Math.round((wc.state.dailyRage.value / 500) * 100)));
const monthlyProgressPercent = computed(() => Math.min(100, Math.round(wc.salaryCycleProgress.percent * 100)));
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

function openLedgerDialog() {
  ledgerDialogOpen.value = true;
}

function closeLedgerDialog() {
  ledgerDialogOpen.value = false;
}
</script>

<template>
  <div class="app-root" :class="rootClass" :data-theme="wc.state.theme" :data-pet-style="wc.state.petStyle">
    <div class="surface-grid" aria-hidden="true" />

    <section v-if="wc.notification" class="toast" role="status">
      {{ wc.notification }}
    </section>

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
        <div v-if="wc.summonedBubble" class="pet-bubble">
          {{ wc.summonedBubble }}
        </div>
        <div v-if="wc.petDialog" class="pet-dialog" v-html="wc.petDialog" />
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
            <button type="button" @click="wc.selectPetInteractionMode('normal')">陪伴模式</button>
            <button type="button" @click="wc.selectPetInteractionMode('rage')">怨气收集</button>
          </div>
        </div>
        <span v-if="wc.petReaction === 'hammer'" class="pet-hammer-visual" aria-hidden="true">
          <span class="pet-hammer-handle" />
          <span class="pet-hammer-head" />
          <span class="pet-hammer-band" />
          <span class="pet-hammer-charm" />
          <span class="pet-hammer-trail pet-hammer-trail-a" />
          <span class="pet-hammer-trail pet-hammer-trail-b" />
        </span>
        <span v-if="wc.petReaction === 'hammer'" class="pet-impact-burst" aria-hidden="true">
          <span class="pet-impact-ring" />
          <span class="pet-impact-chip pet-impact-chip-a" />
          <span class="pet-impact-chip pet-impact-chip-b" />
          <span class="pet-impact-chip pet-impact-chip-c" />
        </span>
        <PetSprite :stage="wc.currentPetStage" mode="compact" :action="petMotionAction" :motion-key="wc.petMotionKey" />
      </div>
    </template>

    <div v-if="wc.goldRush" class="gold-rush" aria-hidden="true">
      <span
        v-for="n in 12"
        :key="n"
        class="gold-coin"
        :style="{ animationDelay: `${(n - 1) * 0.06}s`, left: `${40 + Math.random() * 20}%` }"
        >🪙</span
      >
    </div>

    <section v-if="wc.viewMode === 'pet'" class="summoned-pet embedded">
      <div v-if="wc.summonedBubble" class="pet-bubble">
        {{ wc.summonedBubble }}
      </div>
      <button
        type="button"
        class="pet-avatar-button"
        @click="wc.handlePetTouch('head')"
        @dblclick="wc.openScreenFromPet('pet')"
      >
        <PetSprite
          :stage="wc.currentPetStage"
          :mode="wc.viewMode === 'pet' ? 'hero' : 'compact'"
          :action="petMotionAction"
          :motion-key="wc.petMotionKey"
        />
      </button>
      <div class="pet-identity">
        <strong>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</strong>
        <small>{{ wc.currentPetStage.title }}</small>
        <em>{{ wc.state.pet.touchMood }} · {{ wc.formatPawCoins(wc.state.pawBalance) }}</em>
      </div>
      <p v-if="wc.viewMode === 'pet'" class="pet-desktop-line">
        {{ wc.currentPetStage.line }}
      </p>
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
            <button class="window-tool pet-tool" title="桌宠" @click="wc.setActiveScreen('pet')" />
            <button class="title-btn" title="最小化" @click="wc.minimizeMainWindow()">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect y="4.5" width="10" height="1" fill="currentColor" />
              </svg>
            </button>
            <button class="title-btn" title="最大化" @click="wc.maximizeMainWindow()">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2" />
              </svg>
            </button>
            <button class="title-btn title-btn-close" title="关闭" @click="wc.closeMainWindow()">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.4" />
                <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </button>
          </div>
        </div>
        <section v-if="!wc.state.onboardingDone" class="modal-layer onboarding-layer" aria-modal="true" role="dialog">
          <div class="onboarding-modal">
            <header>
              <span class="eyebrow">首次设置</span>
              <h2>先把你的下班雷达校准好</h2>
              <p>新安装不会带任何示例数据。设置上下班时间、月薪和一个心愿后，工资进度才会开始记录。</p>
            </header>
            <div class="onboarding-grid">
              <section class="onboarding-form form-grid settings-form-grid">
                <label class="number-field" @pointerdown.stop="focusNumberField"
                  >月薪<input v-model.number="wc.state.salary" type="number" min="1" placeholder="例如 12000"
                /></label>
                <label class="time-field" @pointerdown.stop="openTimeFieldPicker"
                  >上班时间<input v-model="wc.state.startTime" type="time"
                /></label>
                <label class="time-field" @pointerdown.stop="openTimeFieldPicker"
                  >下班时间<input v-model="wc.state.endTime" type="time"
                /></label>
                <label class="number-field" @pointerdown.stop="focusNumberField"
                  >发薪日<input v-model.number="wc.state.payday" type="number" min="1" max="31"
                /></label>
              </section>
              <section class="onboarding-wishes" aria-label="选择心愿">
                <header>
                  <strong>选择一个心愿</strong>
                  <span>{{ wc.activeWishItem ? wc.formatMoney(wc.activeWishItem.price, 0) : "还没选择" }}</span>
                </header>
                <div class="onboarding-wish-grid">
                  <button
                    v-for="item in onboardingWishPageItems"
                    :key="`onboarding-wish-${item.id}`"
                    type="button"
                    :class="{ active: wc.state.activeWishId === item.id }"
                    @click="wc.state.activeWishId = item.id"
                  >
                    <img :src="getWishVisual(item.id).full" alt="" draggable="false" />
                    <span>{{ item.name }}</span>
                    <small>{{ wc.formatMoney(item.price, 0) }}</small>
                  </button>
                </div>
                <div class="onboarding-wish-pager" aria-label="心愿分页">
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="onboardingWishCurrentPage === 0"
                    @click="changeOnboardingWishPage(-1)"
                  >
                    上一页
                  </button>
                  <span>{{ onboardingWishCurrentPage + 1 }} / {{ onboardingWishTotalPages }}</span>
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="onboardingWishCurrentPage >= onboardingWishTotalPages - 1"
                    @click="changeOnboardingWishPage(1)"
                  >
                    下一页
                  </button>
                </div>
              </section>
            </div>
            <footer>
              <p v-if="!wc.hasValidWorkTime">请确认下班时间晚于上班时间。</p>
              <p v-else-if="wc.state.salary <= 0">请填写月薪。</p>
              <p v-else-if="!wc.activeWishItem">请选择一个心愿。</p>
              <p v-else>准备好了，今天的进度会从空账本开始。</p>
              <button
                type="button"
                class="primary-button"
                :disabled="!wc.isProfileReady"
                @click="wc.completeOnboarding"
              >
                开始使用
              </button>
            </footer>
          </div>
        </section>
        <aside class="sidebar">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">
              <img :src="appIconUrl" alt="" draggable="false" />
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
              <i><b :style="{ width: `${dailyRagePercent}%` }" /></i>
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
                <i class="nav-icon" :class="`nav-${navIconMap[item.key]}`" aria-hidden="true" />
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
              <h1>{{ wc.activeScreen === "converter" ? `晚上好，${wc.state.nickname}` : activeTitle }}</h1>
              <p v-if="wc.activeScreen === 'mall'">工资买心愿，爪币养桌宠，背包只放补给。</p>
              <p v-else>
                {{ screenMoodLine }}
              </p>
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
              <article class="salary-overview-card">
                <header class="salary-overview-balance">
                  <div class="salary-overview-worker-art" aria-hidden="true">
                    <img :src="profileAvatar.image" alt="" draggable="false" />
                  </div>
                  <div class="salary-overview-title">
                    <span class="salary-overview-label">
                      <i class="overview-icon calendar-icon" aria-hidden="true" />
                      工资余额
                    </span>
                    <h2>{{ wc.formatBalance(wc.walletCoins, 2) }}</h2>
                  </div>
                  <div class="salary-overview-chip">
                    <i class="overview-icon coin-icon" aria-hidden="true" />
                    <div>
                      <span>爪币余额</span>
                      <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                    </div>
                  </div>
                </header>

                <section class="salary-overview-progress" aria-label="本轮发工资进度">
                  <header>
                    <div>
                      <span>
                        <i class="overview-icon calendar-icon" aria-hidden="true" />
                        本轮发工资进度
                        <em>?</em>
                      </span>
                      <small>{{ wc.salaryCycleProgress.startLabel }} - {{ wc.salaryCycleProgress.endLabel }}</small>
                    </div>
                    <strong>{{ monthlyProgressPercent }}<small>%</small></strong>
                  </header>
                  <div class="salary-overview-meter">
                    <i><b :style="{ width: `${monthlyProgressPercent}%` }" /></i>
                    <div class="salary-overview-scale">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <p>
                    {{ wc.formatMoney(wc.salaryCycleProgress.accumulated, 2) }} /
                    {{ wc.formatMoney(wc.state.salary, 2) }}
                  </p>
                </section>

                <footer class="salary-overview-stats">
                  <div class="salary-overview-stat">
                    <i class="overview-icon calendar-icon" aria-hidden="true" />
                    <div>
                      <span>今日已领</span>
                      <strong>{{ wc.formatBalance(wc.todayClaimedSalary) }}</strong>
                    </div>
                  </div>
                  <div class="salary-overview-stat">
                    <i class="overview-icon coin-icon" aria-hidden="true" />
                    <div>
                      <span>今日爪币</span>
                      <strong>{{ wc.formatPawCoins(wc.pawTodayEarned) }}</strong>
                    </div>
                  </div>
                  <button type="button" class="salary-overview-claim" @click="wc.claimDailyWallet">
                    <i class="gift-icon" aria-hidden="true"><b /><em /></i>
                    领取
                  </button>
                </footer>
              </article>
              <article class="home-pet-status-card" :style="wc.petStageStyle()" aria-label="桌宠属性">
                <header class="home-pet-status-head">
                  <div>
                    <span>桌宠属性</span>
                    <h2>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</h2>
                  </div>
                  <button type="button" class="home-pet-summon-chip" @click="wc.setPetSummoned()">
                    {{ wc.state.pet.summoned ? "已在桌面" : "召唤" }}
                  </button>
                </header>

                <div class="home-pet-status-body">
                  <section class="home-pet-portrait" :class="wc.petReaction" aria-label="当前桌宠形象">
                    <div class="home-pet-portrait-glow" aria-hidden="true" />
                    <PetSprite
                      :stage="wc.currentPetStage"
                      mode="hero"
                      :action="petMotionAction"
                      :motion-key="wc.petMotionKey"
                    />
                    <small>{{ wc.currentPetStage.title }}</small>
                    <div class="home-pet-status-orbit" aria-label="桌宠状态">
                      <span v-for="badge in petStatusBadges" :key="`home-pet-badge-${badge}`">{{ badge }}</span>
                    </div>
                  </section>

                  <section class="home-pet-attrs" aria-label="基础属性">
                    <div
                      v-for="row in petAttributeRows"
                      :key="`home-pet-${row.label}`"
                      class="pet-attribute-row"
                      :style="{ '--attribute-color': row.color }"
                    >
                      <span class="pet-attribute-icon">{{ row.icon }}</span>
                      <strong>{{ row.label }}</strong>
                      <i><b :style="{ width: `${row.percent}%` }" /></i>
                      <em>{{ row.unit ? `${row.value}${row.unit}` : `${row.value}/${row.max}` }}</em>
                    </div>
                  </section>
                </div>

                <footer class="home-pet-card-footer">
                  <div class="home-pet-actions" aria-label="桌宠互动">
                    <button
                      type="button"
                      :class="{ active: homePetSupplyPicker === 'food' }"
                      @click="toggleHomePetSupplyPicker('food')"
                    >
                      <span><img :src="feedMuffinArt" alt="" draggable="false" /></span>
                      喂食
                    </button>
                    <button
                      type="button"
                      :class="{ active: homePetSupplyPicker === 'medicine' }"
                      @click="toggleHomePetSupplyPicker('medicine')"
                    >
                      <span><img :src="bpPillArt" alt="" draggable="false" /></span>
                      喂药
                    </button>
                    <button type="button" @click="playWithHomePet">
                      <span><img :src="feedStrawberryArt" alt="" draggable="false" /></span>
                      玩耍
                    </button>
                    <button type="button" @click="napWithHomePet">
                      <span><img :src="sedativeArt" alt="" draggable="false" /></span>
                      小睡
                    </button>
                  </div>
                </footer>

                <section v-if="homePetSupplyPicker" class="home-pet-supply-popover" aria-live="polite">
                  <header>
                    <strong>{{ homePetSupplyTitle }}</strong>
                    <button type="button" aria-label="关闭背包小框" @click="homePetSupplyPicker = null" />
                  </header>
                  <div v-if="homePetSupplyEntries.length" class="home-pet-supply-list">
                    <button
                      v-for="entry in homePetSupplyEntries"
                      :key="`home-pet-supply-${entry.item.id}`"
                      type="button"
                      @click="useHomePetSupply(entry.item)"
                    >
                      <span class="home-pet-supply-icon">
                        <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
                      </span>
                      <span>
                        <strong>{{ entry.item.name }}</strong>
                        <small>{{ wc.formatPetBoost(entry.item.petBoost) || entry.item.tag }}</small>
                      </span>
                      <em>x{{ entry.quantity }}</em>
                    </button>
                  </div>
                  <div v-else class="home-pet-supply-empty">
                    <p>{{ homePetSupplyEmptyText }}</p>
                    <button type="button" @click="openHomePetSupplyShop">去补给仓</button>
                  </div>
                </section>
              </article>
            </section>

            <section class="two-column home-bottom-row">
              <article class="panel-block wish-workbench-panel">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">实体心愿拆分台</span>
                    <h3>{{ wc.state.wish }}</h3>
                  </div>
                  <strong>{{ wc.wishCollected ? "已入背包" : `${wc.formatMoney(wc.wishRemaining)} 待点亮` }}</strong>
                </header>
                <div class="segmented wish-workbench-tabs">
                  <button type="button" :class="{ active: wc.accountTab === 'split' }" @click="wc.accountTab = 'split'">
                    当前拆分
                  </button>
                  <button type="button" @click="realizedDialogOpen = true">
                    已实现 <em>{{ wc.earnedGoods.length }}</em>
                  </button>
                </div>
                <div
                  class="wish-progress"
                  :style="{ '--wish-progress': `${Math.round(wc.wishProgress * 100)}%` }"
                  aria-label="实体心愿点亮进度"
                >
                  <i :style="{ width: `${wc.wishProgress * 100}%` }" aria-hidden="true" />
                  <span class="bar-label">{{ Math.round(wc.wishProgress * 100) }}%</span>
                </div>
                <div class="wish-workbench-body">
                  <div
                    class="macbook-split asset-macbook"
                    :class="{ complete: wc.wishReady }"
                    :aria-label="`${wc.state.wish} 零件点亮图`"
                    role="group"
                  >
                    <img
                      v-if="wc.wishReady"
                      :src="activeWishVisual.full"
                      class="macbook-full-render"
                      alt=""
                      draggable="false"
                    />
                    <button
                      v-for="part in wishParts"
                      v-else
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
                      <img
                        :src="part.image"
                        :class="['mac-art-part', { on: part.unlocked }]"
                        alt=""
                        draggable="false"
                      />
                    </button>
                    <em>{{ wc.wishReady ? "READY TO ASSEMBLE" : "2D EXPLODED VIEW" }}</em>
                  </div>
                  <button
                    v-if="wc.wishReady"
                    type="button"
                    class="primary-button full wish-assemble-button"
                    @click="wc.claimWishReward"
                  >
                    {{ wc.wishCollected ? "重播拼装鼓励" : "开始零件拼装" }}
                  </button>
                </div>
              </article>

              <article
                class="panel-block ledger-summary-card"
                role="button"
                tabindex="0"
                @click="openLedgerDialog"
                @keydown.enter.prevent="openLedgerDialog"
                @keydown.space.prevent="openLedgerDialog"
              >
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
                    <strong :class="wc.monthlyStats.net >= 0 ? 'plus' : 'minus'">{{
                      wc.formatMoney(wc.monthlyStats.net)
                    }}</strong>
                  </article>
                </div>
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
                  <h3>{{ ledgerMode === "wallet" ? "工资账本" : "爪币账本" }}</h3>
                </div>
                <span
                  >{{
                    ledgerMode === "wallet" ? wc.pagedTransactions.totalItems : wc.pagedPawLedger.totalItems
                  }}
                  笔</span
                >
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
                  <strong :class="wc.monthlyPawStats.net >= 0 ? 'plus' : 'minus'">{{
                    formatPawLedgerAmount(wc.monthlyPawStats.net)
                  }}</strong>
                </article>
              </div>
              <div v-if="ledgerMode === 'wallet'" class="list-stack ledger-modal-list">
                <article v-for="item in wc.pagedTransactions.items" :key="item.id" class="list-item">
                  <div class="badge">
                    {{ wc.transactionCategories[item.category].icon }}
                  </div>
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
                />
              </div>
              <div v-else class="list-stack ledger-modal-list paw-ledger-list">
                <article v-for="item in wc.pagedPawLedger.items" :key="item.id" class="list-item">
                  <div class="badge paw-badge">
                    {{ pawBucketLabels[item.bucket] }}
                  </div>
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
                />
              </div>
              <footer class="pager">
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', -1)">
                  上一页
                </button>
                <button v-else type="button" @click="wc.setPage('pawLedger', -1)">上一页</button>
                <span v-if="ledgerMode === 'wallet'"
                  >{{ wc.pagedTransactions.current }} / {{ wc.pagedTransactions.totalPages }} ·
                  {{ pageLabels.transactions }}</span
                >
                <span v-else
                  >{{ wc.pagedPawLedger.current }} / {{ wc.pagedPawLedger.totalPages }} ·
                  {{ pageLabels.pawLedger }}</span
                >
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', 1)">
                  下一页
                </button>
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
                  <i class="wallet-emblem" aria-hidden="true" />
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
                        <i :style="{ width: `${wc.state.activeWishId === item.id ? wc.wishProgress * 100 : 0}%` }" />
                      </div>
                    </div>
                    <footer class="wish-shop-foot">
                      <div class="wish-shop-state">
                        <span>{{
                          wc.state.activeWishId === item.id
                            ? `${Math.round(wc.wishProgress * 100)}% 点亮中`
                            : "可设为实体心愿"
                        }}</span>
                        <em class="wish-shop-price">{{ wc.formatMoney(item.price, 0) }}</em>
                      </div>
                      <button
                        type="button"
                        class="primary-button"
                        @click="
                          wc.state.activeWishId === item.id ? wc.setActiveScreen('converter') : wc.setWishItem(item)
                        "
                      >
                        {{ wc.state.activeWishId === item.id ? "查看拆分" : "设为心愿" }}
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
                  />
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
                    :class="{
                      active:
                        wc.state.mallFilter === filter.key || (filter.key === 'all' && wc.state.mallFilter === 'real')
                    }"
                    @click="wc.setMallFilter(filter.key)"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </header>
              <div class="supply-market-grid">
                <article v-for="item in wc.pagedSupplyShopItems.items" :key="item.id" class="supply-shop-card">
                  <div class="supply-item-icon">
                    <img :src="getSupplyVisual(item.id)" :alt="item.name" draggable="false" />
                  </div>
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
                />
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
                  <article
                    v-for="entry in wc.pagedInventoryItems.items"
                    :key="entry.item.id"
                    class="inventory-slot-card"
                  >
                    <div class="inventory-slot-icon">
                      <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
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
                  />
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
            <article
              class="home-pet-status-card pet-page-status-card"
              :style="wc.petStageStyle()"
              aria-label="桌宠属性"
            >
              <header class="home-pet-status-head">
                <div>
                  <span>桌宠属性</span>
                  <h2>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</h2>
                </div>
                <button type="button" class="home-pet-summon-chip" @click="wc.setPetSummoned()">
                  {{ wc.state.pet.summoned ? "已在桌面" : "召唤" }}
                </button>
              </header>

              <div class="home-pet-status-body">
                <section class="home-pet-portrait" :class="wc.petReaction" aria-label="当前桌宠形象">
                  <div class="home-pet-portrait-glow" aria-hidden="true" />
                  <PetSprite
                    :stage="wc.currentPetStage"
                    mode="hero"
                    :action="petMotionAction"
                    :motion-key="wc.petMotionKey"
                  />
                  <small>{{ wc.currentPetStage.title }}</small>
                  <div class="home-pet-status-orbit" aria-label="桌宠状态">
                    <span v-for="badge in petStatusBadges" :key="`pet-page-badge-${badge}`">{{ badge }}</span>
                  </div>
                </section>

                <section class="home-pet-attrs" aria-label="基础属性">
                  <div
                    v-for="row in petAttributeRows"
                    :key="`pet-page-${row.label}`"
                    class="pet-attribute-row"
                    :style="{ '--attribute-color': row.color }"
                  >
                    <span class="pet-attribute-icon">{{ row.icon }}</span>
                    <strong>{{ row.label }}</strong>
                    <i><b :style="{ width: `${row.percent}%` }" /></i>
                    <em>{{ row.unit ? `${row.value}${row.unit}` : `${row.value}/${row.max}` }}</em>
                  </div>
                </section>
              </div>

              <footer class="home-pet-card-footer">
                <div class="home-pet-actions" aria-label="桌宠互动">
                  <button
                    type="button"
                    :class="{ active: homePetSupplyPicker === 'food' }"
                    @click="toggleHomePetSupplyPicker('food')"
                  >
                    <span><img :src="feedMuffinArt" alt="" draggable="false" /></span>
                    喂食
                  </button>
                  <button
                    type="button"
                    :class="{ active: homePetSupplyPicker === 'medicine' }"
                    @click="toggleHomePetSupplyPicker('medicine')"
                  >
                    <span><img :src="bpPillArt" alt="" draggable="false" /></span>
                    喂药
                  </button>
                  <button type="button" @click="playWithHomePet">
                    <span><img :src="feedStrawberryArt" alt="" draggable="false" /></span>
                    玩耍
                  </button>
                  <button type="button" @click="napWithHomePet">
                    <span><img :src="sedativeArt" alt="" draggable="false" /></span>
                    小睡
                  </button>
                </div>
              </footer>

              <section v-if="homePetSupplyPicker" class="home-pet-supply-popover" aria-live="polite">
                <header>
                  <strong>{{ homePetSupplyTitle }}</strong>
                  <button type="button" aria-label="关闭背包小框" @click="homePetSupplyPicker = null" />
                </header>
                <div v-if="homePetSupplyEntries.length" class="home-pet-supply-list">
                  <button
                    v-for="entry in homePetSupplyEntries"
                    :key="`pet-page-supply-${entry.item.id}`"
                    type="button"
                    @click="useHomePetSupply(entry.item)"
                  >
                    <span class="home-pet-supply-icon">
                      <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
                    </span>
                    <span>
                      <strong>{{ entry.item.name }}</strong>
                      <small>{{ wc.formatPetBoost(entry.item.petBoost) || entry.item.tag }}</small>
                    </span>
                    <em>x{{ entry.quantity }}</em>
                  </button>
                </div>
                <div v-else class="home-pet-supply-empty">
                  <p>{{ homePetSupplyEmptyText }}</p>
                  <button type="button" @click="openHomePetSupplyShop">去补给仓</button>
                </div>
              </section>
            </article>

            <section class="pet-workbench-grid">
              <article class="panel-block pet-refine-lab pet-refine-lab--dialog">
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
                  />
                  <div class="refine-meter">
                    <span>炉温</span>
                    <i><b :style="{ width: `${Math.min(100, 34 + wc.state.dailyRage.value / 10)}%` }" /></i>
                    <strong>{{ wc.state.pet.rage >= 500 ? "满溢" : "可炼化" }}</strong>
                  </div>
                  <div class="action-row pet-refine-actions">
                    <button type="button" class="primary-button" @click="wc.refineRageFromRant">开始炼化</button>
                    <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
                  </div>
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
                      :class="{
                        active: wc.state.pet.growth >= stage.threshold,
                        current: wc.currentPetStage.id === stage.id
                      }"
                    />
                  </div>
                </div>
                <div class="button-stack pet-hero-actions">
                  <button type="button" class="primary-button" @click="wc.setPetSummoned()">
                    {{ wc.state.pet.summoned ? "收回软团" : "召唤软团" }}
                  </button>
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
                  <i><b :style="{ height: `${wc.petProgress * 100}%` }" /></i>
                  <PetSprite :stage="wc.currentPetStage" mode="mini" />
                </div>
                <div v-if="wc.state.pet.summoned" class="pet-tooltips">
                  <span class="pet-tip" :style="{ color: wc.petSatietyLabel.color }">{{
                    wc.petSatietyLabel.label
                  }}</span>
                  <span class="pet-tip" :style="{ color: wc.petPressureLabel.color }">{{
                    wc.petPressureLabel.label
                  }}</span>
                </div>
                <span>{{ wc.currentPetStage.title }}</span>
              </div>
            </article>

            <section class="pet-vital-strip">
              <article class="pet-vital-card vital-paw">
                <span>爪币小金库</span>
                <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                <i><b :style="{ width: `${Math.round(wc.pawAttendanceProgress * 100)}%` }" /></i>
              </article>
              <article class="pet-vital-card vital-rage">
                <span>怨气储能</span>
                <strong>{{ wc.formatRage(wc.state.pet.rage) }}</strong>
                <i><b :style="{ width: `${Math.min(100, wc.state.pet.rage / 5)}%` }" /></i>
              </article>
              <article class="pet-vital-card">
                <span>气质</span>
                <strong>{{ wc.petAffinity.label }}</strong>
                <i><b :style="{ width: `${Math.min(100, wc.state.pet.light)}%` }" /></i>
              </article>
              <article class="pet-vital-card">
                <span>法力池</span>
                <strong>{{ Math.round(wc.state.pet.mana) }} / {{ wc.petManaMax }}</strong>
                <i><b :style="{ width: `${Math.min(100, (wc.state.pet.mana / wc.petManaMax) * 100)}%` }" /></i>
              </article>
              <article class="pet-vital-card">
                <span>战绩</span>
                <strong>{{ wc.state.pet.battleWins }} 胜 / {{ wc.state.pet.battleLosses }} 负</strong>
                <i
                  ><b
                    :style="{
                      width: `${Math.min(100, (wc.state.pet.battleWins / Math.max(1, wc.state.pet.battleWins + wc.state.pet.battleLosses)) * 100)}%`
                    }"
                /></i>
              </article>
              <article class="pet-vital-card warning" :style="{ '--vital-color': wc.petSatietyLabel.color }">
                <span>饱食</span>
                <strong>{{ wc.petSatietyLabel.label }}</strong>
                <i
                  ><b :style="{ width: `${Math.round(wc.state.pet.satiety)}%`, background: wc.petSatietyLabel.color }"
                /></i>
              </article>
              <article class="pet-vital-card warning" :style="{ '--vital-color': wc.petPressureLabel.color }">
                <span>血压</span>
                <strong>{{ wc.petPressureLabel.label }} · {{ Math.round(wc.state.pet.bloodPressure) }}mmHg</strong>
                <i><b :style="{ width: `${wc.petBloodPressurePercent}%`, background: wc.petPressureLabel.color }" /></i>
              </article>
            </section>

            <div class="segmented wide-tabs">
              <button type="button" :class="{ active: wc.petTab === 'status' }" @click="wc.petTab = 'status'">
                总览
              </button>
              <button type="button" :class="{ active: wc.petTab === 'refine' }" @click="wc.petTab = 'refine'">
                炼化
              </button>
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
                  <i :style="{ width: `${wc.petProgress * 100}%` }" />
                  <span class="bar-label">{{ Math.round(wc.petProgress * 100) }}%</span>
                </div>
                <div class="stat-bars pet-stat-bars">
                  <label
                    ><span>心情</span
                    ><i
                      ><b :style="{ width: `${wc.state.pet.affection}%` }" /><span class="bar-label"
                        >{{ wc.state.pet.affection }}%</span
                      ></i
                    ></label
                  >
                  <label
                    ><span>饱食</span
                    ><i
                      ><b :style="{ width: `${wc.state.pet.satiety}%`, background: wc.petSatietyLabel.color }" /><span
                        class="bar-label"
                        >{{ Math.round(wc.state.pet.satiety) }}%</span
                      ></i
                    ></label
                  >
                  <label
                    ><span>血压</span
                    ><i
                      ><b
                        :style="{ width: `${wc.petBloodPressurePercent}%`, background: wc.petPressureLabel.color }"
                      /><span class="bar-label">{{ Math.round(wc.state.pet.bloodPressure) }}mmHg</span></i
                    ></label
                  >
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
                  <i><b :style="{ width: `${Math.min(100, wc.state.pet.touchHeat)}%` }" /></i>
                </div>
                <div class="touch-grid pet-touch-grid">
                  <button v-for="[key, touch] in touchEntries" :key="key" type="button" @click="wc.handlePetTouch(key)">
                    <span class="touch-glyph">{{ touch.label.charAt(0) }}</span>
                    <strong>{{ touch.label }}</strong>
                    <small
                      >{{ touch.mood }} · 热度 +{{ touch.heat
                      }}{{
                        touch.bloodPressure
                          ? ` · 血压 ${touch.bloodPressure > 0 ? "+" : ""}${touch.bloodPressure}mmHg`
                          : ""
                      }}
                      · 爪币 +{{ touch.nourish }}</small
                    >
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
                  <span>{{ wc.activeWorkEvent?.tone || "出勤中" }}</span>
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
                  :class="{
                    current: wc.currentPetStage.id === stage.id,
                    locked: wc.state.pet.growth < stage.threshold
                  }"
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
              <textarea
                v-model="wc.rantText"
                rows="8"
                placeholder="例：老板把临时起意说成我的成长机会，还问我为什么不够主动。"
              />
              <div class="action-row">
                <button type="button" class="primary-button" @click="wc.refineRageFromRant">炼化为怨气</button>
              </div>
            </section>

            <section v-show="wc.petTab === 'feed'" class="panel-block">
              <header class="panel-header">
                <h3>可投喂供品</h3>
                <span>{{ wc.pagedPetSupplyItems.totalItems }} 类</span>
              </header>
              <div class="list-stack empty-ok">
                <article v-for="entry in wc.pagedPetSupplyItems.items" :key="entry.item.id" class="list-item">
                  <div class="badge supply-list-thumb">
                    <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
                  </div>
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
                <p>
                  {{ wc.themeLabels[wc.state.theme] }} · {{ wc.petStyleLabels[wc.state.petStyle] }} ·
                  {{ wc.modeLabels[wc.state.countMode] }} · {{ wc.state.startTime }} - {{ wc.state.endTime }}
                </p>
              </div>
            </article>
            <div class="segmented wide-tabs">
              <button
                type="button"
                :class="{ active: wc.settingsTab === 'profile' }"
                @click="wc.settingsTab = 'profile'"
              >
                资料
              </button>
              <button
                type="button"
                :class="{ active: wc.settingsTab === 'appearance' }"
                @click="wc.settingsTab = 'appearance'"
              >
                外观
              </button>
              <button type="button" :class="{ active: wc.settingsTab === 'data' }" @click="wc.settingsTab = 'data'">
                数据
              </button>
            </div>
            <article v-show="wc.settingsTab === 'profile'" class="panel-block profile-layout-panel">
              <div class="profile-settings-column form-grid settings-form-grid settings-profile-grid">
                <label>称呼<input v-model="wc.state.nickname" type="text" /></label>
                <label>月薪<input v-model.number="wc.state.salary" type="number" min="1" /></label>
                <label
                  >倒计时口径
                  <select v-model="wc.state.countMode">
                    <option v-for="[key, label] in modeEntries" :key="key" :value="key">{{ label }}</option>
                  </select>
                </label>
                <label>今日被折磨分钟<input v-model.number="wc.state.rageMinutes" type="number" min="0" /></label>
                <label class="time-field" @pointerdown="openTimeFieldPicker"
                  >上班时间<input v-model="wc.state.startTime" type="time"
                /></label>
                <label class="time-field" @pointerdown="openTimeFieldPicker"
                  >下班时间<input v-model="wc.state.endTime" type="time"
                /></label>
                <label>发薪日<input v-model.number="wc.state.payday" type="number" min="1" max="31" /></label>
                <button
                  type="button"
                  class="profile-switch-button"
                  :class="{ active: wc.state.privacyMode }"
                  :aria-pressed="wc.state.privacyMode"
                  @click="wc.state.privacyMode = !wc.state.privacyMode"
                >
                  <span>
                    <strong>薪资隐私</strong>
                    <small>{{ wc.state.privacyMode ? "已隐藏具体数额" : "公开显示" }}</small>
                  </span>
                  <span class="switch-track" :class="{ on: wc.state.privacyMode }">
                    <span class="switch-knob" />
                  </span>
                </button>
              </div>
              <aside class="profile-avatar-panel" aria-label="用户形象">
                <header>
                  <span>用户形象</span>
                  <strong>{{ profileAvatar.title }}</strong>
                  <small>{{ profileAvatar.status }}</small>
                </header>
                <div class="profile-avatar-frame">
                  <img
                    class="profile-avatar-image"
                    :src="profileAvatar.image"
                    :alt="profileAvatar.title"
                    draggable="false"
                  />
                </div>
                <p>{{ profileAvatar.detail }}</p>
                <div class="profile-avatar-meta">
                  <span>{{ wc.themeLabels[wc.state.theme] }}</span>
                  <span>{{ wc.modeLabels[wc.state.countMode] }}</span>
                  <span>{{ wc.state.privacyMode ? "隐私已开" : "金额可见" }}</span>
                </div>
              </aside>
            </article>
            <article v-show="wc.settingsTab === 'appearance'" class="panel-block form-grid">
              <label
                >主题
                <select v-model="wc.state.theme">
                  <option v-for="[key, label] in themeEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <label
                >桌宠系列
                <select v-model="wc.state.petStyle">
                  <option v-for="[key, label] in petStyleEntries" :key="key" :value="key">{{ label }}</option>
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
            </article>
            <article v-show="wc.settingsTab === 'data'" class="panel-block data-management-panel">
              <h3>数据管理</h3>
              <p>Vue 版继续使用原来的本地存储 key：wageclaw-state-v3。</p>
              <div class="data-action-list">
                <div class="data-action-row">
                  <div>
                    <span>工资余额</span>
                    <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
                    <small>只清空当前余额，工资流水会保留。</small>
                  </div>
                  <button type="button" class="secondary-button" @click="wc.clearWalletBalance">清除</button>
                </div>
                <div class="data-action-row">
                  <div>
                    <span>爪币余额</span>
                    <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
                    <small>只清空当前余额，爪币账本会保留。</small>
                  </div>
                  <button type="button" class="secondary-button" @click="wc.clearPawBalance">清除</button>
                </div>
              </div>
              <div class="data-danger-row">
                <div>
                  <span>完整重置</span>
                  <small>清除本地存储并恢复默认数据，此操作不可撤销。</small>
                </div>
                <button type="button" class="danger-button" @click="wc.resetAllData">重置所有数据</button>
              </div>
            </article>
          </section>
        </main>
      </div>
    </template>

    <section v-if="wc.assembly.visible" class="modal-layer wish-assembly-layer">
      <div class="wish-assembly-modal">
        <div class="assembly-glow" aria-hidden="true" />
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

    <section
      v-if="realizedDialogOpen"
      class="modal-layer realized-modal-layer"
      @click.self="realizedDialogOpen = false"
    >
      <div class="realized-modal">
        <header class="panel-header realized-modal-header">
          <div>
            <span class="eyebrow">已实现心愿</span>
            <h3>成就陈列</h3>
          </div>
          <button type="button" class="icon-button" aria-label="关闭已实现心愿弹窗" @click="realizedDialogOpen = false">
            ×
          </button>
        </header>
        <div class="realized-gallery realized-modal-list" :class="{ empty: !wc.earnedGoods.length }">
          <template v-if="wc.earnedGoods.length">
            <article
              v-for="good in wc.earnedGoods"
              :key="`converter-realized-${good.id}`"
              class="realized-card realized-modal-card"
            >
              <div class="realized-visual asset-macbook complete" aria-hidden="true">
                <img :src="getWishVisual(good.itemId).full" class="macbook-full-render" alt="" draggable="false" />
              </div>
              <div class="realized-card-copy">
                <strong>{{ good.icon }} {{ good.name }}</strong>
                <small>{{ good.source }} · {{ good.time }} · {{ wc.formatMoney(good.amount) }}</small>
                <p>这件礼物已经从心愿系统毕业，删除后会把对应金额退回工资余额。</p>
                <button
                  type="button"
                  class="danger-button realized-delete-button"
                  @click="wc.deleteEarnedGood(good.id)"
                >
                  删除并退款
                </button>
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
    </section>

    <section v-if="false" class="modal-layer">
      <div class="game-modal duel-modal">
        <header class="panel-header">
          <h3>桌面切磋</h3>
          <button type="button" class="icon-button" @click="wc.duel.visible = false">×</button>
        </header>
        <div class="duel-bars">
          <label
            ><span>你</span><i><b :style="{ width: `${wc.duel.playerHp}%` }" /></i
            ><em>{{ wc.duel.playerHp }}/100</em></label
          >
          <label
            ><span>老板怨念体</span><i><b :style="{ width: `${wc.duel.enemyHp}%` }" /></i
            ><em>{{ wc.duel.enemyHp }}/100</em></label
          >
          <label
            ><span>爆发</span><i><b :style="{ width: `${wc.duel.energy}%` }" /></i
            ><em>{{ wc.duel.energy }}/100</em></label
          >
        </div>
        <div class="duel-stage">
          <div class="fighter player">你</div>
          <div>
            <strong>{{ wc.duel.phase }}</strong>
            <p>{{ wc.duel.status }}</p>
            <em>连击 x{{ wc.duel.combo }}</em>
          </div>
          <div class="fighter enemy">
            <PetSprite :stage="wc.currentPetStage" mode="mini" />
          </div>
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
          />
        </div>
        <p class="game-result">
          {{ wc.gomoku.result || (wc.gomoku.playerTurn ? "轮到你落子。" : "软团思考中。") }}
        </p>
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
          <div class="runner-track" />
          <div class="runner-player">
            <PetSprite :stage="wc.currentPetStage" mode="mini" />
          </div>
          <div class="runner-obstacle">
            {{ wc.runner.obstacle }}
          </div>
        </div>
        <p class="game-result">
          {{ wc.runner.result || "空格/↑ 跳跃，↓ 下蹲，躲避老板的怨念攻击。" }}
        </p>
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
