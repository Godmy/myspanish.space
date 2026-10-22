import { redirect, type RequestHandler } from '@sveltejs/kit';
import { LOCALE_COOKIE, parseLocale } from '$lib/locale';

/** Language switch of the menu: stores the `lang` cookie and returns to the same page. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const form = await request.formData();
	cookies.set(LOCALE_COOKIE, parseLocale(String(form.get('lang') ?? '')), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax',
		httpOnly: true
	});
	const to = String(form.get('to') ?? '/');
	// Same-origin paths only: `//host` and `/\host` would leave the site.
	redirect(303, /^\/(?![/\\])/.test(to) ? to : '/');
};
