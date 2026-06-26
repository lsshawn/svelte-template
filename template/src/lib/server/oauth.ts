/**
 * OAuth providers (Google + GitHub) via Arctic.
 *
 * This is OPTIONAL. The login routes under (public)/login/google and
 * (public)/login/github use these. If you don't need OAuth, you can delete
 * those routes and this file. The buttons only render when the relevant
 * client IDs are present (see (public)/login/+page.server.ts).
 */
import { Google, GitHub } from 'arctic';
import { env } from '$env/dynamic/private';
import { config } from '$lib/config';

export const hasGoogle = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const hasGithub = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);

export const google = hasGoogle
	? new Google(
			env.GOOGLE_CLIENT_ID!,
			env.GOOGLE_CLIENT_SECRET!,
			`${config.domain}/login/google/callback`
		)
	: null;

export const github = hasGithub
	? new GitHub(
			env.GITHUB_CLIENT_ID!,
			env.GITHUB_CLIENT_SECRET!,
			`${config.domain}/login/github/callback`
		)
	: null;
