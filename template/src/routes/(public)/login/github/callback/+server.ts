import { redirect } from '@sveltejs/kit';
import { github, hasGithub } from '$lib/server/oauth';
import { getUserByGithubId, getUserByEmail, createUser, updateUser } from '$lib/server/user';
import { createSession, setSessionTokenCookie } from '$lib/server/auth';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent): Promise<Response> {
	if (!hasGithub || !github) redirect(307, '/login');

	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state');

	if (!code || !state || state !== storedState) redirect(307, '/login');

	const tokens = await github.validateAuthorizationCode(code);
	const accessToken = tokens.accessToken();

	const ghUser = await fetch('https://api.github.com/user', {
		headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sveltekit-app' }
	}).then((r) => r.json());

	// GitHub may hide the primary email — fetch it explicitly.
	let email: string | undefined = ghUser.email;
	if (!email) {
		const emails = await fetch('https://api.github.com/user/emails', {
			headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sveltekit-app' }
		}).then((r) => r.json());
		email = emails.find((e: { primary: boolean; email: string }) => e.primary)?.email;
	}
	if (!email) redirect(307, '/login');

	const githubId = String(ghUser.id);
	let user = await getUserByGithubId(githubId);
	if (!user) {
		const existing = await getUserByEmail(email);
		if (existing) {
			user = await updateUser(existing.id, { githubId });
		} else {
			user = await createUser({
				email,
				name: ghUser.name ?? ghUser.login ?? null,
				picture: ghUser.avatar_url ?? null,
				githubId,
				isVerified: true
			});
		}
	}

	const { session, token } = await createSession(user.id);
	setSessionTokenCookie(event, token, session.expiresAt);
	redirect(307, '/dashboard');
}
