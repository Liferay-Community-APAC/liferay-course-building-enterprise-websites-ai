import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON, guestApi} from '../support/api';
import {pageAs} from '../support/browser';
import {SITE, masterFooter, masterHeader, masterPage, pageElements, sitePages} from '../support/levels-2-5';

// The pages of 3.1, in order, with their parent.

const PAGES = [
	{title: 'Home', url: '/home'},
	{title: 'Products', url: '/products'},
	{parent: 'Products', title: 'Product List', url: '/product-list'},
	{title: 'About Us', url: '/about-us'},
	{title: 'Blog', url: '/blog'},
	{title: 'FAQ', url: '/faq'},
	{title: 'Careers', url: '/careers'},
	{parent: 'Careers', title: 'Open Positions', url: '/open-positions'},
	{title: 'Contact Us', url: '/contact-us'},
	{title: 'Search', url: '/search-results'},
];

test('AC 3.1-1 · clarity-public has the public content pages of 3.1, in order, at their friendly URLs', async () => {
	const api = await adminApi();
	const guest = await guestApi();
	const pages = await sitePages(api);
	const byTitle = (title: string) => pages.find((p) => p.title === title);

	for (const expected of PAGES) {
		const sitePage = byTitle(expected.title);

		expect(sitePage, expected.title).toBeTruthy();
		expect(sitePage.type, `${expected.title} type`).toBe('ContentPage');
		expect(sitePage.url, `${expected.title} friendly URL`).toBe(expected.url);
		expect(sitePage.parentSitePageExternalReferenceCode ?? null, `${expected.title} parent`).toBe(expected.parent ? byTitle(expected.parent).externalReferenceCode : null);
		expect((await guest.get(`/web/clarity${expected.url}`)).status(), `Guest opens ${expected.url} (a public page)`).toBe(200);
	}

	// Order among siblings: later levels add pages (Events, Contact Us Responses), so compare the 3.1 pages' relative order.

	const order = (parent: string | undefined) => pages
		.filter((p) => (p.parentSitePageExternalReferenceCode ?? null) === (parent ? byTitle(parent).externalReferenceCode : null))
		.sort((a, b) => a.pageSettings.priority - b.pageSettings.priority)
		.map((p) => p.title)
		.filter((title) => PAGES.some((e) => e.title === title));

	expect(order(undefined), 'top-level order').toEqual(PAGES.filter((p) => !p.parent).map((p) => p.title));
	await api.dispose();
	await guest.dispose();
});

test('AC 3.1-2 · clarity-public still has the membership type Open, and only English and Spanish', async () => {
	const api = await adminApi();
	const site = await getJSON(api, SITE);

	expect(site.membershipType).toBe('open');
	expect(site.inheritLocales, 'a custom set of languages').toBe(false);
	expect([...site.locales].sort()).toEqual(['en-US', 'es-ES']);
	await api.dispose();
});

test('AC 3.1-3 · as Guest, /web/clarity/home answers with a page', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');
	const response = await page.goto('/web/clarity/home');

	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle(/^Home - /);
	await context.close();
});

test('AC 3.2-1 · both master pages exist, and every page of 3.1 uses the Primary Master Page', async () => {
	const api = await adminApi();
	const primary = await masterPage(api, 'Primary Master Page');

	expect(primary, 'Primary Master Page').toBeTruthy();
	expect(await masterPage(api, 'Secondary Master Page'), 'Secondary Master Page').toBeTruthy();

	const pages = await sitePages(api);

	for (const expected of PAGES) {
		const sitePage = pages.find((p) => p.title === expected.title);
		const specifications = await getAll(api, `${SITE}/site-pages/${sitePage.externalReferenceCode}/page-specifications`);

		expect(specifications.length, `${expected.title} specifications`).toBeGreaterThan(0);

		for (const specification of specifications) {
			expect(specification.settings?.masterPageItemExternalReference?.externalReferenceCode, `${expected.title} (${specification.externalReferenceCode}) master`).toBe(primary.externalReferenceCode);
		}
	}
	await api.dispose();
});

test("AC 3.2-2 · the Primary Master Page's drop zone disallows the Footers and Navigation Bars fragment sets", async () => {
	const api = await adminApi();
	const primary = await masterPage(api, 'Primary Master Page');
	const specifications = await getAll(api, `${SITE}/master-pages/${primary.externalReferenceCode}/page-specifications`);
	const published = specifications.find((s) => !s.externalReferenceCode.endsWith('-draft'));
	const dropZones = pageElements(published).filter((e) => e.pageElementDefinition?.type === 'DropZone');

	expect(dropZones, 'one drop zone').toHaveLength(1);

	const definition = dropZones[0].pageElementDefinition;

	// With addNewFragmentEntries true, the drop zone allows every fragment except
	// the listed ones (the DTO names the list allowedFragmentReferences either way).

	expect(definition.addNewFragmentEntries, 'all other fragments allowed').toBe(true);

	const keys = definition.allowedFragmentReferences.map((r: any) => r.defaultFragmentKey ?? r.key).sort();

	expect(keys).toEqual(['FOOTERS-footer-nav-dark', 'FOOTERS-footer-nav-light', 'NAVIGATION_BARS-header-dark', 'NAVIGATION_BARS-header-light']);
	await api.dispose();
});

test("AC 3.2-3 · as Guest, Home shows © Clarity Vision Solutions, and none of the Classic theme's header or footer", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');
	await expect(masterFooter(page)).toContainText('© Clarity Vision Solutions');
	await expect(page.locator('header#banner'), "Classic's header").toHaveCount(0);
	await expect(page.locator('footer#footer'), "Classic's footer").toHaveCount(0);
	await context.close();
});

test('AC 3.3-1 · the four menus exist, each with the items in the brief', async () => {
	const api = await adminApi();
	const menus = await getAll(api, `${SITE}/navigation-menus`);
	const pages = await sitePages(api);
	const items = (name: string) => {
		const menu = menus.find((m) => m.name === name);

		expect(menu, name).toBeTruthy();

		return (menu.navigationMenuItems ?? []).map((item: any) => ({
			name: item.name,
			newTab: item.navigationMenuItemSettings?.useNewTab,
			page: pages.find((p) => p.externalReferenceCode === item.navigationMenuItemSettings?.externalReferenceCode)?.title,
			type: item.type,
			url: item.navigationMenuItemSettings?.url,
		}));
	};
	const pageItems = (name: string) => items(name).map((item: any) => {
		expect(item.type, `${name} › ${item.name} links a page`).toBe('layout');

		return item.page;
	});

	expect(pageItems('Header Page Menu')).toEqual(['Products', 'About Us', 'Blog', 'FAQ', 'Careers', 'Contact Us']);

	const resources = pageItems('Footer Resources Menu');

	expect(resources.slice(0, 3)).toEqual(['Blog', 'FAQ', 'Careers']);
	expect(resources.slice(3), 'only Events after them (Level 11)').toEqual(resources.length > 3 ? ['Events'] : []);
	expect(pageItems('Footer Company Menu')).toEqual(['About Us', 'Contact Us']);
	expect(items('Footer Legal Menu')).toEqual([
		{name: 'Privacy Policy', newTab: true, page: undefined, type: 'url', url: 'https://www.clarityvisionsolutions.com/privacy'},
		{name: 'Terms of Use', newTab: true, page: undefined, type: 'url', url: 'https://www.clarityvisionsolutions.com/terms'},
	]);
	await api.dispose();
});

test("AC 3.3-2 · as Guest, Home's header has Products, About Us, Blog, FAQ, Careers and Contact Us, in that order", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');
	await expect(masterHeader(page).getByRole('menuitem')).toHaveText(['Products', 'About Us', 'Blog', 'FAQ', 'Careers', 'Contact Us']);
	await context.close();
});

test('AC 3.3-3 · as Guest, clicking FAQ in the header opens /web/clarity/faq', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');
	await masterHeader(page).getByRole('menuitem', {name: 'FAQ', exact: true}).click();
	await expect(page).toHaveURL(/\/web\/clarity\/faq\/?(\?.*)?$/);
	await expect(page).toHaveTitle(/^FAQ - /);
	await context.close();
});

test("AC 3.3-4 · as Guest, the footer's legal links go to the privacy and terms URLs, in a new tab", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	for (const [name, href] of [
		['Privacy Policy', 'https://www.clarityvisionsolutions.com/privacy'],
		['Terms of Use', 'https://www.clarityvisionsolutions.com/terms'],
	]) {
		const link = masterFooter(page).getByRole('menuitem', {name, exact: true});

		await expect(link).toHaveAttribute('href', href);
		await expect(link).toHaveAttribute('target', '_blank');
	}
	await context.close();
});
