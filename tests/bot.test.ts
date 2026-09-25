import "./setup.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { TelegramTestEnvironment } from "@gramio/test";
import { and, eq, isNull } from "drizzle-orm";
import { bot } from "../src/bot.ts";
import { db, sql } from "../src/db/index.ts";
import {
	assignments,
	games,
	participants,
	sceneStates,
	users,
} from "../src/db/schema.ts";
import { deliverPending } from "../src/features/games/notifications.ts";
import {
	drawGame,
	gameByInvite,
	joinGame,
	myAssignment,
	removeMember,
	setWishlist,
	updateGame,
} from "../src/features/games/service.ts";
import { registerUser } from "../src/features/users/service.ts";

test("A creates a game, B and C join, and the draw remains private", async () => {
	const env = new TelegramTestEnvironment(bot);
	const alice = env.createUser({ first_name: "Alice" });
	const bob = env.createUser({ first_name: "Bob", language_code: "en" });
	const carol = env.createUser({ first_name: "Carol" });
	let gameId: number | undefined;
	try {
		await db
			.update(users)
			.set({ locale: null })
			.where(eq(users.telegramId, bob.payload.id));
		await alice.sendCommand("start");
		const home = env.lastBotMessage();
		assert.ok(home);
		assert.match(
			String(env.lastApiCall("sendMessage")?.params.text ?? ""),
			/Тайный Санта/,
		);
		await alice.click("create", home);
		await alice.sendCommand("start");
		assert.equal(
			(
				await db
					.select()
					.from(sceneStates)
					.where(eq(sceneStates.telegramId, alice.payload.id))
			).length,
			0,
		);
		const restartedHome = env.lastBotMessage();
		assert.ok(restartedHome);
		await alice.click("create", restartedHome);
		const [initialScene] = await db
			.select()
			.from(sceneStates)
			.where(eq(sceneStates.telegramId, alice.payload.id));
		assert.equal((initialScene?.data as { stepId?: string })?.stepId, "name");
		await alice.sendMessage("Новый год");
		const [savedScene] = await db
			.select()
			.from(sceneStates)
			.where(eq(sceneStates.telegramId, alice.payload.id));
		assert.deepEqual(
			savedScene?.data && {
				stepId: (savedScene.data as { stepId: string }).stepId,
				name: (savedScene.data as { state: { name: string } }).state.name,
			},
			{ stepId: "budget", name: "Новый год" },
		);
		const budgetMessage = env.lastBotMessage();
		assert.ok(budgetMessage);
		await alice.click("budget:2", budgetMessage);
		const dateMessage = budgetMessage;
		await alice.click("date:skip", dateMessage);
		const [game] = await db
			.select()
			.from(games)
			.where(eq(games.name, "Новый год"))
			.orderBy(games.id);
		assert.ok(game);
		gameId = game.id;
		assert.equal(
			(
				await db
					.select()
					.from(sceneStates)
					.where(eq(sceneStates.telegramId, alice.payload.id))
			).length,
			0,
		);
		assert.ok(await gameByInvite(game.inviteCode));

		await bob.sendCommand("start");
		assert.match(
			String(env.lastApiCall("sendMessage")?.params.text ?? ""),
			/Тайный Санта/,
		);
		assert.equal(
			(await registerUser({ id: bob.payload.id, firstName: "Bob" })).locale,
			null,
		);
		const bobHome = env.lastBotMessage({ chat: bob.payload.id });
		assert.ok(bobHome);
		await bob.click("language", bobHome);
		assert.match(
			String(env.lastApiCall("editMessageText")?.params?.text ?? ""),
			/Выбери язык/,
		);
		await bob.click("lang:en", bobHome);
		assert.match(
			String(env.lastApiCall("editMessageText")?.params?.text ?? ""),
			/Choose the interface language/,
		);
		assert.equal(
			(await registerUser({ id: bob.payload.id, firstName: "Bob" })).locale,
			"en",
		);
		await bob.sendCommand("start");
		assert.match(
			String(env.lastApiCall("sendMessage")?.params.text ?? ""),
			/Secret Santa/,
		);

		const bobEnglishHome = env.lastBotMessage({ chat: bob.payload.id });
		assert.ok(bobEnglishHome);
		await bob.click("language", bobEnglishHome);
		await bob.click("lang:ru", bobEnglishHome);
		assert.equal(
			(await registerUser({ id: bob.payload.id, firstName: "Bob" })).locale,
			"ru",
		);
		await bob.sendCommand("start");
		assert.match(
			String(env.lastApiCall("sendMessage")?.params.text ?? ""),
			/Тайный Санта/,
		);
		const bobRussianHome = env.lastBotMessage({ chat: bob.payload.id });
		assert.ok(bobRussianHome);
		await bob.click("language", bobRussianHome);
		await bob.click("lang:en", bobRussianHome);

		for (const user of [bob, carol]) {
			await user.sendCommand("start", `game_${game.inviteCode}`);
			if (user === bob) {
				const inviteText = String(
					env.lastApiCall("sendMessage")?.params.text ?? "",
				);
				assert.match(inviteText, /You're invited to Secret Santa/);
				assert.match(inviteText, /₽1,000–2,000/);
			}
			const invite = env.lastBotMessage();
			assert.ok(invite);
			await user.click(`join:${game.inviteCode}`, invite);
		}
		assert.equal(
			(
				await db
					.select()
					.from(participants)
					.where(eq(participants.gameId, game.id))
			).length,
			3,
		);

		const bobCard = env.lastBotMessage({ chat: bob.payload.id });
		assert.ok(bobCard);
		await bob.click(`wish:${game.id}`, bobCard);
		assert.match(
			String(env.lastApiCall("editMessageText")?.params?.text ?? ""),
			/Your wishlist/,
		);
		await bob.sendMessage("Books and coffee");
		const [bobWishlist] = await db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.gameId, game.id),
					eq(
						participants.userId,
						(await registerUser({ id: bob.payload.id, firstName: "Bob" })).id,
					),
				),
			);
		assert.equal(bobWishlist?.wishlist, "Books and coffee");
		assert.equal(
			(await registerUser({ id: bob.payload.id, firstName: "Bob" })).locale,
			"en",
		);

		const carolCard = env.lastBotMessage({ chat: carol.payload.id });
		assert.ok(carolCard);
		await carol.click(`leaveconfirm:${game.id}`, carolCard);
		await carol.click(`leave:${game.id}`, carolCard);
		assert.equal(
			(
				await db
					.select()
					.from(participants)
					.where(eq(participants.gameId, game.id))
			).length,
			2,
		);
		await carol.sendCommand("start", `game_${game.inviteCode}`);
		const freshInvite = env.lastBotMessage({ chat: carol.payload.id });
		assert.ok(freshInvite);
		await carol.click(`join:${game.inviteCode}`, freshInvite);
		assert.equal(
			(
				await db
					.select()
					.from(participants)
					.where(eq(participants.gameId, game.id))
			).length,
			3,
		);

		const owner = await registerUser({
			id: alice.payload.id,
			firstName: "Alice",
		});
		const bobUser = await registerUser({
			id: bob.payload.id,
			firstName: "Bob",
		});
		const carolUser = await registerUser({
			id: carol.payload.id,
			firstName: "Carol",
		});
		await alice.sendCommand("start");
		const card = env.lastBotMessage();
		assert.ok(card);
		await alice.click("games", card);
		const gamesMessage = card;
		await alice.click(`game:${game.id}`, gamesMessage);
		const gameMessage = card;
		await alice.click(`settings:${game.id}`, gameMessage);
		await alice.click(`editbudget:${game.id}`, gameMessage);
		await alice.sendMessage("до 3000 ₽");
		assert.equal(
			(await db.select().from(games).where(eq(games.id, game.id)))[0]?.budget,
			"до 3000 ₽",
		);
		const readyCard = env.lastBotMessage({ chat: alice.payload.id });
		assert.ok(readyCard);
		await alice.click(`drawconfirm:${game.id}`, readyCard);
		await alice.click(`draw:${game.id}`, readyCard);

		const rows = await db
			.select()
			.from(assignments)
			.where(eq(assignments.gameId, game.id));
		assert.equal(rows.length, 3);
		assert.equal(new Set(rows.map((row) => row.receiverParticipantId)).size, 3);
		for (const row of rows)
			assert.notEqual(row.giverParticipantId, row.receiverParticipantId);
		for (const userId of [owner.id, bobUser.id, carolUser.id])
			assert.ok((await myAssignment(game.id, userId)).firstName);
		await assert.rejects(() => myAssignment(game.id, -1));
		assert.equal(
			(await db.select().from(games).where(eq(games.id, game.id)))[0]?.status,
			"drawn",
		);
		await assert.rejects(() => drawGame(game.id, owner.id), /уже проведена/);
		await assert.rejects(() => drawGame(game.id, bobUser.id), /Нет доступа/);
		await assert.rejects(() => joinGame(game.id, 999), /уже началась/);
		await assert.rejects(
			() => setWishlist(game.id, bobUser.id, "Новые пожелания"),
			/только до жеребьёвки/,
		);
		const [bobMember] = await db
			.select()
			.from(participants)
			.where(eq(participants.gameId, game.id));
		assert.ok(bobMember);
		await assert.rejects(
			() => removeMember(game.id, owner.id, bobMember.id),
			/нельзя менять/,
		);
		await assert.rejects(
			() => updateGame(game.id, owner.id, { name: "Новое" }),
			/нельзя менять/,
		);
		const gifts = env.filterApiCalls("sendMessage");
		assert.equal(
			gifts.filter((call) =>
				String(call.params.text ?? "").includes("Ты Тайный Санта для"),
			).length,
			2,
		);
		assert.ok(
			gifts.some(
				(call) =>
					call.params.chat_id === bob.payload.id &&
					String(call.params.text ?? "").includes("You're Secret Santa for") &&
					String(call.params.text ?? "").includes("Budget: до 3000 ₽"),
			),
		);
		assert.equal(
			(
				await db
					.select()
					.from(assignments)
					.where(
						and(
							eq(assignments.gameId, game.id),
							isNull(assignments.notifiedAt),
						),
					)
			).length,
			0,
		);
		const firstAssignment = rows[0];
		assert.ok(firstAssignment);
		await db
			.update(assignments)
			.set({ notifiedAt: null })
			.where(eq(assignments.id, firstAssignment.id));
		const retried: number[] = [];
		await deliverPending(
			async (telegramId) => {
				retried.push(telegramId);
			},
			{ gameId: game.id },
		);
		assert.equal(retried.length, 1);
		assert.equal(
			(
				await db
					.select()
					.from(assignments)
					.where(
						and(
							eq(assignments.gameId, game.id),
							isNull(assignments.notifiedAt),
						),
					)
			).length,
			0,
		);
		await alice.click(`deleteconfirm:${game.id}`, readyCard);
		await alice.click(`delete:${game.id}`, readyCard);
		assert.equal(
			(await db.select().from(games).where(eq(games.id, game.id))).length,
			0,
		);
	} finally {
		if (gameId) await db.delete(games).where(eq(games.id, gameId));
		await sql.end();
	}
});
