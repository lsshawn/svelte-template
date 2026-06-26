import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { NewUser, User } from '$lib/server/db/schema';

export async function getUserByEmail(email: string): Promise<User | undefined> {
	const [u] = await db.select().from(table.user).where(eq(table.user.email, email));
	return u;
}

export async function getUserById(id: string): Promise<User | undefined> {
	const [u] = await db.select().from(table.user).where(eq(table.user.id, id));
	return u;
}

export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
	const [u] = await db.select().from(table.user).where(eq(table.user.googleId, googleId));
	return u;
}

export async function getUserByGithubId(githubId: string): Promise<User | undefined> {
	const [u] = await db.select().from(table.user).where(eq(table.user.githubId, githubId));
	return u;
}

export async function createUser(data: NewUser): Promise<User> {
	const [u] = await db.insert(table.user).values(data).returning();
	return u;
}

export async function updateUser(id: string, data: Partial<NewUser>): Promise<User> {
	const [u] = await db.update(table.user).set(data).where(eq(table.user.id, id)).returning();
	return u;
}
