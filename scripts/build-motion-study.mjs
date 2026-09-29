// Export generated animation poses. No synthetic deformation or in-between frames.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const action = process.argv.find(arg => arg.startsWith('--action='))?.split('=')[1];
if (action && !['yawn', 'nuzzle', 'ears'].includes(action)) throw new Error('Unknown action');
const refined = process.argv.includes('--refined') || Boolean(action);
const suffix = action ? `-${action}` : refined ? '-v2' : '';
const source = `design/pet-motion/capybara-source${suffix}.png`;
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const frames = [];
for (let n = 0; n < 16; n++) {
  const col = n % 4, row = Math.floor(n / 4);
  const sx = Math.round(col * info.width / 4), sy = Math.round(row * info.height / 4);
  const sw = Math.round((col + 1) * info.width / 4) - sx, sh = Math.round((row + 1) * info.height / 4) - sy;
  let minX = sw, maxX = 0, maxY = 0;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    if (data[((y + sy) * info.width + x + sx) * 4 + 3] > 32) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  }
  const sole = [];
  for (let y = maxY - 2; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    if (data[((y + sy) * info.width + x + sx) * 4 + 3] > 128) sole.push(x);
  }
  sole.sort((a, b) => a - b);
  const paw = sole[Math.floor(sole.length / 2)] ?? (minX + maxX) / 2;
  frames.push({ sx, sy, sw, sh, center: (minX + maxX) / 2, ground: maxY, ...(refined ? { paw } : {}) });
}
await sharp(source).webp({ quality: 90, alphaQuality: 100 }).toFile(`design/pet-motion/capybara-poses${suffix}.webp`);
await writeFile(`design/pet-motion/frames${suffix}.json`, JSON.stringify(frames, null, 2));
console.log('Exported 16 authored poses and ground alignment metadata.');
