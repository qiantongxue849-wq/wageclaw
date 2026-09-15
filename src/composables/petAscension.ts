import type { PetAscensionView, PetStage } from "@/types";

export const PET_ASCENSION_STEP = 520;

const ASCENSION_TITLES = [
  "玄玉星纹",
  "青焰护环",
  "午休结界",
  "反卷法印",
  "回血星冠",
  "下班神谕"
];

export function getPetAscensionView(growth: number, currentStage: PetStage, nextStage: PetStage | null): PetAscensionView {
  if (nextStage || growth <= currentStage.threshold) {
    return {
      active: false,
      tier: 0,
      completedTier: 0,
      tone: 0,
      label: "",
      title: "",
      nextLabel: "",
      overflow: 0,
      progress: 0,
      progressGrowth: 0,
      remaining: 0,
      nextThreshold: nextStage?.threshold ?? currentStage.threshold,
      cycle: PET_ASCENSION_STEP,
      className: ""
    };
  }

  const overflow = Math.max(0, Math.round(growth) - currentStage.threshold);
  const completedTier = Math.floor(overflow / PET_ASCENSION_STEP);
  const tier = completedTier + 1;
  const progressGrowth = overflow % PET_ASCENSION_STEP;
  const progress = progressGrowth / PET_ASCENSION_STEP;
  const tone = (completedTier % ASCENSION_TITLES.length) + 1;
  const title = ASCENSION_TITLES[tone - 1];

  return {
    active: true,
    tier,
    completedTier,
    tone,
    label: `星阶 ${tier}`,
    title,
    nextLabel: `${title} ${tier}`,
    overflow,
    progress,
    progressGrowth,
    remaining: PET_ASCENSION_STEP - progressGrowth,
    nextThreshold: currentStage.threshold + tier * PET_ASCENSION_STEP,
    cycle: PET_ASCENSION_STEP,
    className: `pet-ascended pet-ascension-tone-${tone}`
  };
}
