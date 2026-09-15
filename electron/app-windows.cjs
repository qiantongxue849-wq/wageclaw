/**
 * 窗口管理：主窗口 / 桌宠悬浮窗 / 黑屏结界的创建与渲染加载。
 * 全部函数通过共享上下文 ctx 读写窗口引用（ctx.mainWindow / ctx.petWindow / ctx.blackoutWindow）。
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = function createWindows(ctx) {
  const { app, BrowserWindow, screen } = ctx;
  const { path } = ctx;

  function createMainWindow() {
    const win = new BrowserWindow({
      show: false,
      width: 1020,
      height: 680,
      minWidth: 860,
      minHeight: 560,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      autoHideMenuBar: true,
      title: "忍了吧 WageClaw",
      icon: ctx.APP_ICON_PATH,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    loadRenderer(win, { view: "main" });
    win.on("show", () => {
      ctx.updateDockVisibility();
      ctx.notifyPetMainVisibility(true);
    });
    win.on("hide", () => {
      ctx.updateDockVisibility();
      ctx.notifyPetMainVisibility(false);
    });
    win.on("closed", () => {
      ctx.mainWindow = null;
      ctx.notifyPetMainVisibility(false);
      ctx.updateDockVisibility();
    });
    return win;
  }

  function createPetWindow() {
    const winW = 430;
    const winH = 320;
    const { workArea } = screen.getPrimaryDisplay();
    const defaultX = workArea.x + workArea.width - winW - 60;
    const defaultY = workArea.y + workArea.height - winH - 80;
    const centeredX = workArea.x + Math.round((workArea.width - winW) / 2);
    const centeredY = workArea.y + Math.round((workArea.height - winH) / 2);
    const win = new BrowserWindow({
      width: winW,
      height: winH,
      x: ctx.PET_CENTER_PREVIEW ? centeredX : defaultX,
      y: ctx.PET_CENTER_PREVIEW ? centeredY : defaultY,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      title: "忍了吧桌宠",
      backgroundColor: "#00000001",
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false
      }
    });

    loadRenderer(win, { view: "float" });
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.webContents.once("did-finish-load", () => {
      if (!win.isDestroyed()) {
        win.show();
        win.moveTop();
      }
    });

    win.on("show", ctx.updateTrayMenu);
    win.on("hide", ctx.updateTrayMenu);
    win.on("closed", () => {
      ctx.petWindow = null;
      ctx.updateTrayMenu();
    });
    return win;
  }

  function loadRenderer(win, query = {}) {
    const params = new URLSearchParams(query).toString();
    if (!app.isPackaged) {
      win.loadURL(`${ctx.DEV_SERVER_URL}${params ? `?${params}` : ""}`);
      return;
    }

    const filePath = path.join(app.getAppPath(), "dist", "index.html");
    console.log("[loadRenderer] loading:", filePath, "query:", query);
    win.loadFile(filePath, { query }).catch((err) => {
      console.error("[loadRenderer] loadFile failed:", err.message);
      win.loadURL(`data:text/html,<h1>加载失败</h1><pre>${escapeHtml(err.message)}</pre>`);
    });

    win.webContents.on("did-fail-load", (_, code, desc) => {
      console.error("[loadRenderer] did-fail-load:", code, desc);
    });
  }

  function sendWhenReady(win, channel, payload) {
    if (!win || win.isDestroyed()) return;
    const send = () => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    };
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }
  }

  function notifyPetMainVisibility(visible) {
    sendWhenReady(ctx.petWindow, "wageclaw:main-visibility", { visible: Boolean(visible) });
  }

  function ensureMainWindow() {
    if (!ctx.mainWindow || ctx.mainWindow.isDestroyed()) {
      ctx.mainWindow = createMainWindow();
    }
    return ctx.mainWindow;
  }

  function showMainWindow(targetScreen) {
    const win = ensureMainWindow();
    const sendScreen = () => {
      if (targetScreen && !win.isDestroyed()) {
        win.webContents.send("wageclaw:navigate", { screen: targetScreen });
      }
    };

    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", sendScreen);
    } else {
      sendScreen();
    }

    if (win.isMinimized()) {
      win.restore();
    }
    win.show();
    win.focus();
    ctx.notifyPetMainVisibility(true);
    ctx.updateDockVisibility();
  }

  function triggerDesktopBlackout(payload = {}) {
    // 时长夹取：下限防闪屏，上限防「永久黑屏」型滥用
    const duration = Math.min(15000, Math.max(2400, Number(payload.duration) || 4200));
    const automatic = Boolean(payload.automatic);
    if (ctx.blackoutWindow && !ctx.blackoutWindow.isDestroyed()) {
      ctx.blackoutWindow.close();
    }

    const { bounds } = screen.getPrimaryDisplay();
    const win = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: false,
      resizable: false,
      movable: false,
      fullscreenable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      title: "忍了吧黑屏结界",
      backgroundColor: "#000000",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    ctx.blackoutWindow = win;

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    try {
      win.setAlwaysOnTop(true, "screen-saver");
    } catch {
      win.setAlwaysOnTop(true);
    }

    const subtitle = automatic
      ? "每日怨气过载，世界静音中。你先呼吸。"
      : "黑屏结界已展开，离谱需求临时隔离。";
    const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #020202; color: #f7f1e8; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
  body { display: grid; place-items: center; }
  body::before, body::after { content: ""; position: fixed; inset: -18%; pointer-events: none; }
  body::before { background: radial-gradient(circle at 50% 45%, rgba(255,118,93,.22), transparent 18%), radial-gradient(circle at 50% 50%, rgba(101,216,209,.14), transparent 32%), rgba(0,0,0,.96); animation: pulse 1.8s ease-in-out infinite; }
  body::after { background-image: linear-gradient(115deg, transparent 0 46%, rgba(255,255,255,.18) 47%, transparent 49% 100%), linear-gradient(65deg, transparent 0 53%, rgba(255,118,93,.28) 54%, transparent 56% 100%); background-size: 220px 220px, 260px 260px; opacity: .34; mix-blend-mode: screen; animation: drift 1.1s linear infinite; }
  main { position: relative; z-index: 1; display: grid; gap: 12px; text-align: center; padding: 32px 46px; border: 1px solid rgba(255,255,255,.14); border-radius: 24px; background: rgba(6,8,10,.52); box-shadow: 0 0 80px rgba(255,118,93,.2), inset 0 0 42px rgba(101,216,209,.08); backdrop-filter: blur(18px); }
  strong { font-size: clamp(36px, 7vw, 96px); letter-spacing: .16em; text-shadow: 0 0 28px rgba(255,118,93,.56); }
  p { margin: 0; color: rgba(247,241,232,.72); font-size: clamp(15px, 2vw, 22px); }
  i { width: 280px; height: 4px; justify-self: center; border-radius: 99px; overflow: hidden; background: rgba(255,255,255,.12); }
  i::before { content: ""; display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #65d8d1, #ff765d, #dff36c); transform-origin: left; animation: drain ${duration}ms linear forwards; }
  @keyframes pulse { 50% { filter: brightness(1.35); transform: scale(1.02); } }
  @keyframes drift { to { transform: translate3d(70px, -42px, 0); } }
  @keyframes drain { to { transform: scaleX(0); } }
</style>
<body>
  <main>
    <strong>黑屏结界</strong>
    <p>${subtitle}</p>
    <i></i>
  </main>
</body>
</html>`;
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    win.on("closed", () => {
      if (ctx.blackoutWindow === win) {
        ctx.blackoutWindow = null;
      }
    });

    setTimeout(() => {
      if (ctx.blackoutWindow === win && !win.isDestroyed()) {
        win.close();
      }
    }, duration);
  }

  return {
    createMainWindow,
    createPetWindow,
    loadRenderer,
    sendWhenReady,
    notifyPetMainVisibility,
    ensureMainWindow,
    showMainWindow,
    triggerDesktopBlackout
  };
};
