const fs = require('node:fs');
const path = require('node:path');
function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return {}; }
}
function loadRuntimeConfig({ app, resourcesPath = process.resourcesPath }) {
  const bundled = readJson(path.join(__dirname, 'app-config.json'));
  const external = app.isPackaged ? readJson(path.join(resourcesPath, 'app-config.json')) : {};
  return {
    updateUrl: String(process.env.WAGECLAW_UPDATE_URL || external.updateUrl || bundled.updateUrl || '').trim().replace(/\/+$/, ''),
    updateChannel: String(process.env.WAGECLAW_UPDATE_CHANNEL || external.updateChannel || bundled.updateChannel || 'latest').trim()
  };
}
module.exports = { loadRuntimeConfig };
