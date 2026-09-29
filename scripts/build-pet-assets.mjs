// Compile existing sprite sheets without redrawing or changing the original artwork.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
const dir = 'src/assets/pet-light';
await mkdir(dir, { recursive: true });
let source = 0, output = 0;
for (const name of ['capybara-zen', 'lazy-cat', 'lazy-dog', 'honest-cow']) {
  const input = `src/assets/pet-sheets/${name}-sheet.png`;
  const sheet = `${dir}/${name}.webp`;
  await sharp(input).webp({ quality: 86, alphaQuality: 100 }).toFile(sheet);
  await sharp(input).extract({ left: 0, top: 0, width: 288, height: 288 }).resize(96).webp({ quality: 85 }).toFile(`${dir}/${name}-thumb.webp`);
  source += (await stat(input)).size; output += (await stat(sheet)).size;
}
await sharp('src/assets/pet-stages/level-01-mist.webp').resize(96).webp({ quality: 85 }).toFile(`${dir}/rage-blob-thumb.webp`);
console.log(`Four sheets: ${source} -> ${output} bytes; originals retained.`);
