import { InlineKeyboard } from "gramio";
import { t } from "../../../i18n.ts";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import {
	cancelScene,
	sceneHandlerComposer,
	wishlistScene,
} from "../scenes/index.ts";
import {
	backKeyboard,
	errorText,
	gameScreen,
	gamesScreen,
} from "../screens.ts";
import {
	gameByInvite,
	gameDetails,
	joinGame,
	leavePrompt,
	myGames,
	ownerGame,
	removeMember,
	wishlistPrompt,
} from "../service.ts";

/** Routes participation updates to game operations and screens. */
export const participationHandlers = sceneHandlerComposer().callbackQuery(
	/^(join|wish|leaveconfirm|leave|remove):([A-Za-z0-9_-]+)(?::(\d+))?$/,
	async (ctx) => {
		await ctx.answer();
		if (!ctx.from || ctx.message?.chat.type !== "private") return;
		const user = await registerUser(ctx.from);
		const locale = user.locale;
		try {
			const [, action, arg, target] = ctx.queryData;
			if (action === "join" && arg) {
				await cancelScene(ctx.from.id);
				const game = await gameByInvite(arg);
				if (!game) throw new GameError("inviteInvalid");
				await joinGame(game.id, user.id);
				const screen = gameScreen(
					await gameDetails(game.id, user.id),
					user.id,
					locale,
				);
				return ctx.editText(`${t(locale, "joined")}\n\n${screen.text}`, {
					reply_markup: screen.reply_markup,
				});
			}
			const id = Number(arg);
			if (!Number.isSafeInteger(id) || id <= 0)
				throw new GameError("staleButton");
			const { member } = await gameDetails(id, user.id);
			if (action === "wish") {
				const wishlist = await wishlistPrompt(id, user.id);
				await ctx.editText(
					t(locale, "wishlistPrompt", wishlist ?? t(locale, "wishesEmpty")),
					{
						reply_markup: new InlineKeyboard().text(
							t(locale, "skip"),
							`game:${id}`,
						),
					},
				);
				return ctx.scene.enter(wishlistScene, { gameId: id });
			}
			await cancelScene(ctx.from.id);
			if (action === "leaveconfirm") {
				await leavePrompt(id, user.id);
				return ctx.editText(t(locale, "leaveConfirm"), {
					reply_markup: new InlineKeyboard()
						.text(t(locale, "cancel"), `game:${id}`)
						.text(t(locale, "leaveButton"), `leave:${id}`),
				});
			}
			if (action === "leave") {
				await removeMember(id, user.id, member.id);
				const screen = gamesScreen(await myGames(user.id), user.id, locale);
				return ctx.editText(screen.text, {
					reply_markup: screen.reply_markup,
				});
			}
			if (action === "remove") {
				await ownerGame(id, user.id);
				const memberId = Number(target);
				if (!Number.isSafeInteger(memberId) || memberId <= 0)
					throw new GameError("staleButton");
				await removeMember(id, user.id, memberId);
				const screen = gameScreen(
					await gameDetails(id, user.id),
					user.id,
					locale,
				);
				return ctx.editText(screen.text, {
					reply_markup: screen.reply_markup,
				});
			}
		} catch (error) {
			if (!(error instanceof GameError))
				console.error("Participation failed", error);
			return ctx.editText(errorText(error, locale), {
				reply_markup: backKeyboard(locale),
			});
		}
	},
);
