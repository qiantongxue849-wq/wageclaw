import { _electron as electron, chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5174';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir('qa-shots', { recursive: true });
const profile = `/tmp/wageclaw-pet-qa-${Date.now()}`;
const env = { ...process.env, WAGECLAW_DEV_SERVER_URL: base }; delete env.ELECTRON_RUN_AS_NODE;
// 普通终端无需关闭 Chromium 沙箱；受限环境（容器/沙箱）里设置 WAGECLAW_QA_NO_SANDBOX=1。
const launchArgs = ['electron/main.cjs', `--user-data-dir=${profile}`];
if (process.env.WAGECLAW_QA_NO_SANDBOX === '1') launchArgs.push('--no-sandbox');
const launch = () => electron.launch({ args: launchArgs, env });
async function findWindow(app, view) {
  for (let i = 0; i < 80; i++) {
    const win = app.windows().find(w => !w.isClosed() && w.url().includes(`view=${view}`));
    if (win) { win.setDefaultTimeout(10000); await win.waitForLoadState('domcontentloaded'); return win; }
    await sleep(100);
  }
  throw new Error(`Window ${view} did not open`);
}
const errors = [];
let app = await launch();
try {
  app.on('window', page => page.on('pageerror', error => errors.push(error.message)));
  let main = await findWindow(app, 'main');
  await main.getByLabel('月薪', { exact: true }).fill('18000');
  await main.getByLabel('春节放假开始', { exact: true }).fill('02-01');
  await main.getByLabel('年终奖预计发放日期', { exact: true }).fill('01-29');
  const closed = main.waitForEvent('close');
  await main.getByRole('button', { name: '开始我的倒计时' }).click();
  await closed;
  console.log('Onboarding saved and panel released.');
  let pet = await findWindow(app, 'pet');
  await pet.locator('canvas').waitFor();
  // 依赖画布 (144, 200) 为不透明像素，点击点 (64, 88) 对应画布 (144, 198) 同理。
  // 已核对 5 套形象 × 10 阶共 50 种组合，这两点全部不透明；换素材后需重新核对。
  await pet.waitForFunction(() => globalThis.document.querySelector('canvas').getContext('2d').getImageData(144, 200, 1, 1).data[3] > 0);
  await sleep(500);
  await pet.evaluate(() => globalThis.wageclawLite.dismiss());
  await pet.screenshot({ path: 'qa-shots/v2-pet.png', omitBackground: true });
  // Actual renderer pointer events exercise the single/double click arbiter.
  await pet.locator('canvas').click({ position: { x: 64, y: 88 } });
  let bubble = await findWindow(app, 'bubble');
  await bubble.locator('.speech p').waitFor();
  assert.ok((await bubble.locator('.speech p').textContent()).length > 0);
  await bubble.screenshot({ path: 'qa-shots/v2-bubble.png', omitBackground: true });
  assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=bubble')).isFocused()), false);
  await pet.evaluate(() => globalThis.wageclawLite.dismiss());
  await pet.locator('canvas').dblclick({ position: { x: 64, y: 88 }, delay: 120 });
  main = await findWindow(app, 'main');
  await main.getByTestId('today-income').waitFor();
  await main.screenshot({ path: 'qa-shots/v2-panel.png' });
  // An active bubble must disappear immediately when salary privacy changes.
  await sleep(2100);
  await pet.evaluate(() => globalThis.wageclawLite.report());
  await findWindow(app, 'bubble');
  await main.getByRole('button', { name: '隐藏金额', exact: true }).click();
  await pet.waitForFunction(async () => (await globalThis.wageclawLite.getSnapshot()).settings.privacy === true);
  assert.equal(await pet.evaluate(async () => (await globalThis.wageclawLite.getSnapshot()).bubble), null);
  await main.getByRole('button', { name: '设置', exact: true }).click();
  await main.getByRole('button', { name: '今天安静', exact: true }).click();
  await main.getByRole('button', { name: '保存设置', exact: true }).click();
  const quiet = await pet.evaluate(async () => (await globalThis.wageclawLite.getSnapshot()).settings.broadcast.quietDate);
  assert.match(quiet, /^\d{4}-\d{2}-\d{2}$/);
  const closedAgain = main.waitForEvent('close');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=main')).close());
  await closedAgain;
  // Twenty panel cycles must return to a single pet window, not accumulate renderer windows.
  const snapshots = [];
  for (let i = 0; i < 20; i++) {
    await pet.evaluate(() => globalThis.wageclawLite.openMain());
    const panel = await findWindow(app, 'main');
    await panel.getByTestId('today-income').waitFor();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('view=main')).close());
    await sleep(100);
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
    if (i === 0 || i === 19) snapshots.push(await app.evaluate(({ app }) => app.getAppMetrics()));
  }
  // Short process-tree sample; report it as a smoke measurement, not a long soak test.
  const idleMetrics = [];
  for (let i = 0; i < 6; i++) { await sleep(5000); idleMetrics.push(await app.evaluate(({ app }) => app.getAppMetrics())); }
  await writeFile('qa-shots/v2-process-metrics.json', JSON.stringify({ durationSeconds: 30, scope: 'Electron app.getAppMetrics process tree; development build', panelCycles: snapshots, idle: idleMetrics }, null, 2));
  await app.close();
  app = await launch();
  pet = await findWindow(app, 'pet');
  await pet.locator('canvas').waitFor();
  await sleep(500);
  assert.equal(app.windows().some(w => w.url().includes('view=main')), false);
  const restored = await pet.evaluate(() => globalThis.wageclawLite.getSnapshot());
  assert.equal(restored.settings.salary, 18000);
  assert.equal(restored.settings.privacy, true);
  assert.equal(restored.settings.broadcast.quietDate, quiet);
  assert.equal(restored.bubble, null);
  assert.deepEqual(errors, []);
  console.log('Electron V2 passed: onboarding, single/double click, non-focusing bubble, privacy, quiet state, 20 panel creation/destruction cycles, restart without panel, 30-second metrics sample.');
} finally { await app.close(); }
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 680 } });
  await page.goto(`${base}/?view=pet-preview`);
  await page.getByRole('button', { name: '听它说一句' }).click();
  await page.locator('.speech').waitFor();
  await page.screenshot({ path: 'qa-shots/v2-preview.png' });
} finally { await browser.close(); }
