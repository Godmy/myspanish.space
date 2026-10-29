import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals }) => ({
	locale: locals.locale,
	viewer: null,
	testimonials: [],
	faqItems: [],
	settings: {},
});
