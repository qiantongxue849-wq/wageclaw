const core = require('./generated/core.cjs');
module.exports = function createDesktopService(ctx) {
  let timer, bubbleTimer, idleTimer, introTimer, closeTimer, bubble = null, lastManual = 0, lastManualTopic = '';
  let lastInteraction = 0, interactions = 0;
  let manualSequence = 0, lastNewsSignature = '';
  let manualRequest = 0;
  let locked = false, suspended = false, dragging = false, panelBusy = false;
  const store = ctx.store;
  const snapshot = () => ({ settings: store.state.settings, recovery: store.recovery, bubble });
  function publish() {
    for (const win of [ctx.mainWindow, ctx.petWindow, ctx.bubbleWindow, ctx.hoverWindow]) ctx.sendWhenReady(win, 'pet:snapshot', snapshot());
    ctx.updateTrayMenu();
  }
  function dismiss() {
    clearTimeout(bubbleTimer); bubble = null;
    if (ctx.bubbleWindow && !ctx.bubbleWindow.isDestroyed()) ctx.bubbleWindow.destroy();
    publish();
    ctx.resumeHover?.();
  }
  function showReport(report, automatic = false) {
    if (automatic && bubble && bubble.priority >= report.priority) return false;
    clearTimeout(bubbleTimer); bubble = report;
    if (report.topic === 'news') lastNewsSignature = report.signature;
    ctx.showBubble(); publish();
    const action = core.reportAction(report);
    if (action && !locked && !suspended && !dragging) ctx.sendWhenReady(ctx.petWindow, 'pet:animate', action);
    bubbleTimer = setTimeout(dismiss, 8000);
    return true;
  }
  function remember() {
    if (store.recovery) return;
    const next = core.recordPetInteraction(new Date(), store.state.settings);
    if (next !== store.state.settings) store.save({ settings: next });
  }
  function headlines() {
    if (store.state.settings.broadcast.news === false) return [];
    return ctx.newsFeed?.current?.() ?? [];
  }
  function refreshNews() {
    if (store.state.settings.broadcast.news !== false) void ctx.newsFeed?.refresh?.();
  }
  async function manual(topic, countBond = true) {
    if (locked || suspended || dragging || Date.now() - lastManual < 2000) return;
    lastManual = Date.now();
    const request = ++manualRequest;
    if (countBond) remember();
    if (topic === 'news' && store.state.settings.broadcast.news !== false) {
      try { await ctx.newsFeed?.refresh?.(); } catch { /* Report unavailable below. */ }
      if (request !== manualRequest || locked || suspended || dragging) return;
    } else refreshNews();
    const report = core.REPORT_TOPICS.includes(topic) ? core.requestedReport(new Date(), store.state.settings, topic, headlines(), lastNewsSignature) : core.manualReport(new Date(), store.state.settings, lastManualTopic, headlines(), { sequence: manualSequence++, lastNewsSignature });
    lastManualTopic = report.topic;
    showReport({ ...report, priority: 4 });
  }
  function interact(action, countBond = true) {
    if (!['pat', 'stretch'].includes(action) || locked || suspended || dragging || Date.now() - lastInteraction < 800) return;
    lastInteraction = Date.now();
    if (countBond) remember();
    if (store.state.settings.pet.visible) showReport(core.comfortReport(store.state.settings.pet.style, action, interactions++));
    else publish();
  }
  function setPetBond(date, count) {
    if (store.recovery || locked || suspended) return;
    const today = core.dateKey(new Date());
    if (date !== today || !Number.isInteger(count) || count < 0 || count > core.MAX_BOND_COUNT) return;
    const pet = store.state.settings.pet;
    const nextCount = pet.bondDate === date ? Math.max(pet.bondCount || 0, count) : count;
    if (pet.bondDate === date && pet.bondCount === nextCount) return;
    store.save({ settings: { ...store.state.settings, pet: { ...pet, bondDate: date, bondCount: nextCount } } });
    publish();
  }
  function schedule(resume = false) {
    clearTimeout(timer);
    if (locked || suspended || store.recovery) return;
    const now = new Date();
    let d = core.normalizeDelivery(store.state.delivery, now);
    if (!d.nextAt || resume || now.getTime() - d.nextAt > 120000) d = { ...d, nextAt: core.randomDue(now) };
    refreshNews();
    const report = core.autoReport(now, store.state.settings, d, dragging || panelBusy, Math.random, headlines());
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
      const s = store.state.settings, now = new Date();
      const quiet = !s.broadcast.enabled || s.broadcast.quietDate === core.dateKey(now) || s.broadcast.pauseUntil > now.getTime();
      if (!locked && !suspended && !dragging && !bubble && !quiet && s.pet.visible) ctx.sendWhenReady(ctx.petWindow, 'pet:animate', core.earnings(now, s).status === 'working' ? 'notice' : 'sleep');
      idle();
    }, 45000 + Math.random() * 45000);
  }
  function apply(settings, { closeAfterOnboarding = false } = {}) {
    manualRequest++;
    const wasConfigured = store.state.settings.configured;
    const valid = core.sanitizeSettings(settings);
    const received = valid.bonusReceivedAt && valid.bonusReceivedAt !== store.state.settings.bonusReceivedAt;
    store.save({ settings: valid });
    // The archive is committed above. A failed native-window refresh must not
    // reject pet:save and make the renderer roll back an already saved choice.
    const refresh = (label, action) => {
      try { action(); } catch (error) { console.error(`设置已保存，${label}失败:`, error.message); }
    };
    if (ctx.app.isPackaged && process.platform !== 'linux') refresh('开机自启同步', () => ctx.app.setLoginItemSettings({ openAtLogin: valid.autoStart }));
    clearTimeout(introTimer); clearTimeout(closeTimer);
    refresh('气泡关闭', dismiss);
    refresh('桌宠同步', () => ctx.syncPetWindow());
    refresh('标题栏同步', () => ctx.syncCaption?.());
    refresh('界面同步', publish);
    safeSchedule(true);
    if (received && valid.pet.visible && !locked && !suspended) refresh('到账提醒', () => showReport({ id: 'bonus-received', topic: 'bonus', signature: `received:${valid.bonusReceivedAt}`, priority: 4, text: '这一份辛苦终于到账了，为你开心。' }));
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
    safeSchedule();
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
    manualRequest++;
    if (kind === 'lock') locked = enabled; else suspended = enabled;
    dismiss();
    ctx.sendWhenReady(ctx.petWindow, 'pet:paused', locked || suspended);
    if (locked || suspended) { clearTimeout(timer); clearTimeout(idleTimer); clearTimeout(introTimer); } else { safeSchedule(true); idle(); }
  }
  return {
    snapshot, publish, dismiss, manual, interact, setPetBond, apply, quiet, start, systemPause,
    setDragging(value) { dragging = value; if (value) { manualRequest++; dismiss(); } },
    setPanelBusy(value) { panelBusy = value; if (value) dismiss(); },
    hoverBubble(hover) { clearTimeout(bubbleTimer); if (!hover && bubble) bubbleTimer = setTimeout(dismiss, 3000); },
    stop() { manualRequest++; clearTimeout(timer); clearTimeout(bubbleTimer); clearTimeout(idleTimer); clearTimeout(introTimer); clearTimeout(closeTimer); },
    reset() { store.reset(); dismiss(); ctx.syncPetWindow(); publish(); safeSchedule(true); return snapshot(); },
    imported() { dismiss(); ctx.syncPetWindow(); publish(); safeSchedule(true); return snapshot(); }
  };
};
