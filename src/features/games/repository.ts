import type { ScenesStorage, ScenesStorageData } from "@gramio/scenes";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.ts";
import {
	assignments,
	games,
	participants,
	sceneStates,
	users,
} from "../../db/schema.ts";

export type Game = typeof games.$inferSelect;
export type GameChange = Partial<
	Pick<Game, "name" | "budget" | "exchangeDate">
>;
export type GameTransaction = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

/** Stores the entire GramIO scene snapshot in PostgreSQL under its Telegram user ID. */
export const sceneStorage: ScenesStorage = {
	async get(key) {
		const [row] = await db
			.select()
			.from(sceneStates)
			.where(eq(sceneStates.telegramId, sceneTelegramId(key)));
		return row?.data as ScenesStorageData<unknown, unknown> | undefined;
	},
	async has(key) {
		const [row] = await db
			.select({ telegramId: sceneStates.telegramId })
			.from(sceneStates)
			.where(eq(sceneStates.telegramId, sceneTelegramId(key)));
		return !!row;
	},
	async set(key, value) {
		const telegramId = sceneTelegramId(key);
		await db
			.insert(sceneStates)
			.values({ telegramId, data: value })
			.onConflictDoUpdate({
				target: sceneStates.telegramId,
				set: { data: value },
			});
	},
	async delete(key) {
		const rows = await db
			.delete(sceneStates)
			.where(eq(sceneStates.telegramId, sceneTelegramId(key)))
			.returning({ telegramId: sceneStates.telegramId });
		return rows.length > 0;
	},
};

function sceneTelegramId(key: string) {
	const id = Number(key.slice("@gramio/scenes:".length));
	if (
		!key.startsWith("@gramio/scenes:") ||
		!Number.isSafeInteger(id) ||
		id <= 0
	)
		throw new Error("Invalid scene storage key");
	return id;
}

/** Loads a game by its internal ID. */
export function gameById(id: number) {
	return db
		.select()
		.from(games)
		.where(eq(games.id, id))
		.then(([game]) => game);
}

/** Loads a game by its invitation code. */
export function gameByInvite(code: string) {
	return db
		.select()
		.from(games)
		.where(eq(games.inviteCode, code))
		.then(([game]) => game);
}

/** Loads a user’s membership in one game. */
export function membership(gameId: number, userId: number) {
	return db
		.select()
		.from(participants)
		.where(
			and(eq(participants.gameId, gameId), eq(participants.userId, userId)),
		)
		.then(([member]) => member);
}

/** Lists game participants with Telegram delivery details. */
export function members(gameId: number) {
	return db
		.select({
			id: participants.id,
			userId: participants.userId,
			wishlist: participants.wishlist,
			telegramId: users.telegramId,
			firstName: users.firstName,
			locale: users.locale,
			lastName: users.lastName,
		})
		.from(participants)
		.innerJoin(users, eq(participants.userId, users.id))
		.where(eq(participants.gameId, gameId))
		.orderBy(participants.id);
}

/** Lists games joined by a user. */
export function myGames(userId: number) {
	return db
		.select({ game: games })
		.from(participants)
		.innerJoin(games, eq(participants.gameId, games.id))
		.where(eq(participants.userId, userId))
		.orderBy(games.createdAt);
}

/** Loads the receiver for a specific giver participant. */
export async function assignmentFor(gameId: number, giverId: number) {
	const [assignment] = await db
		.select()
		.from(assignments)
		.where(
			and(
				eq(assignments.gameId, gameId),
				eq(assignments.giverParticipantId, giverId),
			),
		);
	if (!assignment) return undefined;
	const [receiver] = await db
		.select({ firstName: users.firstName, wishlist: participants.wishlist })
		.from(participants)
		.innerJoin(users, eq(users.id, participants.userId))
		.where(
			and(
				eq(participants.id, assignment.receiverParticipantId),
				eq(participants.gameId, gameId),
			),
		);
	return receiver;
}

/** Locks the game before any roster read or mutation within the same transaction. */
export function withGameLock<T>(
	gameId: number,
	operation: (tx: GameTransaction, game: Game | undefined) => Promise<T>,
) {
	return db.transaction(async (tx) => {
		const [game] = await tx
			.select()
			.from(games)
			.where(eq(games.id, gameId))
			.for("update");
		return operation(tx, game);
	});
}

/** Creates a game and its organizer membership atomically. */
export async function insertGame(
	ownerId: number,
	name: string,
	budget: string,
	exchangeDate: string | null,
	inviteCode: string,
	ownerTelegramId?: number,
) {
	return db.transaction(async (tx) => {
		const [game] = await tx
			.insert(games)
			.values({
				ownerId,
				name,
				budget,
				exchangeDate,
				inviteCode,
			})
			.returning();
		if (!game) throw new Error("Game insert failed");
		await tx.insert(participants).values({ gameId: game.id, userId: ownerId });
		if (ownerTelegramId !== undefined)
			await tx
				.delete(sceneStates)
				.where(eq(sceneStates.telegramId, ownerTelegramId));
		return game;
	});
}

/** Updates a game inside its existing lock transaction. */
export async function updateLockedGame(
	tx: GameTransaction,
	gameId: number,
	change: GameChange,
) {
	const [game] = await tx
		.update(games)
		.set({ ...change, updatedAt: new Date() })
		.where(eq(games.id, gameId))
		.returning();
	if (!game) throw new Error("Game update failed");
	return game;
}

/** Deletes a game inside its existing lock transaction. */
export function deleteLockedGame(tx: GameTransaction, gameId: number) {
	return tx.delete(games).where(eq(games.id, gameId));
}

/** Loads a member within the game transaction. */
export function lockedMember(
	tx: GameTransaction,
	gameId: number,
	userId: number,
) {
	return tx
		.select()
		.from(participants)
		.where(
			and(eq(participants.gameId, gameId), eq(participants.userId, userId)),
		)
		.then(([member]) => member);
}

/** Loads a participant by row ID within the game transaction. */
export function lockedMemberById(
	tx: GameTransaction,
	gameId: number,
	memberId: number,
) {
	return tx
		.select()
		.from(participants)
		.where(and(eq(participants.gameId, gameId), eq(participants.id, memberId)))
		.then(([member]) => member);
}

/** Adds a participant within the game transaction. */
export function insertMember(
	tx: GameTransaction,
	gameId: number,
	userId: number,
) {
	return tx.insert(participants).values({ gameId, userId });
}

/** Updates wishes within the game transaction. */
export async function updateWishlist(
	tx: GameTransaction,
	gameId: number,
	userId: number,
	wishlist: string,
) {
	const [member] = await tx
		.update(participants)
		.set({ wishlist })
		.where(
			and(eq(participants.gameId, gameId), eq(participants.userId, userId)),
		)
		.returning();
	return member;
}

/** Removes a participant within the game transaction. */
export function deleteMember(tx: GameTransaction, memberId: number) {
	return tx.delete(participants).where(eq(participants.id, memberId));
}

/** Loads the draw roster inside the locked game transaction. */
export function drawRoster(tx: GameTransaction, gameId: number) {
	return tx
		.select({
			id: participants.id,
			telegramId: users.telegramId,
			firstName: users.firstName,
			wishlist: participants.wishlist,
		})
		.from(participants)
		.innerJoin(users, eq(users.id, participants.userId))
		.where(eq(participants.gameId, gameId))
		.orderBy(participants.id);
}

/** Persists assignments and closes recruiting in the same transaction. */
export async function saveDraw(
	tx: GameTransaction,
	gameId: number,
	pairs: { giverId: number; receiverId: number }[],
) {
	await tx.insert(assignments).values(
		pairs.map(({ giverId, receiverId }) => ({
			gameId,
			giverParticipantId: giverId,
			receiverParticipantId: receiverId,
		})),
	);
	await tx
		.update(games)
		.set({ status: "drawn", updatedAt: new Date() })
		.where(eq(games.id, gameId));
}

/** Loads results that still need delivery. */
export function pendingAssignments() {
	return db.select().from(assignments).where(isNull(assignments.notifiedAt));
}

/** Marks a delivered result after Telegram accepted it. */
export function markNotified(assignmentId: number) {
	return db
		.update(assignments)
		.set({ notifiedAt: new Date() })
		.where(
			and(eq(assignments.id, assignmentId), isNull(assignments.notifiedAt)),
		);
}
