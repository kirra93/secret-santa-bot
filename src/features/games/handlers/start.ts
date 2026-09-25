import { Composer, InlineKeyboard } from "gramio";
import { budgetText, t } from "../../../i18n.ts";
import { registerUser } from "../../users/service.ts";
import { deliverPending } from "../notifications.ts";
import { cancelScene } from "../scenes/index.ts";
import { backKeyboard, homeScreen } from "../screens.ts";
import { gameByInvite } from "../service.ts";

/** Routes start updates to game operations and screens. */
export const startHandlers = new Composer().command("start", async (ctx) => {
	if (ctx.chat.type !== "private" || !ctx.from) return;
	const user = await registerUser(ctx.from);
	const locale = user.locale;
	await deliverPending(
		(telegramId, text) =>
			ctx.bot.api.sendMessage({ chat_id: telegramId, text }),
		{ telegramId: ctx.from.id },
	);
	await cancelScene(ctx.from.id);
	if (ctx.args?.startsWith("game_")) {
		const game = await gameByInvite(ctx.args.slice(5));
		if (game?.status !== "recruiting")
			return ctx.send(t(locale, "inviteInvalid"), {
				reply_markup: backKeyboard(locale),
			});
		return ctx.send(
			t(locale, "inviteIntro", game.name, budgetText(locale, game.budget)),
			{
				reply_markup: new InlineKeyboard()
					.text(t(locale, "joinButton"), `join:${game.inviteCode}`)
					.row()
					.text(t(locale, "declineButton"), "home"),
			},
		);
	}
	const screen = homeScreen(locale);
	return ctx.send(screen.text, { reply_markup: screen.reply_markup });
});
