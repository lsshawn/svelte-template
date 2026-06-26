import { env } from '$env/dynamic/public';

/** App-wide public config. Safe to import in client code. */
export const config = {
	name: '__APP_TITLE__',
	description: '__APP_DESCRIPTION__',
	domain: env.PUBLIC_DOMAIN || 'http://localhost:5173'
} as const;
