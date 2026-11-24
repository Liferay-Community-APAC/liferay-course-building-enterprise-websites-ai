import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON} from '../support/api';
import {pageAs} from '../support/browser';
import {readCsv} from '../support/env';
import {
	CATALOG,
	CHANNEL,
	SITE,
	SITE_PATH,
	expectImageLoads,
	productByName,
	productSpecifications,
	text,
} from '../support/levels-6-9';

const SPECIFICATION_COLUMNS: Record<string, string> = {frameColor: 'frame-color', frameMaterial: 'frame-material', frameSize: 'frame-size'};

test('AC 8.1-1 · the catalog Clarity Eyewear exists, with USD and en_US', async () => {
	const api = await adminApi();
	const catalogs = await getAll(api, `${CATALOG}/catalogs`);
	const catalog = catalogs.find((c) => c.name === 'Clarity Eyewear');

	expect(catalog, 'catalog Clarity Eyewear').toBeTruthy();
	expect(catalog.currencyCode).toBe('USD');
	expect(catalog.defaultLanguageId).toBe('en_US');
	await api.dispose();
});

test('AC 8.1-2 · frame-material, frame-color and frame-size are in frame-description; only Material and Color are facets', async () => {
	const api = await adminApi();
	const specifications = await getAll(api, `${CATALOG}/specifications`);

	for (const key of ['frame-material', 'frame-color', 'frame-size']) {
		const specification = specifications.find((s) => s.key === key);

		expect(specification, `specification ${key}`).toBeTruthy();
		expect(specification.optionCategory?.key, `${key} group`).toBe('frame-description');
	}

	const facetable = specifications.filter((s) => s.optionCategory?.key === 'frame-description' && s.facetable).map((s) => s.key);

	expect(facetable.sort(), 'the faceted specifications of Frame Description').toEqual(['frame-color', 'frame-material']);
	await api.dispose();
});

test('AC 8.2-1 · the three products of products.csv are published, each with its category, specifications and an image', async () => {
	const api = await adminApi();

	for (const row of readCsv('context-source/data/products.csv')) {
		const product = await productByName(api, row.name);

		expect(product.workflowStatusInfo?.code ?? product.productStatus, `${row.name} is published`).toBe(0);

		const categories = (await getAll(api, `${CATALOG}/products/${product.productId}/categories`)).map((c) => c.name);

		expect(categories, `${row.name} category`).toContain(row.category);

		const specifications = await productSpecifications(api, product.productId);

		for (const [column, key] of Object.entries(SPECIFICATION_COLUMNS)) {
			if (row[column]) {
				expect(specifications[key], `${row.name} ${key}`).toBe(row[column]);
			}
		}

		const images = await getJSON(api, `${CATALOG}/products/${product.productId}/images`);

		expect(images.totalCount, `${row.name} images`).toBeGreaterThanOrEqual(1);
	}
	await api.dispose();
});

test('AC 8.2-2 · Classic Aviator Sunglasses has Metal, Gold and 54-20', async () => {
	const api = await adminApi();
	const product = await productByName(api, 'Classic Aviator Sunglasses');

	expect(await productSpecifications(api, product.productId)).toMatchObject({'frame-color': 'Gold', 'frame-material': 'Metal', 'frame-size': '54-20'});
	await api.dispose();
});

test('AC 8.3-1 · the channel Clarity Public (USD) is linked to clarity-public, with the Commerce site type B2B', async ({browser}) => {
	const api = await adminApi();
	const site = await getJSON(api, `/o/headless-admin-site/v1.0/sites/${SITE}`);
	const channel = (await getAll(api, `${CHANNEL}/channels`)).find((c) => c.name === 'Clarity Public');

	expect(channel, 'channel Clarity Public').toBeTruthy();
	expect(channel.currencyCode).toBe('USD');
	expect(channel.type).toBe('site');
	expect(channel.siteGroupId, 'linked to clarity-public').toBe(site.id);
	await api.dispose();

	// No headless API exposes the Commerce site type: read it on the channel's General tab.

	const {context, page} = await pageAs(browser, 'admin');
	const portlet = 'com_liferay_commerce_channel_web_internal_portlet_CommerceChannelsPortlet';

	await page.goto(
		`/group/guest/~/control_panel/manage?p_p_id=${portlet}&_${portlet}_mvcRenderCommandName=${encodeURIComponent('/commerce_channels/edit_commerce_channel')}&_${portlet}_commerceChannelId=${channel.id}`
	);

	const siteType = page.getByLabel('Commerce Site Type');

	await expect(siteType.locator('option:checked')).toHaveText('B2B');
	await context.close();
});

test('AC 8.4-1 · Products shows four category cards in order, each with a loaded image and an Explore link', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/products`);

	const cards = page.locator('#main-content .clarity-category-card');

	await expect(cards).toHaveCount(4);
	await expect(cards.locator('.clarity-category-card__title')).toHaveText(['Eyeglasses', 'Sunglasses', 'Contacts', 'Lenses']);

	for (let i = 0; i < 4; i++) {
		const card = cards.nth(i);
		const background = await card.evaluate((element) => getComputedStyle(element).backgroundImage);
		const url = background.match(/url\("?([^")]+)"?\)/)?.[1];

		expect(url, `card ${i + 1} has an image`).toBeTruthy();
		await expectImageLoads(page, url!);
		await expect(card.getByRole('link', {name: 'Explore'})).toHaveAttribute('href', /.+/);
	}
	await context.close();
});

test('AC 8.4-2 · Widget Templates lists Clarity Category Cards', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');
	const portlet = 'com_liferay_template_web_internal_portlet_TemplatePortlet';

	await page.goto(`/group/clarity/~/control_panel/manage?p_p_id=${portlet}&_${portlet}_tabs1=widget-templates`);
	const row = page.getByRole('row').filter({hasText: 'Clarity Category Cards'});

	await expect(row).toBeVisible();
	await expect(row, 'a Commerce Categories Navigation template').toContainText('Commerce Categories Navigation Template');
	await context.close();
});

test('AC 8.5-1 · Explore on Sunglasses opens a category page with the three facets and Classic Aviator Sunglasses', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/products`);
	await page.locator('.clarity-category-card').filter({hasText: 'Sunglasses'}).getByRole('link', {name: 'Explore'}).click();

	for (const facet of ['Category', 'Frame Color', 'Frame Material']) {
		await expect(page.locator('.panel-title').filter({hasText: new RegExp(`^\\s*${facet}\\s*$`)}), `${facet} facet`).toBeVisible();
	}
	await expect(page.locator('.clarity-product-card').filter({hasText: 'Classic Aviator Sunglasses'})).toBeVisible();
	await context.close();
});

test("AC 8.5-2 · Classic Aviator Sunglasses' page shows name, SKU, description, three specifications and Contact Sales", async ({browser}) => {
	const api = await adminApi();
	const product = await productByName(api, 'Classic Aviator Sunglasses');
	const detail = await getJSON(api, `${CATALOG}/products/${product.productId}`);
	const skus = (await getAll(api, `${CATALOG}/products/${product.productId}/skus`)).map((s) => s.sku);
	const specifications = await getAll(api, `${CATALOG}/products/${product.productId}/productSpecifications`);
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto(`${SITE_PATH}/products`);
	await page.locator('.clarity-category-card').filter({hasText: 'Sunglasses'}).getByRole('link', {name: 'Explore'}).click();
	await page.locator('.clarity-product-card').filter({hasText: 'Classic Aviator Sunglasses'}).getByRole('link').first().click();

	const main = page.locator('#main-content');

	await expect(main.getByRole('heading', {level: 1})).toHaveText('Classic Aviator Sunglasses');
	await expect(main).toContainText(skus[0]);
	await expect(main).toContainText(text(detail.description.en_US).slice(0, 60));
	expect(specifications).toHaveLength(3);

	for (const specification of specifications) {
		await expect(main).toContainText(specification.label.en_US);
		await expect(main).toContainText(specification.value.en_US);
	}

	const contact = main.getByRole('link', {name: 'Contact Sales'});

	await expect(contact).toBeVisible();
	expect(new URL((await contact.getAttribute('href'))!, page.url()).pathname).toBe(`${SITE_PATH}/contact-us`);
	await context.close();
	await api.dispose();
});
