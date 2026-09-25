# Secret Santa bot

A small Telegram bot for running a Secret Santa game in private chats. Create a game, share its invite link, collect wishlists, then draw names. Each player sees only the person they're buying for.

The bot speaks Russian or English based on the user's Telegram language. Accounts without a language setting get Russian. Built-in budget options are shown in each reader's language; custom budget text stays as entered.

## Run locally

You'll need Node.js 24, npm, Docker, and a Telegram bot token.

```bash
cp .env.example .env
# Set BOT_TOKEN in .env
npm ci
docker compose -f docker-compose.dev.yml up -d
npm run migrate
npm run dev
```

The sample database credentials in `.env.example` are for local development only. If port 5432 is already taken, change both the published port and `DATABASE_URL`.

## Check it

```bash
npx tsc --noEmit
npm test
npm run lint
```

The integration test needs the local PostgreSQL container with migrations applied. It uses the sample database URL unless `DATABASE_URL` is set in the environment. When you're done, run `docker compose -f docker-compose.dev.yml down`.

## Run with Compose

Set `BOT_TOKEN` and `POSTGRES_PASSWORD` for Compose, then run:

```bash
docker compose up -d --build
```

Compose passes those values to the bot container; `.env` is not copied into the image. The bot applies migrations on startup and uses long polling, so run one bot instance at a time. The development and deployment Compose files share a project name; don't run both stacks at once.

[Project docs](docs/INDEX.md) · [Agent notes](AGENTS.md)
