import type { LayoutServerLoad } from './$types';
import { getTestimonials, getFaqItems, getSiteSettings } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return {
			testimonials: [],
			faqItems: [],
			settings: {
				price_text: 'Стоимость уточняйте',
				price_note: 'Напишите нам — мы расскажем о тарифах и пришлём пробный урок',
				telegram_link: 'https://t.me/mamaespanola',
				contact_email: 'info@myspanish.space'
			}
		};
	}

	const [testimonials, faqItems, settings] = await Promise.all([
		getTestimonials(db),
		getFaqItems(db),
		getSiteSettings(db)
	]);

	return { testimonials, faqItems, settings };
};
