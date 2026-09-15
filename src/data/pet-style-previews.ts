/** 桌宠风格预览卡：onboarding 选择页与设置页共用。 */
import rageBlobPreview from "@/assets/pet-stages-preview.png";
import capybaraZenPreview from "@/assets/pet-previews/capybara-zen.png";
import lazyCatPreview from "@/assets/pet-previews/lazy-cat.png";
import lazyDogPreview from "@/assets/pet-previews/lazy-dog.png";
import honestCowPreview from "@/assets/pet-previews/honest-cow.png";
import type { PetStyle } from "@/types";

export const petStylePreview = {
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
