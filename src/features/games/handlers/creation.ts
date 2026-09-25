import { InlineKeyboard } from "gramio";
import { createScene, sceneHandlerComposer } from "../scenes/index.ts";

/** Starts the persisted game creation conversation. */
export const creationHandlers = sceneHandlerComposer().callbackQuery(
	"create",
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		await ctx.editText("Как назовём игру? Напиши название сообщением.", {
			reply_markup: new InlineKeyboard().text("Отмена", "home"),
		});
		await ctx.scene.enter(createScene);
	},
);
