import { describe, it, expect } from 'vitest';
import { PET_STYLES } from '../src/lite/model';
import { transitionNames, transitionPose } from '../src/lite/petStageMotion';
import { packName, poseClip } from '../src/lite/petMotionAssets';
import type { PetAction } from '../src/lite/petReactions';
import stageMetadata from '../src/assets/pet-motion/stages/frames.json';
import { existsSync } from 'node:fs';
const actions: PetAction[] = ['play', 'notice', 'celebrate', 'stretch', 'sleep'];
describe('authored poses for every pet stage', () => {
  it('selects each level’s own artwork instead of silently falling back to level one', () => {
    for (const style of PET_STYLES) {
      const packs = new Set<string>();
      for (let stage = 2; stage <= 10; stage++) {
        packs.add(packName(style, 'play', stage));
        expect(packName(style, 'play', stage)).not.toBe(packName(style, 'play', 1));
        for (const action of actions) {
          const clip = poseClip(style, action, stage);
          expect(clip[0][0]).toBe(0); expect(clip.at(-1)?.[0]).toBe(0);
          expect(clip.every(([n,ms]) => n >= 0 && n < 24 && ms > 0)).toBe(true);
        }
      }
      expect(packs.size).toBe(9);
    }
  });
  it('keeps level-one action packs and their established sequences', () => {
    expect(packName('capybaraZen', 'play')).toBe('capybara-nuzzle');
    expect(packName('capybaraZen', 'sleep')).toBe('capybara-yawn');
    expect(poseClip('lazyCat', 'notice').some(([n]) => n === 11)).toBe(true);
  });
  it('ships a registered, separate atlas for all 45 higher-level appearances', () => {
    expect(Object.keys(stageMetadata)).toHaveLength(45);
    const packs = stageMetadata as Record<string, { scale: number; frames: Array<{ sx: number; sy: number; sw: number; sh: number; anchor: number; ground: number }> }>;
    for (const style of PET_STYLES) for (let stage = 2; stage <= 10; stage++) {
      const name = packName(style, 'play', stage), pack = packs[name];
      expect(pack, name).toBeDefined();
      expect(existsSync(new URL(`../src/assets/pet-motion/stages/${name}.webp`, import.meta.url))).toBe(true);
      expect(pack.frames).toHaveLength(24);
      expect(new Set(pack.frames.map(f => `${f.sx}:${f.sy}`)).size).toBe(24);
      expect(pack.scale).toBeGreaterThan(0);
      for (const f of pack.frames) {
        expect(f.sw).toBeGreaterThan(0); expect(f.sh).toBeGreaterThan(0);
        expect(f.anchor).toBeGreaterThanOrEqual(0); expect(f.anchor).toBeLessThan(f.sw);
        expect(f.ground).toBeGreaterThan(0); expect(f.ground).toBeLessThan(f.sh);
      }
    }
  });
  it('settles entrances and keeps five distinct transitions', () => {
    expect(new Set(Object.values(transitionNames)).size).toBe(5);
    for (const style of PET_STYLES) expect(transitionPose(style, 1, true)).toEqual({ x: 0, y: 0, angle: 0, scale: 1 });
  });
});
