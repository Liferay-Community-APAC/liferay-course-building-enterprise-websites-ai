import {expect, test} from '@playwright/test';

import {pageAs} from '../support/browser';
import {persona, readJson} from '../support/env';
import {exportFragmentSet, exportedFragment, masterHeader, openFragmentSet} from '../support/levels-2-5';

// Level 4.1's criteria say "API": headless-admin-fragment is the API, but it's
// gated by the beta flag LPD-39244, off on a course instance (400
// UnsupportedOperationException). So these read what Liferay returns through the
// admin's Fragments screen: the set's cards, and the set's own Export (a ZIP).

const FRAGMENTS = ['Search Button', 'Login and User Menu', 'Clarity Button', 'Clarity Card', 'FAQ Question and Answer Pair'];

test('AC 4.1-1 · Clarity Components has the five fragments, all approved, none in draft', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await openFragmentSet(page, 'Clarity Components');

	for (const name of FRAGMENTS) {
		const card = page.locator('.card').filter({has: page.getByRole('link', {exact: true, name})});

		await expect(card, name).toHaveCount(1);
		await expect(card.locator('.label'), `${name} status`).toHaveText(['Approved']);
	}

	await expect(page.locator('.card .label', {hasText: /^\s*Draft\s*$/}), 'no fragment in draft').toHaveCount(0);
	await context.close();
});

test("AC 4.1-2 · Search Button's configuration has iconName, iconSize, link, hideLabel and buttonLabel, with the prompt's defaults", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');
	const fragment = exportedFragment(await exportFragmentSet(page, 'Clarity Components'), 'Search Button');

	expect(fragment, 'Search Button in the export').toBeTruthy();

	const fields = Object.fromEntries((fragment!.configuration.fieldSets ?? []).flatMap((set: any) => set.fields).map((field: any) => [field.name, field]));

	expect(Object.keys(fields).sort()).toEqual(['buttonLabel', 'hideLabel', 'iconName', 'iconSize', 'link']);
	expect(fields.iconName).toMatchObject({defaultValue: 'search', type: 'text'});
	expect(fields.iconSize).toMatchObject({defaultValue: '1rem', type: 'select'});
	expect(fields.iconSize.typeOptions.validValues.map((v: any) => v.value)).toEqual(['1rem', '1.5rem', '2rem', '2.5rem', '3rem']);
	expect(fields.link.type).toBe('url');
	expect(fields.hideLabel).toMatchObject({type: 'checkbox'});
	expect(String(fields.hideLabel.defaultValue)).toBe('true');
	expect(fields.buttonLabel).toMatchObject({defaultValue: 'Search', type: 'text'});
	await context.close();
});

test("AC 4.1-3 · Clarity Card's HTML has the editables card-image, category, card-title, summary and card-link", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');
	const fragment = exportedFragment(await exportFragmentSet(page, 'Clarity Components'), 'Clarity Card');

	expect(fragment, 'Clarity Card in the export').toBeTruthy();

	const ids = [...fragment!.html.matchAll(/data-lfr-editable-id="([^"]+)"/g)].map((m) => m[1]);

	for (const id of ['card-image', 'category', 'card-title', 'summary', 'card-link']) {
		expect(ids, id).toContain(id);
	}
	await context.close();
});

test("AC 4.2-1 · as Guest, Home's header has a search icon link and a Sign In button", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const header = masterHeader(page);
	const search = header.getByRole('link', {exact: true, name: 'Search'});

	await expect(search).toBeVisible();
	await expect(search.locator('svg'), 'an icon').toHaveCount(1);
	await expect(header.getByRole('link', {exact: true, name: 'Sign In'})).toBeVisible();
	await context.close();
});

test('AC 4.2-2 · as Guest, the search icon link goes to /web/clarity/search-results', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const search = masterHeader(page).getByRole('link', {exact: true, name: 'Search'});

	await expect(search).toHaveAttribute('href', /\/web\/clarity\/search-results$/);
	await search.click();
	await expect(page).toHaveURL(/\/web\/clarity\/search-results\/?(\?.*)?$/);
	await context.close();
});

test("AC 4.2-3 · as Christian, Home's header has no Sign In button, and has Christian's user menu", async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Christian');
	const {familyName, givenName} = persona('Christian');

	await page.goto('/web/clarity/home');

	const header = masterHeader(page);

	await expect(header.getByRole('button', {name: `${givenName} ${familyName} User Profile`})).toBeVisible();
	await expect(header.getByRole('link', {exact: true, name: 'Sign In'})).toHaveCount(0);
	await expect(header.getByRole('button', {exact: true, name: 'Sign In'})).toHaveCount(0);
	await context.close();
});

test('AC 4.3-1 · as Guest, Home has the heading Elevate Your Brand… and an Explore Products link to Products', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const main = page.locator('#main-content');

	await expect(main.getByRole('heading', {exact: true, name: 'Elevate Your Brand with Premium Eyewear'})).toBeVisible();
	await expect(main.getByRole('link', {exact: true, name: 'Explore Products'})).toHaveAttribute('href', /\/web\/clarity\/products$/);
	await context.close();
});

test('AC 4.3-2 · as Guest, Home has the heading Become a Clarity Distributor with a link to Contact Us', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');

	const heading = page.locator('#main-content').getByRole('heading', {exact: true, name: 'Become a Clarity Distributor'});

	await expect(heading).toBeVisible();

	// The heading's own section: the nearest container holding both the heading and a link.

	const section = heading.locator('xpath=ancestor::div[contains(@class, "lfr-layout-structure-item-container")][.//a][1]');

	await expect(section.locator('a[href$="/web/clarity/contact-us"]')).toHaveCount(1);
	await context.close();
});

test('AC 4.3-3 · as Guest, FAQ has four sections, headed with the four FAQ categories', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');
	const categories = [...new Set(readJson<any[]>('context-source/content/faqs.json').map((faq) => faq.category))];

	expect(categories).toHaveLength(4);

	await page.goto('/web/clarity/faq');

	const main = page.locator('#main-content');

	for (const category of categories) {
		await expect(main.getByRole('heading', {exact: true, name: category}), category).toHaveCount(1);
	}
	await context.close();
});
