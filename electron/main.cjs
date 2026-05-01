const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

let mainWindow = null;
let widgetWindow = null;
let petWindow = null;
let blackoutWindow = null;
let petRicochetTimer = null;
let petStormTimer = null;
let petNukeTimer = null;

function updateDockVisibility() {
  if (process.platform === "darwin" && app.dock) {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      app.dock.show();
    } else {
      app.dock.hide();
    }
  }
}

function createMainWindow() {
  const win = new BrowserWindow({
    show: false,
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    title: "WageClaw",
    backgroundColor: "#101210",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(app.getAppPath(), "index.html"), {
    query: { view: "main" }
  });
  win.on("show", updateDockVisibility);
  win.on("hide", updateDockVisibility);
  win.on("closed", () => {
    mainWindow = null;
    updateDockVisibility();
  });
  return win;
}

function createWidgetWindow() {
  const width = 306;
  const height = 366;
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 18,
    y: workArea.y + 18,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    focusable: false,
    title: "WageClaw Widget",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  win.loadFile(path.join(app.getAppPath(), "index.html"), {
    query: { view: "widget" }
  });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.on("closed", () => {
    widgetWindow = null;
    if (!mainWindow || mainWindow.isDestroyed()) {
      app.quit();
    }
  });
  return win;
}

function createPetWindow() {
  const width = 260;
  const height = 300;
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 24,
    y: workArea.y + workArea.height - height - 24,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    title: "WageClaw Pet",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  win.loadFile(path.join(app.getAppPath(), "index.html"), {
    query: { view: "pet" }
  });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  ipcMain.on("wageclaw:pet-drag", (_, { dx, dy }) => {
    if (!win || win.isDestroyed()) return;
    const pos = win.getPosition();
    win.setPosition(pos[0] + dx, pos[1] + dy, true);
  });

  win.on("closed", () => {
    petWindow = null;
  });
  return win;
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

function sendPetCommandToMain(payload) {
  const win = ensureMainWindow();
  showMainWindow("pet");
  sendWhenReady(win, "wageclaw:pet-command", payload);
}

function triggerDesktopBlackout(payload = {}) {
  const duration = Math.max(2400, Number(payload.duration) || 4200);
  const automatic = Boolean(payload.automatic);
  if (blackoutWindow && !blackoutWindow.isDestroyed()) {
    blackoutWindow.close();
  }

  const { bounds } = screen.getPrimaryDisplay();
  blackoutWindow = new BrowserWindow({
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
    title: "WageClaw Blackout Ward",
    backgroundColor: "#000000",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  blackoutWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  try {
    blackoutWindow.setAlwaysOnTop(true, "screen-saver");
  } catch (error) {
    blackoutWindow.setAlwaysOnTop(true);
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
  const win = blackoutWindow;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  win.on("closed", () => {
    if (blackoutWindow === win) {
      blackoutWindow = null;
    }
  });

  setTimeout(() => {
    if (blackoutWindow === win && !win.isDestroyed()) {
      win.close();
    }
  }, duration);
}

function triggerPetRicochet() {
  togglePetWindow(true);
  if (!petWindow || petWindow.isDestroyed()) return false;
  const { workArea } = screen.getPrimaryDisplay();
  const [width, height] = petWindow.getSize();
  const maxX = workArea.x + workArea.width - width - 12;
  const maxY = workArea.y + workArea.height - height - 12;
  const minX = workArea.x + 12;
  const minY = workArea.y + 12;
  const points = [
    [minX, minY + Math.round(workArea.height * 0.16)],
    [maxX, minY],
    [minX + Math.round(workArea.width * 0.22), maxY],
    [maxX, minY + Math.round(workArea.height * 0.48)],
    [minX, maxY - Math.round(workArea.height * 0.12)],
    [workArea.x + workArea.width - width - 24, workArea.y + workArea.height - height - 24]
  ];
  let index = 0;
  clearInterval(petRicochetTimer);
  sendWhenReady(petWindow, "wageclaw:pet-command", { action: "ricochet", source: "desktop-ricochet" });
  petRicochetTimer = setInterval(() => {
    const point = points[index];
    petWindow.setPosition(point[0], point[1], true);
    index += 1;
    if (index >= points.length) {
      clearInterval(petRicochetTimer);
      petRicochetTimer = null;
    }
  }, 180);
  return true;
}

function triggerPetStorm() {
  togglePetWindow(true);
  if (!petWindow || petWindow.isDestroyed()) return false;
  const { workArea } = screen.getPrimaryDisplay();
  const [width, height] = petWindow.getSize();
  const centerX = workArea.x + Math.round(workArea.width / 2 - width / 2);
  const centerY = workArea.y + Math.round(workArea.height / 2 - height / 2);
  let step = 0;
  const totalSteps = 36;
  clearInterval(petStormTimer);
  sendWhenReady(petWindow, "wageclaw:pet-command", { action: "storm", source: "desktop-storm" });
  petStormTimer = setInterval(() => {
    const angle = (step / totalSteps) * Math.PI * 6;
    const radius = 60 + Math.sin(step * 0.4) * 40;
    const x = centerX + Math.round(Math.cos(angle) * radius);
    const y = centerY + Math.round(Math.sin(angle) * radius);
    petWindow.setPosition(x, y, true);
    step += 1;
    if (step >= totalSteps) {
      clearInterval(petStormTimer);
      petStormTimer = null;
    }
  }, 100);
  return true;
}

function triggerPetNuke() {
  togglePetWindow(true);
  if (!petWindow || petWindow.isDestroyed()) return false;
  const { workArea } = screen.getPrimaryDisplay();
  const [width, height] = petWindow.getSize();
  const centerX = workArea.x + Math.round(workArea.width / 2 - width / 2);
  const centerY = workArea.y + Math.round(workArea.height / 2 - height / 2);
  let step = 0;
  const totalSteps = 48;
  clearInterval(petNukeTimer);
  sendWhenReady(petWindow, "wageclaw:pet-command", { action: "nuke", source: "desktop-nuke" });
  petNukeTimer = setInterval(() => {
    const progress = step / totalSteps;
    let x, y;
    if (progress < 0.15) {
      x = centerX + Math.round((Math.random() - 0.5) * 300);
      y = centerY + Math.round((Math.random() - 0.5) * 300);
    } else if (progress < 0.4) {
      const angle = progress * Math.PI * 12;
      const radius = 200 - progress * 300;
      x = centerX + Math.round(Math.cos(angle) * radius);
      y = centerY + Math.round(Math.sin(angle) * radius);
    } else {
      const angle = progress * Math.PI * 8;
      const radius = 40 + (1 - progress) * 80;
      x = centerX + Math.round(Math.cos(angle) * radius);
      y = centerY + Math.round(Math.sin(angle) * radius);
    }
    petWindow.setPosition(x, y, true);
    step += 1;
    if (step >= totalSteps) {
      clearInterval(petNukeTimer);
      petNukeTimer = null;
    }
  }, 80);
  return true;
}

function ensureMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
  }
  return mainWindow;
}

function showMainWindow(screen) {
  const win = ensureMainWindow();
  const sendScreen = () => {
    if (screen) {
      win.webContents.send("wageclaw:navigate", { screen });
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
  if (!win.isVisible()) {
    win.show();
  }
  win.show();
  win.focus();
  updateDockVisibility();
}

function togglePetWindow(enabled) {
  if (enabled) {
    if (!petWindow || petWindow.isDestroyed()) {
      petWindow = createPetWindow();
    }
    petWindow.show();
    return true;
  }
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }
  return false;
}

app.whenReady().then(() => {
  showMainWindow("converter");

  ipcMain.handle("wageclaw:focus-screen", (_, screen) => {
    showMainWindow(screen);
    return { ok: true, screen };
  });

  ipcMain.handle("wageclaw:set-widget-on-top", (_, enabled) => {
    if (widgetWindow) {
      widgetWindow.setAlwaysOnTop(Boolean(enabled));
    }
    return { ok: true, enabled: Boolean(enabled) };
  });

  ipcMain.handle("wageclaw:open-main-panel", () => {
    showMainWindow("converter");
    return { ok: true };
  });

  ipcMain.handle("wageclaw:toggle-pet", (_, enabled) => {
    const visible = togglePetWindow(Boolean(enabled));
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-command", (_, payload) => {
    const command = payload || {};
    if (command.action === "duel") {
      if (petWindow && !petWindow.isDestroyed()) {
        const { workArea } = screen.getPrimaryDisplay();
        const duelW = 420;
        const duelH = 520;
        const posX = workArea.x + Math.round(workArea.width / 2 - duelW / 2);
        const posY = workArea.y + Math.round(workArea.height / 2 - duelH / 2);
        petWindow.setSize(duelW, duelH);
        petWindow.setPosition(posX, posY);
        petWindow.setAlwaysOnTop(true);
        petWindow.show();
        sendWhenReady(petWindow, "wageclaw:pet-command", command);
      }
    } else {
      sendPetCommandToMain(command);
    }
    return { ok: true };
  });

  ipcMain.handle("wageclaw:pet-resize", (_, { width, height }) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setSize(width || 260, height || 300);
    }
    return { ok: true };
  });

  ipcMain.handle("wageclaw:show-pet", () => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setSize(260, 300);
      const { workArea } = screen.getPrimaryDisplay();
      petWindow.setPosition(
        workArea.x + workArea.width - 260 - 24,
        workArea.y + workArea.height - 300 - 24
      );
      petWindow.show();
    }
    return { ok: true };
  });

  ipcMain.handle("wageclaw:trigger-blackout", (_, payload) => {
    triggerDesktopBlackout(payload || {});
    return { ok: true };
  });

  ipcMain.handle("wageclaw:pet-ricochet", () => {
    const visible = triggerPetRicochet();
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-storm", () => {
    const visible = triggerPetStorm();
    return { ok: true, visible };
  });

  ipcMain.handle("wageclaw:pet-nuke", () => {
    const visible = triggerPetNuke();
    return { ok: true, visible };
  });

  widgetWindow = createWidgetWindow();
  updateDockVisibility();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showMainWindow("converter");
      widgetWindow = createWidgetWindow();
      updateDockVisibility();
    } else {
      showMainWindow();
      if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.show();
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
