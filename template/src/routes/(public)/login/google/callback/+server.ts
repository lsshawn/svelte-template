import { redirect } from '@sveltejs/kit';
import { decodeIdToken } from 'arctic';
import { google, hasGoogle } from '$lib/server/oauth';
import { getUserByGoogleId, getUserByEmail, createUser, updateUser } from '$lib/server/user';
import { createSession, setSessionTokenCookie } from '$lib/server/auth';
import type { RequestEvent } from './$types';

interface GoogleClaims {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
}

export async function GET(event: RequestEvent): Promise<Response> {
	if (!hasGoogle || !google) redirect(307, '/login');

	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state');
	const codeVerifier = event.cookies.get('google_code_verifier');

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(307, '/login');
	}

	const tokens = await google.validateAuthorizationCode(code, codeVerifier);
	const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;

	let user = await getUserByGoogleId(claims.sub);
	if (!user) {
		// Link to an existing account by email if present, else create one.
		const existing = await getUserByEmail(claims.email);
		if (existing) {
			user = await updateUser(existing.id, { googleId: claims.sub });
		} else {
			user = await createUser({
				email: claims.email,
				name: claims.name ?? null,
				picture: claims.picture ?? null,
				googleId: claims.sub,
				isVerified: true
			});
		}
	}

	const { session, token } = await createSession(user.id);
	setSessionTokenCookie(event, token, session.expiresAt);
	redirect(307, '/dashboard');
}
