import {
	defineI18n,
	type LanguageMap,
	type ShouldFollowLanguageStrict,
} from "@gramio/i18n";

/** Supported interface languages; unknown Telegram languages use English. */
export type Locale = "ru" | "en";

/** Keeps the current Russian experience for Telegram accounts without a language code. */
export function localeFromTelegram(languageCode?: string): Locale {
	if (!languageCode) return "ru";
	return languageCode.toLowerCase().split(/[-_]/)[0] === "ru" ? "ru" : "en";
}

const ru = {
	home: "🎅 Тайный Санта\n\nСоздай игру или присоединись по приглашению.",
	createGame: "Создать игру",
	myGames: "Мои игры",
	helpButton: "Помощь",
	back: "◀ Назад",
	backToGames: "◀ Мои игры",
	homeButton: "🏠 Главная",
	cancel: "Отмена",
	skip: "Пропустить",
	delete: "Удалить",
	inviteInvalid: "Приглашение не действует.",
	inviteIntro: (name: string, budget: string) =>
		`🎅 Тебя пригласили в Тайного Санту!\n\nИгра: ${name}\nБюджет: ${budget}`,
	joinButton: "Присоединиться",
	declineButton: "Отказаться",
	createNamePrompt: "Как назовём игру? Напиши название сообщением.",
	createBudgetPrompt: "Какой бюджет подарка?",
	createDatePrompt:
		"Когда будете обмениваться подарками? Введи дату ГГГГ-ММ-ДД или нажми «Пропустить».",
	createDateCallbackPrompt:
		"Когда будете обмениваться подарками? Введи дату ГГГГ-ММ-ДД или пропусти.",
	customBudgetPrompt: "Укажи бюджет сообщением.",
	budget1Button: "До 1000 ₽",
	budget2Button: "1000–2000 ₽",
	budget3Button: "2000–5000 ₽",
	budgetCustomButton: "Указать свой",
	budgetNoneButton: "Без ограничения",
	budget1Value: "до 1000 ₽",
	budget2Value: "1000–2000 ₽",
	budget3Value: "2000–5000 ₽",
	budgetNoneValue: "без ограничения",
	gameMembers: "Участники",
	wishlistButton: "Пожелания",
	inviteButton: "Пригласить",
	settingsButton: "Настройки",
	drawButton: "🎲 Провести жеребьёвку",
	leaveButton: "Покинуть игру",
	assignmentButton: "Кому я дарю 🎁",
	deleteGameButton: "Удалить игру",
	notSpecified: "не указана",
	wishesNotSpecified: "не указаны",
	wishesEmpty: "пока не указаны",
	gameCard: (
		name: string,
		count: number,
		budget: string,
		date: string,
		drawn: boolean,
	) =>
		`🎄 ${name}\n\n👥 Участников: ${count}\n💰 Бюджет: ${budget}\n📅 Обмен: ${date}\n🎲 Жеребьёвка: ${drawn ? "проведена" : "ещё не проведена"}`,
	gamesList: (owned: number, joined: number) =>
		`Мои игры\n\nОрганизую: ${owned}\nУчаствую: ${joined}`,
	help: "Создай игру, отправь друзьям приглашение и после вступления минимум трёх игроков проведи жеребьёвку. Результат виден только тебе.",
	inviteShare: (name: string, url: string) =>
		`Пригласи друзей в «${name}»:\n${url}`,
	shareLinkButton: "Поделиться ссылкой",
	removeMemberButton: (name: string) => `Удалить ${name}`,
	membersList: (count: number, names: string) =>
		`Участники: ${count}\n\n${names}`,
	joined: "Ты участвуешь в игре!",
	wishlistPrompt: (wishlist: string) =>
		`Твои пожелания: ${wishlist}\n\nНапиши новые пожелания сообщением.`,
	wishlistSaved: "Пожелания сохранены.",
	leaveConfirm: "Покинуть игру?",
	settingsTitle: (name: string) => `Настройки · ${name}`,
	nameButton: "Название",
	budgetButton: "Бюджет",
	dateButton: "Дата обмена",
	editDatePrompt: "Введи дату ГГГГ-ММ-ДД.",
	editValuePrompt: "Введи новое значение сообщением.",
	deleteConfirm:
		"Удалить игру? Все участники и результаты жеребьёвки будут удалены.",
	drawConfirm: (count: number) =>
		`Провести жеребьёвку? После этого состав участников изменить нельзя.\n\nУчастников: ${count}`,
	drawConfirmButton: "🎲 Провести",
	gift: (name: string, wishlist: string, budget: string, date: string) =>
		`🎅 Жеребьёвка завершена!\n\nТы Тайный Санта для: 🎁 ${name}\n\nПожелания: ${wishlist}\nБюджет: ${budget}\nДата обмена: ${date}`,
	unknownError: "Что-то пошло не так. Попробуй ещё раз.",
	errors: {
		gameNotFound: "Игра не найдена.",
		noAccess: "Нет доступа.",
		settingsLocked: "Настройки уже нельзя менять.",
		drawAlready: "Жеребьёвка уже проведена.",
		leaveLocked: "Из этой игры уже нельзя выйти.",
		assignmentPending: "Жеребьёвка ещё не проведена.",
		nameTooLong: "Название должно быть не длиннее 100 символов.",
		budgetTooLong: "Бюджет должен быть не длиннее 100 символов.",
		gameStarted: "Эта игра уже началась.",
		alreadyJoined: "Ты уже участвуешь в этой игре.",
		wishlistLocked: "Пожелания можно менять только до жеребьёвки.",
		notParticipant: "Ты не участвуешь в игре.",
		rosterLocked: "Состав игры уже нельзя менять.",
		memberNotFound: "Участник не найден.",
		ownerCannotLeave: "Организатор не может выйти из игры.",
		minPlayers: "Для жеребьёвки нужно минимум 3 участника.",
		invalidDate: "Введите дату в формате ГГГГ-ММ-ДД.",
		staleButton: "Кнопка устарела.",
		inviteInvalid: "Приглашение не действует.",
		creationRestart: "Начни создание игры заново.",
		textLength: "Введите текст длиной от 1 до 500 символов.",
	},
} satisfies LanguageMap;

const en = {
	home: "🎅 Secret Santa\n\nCreate a game or join one with an invite link.",
	createGame: "Create a game",
	myGames: "My games",
	helpButton: "Help",
	back: "◀ Back",
	backToGames: "◀ My games",
	homeButton: "🏠 Home",
	cancel: "Cancel",
	skip: "Skip",
	delete: "Delete",
	inviteInvalid: "This invite is no longer valid.",
	inviteIntro: (name: string, budget: string) =>
		`🎅 You're invited to Secret Santa!\n\nGame: ${name}\nBudget: ${budget}`,
	joinButton: "Join game",
	declineButton: "Decline",
	createNamePrompt: "What should we call the game? Send me a name.",
	createBudgetPrompt: "What's the gift budget?",
	createDatePrompt:
		"When will you exchange gifts? Send a date in YYYY-MM-DD format or tap Skip.",
	createDateCallbackPrompt:
		"When will you exchange gifts? Send a date in YYYY-MM-DD format or skip this step.",
	customBudgetPrompt: "Send me your budget.",
	budget1Button: "Up to ₽1,000",
	budget2Button: "₽1,000–2,000",
	budget3Button: "₽2,000–5,000",
	budgetCustomButton: "Enter my own",
	budgetNoneButton: "No limit",
	budget1Value: "up to ₽1,000",
	budget2Value: "₽1,000–2,000",
	budget3Value: "₽2,000–5,000",
	budgetNoneValue: "no limit",
	gameMembers: "Participants",
	wishlistButton: "Wishlist",
	inviteButton: "Invite friends",
	settingsButton: "Settings",
	drawButton: "🎲 Draw names",
	leaveButton: "Leave game",
	assignmentButton: "My recipient 🎁",
	deleteGameButton: "Delete game",
	notSpecified: "not set",
	wishesNotSpecified: "not provided",
	wishesEmpty: "not set yet",
	gameCard: (
		name: string,
		count: number,
		budget: string,
		date: string,
		drawn: boolean,
	) =>
		`🎄 ${name}\n\n👥 Participants: ${count}\n💰 Budget: ${budget}\n📅 Exchange date: ${date}\n🎲 Draw: ${drawn ? "complete" : "not yet held"}`,
	gamesList: (owned: number, joined: number) =>
		`My games\n\nOrganizing: ${owned}\nPlaying: ${joined}`,
	help: "Create a game, share the invite link, and draw names once at least three people have joined. Only you can see your recipient.",
	inviteShare: (name: string, url: string) =>
		`Invite friends to “${name}”:\n${url}`,
	shareLinkButton: "Share link",
	removeMemberButton: (name: string) => `Remove ${name}`,
	membersList: (count: number, names: string) =>
		`Participants: ${count}\n\n${names}`,
	joined: "You're in!",
	wishlistPrompt: (wishlist: string) =>
		`Your wishlist: ${wishlist}\n\nSend me your new wishlist.`,
	wishlistSaved: "Wishlist saved.",
	leaveConfirm: "Leave this game?",
	settingsTitle: (name: string) => `Settings · ${name}`,
	nameButton: "Name",
	budgetButton: "Budget",
	dateButton: "Exchange date",
	editDatePrompt: "Send a date in YYYY-MM-DD format.",
	editValuePrompt: "Send the new value.",
	deleteConfirm:
		"Delete this game? All participants and draw results will be removed.",
	drawConfirm: (count: number) =>
		`Draw names now? You won't be able to change the participant list afterwards.\n\nParticipants: ${count}`,
	drawConfirmButton: "🎲 Draw names",
	gift: (name: string, wishlist: string, budget: string, date: string) =>
		`🎅 The draw is complete!\n\nYou're Secret Santa for: 🎁 ${name}\n\nWishlist: ${wishlist}\nBudget: ${budget}\nExchange date: ${date}`,
	unknownError: "Something went wrong. Please try again.",
	errors: {
		gameNotFound: "Game not found.",
		noAccess: "You don't have access to this game.",
		settingsLocked: "You can't change the settings after the draw.",
		drawAlready: "The draw has already been held.",
		leaveLocked: "You can't leave this game now.",
		assignmentPending: "The draw hasn't been held yet.",
		nameTooLong: "Keep the name under 100 characters.",
		budgetTooLong: "Keep the budget under 100 characters.",
		gameStarted: "This game has already started.",
		alreadyJoined: "You're already in this game.",
		wishlistLocked: "You can only edit your wishlist before the draw.",
		notParticipant: "You're not in this game.",
		rosterLocked: "You can't change the participant list after the draw.",
		memberNotFound: "Participant not found.",
		ownerCannotLeave: "The organizer can't leave the game.",
		minPlayers: "At least three participants are needed for the draw.",
		invalidDate: "Send a date in YYYY-MM-DD format.",
		staleButton: "This button has expired.",
		inviteInvalid: "This invite is no longer valid.",
		creationRestart: "Start creating the game again.",
		textLength: "Send between 1 and 500 characters of text.",
	},
} satisfies ShouldFollowLanguageStrict<typeof ru>;

const i18n = defineI18n({ primaryLanguage: "ru", languages: { ru, en } });

/** Looks up a translated bot message with compile-time checked arguments. */
export const t = i18n.t;
export type ErrorCode = keyof typeof ru.errors;

/** Resolves a game error code without coupling business logic to a locale. */
export function gameErrorText(locale: Locale, code: ErrorCode) {
	return (locale === "ru" ? ru : en).errors[code];
}

const canonicalBudget = {
	"1": "до 1000 ₽",
	"2": "1000–2000 ₽",
	"3": "2000–5000 ₽",
	none: "без ограничения",
} as const;
export type BudgetChoice = keyof typeof canonicalBudget;

/** Keeps preset budgets language-neutral in storage and translates them at display time. */
export function budgetPreset(choice: BudgetChoice) {
	return canonicalBudget[choice];
}

/** Renders built-in budget presets in the recipient's language. */
export function budgetText(locale: Locale, budget: string) {
	switch (budget) {
		case canonicalBudget["1"]:
			return t(locale, "budget1Value");
		case canonicalBudget["2"]:
			return t(locale, "budget2Value");
		case canonicalBudget["3"]:
			return t(locale, "budget3Value");
		case canonicalBudget.none:
			return t(locale, "budgetNoneValue");
		default:
			return budget;
	}
}
