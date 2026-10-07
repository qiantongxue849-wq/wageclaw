import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
const require = createRequire(import.meta.url);
const { createUpdateService } = require('../electron/services/update-service.cjs');

function setup(packaged = true, updateUrl = 'https://downloads.example.com/wageclaw') {
  vi.useFakeTimers();
  const updater = Object.assign(new EventEmitter(), {
    autoDownload: true, autoInstallOnAppQuit: true,
    checkForUpdates: vi.fn(async () => { updater.emit('update-not-available'); }),
    downloadUpdate: vi.fn(async () => { updater.emit('update-downloaded', { version: '0.3.2' }); }),
    quitAndInstall: vi.fn()
  });
  const send = vi.fn(), notifyAvailable = vi.fn(), createUpdater = vi.fn(() => updater);
  const service = createUpdateService({ updateUrl }, send, {
    app: { isPackaged: packaged, getVersion: () => '0.3.1' }, createUpdater, notifyAvailable
  });
  service.initialize();
  return { updater, service, send, notifyAvailable, createUpdater };
}

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('desktop automatic updates', () => {
  it('checks after startup and every six hours, and stops timers on quit', async () => {
    const { updater, service } = setup();
    service.initialize(); // Reinitialization must not create a second schedule.
    await vi.advanceTimersByTimeAsync(14999);
    expect(updater.checkForUpdates).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(updater.checkForUpdates).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    expect(updater.checkForUpdates).toHaveBeenCalledTimes(2);
    service.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([[false, 'https://downloads.example.com/app', 'dev'], [true, '', 'disabled']])(
    'does not contact the feed when packaged=%s and url=%s', async (packaged, url, status) => {
      const { service, createUpdater } = setup(packaged as boolean, url as string);
      await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
      expect(service.getState().status).toBe(status);
      expect(createUpdater).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('notifies once per version and retains an update until the user accepts it', async () => {
    const { updater, service, notifyAvailable } = setup();
    updater.emit('update-available', { version: '0.3.2' });
    updater.emit('update-available', { version: '0.3.2' });
    await vi.advanceTimersByTimeAsync(12 * 60 * 60 * 1000);
    expect(notifyAvailable).toHaveBeenCalledOnce();
    expect(service.getState().status).toBe('available');
    expect(updater.autoDownload).toBe(false);
    expect(updater.autoInstallOnAppQuit).toBe(false);
    expect(updater.downloadUpdate).not.toHaveBeenCalled();
    expect(updater.checkForUpdates).not.toHaveBeenCalled();
    expect(updater.quitAndInstall).not.toHaveBeenCalled();
  });

  it('coalesces simultaneous manual and background checks', async () => {
    const { updater, service } = setup();
    let finish!: () => void;
    updater.checkForUpdates.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const first = service.checkForUpdates(), second = service.checkForUpdates();
    expect(first).toBe(second);
    await vi.advanceTimersByTimeAsync(15000);
    expect(updater.checkForUpdates).toHaveBeenCalledOnce();
    finish(); await first;
  });

  it('recovers from an offline check without an unhandled rejection', async () => {
    const { updater, service } = setup();
    updater.checkForUpdates.mockRejectedValueOnce(new Error('offline'));
    await vi.advanceTimersByTimeAsync(15000);
    expect(service.getState().status).toBe('error');
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    expect(service.getState().status).toBe('current');
  });

  it('downloads once and restarts only after an explicit install action', async () => {
    const { updater, service } = setup();
    updater.emit('update-available', { version: '0.3.2' });
    await Promise.all([service.downloadAndInstall(), service.downloadAndInstall()]);
    expect(updater.downloadUpdate).toHaveBeenCalledOnce();
    expect(updater.quitAndInstall).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(updater.quitAndInstall).toHaveBeenCalledWith(false, true);
  });

  it('does not install after download failure and lets the user retry checking', async () => {
    const { updater, service } = setup();
    updater.emit('update-available', { version: '0.3.2' });
    updater.downloadUpdate.mockRejectedValueOnce(new Error('download failed'));
    await service.downloadAndInstall();
    expect(service.getState().status).toBe('error');
    await service.checkForUpdates();
    await vi.advanceTimersByTimeAsync(500);
    expect(updater.quitAndInstall).not.toHaveBeenCalled();
  });
});
