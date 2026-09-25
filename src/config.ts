import env from "env-var";

export const config = {
	BOT_TOKEN: env.get("BOT_TOKEN").required().asString(),
	DATABASE_URL: env.get("DATABASE_URL").required().asString(),
};
