import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON, guestApi, personaApi} from '../support/api';
import {pageAs} from '../support/browser';
import {
	CONTACT_US,
	OBJECT_ADMIN,
	WORKFLOW,
	contactUsByName,
	createContactUs,
	deleteContactUs,
	linkedWorkflow,
	searchWorkflowTasks,
	taskRoles,
	testName,
} from '../support/levels-10-13';

const FIELDS = ['Full Name', 'Email Address', 'Phone', 'Inquiry Type', 'State or Province', 'City', 'Comment'];
const RESPONSES = '/web/clarity/contact-us-responses';

function i18n(map: Record<string, string> | undefined, locale: string): string | undefined {
	return map?.[locale] ?? map?.[locale.replace('_', '-')];
}

async function followUpTask(api: any, entryId: number, completed: boolean): Promise<any> {
	const tasks = (await searchWorkflowTasks(api, {assetPrimaryKeys: [entryId], completed}))
		.filter((t) => t.objectReviewed?.id === entryId && t.workflowDefinitionName === 'Contact Us Follow Up');

	return tasks[0];
}

test('AC 12.1-1 · the picklist INQUIRY_TYPES has sales, support, partnership and general, named in Spanish', async () => {
	const api = await adminApi();
	const picklist = await getJSON(api, '/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/INQUIRY_TYPES');
	const spanish = Object.fromEntries(picklist.listTypeEntries.map((e: any) => [e.key, i18n(e.name_i18n, 'es_ES')]));

	expect(spanish).toEqual({general: 'General', partnership: 'Asociación', sales: 'Ventas', support: 'Soporte'});
	await api.dispose();
});

test('AC 12.1-2 · ContactUs (CONTACT_US) is published, site-scoped, with the seven fields, their types and required flags', async () => {
	const api = await adminApi();
	const definition = await getJSON(api, `${OBJECT_ADMIN}/object-definitions/by-external-reference-code/CONTACT_US`);

	expect(definition.name).toBe('ContactUs');
	expect(definition.status.label).toBe('approved');
	expect(definition.scope).toBe('site');

	const fields = Object.fromEntries(definition.objectFields.filter((f: any) => !f.system).map((f: any) => [f.name, [f.businessType, f.required]]));

	expect(fields).toEqual({
		city: ['Text', false],
		comment: ['LongText', false],
		emailAddress: ['Text', true],
		fullName: ['Text', true],
		inquiryType: ['Picklist', true],
		phone: ['Text', true],
		stateOrProvince: ['Text', false],
	});
	expect(definition.objectFields.find((f: any) => f.name === 'inquiryType').listTypeDefinitionExternalReferenceCode).toBe('INQUIRY_TYPES');
	await api.dispose();
});

test('AC 12.1-3 · as Guest, listing Contact Us entries returns none, even when entries exist', async () => {
	const admin = await adminApi();
	const guest = await guestApi();
	const name = testName();

	try {
		await createContactUs(admin, name);
		expect((await contactUsByName(admin, name)).length, 'the admin sees the test entry').toBe(1);

		for (const path of [CONTACT_US, `${CONTACT_US}?search=${encodeURIComponent(name)}`]) {
			const response = await guest.get(path);
			const body = await response.text();

			expect(body, `Guest GET ${path}`).not.toContain(name);

			if (response.ok()) {
				expect(JSON.parse(body).items ?? [], `Guest GET ${path} items`).toEqual([]);
			}
			else {
				expect([401, 403, 404], `Guest GET ${path} status`).toContain(response.status());
			}
		}
	}
	finally {
		await deleteContactUs(admin, name);
		await admin.dispose();
		await guest.dispose();
	}
});

test('AC 12.2-1 · Contact Us shows a form with the seven fields in order and a submit button', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/contact-us');

	const form = page.locator('form[action*="edit_info_item"]');

	await expect(form).toBeVisible();

	const labels = (await form.locator('label').evaluateAll((ls) => ls.map((l) => (l.textContent ?? '').trim().split('\n')[0].trim())))
		.filter((l) => FIELDS.includes(l));

	expect(labels).toEqual(FIELDS);
	await expect(form.locator('button[type="submit"]')).toBeVisible();
	await context.close();
});

test('AC 12.2-2 · submitting the form as Guest creates a Contact Us entry with the values entered', async ({browser}) => {
	const admin = await adminApi();
	const {context, page} = await pageAs(browser, 'guest');
	const name = testName();

	try {
		await page.goto('/web/clarity/contact-us');

		const form = page.locator('form[action*="edit_info_item"]');

		await form.locator('[name="ObjectField_fullName"]').fill(name);
		await form.locator('[name="ObjectField_emailAddress"]').fill('reference.form@example.com');
		await form.locator('[name="ObjectField_phone"]').fill('+1 919 555 0142');
		await form.locator(':has(> input[name="ObjectField_inquiryType"]) > input[role="combobox"]').click();
		await page.getByRole('option', {exact: true, name: 'Support'}).click();
		await form.locator('[name="ObjectField_stateOrProvince"]').fill('North Carolina');
		await form.locator('[name="ObjectField_city"]').fill('Durham');
		await form.locator('[name="ObjectField_comment"]').fill('Submitted by the Level 12 reference test.');
		await Promise.all([page.waitForLoadState('load'), form.locator('button[type="submit"]').click()]);

		await expect.poll(async () => (await contactUsByName(admin, name)).length, {message: 'entry created', timeout: 20_000}).toBe(1);

		const [entry] = await contactUsByName(admin, name);

		expect(entry.emailAddress).toBe('reference.form@example.com');
		expect(entry.phone).toBe('+1 919 555 0142');
		expect(entry.inquiryType?.key).toBe('support');
		expect(entry.stateOrProvince).toBe('North Carolina');
		expect(entry.city).toBe('Durham');
		expect(entry.comment ?? i18n(entry.comment_i18n, 'en_US')).toBe('Submitted by the Level 12 reference test.');
	}
	finally {
		await deleteContactUs(admin, name);
		await context.close();
		await admin.dispose();
	}
});

test('AC 12.3-1 · "Contact Us Follow Up" is published, Follow Up goes to Distributor Representative, linked to Contact Us in clarity-public', async () => {
	const api = await adminApi();
	const definition = await getJSON(api, `${OBJECT_ADMIN}/object-definitions/by-external-reference-code/CONTACT_US`);
	const workflow = await linkedWorkflow(api, definition.className, 'clarity-public');

	expect(workflow?.name, 'workflow linked to Contact Us in clarity-public').toBe('Contact Us Follow Up');
	expect(workflow.active, 'published').toBe(true);
	expect(taskRoles(workflow.content)['followUp'], 'Follow Up task roles').toEqual(['Distributor Representative']);
	await api.dispose();
});

test('AC 12.3-2 · a new Contact Us entry is pending, with a Follow Up task for Distributor Representative', async () => {
	const api = await adminApi();
	const name = testName();

	try {
		const created = await createContactUs(api, name);

		await expect.poll(async () => (await getJSON(api, `/o/c/contactuses/${created.id}`)).status.label).toBe('pending');
		await expect.poll(async () => Boolean(await followUpTask(api, created.id, false)), {message: 'an open Follow Up task'}).toBe(true);

		const task = await followUpTask(api, created.id, false);

		expect(task.name).toBe('followUp');
		expect(task.assigneeRoles.map((r: any) => r.name)).toEqual(['Distributor Representative']);
	}
	finally {
		await deleteContactUs(api, name);
		await api.dispose();
	}
});

test('AC 12.4-1 · the data set CONTACT_US_RESPONSES has the Name, Create Date and City sorts and the date and Inquiry Type filters', async () => {
	const api = await adminApi();
	const dataSet = await getJSON(api, '/o/data-set-admin/data-sets/by-external-reference-code/CONTACT_US_RESPONSES?nestedFields=dataSetToDataSetSorts,dataSetToDataSetDateFilters,dataSetToDataSetSelectionFilters');
	const sorts = (dataSet.dataSetToDataSetSorts ?? []).map((s: any) => [i18n(s.label_i18n, 'en_US'), s.fieldName]);

	expect(sorts).toEqual(expect.arrayContaining([['Name', 'fullName'], ['Create Date', 'dateCreated'], ['City', 'city']]));
	expect((dataSet.dataSetToDataSetDateFilters ?? []).map((f: any) => f.fieldName)).toContain('dateCreated');
	expect((dataSet.dataSetToDataSetSelectionFilters ?? []).map((f: any) => [f.fieldName, f.source])).toContainEqual(['inquiryType', 'INQUIRY_TYPES']);
	await api.dispose();
});

test('AC 12.4-2 · /web/clarity/contact-us-responses is not viewable by Guest', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');
	const response = await page.goto(RESPONSES);

	expect(response?.status(), 'status for Guest').toBeGreaterThanOrEqual(400);

	const html = await page.content();

	expect(html).not.toContain('Contact Us Responses');
	expect(html).not.toContain('CONTACT_US_RESPONSES');
	await context.close();
});

test('AC 12.4-3 · as Daniel Raymond, Contact Us Responses lists pending entries, and an approved one leaves the list', async ({browser}) => {
	test.setTimeout(180_000);

	const admin = await adminApi();
	const daniel = await personaApi('Daniel');
	const {context, page} = await pageAs(browser, 'Daniel');
	const name = testName();
	const listed = async () => {
		await page.goto(RESPONSES);
		await expect(page.locator('.list-group-title').first().or(page.getByText(/No (Results|Items) Found/i).first())).toBeVisible();

		return (await page.locator('.list-group-title').allInnerTexts()).map((t) => t.trim());
	};

	try {
		const created = await createContactUs(admin, name);

		await expect.poll(listed, {message: 'the new pending entry is listed', timeout: 30_000}).toContain(name);

		const pendingNames = (await getAll(admin, `${CONTACT_US}?filter=${encodeURIComponent('status eq 1')}`)).map((e) => e.fullName);

		for (const title of await listed()) {
			expect(pendingNames, `listed "${title}" is pending`).toContain(title);
		}

		const task = (await getAll(daniel, `${WORKFLOW}/workflow-tasks/assigned-to-my-roles`)).find((t) => t.objectReviewed?.id === created.id);

		expect(task, "the entry's Follow Up task in Daniel's role tasks").toBeTruthy();

		const assign = await daniel.post(`${WORKFLOW}/workflow-tasks/${task.id}/assign-to-me`, {data: {workflowTaskId: task.id}});

		expect(assign.ok(), `assign-to-me -> ${assign.status()}`).toBeTruthy();

		const approve = await daniel.post(`${WORKFLOW}/workflow-tasks/${task.id}/change-transition`, {
			data: {comment: 'Approved by the Level 12 reference test.', transitionName: 'approve_contact_us_entry', workflowTaskId: task.id},
		});

		expect(approve.ok(), `change-transition -> ${approve.status()} ${(await approve.text()).slice(0, 200)}`).toBeTruthy();
		await expect.poll(async () => (await getJSON(admin, `/o/c/contactuses/${created.id}`)).status.label).toBe('approved');
		await expect.poll(listed, {message: 'the approved entry left the list', timeout: 30_000}).not.toContain(name);
	}
	finally {
		await deleteContactUs(admin, name);
		await context.close();
		await daniel.dispose();
		await admin.dispose();
	}
});
