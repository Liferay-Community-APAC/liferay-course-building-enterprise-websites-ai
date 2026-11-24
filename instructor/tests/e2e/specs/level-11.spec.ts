import {Page, expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON} from '../support/api';
import {pageAs} from '../support/browser';

const OPEN_POSITIONS = '/web/clarity/open-positions';
const RESULTS = '[id^="p_p_id_com_liferay_portal_search_web_search_results_portlet_SearchResultsPortlet"]';
const FACET = '[id^="p_p_id_com_liferay_portal_search_web_category_facet_portlet_CategoryFacetPortlet"]';

// The results the Search Results widget shows: title and asset type of each.

async function results(page: Page): Promise<{title: string; type: string}[]> {
	await expect(page.locator(`${RESULTS} .search-total-label`)).toBeVisible();

	return page.locator(`${RESULTS} #search-results-display-list > li`).evaluateAll((items) => items.map((li) => ({
		title: (li.querySelector('.list-group-title') as HTMLElement)?.innerText.trim() ?? '',
		type: (li.querySelector('.search-results-metadata .subtext-item strong') as HTMLElement)?.innerText.trim() ?? '',
	})));
}

async function total(page: Page): Promise<number> {
	const label = await page.locator(`${RESULTS} .search-total-label`).innerText();

	return Number(label.match(/(\d+)\s+Results?/i)?.[1] ?? NaN);
}

test('AC 11.1-1 · Careers has an Explore Open Positions link to Open Positions', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/careers');

	const link = page.getByRole('link', {exact: true, name: 'Explore Open Positions'});

	await expect(link).toBeVisible();
	expect(await link.getAttribute('href')).toMatch(/\/web\/clarity\/open-positions\/?$/);

	await Promise.all([page.waitForURL(/\/web\/clarity\/open-positions/), link.click()]);
	await expect(page.locator('input[name="q"]').first()).toBeVisible();
	await context.close();
});

test('AC 11.1-2 · searching "Developer" on Open Positions lists both web developer job listings', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(OPEN_POSITIONS);

	const input = page.locator('input[name="q"]').first();

	await input.fill('Developer');
	await Promise.all([page.waitForURL(/[?&]q=Developer/), input.press('Enter')]);

	const titles = (await results(page)).map((r) => r.title);

	expect(titles).toContain('Associate Web Developer');
	expect(titles).toContain('Senior Web Developer');
	await context.close();
});

test('AC 11.1-3 · the facet groups categories by Job Positions, Location and Region, and Remote narrows the results', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(OPEN_POSITIONS);

	const groups: Record<string, string[]> = Object.fromEntries(await page.locator(`${FACET} fieldset`).evaluateAll((sets) => sets.map((set) => [
		(set.querySelector('legend') as HTMLElement)?.innerText.trim(),
		[...set.querySelectorAll('.facet-value')].map((v) => (v as HTMLElement).innerText.replace(/\(\d+\)/, '').trim()),
	])));

	expect(Object.keys(groups)).toEqual(expect.arrayContaining(['Job Positions', 'Location', 'Region']));
	expect(groups['Location'], 'Remote is in the Location group').toContain('Remote');

	const before = await total(page);
	const remote = page.locator(`${FACET} fieldset`).filter({has: page.locator('legend', {hasText: /^Location$/})}).locator('.facet-value', {hasText: 'Remote'}).locator('input');

	await Promise.all([page.waitForURL(/category=/), remote.check()]);

	const after = await total(page);

	expect(after, `results after Remote (before: ${before})`).toBeGreaterThan(0);
	expect(after).toBeLessThan(before);
	await context.close();
});

test('AC 11.2-1 · the blueprint "Boost Associate Job Listings" exists', async () => {
	const api = await adminApi();
	const titles = (await getAll(api, '/o/search-experiences-rest/v1.0/sxp-blueprints')).map((b) => b.title);

	expect(titles).toContain('Boost Associate Job Listings');
	await api.dispose();
});

test('AC 11.2-2 · an empty search on Open Positions lists only job listings, Associate ones first', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(OPEN_POSITIONS);

	const listed = await results(page);

	expect(listed.length, 'results of an empty search').toBeGreaterThan(0);
	expect(listed.filter((r) => r.type !== 'Job Listing'), 'results that are not job listings').toEqual([]);

	const associate = listed.map((r) => /associate/i.test(r.title));
	const firstOther = associate.indexOf(false);

	expect(associate.some(Boolean), 'an Associate listing is shown').toBe(true);
	expect(firstOther === -1 || !associate.slice(firstOther).some(Boolean), `Associate listings first: ${listed.map((r) => r.title).join(' | ')}`).toBe(true);
	await context.close();
});

test('AC 11.3-1 · Events lists Summer Job Fair, Campus Recruiting Event and Clarity Vision Showcase 2027 in order, not Spring Job Fair', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/events');
	await expect(page.getByRole('heading', {name: 'Upcoming Events'})).toBeVisible();

	const titles = await page.locator('.lfr-layout-structure-item-collection h4').allInnerTexts();

	expect(titles.map((t) => t.trim())).toEqual(['Summer Job Fair', 'Campus Recruiting Event', 'Clarity Vision Showcase 2027']);
	expect(await page.content()).not.toContain('Spring Job Fair');
	await context.close();
});

test('AC 11.3-2 · the Footer Resources Menu has Events right after Careers', async () => {
	const api = await adminApi();
	const menus = await getAll(api, '/o/headless-admin-site/v1.0/sites/clarity-public/navigation-menus');
	const menu = menus.find((m) => m.name === 'Footer Resources Menu');

	expect(menu, 'Footer Resources Menu').toBeTruthy();

	const items = menu.navigationMenuItems ?? [];
	const careers = items.findIndex((i: any) => i.name === 'Careers');

	expect(careers, 'Careers in the menu').toBeGreaterThanOrEqual(0);

	const events = items[careers + 1];

	expect(events?.name, 'the item after Careers').toBe('Events');

	const pageERC = events.navigationMenuItemSettings?.externalReferenceCode;
	const target = await getJSON(api, `/o/headless-admin-site/v1.0/sites/clarity-public/site-pages/${pageERC}`);

	expect(Object.values(target.friendlyUrlPath_i18n ?? {}).concat(target.friendlyUrlPath ?? [])).toContain('/events');
	await api.dispose();
});
