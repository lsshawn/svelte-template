import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { google, hasGoogle } from '$lib/server/oauth';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent): Promise<Response> {
	if (!hasGoogle || !google) redirect(307, '/login');

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	const opts = { path: '/', httpOnly: true, maxAge: 60 * 10, sameSite: 'lax' as const, secure: import.meta.env.PROD };
	event.cookies.set('google_oauth_state', state, opts);
	event.cookies.set('google_code_verifier', codeVerifier, opts);

	redirect(302, url.toString());
}
