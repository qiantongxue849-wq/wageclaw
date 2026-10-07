module.exports = function createWindows(ctx) {
  const alive = win => win && !win.isDestroyed();
  function sendWhenReady(win, channel, payload) {
    if (!alive(win)) return;
    const send = () => { if (alive(win)) win.webContents.send(channel, payload); };
    if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send); else send();
  }
  // 加载失败时 Chromium 会停在自己的错误页，表现为「窗口打开了但一片空白」。
  // 这里换成一句能自救的提示，别让这种情况变成哑失败。
  const escapeHtml = text => String(text).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  // 开发时 Vite 常常比 Electron 慢几秒（尤其刚 npm run dev），窗口先到就会撞上连接被拒。
  // 这类错误值得静默重试；其它错误（如 ERR_ABORTED）重试只会打转，直接报出来。
  const RETRYABLE_LOAD_ERRORS = new Set(['ERR_CONNECTION_REFUSED', 'ERR_CONNECTION_RESET', 'ERR_CONNECTION_FAILED', 'ERR_CONNECTION_CLOSED', 'ERR_CONNECTION_TIMED_OUT', 'ERR_EMPTY_RESPONSE', 'ERR_ADDRESS_UNREACHABLE', 'ERR_NAME_NOT_RESOLVED']);
  const DEV_LOAD_ATTEMPTS = 5;
  const DEV_LOAD_RETRY_MS = 700;
  // 气泡与悬停浮层是按内容收紧的装饰性小窗：它们本就反复出现、消失，
  // 「没出现」是完全正常的状态。把 440px 宽的说明页塞进这么小的窗只会被裁成乱码，
  // 反而比空白更糟。这两类窗口失败就安静地不显示 —— 窗口被 dismiss() 销毁后
  // 下次播报会重新创建，届时服务器若已恢复就自然好了。
  // 说明页只渲染到能读它的窗口：main（内容区 287×183，为上一版 573×365 的一半）与 bootstrap。
  const DECORATIVE_VIEWS = new Set(['bubble', 'hover']);
  // 判断加载成功与否只能靠自己记标志位，实测（失败加载的事件顺序）：
  //   did-fail-load(79ms) → dom-ready → did-finish-load(87ms) → ready-to-show(90ms)
  // 两个坑：`did-finish-load` 在失败时**同样会触发**，不能当成功信号；
  // `webContents.getURL()` 在失败时返回的仍是**请求的 URL**，不是 chrome-error://。
  // 只有 `did-fail-load` 可靠，且它先于 ready-to-show，记标志位不存在竞态。
  function trackLoadFailure(win) {
    win.webContents.on('did-fail-load', (event, code, _description, _url, isMainFrame) => {
      // 新版 Electron 把参数收进了事件对象，两处都兜住。
      const errorCode = code ?? event?.errorCode;
      const mainFrame = isMainFrame ?? event?.isMainFrame ?? true;
      // -3 是 ERR_ABORTED：正常导航被新导航取代，不是失败。
      if (mainFrame && errorCode !== -3) win.__loadFailed = true;
    });
  }
  function showLoadFailure(win, view, reason) {
    const hint = ctx.app.isPackaged
      ? '应用自带的前端资源没能加载，建议重新安装。'
      : `开发服务器没有响应（${ctx.DEV_SERVER_URL}）。先在项目里运行 npm run dev，再关掉这个窗口重新双击桌宠；桌宠没出现的话，重启一下应用。`;
    const page = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>忍了吧 · 加载失败</title>
<style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#f8f9f5;color:#304738;font-family:"PingFang SC","Microsoft YaHei",sans-serif}main{max-width:440px;padding:26px 30px;border:1px solid #dce4d8;border-radius:14px;background:#fff;box-shadow:0 2px 10px #1b35221a}h1{margin:0 0 12px;font-size:17px}p{margin:0 0 8px;font-size:13px;line-height:1.7;color:#5c7360}code{padding:1px 6px;border-radius:5px;background:#eef2e9;font-size:12px;word-break:break-all}</style>
</head><body><main><h1>这个窗口没能加载内容</h1><p>${hint}</p><p>视图 <code>${escapeHtml(view)}</code></p><p>原始错误 <code>${escapeHtml(reason)}</code></p></main></body></html>`;
    win.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`).catch(() => undefined);
  }
  function loadRenderer(win, view) {
    trackLoadFailure(win);
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url === 'https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html') void ctx.shell.openExternal(url);
      return { action: 'deny' };
    });
    // 只放行同源导航：既要拦住跳外站，也不能拦掉 Vite 的整页刷新
    // （早期写成无条件 preventDefault，导致开发时 HMR 整页刷新被静默阻止、页面卡在「导航中」）。
    win.webContents.on('will-navigate', (event, url) => {
      const sameOrigin = ctx.app.isPackaged ? url.startsWith('file://') : url.startsWith(ctx.DEV_SERVER_URL);
      if (!sameOrigin) event.preventDefault();
    });
    const attempts = ctx.app.isPackaged ? 1 : DEV_LOAD_ATTEMPTS;
    let attempt = 0;
    const attemptLoad = () => {
      attempt += 1;
      win.__loadFailed = false;
      const loading = ctx.app.isPackaged
        ? win.loadFile(ctx.path.join(ctx.app.getAppPath(), 'dist', 'index.html'), { query: { view } })
        : win.loadURL(`${ctx.DEV_SERVER_URL}?view=${view}`);
      loading.catch(error => {
        if (!alive(win)) return;
        if (attempt < attempts && RETRYABLE_LOAD_ERRORS.has(error.code)) {
          setTimeout(() => { if (alive(win)) attemptLoad(); }, DEV_LOAD_RETRY_MS);
          return;
        }
        console.error('Renderer load:', error.message);
        if (DECORATIVE_VIEWS.has(view)) return;
        // 桌宠窗口是透明的、尺寸由用户设定（默认 128），说明页塞进去同样读不清 ——
        // 与其显示一张糊掉的卡片，不如把解释放到能读它的详情面板里。
        // （`npm run electron` 只启动 Electron、不启动 Vite，所以这个场景很常见。）
        if (view === 'pet') { showMainWindow(); return; }
        showLoadFailure(win, view, error.message);
      });
    };
    attemptLoad();
  }
  const webPreferences = () => ({ preload: ctx.path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true });
  function createBootstrapWindow() {
    const win = new ctx.BrowserWindow({ show: false, width: 1, height: 1, webPreferences: webPreferences() });
    ctx.bootstrapWindow = win; loadRenderer(win, 'bootstrap'); return win;
  }
  function captionColors(theme) {
    return theme === 'dark'
      ? { color: '#29241f', symbolColor: '#f0e5d5' }
      : { color: '#fffcf5', symbolColor: '#563f2d' };
  }
  function syncCaption() {
    const win = ctx.mainWindow;
    if (process.platform !== 'win32' || !alive(win)) return;
    const colors = captionColors(ctx.store?.state?.settings?.theme);
    win.setBackgroundColor(colors.color);
  }
  function showMainWindow(screen = 'home') {
    if (!alive(ctx.mainWindow)) {
      const bounds = ctx.panelBounds || { width: 287, height: 183 };
      const colors = captionColors(ctx.store?.state?.settings?.theme);
      const win = new ctx.BrowserWindow({
        width: bounds.width, height: bounds.height, ...(Number.isFinite(bounds.x) ? { x: bounds.x, y: bounds.y } : {}),
        useContentSize: !ctx.panelBounds, minWidth: 280, minHeight: 176, show: false, title: '忍了吧 · 详情',
        backgroundColor: colors.color, autoHideMenuBar: true, icon: ctx.APP_ICON_PATH,
        ...(process.platform === 'win32' ? { titleBarStyle: 'hidden', titleBarOverlay: false } : {}),
        webPreferences: webPreferences()
      });
      win.setMenu(null);
      ctx.mainWindow = win;
      const sendWindowState = () => { if (alive(win)) win.webContents.send('lite:window-state', { maximized: win.isMaximized() }); };
      win.on('maximize', sendWindowState);
      win.on('unmaximize', sendWindowState);
      // 重开沿用外框尺寸，避免 Windows DPI 取整使内容区逐次缩小；最大化时记住还原尺寸。
      win.on('close', () => { ctx.panelBounds = win.getNormalBounds(); });
      win.on('closed', () => { ctx.mainWindow = null; ctx.service.setPanelBusy(false); });
      const reveal = () => { if (alive(win)) { win.show(); win.focus(); } };
      win.once('ready-to-show', reveal);
      win.webContents.once('did-finish-load', reveal);
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
      win.once('ready-to-show', () => { if (ctx.store.state.settings.pet.visible && !win.__loadFailed) win.showInactive(); });
      loadRenderer(win, 'pet');
    }
    const area = ctx.screen.getPrimaryDisplay().workArea;
    const pos = clampPosition(pet.x ?? area.x + area.width - pet.size - 36, pet.y ?? area.y + area.height - pet.size - 36, pet.size);
    ctx.petWindow.setBounds({ ...pos, width: pet.size, height: pet.size });
    ctx.petWindow.setAlwaysOnTop(pet.onTop);
    // 加载失败时别把一个空的透明窗摆在桌面上 —— 它既没用也挡不住任何东西，还容易被误当成幽灵窗。
    if (!ctx.petWindow.webContents.isLoading() && !ctx.petWindow.__loadFailed) ctx.petWindow.showInactive();
  }
  let bubbleSize = { width: 260, height: 48 }, hoverSize = { width: 200, height: 112 };
  function popupBounds(size) {
    const pet = ctx.petWindow.getBounds();
    const area = ctx.screen.getDisplayMatching(pet).workArea;
    const width = Math.min(area.width, size.width), height = Math.min(area.height, size.height);
    const x = Math.max(area.x, Math.min(area.x + area.width - width, pet.x + pet.width / 2 - width / 2));
    const above = pet.y - height - 8, below = pet.y + pet.height + 8;
    const y = above >= area.y ? above : below + height <= area.y + area.height ? below : Math.max(area.y, Math.min(area.y + area.height - height, above));
    return { x: Math.round(x), y: Math.round(y), width, height };
  }
  function resizePopup(sender, size) {
    const win = [ctx.bubbleWindow, ctx.hoverWindow].find(w => alive(w) && w.webContents === sender);
    if (!win || !alive(ctx.petWindow)) throw new Error('Popup only');
    if (!Number.isFinite(size?.width) || !Number.isFinite(size?.height)) throw new Error('Invalid popup size');
    const next = { width: Math.max(96, Math.min(292, Math.ceil(size.width))), height: Math.max(36, Math.min(200, Math.ceil(size.height))) };
    if (win === ctx.bubbleWindow) bubbleSize = next; else hoverSize = next;
    const bounds = popupBounds(next), previous = win.getBounds();
    if (Object.keys(bounds).some(key => bounds[key] !== previous[key])) win.setBounds(bounds);
  }
  function showBubble() {
    if (!alive(ctx.petWindow)) return;
    const bounds = popupBounds(bubbleSize);
    const { width, height } = bounds;
    if (!alive(ctx.bubbleWindow)) {
      const win = new ctx.BrowserWindow({ width, height, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, alwaysOnTop: ctx.store.state.settings.pet.onTop, skipTaskbar: true, focusable: false, webPreferences: webPreferences() });
      ctx.bubbleWindow = win;
      win.on('closed', () => { ctx.bubbleWindow = null; });
      win.once('ready-to-show', () => { if (ctx.service.snapshot().bubble && !win.__loadFailed) win.showInactive(); });
      loadRenderer(win, 'bubble');
    }
    ctx.bubbleWindow.setBounds(bounds);
    if (!ctx.bubbleWindow.webContents.isLoading() && !ctx.bubbleWindow.__loadFailed) ctx.bubbleWindow.showInactive();
    // 同一时间只留一个小窗。气泡优先，悬停卡先收起；鼠标若还在桌宠上，气泡关掉后再出现。
    destroyHover();
  }
  let hoverHold = false;
  let hoverHideTimer = null;
  function destroyHover() {
    if (alive(ctx.hoverWindow)) ctx.hoverWindow.destroy();
    ctx.hoverWindow = null;
  }
  function showHover() {
    clearTimeout(hoverHideTimer); hoverHideTimer = null;
    if (!alive(ctx.petWindow) || !ctx.store.state.settings.pet.visible) return;
    hoverHold = true;
    if (ctx.service?.snapshot().bubble) { destroyHover(); return; }
    const bounds = popupBounds(hoverSize);
    if (!alive(ctx.hoverWindow)) {
      const win = new ctx.BrowserWindow({ width: bounds.width, height: bounds.height, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, maximizable: false, minimizable: false, fullscreenable: false, alwaysOnTop: ctx.store.state.settings.pet.onTop, skipTaskbar: true, focusable: false, title: '忍了吧 · 今日', webPreferences: webPreferences() });
      ctx.hoverWindow = win;
      win.on('closed', () => { ctx.hoverWindow = null; });
      win.once('ready-to-show', () => { if (ctx.hoverWindow === win && ctx.store.state.settings.pet.visible && !win.__loadFailed) win.showInactive(); });
      loadRenderer(win, 'hover');
    }
    ctx.hoverWindow.setBounds(bounds);
    ctx.hoverWindow.setAlwaysOnTop(ctx.store.state.settings.pet.onTop);
    if (!ctx.hoverWindow.webContents.isLoading() && !ctx.hoverWindow.__loadFailed) ctx.hoverWindow.showInactive();
  }
  // 延迟销毁给鼠标从桌宠移到浮层留出时间；期间重新进入会取消。
  function hideHover(delay = 0) {
    clearTimeout(hoverHideTimer); hoverHideTimer = null;
    const finish = () => { hoverHold = false; destroyHover(); };
    if (!delay) { finish(); return; }
    hoverHideTimer = setTimeout(finish, delay);
  }
  function resumeHover() {
    if (hoverHold && !ctx.service?.snapshot().bubble) showHover();
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
  return { sendWhenReady, loadRenderer, createBootstrapWindow, showMainWindow, syncPetWindow, syncCaption, showBubble, showHover, hideHover, resumeHover, resizePopup, dragPet };
};
