import { Composer, InlineKeyboard } from "gramio";
import { effectiveLocale, t } from "../../../i18n.ts";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { deliverPending } from "../notifications.ts";
import { cancelScene } from "../scenes/index.ts";
import { backKeyboard, errorText, gameScreen } from "../screens.ts";
import { drawGame, drawPreview, gameDetails } from "../service.ts";

/** Routes drawing updates to game operations and screens. */
export const drawingHandlers = new Composer().callbackQuery(
	/^(drawconfirm|draw):(\d+)$/,
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const user = await registerUser(ctx.from);
		const locale = effectiveLocale(user.locale);
		try {
			await cancelScene(ctx.from.id);
			const [, action, rawId] = ctx.queryData;
			const id = Number(rawId);
			if (!Number.isSafeInteger(id) || id <= 0)
				throw new GameError("staleButton");
			if (action === "drawconfirm") {
				const count = await drawPreview(id, user.id);
				return ctx.editText(t(locale, "drawConfirm", count), {
					reply_markup: new InlineKeyboard()
						.text(t(locale, "cancel"), `game:${id}`)
						.text(t(locale, "drawConfirmButton"), `draw:${id}`),
				});
			}
			await drawGame(id, user.id);
			await deliverPending(
				(telegramId, text) =>
					ctx.bot.api.sendMessage({ chat_id: telegramId, text }),
				{ gameId: id },
			);
			const screen = gameScreen(
				await gameDetails(id, user.id),
				user.id,
				locale,
			);
			return ctx.editText(screen.text, { reply_markup: screen.reply_markup });
		} catch (error) {
			if (!(error instanceof GameError)) console.error("Draw failed", error);
			return ctx.editText(errorText(error, locale), {
				reply_markup: backKeyboard(locale),
			});
		}
	},
);
