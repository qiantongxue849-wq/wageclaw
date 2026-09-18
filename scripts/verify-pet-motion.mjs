import { chromium, _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const base = process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5174';
await mkdir('qa-shots', { recursive: true });
// 依赖画布 (144, 200) 为不透明像素；tap() 点在窗口高度 68% 处，同样落在躯体上。
// 已核对 5 套形象 × 10 阶共 50 种组合，这两点全部不透明；换素材后需重新核对。
async function ready(page) {
  await page.waitForFunction(() => globalThis.document.querySelector('canvas')?.getContext('2d').getImageData(144, 200, 1, 1).data[3] > 0);
}
async function active(page) {
  return page.locator('canvas').evaluate(el => el.getAnimations().filter(a => a.playState === 'running').length);
}
async function tap(page) {
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.68);
}
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto(`${base}/?view=pet-preview`);
  await ready(page);
  const initial = await page.locator('.pet-target').boundingBox();
  const bitmap = await page.locator('canvas').evaluate(el => el.toDataURL());
  await tap(page);
  assert.equal(await active(page), 1, 'Click responds before the single-click reporting delay');
  await page.locator('.speech').waitFor();
  assert.deepEqual(await page.locator('.pet-target').boundingBox(), initial, 'Bubble must not move the pet');
  await page.waitForTimeout(900);
  assert.equal(await active(page), 0, 'Motion finishes instead of leaving an idle animation loop');
  assert.equal(await page.locator('canvas').evaluate(el => el.toDataURL()), bitmap, 'All poses retain the intact bitmap');
  await page.getByRole('button', { name: '关闭气泡' }).click();
  assert.deepEqual(await page.locator('.pet-target').boundingBox(), initial);

  // Freeze each pose only for visual inspection. A burst must not reset playback.
  await tap(page);
  await page.locator('canvas').evaluate(el => { const a = el.getAnimations()[0]; a.pause(); a.currentTime = 140; });
  await page.getByRole('button', { name: '听它说一句' }).click();
  assert.equal(await page.locator('canvas').evaluate(el => el.getAnimations()[0].currentTime), 140);
  const frames = [];
  for (const time of [0, 148, 353, 574, 810]) {
    await page.locator('canvas').evaluate((el, t) => { el.getAnimations()[0].currentTime = t; }, time);
    frames.push({ input: await page.locator('.pet-target').screenshot(), left: frames.length * 160 + 16, top: 16 });
  }
  await sharp({ create: { width: 800, height: 160, channels: 4, background: '#eef2e9' } }).composite(frames).png().toFile('qa-shots/pet-motion-poses.png');
  await page.locator('canvas').evaluate(el => el.getAnimations()[0].play());
  await page.waitForTimeout(900);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '听它说一句' }).click();
  assert.equal(await active(page), 0);
  await page.locator('.speech').waitFor();
  await page.screenshot({ path: 'qa-shots/pet-motion-preview.png' });
  assert.equal(requests.some(url => /capybara-(play|sleep)/.test(url)), false);
  assert.deepEqual(errors, []);
  console.log('Preview: immediate feedback, stable bubble layout, intact image, finite motion, repeated clicks, reduced motion, no sprite requests passed.');
} finally { await browser.close(); }

if (process.env.WAGECLAW_QA_ELECTRON === '1') {
  const env = { ...process.env, WAGECLAW_DEV_SERVER_URL: base }; delete env.ELECTRON_RUN_AS_NODE;
  // 普通终端无需关闭 Chromium 沙箱；受限环境（容器/沙箱）里设置 WAGECLAW_QA_NO_SANDBOX=1。
  const motionArgs = ['electron/main.cjs', `--user-data-dir=/tmp/wageclaw-motion-${Date.now()}`];
  if (process.env.WAGECLAW_QA_NO_SANDBOX === '1') motionArgs.push('--no-sandbox');
  const app = await electron.launch({ args: motionArgs, env });
  const windowFor = async view => {
    for (let i = 0; i < 100; i++) {
      const page = app.windows().find(w => !w.isClosed() && w.url().includes(`view=${view}`));
      if (page) return page;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Missing ${view} window`);
  };
  try {
    const main = await windowFor('main');
    await main.getByLabel('月薪', { exact: true }).fill('18000');
    const closed = main.waitForEvent('close');
    await main.getByRole('button', { name: '开始我的倒计时' }).click();
    await closed;
    const pet = await windowFor('pet'); await ready(pet);
    await tap(pet);
    assert.equal(await active(pet), 1);
    await pet.waitForTimeout(1000);
    assert.equal(await active(pet), 0);
    await pet.evaluate(() => globalThis.wageclawLite.dismiss());
    // Host idle -> user response must start from the pose currently on screen.
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=pet')).webContents.send('pet:animate', 'sleep'));
    await pet.waitForFunction(() => globalThis.document.querySelector('canvas').getAnimations().length === 1);
    const pose = await pet.locator('canvas').evaluate(el => { const a = el.getAnimations()[0]; a.pause(); a.currentTime = 700; return globalThis.getComputedStyle(el).transform; });
    await tap(pet);
    const origin = await pet.locator('canvas').evaluate(el => el.getAnimations()[0].effect.getKeyframes()[0].transform);
    assert.equal(origin, pose);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=pet')).webContents.send('pet:paused', true));
    await pet.waitForFunction(() => globalThis.document.querySelector('canvas').getAnimations().length === 0);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=pet')).webContents.send('pet:paused', false));
    await pet.waitForTimeout(1000);
    await pet.locator('canvas').dblclick({ position: { x: 64, y: 88 }, delay: 120 });
    const panel = await windowFor('main');
    await panel.getByTestId('today-income').waitFor();
    console.log('Electron: click response, idle-to-click continuity, pause cleanup, double-click panel passed.');
  } finally { await app.close(); }
}
