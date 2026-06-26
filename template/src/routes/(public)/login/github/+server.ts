import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { github, hasGithub } from '$lib/server/oauth';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent): Promise<Response> {
	if (!hasGithub || !github) redirect(307, '/login');

	const state = generateState();
	const url = github.createAuthorizationURL(state, ['user:email']);

	event.cookies.set('github_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
		secure: import.meta.env.PROD
	});

	redirect(302, url.toString());
}
