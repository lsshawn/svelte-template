#!/usr/bin/env node
// @ts-check
/**
 * sk-template scaffolder.
 *
 * Interactive:
 *   node bin/create.mjs
 *
 * Non-interactive (AI / scripted):
 *   node bin/create.mjs --name my-app --dir ../my-app \
 *     --archetype dashboard --db turso --title "My App" \
 *     --description "Does a thing" --install --git --yes
 *
 * Flags:
 *   --name <pkg-name>          npm package name (kebab-case)
 *   --dir <path>              target directory (default: ./<name>)
 *   --archetype <a>          landing | dashboard | webapp
 *   --db <d>                 turso | neon | sqlite
 *   --title <str>            human app title (UI)
 *   --description <str>      app description (meta / hero)
 *   --pm <pm>                pnpm | npm | bun   (default: pnpm)
 *   --install                run the package install
 *   --no-install
 *   --git                    git init + first commit
 *   --no-git
 *   --yes, -y                accept defaults, skip prompts
 *   --force                  allow non-empty target dir
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'template');

const ARCHETYPES = ['landing', 'dashboard', 'webapp'];
const DBS = ['turso', 'neon', 'sqlite'];
const PMS = ['pnpm', 'npm', 'bun'];

const c = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m'
};
const log = (m) => console.log(m);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const die = (m) => {
	console.error(`${c.red}✗ ${m}${c.reset}`);
	process.exit(1);
};

// ---------- arg parsing ----------
function parseArgs(argv) {
	/** @type {Record<string, string | boolean>} */
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '-y') {
			out.yes = true;
		} else if (a.startsWith('--no-')) {
			out[a.slice(5)] = false;
		} else if (a.startsWith('--')) {
			const key = a.slice(2);
			const next = argv[i + 1];
			if (next === undefined || next.startsWith('--')) {
				out[key] = true;
			} else {
				out[key] = next;
				i++;
			}
		}
	}
	return out;
}

function kebab(s) {
	return String(s)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function titleCase(s) {
	return kebab(s)
		.split('-')
		.filter(Boolean)
		.map((w) => w[0].toUpperCase() + w.slice(1))
		.join(' ');
}

async function isEmptyDir(dir) {
	try {
		const entries = await fs.readdir(dir);
		return entries.length === 0;
	} catch (e) {
		if (e.code === 'ENOENT') return true;
		throw e;
	}
}

// ---------- recursive copy ----------
async function copyDir(src, dest, skip = () => false) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });
	for (const entry of entries) {
		// Never copy build/dep artifacts — the template dir may have been run
		// directly (pnpm install/dev), leaving node_modules/.svelte-kit behind.
		if (ALWAYS_SKIP.has(entry.name)) continue;
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (skip(srcPath, entry)) continue;
		if (entry.isSymbolicLink()) {
			const link = await fs.readlink(srcPath);
			await fs.symlink(link, destPath);
		} else if (entry.isDirectory()) {
			await copyDir(srcPath, destPath, skip);
		} else if (entry.isFile()) {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

const ALWAYS_SKIP = new Set([
	'node_modules',
	'.svelte-kit',
	'.vercel',
	'build',
	'dist',
	'.dev',
	'.dev-stash',
	'local.db',
	'local.db-shm',
	'local.db-wal'
]);

async function rmrf(p) {
	await fs.rm(p, { recursive: true, force: true });
}

async function exists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

// Replace __TOKEN__ placeholders across all text files.
const TEXT_EXT = new Set([
	'.ts', '.js', '.mjs', '.cjs', '.svelte', '.json', '.css', '.html',
	'.md', '.example', '.txt', '.svg', '.cfg', '.yml', '.yaml'
]);

async function replaceTokens(root, tokens) {
	const entries = await fs.readdir(root, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(root, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === '.git') continue;
			await replaceTokens(full, tokens);
		} else {
			const ext = path.extname(entry.name);
			const isEnv = entry.name.startsWith('.env') || entry.name.includes('.env');
			if (!TEXT_EXT.has(ext) && !isEnv && ext !== '') continue;
			let content;
			try {
				content = await fs.readFile(full, 'utf8');
			} catch {
				continue;
			}
			let next = content;
			for (const [k, v] of Object.entries(tokens)) {
				next = next.split(k).join(v);
			}
			if (next !== content) await fs.writeFile(full, next);
		}
	}
}

// ---------- main ----------
async function main() {
	const args = parseArgs(process.argv.slice(2));
	const interactive = !args.yes && stdin.isTTY;
	let rl;
	const ask = async (q, def) => {
		if (!interactive) return def;
		if (!rl) rl = readline.createInterface({ input: stdin, output: stdout });
		const ans = (await rl.question(`${c.cyan}?${c.reset} ${q} ${def ? c.dim + '(' + def + ')' + c.reset + ' ' : ''}`)).trim();
		return ans || def;
	};
	const choose = async (q, opts, def) => {
		const v = await ask(`${q} [${opts.join('/')}]`, def);
		if (!opts.includes(v)) die(`Invalid value "${v}" for ${q}. Expected one of: ${opts.join(', ')}`);
		return v;
	};

	log(`\n${c.bold}🪄  sk-template${c.reset} — SvelteKit + Drizzle + DaisyUI scaffolder\n`);

	// Resolve options (flags > prompts > defaults).
	const name = kebab(args.name ?? (await ask('Project name', 'my-app')));
	if (!name) die('A project name is required.');

	const archetype = args.archetype
		? String(args.archetype)
		: await choose('Archetype', ARCHETYPES, 'webapp');
	if (!ARCHETYPES.includes(archetype)) die(`--archetype must be one of: ${ARCHETYPES.join(', ')}`);

	// Landing pages don't need a database.
	const needsDb = archetype !== 'landing';
	let db = 'none';
	if (needsDb) {
		db = args.db ? String(args.db) : await choose('Database', DBS, 'sqlite');
		if (!DBS.includes(db)) die(`--db must be one of: ${DBS.join(', ')}`);
	}

	const title = String(args.title ?? (await ask('Display title', titleCase(name))));
	const description = String(
		args.description ?? (await ask('Description', 'A SvelteKit app'))
	);
	const pm = args.pm ? String(args.pm) : interactive ? await choose('Package manager', PMS, 'pnpm') : 'pnpm';
	if (!PMS.includes(pm)) die(`--pm must be one of: ${PMS.join(', ')}`);

	const doInstall = args.install === true ? true : args.install === false ? false : interactive ? (await ask('Install dependencies now?', 'y')).toLowerCase().startsWith('y') : false;
	const doGit = args.git === true ? true : args.git === false ? false : interactive ? (await ask('Initialize git repo?', 'y')).toLowerCase().startsWith('y') : true;

	const targetDir = path.resolve(process.cwd(), String(args.dir ?? name));

	if (rl) rl.close();

	// Pre-flight: target dir.
	if (!(await isEmptyDir(targetDir)) && !args.force) {
		die(`Target directory ${targetDir} is not empty. Use --force to override.`);
	}

	log('');
	log(`  ${c.dim}name${c.reset}        ${name}`);
	log(`  ${c.dim}archetype${c.reset}   ${archetype}`);
	log(`  ${c.dim}database${c.reset}    ${db}`);
	log(`  ${c.dim}target${c.reset}      ${targetDir}`);
	log(`  ${c.dim}pkg mgr${c.reset}     ${pm}`);
	log('');

	// 1. Copy template (skip dialect/env staging dirs — handled below).
	await copyDir(TEMPLATE_DIR, targetDir, (src, entry) => {
		const base = entry.name;
		// We copy these selectively later.
		if (base === 'env') return true;
		if (base === 'dialects') return true;
		if (base.startsWith('drizzle.config.') && base.endsWith('.ts')) return true;
		return false;
	});
	ok('Copied template');

	// 2. Database wiring.
	const dbDir = path.join(targetDir, 'src', 'lib', 'server', 'db');
	const dialectsSrc = path.join(TEMPLATE_DIR, 'src', 'lib', 'server', 'db', 'dialects');
	if (needsDb) {
		const isLibsql = db === 'turso' || db === 'sqlite';
		// db/index.ts
		await fs.copyFile(
			path.join(dialectsSrc, isLibsql ? 'index.libsql.ts' : 'index.neon.ts'),
			path.join(dbDir, 'index.ts')
		);
		// db/schema.ts
		await fs.copyFile(
			path.join(dialectsSrc, isLibsql ? 'schema.libsql.ts' : 'schema.neon.ts'),
			path.join(dbDir, 'schema.ts')
		);
		// drizzle.config.ts
		await fs.copyFile(
			path.join(TEMPLATE_DIR, `drizzle.config.${db}.ts`),
			path.join(targetDir, 'drizzle.config.ts')
		);
		// .env.example + .env
		await fs.copyFile(
			path.join(TEMPLATE_DIR, 'env', `.env.${db}.example`),
			path.join(targetDir, '.env.example')
		);
		await fs.copyFile(
			path.join(TEMPLATE_DIR, 'env', `.env.${db}.example`),
			path.join(targetDir, '.env')
		);
		ok(`Wired database: ${db}`);
	} else {
		// Landing: strip all server/db code.
		await rmrf(path.join(targetDir, 'src', 'lib', 'server'));
		await rmrf(path.join(targetDir, 'src', 'hooks.server.ts'));
		await rmrf(path.join(targetDir, 'src', 'routes', '+layout.server.ts'));
		ok('Landing mode: removed server/db/auth code');
	}

	// 3. Patch package.json deps for the chosen DB.
	await patchPackageJson(targetDir, { name, db, needsDb });
	ok('Patched package.json');

	// 4. Archetype pruning of routes.
	await pruneArchetype(targetDir, archetype);
	ok(`Scaffolded archetype: ${archetype}`);

	// 5. app.d.ts: landing has no Session type.
	if (!needsDb) {
		await writeLandingAppDts(targetDir);
	}

	// 6. Rename _gitignore -> .gitignore
	const giSrc = path.join(targetDir, '_gitignore');
	if (await exists(giSrc)) await fs.rename(giSrc, path.join(targetDir, '.gitignore'));

	// 7. Token replacement.
	await replaceTokens(targetDir, {
		__APP_NAME__: name,
		__APP_TITLE__: title.replace(/"/g, '\\"'),
		__APP_DESCRIPTION__: description.replace(/"/g, '\\"')
	});
	ok('Applied project names');

	// 8. README.
	await writeReadme(targetDir, { name, archetype, db, pm });

	// 9. Install.
	if (doInstall) {
		log(`\n${c.dim}Installing dependencies with ${pm}…${c.reset}`);
		const r = spawnSync(pm, ['install'], { cwd: targetDir, stdio: 'inherit', shell: process.platform === 'win32' });
		if (r.status !== 0) log(`${c.yellow}! install failed — run "${pm} install" manually${c.reset}`);
		else ok('Installed dependencies');
	}

	// 10. Git.
	if (doGit) {
		const run = (a) => spawnSync('git', a, { cwd: targetDir, stdio: 'ignore' });
		if (run(['init']).status === 0) {
			run(['add', '-A']);
			run(['commit', '-m', 'chore: scaffold from sk-template']);
			ok('Initialized git repo');
		}
	}

	// Done.
	const rel = path.relative(process.cwd(), targetDir) || '.';
	log(`\n${c.green}${c.bold}Done!${c.reset}\n`);
	log(`${c.bold}Next steps:${c.reset}`);
	let step = 1;
	if (rel !== '.') log(`  ${step++}. cd ${rel}`);
	if (!doInstall) log(`  ${step++}. ${pm} install`);
	if (needsDb) {
		log(`  ${step++}. edit .env with your ${db} credentials`);
		log(`  ${step++}. ${pm} run db:push   ${c.dim}# create tables${c.reset}`);
	}
	log(`  ${step++}. ${pm} run dev`);
	log(`\n${c.dim}Deploy:${c.reset} vercel`);
	log('');
}

// ---------- helpers that mutate the generated project ----------

async function patchPackageJson(targetDir, { name, db, needsDb }) {
	const pkgPath = path.join(targetDir, 'package.json');
	const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
	pkg.name = name;

	if (needsDb) {
		if (db === 'turso' || db === 'sqlite') {
			pkg.dependencies['@libsql/client'] = '^0.14.0';
			pkg.devDependencies['dotenv'] = '^16.4.7';
		} else if (db === 'neon') {
			pkg.dependencies['@neondatabase/serverless'] = '^0.10.4';
			pkg.devDependencies['dotenv'] = '^16.4.7';
			pkg.devDependencies['pg'] = '^8.13.1';
		}
	} else {
		// Landing: drop db/auth-only deps.
		for (const d of ['drizzle-orm', '@oslojs/crypto', '@oslojs/encoding', 'arctic', 'nanoid']) {
			delete pkg.dependencies[d];
		}
		delete pkg.devDependencies['drizzle-kit'];
		// Drop db scripts.
		for (const s of Object.keys(pkg.scripts)) {
			if (s.startsWith('db:')) delete pkg.scripts[s];
		}
	}

	// Sort deps for cleanliness.
	const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
	pkg.dependencies = sortObj(pkg.dependencies);
	pkg.devDependencies = sortObj(pkg.devDependencies);

	await fs.writeFile(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}

async function pruneArchetype(targetDir, archetype) {
	const routes = path.join(targetDir, 'src', 'routes');
	const marketing = path.join(routes, '(marketing)');
	const app = path.join(routes, '(app)');
	const pub = path.join(routes, '(public)');

	if (archetype === 'landing') {
		// Keep only the marketing landing page.
		await rmrf(app);
		await rmrf(pub);
	} else if (archetype === 'dashboard') {
		// Dashboard-only: drop the marketing landing, keep (app) + login.
		await rmrf(marketing);
		// Root should land on the dashboard.
		await writeRootRedirect(routes, '/dashboard');
	} else if (archetype === 'webapp') {
		// Keep everything: marketing landing at /, dashboard behind auth, login.
		// nothing to remove.
	}
}

async function writeRootRedirect(routesDir, to) {
	// A tiny root route that redirects to the dashboard.
	const file = path.join(routesDir, '+page.server.ts');
	await fs.writeFile(
		file,
		`import { redirect } from '@sveltejs/kit';\nimport type { PageServerLoad } from './$types';\n\nexport const load: PageServerLoad = async () => {\n\tredirect(307, '${to}');\n};\n`
	);
}

async function writeLandingAppDts(targetDir) {
	const file = path.join(targetDir, 'src', 'app.d.ts');
	await fs.writeFile(
		file,
		`declare global {\n\tnamespace App {\n\t\t// interface Error {}\n\t\t// interface Locals {}\n\t\t// interface PageData {}\n\t\t// interface PageState {}\n\t\t// interface Platform {}\n\t}\n}\n\nexport {};\n`
	);
}

async function writeReadme(targetDir, { name, archetype, db, pm }) {
	const dbBlurb =
		db === 'none'
			? 'No database (static landing page).'
			: `Drizzle ORM + ${db === 'turso' ? 'Turso (libSQL)' : db === 'neon' ? 'Neon (Postgres)' : 'local SQLite'}.`;
	const dbSteps =
		db === 'none'
			? ''
			: `\n## Database\n\n${dbBlurb}\n\n\`\`\`bash\n# 1. Set DATABASE_URL (and auth token for Turso) in .env\n# 2. Create tables\n${pm} run db:push\n# 3. Inspect data\n${pm} run db:studio\n\`\`\`\n`;

	const auth =
		archetype === 'landing'
			? ''
			: `\n## Auth\n\nSession-based auth with email one-time codes (OTP). In dev, codes are printed to the **server console** — no email provider needed.\n\nTo enable Google/GitHub OAuth, set the relevant \`*_CLIENT_ID\` / \`*_CLIENT_SECRET\` in \`.env\`; the buttons appear automatically. To send real OTP email, set \`EMAIL_PROVIDER=mailgun\` and the \`MAILGUN_*\` vars.\n`;

	const content = `# ${name}

Scaffolded with **sk-template** — SvelteKit 5 + Tailwind 4 + DaisyUI + Drizzle.

- **Archetype:** ${archetype}
- **Database:** ${dbBlurb}

## Develop

\`\`\`bash
${pm} install
${pm} run dev
\`\`\`
${dbSteps}${auth}
## Deploy

\`\`\`bash
vercel        # preview
vercel --prod # production
\`\`\`

Remember to set your environment variables in the Vercel project settings.
`;
	await fs.writeFile(path.join(targetDir, 'README.md'), content);
}

main().catch((e) => die(e?.stack || String(e)));
