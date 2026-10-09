# myspanish.space

Сайт проекта «Испанский с мамой» на **SvelteKit 2 / Svelte 5 / TypeScript** с деплоем в **Cloudflare Workers Static Assets**.  
Текущая публичная главная `/` находится в режиме «сайт скоро откроется», а рабочие лендинги и админка живут отдельными маршрутами.

## Что внутри

- публичная заглушка `/` с контактами, Telegram-ссылкой и кнопкой квиза;
- лендинги `/landing`, `/kids`, `/groups`, `/travel`;
- черновая страница квиза `/quiz` с deep-link в `@myspanish_space_quiz_bot`;
- API для заявок и аналитики: `POST /api/leads`, `POST /api/events`;
- Telegram Login auth для админки: `/auth/login`, `/auth/telegram/callback`, `/auth/logout`;
- защищённая админка `/admin` с чтением вопросов и результатов из `QUIZ_DB`;
- D1-хранилище сайта (`DB`) для заявок, событий, отзывов, FAQ и настроек;
- KV для auth revoke-list и будущего кэша/сессий;
- R2 binding `MEDIA` для медиа-ассетов.

## Быстрый старт

```bash
cd myspanish.space
yarn install
yarn dev
```

Vite dev-сервер: `http://localhost:5173`.

В обычном `yarn dev` Cloudflare bindings недоступны, поэтому часть данных берётся из fallback-значений. Для проверки Worker-окружения используйте Wrangler:

```bash
cd myspanish.space
yarn build
npx wrangler dev
```

Локальные секреты для Wrangler задаются в `.dev.vars` по примеру `.dev.vars.example`.

## Скрипты

| Команда | Назначение |
|---|---|
| `yarn dev` | локальный Vite dev-сервер |
| `yarn check` | `svelte-kit sync` + `svelte-check` |
| `yarn build` | сборка SvelteKit под Cloudflare |
| `yarn preview` | локальный preview Vite |
| `yarn db:migrate:local` | применить D1-миграции локально |
| `yarn db:seed:local` | залить `migrations/seed.sql` локально |
| `yarn db:migrate` | применить D1-миграции к remote `myspanish-db` |
| `yarn db:seed` | залить seed в remote `myspanish-db` |
| `yarn deploy` | `yarn build && wrangler deploy` |

По правилам репозитория `build`, `wrangler`, remote-миграции и деплой запускаются только по явной задаче OWNER.

## Cloudflare

Основной конфиг для деплоя: `wrangler.jsonc`.

| Binding / настройка | Тип | Текущее значение |
|---|---|---|
| Worker | Workers Static Assets | `myspanish-space` |
| Routes | custom domain | `myspanish.space/*`, `www.myspanish.space/*` |
| `DB` | D1 | `myspanish-db` / `1c0b6112-e90b-48df-93ea-358f0422f3f8` |
| `QUIZ_DB` | D1 | `myspanish-quiz-db` / `90a9dfa5-f1c6-4bfd-86a8-b42426dffa43` |
| `KV` | KV | `16bb1af5cb65422c80382a688715df8d` |
| `MEDIA` | R2 | `myspanish-media` |
| `PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME` | var | `myspanish_space_quiz_bot` |
| `ADMIN_TELEGRAM_USERNAMES` | var | `PavarenkinDA` |

`wrangler.toml` остался как старый Pages-конфиг. Актуальный путь проекта по ADR/runbook: `wrangler deploy` через `wrangler.jsonc`.

### Секреты

Для auth нужны Worker secrets или локальные значения в `.dev.vars`:

```dotenv
AUTH_SECRET=
TELEGRAM_LOGIN_BOT_TOKEN=
TELEGRAM_LOGIN_BOT_USERNAME=myspanish_space_quiz_bot
PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME=myspanish_space_quiz_bot
ADMIN_TELEGRAM_IDS=
ADMIN_TELEGRAM_USERNAMES=PavarenkinDA
```

`AUTH_SECRET` подписывает cookie `mss_session`. `TELEGRAM_LOGIN_BOT_TOKEN` используется только для проверки подписи Telegram Login Widget.

## Маршруты

| Route | Статус | Назначение |
|---|---|---|
| `/` | публично, `noindex` | временная страница «сайт скоро откроется» |
| `/landing` | публично, `index` | основной лендинг «Испанский с мамой» |
| `/kids` | публично, `index` | индивидуальные уроки для детей 7-17 лет |
| `/groups` | публично, `index` | групповые занятия для детей |
| `/travel` | публично, `noindex` | черновой лендинг «испанский для путешествий» |
| `/quiz` | публично, `noindex` | teaser квеста с переходом в Telegram-бот |
| `/auth/login` | публично | Telegram Login Widget |
| `/auth/telegram/callback` | публично | проверка Telegram payload и выдача сессии |
| `/auth/logout` | auth | отзыв текущей сессии через KV |
| `/admin` | admin only | вопросы и результаты квиза из `QUIZ_DB` |

## API

### `POST /api/leads`

Сохраняет заявку в `DB.leads`, требует `name` и `consent: true`, дополнительно пишет событие `form_submit`.

```json
{
  "name": "Мария",
  "phone": "+7 900 000 0000",
  "telegram": "@maria",
  "email": "maria@example.com",
  "child_age": "8 лет",
  "message": "Хочу пробный урок",
  "consent": true,
  "utm_source": "telegram",
  "utm_medium": "post",
  "utm_campaign": "launch"
}
```

### `POST /api/events`

Пишет клиентскую аналитику в `DB.events`.

```json
{
  "event_type": "quest_click",
  "path": "/quiz",
  "section_id": "quiz-teaser",
  "button_id": "quiz-start",
  "utm_source": "telegram"
}
```

Допустимые `event_type`: `page_view`, `cta_click`, `form_start`, `form_submit`, `whatsapp_click`, `telegram_click`, `free_materials_click`, `price_click`, `quest_click`.

## D1

Миграции сайта лежат в `migrations/`:

- `0001_initial.sql` — `leads`, `events`, `testimonials`, `faq_items`, `site_settings`, `media_assets`;
- `0002_contact_links_fix.sql` — обновляет `site_settings.telegram_link` на `https://t.me/mamaespanola`;
- `seed.sql` — стартовый контент для отзывов, FAQ и настроек.

Админка дополнительно читает `QUIZ_DB` с таблицами квиз-бота (`quiz_questions`, `quiz_options`, `quiz_runs`, `quiz_answers`). Схема `QUIZ_DB` поддерживается в компоненте `quiz-bot`.

## Интеграция с квиз-ботом

Кнопки квиза ведут в Telegram через `src/lib/links.ts`:

```ts
https://t.me/myspanish_space_quiz_bot?start=quiz_<source>
```

Используемые внутрисайтовые sources: `uc`, `web`, `free-materials`, `price` и другие campaign-safe slugs по контракту ARCHITECTOR.

## Структура

```text
myspanish.space/
  migrations/             # D1 migrations + seed сайта
  src/
    lib/
      analytics.ts        # клиентский трекинг /api/events
      links.ts            # Telegram quiz deep-links
      server/
        auth.ts           # Telegram Login + session cookie
        db.ts             # DB helpers сайта
    routes/
      api/                # leads/events endpoints
      auth/               # Telegram auth
      admin/              # защищённая админка
      landing|kids|groups|travel|quiz/
  static/                 # статические файлы
  wrangler.jsonc          # актуальный Cloudflare Worker config
```

## Командный протокол

Этот пакет находится в мульти-агентном репозитории. Перед изменениями кода читайте корневые `AGENTS.md`, `ROLES.md`, `PROTOCOL.md`; для `stylist-svelte/src/lib/**` дополнительно обязателен `stylist-svelte/AGENTS.md`.
