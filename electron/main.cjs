/**
 * WageClaw 主进程入口：应用生命周期、单实例锁、模块组装与启动编排。
 * 窗口 / 托盘 / 桌宠演出 / IPC 分别在 app-windows / app-tray / pet-motion / app-ipc 模块实现，
 * 通过共享上下文 ctx 互相协作（ctx 同时充当跨模块的窗口引用存放处）。
 */
const path = require("path");
const { app, dialog, screen, BrowserWindow, Menu, Tray, ipcMain } = require("electron");
const { loadRuntimeConfig } = require("./runtime-config.cjs");
const { createAuthService } = require("./services/auth-service.cjs");
const { createUpdateService } = require("./services/update-service.cjs");

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || process.env.WAGECLAW_DEV_SERVER_URL || "http://127.0.0.1:5173";
const PET_CENTER_PREVIEW = process.env.WAGECLAW_PET_CENTER === "1" || process.argv.includes("--pet-center");
const APP_ICON_PATH = path.join(__dirname, "assets", "app-icon.png");
const CACHE_PATH = path.join(app.getPath("temp"), "wageclaw-electron-cache");

app.commandLine.appendSwitch("disk-cache-dir", CACHE_PATH);
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

if (process.platform === "win32") {
  app.setAppUserModelId("com.wageclaw.electron");
}

process.on("uncaughtException", (err) => {
  console.error("[FATAL]", err);
  dialog.showErrorBox("启动错误", err.stack || err.message);
  process.exit(1);
});

// ── 共享上下文：跨模块的窗口引用与开关 ──
const ctx = {
  app,
  path,
  screen,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  dialog,
  DEV_SERVER_URL,
  PET_CENTER_PREVIEW,
  APP_ICON_PATH,
  mainWindow: null,
  petWindow: null,
  blackoutWindow: null,
  tray: null,
  appAuthenticated: false,
  petWindowDrag: null,
  timers: { petRicochetTimer: null, petStormTimer: null, petNukeTimer: null }
};

Object.assign(ctx, require("./app-windows.cjs")(ctx));
Object.assign(ctx, require("./app-tray.cjs")(ctx));
Object.assign(ctx, require("./pet-motion.cjs")(ctx));
Object.assign(ctx, require("./app-shell.cjs")(ctx));

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    ctx.showMainWindow("converter");
    if (ctx.petWindow && !ctx.petWindow.isDestroyed()) {
      ctx.petWindow.show();
    }
  });
}

function sendPetCommandToMain(payload) {
  const win = ctx.ensureMainWindow();
  ctx.showMainWindow("pet");
  ctx.sendWhenReady(win, "wageclaw:pet-command", payload);
}
ctx.sendPetCommandToMain = sendPetCommandToMain;

app.whenReady().then(async () => {
  const runtimeConfig = loadRuntimeConfig({ app });
  ctx.authService = createAuthService(runtimeConfig);
  ctx.updateService = createUpdateService(runtimeConfig, (status) => {
    ctx.sendWhenReady(ctx.mainWindow, "wageclaw:update-status", status);
  });
  require("./app-ipc.cjs")(ctx);

  ctx.ensureMainWindow();
  const initialSession = await ctx.authService.getSession();
  if (initialSession.authenticated) {
    ctx.startAuthenticatedShell();
  }
  ctx.showMainWindow("converter");

  ctx.updateService.initialize();
  setTimeout(() => {
    ctx.updateService.checkForUpdates().catch((error) => {
      console.error("[update] startup check failed:", error.message);
    });
  }, 3000);
});

app.on("activate", () => {
  if (ctx.appAuthenticated && ctx.petWindow && !ctx.petWindow.isDestroyed()) {
    ctx.petWindow.show();
  } else {
    ctx.showMainWindow("converter");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (ctx.tray) {
    ctx.tray.destroy();
    ctx.tray = null;
  }
});
