import { scenesDerives } from "@gramio/scenes";
import { Composer, InlineKeyboard } from "gramio";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { sceneStorage } from "../repository.ts";
import { cancelScene, editScene, gameScenes } from "../scenes/index.ts";
import { backKeyboard, errorText, gamesScreen } from "../screens.ts";
import { deleteGame, myGames, ownerGame } from "../service.ts";

/** Routes management updates to game operations and screens. */
export const managementHandlers = new Composer()
	.extend(scenesDerives(gameScenes, { storage: sceneStorage }))
	.callbackQuery(
		/^(settings|editname|editbudget|editdate|deleteconfirm|delete):(\d+)$/,
		async (ctx) => {
			await ctx.answer();
			if (!ctx.from || ctx.message?.chat.type !== "private") return;
			const user = await registerUser(ctx.from);
			try {
				const [, action, rawId] = ctx.queryData;
				const id = Number(rawId);
				if (!Number.isSafeInteger(id) || id <= 0)
					throw new GameError("Кнопка устарела.");
				const game = await ownerGame(id, user.id);
				if (action === "settings") {
					await cancelScene(ctx.from.id);
					return ctx.editText(`Настройки · ${game.name}`, {
						reply_markup: new InlineKeyboard()
							.text("Название", `editname:${id}`)
							.row()
							.text("Бюджет", `editbudget:${id}`)
							.row()
							.text("Дата обмена", `editdate:${id}`)
							.row()
							.text("◀ Назад", `game:${id}`),
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
							? "Введи дату ГГГГ-ММ-ДД."
							: "Введи новое значение сообщением.",
						{
							reply_markup: new InlineKeyboard().text("Отмена", `game:${id}`),
						},
					);
					return ctx.scene.enter(editScene, { gameId: id, field });
				}
				await cancelScene(ctx.from.id);
				if (action === "deleteconfirm")
					return ctx.editText(
						"Удалить игру? Все участники и результаты жеребьёвки будут удалены.",
						{
							reply_markup: new InlineKeyboard()
								.text("Отмена", `game:${id}`)
								.text("Удалить", `delete:${id}`),
						},
					);
				if (action === "delete") {
					await deleteGame(id, user.id);
					const screen = gamesScreen(await myGames(user.id), user.id);
					return ctx.editText(screen.text, {
						reply_markup: screen.reply_markup,
					});
				}
			} catch (error) {
				if (!(error instanceof GameError))
					console.error("Management failed", error);
				return ctx.editText(errorText(error), { reply_markup: backKeyboard() });
			}
		},
	);
