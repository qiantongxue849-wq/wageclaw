const fs = require('node:fs/promises');
module.exports = function registerIpc(ctx) {
  const alive = win => win && !win.isDestroyed();
  function trusted(event) { return [ctx.mainWindow, ctx.petWindow, ctx.bubbleWindow, ctx.hoverWindow, ctx.bootstrapWindow].some(win => alive(win) && win.webContents === event.sender); }
  function handle(channel, callback) {
    ctx.ipcMain.handle(channel, (event, payload) => { if (!trusted(event)) throw new Error('Untrusted sender'); return callback(event, payload); });
  }
  const mainOnly = event => { if (!alive(ctx.mainWindow) || event.sender !== ctx.mainWindow.webContents) throw new Error('Panel only'); };
  handle('pet:bootstrap', (event, payload) => {
    if (event.sender !== ctx.bootstrapWindow?.webContents || JSON.stringify(payload).length > 20 * 1024 * 1024) throw new Error('Invalid migration');
    ctx.store.bootstrap(payload); ctx.service.start();
    if (!ctx.store.state.settings.configured || ctx.store.recovery) ctx.showMainWindow();
    const boot = ctx.bootstrapWindow; ctx.bootstrapWindow = null; setImmediate(() => boot?.destroy());
    return ctx.service.snapshot();
  });
  handle('pet:get', () => ctx.service.snapshot());
  handle('pet:save', (event, value) => { mainOnly(event); return ctx.service.apply(value, { closeAfterOnboarding: true }); });
  handle('pet:reset', event => { mainOnly(event); return ctx.service.reset(); });
  handle('pet:quiet', (_, mode) => { if (!['hour', 'today', 'resume'].includes(mode)) return; return ctx.service.quiet(mode); });
  // 界面已经记过这一次互动，这里只负责气泡和动作，避免次数加两次。
  handle('pet:interact', (_, action) => { if (['pat', 'stretch'].includes(action)) ctx.service.interact(action, false); });
  handle('pet:bond', (_, payload) => ctx.service.setPetBond(payload?.bondDate, payload?.bondCount));
  handle('pet:manual', (_, topic) => ctx.service.manual(['income', 'offwork', 'holiday', 'spring', 'bonus'].includes(topic) ? topic : undefined, false));
  handle('pet:dismiss', () => ctx.service.dismiss());
  handle('pet:hover', (_, hovered) => ctx.service.hoverBubble(hovered === true));
  handle('pet:hovercard', (event, payload) => {
    const fromPet = alive(ctx.petWindow) && event.sender === ctx.petWindow.webContents;
    const fromCard = alive(ctx.hoverWindow) && event.sender === ctx.hoverWindow.webContents;
    if (!fromPet && !fromCard) return;
    if (payload?.show !== false) { ctx.showHover(); return; }
    const delay = Number.isFinite(payload?.delay) ? Math.max(0, Math.min(2000, payload.delay)) : 0;
    ctx.hideHover(delay);
  });
  handle('pet:busy', (event, busy) => { mainOnly(event); ctx.service.setPanelBusy(busy === true); });
  handle('lite:open-main', (_, screen) => ctx.showMainWindow(screen === 'settings' ? screen : 'home'));
  handle('pet:menu', () => ctx.showPetMenu());
  handle('pet:hit', (event, interactive) => {
    if (alive(ctx.petWindow) && event.sender === ctx.petWindow.webContents) ctx.petWindow.setIgnoreMouseEvents(interactive !== true, { forward: true });
  });
  ctx.ipcMain.on('pet:drag', (event, payload) => {
    if (alive(ctx.petWindow) && event.sender === ctx.petWindow.webContents && ['start', 'move', 'end'].includes(payload?.kind)) {
      try { ctx.dragPet(payload.kind, payload); } catch (error) { console.error('Drag save:', error.message); }
    }
  });
  handle('lite:export', async event => {
    mainOnly(event);
    const result = await ctx.dialog.showSaveDialog(ctx.mainWindow, { title: '导出忍了吧备份', defaultPath: `wageclaw-backup-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    await fs.writeFile(result.filePath, ctx.store.export(), 'utf8'); return { ok: true };
  });
  handle('pet:import', async event => {
    mainOnly(event);
    const result = await ctx.dialog.showOpenDialog(ctx.mainWindow, { title: '导入忍了吧备份', filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
    if (result.canceled) return null;
    const file = result.filePaths[0];
    if ((await fs.stat(file)).size > 20 * 1024 * 1024) throw new Error('备份文件过大。');
    const contents = await fs.readFile(file, 'utf8');
    const confirm = await ctx.dialog.showMessageBox(ctx.mainWindow, { type: 'question', buttons: ['取消', '导入并备份现有数据'], defaultId: 0, cancelId: 0, message: '用备份中的工资和日期替换当前设置？', detail: '现有完整数据会先备份，导入失败不会删除原存档。' });
    if (confirm.response !== 1) return null;
    ctx.store.import(contents); return ctx.service.imported();
  });
  handle('lite:update-state', () => ctx.updateService.getState());
  handle('lite:update-check', event => { mainOnly(event); return ctx.updateService.checkForUpdates(); });
  handle('lite:update-install', event => { mainOnly(event); return ctx.updateService.downloadAndInstall(); });
};
