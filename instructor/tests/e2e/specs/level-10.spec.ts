import {expect, test} from '@playwright/test';

import {adminApi, getAll, q} from '../support/api';
import {pageAs} from '../support/browser';
import {persona} from '../support/env';
import {WORKFLOW, linkedWorkflow, objectDefinition, searchWorkflowTasks, taskRoles} from '../support/levels-10-13';

const SPACE = 'space-marketing';

function fullName(givenName: string): string {
	const p = persona(givenName);

	return `${p.givenName} ${p.familyName}`;
}

async function entryByTitle(api: any, plural: string, title: string): Promise<any> {
	const items = await getAll(api, `/o/c/${plural}/scopes/${SPACE}?filter=${q(`title eq '${title}'`)}`);

	expect(items, `${plural} titled ${title}`).toHaveLength(1);

	return items[0];
}

test('AC 10.1-1 · in the Marketing Space, Article goes through a workflow whose review task is assigned to Content Manager', async () => {
	const api = await adminApi();
	const article = await objectDefinition(api, 'Article');
	const workflow = await linkedWorkflow(api, article.className, SPACE);

	expect(workflow, 'a workflow linked to Article in the Marketing Space').toBeTruthy();

	const roles = Object.values(taskRoles(workflow.content)).flat();

	expect(roles, `${workflow.name} task roles`).toContain('Content Manager');
	await api.dispose();
});

test('AC 10.2-1 · the article "Clarity x Almanac Optics" is approved, created by Christian Carter', async () => {
	const api = await adminApi();
	const entry = await entryByTitle(api, 'articles', 'Clarity x Almanac Optics');

	expect(entry.status.label).toBe('approved');
	expect(entry.creator.name).toBe(fullName('Christian'));
	await api.dispose();
});

test('AC 10.2-2 · its review task was completed by Clara Murphy, with the comment "Approved for the summer campaign."', async () => {
	const api = await adminApi();
	const article = await objectDefinition(api, 'Article');
	const entry = await entryByTitle(api, 'articles', 'Clarity x Almanac Optics');
	const tasks = (await searchWorkflowTasks(api, {assetPrimaryKeys: [entry.id], completed: true}))
		.filter((t) => t.objectReviewed?.id === entry.id && t.objectReviewed?.assetType === article.label?.en_US);

	expect(tasks.length, 'completed workflow tasks of the article').toBeGreaterThan(0);

	const completions = [];

	for (const task of tasks) {
		completions.push(...(await getAll(api, `${WORKFLOW}/workflow-tasks/${task.id}/workflow-logs`)).filter((l) => l.type === 'TaskCompletion'));
	}

	expect(completions.map((l) => [l.auditPerson?.name, l.commentLog])).toContainEqual([fullName('Clara'), 'Approved for the summer campaign.']);
	await api.dispose();
});

test('AC 10.3-1 · in the Marketing Space, Announcement is linked to the same workflow as Article', async () => {
	const api = await adminApi();
	const article = await linkedWorkflow(api, (await objectDefinition(api, 'Article')).className, SPACE);
	const announcement = await linkedWorkflow(api, (await objectDefinition(api, 'Announcement')).className, SPACE);

	expect(announcement, 'a workflow linked to Announcement in the Marketing Space').toBeTruthy();
	expect(announcement.name).toBe(article?.name);
	await api.dispose();
});

test('AC 10.3-2 · the announcement "Spring Campaign" is approved, created by Christian Carter', async () => {
	const api = await adminApi();
	const entry = await entryByTitle(api, 'announcements', 'Spring Campaign');

	expect(entry.status.label).toBe('approved');
	expect(entry.creator.name).toBe(fullName('Christian'));
	await api.dispose();
});

test('AC 10.3-3 · Home and FAQ show the Spring Campaign bar with a Shop the collection link to Products', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	for (const path of ['/web/clarity/home', '/web/clarity/faq']) {
		const response = await page.goto(path);

		expect(response?.status(), path).toBe(200);
		await expect(page.getByText('Spring into Style with Clarity: new frames have arrived!', {exact: true}).first(), path).toBeVisible();

		const link = page.getByRole('link', {exact: true, name: 'Shop the collection'}).first();

		await expect(link, path).toBeVisible();
		expect(await link.getAttribute('href'), path).toMatch(/\/web\/clarity\/products\/?$/);
	}
	await context.close();
});
