module.exports = function createWindows(ctx) {
  const alive = win => win && !win.isDestroyed();
  function sendWhenReady(win, channel, payload) {
    if (!alive(win)) return;
    const send = () => { if (alive(win)) win.webContents.send(channel, payload); };
    if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send); else send();
  }
  function loadRenderer(win, view) {
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url === 'https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html') void ctx.shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', event => event.preventDefault());
    const loading = ctx.app.isPackaged
      ? win.loadFile(ctx.path.join(ctx.app.getAppPath(), 'dist', 'index.html'), { query: { view } })
      : win.loadURL(`${ctx.DEV_SERVER_URL}?view=${view}`);
    loading.catch(error => console.error('Renderer load:', error.message));
  }
  const webPreferences = () => ({ preload: ctx.path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true });
  function createBootstrapWindow() {
    const win = new ctx.BrowserWindow({ show: false, width: 1, height: 1, webPreferences: webPreferences() });
    ctx.bootstrapWindow = win; loadRenderer(win, 'bootstrap'); return win;
  }
  function showMainWindow(screen = 'home') {
    if (!alive(ctx.mainWindow)) {
      const bounds = ctx.panelBounds || { width: 1120, height: 790 };
      const win = new ctx.BrowserWindow({ ...bounds, minWidth: 390, minHeight: 540, show: false, title: '忍了吧 · 详情', backgroundColor: '#f8f9f5', autoHideMenuBar: true, icon: ctx.APP_ICON_PATH, webPreferences: webPreferences() });
      ctx.mainWindow = win;
      win.on('close', () => { ctx.panelBounds = win.getNormalBounds(); });
      win.on('closed', () => { ctx.mainWindow = null; ctx.service.setPanelBusy(false); });
      win.once('ready-to-show', () => { win.show(); win.focus(); });
      loadRenderer(win, 'main');
    } else { if (ctx.mainWindow.isMinimized()) ctx.mainWindow.restore(); ctx.mainWindow.show(); ctx.mainWindow.focus(); }
    sendWhenReady(ctx.mainWindow, 'lite:navigate', screen);
  }
  function clampPosition(x, y, size) {
    const area = ctx.screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) }).workArea;
    return { x: Math.min(area.x + area.width - size, Math.max(area.x, Math.round(x))), y: Math.min(area.y + area.height - size, Math.max(area.y, Math.round(y))) };
  }
  function syncPetWindow() {
    const pet = ctx.store.state.settings.pet;
    if (!pet.visible) { if (alive(ctx.petWindow)) ctx.petWindow.hide(); hideHover(0); ctx.service?.dismiss(); return; }
    if (!alive(ctx.petWindow)) {
      const win = new ctx.BrowserWindow({ width: pet.size, height: pet.size, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, alwaysOnTop: pet.onTop, skipTaskbar: true, focusable: false, title: '忍了吧 · 桌宠', webPreferences: webPreferences() });
      ctx.petWindow = win;
      win.on('closed', () => { ctx.petWindow = null; });
      win.once('ready-to-show', () => { if (ctx.store.state.settings.pet.visible) win.showInactive(); });
      loadRenderer(win, 'pet');
    }
    const area = ctx.screen.getPrimaryDisplay().workArea;
    const pos = clampPosition(pet.x ?? area.x + area.width - pet.size - 36, pet.y ?? area.y + area.height - pet.size - 36, pet.size);
    ctx.petWindow.setBounds({ ...pos, width: pet.size, height: pet.size });
    ctx.petWindow.setAlwaysOnTop(pet.onTop);
    if (!ctx.petWindow.webContents.isLoading()) ctx.petWindow.showInactive();
  }
  function showBubble() {
    if (!alive(ctx.petWindow)) return;
    const pet = ctx.petWindow.getBounds();
    const area = ctx.screen.getDisplayMatching(pet).workArea;
    const width = 290, height = 104;
    const x = Math.max(area.x, Math.min(area.x + area.width - width, pet.x + pet.width / 2 - width / 2));
    const y = pet.y - height - 8 >= area.y ? pet.y - height - 8 : Math.min(area.y + area.height - height, pet.y + pet.height + 8);
    if (!alive(ctx.bubbleWindow)) {
      const win = new ctx.BrowserWindow({ width, height, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, alwaysOnTop: ctx.store.state.settings.pet.onTop, skipTaskbar: true, focusable: false, webPreferences: webPreferences() });
      ctx.bubbleWindow = win;
      win.on('closed', () => { ctx.bubbleWindow = null; });
      win.once('ready-to-show', () => { if (ctx.service.snapshot().bubble) win.showInactive(); });
      loadRenderer(win, 'bubble');
    }
    ctx.bubbleWindow.setPosition(Math.round(x), Math.round(y));
    if (!ctx.bubbleWindow.webContents.isLoading()) ctx.bubbleWindow.showInactive();
    // 气泡和悬停浮层都在桌宠上方，气泡出现时把浮层挪到下方避让。
    if (alive(ctx.hoverWindow)) showHover();
  }
  const HOVER_WIDTH = 280, HOVER_HEIGHT = 158;
  let hoverHideTimer = null;
  function destroyHover() {
    if (alive(ctx.hoverWindow)) ctx.hoverWindow.destroy();
    ctx.hoverWindow = null;
  }
  function showHover() {
    clearTimeout(hoverHideTimer); hoverHideTimer = null;
    if (!alive(ctx.petWindow) || !ctx.store.state.settings.pet.visible) return;
    const pet = ctx.petWindow.getBounds();
    const area = ctx.screen.getDisplayMatching(pet).workArea;
    const x = Math.max(area.x, Math.min(area.x + area.width - HOVER_WIDTH, Math.round(pet.x + pet.width / 2 - HOVER_WIDTH / 2)));
    const above = pet.y - HOVER_HEIGHT - 8, below = pet.y + pet.height + 8;
    // 没有气泡时优先在桌宠上方；有气泡时让位到下方。
    const preferAbove = !ctx.service?.snapshot().bubble;
    let y;
    if (preferAbove && above >= area.y) y = above;
    else if (below + HOVER_HEIGHT <= area.y + area.height) y = below;
    else y = Math.max(area.y, Math.min(area.y + area.height - HOVER_HEIGHT, above));
    if (!alive(ctx.hoverWindow)) {
      const win = new ctx.BrowserWindow({ width: HOVER_WIDTH, height: HOVER_HEIGHT, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, alwaysOnTop: ctx.store.state.settings.pet.onTop, skipTaskbar: true, focusable: false, title: '忍了吧 · 今日', webPreferences: webPreferences() });
      ctx.hoverWindow = win;
      win.on('closed', () => { ctx.hoverWindow = null; });
      win.once('ready-to-show', () => { if (ctx.hoverWindow === win && ctx.store.state.settings.pet.visible) win.showInactive(); });
      loadRenderer(win, 'hover');
    }
    ctx.hoverWindow.setPosition(Math.round(x), Math.round(y));
    ctx.hoverWindow.setAlwaysOnTop(ctx.store.state.settings.pet.onTop);
    if (!ctx.hoverWindow.webContents.isLoading()) ctx.hoverWindow.showInactive();
  }
  // 延迟销毁给鼠标从桌宠移到浮层留出时间；期间重新进入会取消。
  function hideHover(delay = 0) {
    clearTimeout(hoverHideTimer); hoverHideTimer = null;
    if (!delay) { destroyHover(); return; }
    hoverHideTimer = setTimeout(destroyHover, delay);
  }
  let drag = null;
  function dragPet(kind, payload) {
    if (!alive(ctx.petWindow)) return;
    if (kind === 'start') {
      const cursor = ctx.screen.getCursorScreenPoint(), position = ctx.petWindow.getPosition();
      drag = { cursor, position }; ctx.service.setDragging(true); hideHover(0);
    } else if (kind === 'move' && drag && Number.isFinite(payload?.x) && Number.isFinite(payload?.y)) {
      const pos = clampPosition(drag.position[0] + payload.x - drag.cursor.x, drag.position[1] + payload.y - drag.cursor.y, ctx.store.state.settings.pet.size);
      ctx.petWindow.setPosition(pos.x, pos.y);
    } else if (kind === 'end' && drag) {
      drag = null; const [x, y] = ctx.petWindow.getPosition();
      ctx.service.setDragging(false);
      ctx.service.apply({ ...ctx.store.state.settings, pet: { ...ctx.store.state.settings.pet, x, y } });
    }
  }
  return { sendWhenReady, loadRenderer, createBootstrapWindow, showMainWindow, syncPetWindow, showBubble, showHover, hideHover, dragPet };
};
