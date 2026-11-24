import {expect, test} from '@playwright/test';

import {adminApi, getAll, getJSON} from '../support/api';
import {pageAs} from '../support/browser';
import {personas, readCsv} from '../support/env';

const USER = '/o/headless-admin-user/v1.0';

test('AC 1.1-1 · the five user groups exist', async () => {
	const api = await adminApi();
	const names = (await getAll(api, `${USER}/user-groups`)).map((g) => g.name);

	for (const row of readCsv('context-source/data/user-groups.csv')) {
		expect(names, row.name).toContain(row.name);
	}
	await api.dispose();
});

test('AC 1.1-2 · the roles exist, each as its type', async () => {
	const api = await adminApi();
	const roles = await getAll(api, `${USER}/roles`);

	for (const row of readCsv('context-source/data/roles.csv')) {
		const role = roles.find((r) => r.name === row.name);

		expect(role, row.name).toBeTruthy();
		expect(role.roleType, `${row.name} type`).toBe(row.type);
	}
	await api.dispose();
});

test('AC 1.1-3 · the seven personas exist by ERC, active, with job title, user group and regular role', async () => {
	const api = await adminApi();
	const rows = personas();

	expect(rows).toHaveLength(7);

	for (const row of rows) {
		const erc = `PERSONA-${row.screenName.toUpperCase()}`;
		const user = await getJSON(api, `${USER}/user-accounts/by-external-reference-code/${erc}`);

		expect(user.emailAddress, erc).toBe(row.emailAddress);
		expect(user.status, `${erc} status`).toBe('Active');
		expect(user.jobTitle, `${erc} job title`).toBe(row.jobTitle);

		const groups = (await getAll(api, `${USER}/user-accounts/${user.id}/user-groups`)).map((g) => g.name);

		for (const group of row.userGroups.split(';').filter(Boolean)) {
			expect(groups, `${erc} in ${group}`).toContain(group);
		}

		const roles = (user.roleBriefs ?? []).map((r: any) => r.name);

		for (const role of row.regularRoles.split(';').filter(Boolean)) {
			expect(roles, `${erc} holds ${role}`).toContain(role);
		}
	}
	await api.dispose();
});

test('AC 1.1-4 · Christian signs in with "learn" and lands without a password change', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Christian');

	await expect(page).not.toHaveURL(/update_password/);
	expect(await page.evaluate(() => (window as any).Liferay.ThemeDisplay.isSignedIn())).toBe(true);
	await context.close();
});
