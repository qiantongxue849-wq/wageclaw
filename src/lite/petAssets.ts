import { PET_STAGE_COUNT, type PetStyle } from './model';

export { PET_STAGE_COUNT };
/** 合图每格的边长，与桌宠 canvas 的绘制尺寸一致。 */
const SHEET_CELL = 288;

/** 四个形象各有 2880×288 的十阶合图，按格裁切。 */
const sheets: Partial<Record<PetStyle, () => Promise<string>>> = {
  capybaraZen: () => import('../assets/pet-sheets/capybara-zen-sheet.png').then(asset => asset.default),
  lazyCat: () => import('../assets/pet-sheets/lazy-cat-sheet.png').then(asset => asset.default),
  lazyDog: () => import('../assets/pet-sheets/lazy-dog-sheet.png').then(asset => asset.default),
  honestCow: () => import('../assets/pet-sheets/honest-cow-sheet.png').then(asset => asset.default)
};

/** 怨气团是十张独立图。 */
const rageBlobStages: Array<() => Promise<string>> = [
  () => import('../assets/pet-stages/level-01-mist.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-02-cable.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-03-horn.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-04-claw.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-05-crown.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-06-array.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-07-halo.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-08-thunder.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-09-jade.webp').then(asset => asset.default),
  () => import('../assets/pet-stages/level-10-immortal.webp').then(asset => asset.default)
];

export interface PetFrame {
  url: string;
  /** 合图内的横向起点；独立图为 0。 */
  sx: number;
  /** 源图边长；独立图留空，绘制时取 naturalWidth。 */
  cell?: number;
}

export function clampStage(stage: number): number {
  if (!Number.isFinite(stage)) return 1;
  return Math.max(1, Math.min(PET_STAGE_COUNT, Math.round(stage)));
}

export async function petFrame(style: PetStyle, stage: number): Promise<PetFrame> {
  const level = clampStage(stage);
  const sheet = sheets[style];
  if (sheet) return { url: await sheet(), sx: (level - 1) * SHEET_CELL, cell: SHEET_CELL };
  const loader = rageBlobStages[level - 1] || rageBlobStages[0];
  return { url: await loader(), sx: 0 };
}

/** 某个形象的全部十阶地址，用于切换后静默预热。 */
export async function petStyleUrls(style: PetStyle): Promise<string[]> {
  const sheet = sheets[style];
  if (sheet) return [await sheet()];
  return Promise.all(rageBlobStages.map(load => load()));
}
