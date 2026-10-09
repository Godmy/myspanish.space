import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const env = platform?.env;
	const botUsername =
		env?.PUBLIC_TELEGRAM_LOGIN_BOT_USERNAME ?? env?.TELEGRAM_LOGIN_BOT_USERNAME ?? null;

	return {
		botUsername,
		isConfigured: Boolean(botUsername && env?.TELEGRAM_LOGIN_BOT_TOKEN && env?.AUTH_SECRET),
		error: url.searchParams.get('error'),
		user: locals.user,
	};
};
