import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { defaults } from '../src/lite/model';
import { freshDelivery } from '../src/lite/broadcast';
const require = createRequire(import.meta.url);
const createService = require('../electron/desktop-service.cjs');
function setup(recovery = false) {
  const store = { state: { settings: { ...defaults(), configured: !recovery, salary: recovery ? 0 : 18000 }, delivery: freshDelivery(new Date()), welcomeShown: false }, recovery,
    save(patch: Partial<typeof store.state>) { if (this.recovery) throw new Error('Recovery'); this.state = { ...this.state, ...patch }; } };
  const ctx = { store, sendWhenReady: vi.fn(), updateTrayMenu: vi.fn(), showBubble: vi.fn(), syncPetWindow: vi.fn(), app: { isPackaged: false }, mainWindow: null, petWindow: {}, bubbleWindow: null };
  return { ctx, service: createService(ctx) };
}
afterEach(() => { vi.useRealTimers(); });
describe('desktop runtime independently of the panel', () => {
  it('reports without a panel, pauses on lock, discards overdue reminders and clears timers', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T17:29:00'));
    const { ctx, service } = setup(); service.start();
    service.manual(); expect(ctx.showBubble).toHaveBeenCalledOnce();
    service.systemPause('lock', true);
    vi.advanceTimersByTime(40 * 60000);
    expect(ctx.showBubble).toHaveBeenCalledTimes(1);
    service.systemPause('lock', false);
    expect(ctx.showBubble).toHaveBeenCalledTimes(1);
    service.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('closes an existing report immediately on privacy change', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T13:00:00'));
    const { ctx, service } = setup(); service.start(); service.manual();
    expect(service.snapshot().bubble).not.toBeNull();
    service.apply({ ...ctx.store.state.settings, privacy: true });
    expect(service.snapshot().bubble).toBeNull(); service.stop();
  });
  it('starts in recovery without attempting to overwrite the damaged archive', () => {
    vi.useFakeTimers();
    const { service } = setup(true);
    expect(() => service.start()).not.toThrow();
    expect(service.snapshot().recovery).toBe(true); service.stop();
  });
});

describe('companion interactions', () => {
  it('delivers report-specific motion and distinguishes expected from received bonuses', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-24T15:00:00'));
    const { ctx, service } = setup();
    ctx.store.state.settings.bonusDate = '09-24';
    service.manual('income');
    expect(ctx.sendWhenReady).toHaveBeenLastCalledWith(ctx.petWindow, 'pet:animate', 'celebrate');
    vi.advanceTimersByTime(2100); service.manual('bonus');
    expect(service.snapshot().bubble.text).toContain('预计今天');
    expect(ctx.sendWhenReady).toHaveBeenLastCalledWith(ctx.petWindow, 'pet:animate', 'notice');
    service.apply({ ...ctx.store.state.settings, bonusReceivedAt: '2026-09-24' });
    expect(service.snapshot().bubble.id).toBe('bonus-received');
    expect(ctx.sendWhenReady).toHaveBeenLastCalledWith(ctx.petWindow, 'pet:animate', 'celebrate');
    service.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('suppresses random idle motion in quiet mode but allows explicit interactions', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-24T15:00:00'));
    const { ctx, service } = setup();
    ctx.store.state.settings.broadcast.enabled = false;
    service.start(); vi.advanceTimersByTime(180000);
    expect(ctx.sendWhenReady.mock.calls.filter(call => call[1] === 'pet:animate')).toHaveLength(0);
    service.interact('pat');
    expect(ctx.sendWhenReady).toHaveBeenLastCalledWith(ctx.petWindow, 'pet:animate', 'play');
    service.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('animates without altering earnings settings, throttles repeats and respects system lock', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-24T15:00:00'));
    const { ctx, service } = setup();
    const salary = ctx.store.state.settings.salary;
    service.interact('stretch');
    expect(ctx.sendWhenReady).toHaveBeenCalledWith(ctx.petWindow, 'pet:animate', 'stretch');
    expect(service.snapshot().bubble.text).toContain('肩膀');
    expect(ctx.store.state.settings.salary).toBe(salary);
    expect(ctx.store.state.settings.pet).toMatchObject({ bondDate: '2026-09-24', bondCount: 1 });
    service.interact('pat'); expect(ctx.store.state.settings.pet.bondCount).toBe(1);
    service.interact('pat'); expect(ctx.showBubble).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    service.systemPause('lock', true); service.interact('pat');
    expect(service.snapshot().bubble).toBeNull();
    expect(ctx.showBubble).toHaveBeenCalledTimes(1);
    service.stop(); expect(vi.getTimerCount()).toBe(0);
  });
});
