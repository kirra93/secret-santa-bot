import {
	gameById,
	markNotified,
	members,
	pendingAssignments,
} from "./repository.ts";

/** Formats the private recipient message. */
export function giftText(
	game: NonNullable<Awaited<ReturnType<typeof gameById>>>,
	receiver: { firstName: string; wishlist: string | null },
) {
	return `🎅 Жеребьёвка завершена!\n\nТы Тайный Санта для: 🎁 ${receiver.firstName}\n\nПожелания: ${receiver.wishlist || "не указаны"}\nБюджет: ${game.budget}\nДата обмена: ${game.exchangeDate ?? "не указана"}`;
}

/** Sends unsent results and marks them afterwards; a crash between those steps may cause one duplicate. */
export async function deliverPending(
	send: (telegramId: number, text: string) => Promise<unknown>,
	filter: { gameId?: number; telegramId?: number } = {},
) {
	const pending = await pendingAssignments();
	const gameCache = new Map<number, Awaited<ReturnType<typeof members>>>();
	for (const assignment of pending) {
		if (filter.gameId !== undefined && assignment.gameId !== filter.gameId)
			continue;
		let roster = gameCache.get(assignment.gameId);
		if (!roster) {
			roster = await members(assignment.gameId);
			gameCache.set(assignment.gameId, roster);
		}
		const giver = roster.find(
			(person) => person.id === assignment.giverParticipantId,
		);
		if (
			!giver ||
			(filter.telegramId !== undefined &&
				giver.telegramId !== filter.telegramId)
		)
			continue;
		const receiver = roster.find(
			(person) => person.id === assignment.receiverParticipantId,
		);
		const game = await gameById(assignment.gameId);
		if (!receiver || !game) {
			console.error("Incomplete assignment", { assignmentId: assignment.id });
			continue;
		}
		try {
			await send(giver.telegramId, giftText(game, receiver));
			await markNotified(assignment.id);
		} catch (error) {
			console.error("Result delivery failed", {
				assignmentId: assignment.id,
				error,
			});
		}
	}
}
