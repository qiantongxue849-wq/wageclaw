import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// 覆盖 V2 新增的三块交互：形象切换、十阶进化、悬停信息浮层。
// 用法：WAGECLAW_QA_URL=http://127.0.0.1:5173 node scripts/verify-pet-features.mjs
const base = process.env.WAGECLAW_QA_URL || 'http://127.0.0.1:5173';
await mkdir('qa-shots', { recursive: true });

const env = { ...process.env, WAGECLAW_DEV_SERVER_URL: base };
delete env.ELECTRON_RUN_AS_NODE;
const args = ['electron/main.cjs', `--user-data-dir=/tmp/wageclaw-features-qa-${Date.now()}`];
// 普通终端无需关闭 Chromium 沙箱；受限环境（容器/沙箱）里需要显式设置这个变量。
if (process.env.WAGECLAW_QA_NO_SANDBOX === '1') args.push('--no-sandbox');

const app = await electron.launch({ args, env });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// 窗口事件的 url 在创建瞬间可能还是空的，统一用轮询代替 waitForEvent，避免漏窗口。
const waitForWindow = async (fragment, { exclude = new Set(), timeout = 20000 } = {}) => {
  for (let waited = 0; waited < timeout; waited += 100) {
    const found = app.windows().find(win => !exclude.has(win) && win.url().includes(fragment));
    if (found) return found;
    await sleep(100);
  }
  throw new Error(`没有等到 ${fragment} 窗口`);
};

try {
  const main = await waitForWindow('view=main');
  await main.waitForLoadState('domcontentloaded');
  await main.getByLabel('月薪', { exact: true }).fill('18000');
  await main.getByRole('button', { name: '开始我的倒计时' }).click();
  // 引导完成后主面板会自动关闭；必须等它真的关掉，否则后面的 openMain 只会聚焦旧窗口。
  await main.waitForEvent('close', { timeout: 10000 });

  const pet = await waitForWindow('view=pet');
  await pet.waitForLoadState('domcontentloaded');
  await pet.locator('canvas').waitFor();

  // pet:save 只接受详情面板调用，所以写设置要先重新打开面板。
  const openPanel = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const exclude = new Set(app.windows());
      await pet.evaluate(() => globalThis.wageclawLite.openMain());
      try {
        const panel = await waitForWindow('view=main', { exclude, timeout: 8000 });
        await panel.waitForLoadState('domcontentloaded');
        return panel;
      } catch { /* 面板可能还在关闭中，重试一次 */ }
    }
    throw new Error('详情面板没有打开');
  };
  const panel = await openPanel();

  const readSettings = () => panel.evaluate(() => globalThis.wageclawLite.getSnapshot().then(s => JSON.parse(JSON.stringify(s.settings))));
  const writeSettings = next => panel.evaluate(value => globalThis.wageclawLite.saveSettings(value), next);
  const aria = () => pet.locator('canvas').getAttribute('aria-label');
  const stageOf = async () => Number((await aria()).match(/Lv\.(\d+)/)[1]);
  const settle = label => pet.waitForFunction(name => globalThis.document.querySelector('canvas')?.getAttribute('aria-label')?.startsWith(name), label);

  // 固定为 09:00—18:00 单段连续班次，并清掉夏季区间，让常规作息始终生效。
  const seed = await readSettings();
  seed.privacy = false; seed.startTime = '09:00'; seed.endTime = '18:00'; seed.summerFrom = ''; seed.summerTo = '';
  await writeSettings(seed);

  // 指纹同时纳入颜色与轮廓：只看不透明像素的位置不足以区分不同素材。
  const fingerprint = () => pet.evaluate(() => {
    const data = globalThis.document.querySelector('canvas').getContext('2d').getImageData(0, 0, 288, 288).data;
    let hash = 0, opaque = 0;
    for (let p = 0; p < 288 * 288; p++) {
      const i = p * 4;
      if (data[i + 3] > 18) { opaque++; hash = (hash * 31 + data[i] * 7 + data[i + 1] * 5 + data[i + 2] * 3 + p) >>> 0; }
    }
    return { hash, opaque };
  });
  // 标题是同步更新的，画布重绘要等图片加载，所以必须等画面真的变了再断言。
  const rendered = async previous => {
    for (let waited = 0; waited < 5000; waited += 100) {
      const current = await fingerprint();
      if (current.opaque > 1000 && current.hash !== previous) return current;
      await sleep(100);
    }
    throw new Error('画布没有刷新到新形象');
  };

  // —— 1. 五套形象切换 ——
  const styles = [['capybaraZen', '卡皮巴拉'], ['rageBlob', '怨气团'], ['lazyCat', '懒猫'], ['lazyDog', '懒狗'], ['honestCow', '老实牛']];
  const seen = new Set();
  let last = null;
  for (const [key, label] of styles) {
    await writeSettings({ ...seed, pet: { ...seed.pet, style: key } });
    await settle(label);
    assert.match(await aria(), new RegExp(`^${label} Lv\\.\\d+`), `${label} 的标题未随形象更新`);
    const { hash, opaque } = await rendered(last);
    assert.ok(opaque > 1000, `${label} 没有绘制出可见像素`);
    assert.ok(!seen.has(hash), `${label} 与其它形象渲染结果相同，素材没有真正切换`);
    seen.add(hash); last = hash;
  }
  await writeSettings({ ...seed, pet: { ...seed.pet, style: 'capybaraZen' } });
  await settle('卡皮巴拉');
  await pet.screenshot({ path: 'qa-shots/features-pet.png' });
  console.log(`形象切换：${styles.length} 套全部渲染出互不相同的画面，且标题同步更新。`);

  // —— 2. 十阶进化（固定时钟后重载，让 onMounted 读到假时间）——
  const stageAt = async iso => {
    await pet.clock.setFixedTime(new Date(iso));
    await pet.reload();
    await pet.waitForFunction(() => /Lv\.\d+/.test(globalThis.document.querySelector('canvas')?.getAttribute('aria-label') || ''));
    return stageOf();
  };
  assert.equal(await stageAt('2026-09-18T08:00:00+08:00'), 1, '上班前应为第 1 阶');
  assert.equal(await stageAt('2026-09-18T09:00:00+08:00'), 1, '上班瞬间应为第 1 阶');
  assert.equal(await stageAt('2026-09-18T13:30:00+08:00'), 6, '班次过半应为第 6 阶');
  assert.equal(await stageAt('2026-09-18T17:59:00+08:00'), 10, '临近下班应为第 10 阶');
  assert.equal(await stageAt('2026-09-18T20:00:00+08:00'), 10, '下班后应停在第 10 阶');
  assert.equal(await stageAt('2026-09-19T12:00:00+08:00'), 1, '周六应停在第 1 阶');
  console.log('十阶进化：上班前 / 上班 / 过半 / 临下班 / 下班后 / 周末六个时点全部符合预期。');

  // —— 3. 夏季作息会改变同一时刻的阶段 ——
  await writeSettings({ ...seed, summerFrom: '05-01', summerTo: '10-01', summerStartTime: '09:00', summerEndTime: '21:00' });
  assert.equal(await stageAt('2026-09-18T17:00:00+08:00'), 7, '夏季下班更晚，同一时刻阶段应更靠前');
  await writeSettings(seed);
  console.log('夏季作息：同一时刻（17:00）常规班次为第 9 阶、夏季班次为第 7 阶。');

  // —— 4. 悬停信息浮层 ——
  await stageAt('2026-09-18T14:38:42+08:00');
  const hoverWindows = () => app.windows().filter(win => win.url().includes('view=hover'));
  // 从掩码里各取一个必然透明、必然不透明的点，避免依赖具体素材的构图。
  const pick = solid => pet.evaluate(wantSolid => {
    const canvas = globalThis.document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const data = canvas.getContext('2d').getImageData(0, 0, 288, 288).data;
    for (let y = 2; y < 288; y += 2) for (let x = 2; x < 288; x += 2) {
      const alpha = data[(y * 288 + x) * 4 + 3];
      if (wantSolid ? alpha > 200 : alpha <= 18) {
        return { x: rect.left + (x + 0.5) / 288 * rect.width, y: rect.top + (y + 0.5) / 288 * rect.height };
      }
    }
    throw new Error('找不到符合要求的像素点');
  }, solid);
  const blank = await pick(false), body = await pick(true);

  // 桌宠初始状态假定「鼠标在窗口外」，所以要先移到透明处再移入，状态变化才会触发。
  await pet.mouse.move(blank.x, blank.y);
  await sleep(400);
  assert.equal(hoverWindows().length, 0, '鼠标在窗口外时不应有浮层');

  const before = new Set(app.windows());
  await pet.mouse.move(body.x, body.y);
  const hover = await waitForWindow('view=hover', { exclude: before, timeout: 8000 });
  await hover.waitForLoadState('domcontentloaded');

  const rows = await hover.locator('.hover-row').count();
  const labels = (await hover.locator('.hover-label').allTextContents()).map(text => text.trim());
  assert.equal(rows, 5, '悬停卡应为五行');
  assert.deepEqual(labels, ['今日已赚', '距离下班', '距离发薪', '最近假期', '距离年终奖']);
  assert.match(await hover.getByTestId('hover-today').textContent(), /^¥ [\d,]+\.\d{2}$/);
  assert.match(await hover.getByTestId('hover-offwork').textContent(), /^\d{2}:\d{2}:\d{2}$/);
  assert.match(await hover.getByTestId('hover-payday').textContent(), /^(未设置|今天发薪|\d+ 天)$/);
  assert.match(await hover.getByTestId('hover-holiday').textContent(), /^(待公布|.+ · .+)$/);
  assert.match(await hover.getByTestId('hover-bonus').textContent(), /^(未设置|已收到|今天发放|已过|\d+ 天)$/);
  await hover.screenshot({ path: 'qa-shots/features-hover.png' });

  await pet.mouse.move(blank.x, blank.y);
  await sleep(900);
  assert.equal(hoverWindows().length, 0, '鼠标移开后浮层应被销毁');
  console.log(`悬停浮层：${rows} 行内容与格式正确，移入创建、移开 900ms 后销毁。`);

  console.log('Pet features: style switching, ten-stage evolution, summer shift and the hover card all passed.');
} finally {
  await app.close();
}
