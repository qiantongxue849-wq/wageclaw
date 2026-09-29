import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const url = process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5174';
await mkdir('qa-shots/business-motion', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: 'Asia/Shanghai' });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-09-24T15:00:00+08:00'));
  await page.goto(url);
  await page.getByLabel('月薪', { exact: true }).fill('18000');
  await page.getByRole('button', { name: '开始我的倒计时' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const panel = page.getByRole('complementary', { name: '我的桌面搭子' });
  const canvas = panel.locator('.companion-pet canvas');
  const income = await page.getByTestId('today-income').textContent();
  const fingerprints = [];
  for (const [style, name] of [['capybaraZen', '卡皮巴拉'], ['lazyCat', '懒猫'], ['lazyDog', '懒狗'], ['honestCow', '老实牛'], ['rageBlob', '怨气团']]) {
    await panel.getByRole('button', { name: `选择${name}`, exact: true }).click();
    await page.waitForFunction(label => {
      const el = globalThis.document.querySelector('.companion-pet canvas');
      const heading = globalThis.document.querySelector('.companion-panel h3');
      return el?.dataset.motion === 'classic' && heading?.textContent === label;
    }, name);
    fingerprints.push(await canvas.evaluate(el => el.toDataURL()));
    for (const [label, action] of [['♡ 摸摸它', 'play'], ['攒了多少', 'celebrate'], ['多久下班', 'notice'], ['一起松口气', 'stretch']]) {
      await panel.getByRole('button', { name: label, exact: true }).click();
      await page.waitForFunction(expected => {
        const el = globalThis.document.querySelector('.companion-pet canvas');
        return el.dataset.moving === 'true' && el.dataset.action === expected;
      }, action);
      const first = await canvas.evaluate(el => el.toDataURL());
      await page.waitForTimeout(600);
      const middle = await canvas.evaluate(el => el.toDataURL());
      assert.notEqual(middle, first, `${style}/${action} needs real changed poses`);
      assert.equal(await canvas.evaluate(el => globalThis.getComputedStyle(el).transform), 'none');
      if (action === 'celebrate') {
        assert.match(await panel.getByRole('status').textContent(), /¥/);
        await canvas.screenshot({ path: `qa-shots/business-motion/${style}.png` });
      }
      if (action === 'notice') assert.match(await panel.getByRole('status').textContent(), /分钟/);
      await page.waitForFunction(() => {
        const el = globalThis.document.querySelector('.companion-pet canvas');
        return el.dataset.moving === 'false' && el.dataset.motion === 'classic';
      });
    }
  }
  // Finish naturally and queue only the latest report when the user clicks rapidly.
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  await page.waitForFunction(() => globalThis.document.querySelector('.companion-pet canvas').dataset.moving === 'true');
  await panel.getByRole('button', { name: '攒了多少', exact: true }).click();
  await panel.getByRole('button', { name: '多久下班', exact: true }).click();
  await page.waitForFunction(() => globalThis.document.querySelector('.companion-pet canvas').dataset.action === 'notice');
  await page.waitForFunction(() => globalThis.document.querySelector('.companion-pet canvas').dataset.moving === 'false');
  assert.equal(new Set(fingerprints).size, 5);
  assert.equal(await page.getByTestId('today-income').textContent(), income, 'Interactions cannot change earnings');
  await panel.getByRole('button', { name: '多久放假', exact: true }).click();
  assert.match(await panel.getByRole('status').textContent(), /假期/);
  await panel.getByRole('button', { name: '春节回家', exact: true }).click();
  assert.match(await panel.getByRole('status').textContent(), /春节/);
  await panel.getByRole('button', { name: '年终奖', exact: true }).click();
  assert.match(await panel.getByRole('status').textContent(), /预计/);
  await page.getByRole('button', { name: '隐藏金额', exact: true }).click();
  await panel.getByRole('button', { name: '攒了多少', exact: true }).click();
  assert.ok(!(await panel.getByRole('status').textContent()).includes('¥'));
  await panel.getByRole('button', { name: /换个形态/ }).click();
  await panel.getByLabel('形态模式').selectOption('10');
  await panel.getByLabel('互动时做动作').uncheck();
  await page.waitForFunction(() => globalThis.document.querySelector('.companion-pet canvas').dataset.motion === 'classic');
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  assert.equal(await canvas.getAttribute('data-moving'), 'false');
  await panel.getByLabel('互动时做动作').check();
  await panel.getByLabel('形态模式').selectOption('auto');
  await page.waitForFunction(() => globalThis.document.querySelector('.companion-pet canvas').dataset.motion === 'classic');
  await panel.getByRole('button', { name: /换个形态/ }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  assert.equal(await canvas.getAttribute('data-moving'), 'false');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.screenshot({ path: 'qa-shots/business-motion/dashboard.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth));
  const preview = await context.newPage();
  await preview.clock.setFixedTime(new Date('2026-09-24T15:00:00+08:00'));
  await preview.goto(`${url}/?view=pet-preview`);
  await preview.waitForFunction(() => globalThis.document.querySelector('.pet-target canvas')?.dataset.motion === 'classic');
  await preview.getByRole('button', { name: '多久下班', exact: true }).click();
  await preview.waitForFunction(() => globalThis.document.querySelector('.pet-target canvas')?.dataset.action === 'notice');
  assert.match(await preview.locator('.speech').textContent(), /分钟/);
  await preview.screenshot({ path: 'qa-shots/business-motion/desktop-preview.png', fullPage: true });
  assert.deepEqual(errors, []);
  // Produce a reviewable filmstrip from actual production atlas registration.
  const meta = JSON.parse(await readFile('src/assets/pet-motion/frames.json', 'utf8'));
  const cards = [];
  for (const name of ['cat', 'dog', 'cow', 'blob']) {
    const pack = meta[name];
    for (const n of [0, 6, 15, 21]) {
      const f = pack.frames[n], scale = pack.scale;
      const sprite = await sharp(`src/assets/pet-motion/${name}.webp`).extract({ left: f.sx, top: f.sy, width: f.sw, height: f.sh }).resize(Math.round(f.sw * scale), Math.round(f.sh * scale)).toBuffer();
      const frame = await sharp({ create: { width: 288, height: 288, channels: 4, background: '#f6f5f0' } }).composite([{ input: sprite, left: Math.round(144 - f.anchor * scale), top: Math.round(266 - f.ground * scale) }]).png().toBuffer();
      cards.push({ input: frame, left: (cards.length % 4) * 288, top: Math.floor(cards.length / 4) * 288 });
    }
  }
  await sharp({ create: { width: 1152, height: 1152, channels: 4, background: '#f6f5f0' } }).composite(cards).png().toFile('qa-shots/business-motion/four-companions.png');
  console.log('Five production pets passed: real changing poses, report-specific actions, unchanged earnings, privacy, classic forms, reduced motion, mobile and desktop-preview business reports.');
} finally { await browser.close(); }
