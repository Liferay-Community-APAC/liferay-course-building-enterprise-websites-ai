import {APIRequestContext, expect} from '@playwright/test';

import {getAll, q} from './api';

// Helpers shared by the Level 10 to 13 specs: workflow definitions and their
// links, object definitions, and the Contact Us test entries that 12.x creates.

export const WORKFLOW = '/o/headless-admin-workflow/v1.0';
export const OBJECT_ADMIN = '/o/object-admin/v1.0';
export const CONTACT_US = '/o/c/contactuses/scopes/clarity-public';

export async function objectDefinition(api: APIRequestContext, name: string): Promise<any> {
	const [definition] = await getAll(api, `${OBJECT_ADMIN}/object-definitions?filter=${q(`name eq '${name}'`)}`);

	expect(definition, `object definition ${name}`).toBeTruthy();

	return definition;
}

// Every workflow definition, each with its links (className, groupExternalReferenceCode…).

export async function workflowDefinitionsWithLinks(api: APIRequestContext): Promise<any[]> {
	const definitions = await getAll(api, `${WORKFLOW}/workflow-definitions`);

	for (const definition of definitions) {
		definition.links = definition.externalReferenceCode
			? await getAll(api, `${WORKFLOW}/workflow-definitions/by-external-reference-code/${q(definition.externalReferenceCode)}/workflow-definition-links`)
			: [];
	}

	return definitions;
}

// The workflow definition linked to className in the group groupERC, or undefined.

export async function linkedWorkflow(api: APIRequestContext, className: string, groupERC: string): Promise<any> {
	const definitions = await workflowDefinitionsWithLinks(api);

	return definitions.find((d) => d.links.some((l: any) => l.className === className && l.groupExternalReferenceCode === groupERC));
}

// The roles each task of a definition is assigned to: {taskName: [roleName…]}.
// The API returns the definition's content as JSON ("#tag-name" nodes); XML is read too.

export function taskRoles(content: string): Record<string, string[]> {
	const result: Record<string, string[]> = {};

	if (content.trim().startsWith('<')) {
		for (const task of content.match(/<task>[\s\S]*?<\/task>/g) ?? []) {
			const name = task.match(/<name>([^<]*)<\/name>/)?.[1] ?? '';
			const assignments = task.match(/<assignments>[\s\S]*?<\/assignments>/)?.[0] ?? '';

			result[name] = [...assignments.matchAll(/<role>[\s\S]*?<name>([^<]*)<\/name>[\s\S]*?<\/role>/g)].map((m) => m[1]);
		}

		return result;
	}

	const children = (node: any, tag: string): any[] => (node?.['#child-nodes'] ?? []).filter((c: any) => c['#tag-name'] === tag);
	const value = (node: any, tag: string): string | undefined => children(node, tag)[0]?.['#value'];

	for (const task of children(JSON.parse(content), 'task')) {
		const roles = children(children(task, 'assignments')[0], 'roles').flatMap((r) => children(r, 'role'));

		result[value(task, 'name') ?? ''] = roles.map((r) => value(r, 'name') ?? '');
	}

	return result;
}

// Workflow tasks matching a search (POST /workflow-tasks), as the caller.

export async function searchWorkflowTasks(api: APIRequestContext, selection: Record<string, unknown>): Promise<any[]> {
	const response = await api.post(`${WORKFLOW}/workflow-tasks?pageSize=200`, {data: selection});

	expect(response.ok(), `POST workflow-tasks -> ${response.status()} ${(await response.text()).slice(0, 300)}`).toBeTruthy();

	return (await response.json()).items ?? [];
}

// A recognizable name for the entries the tests create and delete.

export function testName(): string {
	return `Reference Test ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function createContactUs(api: APIRequestContext, fullName: string): Promise<any> {
	const response = await api.post(CONTACT_US, {
		data: {
			city: 'Raleigh',
			comment: 'Created by the Level 12 reference test; deleted when it ends.',
			emailAddress: 'reference.test@example.com',
			fullName,
			inquiryType: {key: 'general'},
			phone: '+1 919 555 0199',
			stateOrProvince: 'North Carolina',
		},
	});

	expect(response.ok(), `POST Contact Us -> ${response.status()} ${(await response.text()).slice(0, 300)}`).toBeTruthy();

	return response.json();
}

export async function contactUsByName(api: APIRequestContext, fullName: string): Promise<any[]> {
	return getAll(api, `${CONTACT_US}?filter=${q(`fullName eq '${fullName}'`)}`);
}

// Delete, as the admin, every Contact Us entry carrying this test name (and only those).

export async function deleteContactUs(api: APIRequestContext, fullName: string): Promise<void> {
	expect(fullName.startsWith('Reference Test '), 'only test entries are deleted').toBe(true);

	for (const entry of await contactUsByName(api, fullName)) {
		const response = await api.delete(`/o/c/contactuses/${entry.id}`);

		expect([204, 200, 404], `DELETE Contact Us ${entry.id}`).toContain(response.status());
	}
}
