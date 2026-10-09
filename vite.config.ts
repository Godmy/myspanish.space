import { sveltekit } from '@sveltejs/kit/vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { moduleAliases } from '../../stylist-svelte/scripts/prepare-module-sources.mjs';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const stylistRoot = resolve(projectRoot, '../../stylist-svelte');
const stylistLib = resolve(stylistRoot, 'src/lib');

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			...moduleAliases(stylistRoot),
			$stylist: stylistLib
		},
		// stylist-svelte ships its own node_modules; without dedupe two copies of
		// svelte/@sveltejs/kit would load and runes context (ThemeProvider) would break.
		dedupe: ['svelte', '@sveltejs/kit']
	},
	server: {
		port: 5176,
		strictPort: true,
		fs: {
			// allow importing source straight from the sibling component library
			allow: [projectRoot, stylistRoot]
		},
		watch: {
			// hot-reload edits inside stylist-svelte/src/lib even though it lives
			// outside this project root
			ignored: ['!**/stylist-svelte/src/lib/**']
		}
	}
});
