import { dev } from '$app/environment';
import { getUserByEmail, createUser } from '$lib/server/user';

export const DEMO_EMAIL = 'test@test.com';

let seeded = false;

/**
 * Ensure a demo account exists in dev. Runs at most once per server start.
 * Sign in with this email + the dev OTP (888888). No-op in production.
 */
export async function ensureDevSeed(): Promise<void> {
	if (!dev || seeded) return;
	seeded = true;
	try {
		const existing = await getUserByEmail(DEMO_EMAIL);
		if (!existing) {
			await createUser({ email: DEMO_EMAIL, name: 'Demo User', isVerified: true });
			console.log(`\n🌱 [dev] Created demo account ${DEMO_EMAIL} (sign in with OTP 888888)\n`);
		}
	} catch (e) {
		// DB may not be pushed yet — don't crash the dev server.
		console.warn(`[dev] demo seed skipped: ${e instanceof Error ? e.message : e}`);
		seeded = false; // allow a retry on the next request once the DB is ready
	}
}
