import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
await mkdir('qa-shots/motion-refined', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1060, height: 1060 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/design/pet-motion/');
  await page.waitForFunction(() => !globalThis.document.querySelector('#play').disabled);
  const bitmaps = [], hashes = [], grounds = [], paws = [];
  for (let n = 0; n < 16; n++) {
    const sample = await page.evaluate(index => {
      const slider = globalThis.document.querySelector('#frame'); slider.value = index; slider.dispatchEvent(new Event('input'));
      const el = globalThis.document.querySelector('#pet');
      const data = el.getContext('2d').getImageData(0, 0, 288, 288).data;
      let hash = 0, ground = 0; const sole = [];
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 32) { hash = (hash * 31 + data[i] * 7 + data[i + 1] + i) >>> 0; ground = Math.floor(i / 4 / 288); }
      for (let y = ground - 2; y <= ground; y++) for (let x = 0; x < 288; x++) if (data[(y * 288 + x) * 4 + 3] > 128) sole.push(x);
      sole.sort((a, b) => a - b);
      return { hash, ground, paw: sole[Math.floor(sole.length / 2)], png: el.toDataURL().split(',')[1], transform: globalThis.getComputedStyle(el).transform };
    }, n);
    bitmaps.push(await sharp(Buffer.from(sample.png, 'base64')).raw().toBuffer());
    hashes.push(sample.hash); grounds.push(sample.ground); paws.push(sample.paw);
    assert.equal(sample.transform, 'none');
  }
  assert.equal(new Set(hashes).size, 16);
  assert.ok(Math.max(...grounds) - Math.min(...grounds) <= 2);
  assert.ok(Math.max(...paws) - Math.min(...paws) <= 3, `Foot drift: ${paws}`);
  const clip = await page.evaluate(() => globalThis.motionStudyClip);
  const sequence = [...clip, [0, 1400]];
  await sharp(Buffer.concat(sequence.map(([index]) => bitmaps[index])), { raw: { width: 288, height: 288 * sequence.length, channels: 4, pageHeight: 288 } }).gif({ loop: 0, delay: sequence.map(([, duration]) => duration), dither: 0 }).toFile('design/pet-motion/capybara-motion-v2.gif');
  await page.getByRole('button', { name: '回到静止', exact: true }).click();
  const rest = await page.locator('#pet').evaluate(el => el.toDataURL());
  await page.screenshot({ path: 'qa-shots/motion-refined/comparison.png', fullPage: true });
  await page.getByRole('button', { name: '同时播放，对比动作', exact: true }).click();
  await page.waitForTimeout(2750);
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  assert.equal(await page.locator('#pet').evaluate(el => el.toDataURL()), rest);
  await page.getByRole('button', { name: '眨眨眼', exact: true }).click();
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  await page.getByRole('button', { name: '轻轻回应你', exact: true }).click();
  await page.getByRole('button', { name: '回到静止', exact: true }).click();
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  await page.getByRole('button', { name: '在深色背景下看看', exact: true }).click();
  await page.screenshot({ path: 'qa-shots/motion-refined/dark.png', fullPage: true });
  await page.getByRole('button', { name: '切换到桌宠实际大小', exact: true }).click();
  assert.equal((await page.locator('#pet').boundingBox()).width, 128);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '轻轻回应你', exact: true }).click();
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  assert.deepEqual(errors, []);
  console.log('Refined motion passed: distinct poses, feet anchored within 3px, no whole-image transforms, exact rest, finite response/blink, stop, dark/128px/mobile and reduced motion.');
  console.log({ grounds, paws, duration: clip.reduce((sum, [, ms]) => sum + ms, 0) });
} finally { await browser.close(); }
