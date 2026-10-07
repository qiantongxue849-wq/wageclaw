import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { createNewsFeed, loadKey } = require('../electron/news-feed.cjs');
const reply = (list: unknown[]) => ({ ok: true, json: async () => ({ code: 200, result: { list } }) });
afterEach(() => vi.restoreAllMocks());
describe('hot news feed', () => {
  it('loads an installed resource independently of the working directory and allows an environment override', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wageclaw-news-config-test-'));
    const config = path.join(directory, 'news.env');
    try {
      fs.writeFileSync(config, 'WAGECLAW_TIANAPI_KEY=test-bundled-key\n');
      const options = { resourcesPath: directory, cwd: path.join(directory, 'empty'), applicationRoot: path.join(directory, 'empty'), env: {} };
      expect(loadKey(options)).toBe('test-bundled-key');
      expect(loadKey({ ...options, env: { WAGECLAW_TIANAPI_KEY: 'test-env-key' } })).toBe('test-env-key');
      fs.writeFileSync(config, ''); expect(loadKey(options)).toBe('');
    } finally { fs.unlinkSync(config); fs.rmdirSync(directory); }
  });
  it('does not request anything without a key', async () => {
    const fetcher = vi.fn(), feed = createNewsFeed({ keyProvider: () => '', fetcher });
    expect(await feed.refresh()).toEqual([]); expect(fetcher).not.toHaveBeenCalled();
  });
  it('shares in-flight work, validates headlines and caches successful responses', async () => {
    let time = 0;
    const fetcher = vi.fn(async () => reply([{ title: ' 热点一 ', digest: '简介' }, { title: '热点一' }, { title: {} }, { title: '热点二' }]));
    const feed = createNewsFeed({ keyProvider: () => 'test-key', fetcher, now: () => time });
    const first = feed.refresh(), second = feed.refresh(); expect(first).toBe(second);
    expect(await first).toEqual([{ title: '热点一', digest: '简介' }, { title: '热点二', digest: '' }]);
    time = 44 * 60000; await feed.refresh(); expect(fetcher).toHaveBeenCalledOnce();
    time = 45 * 60000; await feed.refresh(); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('backs off after failures even with an old cache and expires stale news', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let time = 0;
    const fetcher = vi.fn().mockResolvedValueOnce(reply([{ title: '旧热点' }])).mockRejectedValue(new Error('offline'));
    const feed = createNewsFeed({ keyProvider: () => 'test-key', fetcher, now: () => time });
    await feed.refresh(); time = 46 * 60000;
    expect(await feed.refresh()).toEqual([{ title: '旧热点', digest: '' }]);
    time += 60000; await feed.refresh(); expect(fetcher).toHaveBeenCalledTimes(2);
    time = 3 * 60 * 60000;
    expect(feed.current()).toEqual([]); expect(await feed.refresh()).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
