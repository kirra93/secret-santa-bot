import { scenes, scenesDerives } from "@gramio/scenes";
import { Bot } from "gramio";
import { config } from "./config.ts";
import { browseHandlers } from "./features/games/handlers/browse.ts";
import { creationHandlers } from "./features/games/handlers/creation.ts";
import { drawingHandlers } from "./features/games/handlers/drawing.ts";
import { managementHandlers } from "./features/games/handlers/management.ts";
import { participationHandlers } from "./features/games/handlers/participation.ts";
import { startHandlers } from "./features/games/handlers/start.ts";
import { sceneStorage } from "./features/games/repository.ts";
import { gameScenes } from "./features/games/scenes/index.ts";

export const bot = new Bot(config.BOT_TOKEN)
	.extend(
		scenesDerives(gameScenes, {
			withCurrentScene: true,
			storage: sceneStorage,
		}),
	)
	.extend(scenes(gameScenes, { storage: sceneStorage }))
	.extend(startHandlers)
	.extend(creationHandlers)
	.extend(browseHandlers)
	.extend(participationHandlers)
	.extend(drawingHandlers)
	.extend(managementHandlers)
	.onStart(({ info }) => console.log(`Bot @${info.username} started`))
	.onError(({ error }) => console.error("Bot error:", error));
