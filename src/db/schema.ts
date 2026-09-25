import {
	bigint,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
	username: text("username"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name"),
	locale: text("locale", { enum: ["ru", "en"] }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const games = pgTable("games", {
	id: serial("id").primaryKey(),
	ownerId: integer("owner_id")
		.notNull()
		.references(() => users.id),
	name: text("name").notNull(),
	inviteCode: text("invite_code").notNull().unique(),
	budget: text("budget").notNull(),
	exchangeDate: text("exchange_date"),
	status: text("status", { enum: ["recruiting", "drawn"] })
		.notNull()
		.default("recruiting"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const participants = pgTable(
	"participants",
	{
		id: serial("id").primaryKey(),
		gameId: integer("game_id")
			.notNull()
			.references(() => games.id, { onDelete: "cascade" }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id),
		wishlist: text("wishlist"),
		joinedAt: timestamp("joined_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("participants_game_user_unique").on(table.gameId, table.userId),
	],
);

export const assignments = pgTable(
	"assignments",
	{
		id: serial("id").primaryKey(),
		gameId: integer("game_id")
			.notNull()
			.references(() => games.id, { onDelete: "cascade" }),
		giverParticipantId: integer("giver_participant_id")
			.notNull()
			.references(() => participants.id, { onDelete: "cascade" }),
		receiverParticipantId: integer("receiver_participant_id")
			.notNull()
			.references(() => participants.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		notifiedAt: timestamp("notified_at"),
	},
	(table) => [
		uniqueIndex("assignments_game_giver_unique").on(
			table.gameId,
			table.giverParticipantId,
		),
		uniqueIndex("assignments_game_receiver_unique").on(
			table.gameId,
			table.receiverParticipantId,
		),
	],
);

export const sceneStates = pgTable("scene_states", {
	telegramId: bigint("telegram_id", { mode: "number" }).primaryKey(),
	data: jsonb("data").notNull(),
});
