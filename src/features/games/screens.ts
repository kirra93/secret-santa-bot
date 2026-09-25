import { InlineKeyboard } from "gramio";
import { GameError } from "./errors.ts";
import type { gameDetails, myGames } from "./service.ts";

/** Builds the private-chat home menu. */
export const homeScreen = () => ({
	text: "🎅 Тайный Санта\n\nСоздай игру или присоединись по приглашению.",
	reply_markup: new InlineKeyboard()
		.text("Создать игру", "create")
		.row()
		.text("Мои игры", "games")
		.row()
		.text("Помощь", "help"),
});
/** Builds common navigation buttons. */
export const backKeyboard = () =>
	new InlineKeyboard().text("◀ Назад", "games").text("🏠 Главная", "home");
const dateText = (value: string | null) => value ?? "не указана";
/** Converts a game error to safe user-facing text. */
export const errorText = (error: unknown) =>
	error instanceof GameError
		? error.message
		: "Что-то пошло не так. Попробуй ещё раз.";

/** Renders a game card from data already authorized and loaded by the service. */
export function gameScreen(
	{ game, count }: Awaited<ReturnType<typeof gameDetails>>,
	userId: number,
) {
	const gameId = game.id;
	const owner = game.ownerId === userId;
	const keyboard = new InlineKeyboard()
		.text("Участники", `members:${gameId}`)
		.row();
	if (game.status === "recruiting") {
		keyboard.text("Пожелания", `wish:${gameId}`).row();
		if (owner)
			keyboard
				.text("Пригласить", `invite:${gameId}`)
				.row()
				.text("Настройки", `settings:${gameId}`)
				.row()
				.text("🎲 Провести жеребьёвку", `drawconfirm:${gameId}`)
				.row();
		else keyboard.text("Покинуть игру", `leaveconfirm:${gameId}`).row();
	} else keyboard.text("Кому я дарю 🎁", `assignment:${gameId}`).row();
	if (owner) keyboard.text("Удалить игру", `deleteconfirm:${gameId}`).row();
	keyboard.text("◀ Мои игры", "games").text("🏠 Главная", "home");
	return {
		text: `🎄 ${game.name}\n\n👥 Участников: ${count}\n💰 Бюджет: ${game.budget}\n📅 Обмен: ${dateText(game.exchangeDate)}\n🎲 Жеребьёвка: ${game.status === "drawn" ? "проведена" : "ещё не проведена"}`,
		reply_markup: keyboard,
	};
}

/** Renders the owner and participant lists from preloaded games. */
export function gamesScreen(
	rows: Awaited<ReturnType<typeof myGames>>,
	userId: number,
) {
	const keyboard = new InlineKeyboard();
	const owned = rows.filter(({ game }) => game.ownerId === userId);
	const joined = rows.filter(({ game }) => game.ownerId !== userId);
	for (const { game } of owned)
		keyboard.text(`🎄 ${game.name}`, `game:${game.id}`).row();
	for (const { game } of joined)
		keyboard.text(`🎁 ${game.name}`, `game:${game.id}`).row();
	keyboard.text("🏠 Главная", "home");
	return {
		text: `Мои игры\n\nОрганизую: ${owned.length}\nУчаствую: ${joined.length}`,
		reply_markup: keyboard,
	};
}
