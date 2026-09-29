module.exports = function createTrayModule(ctx) {
  const core = require('./generated/core.cjs');
  const safe = fn => () => { try { fn(); } catch (error) { ctx.dialog.showErrorBox('未能保存设置', error.message); } };
  function menu() {
    const s = ctx.store.state.settings;
    const styleItems = core.PET_STYLES.map(style => ({
      label: core.PET_STYLE_LABELS[style], type: 'radio', checked: s.pet.style === style,
      click: safe(() => ctx.service.apply({ ...s, pet: { ...s.pet, style } }))
    }));
    return ctx.Menu.buildFromTemplate([
      { label: '查看详情（双击桌宠）', click: () => ctx.showMainWindow() },
      { label: '摸摸它', click: () => ctx.service.interact('pat') },
      { label: '一起伸个懒腰', click: () => ctx.service.interact('stretch') },
      { label: '立即播报', click: () => ctx.service.manual() },
      { label: '切换形象', submenu: styleItems },
      { type: 'separator' },
      { label: '暂停一小时', click: safe(() => ctx.service.quiet('hour')) },
      { label: '今天安静', click: safe(() => ctx.service.quiet('today')) },
      { label: '恢复播报', click: safe(() => ctx.service.quiet('resume')) },
      { label: '设置', click: () => ctx.showMainWindow('settings') },
      { label: s.pet.visible ? '隐藏桌宠' : '显示桌宠', click: safe(() => ctx.service.apply({ ...s, pet: { ...s.pet, visible: !s.pet.visible } })) },
      { type: 'separator' }, { label: '退出忍了吧', click: () => ctx.app.quit() }
    ]);
  }
  function updateTrayMenu() { if (ctx.tray) ctx.tray.setContextMenu(menu()); }
  function createTray() { ctx.tray = new ctx.Tray(ctx.APP_ICON_PATH); ctx.tray.setToolTip('忍了吧 · 双击桌宠看详情'); ctx.tray.on('double-click', () => ctx.showMainWindow()); updateTrayMenu(); }
  return { createTray, updateTrayMenu, showPetMenu: () => menu().popup({ window: ctx.petWindow }) };
};
