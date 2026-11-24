import {expect, test} from '@playwright/test';

import {adminApi, getAll} from '../support/api';
import {pageAs} from '../support/browser';
import {SITE, briefBrandPrimary, masterPage, rgb} from '../support/levels-2-5';

// Clarity Theme CSS's client extension ERC: "LXC:" + its key in client-extension.yaml.

const THEME_CSS_ERC = 'LXC:clarity-theme-css';

test('AC 5.1-1 · Design › Style Books lists Clarity Style Book, marked as the default', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await page.goto('/group/clarity/~/control_panel/manage?p_p_id=com_liferay_style_book_web_internal_portlet_StyleBookPortlet');

	const title = page.locator('.card-title[title="Clarity Style Book"]');

	await expect(title).toHaveCount(1);
	await expect(title).toHaveAttribute('aria-label', 'Clarity Style Book (Marked as Default)');
	await context.close();
});

test('AC 5.2-1 · Applications › Client Extensions lists Clarity Theme CSS and Clarity Favicon, both ready', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await page.goto('/group/guest/~/control_panel/manage?p_p_id=com_liferay_client_extension_web_internal_portlet_ClientExtensionAdminPortlet');

	// "Ready" is the status this release shows as Approved.

	for (const [name, type] of [['Clarity Theme CSS', 'Theme CSS'], ['Clarity Favicon', 'Theme Favicon']]) {
		const row = page.getByRole('row').filter({has: page.getByRole('link', {exact: true, name})});

		await expect(row, name).toHaveCount(1);
		await expect(row.locator('td.cell-type'), `${name} type`).toHaveText(type);
		await expect(row.locator('td.cell-status'), `${name} status`).toHaveText('Approved');
	}

	await expect(page.locator(`td[data-id="string,${THEME_CSS_ERC}:name"]`), 'Clarity Theme CSS is the clarity-theme-css entry').toHaveText('Clarity Theme CSS');
	await context.close();
});

test('AC 5.2-2 · as Guest, the Clarity Theme CSS stylesheet that Home links to answers 200 with CSS', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const href = await page.locator('link#liferayThemeCSS').getAttribute('href');

	expect(href, 'the theme stylesheet link').toMatch(/\/o\/clarity-theme\/css\/main\.css/);

	const response = await page.request.get(new URL(href!, page.url()).toString());

	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toMatch(/^text\/css/);
	expect(await response.text()).toContain('--color-brand-primary');
	await context.close();
});

test("AC 5.3-1 · as Guest, Home links the Clarity Theme CSS stylesheet and Clarity's favicon", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');
	await expect(page.locator('link#liferayThemeCSS')).toHaveAttribute('href', /\/o\/clarity-theme\/css\/main\.css/);
	await expect(page.locator('link[rel="stylesheet"][href*="/o/classic-theme/css/main.css"]'), "Classic's own stylesheet").toHaveCount(0);

	const favicon = page.locator('link[rel="icon"]');

	await expect(favicon).toHaveCount(1);
	await expect(favicon).toHaveAttribute('href', /clarity-favicon\.svg$/);

	const response = await page.request.get(new URL((await favicon.getAttribute('href'))!, page.url()).toString());

	expect(response.status(), 'the favicon answers').toBe(200);
	await context.close();
});

test("AC 5.3-2 · as Guest, Home's text is in Poppins, and Explore Products has the brand primary color", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const main = page.locator('#main-content');
	const heading = main.getByRole('heading', {exact: true, name: 'Elevate Your Brand with Premium Eyewear'});
	const button = main.getByRole('link', {exact: true, name: 'Explore Products'});

	for (const [what, locator] of [['body', page.locator('body')], ['heading', heading], ['button', button]] as const) {
		expect(await locator.evaluate((e) => getComputedStyle(e).fontFamily), `${what} font`).toMatch(/^"?Poppins"?,/);
	}

	await page.evaluate(() => document.fonts.ready);
	expect(await page.evaluate(() => document.fonts.check('16px Poppins')), 'Poppins is loaded').toBe(true);
	expect(await button.evaluate((e) => getComputedStyle(e).backgroundColor), 'Explore Products background').toBe(rgb(briefBrandPrimary()));
	await context.close();
});

test('AC 5.3-3 · both master pages use Clarity Theme CSS', async () => {
	const api = await adminApi();

	for (const name of ['Primary Master Page', 'Secondary Master Page']) {
		const master = await masterPage(api, name);

		expect(master, name).toBeTruthy();

		const specifications = await getAll(api, `${SITE}/master-pages/${master.externalReferenceCode}/page-specifications`);

		expect(specifications.length, `${name} specifications`).toBeGreaterThan(0);

		for (const specification of specifications) {
			expect(specification.settings?.themeCSSClientExtension?.externalReferenceCode, `${name} (${specification.externalReferenceCode})`).toBe(THEME_CSS_ERC);
		}
	}
	await api.dispose();
});
