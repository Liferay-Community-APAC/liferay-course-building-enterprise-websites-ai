import {expect, test} from '@playwright/test';

import {adminApi, getJSON} from '../support/api';
import {pageAs} from '../support/browser';
import {openFragmentSet, siteId} from '../support/levels-2-5';

function tree(element: any): any[] {
	return [element, ...(element.pageElements ?? []).flatMap(tree)];
}

const DEFAULT_BANNER = 'Elevate Your Brand with Premium Eyewear';
const DISTRIBUTOR_BANNER = 'Welcome Back! Elevate Your Inventory with Premium Eyewear.';
const PROMO = 'Become a Clarity Distributor';

test('AC 13.1-1 · Clarity Components lists Clarity Audience Container, and Home places it with userGroup and mode', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'admin');

	await openFragmentSet(page, 'Clarity Components');
	await expect(page.locator('.card').filter({has: page.getByRole('link', {exact: true, name: 'Clarity Audience Container'})})).toHaveCount(1);
	await context.close();

	// headless-admin-fragment needs the beta flag LPD-39244, which the course doesn't enable,
	// so the fragment's configuration is checked where it's used: Home's page definition.

	const api = await adminApi();
	const home = await getJSON(api, `/o/headless-delivery/v1.0/sites/${await siteId(api)}/site-pages/home`);
	const containers = tree(home.pageDefinition.pageElement)
		.filter((e) => e.type === 'Fragment' && e.definition?.fragment?.key === 'clarity-audience-container');

	expect(containers.length, 'Clarity Audience Containers on Home').toBeGreaterThanOrEqual(2);

	for (const container of containers) {
		const config = container.definition.fragmentConfig ?? {};

		expect(config.userGroup, 'userGroup').toBeTruthy();
		expect(['members', 'others'], 'mode').toContain(config.mode);
	}
	expect(containers.map((c) => c.definition.fragmentConfig.mode).sort()).toEqual(expect.arrayContaining(['members', 'others']));
	await api.dispose();
});

test('AC 13.2-1 · as Guest, Home has the default banner and the distributor promotion, and no Welcome Back!', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'guest');

	await page.goto('/web/clarity/home');
	await expect(page.getByText(DEFAULT_BANNER).first()).toBeVisible();
	await expect(page.getByText(PROMO).first()).toBeVisible();
	expect(await page.content()).not.toContain('Welcome Back!');
	await context.close();
});

test('AC 13.2-2 · as Terrence Wheatley, Home has Welcome Back!, and its HTML has no distributor promotion', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Terrence');

	await page.goto('/web/clarity/home');
	await expect(page.getByText(DISTRIBUTOR_BANNER).first()).toBeVisible();
	expect(await page.content()).not.toContain(PROMO);
	await context.close();
});

test('AC 13.2-3 · as Christian Carter (not a distributor), Home has the default banner and the distributor promotion', async ({browser}) => {
	const {context, page} = await pageAs(browser, 'Christian');

	await page.goto('/web/clarity/home');
	await expect(page.getByText(DEFAULT_BANNER).first()).toBeVisible();
	await expect(page.getByText(PROMO).first()).toBeVisible();
	await context.close();
});
