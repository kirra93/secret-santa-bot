import { bot } from "./bot.ts";
import { sql } from "./db/index.ts";
import { deliverPending } from "./features/games/notifications.ts";

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.once(signal, async () => {
		await bot.stop();
		await sql.end();
		process.exit(0);
	});
}

await deliverPending((telegramId, text) =>
	bot.api.sendMessage({ chat_id: telegramId, text }),
);
await bot.start();
