import { InlineKeyboard } from "gramio";
import { effectiveLocale, t } from "../../../i18n.ts";
import { registerUser } from "../../users/service.ts";
import { createScene, sceneHandlerComposer } from "../scenes/index.ts";

/** Starts the persisted game creation conversation. */
export const creationHandlers = sceneHandlerComposer().callbackQuery(
	"create",
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const locale = effectiveLocale((await registerUser(ctx.from)).locale);
		await ctx.editText(t(locale, "createNamePrompt"), {
			reply_markup: new InlineKeyboard().text(t(locale, "cancel"), "home"),
		});
		await ctx.scene.enter(createScene);
	},
);
