import {expect, test} from '@playwright/test';

import {adminApi} from '../support/api';
import {pageAs} from '../support/browser';
import {readJson} from '../support/env';
import {
	SITE_PATH,
	catalogProducts,
	categoriesOf,
	categoryNames,
	entriesInFolder,
	folder,
	vocabularies,
} from '../support/levels-6-9';

const POST_TITLE = 'Things I Find Interesting in Eyewear';

test('AC 9.1-1 · the API Explorer lists headless-admin-user/v1.0 and headless-batch-engine/v1.0', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await page.goto('/o/api');
	await expect(page.getByRole('heading', {level: 1}).first(), 'the explorer has loaded an application').toBeVisible({timeout: 30_000});
	await page.getByText('REST Applications', {exact: true}).click();

	for (const application of ['headless-admin-user/v1.0', 'headless-batch-engine/v1.0']) {
		await expect(page.locator('.dropdown-item').getByText(application, {exact: true}), application).toBeVisible();
	}
	await context.close();
});

test('AC 9.2-1 · the Blog folder has the legacy post, with a cover image and a Blog Topics category', async () => {
	const api = await adminApi();
	const blogFolder = await folder(api, 'space-marketing', 'L_CONTENTS', 'Blog');
	const topics = (await vocabularies(api, 'space-marketing')).get('Blog Topics');
	const post = (await entriesInFolder(api, '/o/cms/blogs', 'space-marketing', blogFolder.id)).find((p) => p.title === POST_TITLE);

	expect(topics, 'Blog Topics vocabulary in Marketing').toBeTruthy();
	expect(post, POST_TITLE).toBeTruthy();
	expect(post.coverImage?.id, 'cover image').toBeTruthy();
	expect(categoriesOf(post, topics.externalReferenceCode).length, 'a Blog Topics category').toBeGreaterThan(0);
	await api.dispose();
});

test('AC 9.2-2 · the Articles folder has at least six articles', async () => {
	const api = await adminApi();
	const articlesFolder = await folder(api, 'space-marketing', 'L_CONTENTS', 'Articles');
	const articles = await entriesInFolder(api, '/o/c/articles', 'space-marketing', articlesFolder.id);
	const titles = articles.map((a) => a.title);

	expect(articles.length).toBeGreaterThanOrEqual(6);

	for (const legacy of readJson<any[]>('context-source/legacy-import/legacy-articles.json')) {
		expect(titles, 'a legacy article').toContain(legacy.title);
	}
	await api.dispose();
});

test('AC 9.2-3 · Blog shows the post as a card, and its link opens the Blog Post display page with title and image', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/blog`);

	const card = page.locator('#main-content .clarity-card').filter({hasText: POST_TITLE});

	await expect(card).toBeVisible();
	await card.getByRole('link').last().click();
	await expect(page, 'the Blog structure display page').toHaveURL(/\/cmsblog\//);

	const main = page.locator('#main-content');

	await expect(main.getByRole('heading', {level: 1})).toHaveText(POST_TITLE);

	const image = main.locator('img').first();

	await expect(image).toBeVisible();
	expect(await image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), 'the cover image loads').toBe(true);
	await context.close();
});

test('AC 9.3-1 · Clarity Eyewear has at least 11 products, including the eight legacy ones', async () => {
	const api = await adminApi();
	const products = await catalogProducts(api);
	const ercs = products.map((p) => p.externalReferenceCode);
	const legacy = readJson<any[]>('context-source/legacy-import/legacy-products.json');

	expect(legacy).toHaveLength(8);
	expect(products.length).toBeGreaterThanOrEqual(11);

	for (const product of legacy) {
		expect(ercs, product.name).toContain(product.externalReferenceCode);
	}
	await api.dispose();
});

test('AC 9.3-2 · the Eyeglasses category page lists at least one product', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/products`);
	await page.locator('.clarity-category-card').filter({hasText: 'Eyeglasses'}).getByRole('link', {name: 'Explore'}).click();
	await expect(page.locator('.clarity-product-card').first()).toBeVisible();
	expect(await page.locator('.clarity-product-card').count()).toBeGreaterThanOrEqual(1);
	await context.close();
});

test('AC 9.3-3 · Location has at least 26 categories, and Retail Associate has Morocco, Casablanca', async () => {
	const api = await adminApi();
	const location = (await vocabularies(api, 'space-hr')).get('Location');
	const jobsFolder = await folder(api, 'space-hr', 'L_CONTENTS', 'Job Listings');
	const job = (await entriesInFolder(api, '/o/c/joblistings', 'space-hr', jobsFolder.id)).find((j) => j.title === 'Retail Associate');

	expect((await categoryNames(api, location.id)).length).toBeGreaterThanOrEqual(26);
	expect(job, 'job listing Retail Associate').toBeTruthy();
	expect(categoriesOf(job, location.externalReferenceCode)).toContain('Morocco, Casablanca');
	await api.dispose();
});
