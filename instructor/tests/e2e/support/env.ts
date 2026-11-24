import fs from 'node:fs';
import path from 'node:path';

// The workspace the tests check: this repository by default, or WORKSPACE.

export const workspace = path.resolve(process.env.WORKSPACE ?? path.join(__dirname, '..', '..', '..', '..'));

function readProperties(file: string): Record<string, string> {
	const properties: Record<string, string> = {};

	if (!fs.existsSync(file)) {
		return properties;
	}

	for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();

		if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
			const index = trimmed.indexOf('=');

			properties[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
		}
	}

	return properties;
}

// Liferay's HTTP port: LIFERAY_URL, else a Tomcat bundle's server.xml, else 8080 (Docker).

function detectBaseURL(): string {
	if (process.env.LIFERAY_URL) {
		return process.env.LIFERAY_URL.replace(/\/$/, '');
	}

	const bundles = path.join(workspace, 'bundles');

	if (fs.existsSync(bundles)) {
		for (const dir of fs.readdirSync(bundles).filter((name) => name.startsWith('tomcat')).sort()) {
			const serverXml = path.join(bundles, dir, 'conf', 'server.xml');

			if (!fs.existsSync(serverXml)) {
				continue;
			}

			const xml = fs.readFileSync(serverXml, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

			for (const connector of xml.match(/<Connector\b[^>]*>/g) ?? []) {
				const port = connector.includes('protocol="HTTP/1.1"') && connector.match(/\bport="(\d+)"/);

				if (port) {
					return `http://localhost:${port[1]}`;
				}
			}
		}
	}

	return 'http://localhost:8080';
}

export const baseURL = detectBaseURL();

// The admin account, from configs/local/admin.properties. Never print the password.

export function adminCredentials(): {email: string; password: string} {
	const properties = readProperties(path.join(workspace, 'configs', 'local', 'admin.properties'));
	const email = properties.ADMIN_EMAIL ?? process.env.LIFERAY_ADMIN_EMAIL;
	const password = properties.ADMIN_PASSWORD ?? process.env.LIFERAY_ADMIN_PASSWORD;

	if (!email || !password) {
		throw new Error('No admin credentials: create configs/local/admin.properties (Setup S.3).');
	}

	return {email, password};
}

// A small CSV reader: quoted fields may hold commas and doubled quotes.

function parseCsv(text: string): Record<string, string>[] {
	const records: string[][] = [];
	let field = '';
	let quoted = false;
	let record: string[] = [];

	for (let i = 0; i < text.length; i++) {
		const c = text[i];

		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			}
			else if (c === '"') {
				quoted = false;
			}
			else {
				field += c;
			}
		}
		else if (c === '"') {
			quoted = true;
		}
		else if (c === ',') {
			record.push(field);
			field = '';
		}
		else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') {
				i++;
			}

			record.push(field);
			records.push(record);
			field = '';
			record = [];
		}
		else {
			field += c;
		}
	}

	if (field || record.length) {
		record.push(field);
		records.push(record);
	}

	const [keys, ...rows] = records.filter((r) => r.some((value) => value !== ''));

	return rows.map((row) => Object.fromEntries(keys.map((key, i) => [key, row[i] ?? ''])));
}

// The personas, from context-source/data/personas.csv. Their training password is "learn".

export const PERSONA_PASSWORD = 'learn';

export type Persona = {
	emailAddress: string;
	familyName: string;
	givenName: string;
	jobTitle: string;
	regularRoles: string;
	screenName: string;
	userGroups: string;
};

export function personas(): Persona[] {
	return readCsv(path.join('context-source', 'data', 'personas.csv')) as Persona[];
}

export function persona(givenName: string): Persona {
	const match = personas().find((p) => p.givenName === givenName || p.screenName === givenName);

	if (!match) {
		throw new Error(`No persona ${givenName} in personas.csv`);
	}

	return match;
}

export function readCsv(relativePath: string): Record<string, string>[] {
	return parseCsv(fs.readFileSync(path.join(workspace, relativePath), 'utf8'));
}

export function readJson<T = any>(relativePath: string): T {
	return JSON.parse(fs.readFileSync(path.join(workspace, relativePath), 'utf8'));
}
