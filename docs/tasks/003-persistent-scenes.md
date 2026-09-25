---
type: task
status: completed
owner: repository maintainers
canonical_for: "persistent GramIO scenes and layered games refactor"
---

# Постоянные scenes и слои игрового модуля

Источник требований: [ТЗ MVP](../product/mvp.md). Текущие границы описаны в [архитектуре](../architecture/overview.md).

## Работа

1. Перенести `drafts` в единое PostgreSQL storage GramIO scenes с сохранением незавершённых шагов.
2. Перевести создание игры, пожелания и редактирование на scenes; оставить обработчикам маршрутизацию кнопок и одношаговые действия.
3. Вынести Drizzle-запросы в `repository.ts`, проверки сценариев в `service.ts`, алгоритм пар в чистый `drawing.ts`; сделать `screens.ts` независимым от БД.
4. Сохранить одну транзакцию жеребьёвки и прежние кнопки, тексты и ограничения доступа.

## Результат и проверка

Рефакторинг выполнен. `0002_keen_butterfly.sql` переносит старые черновики в `scene_states` до удаления `drafts`. Интеграционный тест проверяет PostgreSQL-состояние сцены, отмену через `/start` и прежний сценарий A/B/C; отдельный тест проверяет свойства чистой жеребьёвки.
