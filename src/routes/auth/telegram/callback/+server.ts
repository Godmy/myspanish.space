import { redirect, type RequestHandler } from '@sveltejs/kit';
import {
	issueSession,
	roleForTelegramUser,
	setSessionCookie,
	verifyTelegramLogin,
} from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, platform, url }) => {
	const env = platform?.env;
	if (!env) {
		redirect(302, '/auth/login?error=server_not_configured');
	}

	let telegramUser;
	try {
		telegramUser = await verifyTelegramLogin(url.searchParams, env);
	} catch (err) {
		console.error('telegram login failed', err);
		redirect(302, '/auth/login?error=telegram_login_failed');
	}

	const role = roleForTelegramUser(telegramUser, env);
	if (!role) {
		redirect(302, '/auth/login?error=access_denied');
	}

	const token = await issueSession(telegramUser, role, env);
	setSessionCookie(cookies, token);

	redirect(302, '/admin');
};
