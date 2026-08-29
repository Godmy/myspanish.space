import type { D1Database } from '@cloudflare/workers-types';

export type EventType =
	| 'page_view'
	| 'cta_click'
	| 'form_start'
	| 'form_submit'
	| 'whatsapp_click'
	| 'telegram_click'
	| 'free_materials_click'
	| 'price_click';

export interface TrackEvent {
	event_type: EventType;
	path?: string;
	section_id?: string;
	button_id?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	referrer?: string;
	user_agent?: string;
	ip_hash?: string;
}

export async function trackEvent(db: D1Database, event: TrackEvent): Promise<void> {
	await db
		.prepare(
			`INSERT INTO events (event_type, path, section_id, button_id,
			utm_source, utm_medium, utm_campaign, referrer, user_agent, ip_hash)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			event.event_type,
			event.path ?? null,
			event.section_id ?? null,
			event.button_id ?? null,
			event.utm_source ?? null,
			event.utm_medium ?? null,
			event.utm_campaign ?? null,
			event.referrer ?? null,
			event.user_agent ?? null,
			event.ip_hash ?? null
		)
		.run();
}

export async function hashIp(ip: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(ip + 'myspanish-salt-2024');
	const hash = await crypto.subtle.digest('SHA-256', data);
	const bytes = new Uint8Array(hash);
	return Array.from(bytes.slice(0, 8))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function getClientIp(request: Request): string {
	return (
		request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
		'unknown'
	);
}
