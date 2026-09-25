// Sets required environment variables for tests.
// ??= ensures real values take precedence if already set.
process.env.BOT_TOKEN ??= "test";
process.env.DATABASE_URL ??=
	"postgresql://secret-santa-bot:secret-santa-dev@localhost:5432/secret-santa-bot";
