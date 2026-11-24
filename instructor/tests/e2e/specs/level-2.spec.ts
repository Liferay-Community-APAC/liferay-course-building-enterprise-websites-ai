import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON} from '../support/api';
import {pageAs} from '../support/browser';
import {PERSONA_PASSWORD, adminCredentials, baseURL, persona} from '../support/env';
import {USER, briefSiteDescription, siteId} from '../support/levels-2-5';

const SITES = '/o/headless-admin-site/v1.0/sites';
const SITE_SETTINGS = (site: string) => `/group/${site}/~/control_panel/manage?p_p_id=com_liferay_site_admin_web_portlet_SiteSettingsPortlet`;

test('AC 2.1-1 · clarity-public is Clarity Public Enterprise Website at /clarity', async () => {
	const api = await adminApi();
	const site = await getJSON(api, `${SITES}/clarity-public`);

	expect(site.name).toBe('Clarity Public Enterprise Website');
	expect(site.friendlyUrlPath).toBe('/clarity');
	await api.dispose();
});

test('AC 2.1-2 · clarity-distributor-portal is Clarity Distributor Portal at /distributor-portal', async () => {
	const api = await adminApi();
	const site = await getJSON(api, `${SITES}/clarity-distributor-portal`);

	expect(site.name).toBe('Clarity Distributor Portal');
	expect(site.friendlyUrlPath).toBe('/distributor-portal');
	await api.dispose();
});

test('AC 2.2-1 · the members of clarity-public are the five personas and the admin, and no one else', async () => {
	const api = await adminApi();
	const members = await getAll(api, `${USER}/sites/${await siteId(api)}/user-accounts`);
	const expected = ['Walter', 'Christian', 'Harper', 'Ian', 'Clara'].map((name) => persona(name).emailAddress);

	expected.push(adminCredentials().email);

	expect(members.map((m) => m.emailAddress).sort()).toEqual(expected.sort());
	await api.dispose();
});

test('AC 2.2-2 · Walter is Site Administrator, Christian and Harper are Site Content Contributors', async () => {
	const api = await adminApi();
	const members = await getAll(api, `${USER}/sites/${await siteId(api)}/user-accounts`);
	const siteRoles = (givenName: string) => {
		const member = members.find((m) => m.emailAddress === persona(givenName).emailAddress);
		const brief = (member?.siteBriefs ?? []).find((s: any) => s.name === 'Clarity Public Enterprise Website');

		return (brief?.roleBriefs ?? []).map((r: any) => r.name);
	};

	expect(siteRoles('Walter'), 'Walter Douglas').toContain('Site Administrator');
	expect(siteRoles('Christian'), 'Christian Carter').toContain('Site Content Contributor');
	expect(siteRoles('Harper'), 'Harper Roberts').toContain('Site Content Contributor');
	await api.dispose();
});

test('AC 2.3-1 · clarity-public has the membership type Open and the description from the brief', async () => {
	const api = await adminApi();
	const site = await getJSON(api, `${SITES}/clarity-public`);

	expect(site.description).toBe(briefSiteDescription());
	expect(site.membershipType).toBe('open');
	await api.dispose();
});

test("AC 2.3-2 · clarity-public's languages are exactly English (US), the default, and Spanish (Spain)", async () => {
	const api = await adminApi();
	const site = await getJSON(api, `${SITES}/clarity-public`);

	expect(site.defaultLanguageId).toBe('en_US');
	expect(site.inheritLocales, 'a custom set of languages, not the instance\'s').toBe(false);
	expect([...site.locales].sort()).toEqual(['en-US', 'es-ES']);
	await api.dispose();
});

test("AC 2.3-3 · clarity-public's public pages have the virtual host www.clarityvisionsolutions.com", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await page.goto(SITE_SETTINGS('clarity'));
	await page.getByRole('link', {name: 'Site Configuration', exact: true}).click();
	await page.getByRole('menuitem', {name: 'Site URL', exact: true}).click();
	await expect(page.locator('input[name$="groupFriendlyURL"]')).toHaveValue('/clarity');

	const hosts = await page.locator('input[name$="publicVirtualHostname[]"]').evaluateAll((inputs) => inputs.map((i) => (i as HTMLInputElement).value));

	expect(hosts, 'public pages virtual hosts').toContain('www.clarityvisionsolutions.com');
	await context.close();
});

test("AC 2.3-4 · the accessibility menu is enabled in clarity-public's site settings, and not in the distributor portal's", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');
	const enabled = async (site: string) => {
		await page.goto(SITE_SETTINGS(site));
		await page.getByRole('link', {name: 'Accessibility', exact: true}).click();

		const checkbox = page.locator('input[type="checkbox"][name*="enableAccessibilityMenu"]');

		await expect(checkbox).toHaveCount(1);

		return checkbox.isChecked();
	};

	expect(await enabled('clarity'), 'clarity-public').toBe(true);
	expect(await enabled('distributor-portal'), 'clarity-distributor-portal').toBe(false);
	await context.close();
});

test('AC 2.4-1 · Marketing Coordinator has the collection and category permissions, and no PERMISSIONS or DELETE', async () => {
	const api = await adminApi();
	const role = (await getAll(api, `${USER}/roles`)).find((r) => r.name === 'Marketing Coordinator');

	expect(role, 'the Marketing Coordinator role').toBeTruthy();

	const permissions: any[] = role.rolePermissions ?? [];
	const required: Record<string, string[]> = {
		'com.liferay.asset.categories': ['ADD_CATEGORY', 'ADD_VOCABULARY'],
		'com.liferay.asset.kernel.model.AssetCategory': ['UPDATE', 'VIEW'],
		'com.liferay.asset.list': ['ADD_ASSET_LIST_ENTRY'],
		'com.liferay.asset.list.model.AssetListEntry': ['UPDATE', 'VIEW'],
		com_liferay_asset_categories_admin_web_portlet_AssetCategoriesAdminPortlet: ['ACCESS_IN_CONTROL_PANEL', 'VIEW'],
		com_liferay_asset_list_web_portlet_AssetListPortlet: ['ACCESS_IN_CONTROL_PANEL', 'VIEW'],
	};

	for (const [resourceName, actions] of Object.entries(required)) {
		const granted = permissions.filter((p) => p.resourceName === resourceName && p.scope === 1).flatMap((p) => p.actionIds);

		for (const action of actions) {
			expect(granted, `${resourceName} ${action} at company scope`).toContain(action);
		}
	}

	const forbidden = permissions.flatMap((p) => p.actionIds.filter((a: string) => a === 'PERMISSIONS' || a === 'DELETE').map((a: string) => `${p.resourceName} ${a}`));

	expect(forbidden, 'no PERMISSIONS or DELETE action').toEqual([]);
	await api.dispose();
});

test("AC 2.4-2 · as Christian, the public site's Collections and Categories open, each with a New button", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Christian');

	// Collections has a "New" button. Categories shows "New" only on a vocabulary
	// of this site; while the site has none (its vocabularies are Global or come
	// from CMS Spaces, read only here), the creation control is "Add New Vocabulary".

	for (const [portlet, title, label] of [
		['com_liferay_asset_list_web_portlet_AssetListPortlet', 'Collections', /^New$/],
		['com_liferay_asset_categories_admin_web_portlet_AssetCategoriesAdminPortlet', 'Categories', /^(New|Add New Vocabulary)$/],
	] as const) {
		const response = await page.goto(`/group/clarity/~/control_panel/manage?p_p_id=${portlet}`);

		expect(response?.status(), title).toBe(200);
		await expect(page, title).toHaveTitle(new RegExp(`^${title} - Clarity Public Enterprise Website`));
		await expect(page.locator('#main-content'), title).not.toContainText(/do not have (the )?(required )?permission/i);
		const main = page.locator('#main-content');

		await expect(main.getByRole('button', {name: label}).or(main.getByRole('link', {name: label})).first(), `${title}: a New button`).toBeVisible();
	}
	await context.close();
});

test('AC 2.5-1 · as Guest, / shows the Clarity public site', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	// The instance's Home URL makes Liferay serve the site at / itself: no redirect.

	await page.goto('/');
	await expect(page).toHaveTitle(/Clarity Public Enterprise Website/);
	await context.close();
});

test('AC 2.5-2 · as Christian, signing in through /c/portal/login ends on /web/clarity', async ({browser}) => {
	const context = await browser.newContext({baseURL});
	const page = await context.newPage();
	const {emailAddress} = persona('Christian');

	await page.goto('/c/portal/login');
	await page.locator('#_com_liferay_login_web_portlet_LoginPortlet_login').fill(emailAddress);
	await page.locator('#_com_liferay_login_web_portlet_LoginPortlet_password').fill(PERSONA_PASSWORD);
	await Promise.all([
		page.waitForLoadState('load'),
		page.locator('#_com_liferay_login_web_portlet_LoginPortlet_loginForm button[type="submit"]').click(),
	]);
	await page.waitForURL((url) => !/\/c\/portal\/login|\/sign-in/.test(url.pathname));
	await page.waitForLoadState('load');
	expect(await page.evaluate(() => (window as any).Liferay.ThemeDisplay.isSignedIn()), 'signed in').toBe(true);
	await expect(page).toHaveURL(/\/web\/clarity\/?(\?.*)?$/);
	await context.close();
});
