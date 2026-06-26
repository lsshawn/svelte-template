import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const user = pgTable(
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
		otpExpiry: timestamp('otp_expiry', { withTimezone: true }),
		otpAttempts: integer('otp_attempts').default(0),
		isVerified: boolean('is_verified').default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		deletedAt: timestamp('deleted_at', { withTimezone: true })
	},
	(users) => ({
		emailIdx: index('idx_users_email').on(users.email)
	})
);

export const session = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
