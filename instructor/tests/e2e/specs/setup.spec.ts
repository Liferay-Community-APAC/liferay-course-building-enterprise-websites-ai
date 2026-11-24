import {expect, test} from '@playwright/test';

import {adminApi, getJSON} from '../support/api';
import {pageAs} from '../support/browser';
import {adminCredentials} from '../support/env';
import {exists, gitIgnores, read} from '../support/files';

test('AC S.1-1 · solution-context.md and solution-index.yaml exist at the workspace root', () => {
	expect(exists('solution-context.md')).toBe(true);
	expect(exists('solution-index.yaml')).toBe(true);
});

test('AC S.1-2 · solution-index.yaml lists R1 to R13, each with id, title, level and status', () => {
	const yaml = read('solution-index.yaml');

	expect(yaml).toMatch(/^requirements:/m);

	for (let n = 1; n <= 13; n++) {
		const block = yaml.split(/\n\s*-\s+id:\s*/).find((b) => new RegExp(`^["']?R${n}["']?\\s*\\n`).test(b));

		expect(block, `entry R${n}`).toBeTruthy();

		for (const key of ['title', 'level', 'status']) {
			expect(block!, `R${n} has ${key}`).toMatch(new RegExp(`\\n\\s*${key}:`));
		}
	}
});

test('AC S.2-1 · Liferay answers with a page for Guest', async ({page}) => {
	const response = await page.goto('/');

	expect(response?.status()).toBeLessThan(400);
	await expect(page.locator('body')).not.toBeEmpty();
});

test('AC S.2-2 · the admin can sign in through /c/portal/login', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	expect(await page.evaluate(() => (window as any).Liferay.ThemeDisplay.isSignedIn())).toBe(true);
	await context.close();
});

test('AC S.3-1 · admin.properties exists, and git ignores it', () => {
	expect(exists('configs/local/admin.properties')).toBe(true);
	expect(gitIgnores('configs/local/admin.properties')).toBe(true);
});

test('AC S.3-2 · my-user-account is the Clarity admin', async () => {
	const api = await adminApi();
	const me = await getJSON(api, '/o/headless-admin-user/v1.0/my-user-account');

	expect(me.emailAddress).toBe(adminCredentials().email);
	expect(me.emailAddress).toBe('admin@clarityvisionsolutions.com');
	await api.dispose();
});

test('AC S.4-1 · /o/mcp answers initialize with a serverInfo', async () => {
	const api = await adminApi();
	const response = await api.post('/o/mcp', {
		data: {id: 1, jsonrpc: '2.0', method: 'initialize', params: {capabilities: {}, clientInfo: {name: 'reference-tests', version: '1'}, protocolVersion: '2025-06-18'}},
		headers: {Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json'},
	});

	expect(response.status(), await response.text()).toBe(200);

	const text = await response.text();
	const json = JSON.parse(text.includes('data:') ? text.split('\n').find((line) => line.startsWith('data:'))!.slice(5) : text);

	expect(json.result?.serverInfo?.name).toBeTruthy();
	await api.dispose();
});

test("AC S.4-2 · the agent's MCP configuration exists, and git ignores it", () => {
	const configs = ['.mcp.json', '.vscode/mcp.json', '.codex/config.toml'].filter(exists);

	expect(configs.length, 'one of .mcp.json, .vscode/mcp.json, .codex/config.toml').toBeGreaterThan(0);

	for (const config of configs) {
		expect(gitIgnores(config), `${config} is ignored`).toBe(true);
	}
});
