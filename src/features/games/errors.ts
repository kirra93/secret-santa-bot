import { type ErrorCode, gameErrorText } from "../../i18n.ts";

/** Carries a stable game error code while keeping Russian messages for existing service callers. */
export class GameError extends Error {
	readonly code: ErrorCode;

	constructor(code: ErrorCode) {
		super(gameErrorText("ru", code));
		this.code = code;
	}
}
