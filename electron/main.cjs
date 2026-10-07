const path = require('node:path');
const { app, dialog, screen, BrowserWindow, Menu, Tray, ipcMain, shell, powerMonitor, Notification } = require('electron');
const { loadRuntimeConfig } = require('./runtime-config.cjs');
const { createUpdateService } = require('./services/update-service.cjs');
const ctx = {
  app, path, screen, BrowserWindow, Menu, Tray, ipcMain, dialog, shell,
  DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL || process.env.WAGECLAW_DEV_SERVER_URL || 'http://127.0.0.1:5173',
  APP_ICON_PATH: path.join(__dirname, 'assets', 'app-icon.png'),
  TRAY_ICON_PATH: path.join(__dirname, 'assets', 'tray-icon.ico'),
  mainWindow: null, petWindow: null, bubbleWindow: null, hoverWindow: null, bootstrapWindow: null, tray: null
};
if (process.platform === 'win32') app.setAppUserModelId('com.wageclaw.electron');
Object.assign(ctx, require('./app-windows.cjs')(ctx));
Object.assign(ctx, require('./app-tray.cjs')(ctx));
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => ctx.showMainWindow());
  app.whenReady().then(() => {
    if (process.platform === 'win32') Menu.setApplicationMenu(null);
    ctx.newsFeed = require('./news-feed.cjs');
    ctx.store = require('./desktop-store.cjs')(app.getPath('userData'));
    ctx.service = require('./desktop-service.cjs')(ctx);
    ctx.updateService = createUpdateService(loadRuntimeConfig({ app }), state => {
      ctx.sendWhenReady(ctx.mainWindow, 'lite:update', state);
      ctx.updateTrayMenu();
    }, {
      notifyAvailable: state => {
        if (!Notification.isSupported()) return;
        ctx.updateNotification = new Notification({
          title: '忍了吧 · 有新版本',
          body: `版本 ${state.availableVersion} 已发布，点击打开设置下载安装。`,
          icon: ctx.APP_ICON_PATH
        });
        ctx.updateNotification.on('click', () => ctx.showMainWindow('settings'));
        ctx.updateNotification.show();
      }
    });
    require('./app-ipc.cjs')(ctx);
    ctx.createTray();
    if (ctx.store.initialized) {
      ctx.service.start();
      ctx.showMainWindow();
    } else ctx.createBootstrapWindow();
    try { ctx.updateService.initialize(); } catch (error) { console.error('Update initialization:', error.message); }
    powerMonitor.on('lock-screen', () => ctx.service.systemPause('lock', true));
    powerMonitor.on('unlock-screen', () => ctx.service.systemPause('lock', false));
    powerMonitor.on('suspend', () => ctx.service.systemPause('sleep', true));
    powerMonitor.on('resume', () => ctx.service.systemPause('sleep', false));
    screen.on('display-removed', () => ctx.syncPetWindow());
    screen.on('display-metrics-changed', () => ctx.syncPetWindow());
  }).catch(error => { dialog.showErrorBox('启动失败', error.message); app.quit(); });
  app.on('activate', () => { if (ctx.service) ctx.showMainWindow(); });
}
app.on('window-all-closed', () => { /* A hidden pet can be restored from the tray. */ });
app.on('before-quit', () => { app.isQuitting = true; ctx.service?.stop(); ctx.updateService?.stop(); if (ctx.tray) { ctx.tray.destroy(); ctx.tray = null; } });
