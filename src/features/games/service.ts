import { randomBytes, randomInt } from "node:crypto";
import { drawPairs } from "./drawing.ts";
import { GameError } from "./errors.ts";
import * as repository from "./repository.ts";

/** Loads a game for a requested card or action. */
export const gameById = repository.gameById;
/** Resolves a public invitation code. */
export const gameByInvite = repository.gameByInvite;
/** Lists participants for a game screen. */
export const members = repository.members;
/** Finds the caller’s participant row. */
export const membership = repository.membership;
/** Lists games for the caller’s menu. */
export const myGames = repository.myGames;

/** Returns a game card only to its participants. */
export async function gameDetails(gameId: number, userId: number) {
	const game = await repository.gameById(gameId);
	if (!game) throw new GameError("Игра не найдена.");
	const member = await repository.membership(gameId, userId);
	if (!member) throw new GameError("Нет доступа.");
	return { game, member, count: (await repository.members(gameId)).length };
}

/** Authorizes organizer actions and optionally requires an editable game. */
export async function ownerGame(
	gameId: number,
	userId: number,
	editable = false,
) {
	const { game } = await gameDetails(gameId, userId);
	if (game.ownerId !== userId) throw new GameError("Нет доступа.");
	if (editable && game.status !== "recruiting")
		throw new GameError("Настройки уже нельзя менять.");
	return game;
}

/** Returns the current wishes only while the participant may edit them. */
export async function wishlistPrompt(gameId: number, userId: number) {
	const { game, member } = await gameDetails(gameId, userId);
	if (game.status !== "recruiting")
		throw new GameError("Жеребьёвка уже проведена.");
	return member.wishlist;
}

/** Authorizes a participant's leave confirmation. */
export async function leavePrompt(gameId: number, userId: number) {
	const { game } = await gameDetails(gameId, userId);
	if (game.ownerId === userId || game.status !== "recruiting")
		throw new GameError("Из этой игры уже нельзя выйти.");
}

/** Supplies the draw confirmation count after organizer and status checks. */
export async function drawPreview(gameId: number, ownerId: number) {
	const game = await ownerGame(gameId, ownerId);
	if (game.status !== "recruiting")
		throw new GameError("Жеребьёвка уже проведена.");
	return (await repository.members(gameId)).length;
}

/** Resolves only the caller's own recipient. */
export async function myAssignment(gameId: number, userId: number) {
	const giver = await repository.membership(gameId, userId);
	if (!giver) throw new GameError("Нет доступа.");
	const receiver = await repository.assignmentFor(gameId, giver.id);
	if (!receiver) throw new GameError("Жеребьёвка ещё не проведена.");
	return receiver;
}

/** Validates and creates a game with its organizer as the first participant. */
export function createGame(
	ownerId: number,
	name: string,
	budget: string,
	exchangeDate: string | null,
	ownerTelegramId?: number,
) {
	if (!name || name.length > 100)
		throw new GameError("Название должно быть не длиннее 100 символов.");
	if (!budget || budget.length > 100)
		throw new GameError("Бюджет должен быть не длиннее 100 символов.");
	return repository.insertGame(
		ownerId,
		name,
		budget,
		exchangeDate,
		randomBytes(12).toString("base64url"),
		ownerTelegramId,
	);
}

/** Changes game settings only while the caller owns a recruiting game. */
export function updateGame(
	gameId: number,
	ownerId: number,
	change: repository.GameChange,
) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (!game || game.ownerId !== ownerId) throw new GameError("Нет доступа.");
		if (game.status !== "recruiting")
			throw new GameError("Настройки уже нельзя менять.");
		return repository.updateLockedGame(tx, gameId, change);
	});
}

/** Deletes a game only for its organizer under the game lock. */
export function deleteGame(gameId: number, ownerId: number) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (!game || game.ownerId !== ownerId) throw new GameError("Нет доступа.");
		await repository.deleteLockedGame(tx, gameId);
	});
}

/** Serializes joining against the game draw. */
export function joinGame(gameId: number, userId: number) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (!game) throw new GameError("Игра не найдена.");
		if (game.status !== "recruiting")
			throw new GameError("Эта игра уже началась.");
		if (await repository.lockedMember(tx, gameId, userId))
			throw new GameError("Ты уже участвуешь в этой игре.");
		await repository.insertMember(tx, gameId, userId);
	});
}

/** Changes wishes only while recruiting and under the same game lock as drawing. */
export function setWishlist(gameId: number, userId: number, wishlist: string) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (game?.status !== "recruiting")
			throw new GameError("Пожелания можно менять только до жеребьёвки.");
		if (!(await repository.updateWishlist(tx, gameId, userId, wishlist)))
			throw new GameError("Ты не участвуешь в игре.");
	});
}

/** Allows owner removal or self-exit before drawing, while keeping the organizer in the game. */
export function removeMember(
	gameId: number,
	actorId: number,
	memberId: number,
) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (game?.status !== "recruiting")
			throw new GameError("Состав игры уже нельзя менять.");
		const target = await repository.lockedMemberById(tx, gameId, memberId);
		if (!target) throw new GameError("Участник не найден.");
		if (target.userId === game.ownerId)
			throw new GameError("Организатор не может выйти из игры.");
		if (actorId !== game.ownerId && actorId !== target.userId)
			throw new GameError("Нет доступа.");
		await repository.deleteMember(tx, memberId);
	});
}

/** Locks, validates, draws and saves assignments in one database transaction. */
export function drawGame(gameId: number, ownerId: number) {
	return repository.withGameLock(gameId, async (tx, game) => {
		if (!game || game.ownerId !== ownerId) throw new GameError("Нет доступа.");
		if (game.status !== "recruiting")
			throw new GameError("Жеребьёвка уже проведена.");
		const roster = await repository.drawRoster(tx, gameId);
		if (roster.length < 3)
			throw new GameError("Для жеребьёвки нужно минимум 3 участника.");
		const pairs = drawPairs(roster, randomInt);
		await repository.saveDraw(
			tx,
			gameId,
			pairs.map(({ giver, receiver }) => ({
				giverId: giver.id,
				receiverId: receiver.id,
			})),
		);
		return { game, pairs };
	});
}

/** Parses a real calendar date in the bot's YYYY-MM-DD input format. */
export function exchangeDate(value: string) {
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
		Number.isNaN(Date.parse(value)) ||
		new Date(value).toISOString().slice(0, 10) !== value
	)
		throw new GameError("Введите дату в формате ГГГГ-ММ-ДД.");
	return value;
}
