import { describe, it, expect } from 'vitest';
import { defaults, PET_STYLES, sanitizeSettings } from '../src/lite/model';
import { comfortReport, autoReport, freshDelivery } from '../src/lite/broadcast';
describe('free companion forms', () => {
  it('keeps old archives automatic, persists valid choices and rejects invalid forms', () => {
    expect(sanitizeSettings({ version: 2, pet: { style: 'lazyCat' } }).pet.form).toBeNull();
    for (const style of PET_STYLES) for (const form of [1, 10]) expect(sanitizeSettings({ pet: { style, form } }).pet).toMatchObject({ style, form });
    for (const form of [0, 11, 1.5, '10', NaN, Infinity]) expect(sanitizeSettings({ pet: { form } }).pet.form).toBeNull();
  });
  it('provides each pet local reactions without salary data', () => {
    const voices = PET_STYLES.map(style => comfortReport(style, 'pat').text);
    expect(new Set(voices).size).toBe(5);
    for (const style of PET_STYLES) {
      const report = comfortReport(style, 'pat', 3);
      expect(report.text).not.toBe(comfortReport(style, 'pat', 0).text);
      expect(comfortReport(style, 'pat', 6).text).toBe(comfortReport(style, 'pat', 0).text);
      expect(report.text).not.toMatch(/¥|元|任务|打卡/);
    }
  });
  it('reserves the two off-work milestones after twelve ordinary reminders', () => {
    const now = new Date('2026-09-24T17:30:00');
    const s = { ...defaults(), configured: true, salary: 18000, startTime: '09:00', endTime: '18:00', summerFrom: '', summerTo: '' };
    const delivery = { ...freshDelivery(now), ordinary: 12, total: 12, nextAt: now.getTime() };
    expect(autoReport(now, s, delivery, false)?.id).toBe('soon');
    expect(autoReport(new Date('2026-09-24T16:30:00'), s, { ...delivery, nextAt: new Date('2026-09-24T16:30:00').getTime() }, false)).toBeNull();
  });
});

import { clearSheetEdgeFragments } from '../src/lite/petDrawing';
describe('old sheet crop boundaries', () => {
  it('removes a detached edge sliver, preserving the central character, interior decorations and connected limbs', () => {
    const size = 96, pixels = new Uint8ClampedArray(size * size * 4);
    const dot = (x: number, y: number) => { pixels[(y * size + x) * 4 + 3] = 255; };
    // Detached neighbour at the left crop edge.
    for (let x = 0; x < 3; x++) for (let y = 4; y < 14; y++) dot(x, y);
    // Neighbour fragment separated from the boundary by transparent cell padding.
    for (let x = 15; x < 18; x++) for (let y = 24; y < 34; y++) dot(x, y);
    // A real limb connected all the way from the edge to the centre.
    for (let x = 0; x <= 50; x++) dot(x, 50);
    dot(35, 15); // Interior decoration must survive even though detached.
    clearSheetEdgeFragments(pixels, size, size);
    const alpha = (x: number, y: number) => pixels[(y * size + x) * 4 + 3];
    expect(alpha(1, 8)).toBe(0);
    expect(alpha(16, 28)).toBe(0);
    expect(alpha(0, 50)).toBe(255);
    expect(alpha(50, 50)).toBe(255);
    expect(alpha(35, 15)).toBe(255);
  });
});
