import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import type { SchoolLocale } from '$stylist/spanish/type/alias/school-locale';

declare global {
	namespace App {
		interface Locals {
			user: {
				sub: number;
				uname?: string;
				name: string;
				role: 'admin' | 'student' | 'teacher' | 'parent';
				jti: string;
				iat: number;
				exp: number;
			} | null;
			/** Interface language from the `lang` cookie; `ru` by default. */
			locale: SchoolLocale;
		}
		interface Platform {
			env: {
				DB: D1Database;
				QUIZ_DB?: D1Database;
				KV: KVNamespace;
				MEDIA: R2Bucket;
				AUTH_SECRET?: string;
				TELEGRAM_LOGIN_BOT_TOKEN?: string;
				ADMIN_TELEGRAM_IDS?: string;
				ADMIN_TELEGRAM_USERNAMES?: string;
				PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME?: string;
				TELEGRAM_LOGIN_BOT_USERNAME?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
		interface Error {
			message: string;
			errorId?: string;
		}
	}
}

export {};
