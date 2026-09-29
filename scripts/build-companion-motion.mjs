import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const out = 'src/assets/pet-motion';
await mkdir(out, { recursive: true });
const manifest = {};
for (const [name, suffix] of [['capybara', '-v2'], ['capybara-nuzzle', '-nuzzle'], ['capybara-yawn', '-yawn'], ['capybara-ears', '-ears']]) {
  const frames = JSON.parse(await readFile(`design/pet-motion/frames${suffix}.json`, 'utf8'));
  // One fixed registration point and uniform scale for every authored pose.
  manifest[name] = { scale: .8, frames: frames.map(f => ({ ...f, anchor: f.paw + 37.5 })) };
  await sharp(`design/pet-motion/capybara-poses${suffix}.webp`).toFile(`${out}/${name}.webp`);
}
for (const name of ['cat', 'dog', 'cow', 'blob']) {
  const file = `design/pet-motion/companions/${name}-source.png`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const threshold = 40;
  const { width, height } = info, seen = new Uint8Array(width * height), queue = new Uint32Array(width * height), components = [];
  // Generated atlases may have unequal cell padding. Find the 24 opaque characters
  // rather than slice through a paw at a mathematically regular grid boundary.
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < threshold) continue;
    let head = 0, tail = 1, left = width, right = 0, top = height, bottom = 0;
    queue[0] = p; seen[p] = 1;
    while (head < tail) {
      const q = queue[head++], x = q % width, y = Math.floor(q / width);
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || seen[next] || data[next * 4 + 3] < threshold) continue;
        seen[next] = 1; queue[tail++] = next;
      }
    }
    if (tail > width * height / 500) components.push({ left, right, top, bottom, area: tail });
  }
  if (components.length !== 24) throw new Error(`${name}: expected 24 separate sprites, found ${components.length}`);
  components.sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
  const ordered = [];
  for (let row = 0; row < 3; row++) ordered.push(...components.slice(row * 8, row * 8 + 8).sort((a, b) => a.left - b.left));
  const frames = ordered.map(b => {
    const sx = Math.max(0, b.left - 3), sy = Math.max(0, b.top - 3);
    const sw = Math.min(width, b.right + 4) - sx, sh = Math.min(height, b.bottom + 4) - sy;
    const sole = [];
    // A standing cow has two hooves, sometimes a pixel apart vertically. Anchor
    // between BOTH soles, not whichever hoof happens to be the lowest this frame.
    for (let y = b.bottom - (name === 'cow' ? 12 : 2); y <= b.bottom; y++) for (let x = b.left; x <= b.right; x++) if (data[(y * width + x) * 4 + 3] > 128) sole.push(x);
    sole.sort((a, b) => a - b);
    const footCenter = name === 'cow' && sole.length ? (sole[0] + sole[sole.length - 1]) / 2 : sole[Math.floor(sole.length / 2)];
    const anchor = (footCenter ?? (b.left + b.right) / 2) - sx;
    return { sx, sy, sw, sh, anchor, ground: b.bottom - sy };
  });
  // Fit every frame with one shared scale, preserving genuine anatomy changes.
  const extent = Math.max(...frames.map(f => Math.max(f.anchor, f.sw - f.anchor) * 2));
  const scale = Math.min(244 / extent, 242 / Math.max(...frames.map(f => f.sh)));
  manifest[name] = { frames, scale };
  await sharp(file).webp({ quality: 88, alphaQuality: 100 }).toFile(`${out}/${name}.webp`);
  console.log(name, { scale, poses: frames.length });
}
await writeFile(`${out}/frames.json`, JSON.stringify(manifest));
console.log('Exported five characters; original classic forms preserved.');
