import type { PageServerLoad } from './$types';
import type { D1Database } from '@cloudflare/workers-types';

export type AdminQuestionRow = {
	id: number;
	order: number;
	key: string;
	location: string;
	question: string;
	options: number;
	correct: string;
	status: string;
	updated: string;
};

export type AdminResultRow = {
	id: number;
	student: string;
	username: string;
	score: string;
	bucket: string;
	status: string;
	answers: string;
	started: string;
	finished: string;
};

type QuestionQueryRow = {
	id: number;
	order_no: number;
	key: string;
	location: string;
	body: string;
	options_count: number;
	correct_option: string | null;
	is_published: number;
	updated_at: string;
};

type ResultQueryRow = {
	id: number;
	student: string;
	tg_username: string | null;
	score: number | null;
	level_bucket: string | null;
	status: string;
	answers_count: number;
	correct_answers: number | null;
	started_at: string;
	finished_at: string | null;
};

function shortText(value: string, maxLength = 92): string {
	return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatDate(value: string | null): string {
	if (!value) return '-';
	return value.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
}

async function loadQuestions(db: D1Database): Promise<AdminQuestionRow[]> {
	const res = await db
		.prepare(
			`SELECT
			    q.id,
			    q.question_order + 1 AS order_no,
			    q.key,
			    q.location,
			    q.body,
			    q.is_published,
			    q.updated_at,
			    COUNT(o.id) AS options_count,
			    MAX(CASE WHEN o.is_correct = 1 THEN o.body END) AS correct_option
			   FROM quiz_questions q
			   LEFT JOIN quiz_options o ON o.question_id = q.id
			  WHERE q.version_key = 'tesoro-v1'
			  GROUP BY q.id, q.question_order, q.key, q.location, q.body, q.is_published, q.updated_at
			  ORDER BY q.question_order ASC`,
		)
		.all<QuestionQueryRow>();

	return res.results.map((row: QuestionQueryRow) => ({
		id: row.id,
		order: row.order_no,
		key: row.key,
		location: row.location,
		question: shortText(row.body),
		options: row.options_count,
		correct: row.correct_option ?? '-',
		status: row.is_published ? 'published' : 'draft',
		updated: formatDate(row.updated_at),
	}));
}

async function loadResults(db: D1Database): Promise<AdminResultRow[]> {
	const res = await db
		.prepare(
			`SELECT
			    r.id,
			    COALESCE(
			      NULLIF('@' || r.tg_username, '@'),
			      CASE WHEN r.tg_user_id IS NOT NULL THEN 'id ' || r.tg_user_id END,
			      'chat ' || r.chat_id
			    ) AS student,
			    r.tg_username,
			    r.score,
			    r.level_bucket,
			    r.status,
			    r.started_at,
			    r.finished_at,
			    COUNT(a.id) AS answers_count,
			    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
			   FROM quiz_runs r
			   LEFT JOIN quiz_answers a ON a.run_id = r.id
			  GROUP BY r.id, r.chat_id, r.tg_user_id, r.tg_username, r.score, r.level_bucket,
			           r.status, r.started_at, r.finished_at
			  ORDER BY COALESCE(r.finished_at, r.started_at) DESC
			  LIMIT 100`,
		)
		.all<ResultQueryRow>();

	return res.results.map((row: ResultQueryRow) => ({
		id: row.id,
		student: row.student,
		username: row.tg_username ? `@${row.tg_username}` : '-',
		score: row.score === null ? '-' : `${row.score}/12`,
		bucket: row.level_bucket ?? '-',
		status: row.status,
		answers: `${row.correct_answers ?? 0}/${row.answers_count}`,
		started: formatDate(row.started_at),
		finished: formatDate(row.finished_at),
	}));
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env.QUIZ_DB;
	let questions: AdminQuestionRow[] = [];
	let results: AdminResultRow[] = [];
	let loadError: string | null = null;

	if (db) {
		try {
			[questions, results] = await Promise.all([loadQuestions(db), loadResults(db)]);
		} catch (err) {
			console.error('admin quiz data load failed', err);
			loadError = 'quiz-db-unavailable';
		}
	} else {
		loadError = 'quiz-db-binding-missing';
	}

	return {
		user: locals.user,
		questions,
		results,
		quizDbReady: Boolean(db),
		loadError,
	};
};
