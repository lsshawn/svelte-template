import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { serverConfig } from '$lib/server/config';

export interface EmailMessage {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

/**
 * Provider-agnostic email sender.
 *
 * Defaults to `console` so local dev works with zero API keys — OTP codes are
 * printed to the server log. Set EMAIL_PROVIDER=mailgun (+ MAILGUN_* env vars)
 * to send real email in production.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
	const provider = serverConfig.email.provider;

	if (provider === 'console' || dev) {
		console.log('\n📧 [email:console]');
		console.log(`   to:      ${msg.to}`);
		console.log(`   subject: ${msg.subject}`);
		console.log(`   text:    ${msg.text}\n`);
		return;
	}

	if (provider === 'mailgun') {
		await sendViaMailgun(msg);
		return;
	}

	throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
}

async function sendViaMailgun(msg: EmailMessage): Promise<void> {
	const apiKey = env.MAILGUN_API_KEY;
	const domain = env.MAILGUN_DOMAIN;
	if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY / MAILGUN_DOMAIN not set');

	const body = new URLSearchParams({
		from: serverConfig.email.from,
		to: msg.to,
		subject: msg.subject,
		text: msg.text
	});
	if (msg.html) body.set('html', msg.html);

	const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	if (!res.ok) {
		throw new Error(`Mailgun error ${res.status}: ${await res.text()}`);
	}
}
