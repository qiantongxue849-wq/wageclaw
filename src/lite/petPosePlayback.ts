import type { PoseClip } from './petMotionAssets';

/** Blend only the end of a pose's hold, retaining deliberate pauses at each gesture's peak. */
export function samplePose(clip: PoseClip, time: number) {
  let start = 0;
  const elapsed = Math.max(0, time);
  for (let n = 0; n < clip.length; n++) {
    const [from, duration] = clip[n], end = start + duration;
    if (elapsed < end || n === clip.length - 1) {
      const to = clip[n + 1]?.[0] ?? from;
      const window = Math.min(duration, 80);
      const progress = from === to ? 0 : Math.max(0, Math.min(1, (elapsed - end + window) / window));
      return { from, to, mix: progress * progress * (3 - 2 * progress) };
    }
    start = end;
  }
  return { from: 0, to: 0, mix: 0 };
}
