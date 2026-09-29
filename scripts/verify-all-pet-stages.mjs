import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const base = process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5174';
const output = 'qa-shots/all-pet-stages';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: 'Asia/Shanghai' });
  const page = await context.newPage(), errors = [], cards = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-24T15:00:00+08:00') });
  await page.clock.pauseAt(new Date('2026-09-24T15:00:01+08:00'));
  await page.goto(base);
  await page.getByLabel('月薪', { exact: true }).fill('18000');
  await page.getByRole('button', { name: '开始我的倒计时' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const panel = page.getByRole('complementary', { name: '我的桌面搭子' });
  const canvas = panel.locator('.companion-pet canvas');
  const settle = async (stage, style) => {
    for (let attempt = 0; attempt < 30; attempt++) {
      await page.clock.runFor(700);
      const ready = await canvas.evaluate((el, { stage, style }) => el.dataset.motion === 'classic' && el.dataset.moving === 'false' && (!stage || el.dataset.stage === String(stage)) && (!style || el.dataset.character === style), { stage, style });
      if (ready) return;
      await page.waitForTimeout(30); // Allow image decoding before advancing the paused clock.
    }
    throw new Error(`Did not settle ${style}/${stage}: ${JSON.stringify(await canvas.evaluate(el => ({...el.dataset})))}`);
  };
  const sample = () => canvas.evaluate(el => ({ png: el.toDataURL(), ...el.dataset }));
  await panel.getByRole('button', { name: /换个形态/ }).click();
  const names = [['capybaraZen','卡皮巴拉','float'],['lazyCat','懒猫','curl'],['lazyDog','懒狗','hop'],['honestCow','老实牛','nod'],['rageBlob','怨气团','mist']];
  const actions = [['♡ 摸摸它','play'],['攒了多少','celebrate'],['多久下班','notice'],['一起松口气','stretch']];
  for (const [style, label, transition] of names) {
    await panel.getByRole('button', { name: `选择${label}`, exact: true }).click();
    await settle(undefined, style);
    for (let stage = 1; stage <= 10; stage++) {
      await panel.getByLabel('形态模式').selectOption(String(stage));
      await settle(stage, style);
      assert.equal(await panel.getByLabel('互动时做动作').isChecked(), true);
      const rest = await sample();
      for (const [name, action] of actions) {
        await panel.getByRole('button', { name, exact: true }).click();
        for (let attempt = 0; attempt < 30; attempt++) {
          if (await canvas.evaluate((el, action) => el.dataset.moving === 'true' && el.dataset.action === action, action)) break;
          await page.waitForTimeout(30); await page.clock.runFor(30);
        }
        await page.clock.runFor(600);
        const middle = await sample();
        assert.equal(middle.stage, String(stage)); assert.equal(middle.character, style);
        assert.ok(middle.png !== rest.png, `${style}/${stage}/${action} must animate`);
        if (stage > 1) assert.equal(middle.motion, 'authored', 'Never substitute level-one art');
        if ([2,5,10].includes(stage) && action === 'play') {
          for (const png of [rest.png, middle.png]) cards.push({ input: await sharp(Buffer.from(png.split(',')[1], 'base64')).resize(144,144).png().toBuffer(), left: (cards.length % 6)*144, top: Math.floor(cards.length/6)*144 });
        }
        await page.clock.fastForward(4000);
        await settle(stage, style);
        assert.ok((await sample()).png === rest.png, `${style}/${stage}/${action}: exact return to chosen form`);
      }
      // Sleep is driven by an actual after-work report.
      await page.clock.setSystemTime(new Date('2026-09-24T20:00:00+08:00'));
      await page.clock.runFor(1100);
      await panel.getByRole('button', { name: '多久下班', exact: true }).click();
      await page.clock.runFor(600);
      assert.equal((await sample()).action, 'sleep');
      assert.notEqual((await sample()).png, rest.png);
      await page.clock.fastForward(2500); await settle(stage, style);
      assert.equal((await sample()).png, rest.png);
      await page.clock.setSystemTime(new Date('2026-09-24T15:00:00+08:00'));
      await page.clock.runFor(1100);
    }
    assert.equal((await sample()).transition, transition);
    console.log(`${style}: all 10 forms × 5 reactions passed`);
  }
  await sharp({ create: { width: 864, height: 720, channels: 4, background: '#f6f5f0' } }).composite(cards).png().toFile(`${output}/forms-and-reactions.png`);
  // Latest action wins, and a form change waits for a running gesture.
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  await panel.getByLabel('形态模式').selectOption('7');
  assert.equal((await sample()).stage, '10');
  await panel.getByRole('button', { name: '攒了多少', exact: true }).click();
  await panel.getByRole('button', { name: '多久下班', exact: true }).click();
  await page.clock.runFor(1500);
  for (let attempt = 0; attempt < 40; attempt++) {
    const frame = await sample();
    if (frame.stage === '7' && frame.action === 'notice' && frame.moving === 'true') break;
    await page.waitForTimeout(30); await page.clock.runFor(100);
  }
  assert.equal((await sample()).stage, '7'); assert.equal((await sample()).action, 'notice');
  await page.clock.fastForward(3000); await settle(7, 'rageBlob');
  // Interrupt transitions with rapid cross-character changes; newest choice wins.
  for (const [, label] of names) {
    await panel.getByRole('button', { name: `选择${label}`, exact: true }).click();
    await page.clock.runFor(60);
  }
  await settle(7, 'rageBlob');
  await panel.getByLabel('互动时做动作').uncheck();
  await settle(); const staticForm = await sample();
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  await page.clock.runFor(650);
  assert.equal((await sample()).png, staticForm.png);
  await panel.getByLabel('互动时做动作').check(); await settle();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await panel.getByLabel('形态模式').selectOption('10'); await settle(10);
  const reduced = await sample();
  await panel.getByRole('button', { name: '♡ 摸摸它', exact: true }).click();
  await page.clock.runFor(600); assert.equal((await sample()).png, reduced.png);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await settle(10, 'rageBlob');
  await panel.getByRole('button', { name: /换个形态/ }).click();
  assert.equal(await panel.getByLabel('互动时做动作').isChecked(), true);
  // The separate desktop-preview renderer receives settings and keeps level 10.
  const preview = await context.newPage();
  preview.on('pageerror', error => errors.push(error.message));
  await preview.goto(`${base}/?view=pet-preview`);
  await preview.waitForFunction(() => globalThis.document.querySelector('.pet-target canvas')?.dataset.stage === '10');
  await preview.getByRole('button', { name: '摸摸它', exact: true }).click();
  await preview.waitForFunction(() => globalThis.document.querySelector('.pet-target canvas')?.dataset.motion === 'authored');
  await preview.waitForTimeout(1600);
  assert.equal(await preview.locator('canvas').getAttribute('data-stage'), '10');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth));
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });

  assert.deepEqual(errors, []);
  console.log('250 reactions, five transitions, interruption, queueing, static mode, reduced motion, persistence, desktop preview and mobile passed.');
} finally { await browser.close(); }
