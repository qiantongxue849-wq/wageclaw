const fs = require('node:fs');
const path = require('node:path');
const TTL = 45 * 60 * 1000;
const RETRY = 10 * 60 * 1000;
const MAX_AGE = 3 * 60 * 60 * 1000;

function readKeyFile(file) {
  try {
    const match = fs.readFileSync(file, 'utf8').match(/^WAGECLAW_TIANAPI_KEY=(.*)$/m);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch { return ''; }
}
function loadKey({ env = process.env, resourcesPath = process.resourcesPath, cwd = process.cwd(), applicationRoot = path.join(__dirname, '..') } = {}) {
  const fromEnv = String(env.WAGECLAW_TIANAPI_KEY || '').trim();
  if (fromEnv) return fromEnv;
  return (resourcesPath ? readKeyFile(path.join(resourcesPath, 'news.env')) : '') || readKeyFile(path.join(cwd, '.env')) || readKeyFile(path.join(applicationRoot, '.env'));
}
async function fetchHot(key, fetcher) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(`https://apis.tianapi.com/networkhot/index?key=${encodeURIComponent(key)}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.code !== 200 || !Array.isArray(data.result?.list)) {
      console.error('热点暂时没取到:', data.code || response.status, data.msg || '');
      return [];
    }
    return data.result.list
      .map(row => ({ title: typeof row?.title === 'string' ? row.title.trim() : '', digest: typeof row?.digest === 'string' ? row.digest.trim() : '' }))
      .filter((row, i, all) => row.title && all.findIndex(other => other.title === row.title) === i)
      .slice(0, 12);
  } finally { clearTimeout(timer); }
}
function createNewsFeed({ keyProvider = loadKey, fetcher = globalThis.fetch, now = Date.now } = {}) {
  let cache = { at: 0, items: [] }, failedAt = null, inflight = null;
  function current() { return now() - cache.at < MAX_AGE ? cache.items : []; }
  function refresh() {
    const key = keyProvider();
    if (!key) return Promise.resolve([]);
    if (cache.items.length && now() - cache.at < TTL) return Promise.resolve(current());
    if (failedAt !== null && now() - failedAt < RETRY) return Promise.resolve(current());
    if (inflight) return inflight;
    inflight = fetchHot(key, fetcher).then(items => {
      if (items.length) { cache = { at: now(), items }; failedAt = null; }
      else failedAt = now();
      return current();
    }).catch(error => {
      failedAt = now();
      console.error('热点暂时没取到:', error.name);
      return current();
    }).finally(() => { inflight = null; });
    return inflight;
  }
  return { current, refresh };
}
module.exports = { ...createNewsFeed(), createNewsFeed, loadKey };
