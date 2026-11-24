import {APIRequestContext, Page, expect} from '@playwright/test';

import {getAll, getJSON} from './api';
import {baseURL} from './env';

// Helpers shared by the Level 6 to 9 specs: CMS Spaces, their folders,
// vocabularies and entries, the commerce catalog, and image checks in a page.

export const SITE = 'clarity-public';
export const SITE_PATH = '/web/clarity';
export const SPACES = ['space-marketing', 'space-branding', 'space-hr', 'space-events', 'space-products'];

export const ASSET_LIBRARY = '/o/headless-asset-library/v1.0/asset-libraries';
export const CATALOG = '/o/headless-commerce-admin-catalog/v1.0';
export const CHANNEL = '/o/headless-commerce-admin-channel/v1.0';
export const OBJECT_ADMIN = '/o/object-admin/v1.0/object-definitions';
export const TAXONOMY = '/o/headless-admin-taxonomy/v1.0';

export type Space = {id: number; name: string; siteId: number};

export async function space(api: APIRequestContext, erc: string): Promise<Space> {
	return getJSON(api, `${ASSET_LIBRARY}/${erc}`);
}

// A Space's folder by title, under its Contents (L_CONTENTS) or Files (L_FILES) root.

export async function folder(api: APIRequestContext, spaceErc: string, root: 'L_CONTENTS' | 'L_FILES', title: string): Promise<any> {
	const folders = await getAll(api, `/o/headless-object/v1.0/scopes/${spaceErc}/object-entry-folders`);
	const rootFolder = folders.find((f) => f.externalReferenceCode === root);
	const match = folders.find((f) => f.title === title && f.parentObjectEntryFolderId === rootFolder?.id);

	expect(match, `${spaceErc} has a ${root === 'L_CONTENTS' ? 'Contents' : 'Files'} folder "${title}"`).toBeTruthy();

	return match;
}

// Every entry of a structure (by its REST path, such as /o/c/faqs) in a Space.

export async function entries(api: APIRequestContext, restPath: string, spaceErc: string): Promise<any[]> {
	return getAll(api, `${restPath}/scopes/${spaceErc}`);
}

export async function entriesInFolder(api: APIRequestContext, restPath: string, spaceErc: string, folderId: number): Promise<any[]> {
	return (await entries(api, restPath, spaceErc)).filter((e) => e.objectEntryFolderId === folderId);
}

// The Space's own vocabularies (the listing also returns the global ones), by name.

export async function vocabularies(api: APIRequestContext, spaceErc: string): Promise<Map<string, any>> {
	const {id} = await space(api, spaceErc);
	const items = await getAll(api, `${TAXONOMY}/asset-libraries/${id}/taxonomy-vocabularies`);

	return new Map(items.filter((v) => v.assetLibraryKey).map((v) => [v.name, v]));
}

export async function categoryNames(api: APIRequestContext, vocabularyId: number): Promise<string[]> {
	return (await getAll(api, `${TAXONOMY}/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories`)).map((c) => c.name);
}

export function categoriesOf(entry: any, vocabularyErc?: string): string[] {
	return (entry.taxonomyCategoryBriefs ?? [])
		.filter((b: any) => !vocabularyErc || b.parentTaxonomyVocabulary?.externalReferenceCode === vocabularyErc)
		.map((b: any) => b.taxonomyCategoryName);
}

export async function structure(api: APIRequestContext, erc: string): Promise<any> {
	return getJSON(api, `${OBJECT_ADMIN}/by-external-reference-code/${erc}`);
}

// The newest approved entry, as a "newest first" collection orders them.

export function newest<T extends {dateCreated: string; displayDate?: string; status: {code: number}}>(items: T[]): T {
	const approved = items.filter((i) => i.status.code === 0);

	approved.sort((a, b) => (b.displayDate ?? b.dateCreated).localeCompare(a.displayDate ?? a.dateCreated) || b.dateCreated.localeCompare(a.dateCreated));

	return approved[0];
}

// The display page URL of a CMS entry: /web/<site>/c_<structure name>/asset-library-<Space id>/<friendlyUrlPath>.

export function displayPageURL(structureName: string, spaceId: number, friendlyUrlPath: string): string {
	return `${SITE_PATH}/c_${structureName.toLowerCase()}/asset-library-${spaceId}/${friendlyUrlPath}`;
}

// A file's path without host and query, to compare a page's image with a Space file.

export function filePath(url: string): string {
	return decodeURIComponent(new URL(url, baseURL).pathname).replace(/\/$/, '');
}

// Basic Documents of a Space, keyed by the file's path.

export async function spaceFiles(api: APIRequestContext, spaceErc: string): Promise<Map<string, any>> {
	const documents = await entries(api, '/o/cms/basic-documents', spaceErc);

	return new Map(documents.filter((d) => d.file?.fileURL).map((d) => [filePath(d.file.fileURL), d]));
}

export function text(html: string): string {
	return (html ?? '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&#39;|&rsquo;|&lsquo;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

// Every image URL the page renders: <img> sources and the CSS background images
// Liferay sets on containers (--lfr-background-image-* custom properties) or in style attributes.

export async function imageURLs(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const urls: string[] = [];

		for (const img of Array.from(document.querySelectorAll('img'))) {
			for (const url of [img.src, img.currentSrc]) {
				if (url) {
					urls.push(url);
				}
			}
		}

		for (const element of Array.from(document.querySelectorAll('[style]'))) {
			for (const match of (element.getAttribute('style') ?? '').matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
				urls.push(new URL(match[2], location.href).href);
			}
		}

		return urls;
	});
}

// An image URL answers 200 with an image.

export async function expectImageLoads(page: Page, url: string): Promise<void> {
	const response = await page.request.get(url);

	expect(response.status(), `GET ${url}`).toBe(200);
	expect(response.headers()['content-type'] ?? '', `${url} is an image`).toMatch(/^image\//);
}

export async function catalogProducts(api: APIRequestContext, catalogErc = 'clarity-eyewear'): Promise<any[]> {
	const catalog = await getJSON(api, `${CATALOG}/catalog/by-externalReferenceCode/${catalogErc}`);

	return getAll(api, `${CATALOG}/products?filter=${encodeURIComponent(`catalogId eq ${catalog.id}`)}`);
}

export async function productByName(api: APIRequestContext, name: string): Promise<any> {
	const product = (await catalogProducts(api)).find((p) => p.name?.en_US === name);

	expect(product, `product ${name} in Clarity Eyewear`).toBeTruthy();

	return product;
}

// The product's specification values by specification key, such as {"frame-material": "Metal"}.

export async function productSpecifications(api: APIRequestContext, productId: number): Promise<Record<string, string>> {
	const items = await getAll(api, `${CATALOG}/products/${productId}/productSpecifications`);

	return Object.fromEntries(items.map((s) => [s.specificationKey, s.value?.en_US]));
}
