# Тайный Санта — Telegram-бот

MVP для игры в личном чате: создание и приглашение, пожелания, жеребьёвка, приватное назначение получателя. Требуются Node.js 24, npm, PostgreSQL 17 и токен Telegram-бота.

## Локальный запуск

1. `cp .env.example .env` и впишите `BOT_TOKEN`.
2. `npm ci`
3. `docker compose -f docker-compose.dev.yml up -d`
4. `npm run migrate`
5. `npm run dev`

В `.env.example` указаны учётные данные только для локального контейнера. Если порт 5432 занят, настройте `DATABASE_URL` и проброс порта согласованно.

## Проверка

```bash
npx tsc --noEmit
npm test
npm run lint
```

Тесты требуют локальную базу с применённой миграцией. По умолчанию тесты используют адрес локальной базы из `.env.example`; при другой конфигурации задайте `DATABASE_URL` в окружении. Остановить локальную базу: `docker compose -f docker-compose.dev.yml down`.

## Production

Задайте `BOT_TOKEN` и `POSTGRES_PASSWORD` в окружении Compose, затем запустите `docker compose up -d --build`. Compose передаёт переменные контейнеру; файл `.env` внутрь образа не копируется. При старте бот применяет миграции. Используется long polling; запущен должен быть один экземпляр бота.

[Документация](docs/INDEX.md) · [Инструкции агенту](AGENTS.md)
