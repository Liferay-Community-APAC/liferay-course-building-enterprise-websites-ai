import {APIRequestContext, Locator, Page} from '@playwright/test';
import zlib from 'node:zlib';

import {getAll, getJSON} from './api';
import {read} from './files';

// Shared by the Level 2 to 5 specs.

export const SITE_ERC = 'clarity-public';
export const SITE = `/o/headless-admin-site/v1.0/sites/${SITE_ERC}`;
export const USER = '/o/headless-admin-user/v1.0';

// The brief, as the workbook's prompts point at it.

export function brief(): string {
	return read('context-source/clarity-brief.md');
}

export function briefSiteDescription(): string {
	const match = brief().match(/Description: \*"([^"]+)"\*/);

	if (!match) {
		throw new Error('No site description in section 3 of the brief');
	}

	return match[1];
}

export function briefBrandPrimary(): string {
	const match = brief().match(/Brand primary[^|]*\|\s*`(#[0-9A-Fa-f]{6})`/);

	if (!match) {
		throw new Error('No brand primary color in section 5 of the brief');
	}

	return match[1];
}

export function rgb(hex: string): string {
	const n = parseInt(hex.slice(1), 16);

	return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

// The numeric id of a site, from its ERC.

export async function siteId(api: APIRequestContext, erc = SITE_ERC): Promise<number> {
	return (await getJSON(api, `/o/headless-admin-site/v1.0/sites/${erc}`)).id;
}

// Site pages, by their English name.

export async function sitePages(api: APIRequestContext): Promise<any[]> {
	return (await getAll(api, `${SITE}/site-pages`)).map((p) => ({...p, title: p.name_i18n?.['en-US'], url: p.friendlyUrlPath_i18n?.['en-US']}));
}

export async function masterPage(api: APIRequestContext, name: string): Promise<any> {
	return (await getAll(api, `${SITE}/master-pages`)).find((m) => m.name === name);
}

// Every page element of a page specification, depth first.

export function pageElements(node: any): any[] {
	const out: any[] = [];
	const walk = (element: any) => {
		out.push(element);
		(element.pageElements ?? []).forEach(walk);
	};

	for (const experience of node.pageExperiences ?? []) {
		(experience.pageElements ?? []).forEach(walk);
	}

	return out;
}

// The parts of a page built on Clarity's master pages: the master's header
// container, the drop zone (#main-content) and the footer container.

export function masterHeader(page: Page): Locator {
	return page.locator('#master-layout-wrapper > :not(#main-content)').first();
}

export function masterFooter(page: Page): Locator {
	return page.locator('#master-layout-wrapper > :not(#main-content)').last();
}

// A minimal ZIP reader (stored and deflated entries), for Liferay's exports.

export function unzip(buffer: Buffer): Record<string, string> {
	const files: Record<string, string> = {};
	let end = buffer.length - 22;

	while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) {
		end--;
	}

	if (end < 0) {
		throw new Error('Not a ZIP file');
	}

	const count = buffer.readUInt16LE(end + 10);
	let offset = buffer.readUInt32LE(end + 16);

	for (let i = 0; i < count; i++) {
		const method = buffer.readUInt16LE(offset + 10);
		const compressedSize = buffer.readUInt32LE(offset + 20);
		const nameLength = buffer.readUInt16LE(offset + 28);
		const extraLength = buffer.readUInt16LE(offset + 30);
		const commentLength = buffer.readUInt16LE(offset + 32);
		const localOffset = buffer.readUInt32LE(offset + 42);
		const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
		const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
		const data = buffer.subarray(dataStart, dataStart + compressedSize);

		if (!name.endsWith('/')) {
			files[name] = (method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8');
		}

		offset += 46 + nameLength + extraLength + commentLength;
	}

	return files;
}

// The admin's Fragments screen for the public site, opened on a fragment set.

export const FRAGMENTS_ADMIN = '/group/clarity/~/control_panel/manage?p_p_id=com_liferay_fragment_web_portlet_FragmentPortlet';

export async function openFragmentSet(page: Page, setName: string): Promise<void> {
	await page.goto(FRAGMENTS_ADMIN);
	const link = page.locator('a[href*="/fragment_collection/"]').filter({hasText: new RegExp(`^\\s*${setName}\\s*$`)}).first();

	await page.goto((await link.getAttribute('href'))!);
}

// A fragment set as Liferay exports it (the set's Export action): its files by
// path inside the set's folder, such as "fragments/search-button/configuration.json".

export async function exportFragmentSet(page: Page, setName: string): Promise<Record<string, string>> {
	await openFragmentSet(page, setName);

	const href = await page.locator('a[href*="export_fragment_collections"]').first().getAttribute('href');
	const response = await page.request.get(href!);

	if (!response.ok()) {
		throw new Error(`Export of ${setName} -> ${response.status()}`);
	}

	const files = unzip(await response.body());
	const collection = Object.keys(files).find((p) => p.endsWith('/collection.json') && JSON.parse(files[p]).name === setName);

	if (!collection) {
		throw new Error(`No collection.json named ${setName} in the export`);
	}

	const root = collection.slice(0, -'collection.json'.length);

	return Object.fromEntries(Object.entries(files).filter(([p]) => p.startsWith(root)).map(([p, text]) => [p.slice(root.length), text]));
}

// A fragment of an exported set, by its name in fragment.json.

export function exportedFragment(files: Record<string, string>, name: string): {configuration: any; html: string} | undefined {
	for (const [p, text] of Object.entries(files)) {
		if (p.endsWith('/fragment.json') && JSON.parse(text).name === name) {
			const dir = p.slice(0, -'fragment.json'.length);
			const fragment = JSON.parse(text);

			return {
				configuration: JSON.parse(files[dir + (fragment.configurationPath ?? 'configuration.json')] || '{}'),
				html: files[dir + (fragment.htmlPath ?? 'index.html')] ?? '',
			};
		}
	}

	return undefined;
}
