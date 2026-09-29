import type { PetFrame } from './petAssets';

/** Some old sheets bleed a detached piece of a neighbour into a cell's side. */
export function clearSheetEdgeFragments(data: Uint8ClampedArray, width: number, height: number) {
  const seen = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  const margin = Math.ceil(width / 5);
  const visit = (start: number) => {
    if (seen[start] || data[start * 4 + 3] === 0) return;
    let head = 0, tail = 1, minX = width, maxX = 0;
    queue[0] = start; seen[start] = 1;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || seen[next] || data[next * 4 + 3] === 0) continue;
        seen[next] = 1; queue[tail++] = next;
      }
    }
    // Never trim the central character or a connected limb. Only a detached,
    // narrow piece wholly in the outer strip (old sheets include cell padding).
    if ((maxX < margin || minX >= width - margin) && maxX - minX < width / 20 && tail < width * height * .025) {
      for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0;
    }
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < margin; x++) { visit(y * width + x); visit(y * width + width - 1 - x); }
}
export function drawPetFrame(ctx: CanvasRenderingContext2D, image: HTMLImageElement, frame: PetFrame) {
  const source = frame.cell || image.naturalWidth;
  ctx.clearRect(0, 0, 288, 288);
  ctx.drawImage(image, frame.sx, 0, source, source, 0, 0, 288, 288);
  const pixels = ctx.getImageData(0, 0, 288, 288);
  if (frame.cell) { clearSheetEdgeFragments(pixels.data, 288, 288); ctx.putImageData(pixels, 0, 0); }
  return pixels.data;
}
