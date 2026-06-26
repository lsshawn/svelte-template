import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { requestOtp, verifyOtp } from '$lib/server/otp';
import { createSession, setSessionTokenCookie } from '$lib/server/auth';
import { hasGoogle, hasGithub } from '$lib/server/oauth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session) redirect(307, '/dashboard');
	return { hasGoogle, hasGithub };
};

const emailSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({
	email: z.string().email(),
	code: z.string().length(6)
});

export const actions: Actions = {
	// Step 1: request an OTP code by email.
	request: async (event) => {
		const form = Object.fromEntries(await event.request.formData());
		const parsed = emailSchema.safeParse(form);
		if (!parsed.success) return fail(400, { step: 'request', error: 'Enter a valid email.' });

		await requestOtp(parsed.data.email);
		return { step: 'verify', email: parsed.data.email, sent: true };
	},

	// Step 2: verify the code and create a session.
	verify: async (event) => {
		const form = Object.fromEntries(await event.request.formData());
		const parsed = verifySchema.safeParse(form);
		if (!parsed.success)
			return fail(400, { step: 'verify', email: form.email, error: 'Enter the 6-digit code.' });

		const result = await verifyOtp(parsed.data.email, parsed.data.code);
		if (!result.ok) {
			const messages: Record<string, string> = {
				'no-otp': 'Request a new code.',
				expired: 'That code expired. Request a new one.',
				'too-many-attempts': 'Too many attempts. Request a new code.',
				invalid: 'Incorrect code.'
			};
			return fail(400, { step: 'verify', email: parsed.data.email, error: messages[result.reason] });
		}

		const { session, token } = await createSession(result.userId);
		setSessionTokenCookie(event, token, session.expiresAt);
		redirect(307, '/dashboard');
	}
};
