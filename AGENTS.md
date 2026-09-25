# Secret Santa bot: agent instructions

Read [docs/INDEX.md](docs/INDEX.md), [architecture](docs/architecture/overview.md), the relevant task and source files before editing. The product requirements are in [docs/product/mvp.md](docs/product/mvp.md); the documentation rules are in [docs/standards/project-documentation-standard.en.md](docs/standards/project-documentation-standard.en.md). For GramIO conventions, see [CLAUDE.md](CLAUDE.md) and the local `gramio` skill.

Keep the bot focused on private chats and the documented MVP. Keep assignment data private to the giver; authorize every game mutation against the owner and the game's state. Persist game and conversation state in PostgreSQL. Make draw execution atomic and repeat safe.

Run `npx tsc --noEmit`, `npm test`, and `npm run lint` for affected code; generate a Drizzle migration after schema changes. Preserve unrelated worktree changes. Report changed behavior, checks actually run, and remaining risks.
