import { Composer, InlineKeyboard } from "gramio";
import { effectiveLocale, t } from "../../../i18n.ts";
import { registerUser, setUserLocale } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { giftText } from "../notifications.ts";
import { cancelScene } from "../scenes/index.ts";
import {
	backKeyboard,
	errorText,
	gameScreen,
	gamesScreen,
	homeScreen,
	languageScreen,
} from "../screens.ts";
import { gameDetails, members, myAssignment, myGames } from "../service.ts";

/** Routes browse updates to game operations and screens. */
export const browseHandlers = new Composer().callbackQuery(
	/^(home|games|help|language|lang|game|invite|members|assignment)(?::(ru|en|\d+))?$/,
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const user = await registerUser(ctx.from);
		let locale = effectiveLocale(user.locale);
		try {
			await cancelScene(ctx.from.id);
			const [, action, rawId] = ctx.queryData;
			if (action === "home") {
				const screen = homeScreen(locale);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "lang" && (rawId === "ru" || rawId === "en")) {
				locale = (await setUserLocale(user.id, rawId)).locale ?? "ru";
				const screen = languageScreen(locale);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "language") {
				const screen = languageScreen(locale);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "games") {
				const screen = gamesScreen(await myGames(user.id), user.id, locale);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "help")
				return ctx.editText(t(locale, "help"), {
					reply_markup: backKeyboard(locale),
				});
			const id = Number(rawId);
			if (!Number.isSafeInteger(id) || id <= 0)
				throw new GameError("staleButton");
			const { game } = await gameDetails(id, user.id);
			if (action === "game") {
				const screen = gameScreen(
					await gameDetails(id, user.id),
					user.id,
					locale,
				);
				return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
			}
			if (action === "invite") {
				const me = await ctx.bot.api.getMe();
				const url = `https://t.me/${me.username}?start=game_${game.inviteCode}`;
				return ctx.editText(t(locale, "inviteShare", game.name, url), {
					reply_markup: new InlineKeyboard()
						.url(
							t(locale, "shareLinkButton"),
							`https://t.me/share/url?url=${encodeURIComponent(url)}`,
						)
						.row()
						.text(t(locale, "back"), `game:${id}`),
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
							.text(
								t(locale, "removeMemberButton", person.firstName),
								`remove:${id}:${person.id}`,
							)
							.row();
				}
				keyboard.text(t(locale, "back"), `game:${id}`);
				return ctx.editText(
					t(
						locale,
						"membersList",
						roster.length,
						roster.map((person) => `✅ ${person.firstName}`).join("\n"),
					),
					{ reply_markup: keyboard },
				);
			}
			if (action === "assignment") {
				const receiver = await myAssignment(id, user.id);
				return ctx.editText(giftText(game, receiver, locale), {
					reply_markup: new InlineKeyboard().text(
						t(locale, "back"),
						`game:${id}`,
					),
				});
			}
		} catch (error) {
			if (!(error instanceof GameError)) console.error("Browse failed", error);
			return ctx.editText(errorText(error, locale), {
				reply_markup: backKeyboard(locale),
			});
		}
	},
);
