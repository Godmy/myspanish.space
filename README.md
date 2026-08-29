# myspanish.space — Испанский с мамой

Одностраничный лендинг проекта «Испанский с мамой».  
Стек: **SvelteKit 2 + TypeScript + Cloudflare Pages/Workers/D1/KV/R2**.

---

## Быстрый старт

```bash
yarn install
yarn dev
```

Откройте `http://localhost:5173`.

> В режиме `dev` нет доступа к D1/KV/R2 — страница покажет fallback-данные.  
> Для полноценной локальной разработки с D1 используйте `wrangler pages dev`.

---

## Cloudflare Bindings

| Binding | Тип    | Имя/ID              |
|---------|--------|---------------------|
| `DB`    | D1     | `myspanish-db`      |
| `KV`    | KV     | `myspanish-kv`      |
| `MEDIA` | R2     | `myspanish-media`   |

Перед деплоем замените `REPLACE_WITH_YOUR_D1_DATABASE_ID` и `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` в `wrangler.toml` на реальные ID ресурсов.

Создать ресурсы:

```bash
wrangler d1 create myspanish-db
wrangler kv namespace create myspanish-kv
wrangler r2 bucket create myspanish-media
```

---

## Миграции D1

```bash
# Применить миграции (production)
npm run db:migrate

# Применить миграции (local)
npm run db:migrate:local

# Залить seed-данные (production)
npm run db:seed

# Залить seed-данные (local)
npm run db:seed:local
```

---

## Сборка и деплой

```bash
# Сборка
yarn build

# Деплой на Cloudflare Pages
yarn deploy
# или
wrangler pages deploy .svelte-kit/cloudflare
```

---

## API endpoints

### `POST /api/leads`
Сохраняет заявку в D1.

```json
{
  "name": "Мария",
  "phone": "+7 900 000 0000",
  "telegram": "@maria",
  "email": "maria@example.com",
  "child_age": "3 года",
  "message": "Хочу попробовать",
  "consent": true,
  "utm_source": "google"
}
```

### `POST /api/events`
Трекинг событий аналитики.

```json
{
  "event_type": "cta_click",
  "path": "/",
  "section_id": "hero",
  "button_id": "hero-cta",
  "utm_source": "google"
}
```

Допустимые `event_type`: `page_view`, `cta_click`, `form_start`, `form_submit`,
`whatsapp_click`, `telegram_click`, `free_materials_click`, `price_click`.

---

## Структура D1

| Таблица          | Назначение                        |
|------------------|-----------------------------------|
| `leads`          | Заявки с форм                     |
| `events`         | Аналитика кликов                  |
| `testimonials`   | Отзывы (редактируемые)            |
| `faq_items`      | FAQ (редактируемые)               |
| `site_settings`  | Настройки сайта (цена, ссылки…)   |
| `media_assets`   | Метаданные файлов из R2           |

---

## Дальнейшее развитие

Проект подготовлен к расширению:

- **Telegram-бот**: добавить Worker с webhook `/api/telegram`
- **Уведомления**: использовать KV для очереди или Cloudflare Queues
- **Личный кабинет**: добавить `src/routes/cabinet/` с auth через KV-сессии
- **Скрытые лендинги**: `src/routes/lp/[slug]/`
- **A/B-тесты**: через KV-флаги и `platform.env.KV`
