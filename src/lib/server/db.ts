import type { D1Database } from '@cloudflare/workers-types';

export interface Lead {
	id?: number;
	name: string;
	phone?: string;
	telegram?: string;
	email?: string;
	child_age?: string;
	message?: string;
	consent: boolean;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	referrer?: string;
	ip_hash?: string;
}

export interface Testimonial {
	id: number;
	author_name: string;
	author_city?: string;
	child_age?: string;
	content: string;
	avatar_url?: string;
	rating: number;
}

export interface FaqItem {
	id: number;
	question: string;
	answer: string;
}

export interface SiteSettings {
	[key: string]: string;
}

export async function saveLead(db: D1Database, lead: Lead): Promise<number> {
	const result = await db
		.prepare(
			`INSERT INTO leads (name, phone, telegram, email, child_age, message, consent,
			utm_source, utm_medium, utm_campaign, referrer, ip_hash)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			lead.name,
			lead.phone ?? null,
			lead.telegram ?? null,
			lead.email ?? null,
			lead.child_age ?? null,
			lead.message ?? null,
			lead.consent ? 1 : 0,
			lead.utm_source ?? null,
			lead.utm_medium ?? null,
			lead.utm_campaign ?? null,
			lead.referrer ?? null,
			lead.ip_hash ?? null
		)
		.run();

	return result.meta.last_row_id as number;
}

export async function getTestimonials(db: D1Database): Promise<Testimonial[]> {
	const result = await db
		.prepare(
			`SELECT id, author_name, author_city, child_age, content, avatar_url, rating
			FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC`
		)
		.all<Testimonial>();
	return result.results;
}

export async function getFaqItems(db: D1Database): Promise<FaqItem[]> {
	const result = await db
		.prepare(
			`SELECT id, question, answer FROM faq_items
			WHERE is_published = 1 ORDER BY sort_order ASC`
		)
		.all<FaqItem>();
	return result.results;
}

export async function getSiteSettings(db: D1Database): Promise<SiteSettings> {
	const result = await db.prepare(`SELECT key, value FROM site_settings`).all<{
		key: string;
		value: string;
	}>();
	return Object.fromEntries(result.results.map((r) => [r.key, r.value]));
}
