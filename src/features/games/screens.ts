import { InlineKeyboard } from "gramio";
import { budgetText, gameErrorText, type Locale, t } from "../../i18n.ts";
import { GameError } from "./errors.ts";
import type { gameDetails, myGames } from "./service.ts";

/** Builds the private-chat home menu in the user's language. */
export const homeScreen = (locale: Locale) => ({
	text: t(locale, "home"),
	reply_markup: new InlineKeyboard()
		.text(t(locale, "createGame"), "create")
		.row()
		.text(t(locale, "myGames"), "games")
		.row()
		.text(t(locale, "helpButton"), "help"),
});

/** Builds common navigation buttons. */
export const backKeyboard = (locale: Locale) =>
	new InlineKeyboard()
		.text(t(locale, "back"), "games")
		.text(t(locale, "homeButton"), "home");

/** Converts a game error to safe user-facing text. */
export const errorText = (error: unknown, locale: Locale) =>
	error instanceof GameError
		? gameErrorText(locale, error.code)
		: t(locale, "unknownError");

/** Renders a game card from data already authorized and loaded by the service. */
export function gameScreen(
	{ game, count }: Awaited<ReturnType<typeof gameDetails>>,
	userId: number,
	locale: Locale,
) {
	const gameId = game.id;
	const owner = game.ownerId === userId;
	const keyboard = new InlineKeyboard()
		.text(t(locale, "gameMembers"), `members:${gameId}`)
		.row();
	if (game.status === "recruiting") {
		keyboard.text(t(locale, "wishlistButton"), `wish:${gameId}`).row();
		if (owner)
			keyboard
				.text(t(locale, "inviteButton"), `invite:${gameId}`)
				.row()
				.text(t(locale, "settingsButton"), `settings:${gameId}`)
				.row()
				.text(t(locale, "drawButton"), `drawconfirm:${gameId}`)
				.row();
		else
			keyboard.text(t(locale, "leaveButton"), `leaveconfirm:${gameId}`).row();
	} else
		keyboard.text(t(locale, "assignmentButton"), `assignment:${gameId}`).row();
	if (owner)
		keyboard
			.text(t(locale, "deleteGameButton"), `deleteconfirm:${gameId}`)
			.row();
	keyboard
		.text(t(locale, "backToGames"), "games")
		.text(t(locale, "homeButton"), "home");
	return {
		text: t(
			locale,
			"gameCard",
			game.name,
			count,
			budgetText(locale, game.budget),
			game.exchangeDate ?? t(locale, "notSpecified"),
			game.status === "drawn",
		),
		reply_markup: keyboard,
	};
}

/** Renders the owner and participant lists from preloaded games. */
export function gamesScreen(
	rows: Awaited<ReturnType<typeof myGames>>,
	userId: number,
	locale: Locale,
) {
	const keyboard = new InlineKeyboard();
	const owned = rows.filter(({ game }) => game.ownerId === userId);
	const joined = rows.filter(({ game }) => game.ownerId !== userId);
	for (const { game } of owned)
		keyboard.text(`🎄 ${game.name}`, `game:${game.id}`).row();
	for (const { game } of joined)
		keyboard.text(`🎁 ${game.name}`, `game:${game.id}`).row();
	keyboard.text(t(locale, "homeButton"), "home");
	return {
		text: t(locale, "gamesList", owned.length, joined.length),
		reply_markup: keyboard,
	};
}
