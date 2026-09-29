// Export generated drawings only. This script never fabricates poses or deforms art.
import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
const source = 'design/pet-motion/stages';
const destination = 'src/assets/pet-motion/stages';
await mkdir(destination, { recursive: true });
const layouts = JSON.parse(await readFile(`${source}/layouts.json`, 'utf8'));
// Generators do not guarantee perfectly equal gutters. Locate transparent
// valleys around the expected grid lines instead of cutting through a paw.
function cuts(length, count, sums) {
  const result = [0], step = length / count;
  for (let n = 1; n < count; n++) {
    const expected = n * step, lo = Math.ceil(expected-step*.48), hi = Math.floor(expected+step*.48);
    let best = lo;
    for (let p = lo; p <= hi; p++) if (sums[p] < sums[best] || (sums[p] === sums[best] && Math.abs(p-expected) < Math.abs(best-expected))) best = p;
    let left = best, right = best;
    while (left > lo && sums[left-1] === sums[best]) left--;
    while (right < hi && sums[right+1] === sums[best]) right++;
    result.push(Math.round((left+right)/2));
  }
  return [...result, length];
}
function registration(data, width, height) {
  const levels = new Uint32Array(height);
  let total = 0, left = width, right = 0, top = height, bottom = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y*width+x)*4+3] >= 40) {
    levels[y]++; total++;
    left = Math.min(left,x); right = Math.max(right,x); top = Math.min(top,y); bottom = Math.max(bottom,y);
  }
  // Ignore the last few wisp/shadow pixels when finding the stable body base.
  let count = 0, ground = bottom;
  for (let y = 0; y < height; y++) { count += levels[y]; if (count >= total*.995) { ground = y; break; } }
  let weight = 0, moment = 0;
  for (let y = Math.round(ground-(ground-top)*.18); y <= ground; y++) for (let x = left; x <= right; x++) {
    const alpha = data[(y*width+x)*4+3]; if (alpha < 40) continue;
    moment += x*alpha; weight += alpha;
  }
  return { anchor: moment/weight, ground, left, right, top, bottom };
}
const manifest = {};
const failures = [];
const files = await readdir(source);
for (const [name, layout] of Object.entries(layouts)) {
  try {
  const file = `${name}-source.png`;
  if (!files.includes(file)) continue;
  const image = await (layout.crop ? sharp(`${source}/${file}`).extract(layout.crop) : sharp(`${source}/${file}`)).png().toBuffer();
  const { width, height } = await sharp(image).metadata();
  if (layout.columns * layout.rows !== 24) throw new Error(`${name}: invalid 24-frame layout`);
  const pixels = await sharp(image).ensureAlpha().raw().toBuffer();
  const rowSums = new Uint32Array(height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (pixels[(y*width+x)*4+3] >= 40) rowSums[y]++;
  const ys = cuts(height, layout.rows, rowSums), rows = [];
  for (let row = 0; row < layout.rows; row++) {
    const sums = new Uint32Array(width);
    for (let y = ys[row]; y < ys[row+1]; y++) for (let x = 0; x < width; x++) if (pixels[(y*width+x)*4+3] >= 40) sums[x]++;
    rows.push(cuts(width, layout.columns, sums));
  }
  const frames = [], extracted = [];
  for (let n = 0; n < 24; n++) {
    const row = Math.floor(n/layout.columns), column = n%layout.columns;
    let sx = rows[row][column], ex = rows[row][column+1], sy = ys[row], ey = ys[row+1];
    // Wisps on adjacent columns can overlap vertically without the drawings
    // touching. Refine each cell's gutters locally, keeping the full artwork.
    for (let pass = 0; pass < 2; pass++) {
      const localY = new Uint32Array(height);
      for (let y = 0; y < height; y++) for (let x = sx; x < ex; x++) if (pixels[(y*width+x)*4+3] >= 40) localY[y]++;
      const yCuts = cuts(height, layout.rows, localY); sy = yCuts[row]; ey = yCuts[row+1];
      const localX = new Uint32Array(width);
      for (let y = sy; y < ey; y++) for (let x = 0; x < width; x++) if (pixels[(y*width+x)*4+3] >= 40) localX[x]++;
      const xCuts = cuts(width, layout.columns, localX); sx = xCuts[column]; ex = xCuts[column+1];
    }
    const cellW = ex-sx, cellH = ey-sy;
    const input = await sharp(image).extract({ left: sx, top: sy, width: cellW, height: cellH }).ensureAlpha().raw().toBuffer();
    let left = cellW, top = cellH, right = 0, bottom = 0, edge = 0;
    for (let y = 0; y < cellH; y++) for (let x = 0; x < cellW; x++) {
      if (input[(y * cellW + x) * 4 + 3] < 40) continue;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      // Inspect the actual cut line, not the pixels beside it: a one-pixel
      // transparent gutter still contains the entire drawing.
      if ((x === 0 || y === 0) && input[(y * cellW + x) * 4 + 3] >= 40) edge++;
    }
    for (let y = sy; y < ey; y++) if (ex < width && pixels[(y*width+ex)*4+3] >= 40) edge++;
    for (let x = sx; x < ex; x++) if (ey < height && pixels[(ey*width+x)*4+3] >= 40) edge++;
    if (ey === height) for (let x = sx; x < ex; x++) if (pixels[((height-1)*width+x)*4+3] >= 40) edge++;
    if (ex === width) for (let y = sy; y < ey; y++) if (pixels[(y*width+width-1)*4+3] >= 40) edge++;
    if (left > right) throw new Error(`${name}/${n}: empty frame`);
    if (edge > 2) throw new Error(`${name}/${n}: art touches cell boundary (${edge} pixels; cell ${sx},${sy},${cellW},${cellH}; bounds ${left},${top},${right},${bottom}); regenerate with wider gutters`);
    const { anchor, ground } = registration(input, cellW, cellH);
    frames.push({ sx, sy, sw: cellW, sh: cellH, anchor, ground });
    extracted.push({ left, top, right, bottom });
  }
  const reference = await sharp(`${source}/references/${name}.png`).resize(288,288).ensureAlpha().raw().toBuffer();
  const original = registration(reference,288,288), neutral = extracted[0];
  const originX = original.anchor, originY = original.ground;
  const desired = (original.ground-original.top)/(frames[0].ground-neutral.top);
  const scale = Math.min(desired, ...frames.flatMap((f,n) => {
    const b = extracted[n];
    return [(originX-4)/(f.anchor-b.left),(284-originX)/(b.right-f.anchor),(originY-4)/(f.ground-b.top), b.bottom>f.ground ? (284-originY)/(b.bottom-f.ground) : Infinity];
  }));
  await sharp(image).webp({ quality: 90, alphaQuality: 100 }).toFile(`${destination}/${name}.webp`);
  manifest[name] = { frames, scale, originX, originY };
  console.log(`${name}: 24 actual drawings exported`);
  } catch (error) { failures.push(String(error)); }
}
await writeFile(`${destination}/frames.json`, JSON.stringify(manifest));
console.log(`${Object.keys(manifest).length}/45 stage atlases exported. Missing assets are not replaced by procedural motion.`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
