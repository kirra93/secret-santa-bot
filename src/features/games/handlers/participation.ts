import { scenesDerives } from "@gramio/scenes";
import { Composer, InlineKeyboard } from "gramio";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { sceneStorage } from "../repository.ts";
import { cancelScene, gameScenes, wishlistScene } from "../scenes/index.ts";
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
export const participationHandlers = new Composer()
	.extend(scenesDerives(gameScenes, { storage: sceneStorage }))
	.callbackQuery(
		/^(join|wish|leaveconfirm|leave|remove):([A-Za-z0-9_-]+)(?::(\d+))?$/,
		async (ctx) => {
			await ctx.answer();
			if (!ctx.from || ctx.message?.chat.type !== "private") return;
			const user = await registerUser(ctx.from);
			try {
				const [, action, arg, target] = ctx.queryData;
				if (action === "join" && arg) {
					await cancelScene(ctx.from.id);
					const game = await gameByInvite(arg);
					if (!game) throw new GameError("Приглашение не действует.");
					await joinGame(game.id, user.id);
					const screen = gameScreen(
						await gameDetails(game.id, user.id),
						user.id,
					);
					return ctx.editText(`Ты участвуешь в игре!\n\n${screen.text}`, {
						reply_markup: screen.reply_markup,
					});
				}
				const id = Number(arg);
				if (!Number.isSafeInteger(id) || id <= 0)
					throw new GameError("Кнопка устарела.");
				const { member } = await gameDetails(id, user.id);
				if (action === "wish") {
					const wishlist = await wishlistPrompt(id, user.id);
					await ctx.editText(
						`Твои пожелания: ${wishlist ?? "пока не указаны"}\n\nНапиши новые пожелания сообщением.`,
						{
							reply_markup: new InlineKeyboard().text(
								"Пропустить",
								`game:${id}`,
							),
						},
					);
					return ctx.scene.enter(wishlistScene, { gameId: id });
				}
				await cancelScene(ctx.from.id);
				if (action === "leaveconfirm") {
					await leavePrompt(id, user.id);
					return ctx.editText("Покинуть игру?", {
						reply_markup: new InlineKeyboard()
							.text("Отмена", `game:${id}`)
							.text("Покинуть", `leave:${id}`),
					});
				}
				if (action === "leave") {
					await removeMember(id, user.id, member.id);
					const screen = gamesScreen(await myGames(user.id), user.id);
					return ctx.editText(screen.text, {
						reply_markup: screen.reply_markup,
					});
				}
				if (action === "remove") {
					await ownerGame(id, user.id);
					const memberId = Number(target);
					if (!Number.isSafeInteger(memberId) || memberId <= 0)
						throw new GameError("Кнопка устарела.");
					await removeMember(id, user.id, memberId);
					const screen = gameScreen(await gameDetails(id, user.id), user.id);
					return ctx.editText(screen.text, {
						reply_markup: screen.reply_markup,
					});
				}
			} catch (error) {
				if (!(error instanceof GameError))
					console.error("Participation failed", error);
				return ctx.editText(errorText(error), { reply_markup: backKeyboard() });
			}
		},
	);
