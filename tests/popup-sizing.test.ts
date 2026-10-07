import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const createWindows = require('../electron/app-windows.cjs');
function setup(x = 900, y = 10) {
  const popup = { isDestroyed: () => false, webContents: {}, getBounds: () => ({ x: 0, y: 0, width: 260, height: 76 }), setBounds: vi.fn() };
  const ctx = { bubbleWindow: popup, hoverWindow: null, petWindow: { isDestroyed: () => false, getBounds: () => ({ x, y, width: 128, height: 128 }) }, screen: { getDisplayMatching: () => ({ workArea: { x: 0, y: 0, width: 1000, height: 700 } }) } };
  return { popup, windows: createWindows(ctx) };
}
describe('content sized native popups', () => {
  it('accepts only popup senders and finite dimensions', () => {
    const { popup, windows } = setup();
    expect(() => windows.resizePopup({}, { width: 140, height: 44 })).toThrow('Popup only');
    for (const size of [{ width: NaN, height: 40 }, { width: 100, height: Infinity }, null]) expect(() => windows.resizePopup(popup.webContents, size)).toThrow('Invalid popup size');
    expect(popup.setBounds).not.toHaveBeenCalled();
  });
  it('grows and shrinks while staying within the work area at every corner', () => {
    for (const [x, y] of [[0, 0], [900, 0], [0, 600], [900, 600]]) {
      const { popup, windows } = setup(x, y);
      for (const size of [{ width: 275, height: 82 }, { width: 140, height: 44 }, { width: 9999, height: -5 }]) {
        windows.resizePopup(popup.webContents, size);
        const bounds = popup.setBounds.mock.lastCall?.[0];
        expect(bounds).toBeDefined();
        expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(1000); expect(bounds.y + bounds.height).toBeLessThanOrEqual(700);
        expect(bounds.width).toBe(Math.min(292, size.width)); expect(bounds.height).toBe(Math.max(36, size.height));
      }
    }
  });
});
