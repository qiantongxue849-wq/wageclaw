import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const registerIpc = require('../electron/app-ipc.cjs');

function setup() {
  const handlers = new Map<string, (event: { sender: object }, payload?: unknown) => unknown>();
  const main = { isDestroyed: () => false, webContents: {}, isMaximized: vi.fn(() => false), minimize: vi.fn(), maximize: vi.fn(), unmaximize: vi.fn(), close: vi.fn() };
  const pet = { isDestroyed: () => false, webContents: {} };
  registerIpc({ mainWindow: main, petWindow: pet, ipcMain: { handle: (name: string, fn: (event: { sender: object }, payload?: unknown) => unknown) => handlers.set(name, fn), on: vi.fn() } });
  return { main, pet, call: (name: string, sender: object, payload?: unknown) => {
    const handler = handlers.get(name);
    if (!handler) throw new Error(`Missing handler: ${name}`);
    return handler({ sender }, payload);
  } };
}

describe('compact window controls IPC', () => {
  it('minimizes, toggles maximization and closes only the panel', () => {
    const { main, call } = setup();
    call('lite:window-action', main.webContents, 'minimize');
    expect(main.minimize).toHaveBeenCalledOnce();
    call('lite:window-action', main.webContents, 'toggle-maximize');
    expect(main.maximize).toHaveBeenCalledOnce();
    main.isMaximized.mockReturnValue(true);
    expect(call('lite:window-state', main.webContents)).toEqual({ maximized: true });
    call('lite:window-action', main.webContents, 'toggle-maximize');
    expect(main.unmaximize).toHaveBeenCalledOnce();
    call('lite:window-action', main.webContents, 'close');
    expect(main.close).toHaveBeenCalledOnce();
  });
  it('rejects other renderers and unsupported actions without changing the window', () => {
    const { main, pet, call } = setup();
    expect(() => call('lite:window-action', {}, 'close')).toThrow('Untrusted sender');
    expect(() => call('lite:window-action', pet.webContents, 'close')).toThrow('Panel only');
    expect(() => call('lite:window-state', pet.webContents)).toThrow('Panel only');
    expect(() => call('lite:window-action', main.webContents, 'quit')).toThrow('Invalid window action');
    expect(main.close).not.toHaveBeenCalled();
    expect(main.minimize).not.toHaveBeenCalled();
    expect(main.maximize).not.toHaveBeenCalled();
  });
});
