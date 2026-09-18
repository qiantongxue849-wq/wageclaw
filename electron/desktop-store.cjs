const fs = require('node:fs');
const path = require('node:path');
const core = require('./generated/core.cjs');
module.exports = function createStore(directory) {
  const file = path.join(directory, 'wageclaw-desktop-v2.json');
  let state = { version: 2, settings: core.defaults(), delivery: core.freshDelivery(new Date()), records: {}, profileKey: 'local' };
  let initialized = false, recovery = false;
  if (fs.existsSync(file)) {
    initialized = true;
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (raw.version !== 2 || !raw.settings) throw new Error('Invalid archive');
      state = { ...state, ...raw, settings: core.sanitizeSettings(raw.settings), delivery: core.normalizeDelivery(raw.delivery, new Date()) };
    } catch { recovery = true; }
  }
  function persist(next) {
    fs.mkdirSync(directory, { recursive: true });
    const temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(next), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporary, file);
    state = next; initialized = true;
  }
  function backup() {
    if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.backup.${Date.now()}`);
  }
  return {
    get state() { return state; }, get initialized() { return initialized; }, get recovery() { return recovery; },
    bootstrap(payload) {
      if (initialized) return;
      if (!payload || typeof payload !== 'object') throw new Error('迁移数据无效');
      state = { ...state, settings: core.sanitizeSettings(payload.settings), records: payload.records || {}, profileKey: String(payload.key || 'local') };
      if (payload.recovery) { recovery = true; return; }
      persist(state);
    },
    save(patch) {
      if (recovery) throw new Error('请先导出备份并恢复默认设置。');
      persist({ ...state, ...patch });
    },
    reset() { backup(); persist({ ...state, settings: core.defaults(), delivery: core.freshDelivery(new Date()) }); recovery = false; },
    export() {
      return JSON.stringify({ format: 'wageclaw-desktop-backup', ...state,
        rawArchive: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null, exportedAt: new Date().toISOString() }, null, 2);
    },
    import(contents) {
      const raw = JSON.parse(contents);
      if (!['wageclaw-desktop-backup', 'wageclaw-lite-backup'].includes(raw.format) || !raw.settings || ![1, 2].includes(raw.settings.version)) throw new Error('请选择有效的忍了吧备份文件。');
      const settings = core.sanitizeSettings(raw.settings);
      if (raw.settings.configured && !settings.configured) throw new Error('备份中的工资或作息无效。');
      // Import is explicitly confirmed; preserve the complete preceding archive first.
      backup();
      persist({ ...state, settings, delivery: core.freshDelivery(new Date()), records: { ...state.records, importedBackup: contents } });
      recovery = false;
    }
  };
};
