import { describe, expect, it } from 'vitest';
import { releaseVersion, releaseConfig } from '../scripts/prepare-release.mjs';

describe('CI release configuration', () => {
  it('increments the source patch by the unique workflow run number', () => {
    expect(releaseVersion('0.3.1', '42')).toBe('0.3.43');
    expect(releaseVersion('0.3.1', '43')).toBe('0.3.44');
    for (const [version, run] of [['0.3.1-beta', '1'], ['0.3.1', '0'], ['0.3.1', '65535'], ['0.3.1', 'bad']]) {
      expect(() => releaseVersion(version, run)).toThrow();
    }
  });
  it('uses one update feed for builder and runtime without changing the source config', () => {
    const pkg = { build: { appId: 'test', extraResources: [{ from: 'electron/app-config.json', to: 'app-config.json' }, { from: 'news.env', to: 'news.env' }] } };
    const config = releaseConfig(pkg, 'https://downloads.example.com/wageclaw/');
    expect(config.publish).toEqual([{ provider: 'generic', url: 'https://downloads.example.com/wageclaw', channel: 'latest' }]);
    expect(config.extraResources).toContainEqual({ from: 'electron/private/release-app-config.json', to: 'app-config.json' });
    expect(pkg.build.extraResources[0].from).toBe('electron/app-config.json');
  });
  it('rejects placeholder and insecure feeds before touching source versions', () => {
    for (const url of ['http://example.com', 'https://downloads.your-domain.com/wageclaw', 'https://user:secret@example.com', 'https://example.com?token=secret', '']) {
      expect(() => releaseConfig({ build: { extraResources: [] } }, url)).toThrow();
    }
  });
});
