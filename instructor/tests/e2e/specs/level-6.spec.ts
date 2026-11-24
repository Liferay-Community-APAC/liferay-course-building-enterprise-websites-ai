import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON, guestApi, personaApi} from '../support/api';
import {pageAs} from '../support/browser';
import {persona, readJson} from '../support/env';
import {
	ASSET_LIBRARY,
	SITE,
	SPACES,
	categoriesOf,
	categoryNames,
	entries,
	entriesInFolder,
	folder,
	structure,
	vocabularies,
} from '../support/levels-6-9';

const ADMINISTRATOR = 'Asset Library Administrator'; // "Space Administrator" in the UI

function ercOf(givenName: string): string {
	return `PERSONA-${persona(givenName).screenName.toUpperCase()}`;
}

test('AC 6.1-1 · the five Spaces exist, each connected to clarity-public', async () => {
	const api = await adminApi();

	for (const erc of SPACES) {
		const library = await getJSON(api, `${ASSET_LIBRARY}/${erc}`);

		expect(library.type, `${erc} is a Space`).toBe('Space');

		const sites = (await getAll(api, `${ASSET_LIBRARY}/${erc}/connected-sites`)).map((s) => s.externalReferenceCode);

		expect(sites, `${erc} connected sites`).toContain(SITE);
	}
	await api.dispose();
});

test("AC 6.1-2 · each Space's members and administrator are those in the prompt", async () => {
	const api = await adminApi();
	const expected: Record<string, {admins: string[]; groups: string[]; members: string[]}> = {
		'space-branding': {admins: ['Walter'], groups: ['IT'], members: []},
		'space-events': {admins: ['Clara'], groups: [], members: ['Christian']},
		'space-hr': {admins: ['Harper'], groups: ['Human Resources'], members: []},
		'space-marketing': {admins: ['Clara'], groups: ['Marketing'], members: []},
		'space-products': {admins: ['Walter'], groups: ['IT'], members: []},
	};
	const personaErcs = new Set(['Ian', 'Walter', 'Clara', 'Christian', 'Harper', 'Daniel', 'Terrence'].map(ercOf));

	for (const [erc, want] of Object.entries(expected)) {
		const groups = (await getAll(api, `${ASSET_LIBRARY}/${erc}/user-groups`)).map((g) => g.name).sort();
		const users = await getAll(api, `${ASSET_LIBRARY}/${erc}/user-accounts?nestedFields=roles`);
		const roles = (userErc: string) => (users.find((u) => u.externalReferenceCode === userErc)?.roles ?? []).map((r: any) => r.name);

		expect(groups, `${erc} user groups`).toEqual([...want.groups].sort());

		for (const name of want.admins) {
			expect(users.map((u) => u.externalReferenceCode), `${erc} has ${name}`).toContain(ercOf(name));
			expect(roles(ercOf(name)), `${name} administers ${erc}`).toContain(ADMINISTRATOR);
		}

		for (const name of want.members) {
			expect(users.map((u) => u.externalReferenceCode), `${erc} has ${name} as a member`).toContain(ercOf(name));
			expect(roles(ercOf(name)), `${name} is not an administrator of ${erc}`).not.toContain(ADMINISTRATOR);
		}

		// No other persona is a direct member of the Space.

		const listed = new Set([...want.admins, ...want.members].map(ercOf));
		const others = users.filter((u) => personaErcs.has(u.externalReferenceCode) && !listed.has(u.externalReferenceCode)).map((u) => u.name);

		expect(others, `${erc} has no other persona as a member`).toEqual([]);
	}
	await api.dispose();
});

test('AC 6.1-3 · CMS lists the five Spaces for Christian, and HR has no New button', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Christian');

	await page.goto('/web/cms');

	const spaces = page.getByRole('navigation', {name: 'Spaces'});
	const names = ['Marketing', 'Branding', 'HR', 'Events', 'Products'];

	await expect(spaces.getByRole('menuitem', {exact: true, name: 'All Spaces (5)'})).toBeVisible();

	for (const name of names) {
		await expect(spaces.getByRole('menuitem', {exact: true, name}), `${name} is listed`).toBeVisible();
	}

	// Marketing's contents offer New to Christian (a member through the Marketing group): that control proves the page has rendered.

	await spaces.getByRole('menuitem', {exact: true, name: 'Marketing'}).click();
	await page.getByRole('link', {name: 'View All Content'}).click();
	await expect(page.getByRole('button', {exact: true, name: 'New'})).toBeVisible();

	await spaces.getByRole('menuitem', {exact: true, name: 'HR'}).click();
	await page.getByRole('link', {name: 'View All Content'}).click();
	await expect(page.getByText('Job Listings', {exact: true}).first(), 'HR can be browsed').toBeVisible();
	await expect(page.getByRole('button', {exact: true, name: 'New'})).toHaveCount(0);
	await context.close();
});

test('AC 6.2-1 · the seven structures exist, each accepted only in its Space', async () => {
	const api = await adminApi();
	const expected: Record<string, string> = {
		ANNOUNCEMENT_STRUCTURE: 'space-marketing',
		ARTICLE_STRUCTURE: 'space-marketing',
		EVENT_IMAGE_STRUCTURE: 'space-events',
		EVENT_INFORMATION_STRUCTURE: 'space-events',
		FAQ_STRUCTURE: 'space-marketing',
		JOB_LISTING_STRUCTURE: 'space-hr',
		LEADERSHIP_PROFILE_STRUCTURE: 'space-marketing',
	};

	for (const [erc, spaceErc] of Object.entries(expected)) {
		const definition = await structure(api, erc);
		const settings = Object.fromEntries((definition.objectDefinitionSettings ?? []).map((s: any) => [s.name, s.value]));

		expect(definition.status?.code, `${erc} is published`).toBe(0);
		expect(definition.scope, `${erc} is a Space structure`).toBe('depot');
		expect(String(settings.acceptAllGroups ?? 'false'), `${erc} doesn't accept every Space`).toBe('false');
		expect(String(settings.acceptedGroupExternalReferenceCodes ?? '').split(',').map((s) => s.trim()).filter(Boolean), `${erc} accepted Spaces`).toEqual([spaceErc]);
	}
	await api.dispose();
});

test('AC 6.2-2 · Event Information has startDateTime and endDateTime as date and time fields', async () => {
	const api = await adminApi();
	const definition = await structure(api, 'EVENT_INFORMATION_STRUCTURE');

	for (const name of ['startDateTime', 'endDateTime']) {
		const field = definition.objectFields.find((f: any) => f.name === name);

		expect(field, name).toBeTruthy();
		expect(field.businessType, `${name} type`).toBe('DateTime');
	}
	await api.dispose();
});

test('AC 6.2-3 · Christian can create an FAQ in Marketing, and his delete is refused', async () => {
	const christian = await personaApi('Christian');
	const admin = await adminApi();
	let id: number | undefined;

	try {
		const created = await christian.post('/o/c/faqs/scopes/space-marketing', {
			data: {
				answer: '<p>Throwaway entry from the Level 6 Playwright check.</p>',
				externalReferenceCode: `zz-playwright-faq-${Date.now()}`,
				title: 'Throwaway FAQ (Playwright member access check)',
			},
		});

		expect(created.status(), `create as Christian: ${(await created.text()).slice(0, 300)}`).toBe(200);
		id = (await created.json()).id;

		const deleted = await christian.delete(`/o/c/faqs/${id}`);

		expect(deleted.status(), 'delete as Christian is refused').toBeGreaterThanOrEqual(400);
		expect((await admin.get(`/o/c/faqs/${id}`)).status(), 'the FAQ is still there').toBe(200);
	}
	finally {
		if (id) {
			for (let i = 0; i < 2 && (await admin.get(`/o/c/faqs/${id}`)).status() === 200; i++) {
				await admin.delete(`/o/c/faqs/${id}`); // the first delete moves it to the Recycle Bin, the second purges it
			}
		}
		await christian.dispose();
		await admin.dispose();
	}
});

test('AC 6.3-1 · Marketing has the vocabularies FAQ (four categories) and Articles (Innovation, Industry, Style)', async () => {
	const api = await adminApi();
	const marketing = await vocabularies(api, 'space-marketing');
	const faqCategories = [...new Set(readJson<any[]>('context-source/content/faqs.json').map((f) => f.category))];

	expect(faqCategories).toHaveLength(4);
	expect(marketing.get('FAQ'), 'FAQ vocabulary').toBeTruthy();
	expect((await categoryNames(api, marketing.get('FAQ').id)).sort()).toEqual(faqCategories.sort());
	expect(marketing.get('Articles'), 'Articles vocabulary').toBeTruthy();
	expect((await categoryNames(api, marketing.get('Articles').id)).sort()).toEqual(['Industry', 'Innovation', 'Style']);
	await api.dispose();
});

test('AC 6.3-2 · HR has the vocabularies Region, Location (at least 14 categories) and Job Positions', async () => {
	const api = await adminApi();
	const hr = await vocabularies(api, 'space-hr');

	for (const name of ['Region', 'Location', 'Job Positions']) {
		expect(hr.get(name), `${name} vocabulary`).toBeTruthy();
		expect((await categoryNames(api, hr.get(name).id)).length, `${name} has categories`).toBeGreaterThan(0);
	}
	expect((await categoryNames(api, hr.get('Location').id)).length).toBeGreaterThanOrEqual(14);
	await api.dispose();
});

test('AC 6.4-1 · the FAQ folder has eight FAQs, each with one FAQ category', async () => {
	const api = await adminApi();
	const faqFolder = await folder(api, 'space-marketing', 'L_CONTENTS', 'FAQ');
	const faqs = await entriesInFolder(api, '/o/c/faqs', 'space-marketing', faqFolder.id);
	const faqVocabulary = (await vocabularies(api, 'space-marketing')).get('FAQ');

	expect(faqs).toHaveLength(8);

	for (const faq of faqs) {
		expect(categoriesOf(faq, faqVocabulary.externalReferenceCode), `${faq.title} has one FAQ category`).toHaveLength(1);
	}

	const returns = faqs.find((f) => f.title === 'What is your return policy?');

	expect(returns, 'What is your return policy?').toBeTruthy();
	expect(categoriesOf(returns)).toContain('Returns and Exchanges');
	await api.dispose();
});

test('AC 6.4-2 · the Job Listings folder has ten listings, each with a region, a location and a job position', async () => {
	const api = await adminApi();
	const hr = await vocabularies(api, 'space-hr');
	const jobsFolder = await folder(api, 'space-hr', 'L_CONTENTS', 'Job Listings');
	const jobs = await entriesInFolder(api, '/o/c/joblistings', 'space-hr', jobsFolder.id);

	expect(jobs).toHaveLength(10);

	for (const job of jobs) {
		for (const name of ['Region', 'Location', 'Job Positions']) {
			expect(categoriesOf(job, hr.get(name).externalReferenceCode).length, `${job.title} has a ${name} category`).toBeGreaterThan(0);
		}
	}
	await api.dispose();
});

test('AC 6.4-3 · Guest can read one FAQ and one file of the Marketing Space', async () => {
	const admin = await adminApi();
	const guest = await guestApi();
	const faq = (await entries(admin, '/o/c/faqs', 'space-marketing')).find((f) => f.status.code === 0);
	const file = (await entries(admin, '/o/cms/basic-documents', 'space-marketing')).find((d) => d.status.code === 0 && d.file);

	const faqResponse = await guest.get(`/o/c/faqs/${faq.id}`);

	expect(faqResponse.status(), `Guest GET FAQ ${faq.id}`).toBe(200);
	expect((await faqResponse.json()).title).toBe(faq.title);

	const fileResponse = await guest.get(`/o/cms/basic-documents/${file.id}`);

	expect(fileResponse.status(), `Guest GET file ${file.id}`).toBe(200);

	const href = (await fileResponse.json()).file?.link?.href;

	expect(href, 'Guest sees the download link (DOWNLOAD_FILE)').toBeTruthy();

	const download = await guest.get(href);

	expect(download.status(), `Guest downloads ${file.file.name}`).toBe(200);
	expect((await download.body()).length).toBeGreaterThan(0);
	await admin.dispose();
	await guest.dispose();
});

test('AC 6.4-4 · Venues Gallery has the event image, and Events has the event', async () => {
	const api = await adminApi();
	const [event] = readJson<any[]>('context-source/content/events.json');
	const gallery = await folder(api, 'space-events', 'L_FILES', 'Venues Gallery');
	const events = await folder(api, 'space-events', 'L_CONTENTS', 'Events');
	const images = await entriesInFolder(api, '/o/c/eventimages', 'space-events', gallery.id);
	const infos = await entriesInFolder(api, '/o/c/eventinformations', 'space-events', events.id);
	const fileName = event.image.file.split('/').pop();

	expect(images.map((i) => i.file?.name), 'the event image in Venues Gallery').toContain(fileName);
	expect(infos.map((i) => i.title), 'the event in Events').toContain(event.title);
	await api.dispose();
});
