import { Scene } from "@gramio/scenes";
import { InlineKeyboard } from "gramio";
import { registerUser } from "../../users/service.ts";
import { GameError } from "../errors.ts";
import { sceneStorage } from "../repository.ts";
import { errorText, gameScreen } from "../screens.ts";
import {
	createGame,
	exchangeDate,
	gameDetails,
	setWishlist,
	updateGame,
} from "../service.ts";

const budgetKeyboard = () =>
	new InlineKeyboard()
		.text("До 1000 ₽", "budget:1")
		.row()
		.text("1000–2000 ₽", "budget:2")
		.row()
		.text("2000–5000 ₽", "budget:3")
		.row()
		.text("Указать свой", "budget:custom")
		.row()
		.text("Без ограничения", "budget:none");
const dateKeyboard = () => new InlineKeyboard().text("Пропустить", "date:skip");
const choices: Record<string, string> = {
	"1": "до 1000 ₽",
	"2": "1000–2000 ₽",
	"3": "2000–5000 ₽",
	none: "без ограничения",
};

function input(value: string | undefined, max = 500, longMessage?: string) {
	const text = value?.trim();
	if (!text || text.length > 500)
		throw new GameError("Введите текст длиной от 1 до 500 символов.");
	if (text.length > max)
		throw new GameError(
			longMessage ?? "Введите текст длиной от 1 до 500 символов.",
		);
	return text;
}

/** Collects game name, budget and date while PostgreSQL stores the scene step and answers. */
export const createScene = new Scene("game-create")
	.state<{ name?: string; budget?: string }>()
	.step("name", (c) =>
		c.on("message", async (ctx, next) => {
			if (ctx.chat.type !== "private" || !ctx.text || ctx.text.startsWith("/"))
				return next();
			try {
				const name = input(
					ctx.text,
					100,
					"Название должно быть не длиннее 100 символов.",
				);
				await ctx.send("Какой бюджет подарка?", {
					reply_markup: budgetKeyboard(),
				});
				await ctx.scene.update({ name }, { step: "budget" });
			} catch (error) {
				await ctx.send(errorText(error));
			}
		}),
	)
	.step("budget", (c) =>
		c
			.on("message", async (ctx, next) => {
				if (
					ctx.chat.type !== "private" ||
					!ctx.text ||
					ctx.text.startsWith("/")
				)
					return next();
				try {
					const budget = input(
						ctx.text,
						100,
						"Бюджет должен быть не длиннее 100 символов.",
					);
					await ctx.send(
						"Когда будете обмениваться подарками? Введи дату ГГГГ-ММ-ДД или нажми «Пропустить».",
						{ reply_markup: dateKeyboard() },
					);
					await ctx.scene.update({ budget }, { step: "date" });
				} catch (error) {
					await ctx.send(errorText(error));
				}
			})
			.callbackQuery(/^budget:(1|2|3|custom|none)$/, async (ctx) => {
				await ctx.answer();
				if (ctx.message?.chat.type !== "private") return;
				const choice = ctx.queryData[1];
				if (choice === "custom")
					return ctx.editText("Укажи бюджет сообщением.", {
						reply_markup: new InlineKeyboard().text("Отмена", "home"),
					});
				const budget = choice ? choices[choice] : undefined;
				if (!budget) return ctx.editText("Кнопка устарела.");
				await ctx.editText(
					"Когда будете обмениваться подарками? Введи дату ГГГГ-ММ-ДД или пропусти.",
					{ reply_markup: dateKeyboard() },
				);
				await ctx.scene.update({ budget }, { step: "date" });
			}),
	)
	.step("date", (c) =>
		c
			.on("message", async (ctx, next) => {
				if (
					ctx.chat.type !== "private" ||
					!ctx.text ||
					ctx.text.startsWith("/")
				)
					return next();
				try {
					const date = exchangeDate(input(ctx.text));
					if (
						!ctx.from ||
						!(ctx.scene.state as { name: string; budget: string }).name ||
						!(ctx.scene.state as { name: string; budget: string }).budget
					)
						throw new GameError("Начни создание игры заново.");
					const user = await registerUser(ctx.from);
					const game = await createGame(
						user.id,
						(ctx.scene.state as { name: string; budget: string }).name,
						(ctx.scene.state as { name: string; budget: string }).budget,
						date,
						ctx.from.id,
					);
					await ctx.scene.exit();
					const screen = gameScreen(
						await gameDetails(game.id, user.id),
						user.id,
					);
					await ctx.send(screen.text, { reply_markup: screen.reply_markup });
				} catch (error) {
					await ctx.send(errorText(error));
				}
			})
			.callbackQuery("date:skip", async (ctx) => {
				await ctx.answer();
				try {
					if (
						!ctx.from ||
						!(ctx.scene.state as { name: string; budget: string }).name ||
						!(ctx.scene.state as { name: string; budget: string }).budget
					)
						throw new GameError("Начни создание игры заново.");
					const user = await registerUser(ctx.from);
					const game = await createGame(
						user.id,
						(ctx.scene.state as { name: string; budget: string }).name,
						(ctx.scene.state as { name: string; budget: string }).budget,
						null,
						ctx.from.id,
					);
					await ctx.scene.exit();
					const screen = gameScreen(
						await gameDetails(game.id, user.id),
						user.id,
					);
					await ctx.editText(screen.text, {
						reply_markup: screen.reply_markup,
					});
				} catch (error) {
					await ctx.editText(errorText(error));
				}
			}),
	);

/** Collects a member's new wishlist without retaining a second draft. */
export const wishlistScene = new Scene("game-wishlist")
	.params<{ gameId: number }>()
	.step("input", (c) =>
		c.on("message", async (ctx, next) => {
			if (ctx.chat.type !== "private" || !ctx.text || ctx.text.startsWith("/"))
				return next();
			try {
				if (!ctx.from) return;
				const user = await registerUser(ctx.from);
				await setWishlist(ctx.scene.params.gameId, user.id, input(ctx.text));
				await ctx.scene.exit();
				const screen = gameScreen(
					await gameDetails(ctx.scene.params.gameId, user.id),
					user.id,
				);
				await ctx.send(`Пожелания сохранены.\n\n${screen.text}`, {
					reply_markup: screen.reply_markup,
				});
			} catch (error) {
				await ctx.send(errorText(error));
			}
		}),
	);

/** Collects one edit value; service rechecks ownership and game status on save. */
export const editScene = new Scene("game-edit")
	.params<{ gameId: number; field: "name" | "budget" | "exchangeDate" }>()
	.step("input", (c) =>
		c.on("message", async (ctx, next) => {
			if (ctx.chat.type !== "private" || !ctx.text || ctx.text.startsWith("/"))
				return next();
			try {
				if (!ctx.from) return;
				const user = await registerUser(ctx.from);
				const { gameId, field } = ctx.scene.params;
				const value = input(ctx.text);
				await updateGame(gameId, user.id, {
					[field]:
						field === "exchangeDate"
							? exchangeDate(value)
							: value.slice(0, 100),
				});
				await ctx.scene.exit();
				const screen = gameScreen(await gameDetails(gameId, user.id), user.id);
				await ctx.send(screen.text, { reply_markup: screen.reply_markup });
			} catch (error) {
				await ctx.send(errorText(error));
			}
		}),
	);

/** Registers the persistent multi-step game flows. */
export const gameScenes = [createScene, wishlistScene, editScene];

/** Cancels any active scene when navigation changes the user's context. */
export function cancelScene(telegramId: number) {
	return sceneStorage.delete(`@gramio/scenes:${telegramId}`);
}
