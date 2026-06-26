import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const user = sqliteTable(
	'users',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => nanoid()),
		email: text('email').notNull().unique(),
		name: text('name'),
		username: text('username').unique(),
		picture: text('picture'),
		// Auth providers (optional — only set when OAuth is wired up).
		googleId: text('google_id').unique(),
		githubId: text('github_id').unique(),
		// Email OTP login state.
		otp: text('otp'),
		otpExpiry: integer('otp_expiry', { mode: 'timestamp' }),
		otpAttempts: integer('otp_attempts').default(0),
		isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
		createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(current_timestamp)`),
		deletedAt: integer('deleted_at', { mode: 'timestamp' })
	},
	(users) => ({
		emailIdx: index('idx_users_email').on(users.email)
	})
);

export const session = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
