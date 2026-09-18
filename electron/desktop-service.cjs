const core = require('./generated/core.cjs');
module.exports = function createDesktopService(ctx) {
  let timer, bubbleTimer, idleTimer, introTimer, closeTimer, bubble = null, lastManual = 0, lastManualTopic = '';
  let locked = false, suspended = false, dragging = false, panelBusy = false;
  const store = ctx.store;
  const snapshot = () => ({ settings: store.state.settings, recovery: store.recovery, bubble });
  function publish() {
    for (const win of [ctx.mainWindow, ctx.petWindow, ctx.bubbleWindow]) ctx.sendWhenReady(win, 'pet:snapshot', snapshot());
    ctx.updateTrayMenu();
  }
  function dismiss() {
    clearTimeout(bubbleTimer); bubble = null;
    if (ctx.bubbleWindow && !ctx.bubbleWindow.isDestroyed()) ctx.bubbleWindow.destroy();
    publish();
  }
  function showReport(report, automatic = false) {
    if (automatic && bubble && bubble.priority >= report.priority) return false;
    clearTimeout(bubbleTimer); bubble = report;
    ctx.showBubble(); publish();
    bubbleTimer = setTimeout(dismiss, 8000);
    return true;
  }
  function manual() {
    if (Date.now() - lastManual < 2000) return;
    lastManual = Date.now();
    const report = core.manualReport(new Date(), store.state.settings, lastManualTopic);
    lastManualTopic = report.topic;
    showReport({ ...report, priority: 4 });
  }
  function schedule(resume = false) {
    clearTimeout(timer);
    if (locked || suspended || store.recovery) return;
    const now = new Date();
    let d = core.normalizeDelivery(store.state.delivery, now);
    if (!d.nextAt || resume || now.getTime() - d.nextAt > 120000) d = { ...d, nextAt: core.randomDue(now) };
    const report = core.autoReport(now, store.state.settings, d, dragging || panelBusy);
    if (report) {
      // Persist the reservation before display to avoid duplicate events after a crash.
      const next = core.recordDelivery(now, d, report);
      if (!bubble || bubble.priority < report.priority) { store.save({ delivery: next }); d = next; showReport(report, true); }
    }
    if (d.nextAt <= now.getTime()) d = { ...d, nextAt: core.randomDue(now) };
    if (JSON.stringify(d) !== JSON.stringify(store.state.delivery)) store.save({ delivery: d });
    timer = setTimeout(() => safeSchedule(), Math.min(core.nextWake(now, store.state.settings, d), 60000));
  }
  function safeSchedule(resume = false) {
    try { schedule(resume); } catch (error) { console.error('播报调度暂停:', error.message); }
  }
  function idle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!locked && !suspended && !dragging && !bubble && store.state.settings.pet.visible) ctx.sendWhenReady(ctx.petWindow, 'pet:animate', core.earnings(new Date(), store.state.settings).status === 'working' ? 'play' : 'sleep');
      idle();
    }, 45000 + Math.random() * 45000);
  }
  function apply(settings, { closeAfterOnboarding = false } = {}) {
    const wasConfigured = store.state.settings.configured;
    const valid = core.sanitizeSettings(settings);
    store.save({ settings: valid });
    if (ctx.app.isPackaged && process.platform !== 'linux') ctx.app.setLoginItemSettings({ openAtLogin: valid.autoStart });
    clearTimeout(introTimer); clearTimeout(closeTimer);
    dismiss(); ctx.syncPetWindow(); publish(); safeSchedule(true);
    if (valid.pet.visible && !locked && !suspended) idle(); else clearTimeout(idleTimer);
    if (closeAfterOnboarding && !wasConfigured && valid.configured) {
      closeTimer = setTimeout(() => ctx.mainWindow?.close(), 100);
      introTimer = setTimeout(() => {
        if (locked || suspended || !store.state.settings.pet.visible) return;
        showReport({ id: 'onboarded', topic: 'welcome', signature: 'onboarded', priority: 4, text: '点我看一句，双击看全部；拖动可换位置。' });
      }, 400);
    }
    return snapshot();
  }
  function quiet(mode) {
    const s = store.state.settings;
    const broadcast = { ...s.broadcast, pauseUntil: mode === 'hour' ? Date.now() + 3600000 : 0, quietDate: mode === 'today' ? core.dateKey(new Date()) : '' };
    return apply({ ...s, broadcast });
  }
  function start() {
    ctx.syncPetWindow();
    publish();
    safeSchedule(true);
    idle();
    if (!store.recovery && !store.state.settings.configured && !store.state.welcomeShown) {
      const welcome = core.candidates(new Date(), store.state.settings).find(c => c.id === 'welcome');
      if (welcome) {
        store.save({ welcomeShown: true });
        introTimer = setTimeout(() => { if (!locked && !suspended && store.state.settings.pet.visible) showReport(welcome, true); }, 300);
      }
    }
  }
  function systemPause(kind, enabled) {
    if (kind === 'lock') locked = enabled; else suspended = enabled;
    dismiss();
    ctx.sendWhenReady(ctx.petWindow, 'pet:paused', locked || suspended);
    if (locked || suspended) { clearTimeout(timer); clearTimeout(idleTimer); clearTimeout(introTimer); } else { safeSchedule(true); idle(); }
  }
  return {
    snapshot, publish, dismiss, manual, apply, quiet, start, systemPause,
    setDragging(value) { dragging = value; if (value) dismiss(); },
    setPanelBusy(value) { panelBusy = value; if (value) dismiss(); },
    hoverBubble(hover) { clearTimeout(bubbleTimer); if (!hover && bubble) bubbleTimer = setTimeout(dismiss, 3000); },
    stop() { clearTimeout(timer); clearTimeout(bubbleTimer); clearTimeout(idleTimer); clearTimeout(introTimer); clearTimeout(closeTimer); },
    reset() { store.reset(); dismiss(); ctx.syncPetWindow(); publish(); safeSchedule(true); return snapshot(); },
    imported() { dismiss(); ctx.syncPetWindow(); publish(); safeSchedule(true); return snapshot(); }
  };
};
