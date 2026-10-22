import { SCHOOL_LOCALE_NAME } from '$stylist/spanish/const/record/school-locale-name';
import type { SchoolLocale } from '$stylist/spanish/type/alias/school-locale';

/** Cookie of the interface language chosen in the menu. */
export const LOCALE_COOKIE = 'lang';

/** Known interface language or `ru`. */
export const parseLocale = (value: string | null | undefined): SchoolLocale =>
	value && Object.hasOwn(SCHOOL_LOCALE_NAME, value) ? (value as SchoolLocale) : 'ru';
