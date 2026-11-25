import {expect, request, test} from '@playwright/test';

import {pageAs} from '../support/browser';
import {SITE_PATH} from '../support/levels-6-9';

// Level 14 is a bonus, and it needs the AI Hub mock running (node bonus/ai-hub/server.mjs).
// When the mock doesn't answer, these tests are skipped, so a full run of the course's
// levels still passes. Point them at another port with AI_HUB_URL.

const AI_HUB = process.env.AI_HUB_URL ?? 'http://localhost:3010';
const CHATBOT = 'CLARITY_ASSISTANT';

test.beforeAll(async () => {
	const api = await request.newContext();
	const up = await api.get(`${AI_HUB}/api/state`, {timeout: 5_000}).then((r) => r.ok()).catch(() => false);

	await api.dispose();
	test.skip(!up, `The AI Hub mock isn't running at ${AI_HUB} (Level 14 is a bonus)`);
});

test('AC 14.2-1 · Guest can search through the headless search API, and finds the return policy FAQ', async ({baseURL}) => {
	const guest = await request.newContext({baseURL});
	const response = await guest.get('/o/search/v1.0/search', {params: {pageSize: 10, search: 'return policy'}});

	expect(response.status(), 'a Service Access Policy lets Guest call getSearchPage').toBe(200);

	const titles = ((await response.json()).items ?? []).map((i: any) => i.title);

	expect(titles).toContain('What is your return policy?');
	await guest.dispose();
});

test('AC 14.4-1 · CLARITY_ASSISTANT is enabled, with an enabled Liferay Search agent and an enabled LLM agent', async () => {
	const api = await request.newContext();
	const state = await (await api.get(`${AI_HUB}/api/state`)).json();
	const bot = state.chatbots.find((c: any) => c.erc === CHATBOT);

	expect(bot, `chatbot ${CHATBOT}`).toBeTruthy();
	expect(bot.enabled).toBe(true);

	const agents = bot.agents.map((erc: string) => state.agents.find((a: any) => a.erc === erc)).filter((a: any) => a?.enabled);

	expect(agents.map((a: any) => a.type).sort(), 'enabled assigned agent types').toEqual(expect.arrayContaining(['answer', 'search']));
	await api.dispose();
});

test('AC 14.4-2 · asked about returns, the chatbot answers 30 days, with the return policy FAQ as a source', async () => {
	test.setTimeout(150_000);

	const api = await request.newContext();
	const response = await api.post(`${AI_HUB}/api/chatbots/${CHATBOT}/chat`, {
		data: {message: 'What is your return policy?'},
		timeout: 140_000,
	});
	const body = await response.json();

	expect(response.status(), body.error).toBe(200);
	expect(body.answer).toMatch(/30/);
	expect(body.sources.map((s: any) => s.title)).toContain('What is your return policy?');
	await api.dispose();
});

test('AC 14.5-1 · as Guest, Home and FAQ load the chat through Click to Chat, and its bubble shows the intro message', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	for (const path of ['home', 'faq']) {
		await page.goto(`${SITE_PATH}/${path}`);

		const script = page.locator('script#aihub-chatbot-widget-script');

		await expect(script, `${path} has Click to Chat's AI Hub script`).toHaveCount(1);
		await expect(script).toHaveAttribute('src', `${AI_HUB}/documents/d/global/index-js`);
		await expect(script).toHaveAttribute('chatbot-external-reference-code', CHATBOT);
	}

	const host = page.locator(`[data-ai-hub-chat="${CHATBOT}"]`);

	await host.locator('.bubble').click();
	await expect(host.locator('.m.bot').first()).not.toBeEmpty();
	await expect(host.locator('.m.bot').first()).not.toContainText("isn't available");
	await context.close();
});
