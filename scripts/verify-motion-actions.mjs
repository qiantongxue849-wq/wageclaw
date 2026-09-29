import { chromium } from '@playwright/test';
import { mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
await mkdir('qa-shots/motion-actions', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1060, height: 1120 } });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  await page.goto('http://127.0.0.1:5174/design/pet-motion/');
  await page.waitForFunction(() => !globalThis.document.querySelector('#play').disabled);
  assert.ok(!requests.some(url => /poses-(yawn|nuzzle|ears)/.test(url)), 'New packs must be lazy loaded');
  for (const action of ['yawn', 'nuzzle', 'ears']) {
    await page.locator(`[data-action="${action}"]`).click();
    await page.waitForFunction(key => globalThis.motionStudyState().pack === `-${key}`, action);
    const clip = await page.evaluate(() => globalThis.motionStudyClip);
    await page.locator('#stop').click();
    const rest = await page.locator('#pet').evaluate(el => el.toDataURL());
    const bitmaps = [], grounds = [], paws = [];
    for (let n = 0; n < 16; n++) {
      const png = await page.evaluate(index => {
        const slider = globalThis.document.querySelector('#frame');
        slider.value = index; slider.dispatchEvent(new Event('input'));
        return globalThis.document.querySelector('#pet').toDataURL().split(',')[1];
      }, n);
      const raw = await sharp(Buffer.from(png, 'base64')).raw().toBuffer();
      bitmaps.push(raw);
      let ground = 0; const sole = [];
      for (let y = 0; y < 288; y++) for (let x = 0; x < 288; x++) if (raw[(y * 288 + x) * 4 + 3] > 32) ground = y;
      for (let y = ground - 2; y <= ground; y++) for (let x = 0; x < 288; x++) if (raw[(y * 288 + x) * 4 + 3] > 128) sole.push(x);
      sole.sort((a, b) => a - b); grounds.push(ground); paws.push(sole[Math.floor(sole.length / 2)]);
      if (n === 8) await page.screenshot({ path: `qa-shots/motion-actions/${action}.png`, fullPage: true });
    }
    assert.ok(Math.max(...grounds) - Math.min(...grounds) <= 2, `Ground drift: ${action} ${grounds}`);
    assert.ok(Math.max(...paws) - Math.min(...paws) <= 3, `Foot drift: ${action} ${paws}`);
    const sequence = [...clip, [0, 1400]];
    await sharp(Buffer.concat(sequence.map(([n]) => bitmaps[n])), { raw: { width: 288, height: 288 * sequence.length, channels: 4, pageHeight: 288 } }).gif({ loop: 0, delay: sequence.map(([, ms]) => ms), dither: 0 }).toFile(`design/pet-motion/capybara-motion-${action}.gif`);
    await page.locator('#pet-button').click();
    await page.waitForFunction(() => globalThis.motionStudyState().playing);
    await page.waitForFunction(() => !globalThis.motionStudyState().playing);
    assert.equal(await page.locator('#pet').evaluate(el => el.toDataURL()), rest);
    assert.equal(await page.evaluate(() => globalThis.motionStudyState().transform), 'none');
    console.log(action, { ground: grounds, paw: paws, webpBytes: (await stat(`design/pet-motion/capybara-poses-${action}.webp`)).size });
  }
  // Rapid switching uses only the last request, and stopping cancels pending playback.
  await page.evaluate(() => {
    for (const key of ['yawn', 'nuzzle', 'ears']) globalThis.document.querySelector(`[data-action="${key}"]`).click();
  });
  await page.waitForFunction(() => globalThis.motionStudyState().pack === '-ears' && globalThis.motionStudyState().playing);
  await page.locator('#stop').click();
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  await page.locator('#background').click();
  await page.locator('#size').click();
  assert.equal((await page.locator('#pet').boundingBox()).width, 128);
  await page.screenshot({ path: 'qa-shots/motion-actions/dark-small.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-action="yawn"]').click();
  await page.waitForFunction(() => globalThis.motionStudyState().pack === '-yawn');
  assert.equal(await page.evaluate(() => globalThis.motionStudyState().playing), false);
  assert.deepEqual(errors, []);
  // Fresh page: simulate a slow asset request then stop before it resolves.
  const delayed = await browser.newPage();
  await delayed.route('**/capybara-poses-yawn.webp', async route => {
    await new Promise(resolve => setTimeout(resolve, 500)); await route.continue();
  });
  await delayed.goto('http://127.0.0.1:5174/design/pet-motion/');
  await delayed.waitForFunction(() => !globalThis.document.querySelector('#play').disabled);
  await delayed.locator('[data-action="yawn"]').click();
  await delayed.locator('#stop').click();
  await delayed.waitForTimeout(900);
  assert.equal(await delayed.evaluate(() => globalThis.motionStudyState().pack), '-v2');
  assert.equal(await delayed.evaluate(() => globalThis.motionStudyState().playing), false);
  console.log('Three action clips passed: lazy loading, anchored feet, exact rest, repeat, rapid switching, pending-load cancellation, reduced motion, 128px, dark and mobile.');
} finally { await browser.close(); }
