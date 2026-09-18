import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaults } from '../src/lite/model';
const require = createRequire(import.meta.url);
const createStore = require('../electron/desktop-store.cjs');
const dirs: string[] = [];
const directory = () => { const p = mkdtempSync(join(tmpdir(), 'wageclaw-store-')); dirs.push(p); return p; };
afterEach(() => { dirs.forEach(p => rmSync(p, { recursive: true, force: true })); dirs.length = 0; });
describe('native store migration and backup', () => {
  it('migrates once, writes atomically and restarts with persisted config', () => {
    const dir = directory(), store = createStore(dir);
    store.bootstrap({ settings: { ...defaults(), salary: 18000, configured: true }, key: 'alice', records: { old: '{original}' } });
    store.save({ settings: { ...store.state.settings, salary: 19000 } });
    store.bootstrap({ settings: defaults() });
    const restarted = createStore(dir);
    expect(restarted.state.settings.salary).toBe(19000);
    expect(restarted.state.records.old).toBe('{original}');
    expect(readdirSync(dir)).not.toContain('wageclaw-desktop-v2.json.tmp');
  });
  it('keeps damaged archives and preserves them before reset', () => {
    const dir = directory(), file = join(dir, 'wageclaw-desktop-v2.json');
    writeFileSync(file, '{broken');
    const store = createStore(dir);
    expect(store.recovery).toBe(true);
    expect(() => store.save({ settings: defaults() })).toThrow();
    store.reset();
    const backup = readdirSync(dir).find(name => name.includes('.backup.'));
    expect(readFileSync(join(dir, backup || 'missing-backup'), 'utf8')).toBe('{broken');
    expect(store.recovery).toBe(false);
  });
  it('validates imports before touching current data and accepts the old export format', () => {
    const dir = directory(), store = createStore(dir);
    store.bootstrap({ settings: defaults() });
    const before = readFileSync(join(dir, 'wageclaw-desktop-v2.json'), 'utf8');
    expect(() => store.import('{"format":"other"}')).toThrow();
    expect(readFileSync(join(dir, 'wageclaw-desktop-v2.json'), 'utf8')).toBe(before);
    store.import(JSON.stringify({ format: 'wageclaw-lite-backup', settings: { ...defaults(), version: 1, configured: true, salary: 20000 } }));
    expect(store.state.settings.version).toBe(2);
    expect(store.state.settings.salary).toBe(20000);
    expect(readdirSync(dir).some(name => name.includes('.backup.'))).toBe(true);
  });
});
