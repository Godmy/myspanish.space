/**
 * Внешние ссылки, не зависящие от D1 `site_settings`.
 *
 * Квест «Поиск сокровищ» проходится в Telegram-боте. Переход с сайта несёт
 * source-атрибуцию через deep-link `?start=quiz_<source>` (ARCHITECTOR-018 §2,
 * ARCHITECTOR-019). Префикс `quiz_` живёт только здесь — совместимо с парсингом бота.
 */
export const QUEST_URL = 'https://t.me/myspanish_space_quiz_bot';

/**
 * Deep-link в квест с атрибуцией места перехода.
 * `source` — дефис-слаг без префикса: `uc`, `free-materials`, `price`, `web`.
 * Реестр внутрисайтовых слагов — ARCHITECTOR-019; кампанийные — SCRUM-MASTER/PROJECT.
 */
export const questUrl = (source: string): string => `${QUEST_URL}?start=quiz_${source}`;

/** Подпись кнопки квеста (единая по сайту). */
export const QUEST_LABEL = 'Пройти квест «Поиск сокровищ»';
