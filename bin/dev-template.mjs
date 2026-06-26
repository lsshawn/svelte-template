#!/usr/bin/env node
// @ts-check
/**
 * Dev playground for iterating on the template itself.
 *
 *   pnpm dev:template            # webapp + sqlite (default)
 *   pnpm dev:template -- --archetype dashboard --db turso
 *
 * Scaffolds a throwaway app into ./.dev, then runs the dev server. On each run
 * it RE-COPIES your template/ source over .dev so edits flow through, while
 * preserving .dev/node_modules and .dev/local.db so you don't reinstall or
 * re-login every time. Just edit files under template/ and re-run.
 *
 * .dev is gitignored — it's disposable. Delete it any time for a clean slate.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEV_DIR = path.join(ROOT, '.dev');
const CREATE = path.join(__dirname, 'create.mjs');

// Pass-through flags (after `--`), with sensible defaults for fast iteration.
const passed = process.argv.slice(2);
function flag(name, def) {
	const i = passed.indexOf(`--${name}`);
	return i >= 0 && passed[i + 1] ? passed[i + 1] : def;
}
const archetype = flag('archetype', 'webapp');
const db = flag('db', 'sqlite');

const c = { reset: '\x1b[0m', dim: '\x1b[2m', cyan: '\x1b[36m', green: '\x1b[32m' };
const log = (m) => console.log(`${c.cyan}▸${c.reset} ${m}`);

async function exists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	const hadNodeModules = await exists(path.join(DEV_DIR, 'node_modules'));
	const hadDb = await exists(path.join(DEV_DIR, 'local.db'));

	// Stash artifacts we want to keep across rebuilds.
	const tmp = path.join(ROOT, '.dev-stash');
	await fs.rm(tmp, { recursive: true, force: true });
	if (hadNodeModules || hadDb) {
		await fs.mkdir(tmp, { recursive: true });
		if (hadNodeModules) await fs.rename(path.join(DEV_DIR, 'node_modules'), path.join(tmp, 'node_modules'));
		if (hadDb) await fs.rename(path.join(DEV_DIR, 'local.db'), path.join(tmp, 'local.db'));
	}

	// Fresh scaffold (force, no install/git — we manage those here).
	await fs.rm(DEV_DIR, { recursive: true, force: true });
	log(`scaffolding ${c.dim}${archetype} / ${db}${c.reset} into .dev`);
	const gen = spawnSync(
		process.execPath,
		[CREATE, '--name', 'dev-playground', '--dir', DEV_DIR, '--archetype', archetype,
			...(archetype === 'landing' ? [] : ['--db', db]),
			'--title', 'Template Dev', '--description', 'Local template playground',
			'--no-install', '--no-git', '--yes', '--force'],
		{ stdio: 'inherit' }
	);
	if (gen.status !== 0) process.exit(gen.status ?? 1);

	// Restore stashed artifacts.
	if (hadNodeModules) await fs.rename(path.join(tmp, 'node_modules'), path.join(DEV_DIR, 'node_modules'));
	if (hadDb) await fs.rename(path.join(tmp, 'local.db'), path.join(DEV_DIR, 'local.db'));
	await fs.rm(tmp, { recursive: true, force: true });

	// Install if needed.
	if (!hadNodeModules) {
		log('installing dependencies (first run)…');
		const inst = spawnSync('pnpm', ['install'], { cwd: DEV_DIR, stdio: 'inherit', shell: process.platform === 'win32' });
		if (inst.status !== 0) process.exit(inst.status ?? 1);
	}

	// Push schema for DB archetypes (non-interactive). Skips harmlessly if up to date.
	if (archetype !== 'landing') {
		log('applying schema (db:push --force)…');
		spawnSync('pnpm', ['exec', 'drizzle-kit', 'push', '--force'], {
			cwd: DEV_DIR, stdio: 'inherit', shell: process.platform === 'win32'
		});
	}

	log(`${c.green}starting dev server${c.reset} — edit files under template/ then re-run\n`);
	const dev = spawn('pnpm', ['dev'], { cwd: DEV_DIR, stdio: 'inherit', shell: process.platform === 'win32' });
	dev.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
