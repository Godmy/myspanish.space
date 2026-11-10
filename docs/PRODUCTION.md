# Production на Cloudflare Workers

Основной сайт: https://myspanish.space. Worker: `myspanish-space`.

`yarn deploy:production` собирает SvelteKit и публикует `wrangler.production.jsonc`.
Команда `build:preview` создаёт общий production-артефакт SvelteKit (dev=false);
разделение окружений задают Worker entry и bindings. Production entry не добавляет
preview-заголовки/noindex и не обслуживает `/__preview/*`. `www` перенаправляется на основной домен.

Данные школы хранятся в отдельном SQLite Durable Object `SchoolProduction`, binding `SCHOOL`,
экземпляр `school-v1`. Namespace не связан с `SchoolPreview`. Создаётся только учебный контент,
без демонстрационных пользователей, сессий и заявок. Авторизация — логин/пароль;
cookie preview и `SCHOOL_PREVIEW_AUTH` не включают роли в production.
Создание реальных учётных записей и импорт учеников выполняются отдельно;
эта публикация не переносит локальную базу или данные демонстрационного стенда.

Существующие D1, KV, R2 и секреты Worker сохраняются. Миграция `production-v1`
создаёт новый namespace и не меняет таблицы прежних D1-баз. Заявки сохраняются
в production Durable Object; отправка email не подключается этой публикацией.

Перед публикацией: `yarn check`, `yarn check:worker`, сборка и dry-run Wrangler.
После публикации: главная, все четыре документа, `/login`, запрет тестового userId,
форма знакомства, favicon и изображения; preview должен остаться независимым.

Первая публикация этого runtime: 10.11.2026. Предыдущая версия старого Worker:
`d0a0d3cf-994a-4d70-ac44-5a6e6783e1db`. При откате необходимо сохранить новый
namespace: нельзя удалять `SchoolProduction` или его данные для отката интерфейса.
