import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
	cwd: root,
	stdio: 'inherit',
	env: { ...process.env, SCHOOL_TARGET: 'cloudflare-preview', SCHOOL_KIT_DIR: '.svelte-kit-school-preview' },
});
if (result.status === 0 && !existsSync(join(root, '.svelte-kit-school-preview/cloudflare/_worker.js'))) {
	console.error('Preview build did not produce the Worker required by wrangler.preview.jsonc.');
	process.exit(1);
}
process.exit(result.status ?? 1);
