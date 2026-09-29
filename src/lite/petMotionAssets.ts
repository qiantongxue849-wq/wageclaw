import type { PetStyle } from './model';
import type { PetAction } from './petReactions';
import metadata from '../assets/pet-motion/frames.json';
import stageMetadata from '../assets/pet-motion/stages/frames.json';
import { clampStage } from './petAssets';

export interface Pose { sx: number; sy: number; sw: number; sh: number; anchor: number; ground: number }
export interface PosePack { image: HTMLImageElement; frames: Pose[]; scale: number; originX?: number; originY?: number }
export type PoseClip = Array<[number, number]>;
const urls = import.meta.glob<string>('../assets/pet-motion/*.webp', { query: '?url', import: 'default' });
const stageUrls = import.meta.glob<string>('../assets/pet-motion/stages/*.webp', { query: '?url', import: 'default' });
const registrations = { ...metadata, ...stageMetadata } as Record<string, Omit<PosePack, 'image'>>;
const names: Record<PetStyle, string> = { capybaraZen: 'capybara', lazyCat: 'cat', lazyDog: 'dog', honestCow: 'cow', rageBlob: 'blob' };
const cache = new Map<string, Promise<PosePack>>();
export function packName(style: PetStyle, action: PetAction, stage = 1) {
  if (clampStage(stage) > 1) return `${names[style]}-${clampStage(stage)}`;
  if (style !== 'capybaraZen') return names[style];
  return action === 'play' ? 'capybara-nuzzle' : action === 'sleep' || action === 'stretch' ? 'capybara-yawn' : action === 'notice' ? 'capybara-ears' : 'capybara';
}
export function loadPosePack(name: string): Promise<PosePack> {
  const saved = cache.get(name);
  if (saved) { cache.delete(name); cache.set(name, saved); return saved; }
  const pending = (async () => {
    const loader = stageUrls[`../assets/pet-motion/stages/${name}.webp`] || urls[`../assets/pet-motion/${name}.webp`];
    if (!loader) throw new Error('Missing motion artwork');
    const image = new Image(); image.src = await loader(); await image.decode();
    const entry = registrations[name];
    if (!entry) throw new Error('Missing pose registration');
    return { image, ...entry };
  })().catch(error => { if (cache.get(name) === pending) cache.delete(name); throw error; });
  cache.set(name, pending);
  // Keep decoded memory bounded when browsing the wardrobe; only three atlases stay cached.
  const oldest = cache.keys().next().value;
  if (cache.size > 3 && oldest) cache.delete(oldest);
  return pending;
}
function arc(base: number, peak: number, hold: number, step = 95): PoseClip {
  const poses: PoseClip = [[0, 120]];
  for (let i = base + 1; i <= base + peak; i++) poses.push([i, i === base + peak ? hold : step]);
  for (let i = base + peak - 1; i > base; i--) poses.push([i, step + 15]);
  poses.push([0, 180]);
  return poses;
}
export function poseClip(style: PetStyle, action: PetAction, stage = 1): PoseClip {
  if (clampStage(stage) > 1) {
    if (action === 'play') return arc(0, 7, 320);
    if (action === 'notice') return arc(8, 3, 280, 110);
    if (action === 'celebrate') return arc(8, 7, 350, 95);
    return arc(16, action === 'sleep' || ((style === 'capybaraZen' && stage === 8) || (style === 'lazyDog' && stage === 9)) ? 5 : 7, 440, 115);
  }
  if (style === 'capybaraZen') {
    if (action === 'play') return arc(0, 7, 380);
    if (action === 'sleep' || action === 'stretch') return arc(0, 8, 420, 110);
    if (action === 'notice') return arc(0, 8, 140, 75);
    return [[0, 140], [1, 75], [2, 90], [3, 170], [4, 110], [5, 130], [6, 320], [5, 130], [4, 120], [3, 130], [2, 95], [1, 80], [0, 180]];
  }
  if (action === 'play') return arc(0, 6, 320);
  if (action === 'notice') return arc(8, 3, 280, 110);
  if (action === 'celebrate') return arc(8, 7, 350, 85);
  return arc(16, 5, 440, 120);
}
