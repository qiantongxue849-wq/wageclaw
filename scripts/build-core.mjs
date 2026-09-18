import { build } from 'esbuild';
await build({ entryPoints: ['src/lite/desktop-core.ts'], outfile: 'electron/generated/core.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node22' });
