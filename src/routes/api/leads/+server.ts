import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveLead } from '$lib/server/db';
import { trackEvent, hashIp, getClientIp } from '$lib/server/analytics';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database unavailable' }, { status: 503 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const name = String(body.name ?? '').trim();
	if (!name) {
		return json({ error: 'Поле "Имя" обязательно' }, { status: 422 });
	}

	const consent = Boolean(body.consent);
	if (!consent) {
		return json({ error: 'Необходимо согласие на обработку данных' }, { status: 422 });
	}

	const ip = getClientIp(request);
	const ip_hash = await hashIp(ip);

	const url = new URL(request.url);
	const utm_source = body.utm_source as string | undefined;
	const utm_medium = body.utm_medium as string | undefined;
	const utm_campaign = body.utm_campaign as string | undefined;

	try {
		const leadId = await saveLead(db, {
			name,
			phone: body.phone as string | undefined,
			telegram: body.telegram as string | undefined,
			email: body.email as string | undefined,
			child_age: body.child_age as string | undefined,
			message: body.message as string | undefined,
			consent,
			utm_source,
			utm_medium,
			utm_campaign,
			referrer: request.headers.get('referer') ?? undefined,
			ip_hash
		});

		await trackEvent(db, {
			event_type: 'form_submit',
			path: url.pathname,
			section_id: body.section_id as string | undefined,
			button_id: 'lead-form',
			utm_source,
			utm_medium,
			utm_campaign,
			referrer: request.headers.get('referer') ?? undefined,
			user_agent: request.headers.get('user-agent') ?? undefined,
			ip_hash
		});

		return json({ success: true, id: leadId });
	} catch (err) {
		console.error('Lead save error:', err);
		return json({ error: 'Ошибка сохранения' }, { status: 500 });
	}
};
