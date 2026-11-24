import {defineConfig} from '@playwright/test';

import {baseURL} from './support/env';

// One spec per workbook level: npx playwright test level-7
// Point it at another instance with LIFERAY_URL=http://localhost:8480

export default defineConfig({
	expect: {timeout: 15_000},
	fullyParallel: false,
	outputDir: 'test-results',
	reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
	retries: 0,
	testDir: 'specs',
	timeout: 90_000,
	use: {
		baseURL,
		channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
		headless: true,
		trace: 'retain-on-failure',
	},
	workers: 2,
});
