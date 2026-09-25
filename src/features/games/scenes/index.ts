import { type EnterExit, Scene } from "@gramio/scenes";
import { type AnyBot, Composer, type Context, InlineKeyboard } from "gramio";
import {
	budgetPreset,
	type Locale,
	localeFromTelegram,
	t,
} from "../../../i18n.ts";
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

const budgetKeyboard = (locale: Locale) =>
	new InlineKeyboard()
		.text(t(locale, "budget1Button"), "budget:1")
		.row()
		.text(t(locale, "budget2Button"), "budget:2")
		.row()
		.text(t(locale, "budget3Button"), "budget:3")
		.row()
		.text(t(locale, "budgetCustomButton"), "budget:custom")
		.row()
		.text(t(locale, "budgetNoneButton"), "budget:none");
const dateKeyboard = (locale: Locale) =>
	new InlineKeyboard().text(t(locale, "skip"), "date:skip");
const localeOf = (from?: { languageCode?: string }) =>
	localeFromTelegram(from?.languageCode);

function input(
	value: string | undefined,
	max = 500,
	longCode?: "nameTooLong" | "budgetTooLong",
) {
	const text = value?.trim();
	if (!text || text.length > 500) throw new GameError("textLength");
	if (text.length > max) throw new GameError(longCode ?? "textLength");
	return text;
}

/** Collects game name, budget and date while PostgreSQL stores the scene step and answers. */
export const createScene = new Scene("game-create")
	.state<{ name?: string; budget?: string }>()
	.step("name", (c) =>
		c.on("message", async (ctx, next) => {
			if (ctx.chat.type !== "private" || !ctx.text || ctx.text.startsWith("/"))
				return next();
			const locale = localeOf(ctx.from);
			try {
				const name = input(ctx.text, 100, "nameTooLong");
				await ctx.send(t(locale, "createBudgetPrompt"), {
					reply_markup: budgetKeyboard(locale),
				});
				await ctx.scene.update({ name }, { step: "budget" });
			} catch (error) {
				await ctx.send(errorText(error, locale));
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
				const locale = localeOf(ctx.from);
				try {
					const budget = input(ctx.text, 100, "budgetTooLong");
					await ctx.send(t(locale, "createDatePrompt"), {
						reply_markup: dateKeyboard(locale),
					});
					await ctx.scene.update({ budget }, { step: "date" });
				} catch (error) {
					await ctx.send(errorText(error, locale));
				}
			})
			.callbackQuery(/^budget:(1|2|3|custom|none)$/, async (ctx) => {
				await ctx.answer();
				if (ctx.message?.chat.type !== "private") return;
				const locale = localeOf(ctx.from);
				const choice = ctx.queryData[1];
				if (choice === "custom")
					return ctx.editText(t(locale, "customBudgetPrompt"), {
						reply_markup: new InlineKeyboard().text(
							t(locale, "cancel"),
							"home",
						),
					});
				const budget =
					choice === "1" ||
					choice === "2" ||
					choice === "3" ||
					choice === "none"
						? budgetPreset(choice)
						: undefined;
				if (!budget) return ctx.editText(t(locale, "errors.staleButton"));
				await ctx.editText(t(locale, "createDateCallbackPrompt"), {
					reply_markup: dateKeyboard(locale),
				});
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
				const locale = localeOf(ctx.from);
				try {
					const date = exchangeDate(input(ctx.text));
					if (
						!ctx.from ||
						!(ctx.scene.state as { name: string; budget: string }).name ||
						!(ctx.scene.state as { name: string; budget: string }).budget
					)
						throw new GameError("creationRestart");
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
						locale,
					);
					await ctx.send(screen.text, { reply_markup: screen.reply_markup });
				} catch (error) {
					await ctx.send(errorText(error, locale));
				}
			})
			.callbackQuery("date:skip", async (ctx) => {
				await ctx.answer();
				const locale = localeOf(ctx.from);
				try {
					if (
						!ctx.from ||
						!(ctx.scene.state as { name: string; budget: string }).name ||
						!(ctx.scene.state as { name: string; budget: string }).budget
					)
						throw new GameError("creationRestart");
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
						locale,
					);
					await ctx.editText(screen.text, {
						reply_markup: screen.reply_markup,
					});
				} catch (error) {
					await ctx.editText(errorText(error, locale));
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
			const locale = localeOf(ctx.from);
			try {
				if (!ctx.from) return;
				const user = await registerUser(ctx.from);
				await setWishlist(ctx.scene.params.gameId, user.id, input(ctx.text));
				await ctx.scene.exit();
				const screen = gameScreen(
					await gameDetails(ctx.scene.params.gameId, user.id),
					user.id,
					locale,
				);
				await ctx.send(`${t(locale, "wishlistSaved")}\n\n${screen.text}`, {
					reply_markup: screen.reply_markup,
				});
			} catch (error) {
				await ctx.send(errorText(error, locale));
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
			const locale = localeOf(ctx.from);
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
				const screen = gameScreen(
					await gameDetails(gameId, user.id),
					user.id,
					locale,
				);
				await ctx.send(screen.text, { reply_markup: screen.reply_markup });
			} catch (error) {
				await ctx.send(errorText(error, locale));
			}
		}),
	);

/** Registers the persistent multi-step game flows. */
export const gameScenes = [createScene, wishlistScene, editScene];

/** Cancels any active scene when navigation changes the user's context. */
export function cancelScene(telegramId: number) {
	return sceneStorage.delete(`@gramio/scenes:${telegramId}`);
}

/** Types scene-start handlers; bot.ts installs scenesDerives once at runtime. */
export function sceneHandlerComposer() {
	return new Composer<
		Context<AnyBot>,
		Context<AnyBot> & { scene: EnterExit }
	>();
}
