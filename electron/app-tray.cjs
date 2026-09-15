/**
 * 托盘与 Dock 可见性：托盘菜单构建、桌宠窗口显隐联动。
 */
module.exports = function createTrayModule(ctx) {
  const { app, Menu, Tray } = ctx;

  function updateDockVisibility() {
    if (process.platform === "darwin" && app.dock) {
      if (ctx.mainWindow && !ctx.mainWindow.isDestroyed() && ctx.mainWindow.isVisible()) {
        app.dock.show();
      } else {
        app.dock.hide();
      }
    }
  }

  function isPetWindowVisible() {
    return Boolean(ctx.petWindow && !ctx.petWindow.isDestroyed() && ctx.petWindow.isVisible());
  }

  function buildTrayMenu() {
    const petVisible = isPetWindowVisible();
    return Menu.buildFromTemplate([
      {
        label: "打开主界面",
        click: () => ctx.showMainWindow("converter")
      },
      {
        label: petVisible ? "隐藏桌宠" : "显示桌宠",
        click: () => {
          ctx.togglePetWindow(!petVisible);
          updateTrayMenu();
        }
      },
      {
        label: "桌面演出",
        submenu: [
          { label: "怨气弹跳", click: () => ctx.triggerPetRicochet() },
          { label: "怨气风暴", click: () => ctx.triggerPetStorm() },
          { label: "怨气核爆", click: () => ctx.triggerPetNuke() }
        ]
      },
      { type: "separator" },
      {
        label: "退出 WageClaw",
        click: ctx.quitApp
      }
    ]);
  }

  function updateTrayMenu() {
    if (!ctx.tray) return;
    ctx.tray.setContextMenu(buildTrayMenu());
  }

  function showTrayMenu() {
    if (!ctx.tray) return;
    updateTrayMenu();
    ctx.tray.popUpContextMenu();
  }

  function createTray() {
    if (ctx.tray) return ctx.tray;
    ctx.tray = new Tray(ctx.APP_ICON_PATH);
    ctx.tray.setToolTip("WageClaw 桌宠");
    ctx.tray.on("click", showTrayMenu);
    updateTrayMenu();
    return ctx.tray;
  }

  return {
    updateDockVisibility,
    isPetWindowVisible,
    buildTrayMenu,
    updateTrayMenu,
    showTrayMenu,
    createTray
  };
};
