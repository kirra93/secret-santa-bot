import { Composer, InlineKeyboard } from "gramio";
import { registerUser } from "../../users/service.ts";
import { deliverPending } from "../notifications.ts";
import { cancelScene } from "../scenes/index.ts";
import { backKeyboard, homeScreen } from "../screens.ts";
import { gameByInvite } from "../service.ts";

/** Routes start updates to game operations and screens. */
export const startHandlers = new Composer().command("start", async (ctx) => {
	if (ctx.chat.type !== "private" || !ctx.from) return;
	await registerUser(ctx.from);
	await deliverPending(
		(telegramId, text) =>
			ctx.bot.api.sendMessage({ chat_id: telegramId, text }),
		{ telegramId: ctx.from.id },
	);
	await cancelScene(ctx.from.id);
	if (ctx.args?.startsWith("game_")) {
		const game = await gameByInvite(ctx.args.slice(5));
		if (game?.status !== "recruiting")
			return ctx.send("Приглашение не действует.", {
				reply_markup: backKeyboard(),
			});
		return ctx.send(
			`🎅 Тебя пригласили в Тайного Санту!\n\nИгра: ${game.name}\nБюджет: ${game.budget}`,
			{
				reply_markup: new InlineKeyboard()
					.text("Присоединиться", `join:${game.inviteCode}`)
					.row()
					.text("Отказаться", "home"),
			},
		);
	}
	const screen = homeScreen();
	return ctx.send(screen.text, { reply_markup: screen.reply_markup });
});
