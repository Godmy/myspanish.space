import adapter from '@sveltejs/adapter-cloudflare';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moduleAliases } from '../../stylist-svelte/scripts/prepare-module-sources.mjs';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const stylistRoot = resolve(projectRoot, '../../stylist-svelte');
const stylistLib = resolve(stylistRoot, 'src/lib');
const cloudflareAdapter = adapter({routes:{include:['/*'],exclude:['<all>']}});
// Local school storage runs on Node. Avoid starting an unrelated workerd proxy
// (and locking the Cloudflare build directory) during Vite dev / browser tests.
cloudflareAdapter.emulate = () => ({});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		outDir: process.env.SCHOOL_KIT_DIR || '.svelte-kit-school',
		adapter:
			process.env.SCHOOL_TARGET === 'node'
				? adapterNode({ out: 'build-node' })
				: cloudflareAdapter,
		alias: {
			...moduleAliases(stylistRoot),
			$stylist: stylistLib,
		},
	},
};

export default config;
