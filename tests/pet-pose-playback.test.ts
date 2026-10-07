import { describe, expect, it } from 'vitest';
import { samplePose } from '../src/lite/petPosePlayback';
import { poseClip } from '../src/lite/petMotionAssets';
import { PET_STYLES } from '../src/lite/model';
import type { PetAction } from '../src/lite/petReactions';

describe('pose continuity', () => {
  it('blends neighbouring poses and joins each boundary without a jump', () => {
    const clip: Array<[number, number]> = [[0, 100], [1, 100], [2, 100]];
    expect(samplePose(clip, 0)).toEqual({ from: 0, to: 1, mix: 0 });
    expect(samplePose(clip, 60)).toEqual({ from: 0, to: 1, mix: .5 });
    expect(samplePose(clip, 99.999).mix).toBeCloseTo(1, 6);
    expect(samplePose(clip, 100)).toEqual({ from: 1, to: 2, mix: 0 });
    expect(samplePose(clip, 500)).toEqual({ from: 2, to: 2, mix: 0 });
  });
  it('keeps the pause at the gesture peak and safely handles delays and duplicate poses', () => {
    const clip: Array<[number, number]> = [[0, 100], [7, 400], [6, 100], [0, 180]];
    expect(samplePose(clip, -100).mix).toBe(0);
    expect(samplePose(clip, 400)).toEqual({ from: 7, to: 6, mix: 0 });
    expect(samplePose(clip, 460).mix).toBe(.5);
    expect(samplePose(clip, 630)).toEqual({ from: 0, to: 0, mix: 0 });
    expect(samplePose([[1, 80], [1, 80]], 40)).toEqual({ from: 1, to: 1, mix: 0 });
    expect(samplePose([], 10)).toEqual({ from: 0, to: 0, mix: 0 });
  });
  it('retains valid poses and an exact neutral ending for all five pets and ten appearances', () => {
    const actions: PetAction[] = ['play', 'stretch', 'sleep', 'notice', 'celebrate'];
    for (const style of PET_STYLES) for (let stage = 1; stage <= 10; stage++) for (const action of actions) {
      const clip = poseClip(style, action, stage), total = clip.reduce((sum, [, duration]) => sum + duration, 0);
      for (let time = 0; time <= total; time += 17) {
        const { from, to, mix } = samplePose(clip, time);
        expect(clip.some(([frame]) => frame === from)).toBe(true);
        expect(clip.some(([frame]) => frame === to)).toBe(true);
        expect(mix).toBeGreaterThanOrEqual(0); expect(mix).toBeLessThanOrEqual(1);
      }
      expect(samplePose(clip, total + 100)).toEqual({ from: 0, to: 0, mix: 0 });
    }
  });
});
