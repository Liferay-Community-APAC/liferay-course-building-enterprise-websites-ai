import {Page, expect, test} from '@playwright/test';

import {adminApi, getAll} from '../support/api';
import {pageAs} from '../support/browser';
import {
	SITE,
	SITE_PATH,
	categoriesOf,
	displayPageURL,
	entries,
	expectImageLoads,
	filePath,
	folder,
	imageURLs,
	newest,
	space,
	spaceFiles,
	structure,
	text,
} from '../support/levels-6-9';

// The Helpful Articles section of a page: the container whose heading names it, and its cards.

function helpfulArticles(page: Page) {
	return page
		.locator('.lfr-layout-structure-item-container')
		.filter({has: page.getByRole('heading', {name: /Helpful Articles/})})
		.last()
		.locator('.clarity-card');
}

test("AC 7.1-1 · Home's banner, promotion, gradient and distributor images load, each a Marketing file", async ({browser}) => {
	const api = await adminApi();
	const marketing = await spaceFiles(api, 'space-marketing');
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/home`);

	const urls = await imageURLs(page);

	for (const name of ['home-banner-narrow-no-background', 'sunglasses-on-shelves', 'gradient-overlay', 'home-promotion']) {
		const url = urls.find((u) => new RegExp(`/${name}\\.[a-z]+(/|\\?|$)`).test(filePath(u) + '/'));

		expect(url, `Home renders ${name}`).toBeTruthy();
		expect(marketing.has(filePath(url!)), `${name} is a file of the Marketing Space (${filePath(url!)})`).toBe(true);
		await expectImageLoads(page, url!);
	}

	await context.close();
	await api.dispose();
});

test('AC 7.1-2 · the header logo is the Branding logo-name-vector file, links to Home, and is at most 200px wide', async ({browser}) => {
	const api = await adminApi();
	const branding = await spaceFiles(api, 'space-branding');
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/faq`);

	// The header logo: the topmost image outside the page's own content.

	const logo = page.locator('img:not(#main-content img)').first();

	await expect(logo).toBeVisible();

	const src = (await logo.evaluate((img: HTMLImageElement) => img.src)) as string;
	const file = branding.get(filePath(src));

	expect(file, `the header logo ${filePath(src)} is a Branding Space file`).toBeTruthy();
	expect(file.file.name).toMatch(/^logo-name-vector\./);
	expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth), 'the logo loads').toBeGreaterThan(0);
	expect((await logo.boundingBox())!.width, 'the logo is at most 200px wide').toBeLessThanOrEqual(200);

	await logo.click();
	await expect(page).toHaveURL(new RegExp(`${SITE_PATH}(/home)?/?$`));

	await context.close();
	await api.dispose();
});

test('AC 7.2-1 · the display page templates Article and Leadership Profile are the defaults for their structures', async () => {
	const api = await adminApi();
	const templates = await getAll(api, `/o/headless-admin-site/v1.0/sites/${SITE}/display-page-templates`);

	for (const [name, erc] of [['Article', 'ARTICLE_STRUCTURE'], ['Leadership Profile', 'LEADERSHIP_PROFILE_STRUCTURE']]) {
		const {className} = await structure(api, erc);
		const template = templates.find((t) => t.name === name);

		expect(template, `display page template ${name}`).toBeTruthy();
		expect(template.contentTypeReference?.className, `${name} is for ${erc}`).toBe(className);
		expect(template.markedAsDefault, `${name} is the default`).toBe(true);
	}
	await api.dispose();
});

test("AC 7.2-2 · an Article's display page shows its title and headline, a profile's its name, job title and bio", async ({browser}) => {
	const api = await adminApi();
	const marketing = await space(api, 'space-marketing');
	const articlesFolder = await folder(api, 'space-marketing', 'L_CONTENTS', 'Articles');
	const article = (await entries(api, '/o/c/articles', 'space-marketing')).find((a) => a.objectEntryFolderId === articlesFolder.id && a.status.code === 0 && a.headline);
	const profile = (await entries(api, '/o/c/leadershipprofiles', 'space-marketing')).find((p) => p.status.code === 0 && p.bioRawText);
	const {context, page} = await pageAs(browser, 'guest');
	const main = page.locator('#main-content');

	let response = await page.goto(displayPageURL((await structure(api, 'ARTICLE_STRUCTURE')).name, marketing.id, article.friendlyUrlPath));

	expect(response?.status(), `article ${article.title}`).toBe(200);
	await expect(main).toContainText(article.title);
	await expect(main).toContainText(article.headline);

	response = await page.goto(displayPageURL((await structure(api, 'LEADERSHIP_PROFILE_STRUCTURE')).name, marketing.id, profile.friendlyUrlPath));

	expect(response?.status(), `profile ${profile.title}`).toBe(200);
	await expect(main).toContainText(profile.title);
	await expect(main).toContainText(profile.jobTitle);
	await expect(main).toContainText(text(profile.bio).slice(0, 60));

	await context.close();
	await api.dispose();
});

test("AC 7.3-1 · Home's Helpful Articles shows three cards, newest Article first, each with image, category, title and summary", async ({browser}) => {
	const api = await adminApi();
	const latest = newest(await entries(api, '/o/c/articles', 'space-marketing'));
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/home`);

	const cards = helpfulArticles(page);

	await expect(cards).toHaveCount(3);
	await expect(cards.first().locator('.clarity-card__title'), 'the newest Article comes first').toHaveText(latest.title);

	for (let i = 0; i < 3; i++) {
		const card = cards.nth(i);
		const title = (await card.locator('.clarity-card__title').innerText()).trim();

		expect(title, `card ${i + 1} title`).not.toBe('');
		expect(await card.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), `${title}: image loads`).toBe(true);
		expect((await card.locator('.clarity-card__category').innerText()).trim(), `${title}: category`).not.toBe('');
		expect((await card.locator('.clarity-card__summary').innerText()).trim(), `${title}: summary`).not.toBe('');
	}

	await context.close();
	await api.dispose();
});

test("AC 7.3-2 · each Helpful Articles card's link opens that Article's display page", async ({browser}) => {
	const api = await adminApi();
	const articleStructure = await structure(api, 'ARTICLE_STRUCTURE');
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/home`);

	const cards = helpfulArticles(page);

	await expect(cards).toHaveCount(3);

	for (let i = 0; i < 3; i++) {
		const card = helpfulArticles(page).nth(i);
		const title = (await card.locator('.clarity-card__title').innerText()).trim();

		await card.getByRole('link').last().click();
		await expect(page, `${title} opens its display page`).toHaveURL(new RegExp(`/c_${articleStructure.name.toLowerCase()}/`));
		await expect(page.locator('#main-content h1, #main-content h2').first()).toHaveText(title);
		await page.goBack();
	}

	await context.close();
	await api.dispose();
});

test('AC 7.4-1 · FAQ lists the FAQs under their four categories, eight in total', async ({browser}) => {
	const api = await adminApi();
	const faqFolder = await folder(api, 'space-marketing', 'L_CONTENTS', 'FAQ');
	const faqs = (await entries(api, '/o/c/faqs', 'space-marketing')).filter((f) => f.objectEntryFolderId === faqFolder.id && f.status.code === 0);
	const byCategory = new Map<string, string[]>();

	for (const faq of faqs) {
		for (const category of categoriesOf(faq, 'VOCABULARY_FAQ')) {
			byCategory.set(category, [...(byCategory.get(category) ?? []), faq.title]);
		}
	}

	expect(byCategory.size).toBe(4);

	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/faq`);

	let total = 0;

	for (const [category, titles] of byCategory) {
		const section = page
			.locator('.lfr-layout-structure-item-container')
			.filter({has: page.getByRole('heading', {exact: true, name: category})})
			.last();
		const questions = (await section.locator('.clarity-faq__question').allInnerTexts()).map((q) => q.trim());

		expect(questions.sort(), `the questions under ${category}`).toEqual([...titles].sort());
		total += questions.length;
	}

	expect(total).toBe(8);
	await expect(page.locator('#main-content .clarity-faq__question')).toHaveCount(8);

	await context.close();
	await api.dispose();
});

test('AC 7.4-2 · expanding "What is your return policy?" shows its answer', async ({browser}) => {
	const api = await adminApi();
	const faq = (await entries(api, '/o/c/faqs', 'space-marketing')).find((f) => f.title === 'What is your return policy?');
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/faq`);

	const pair = page.locator('.clarity-faq').filter({hasText: 'What is your return policy?'});
	const answer = pair.locator('.clarity-faq__answer');

	await expect(answer).toBeHidden();
	await pair.getByRole('button', {name: 'What is your return policy?'}).click();
	await expect(answer).toBeVisible();
	await expect(answer).toContainText(text(faq.answer).slice(0, 60));

	await context.close();
	await api.dispose();
});

test('AC 7.5-1 · Home and FAQ show the announcement bar with the newest Announcement and its link', async ({browser}) => {
	const api = await adminApi();
	const announcement = newest(await entries(api, '/o/c/announcements', 'space-marketing'));
	const {context, page} = await pageAs(browser, 'guest');

	for (const path of ['/home', '/faq']) {
		await page.goto(`${SITE_PATH}${path}`);

		const bar = page.locator('.lfr-layout-structure-item-collection').filter({hasText: announcement.message}).first();

		await expect(bar, `${path} shows "${announcement.message}"`).toBeVisible();

		const link = bar.getByRole('link', {name: announcement.linkText});

		await expect(link).toBeVisible();
		expect(new URL((await link.getAttribute('href'))!, page.url()).pathname).toBe(announcement.linkURL);
		await expect(page.locator('#main-content').getByText(announcement.message), 'the bar is outside the page content').toHaveCount(0);
	}

	await context.close();
	await api.dispose();
});
