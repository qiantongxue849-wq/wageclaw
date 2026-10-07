import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const directory = path.resolve('electron/assets');
const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
async function buildIcon(name) {
  const source = path.join(directory, `${name}-source.png`);
  await sharp(source).resize(512, 512).png().toFile(path.join(directory, `${name}.png`));
  const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[index].length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += images[index].length;
  });
  await fs.writeFile(path.join(directory, `${name}.ico`), Buffer.concat([header, ...images]));
  console.log(`${name}: PNG 512px, ICO ${sizes.join('/')}`);
}
await buildIcon('app-icon');
await buildIcon('tray-icon');
