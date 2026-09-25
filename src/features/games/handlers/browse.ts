import { Composer, InlineKeyboard } from "gramio";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { giftText } from "../notifications.ts";
import { cancelScene } from "../scenes/index.ts";
import {
	backKeyboard,
	errorText,
	gameScreen,
	gamesScreen,
	homeScreen,
} from "../screens.ts";
import { gameDetails, members, myAssignment, myGames } from "../service.ts";

/** Routes browse updates to game operations and screens. */
export const browseHandlers = new Composer().callbackQuery(
	/^(home|games|help|game|invite|members|assignment)(?::(\d+))?$/,
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const user = await registerUser(ctx.from);
		try {
			await cancelScene(ctx.from.id);
			const [, action, rawId] = ctx.queryData;
			if (action === "home") {
				const screen = homeScreen();
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "games") {
				const screen = gamesScreen(await myGames(user.id), user.id);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "help")
				return ctx.editText(
					"Создай игру, отправь друзьям приглашение и после вступления минимум трёх игроков проведи жеребьёвку. Результат виден только тебе.",
					{ reply_markup: backKeyboard() },
				);
			const id = Number(rawId);
			if (!Number.isSafeInteger(id) || id <= 0)
				throw new GameError("Кнопка устарела.");
			const { game } = await gameDetails(id, user.id);
			if (action === "game") {
				const screen = gameScreen(await gameDetails(id, user.id), user.id);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "invite") {
				const me = await ctx.bot.api.getMe();
				const url = `https://t.me/${me.username}?start=game_${game.inviteCode}`;
				return ctx.editText(`Пригласи друзей в «${game.name}»:\n${url}`, {
					reply_markup: new InlineKeyboard()
						.url(
							"Поделиться ссылкой",
							`https://t.me/share/url?url=${encodeURIComponent(url)}`,
						)
						.row()
						.text("◀ Назад", `game:${id}`),
				});
			}
			if (action === "members") {
				const roster = await members(id);
				const keyboard = new InlineKeyboard();
				for (const person of roster) {
					if (
						game.ownerId === user.id &&
						game.status === "recruiting" &&
						person.userId !== user.id
					)
						keyboard
							.text(`Удалить ${person.firstName}`, `remove:${id}:${person.id}`)
							.row();
				}
				keyboard.text("◀ Назад", `game:${id}`);
				return ctx.editText(
					`Участники: ${roster.length}\n\n${roster.map((person) => `✅ ${person.firstName}`).join("\n")}`,
					{ reply_markup: keyboard },
				);
			}
			if (action === "assignment") {
				const receiver = await myAssignment(id, user.id);
				return ctx.editText(giftText(game, receiver), {
					reply_markup: new InlineKeyboard().text("◀ Назад", `game:${id}`),
				});
			}
		} catch (error) {
			if (!(error instanceof GameError)) console.error("Browse failed", error);
			return ctx.editText(errorText(error), { reply_markup: backKeyboard() });
		}
	},
);
