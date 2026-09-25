import { eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { users } from "../../db/schema.ts";

export async function registerUser(from: {
	id: number;
	username?: string;
	firstName: string;
	lastName?: string;
}) {
	const [user] = await db
		.insert(users)
		.values({
			telegramId: from.id,
			username: from.username ?? null,
			firstName: from.firstName,
			lastName: from.lastName ?? null,
		})
		.onConflictDoUpdate({
			target: users.telegramId,
			set: {
				username: from.username ?? null,
				firstName: from.firstName,
				lastName: from.lastName ?? null,
			},
		})
		.returning();
	if (!user) throw new Error("User upsert failed");
	return user;
}

export async function findUser(telegramId: number) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.telegramId, telegramId));
	return user;
}
