import { json, type RequestHandler } from '@sveltejs/kit';
import { schoolBackend } from '$lib/server/school/backend';
import { SchoolError } from '$lib/server/school/types';
export const POST: RequestHandler = async (event) => {
	try {
		if (event.request.headers.get('origin') !== event.url.origin)
			return json({ message: 'Источник запроса не разрешён.' }, { status: 403 });
		const raw = await event.request.text();
		if (raw.length > 12000) return json({ message: 'Заявка слишком большая.' }, { status: 413 });
		let body;
		try {
			body = JSON.parse(raw);
		} catch {
			return json({ message: 'Некорректный JSON.' }, { status: 400 });
		}
		if (!body || typeof body !== 'object' || Array.isArray(body))
			return json({ message: 'Проверьте формат заявки.' }, { status: 422 });
		const school = await schoolBackend(event);
		return json({
			success: true,
			...await school.enquiry(
				{ ...body, contact: body.contact ?? body.email ?? body.phone ?? body.telegram }
			),
		});
	} catch (e) {
		if (e instanceof SchoolError) return json({ message: e.message }, { status: e.status });
		console.error('school.enquiry.failed');
		return json({ message: 'Не удалось сохранить заявку.' }, { status: 500 });
	}
};
