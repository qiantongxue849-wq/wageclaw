import type { PetStyle } from './model';

export const transitionNames: Record<PetStyle, string> = {
  capybaraZen: 'float', lazyCat: 'curl', lazyDog: 'hop', honestCow: 'nod', rageBlob: 'mist'
};
export function transitionPose(style: PetStyle, progress: number, entering: boolean) {
  const t = Math.max(0, Math.min(1, progress)), ease = t*t*(3-2*t);
  const amount = entering ? 1 - ease : ease;
  if (amount === 0) return { x: 0, y: 0, angle: 0, scale: 1 };
  switch (style) {
    case 'capybaraZen': return { x: 0, y: (entering ? 8 : -7)*amount, angle: 0, scale: 1 - .025*amount };
    case 'lazyCat': return { x: (entering ? -7 : 7)*amount, y: 3*amount, angle: (entering ? -.065 : .065)*amount, scale: 1 - .035*amount };
    case 'lazyDog': return { x: (entering ? 5 : -5)*amount, y: -13*Math.sin(Math.PI*t), angle: (entering ? .025 : -.025)*amount, scale: 1 - .02*amount };
    case 'honestCow': return { x: 0, y: 5*amount, angle: (entering ? -.025 : .025)*amount, scale: 1 - .045*amount };
    case 'rageBlob': return { x: (entering ? 4 : -4)*Math.sin(Math.PI*t), y: (entering ? 10 : -10)*amount, angle: (entering ? .045 : -.045)*amount, scale: 1 - .07*amount };
  }
}
export function drawPetTransition(ctx: CanvasRenderingContext2D, before: HTMLCanvasElement, after: HTMLCanvasElement, from: PetStyle, to: PetStyle, progress: number) {
  const t = Math.max(0, Math.min(1, progress)), blend = t*t*(3-2*t);
  ctx.clearRect(0, 0, 288, 288);
  for (const [image, style, entering, alpha] of [[before, from, false, 1-blend], [after, to, true, blend]] as const) {
    const pose = transitionPose(style, t, entering);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (style === 'rageBlob') ctx.filter = `blur(${(entering ? 1-blend : blend)*2.5}px)`;
    ctx.translate(144 + pose.x, 256 + pose.y); ctx.rotate(pose.angle); ctx.scale(pose.scale, pose.scale);
    ctx.drawImage(image, -144, -256); ctx.restore();
  }
}
