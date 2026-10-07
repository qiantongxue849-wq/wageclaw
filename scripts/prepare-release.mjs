import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function releaseVersion(baseVersion, runNumber) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(baseVersion);
  if (!match || !/^\d+$/.test(String(runNumber)) || Number(runNumber) < 1) {
    throw new Error('Release requires a stable source version and a positive CI run number');
  }
  const parts = [Number(match[1]), Number(match[2]), Number(match[3]) + Number(runNumber)];
  if (parts.some(part => !Number.isSafeInteger(part) || part > 65535)) {
    throw new Error('Windows version component exceeds 65535; increase the source minor version');
  }
  return parts.join('.');
}

export function releaseConfig(pkg, updateUrl) {
  const url = new URL(updateUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.hostname.endsWith('your-domain.com')) {
    throw new Error('WAGECLAW_UPDATE_URL must be a real public HTTPS directory URL without credentials/query/hash');
  }
  const baseUrl = url.href.replace(/\/+$/, '');
  return {
    ...pkg.build,
    extends: null,
    publish: [{ provider: 'generic', url: baseUrl, channel: 'latest' }],
    extraResources: [
      ...pkg.build.extraResources.filter(resource => resource.to !== 'app-config.json'),
      { from: 'electron/private/release-app-config.json', to: 'app-config.json' }
    ]
  };
}

function prepare() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = releaseVersion(pkg.version, process.env.GITHUB_RUN_NUMBER);
  const config = releaseConfig(pkg, process.env.WAGECLAW_UPDATE_URL);
  // These version changes are confined to the disposable CI checkout.
  pkg.version = version;
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  lock.version = version;
  lock.packages[''].version = version;
  fs.mkdirSync('electron/private', { recursive: true });
  fs.mkdirSync('release', { recursive: true });
  fs.writeFileSync('electron/private/release-app-config.json', JSON.stringify({ updateUrl: config.publish[0].url, updateChannel: 'latest' }, null, 2));
  fs.writeFileSync('release/ci-builder.json', JSON.stringify(config, null, 2));
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  console.log(`Preparing Windows release ${version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) prepare();
