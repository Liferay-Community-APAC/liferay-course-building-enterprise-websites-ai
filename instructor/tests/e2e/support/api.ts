import {APIRequestContext, expect, request} from '@playwright/test';

import {PERSONA_PASSWORD, adminCredentials, baseURL, persona} from './env';

// Headless API clients. The admin and persona clients use Basic auth, which
// the Service Access Policy allows for password-authenticated calls; the Guest
// client sends no credentials, so it sees what an anonymous visitor's browser would.

function basic(email: string, password: string): string {
	return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
}

export async function adminApi(): Promise<APIRequestContext> {
	const {email, password} = adminCredentials();

	return request.newContext({baseURL, extraHTTPHeaders: {Authorization: basic(email, password)}});
}

export async function personaApi(givenName: string): Promise<APIRequestContext> {
	return request.newContext({baseURL, extraHTTPHeaders: {Authorization: basic(persona(givenName).emailAddress, PERSONA_PASSWORD)}});
}

export async function guestApi(): Promise<APIRequestContext> {
	return request.newContext({baseURL});
}

// GET a JSON resource and fail with the status and body if it isn't 2xx.

export async function getJSON<T = any>(api: APIRequestContext, path: string): Promise<T> {
	const response = await api.get(path);

	expect(response.ok(), `GET ${path} -> ${response.status()} ${(await response.text()).slice(0, 300)}`).toBeTruthy();

	return response.json();
}

// Every item of a paged collection. Pages are clamped (an out-of-range page
// repeats the last one), so page by totalCount, never "until empty".

export async function getAll<T = any>(api: APIRequestContext, path: string, pageSize = 200): Promise<T[]> {
	const items: T[] = [];
	const separator = path.includes('?') ? '&' : '?';

	for (let page = 1; ; page++) {
		const body = await getJSON(api, `${path}${separator}page=${page}&pageSize=${pageSize}`);

		items.push(...(body.items ?? []));

		if (!body.totalCount || page * pageSize >= body.totalCount) {
			return items;
		}
	}
}

export function q(value: string): string {
	return encodeURIComponent(value);
}
