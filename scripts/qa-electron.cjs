/**
 * Electron 实机走查脚本：本地测试登录 → onboarding → 主界面 → 桌宠页 → 格斗模态
 * 前置：npm run build && npm run preview（127.0.0.1:4173）
 * 用法：node scripts/qa-electron.cjs
 */
const { _electron: electron } = require("playwright");
const { mkdirSync } = require("fs");

const SHOT_DIR = "qa-shots";

/** 主窗口加载 ?view=main，桌宠窗口是 ?view=float——按 URL 挑主窗口 */
async function findMainWindow(app) {
  for (let i = 0; i < 60; i += 1) {
    const win = app.windows().find((w) => w.url().includes("view=main"));
    if (win) return win;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("主窗口未找到");
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
  mkdirSync("qa-user-data", { recursive: true });

  const app = await electron.launch({
    args: ["electron/main.cjs"],
    executablePath: require("electron"),
    env: {
      ...process.env,
      WAGECLAW_LOCAL_TEST_AUTH: "1",
      WAGECLAW_DEV_SERVER_URL: "http://127.0.0.1:4173"
    }
  });

  app.process().stdout?.on("data", (d) => process.stdout.write("[electron] " + d));
  app.process().stderr?.on("data", (d) => process.stderr.write("[electron:err] " + d));

  const win = await findMainWindow(app);
  win.on("pageerror", (err) => console.log("[pageerror]", err.message));
  win.on("console", (msg) => {
    if (msg.type() === "error") console.log("[console.error]", msg.text());
  });

  await win.waitForLoadState("domcontentloaded");
  await win.waitForTimeout(1500);

  // 已登录则跳过登录步骤
  const loginButton = win.getByText("使用本地测试账号进入");
  if (await loginButton.isVisible().catch(() => false)) {
    await win.screenshot({ path: `${SHOT_DIR}/01-login.png` });
    console.log("✓ 01 登录页");
    await loginButton.click();
    await win.waitForTimeout(3000); // reload + App bootstrap
  } else {
    console.log("→ 已有登录态，跳过登录页");
  }

  // onboarding（已完成则跳过）
  const startButton = win.getByRole("button", { name: "开始使用" });
  if (await startButton.isVisible().catch(() => false)) {
    await win.screenshot({ path: `${SHOT_DIR}/02-onboarding.png` });
    console.log("✓ 02 首次设置");
    await win.locator('input[type="number"]').first().fill("12000");
    await win.locator(".onboarding-wish-grid button").first().click();
    await win.waitForTimeout(300);
    await startButton.click();
    await win.waitForTimeout(1500);
  } else {
    console.log("→ onboarding 已完成，跳过");
  }
  await win.screenshot({ path: `${SHOT_DIR}/03-converter.png` });
  console.log("✓ 03 主界面");

  // 桌宠页
  await win.locator(".title-bar .pet-tool").click();
  await win.waitForTimeout(800);
  await win.screenshot({ path: `${SHOT_DIR}/04-pet.png` });
  console.log("✓ 04 桌宠页");

  // 格斗模态（本轮复活的功能）：桌宠页「桌面游戏」卡片的明面入口
  await win.getByRole("button", { name: "立即开战" }).first().waitFor({ timeout: 15000 });
  await win.getByRole("button", { name: "立即开战" }).first().click();
  await win.waitForTimeout(800);
  await win.waitForTimeout(600);
  await win.screenshot({ path: `${SHOT_DIR}/05-duel-open.png` });
  console.log("✓ 05 格斗模态");

  // 打完整局验证胜负结算 + 爪币奖励
  const pawBefore = await win.evaluate(() => {
    const uid = localStorage.getItem("wageclaw-active-user-id") || "";
    const raw = localStorage.getItem(`wageclaw-state-v3:user:${uid}`);
    return raw ? JSON.parse(raw).pawBalance : -1;
  });
  let phase = "";
  for (let round = 0; round < 45; round += 1) {
    phase = (await win.locator(".round-pill strong").textContent().catch(() => "")) || "";
    if (phase.includes("赢") || phase.includes("打散")) break;
    // 简单策略：爆发够 36 就放怨气波，否则普通拳攒能量
    const energyText = await win.locator(".duel-energy-num").textContent().catch(() => "0 / 100");
    const energy = Number((energyText || "0").split("/")[0]) || 0;
    const skill = energy >= 36 ? "L 怨气波" : "J 普通拳";
    await win.getByRole("button", { name: skill }).click();
    await win.waitForTimeout(170);
  }
  await win.waitForTimeout(4500); // 等状态节流存盘（4s）
  const pawAfter = await win.evaluate(() => {
    const uid = localStorage.getItem("wageclaw-active-user-id") || "";
    const raw = localStorage.getItem(`wageclaw-state-v3:user:${uid}`);
    return raw ? JSON.parse(raw).pawBalance : -1;
  });
  await win.screenshot({ path: `${SHOT_DIR}/06-duel-fight.png` });
  const status = await win.locator(".duel-stage p").textContent().catch(() => "(未取到)");
  console.log(`✓ 06 格斗结算：${phase}｜爪币 ${pawBefore} → ${pawAfter}`);
  console.log("  战斗状态：", status);

  await app.close();
  console.log("全部截图完成 → qa-shots/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
