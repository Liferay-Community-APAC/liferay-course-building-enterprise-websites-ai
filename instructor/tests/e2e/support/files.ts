import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {workspace} from './env';

export function exists(relativePath: string): boolean {
	return fs.existsSync(path.join(workspace, relativePath));
}

export function read(relativePath: string): string {
	return fs.readFileSync(path.join(workspace, relativePath), 'utf8');
}

// Whether git ignores a path. In a git checkout, ask git; otherwise (a copied
// workspace) look for a matching line in the workspace's .gitignore.

export function gitIgnores(relativePath: string): boolean {
	if (fs.existsSync(path.join(workspace, '.git'))) {
		try {
			execFileSync('git', ['-C', workspace, 'check-ignore', '--quiet', '--no-index', relativePath]);

			return true;
		}
		catch {
			return false;
		}
	}

	const patterns = exists('.gitignore')
		? read('.gitignore').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
		: [];

	return patterns.some((pattern) => {
		const p = pattern.replace(/^\//, '').replace(/\/$/, '');

		return relativePath === p || relativePath.startsWith(p + '/') || path.basename(relativePath) === p ||
			new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(relativePath);
	});
}
