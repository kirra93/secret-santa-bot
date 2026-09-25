import { InlineKeyboard } from "gramio";
import { localeFromTelegram, t } from "../../../i18n.ts";
import { createScene, sceneHandlerComposer } from "../scenes/index.ts";

/** Starts the persisted game creation conversation. */
export const creationHandlers = sceneHandlerComposer().callbackQuery(
	"create",
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const locale = localeFromTelegram(ctx.from.languageCode);
		await ctx.editText(t(locale, "createNamePrompt"), {
			reply_markup: new InlineKeyboard().text(t(locale, "cancel"), "home"),
		});
		await ctx.scene.enter(createScene);
	},
);
