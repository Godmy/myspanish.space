-- 0002: Telegram-хендл школы сменился hispamama → mamaespanola (REVIEWER-004, WEB-DEV-003).
-- Применяется к существующим D1 (prod/local), где строки уже засеяны 0001+seed.
--
-- ВНИМАНИЕ: строку site_settings.whatsapp_link НЕ трогаем — по указанию OWNER
-- (2026-08-29) её сохраняем, туда позже впишут другой телефон. Фронтенд
-- WhatsApp-кнопки уже убрал (WEB-DEV-003), значение просто хранится до нового номера.

UPDATE site_settings SET value = 'https://t.me/mamaespanola' WHERE key = 'telegram_link';
