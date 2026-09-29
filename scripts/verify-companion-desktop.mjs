import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
const env = { ...process.env, WAGECLAW_DEV_SERVER_URL: process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5174' }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ args: ['electron/main.cjs', `--user-data-dir=/tmp/wageclaw-companion-${Date.now()}`], env });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const windowFor = async view => {
  for (let i = 0; i < 100; i++) { const page = app.windows().find(w => !w.isClosed() && w.url().includes(`view=${view}`)); if (page) return page; await wait(100); }
  throw new Error(`Missing ${view}`);
};
try {
  let main = await windowFor('main');
  await main.getByLabel('月薪', { exact: true }).fill('18000');
  const closed = main.waitForEvent('close');
  await main.getByRole('button', { name: '开始我的倒计时' }).click(); await closed;
  const pet = await windowFor('pet');
  await pet.evaluate(() => globalThis.wageclawLite.openMain()); main = await windowFor('main');
  const companion = main.getByRole('complementary', { name: '我的桌面搭子' });
  await companion.getByRole('button', { name: '选择懒猫', exact: true }).click();
  await companion.getByRole('button', { name: /换个形态/ }).click();
  await companion.getByRole('button', { name: '选择第 10 种形态', exact: true }).click();
  await pet.getByRole('button', { name: /^懒猫 Lv\.10/ }).waitFor();
  await pet.waitForFunction(() => globalThis.document.querySelector('canvas').dataset.stage === '10' && globalThis.document.querySelector('canvas').dataset.moving === 'false');
  await main.clock.setFixedTime(new Date('2026-09-24T15:00:00+08:00'));
  await main.waitForTimeout(1100);
  const before = await main.getByTestId('today-income').textContent();
  await companion.getByRole('button', { name: '一起松口气', exact: true }).click();
  const bubble = await windowFor('bubble');
  await bubble.locator('.speech').waitFor();
  await pet.waitForFunction(() => { const el = globalThis.document.querySelector('canvas'); return el.dataset.motion === 'authored' && el.dataset.stage === '10' && el.dataset.action === 'stretch'; });
  await wait(2000);
  await pet.waitForFunction(() => globalThis.document.querySelector('canvas').dataset.moving === 'false');
  assert.equal(await main.getByTestId('today-income').textContent(), before);
  await companion.getByRole('button', { name: '今天想安静一点' }).click();
  await companion.getByRole('button', { name: '恢复偶尔播报' }).waitFor();
  const settings = await pet.evaluate(async () => (await globalThis.wageclawLite.getSnapshot()).settings);
  assert.equal(settings.pet.style, 'lazyCat'); assert.equal(settings.pet.form, 10); assert.ok(settings.broadcast.quietDate);
  await main.reload(); await companion.getByText('喜欢的第 10 种模样').waitFor();
  // Keep the existing hover view alive while toggling privacy in the panel.
  await pet.evaluate(() => globalThis.wageclawLite.hoverCard(true));
  const hover = await windowFor('hover');
  await hover.getByTestId('hover-today').waitFor();
  await main.getByRole('button', { name: '隐藏金额', exact: true }).click();
  await hover.waitForFunction(() => globalThis.document.querySelector('[data-testid="hover-today"]')?.textContent.includes('••••'));
  await main.screenshot({ path: 'qa-shots/companion-desktop.png', fullPage: true });
  console.log('Desktop companion: UI -> host -> native pet form sync, reaction bubble/motion, earnings unchanged, persisted form/quiet, and live hover privacy passed.');
} finally { await app.close(); }
