import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: 'tests/browser',
	workers: 1,
	timeout: 90000,
	expect: { timeout: 15000 },
	use: {
		baseURL: 'http://127.0.0.1:5187',
 hasTouch:true,
		channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	reporter: [['list']],
});
