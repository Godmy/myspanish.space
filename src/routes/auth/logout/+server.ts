import { redirect, type RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie, revokeSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, locals, platform }) => {
	await revokeSession(locals.user, {
		KV: platform?.env?.KV,
	});
	clearSessionCookie(cookies);
	redirect(302, '/auth/login');
};
