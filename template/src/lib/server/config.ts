import { env } from '$env/dynamic/private';
import { config as publicConfig } from '$lib/config';

const OTP_EXPIRATION_MINS = 15;

export const serverConfig = {
	appName: publicConfig.name,
	email: {
		from: env.EMAIL_FROM || `${publicConfig.name} <noreply@localhost>`,
		provider: env.EMAIL_PROVIDER || 'console'
	},
	otp: {
		expirationMinutes: OTP_EXPIRATION_MINS,
		expirationMs: 1000 * 60 * OTP_EXPIRATION_MINS
	}
} as const;
