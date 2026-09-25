import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config.ts";

export const sql = postgres(config.DATABASE_URL);

export const db = drizzle({
	client: sql,
	casing: "snake_case",
});
