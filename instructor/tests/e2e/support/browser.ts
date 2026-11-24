import {Browser, BrowserContext, Page, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import {PERSONA_PASSWORD, adminCredentials, baseURL, persona} from './env';

// Browser sessions for Guest, the admin and the personas. Each signed-in
// session is saved in .auth/<who>.json (git-ignored) and reused until it expires.

const AUTH_DIR = path.join(__dirname, '..', '.auth');

export type Who = 'guest' | 'admin' | string; // a persona's given name, such as "Christian"

function credentials(who: string): {email: string; password: string} {
	if (who === 'admin') {
		return adminCredentials();
	}

	return {email: persona(who).emailAddress, password: PERSONA_PASSWORD};
}

async function signedInAs(page: Page): Promise<string | null> {
	const response = await page.request.get('/o/headless-admin-user/v1.0/my-user-account', {
		headers: {'x-csrf-token': await page.evaluate(() => (window as any).Liferay?.authToken ?? '')},
	});

	return response.ok() ? (await response.json()).emailAddress : null;
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
	await page.goto('/c/portal/login');
	await page.locator('#_com_liferay_login_web_portlet_LoginPortlet_login').fill(email);
	await page.locator('#_com_liferay_login_web_portlet_LoginPortlet_password').fill(password);
	await Promise.all([
		page.waitForLoadState('load'),
		page.locator('#_com_liferay_login_web_portlet_LoginPortlet_loginForm button[type="submit"]').click(),
	]);
	await expect(page, 'sign-in should not stop on a first-login screen').not.toHaveURL(/update_password|update_terms_of_use|update_reminder_query/);
	await expect.poll(() => page.evaluate(() => (window as any).Liferay?.ThemeDisplay?.isSignedIn?.()), {message: `signed in as ${email}`}).toBe(true);
}

// A page in its own context, signed in as `who` (or Guest). Close the context when done.

export async function pageAs(browser: Browser, who: Who): Promise<{context: BrowserContext; page: Page}> {
	if (who === 'guest') {
		const context = await browser.newContext({baseURL});

		return {context, page: await context.newPage()};
	}

	const {email, password} = credentials(who);
	const statePath = path.join(AUTH_DIR, `${who.toLowerCase()}.json`);

	if (fs.existsSync(statePath)) {
		const context = await browser.newContext({baseURL, storageState: statePath});
		const page = await context.newPage();

		await page.goto('/web/guest');

		if ((await signedInAs(page)) === email) {
			return {context, page};
		}

		await context.close();
	}

	const context = await browser.newContext({baseURL});
	const page = await context.newPage();

	await signIn(page, email, password);
	fs.mkdirSync(AUTH_DIR, {recursive: true});
	await context.storageState({path: statePath});

	return {context, page};
}

// The page's HTML as the server sent it, after scripts ran: for "the HTML doesn't contain" checks.

export async function html(page: Page): Promise<string> {
	return page.content();
}
