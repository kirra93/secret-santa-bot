import { InlineKeyboard } from "gramio";
import { t } from "../../../i18n.ts";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import {
	cancelScene,
	editScene,
	sceneHandlerComposer,
} from "../scenes/index.ts";
import { backKeyboard, errorText, gamesScreen } from "../screens.ts";
import { deleteGame, myGames, ownerGame } from "../service.ts";

/** Routes management updates to game operations and screens. */
export const managementHandlers = sceneHandlerComposer().callbackQuery(
	/^(settings|editname|editbudget|editdate|deleteconfirm|delete):(\d+)$/,
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const user = await registerUser(ctx.from);
		const locale = user.locale;
		try {
			const [, action, rawId] = ctx.queryData;
			const id = Number(rawId);
			if (!Number.isSafeInteger(id) || id <= 0)
				throw new GameError("staleButton");
			const game = await ownerGame(id, user.id);
			if (action === "settings") {
				await cancelScene(ctx.from.id);
				return ctx.editText(t(locale, "settingsTitle", game.name), {
					reply_markup: new InlineKeyboard()
						.text(t(locale, "nameButton"), `editname:${id}`)
						.row()
						.text(t(locale, "budgetButton"), `editbudget:${id}`)
						.row()
						.text(t(locale, "dateButton"), `editdate:${id}`)
						.row()
						.text(t(locale, "back"), `game:${id}`),
				});
			}
			if (
				action === "editname" ||
				action === "editbudget" ||
				action === "editdate"
			) {
				await ownerGame(id, user.id, true);
				const field =
					action === "editname"
						? "name"
						: action === "editbudget"
							? "budget"
							: "exchangeDate";
				await ctx.editText(
					action === "editdate"
						? t(locale, "editDatePrompt")
						: t(locale, "editValuePrompt"),
					{
						reply_markup: new InlineKeyboard().text(
							t(locale, "cancel"),
							`game:${id}`,
						),
					},
				);
				return ctx.scene.enter(editScene, { gameId: id, field });
			}
			await cancelScene(ctx.from.id);
			if (action === "deleteconfirm")
				return ctx.editText(t(locale, "deleteConfirm"), {
					reply_markup: new InlineKeyboard()
						.text(t(locale, "cancel"), `game:${id}`)
						.text(t(locale, "delete"), `delete:${id}`),
				});
			if (action === "delete") {
				await deleteGame(id, user.id);
				const screen = gamesScreen(await myGames(user.id), user.id, locale);
				return ctx.editText(screen.text, {
					reply_markup: screen.reply_markup,
				});
			}
		} catch (error) {
			if (!(error instanceof GameError))
				console.error("Management failed", error);
			return ctx.editText(errorText(error, locale), {
				reply_markup: backKeyboard(locale),
			});
		}
	},
);
