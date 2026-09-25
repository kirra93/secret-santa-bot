CREATE TABLE "scene_states" (
	"telegram_id" bigint PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
-- Carry every unfinished conversation into GramIO's sole PostgreSQL scene store.
INSERT INTO "scene_states" ("telegram_id", "data")
SELECT u."telegram_id", jsonb_build_object(
    'name', CASE WHEN d."step" IN ('name', 'budget', 'date') THEN 'game-create'
                 WHEN d."step" = 'wishlist' THEN 'game-wishlist' ELSE 'game-edit' END,
    'params', CASE WHEN d."step" = 'wishlist' THEN jsonb_build_object('gameId', d."game_id")
                   WHEN d."step" = 'edit_name' THEN jsonb_build_object('gameId', d."game_id", 'field', 'name')
                   WHEN d."step" = 'edit_budget' THEN jsonb_build_object('gameId', d."game_id", 'field', 'budget')
                   WHEN d."step" = 'edit_date' THEN jsonb_build_object('gameId', d."game_id", 'field', 'exchangeDate')
                   ELSE 'null'::jsonb END,
    'state', CASE WHEN d."step" IN ('budget', 'date') THEN jsonb_strip_nulls(jsonb_build_object('name', d."name", 'budget', d."budget"))
                  ELSE '{}'::jsonb END,
    'stepId', CASE WHEN d."step" IN ('name', 'budget', 'date') THEN d."step" ELSE 'input' END,
    'previousStepId', CASE WHEN d."step" IN ('name', 'budget', 'date') THEN d."step" ELSE 'input' END,
    'firstTime', false,
    'entered', true
)
FROM "drafts" d JOIN "users" u ON u."id" = d."user_id";
--> statement-breakpoint
DROP TABLE "drafts" CASCADE;