import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
await mkdir('qa-shots/motion-study', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/design/pet-motion/index-v1.html');
  await page.waitForFunction(() => !globalThis.document.querySelector('#play').disabled);
  await page.screenshot({ path: 'qa-shots/motion-study/comparison.png', fullPage: true });
  const hashes = [], floors = [], bitmaps = [];
  for (let n = 0; n < 16; n++) {
    const sample = await page.evaluate(index => {
      const slider = globalThis.document.querySelector('#frame'); slider.value = index; slider.dispatchEvent(new Event('input'));
      const canvas = globalThis.document.querySelector('#pet');
      const data = canvas.getContext('2d').getImageData(0, 0, 288, 288).data;
      let hash = 0, ground = 0;
      for (let i = 0; i < data.length; i += 4) { if (data[i + 3] > 32) { hash = (hash * 31 + data[i] * 7 + data[i + 1] + i) >>> 0; ground = Math.floor(i / 4 / 288); } }
      return { hash, ground, transform: globalThis.getComputedStyle(canvas).transform };
    }, n);
    const png = await page.locator('#pet').evaluate(el => el.toDataURL().split(',')[1]);
    bitmaps.push(await sharp(Buffer.from(png, 'base64')).raw().toBuffer());
    hashes.push(sample.hash); floors.push(sample.ground); assert.equal(sample.transform, 'none');
    if ([0, 3, 6, 9, 15].includes(n)) await page.locator('#pet').screenshot({ path: `qa-shots/motion-study/frame-${n}.png` });
  }
  const delays = [100,60,60,140,100,100,160,55,90,60,100,80,100,100,100,100,1300];
  await sharp(Buffer.concat([...bitmaps, bitmaps[0]]), { raw: { width: 288, height: 288 * 17, channels: 4, pageHeight: 288 } }).gif({ loop: 0, delay: delays, dither: 0 }).toFile('design/pet-motion/capybara-motion-study.gif');
  assert.equal(new Set(hashes).size, 16, 'Different drawn poses must change actual pixels');
  assert.ok(Math.max(...floors) - Math.min(...floors) <= 2, 'Ground must remain aligned');
  await page.getByRole('button', { name: '同时播放，对比动作' }).click();
  await page.waitForTimeout(2200);
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().frame), 0);
  await page.getByRole('button', { name: '播放眨眼与转头', exact: true }).click();
  await page.waitForTimeout(2100);
  await context.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:5174/design/pet-motion/index-v1.html');
  await reduced.waitForFunction(() => !globalThis.document.querySelector('#play').disabled);
  await reduced.getByRole('button', { name: '播放眨眼与转头', exact: true }).click();
  assert.equal(await reduced.evaluate(() => globalThis.motionStudyState().playing), false);
  assert.deepEqual(errors, []);
  console.log('16 distinct poses, fixed ground, no canvas transforms, finite playback, exact rest reset and reduced motion passed.');
} finally { await browser.close(); }
