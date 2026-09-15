/**
 * IPC 通道注册：渲染进程可触达的全部主进程能力。
 * 加固原则：入参一律校验/夹取；窗口类 send 通道校验 event.sender；
 * 涉及屏幕导航的值走 allowlist，防止任意字符串进入导航广播。
 */
const fsPromises = require("node:fs/promises");

const VALID_SCREENS = new Set(["converter", "mall", "pet", "settings"]);

module.exports = function registerIpcHandlers(ctx) {
  const { ipcMain, screen, dialog } = ctx;
  const { authService, updateService } = ctx;

  ipcMain.handle("wageclaw:auth:get-session", () => authService.getSession());
  ipcMain.handle("wageclaw:auth:sign-up", async (_, payload) => {
    const result = await authService.signUp(payload && typeof payload === "object" ? payload : {});
    if (result.authenticated) ctx.startAuthenticatedShell();
    return result;
  });
  ipcMain.handle("wageclaw:auth:sign-in", async (_, payload) => {
    const result = await authService.signIn(payload && typeof payload === "object" ? payload : {});
    if (result.authenticated) ctx.startAuthenticatedShell();
    return result;
  });
  ipcMain.handle("wageclaw:auth:sign-out", async () => {
    const result = await authService.signOut();
    ctx.stopAuthenticatedShell();
    return result;
  });
  ipcMain.handle("wageclaw:auth:password-reset", (_, email) => {
    return authService.requestPasswordReset(typeof email === "string" ? email : "");
  });

  ipcMain.handle("wageclaw:update:get-state", () => updateService.getState());
  ipcMain.handle("wageclaw:update:check", () => updateService.checkForUpdates());
  ipcMain.handle("wageclaw:update:download-install", () => updateService.downloadAndInstall());

  ipcMain.handle("wageclaw:focus-screen", (_, targetScreen) => {
    if (typeof targetScreen !== "string" || !VALID_SCREENS.has(targetScreen)) {
      return { ok: false };
    }
    ctx.showMainWindow(targetScreen);
    return { ok: true, screen: targetScreen };
  });

  ipcMain.handle("wageclaw:export-backup", async (_, contents) => {
    if (typeof contents !== "string" || contents.length === 0 || contents.length > 20 * 1024 * 1024) {
      return { ok: false, message: "备份内容无效" };
    }
    const result = await dialog.showSaveDialog({
      title: "导出 WageClaw 备份",
      defaultPath: `wageclaw-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }
    await fsPromises.writeFile(result.filePath, contents, "utf-8");
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle("wageclaw:open-main-panel", () => {
    ctx.showMainWindow("converter");
    return { ok: true };
  });

  ipcMain.handle("wageclaw:toggle-pet", (_, enabled) => {
    const visible = ctx.togglePetWindow(Boolean(enabled));
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-command", (_, payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false };
    }
    ctx.sendPetCommandToMain(payload);
    return { ok: true };
  });

  // 悬浮窗按内容自适应尺寸：夹取到合理区间，防止异常尺寸把窗口变没
  ipcMain.handle("wageclaw:pet-resize", (_, payload) => {
    const size = payload && typeof payload === "object" ? payload : {};
    const width = clampNumber(size.width, 120, 800, 200);
    const height = clampNumber(size.height, 120, 900, 320);
    if (ctx.petWindow && !ctx.petWindow.isDestroyed()) {
      ctx.petWindow.setSize(width, height);
    }
    return { ok: true, width, height };
  });

  ipcMain.on("wageclaw:pet-hit-test", (event, interactive) => {
    if (!ctx.petWindow || ctx.petWindow.isDestroyed() || event.sender !== ctx.petWindow.webContents) return;
    ctx.petWindow.setIgnoreMouseEvents(!interactive, { forward: true });
  });

  ipcMain.on("wageclaw:pet-drag-start", (event, payload = {}) => {
    if (!ctx.petWindow || ctx.petWindow.isDestroyed() || event.sender !== ctx.petWindow.webContents) return;
    ctx.clearPetMotionTimers();
    const [windowX, windowY] = ctx.petWindow.getPosition();
    ctx.petWindowDrag = {
      windowX,
      windowY,
      screenX: Number(payload.screenX) || 0,
      screenY: Number(payload.screenY) || 0
    };
  });

  ipcMain.on("wageclaw:pet-drag", (event, payload = {}) => {
    if (!ctx.petWindow || ctx.petWindow.isDestroyed() || event.sender !== ctx.petWindow.webContents) return;
    if (ctx.petWindowDrag && Number.isFinite(Number(payload.screenX)) && Number.isFinite(Number(payload.screenY))) {
      const x = ctx.petWindowDrag.windowX + Math.round(Number(payload.screenX) - ctx.petWindowDrag.screenX);
      const y = ctx.petWindowDrag.windowY + Math.round(Number(payload.screenY) - ctx.petWindowDrag.screenY);
      ctx.petWindow.setPosition(x, y, false);
      return;
    }

    const pos = ctx.petWindow.getPosition();
    ctx.petWindow.setPosition(pos[0] + (Number(payload.dx) || 0), pos[1] + (Number(payload.dy) || 0), false);
  });

  ipcMain.on("wageclaw:pet-drag-end", (event) => {
    if (!ctx.petWindow || ctx.petWindow.isDestroyed() || event.sender !== ctx.petWindow.webContents) return;
    ctx.petWindowDrag = null;
  });

  ipcMain.handle("wageclaw:show-pet", () => {
    if (!ctx.appAuthenticated) return { ok: false, visible: false };
    if (!ctx.petWindow || ctx.petWindow.isDestroyed()) {
      ctx.petWindow = ctx.createPetWindow();
    }
    ctx.petWindow.setSize(240, 340);
    const { workArea } = screen.getPrimaryDisplay();
    ctx.petWindow.setPosition(
      workArea.x + workArea.width - 260,
      workArea.y + workArea.height - 360
    );
    ctx.petWindow.show();
    return { ok: true };
  });

  ipcMain.handle("wageclaw:trigger-blackout", (_, payload) => {
    ctx.triggerDesktopBlackout(payload && typeof payload === "object" ? payload : {});
    return { ok: true };
  });

  ipcMain.handle("wageclaw:pet-ricochet", () => {
    const visible = ctx.triggerPetRicochet();
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-storm", () => {
    const visible = ctx.triggerPetStorm();
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-nuke", () => {
    const visible = ctx.triggerPetNuke();
    return { ok: true, visible };
  });

  ipcMain.on("wageclaw:close-main-window", () => {
    if (ctx.mainWindow && !ctx.mainWindow.isDestroyed()) {
      ctx.mainWindow.close();
    }
  });

  ipcMain.on("wageclaw:minimize-main-window", () => {
    if (ctx.mainWindow && !ctx.mainWindow.isDestroyed()) {
      ctx.mainWindow.minimize();
    }
  });

  ipcMain.on("wageclaw:maximize-main-window", () => {
    if (ctx.mainWindow && !ctx.mainWindow.isDestroyed()) {
      if (ctx.mainWindow.isMaximized()) {
        ctx.mainWindow.unmaximize();
      } else {
        ctx.mainWindow.maximize();
      }
    }
  });
};

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}
