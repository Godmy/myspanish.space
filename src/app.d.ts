import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				KV: KVNamespace;
				MEDIA: R2Bucket;
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
