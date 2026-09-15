/**
 * 认证后的应用外壳：托盘 + 桌宠窗口的启动/停止，以及受控退出。
 */
module.exports = function createShell(ctx) {
  function startAuthenticatedShell() {
    ctx.appAuthenticated = true;
    ctx.createTray();
    if (!ctx.petWindow || ctx.petWindow.isDestroyed()) {
      ctx.petWindow = ctx.createPetWindow();
    }
    ctx.petWindow.show();
    ctx.updateTrayMenu();
    ctx.updateDockVisibility();
  }

  function stopAuthenticatedShell() {
    ctx.appAuthenticated = false;
    ctx.clearPetMotionTimers();
    if (ctx.petWindow && !ctx.petWindow.isDestroyed()) {
      ctx.petWindow.destroy();
    }
    ctx.petWindow = null;
    if (ctx.tray) {
      ctx.tray.destroy();
      ctx.tray = null;
    }
    ctx.updateDockVisibility();
  }

  function quitApp() {
    ctx.app.isQuitting = true;
    ctx.clearPetMotionTimers();
    if (ctx.blackoutWindow && !ctx.blackoutWindow.isDestroyed()) {
      ctx.blackoutWindow.close();
    }
    if (ctx.tray) {
      ctx.tray.destroy();
      ctx.tray = null;
    }
    ctx.app.quit();
  }

  function togglePetWindow(enabled) {
    if (!ctx.appAuthenticated) return false;
    if (enabled) {
      if (!ctx.petWindow || ctx.petWindow.isDestroyed()) {
        ctx.petWindow = ctx.createPetWindow();
      }
      ctx.petWindow.show();
      return true;
    }
    if (ctx.petWindow && !ctx.petWindow.isDestroyed()) {
      ctx.petWindow.hide();
    }
    return false;
  }

  return {
    startAuthenticatedShell,
    stopAuthenticatedShell,
    quitApp,
    togglePetWindow
  };
};
