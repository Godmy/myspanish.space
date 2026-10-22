import { error, redirect, type Handle } from '@sveltejs/kit';
import { clearSessionCookie, readSession, SESSION_COOKIE } from '$lib/server/auth';
import { LOCALE_COOKIE, parseLocale } from '$lib/locale';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	event.locals.user = null;
	event.locals.locale = parseLocale(event.cookies.get(LOCALE_COOKIE));

	if (env?.AUTH_SECRET) {
		try {
			event.locals.user = await readSession(event.cookies.get(SESSION_COOKIE), {
				AUTH_SECRET: env.AUTH_SECRET,
				KV: env.KV,
			});
		} catch (err) {
			console.error('auth session read failed', err);
			clearSessionCookie(event.cookies);
		}
	}

	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			redirect(302, '/auth/login');
		}
		if (event.locals.user.role !== 'admin') {
			error(403, 'Forbidden');
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.locale)
	});
	if (event.url.pathname.startsWith('/admin')) {
		response.headers.set('Cache-Control', 'no-store');
		response.headers.set('X-Content-Type-Options', 'nosniff');
	}
	return response;
};
