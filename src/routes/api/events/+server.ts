import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackEvent, hashIp, getClientIp, type EventType } from '$lib/server/analytics';

const VALID_EVENTS: EventType[] = [
	'page_view',
	'cta_click',
	'form_start',
	'form_submit',
	'whatsapp_click',
	'telegram_click',
	'free_materials_click',
	'price_click',
	'quest_click'
];

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return json({ ok: false }, { status: 503 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	const event_type = body.event_type as string;
	if (!VALID_EVENTS.includes(event_type as EventType)) {
		return json({ ok: false }, { status: 400 });
	}

	const ip = getClientIp(request);
	const ip_hash = await hashIp(ip);

	try {
		await trackEvent(db, {
			event_type: event_type as EventType,
			path: body.path as string | undefined,
			section_id: body.section_id as string | undefined,
			button_id: body.button_id as string | undefined,
			utm_source: body.utm_source as string | undefined,
			utm_medium: body.utm_medium as string | undefined,
			utm_campaign: body.utm_campaign as string | undefined,
			referrer: request.headers.get('referer') ?? undefined,
			user_agent: request.headers.get('user-agent') ?? undefined,
			ip_hash
		});
		return json({ ok: true });
	} catch (err) {
		console.error('Event track error:', err);
		return json({ ok: false }, { status: 500 });
	}
};
