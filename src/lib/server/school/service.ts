import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import type { SchoolStore } from './store.ts';
import { SchoolError, type User, type Row, type Exercise } from './types.ts';

export class SchoolService {
	db: SchoolStore;
	development: boolean;
	constructor(db: SchoolStore, development = false) {
		this.db = db;
		this.development = development;
	}
	require(user: User | null, roles: string[] = []) {
		if (!user) throw new SchoolError(401, 'Войдите в кабинет.');
		if (roles.length && !roles.includes(user.role))
			throw new SchoolError(403, 'Это действие недоступно вашей роли.');
		return user;
	}
	text(value: unknown, max = 2000, required = true) {
		if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
			throw new SchoolError(422, 'Проверьте обязательные поля и длину текста.');
		return value.trim();
	}
	login(id: string) {
		if (!this.development)
			throw new SchoolError(403, 'Тестовый вход доступен только в development.');
		const user = this.db.one('SELECT * FROM pd.users WHERE id=? AND active=1', id);
		if (!user) throw new SchoolError(422, 'Неизвестная учётная запись.');
		return this.issueSession(user as User);
	}
	issueSession(user: User) {
		const token = randomBytes(32).toString('hex');
		this.db.run(
			'INSERT INTO pd.sessions VALUES(?,?,?)',
			this.hash(token),
			user.id,
			Date.now() + 86400000,
		);
		return { token, user };
	}
	setCredentials(userId: string, login: unknown, password: unknown) {
		const normalized = this.text(login, 120).toLowerCase(),
			secret = this.text(password, 200);
		if (secret.length < 12 || !/^[a-z0-9@._+-]{3,120}$/.test(normalized))
			throw new SchoolError(
				422,
				'Логин: латиница/цифры/email от 3 символов. Пароль: от 12 символов.',
			);
		if (
			this.db.one(
				'SELECT user_id FROM pd.credentials WHERE login=? AND user_id!=?',
				normalized,
				userId,
			)
		)
			throw new SchoolError(422, 'Этот логин уже используется.');
		const salt = randomBytes(16).toString('hex'),
			hash = scryptSync(secret, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
		this.db.run(
			'INSERT INTO pd.credentials VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET login=excluded.login,salt=excluded.salt,password_hash=excluded.password_hash',
			userId,
			normalized,
			salt,
			hash,
		);
		this.db.run('DELETE FROM pd.sessions WHERE user_id=?', userId);
	}
	authenticate(login: unknown, password: unknown, ip: string) {
		const key = this.hash(ip),
			since = Date.now() - 600000;
		this.db.run('DELETE FROM pd.login_attempts WHERE created_at<?', since);
		if (
			Number(
				this.db.one(
					'SELECT count(*) n FROM pd.login_attempts WHERE ip_hash=? AND created_at>?',
					key,
					since,
				)?.n,
			) >= 8
		)
			throw new SchoolError(429, 'Слишком много попыток входа. Подождите 10 минут.');
		const normalized = this.text(login, 120).toLowerCase(),
			secret = this.text(password, 200),
			record = this.db.one(
				'SELECT c.*,u.id,u.name,u.role,u.timezone,u.notifications,u.active FROM pd.credentials c JOIN pd.users u ON u.id=c.user_id WHERE c.login=?',
				normalized,
			);
		const hash = scryptSync(secret, record?.salt ?? 'not-a-user', 64, { N: 16384, r: 8, p: 1 });
		if (
			!record ||
			!record.active ||
			!timingSafeEqual(hash, Buffer.from(record.password_hash, 'hex'))
		) {
			this.db.run('INSERT INTO pd.login_attempts VALUES(?,?)', key, Date.now());
			throw new SchoolError(401, 'Неверный логин или пароль.');
		}
		this.db.run('DELETE FROM pd.login_attempts WHERE ip_hash=?', key);
		return this.issueSession({
			id: record.id,
			name: record.name,
			role: record.role,
			timezone: record.timezone,
			notifications: record.notifications,
		});
	}
	hash(value: string) {
		return createHash('sha256').update(value).digest('hex');
	}
	user(token?: string): User | null {
		if (!token) return null;
		return (
			(this.db.one(
				'SELECT u.id,u.name,u.role,u.timezone,u.notifications FROM pd.sessions s JOIN pd.users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1',
				this.hash(token),
				Date.now(),
			) as User) ?? null
		);
	}
	logout(token: string) {
		this.db.run('DELETE FROM pd.sessions WHERE token_hash=?', this.hash(token));
	}
	student(user: User, requested?: string) {
		if (user.role === 'student') {
			if (requested && requested !== user.id) throw new SchoolError(404, 'Профиль не найден.');
			return user.id;
		}
		if (user.role === 'parent') {
			const link = requested
				? this.db.one(
						'SELECT student_id FROM school.guardians WHERE parent_id=? AND student_id=?',
						user.id,
						requested,
					)
				: this.db.one(
						'SELECT student_id FROM school.guardians WHERE parent_id=? ORDER BY student_id LIMIT 1',
						user.id,
					);
			if (!link) throw new SchoolError(404, 'Связанный профиль не найден.');
			return String(link.student_id);
		}
		throw new SchoolError(403, 'Откройте рабочий кабинет.');
	}
	canManage(user: User, studentId: string) {
		return (
			user.role === 'admin' ||
			(user.role === 'teacher' &&
				!!this.db.one(
					'SELECT 1 FROM school.teacher_students WHERE teacher_id=? AND student_id=?',
					user.id,
					studentId,
				))
		);
	}
	access(studentId: string, courseId: string) {
		return !!this.db.one(
			'SELECT 1 FROM school.entitlements WHERE student_id=? AND course_id=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)',
			studentId,
			courseId,
			new Date().toISOString(),
		);
	}
	staffCourse(user: User, id: string) {
		this.require(user, ['admin', 'teacher']);
		const course = this.db.one('SELECT * FROM school.courses WHERE id=?', id);
		if (!course || (user.role !== 'admin' && course.owner_id !== user.id))
			throw new SchoolError(404, 'Курс не найден.');
		return course;
	}
	settings() {
		return Object.fromEntries(
			this.db.all('SELECT * FROM settings').map((row) => [row.key, JSON.parse(row.value)]),
		);
	}
	publicCourses(query = '') {
		return this.db.all(
			"SELECT * FROM school.courses WHERE (publication='published' OR EXISTS(SELECT 1 FROM school.archive_programs ap WHERE ap.course_id=school.courses.id)) AND (id NOT IN ('phonetics','songs','with-mum','themes','marathons') OR NOT EXISTS(SELECT 1 FROM school.archive_programs)) AND (title LIKE ? OR summary LIKE ?) ORDER BY demo DESC,title",
			`%${query.slice(0, 100)}%`,
			`%${query.slice(0, 100)}%`,
		);
	}
	course(id: string, user: User | null = null, studentId?: string, preview = false): Row {
		const course = this.db.one('SELECT * FROM school.courses WHERE id=? OR slug=?', id, id);
		if (!course) throw new SchoolError(404, 'Направление не найдено.');
		if (preview) this.staffCourse(this.require(user), course.id);
		else if (studentId) {
			if (user) this.student(user, studentId);
			if (!user || !this.access(studentId, course.id) || course.publication !== 'published')
				throw new SchoolError(404, 'Курс не назначен или недоступен.');
		} else if (course.publication !== 'published' && !this.db.one('SELECT course_id FROM school.archive_programs WHERE course_id=?',course.id))
			throw new SchoolError(404, 'Направление не найдено.');
		if(!preview&&!studentId&&course.publication!=='published')return {...course,modules:[]};
		return {
			...course,
			modules: this.db
				.all('SELECT * FROM school.modules WHERE course_id=? ORDER BY position', course.id)
				.map((m) => ({
					...m,
					bankCount:preview?this.db.one('SELECT COUNT(*) n FROM school.archive_module_materials WHERE module_id=?',m.id)?.n:0,
					bank:preview?this.db.all("SELECT m.id,m.title,m.missing FROM school.archive_module_materials am JOIN school.materials m ON m.id=am.material_id WHERE am.module_id=? AND m.privacy!='restricted' ORDER BY am.position LIMIT 30",m.id):[],
					lessons: this.db.all(
						`SELECT l.id,l.title,l.position,l.publication,${studentId ? 'EXISTS(SELECT 1 FROM school.completions c WHERE c.lesson_id=l.id AND c.student_id=?)' : '0'} AS completed FROM school.lessons l WHERE module_id=? ${preview ? '' : "AND publication='published'"} ORDER BY position`,
						...(studentId ? [studentId, m.id] : [m.id]),
					),
				})),
		};
	}
	lesson(
		id: string,
		user: User | null,
		studentId?: string,
		preview = false,
		publicDemo = false,
	): Row {
		if (!publicDemo && studentId && user) this.student(user, studentId);
		const lesson = this.db.one(
			'SELECT l.*,m.course_id FROM school.lessons l JOIN school.modules m ON m.id=l.module_id WHERE l.id=?',
			id,
		);
		if (!lesson) throw new SchoolError(404, 'Урок не найден.');
		const course = this.db.one('SELECT * FROM school.courses WHERE id=?', lesson.course_id)!;
		if (preview) this.staffCourse(this.require(user), course.id);
		else if (publicDemo) {
			if (!course.demo || course.publication !== 'published' || lesson.publication !== 'published')
				throw new SchoolError(404, 'Пример не найден.');
		} else if (
			!user ||
			!studentId ||
			!this.access(studentId, course.id) ||
			course.publication !== 'published' ||
			lesson.publication !== 'published'
		)
			throw new SchoolError(404, 'Урок не назначен или недоступен.');
		const exercises: Exercise[] = JSON.parse(lesson.exercises);
		const safe = exercises.map((ex) => {
			const { answer, ...rest } = ex;
			return {
				...rest,
				pairs:
					ex.kind === 'matching' ? ex.pairs?.map((p) => ({ id: p.id, left: p.left })) : ex.pairs,
			};
		});
		const { teacher_notes, ...rest } = lesson;
		const assignment=this.db.one('SELECT due_at FROM school.assignments WHERE lesson_id=?',lesson.id);
		return {
			...rest,
			due_at:assignment?.due_at??null,
			blocks: JSON.parse(lesson.blocks),
			exercises: preview ? exercises : safe,
			...(preview ? { teacher_notes } : {}),
			materials: this.materials(user, { studentId, lessonId: id, publicOnly: publicDemo }).items,
			courseTitle: course.title,
		};
	}
	enquire(data: Row, ip: string) {
		const name = this.text(data.name, 120),
			contact = this.text(data.contact, 200),
			direction = this.text(data.direction ?? 'demo-a1', 100);
		if (
			data.consent !== true ||
			data.website ||
			!(
				/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
				/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact) ||
				/^\+?[\d ()-]{8,25}$/.test(contact)
			)
		)
			throw new SchoolError(422, 'Укажите email, телефон или Telegram и подтвердите согласие.');
		const key = this.text(data.requestKey, 150);
		const prior = this.db.one('SELECT id FROM pd.leads WHERE request_key=?', key);
		if (prior) return { id: prior.id };
		const hash = this.hash(ip),
			since = new Date(Date.now() - 3600000).toISOString();
		if (
			Number(
				this.db.one(
					'SELECT COUNT(*) AS n FROM pd.leads WHERE ip_hash=? AND created_at>?',
					hash,
					since,
				)?.n,
			) >= 5
		)
			throw new SchoolError(429, 'Слишком много заявок. Попробуйте позже.');
		const id = randomUUID(),
			now = new Date().toISOString();
		this.db.transaction(() => {
			this.db.run(
				'INSERT INTO pd.leads(id,name,contact,request_key,ip_hash,created_at) VALUES(?,?,?,?,?,?)',
				id,
				name,
				contact,
				key,
				hash,
				now,
			);
			this.db.run(
				'INSERT INTO lead_funnel(id,direction,created_at,assigned_teacher_id) VALUES(?,?,?,?)',
				id,
				direction,
				now,
				this.development ? 'teacher' : null,
			);
		});
		return { id };
	}
	students(user: User) {
		this.require(user, ['teacher', 'admin']);
		return this.db.all(
			`SELECT u.id,u.name,u.timezone FROM pd.users u WHERE u.role='student' ${user.role === 'admin' ? '' : 'AND EXISTS(SELECT 1 FROM school.teacher_students ts WHERE ts.student_id=u.id AND ts.teacher_id=?)'} ORDER BY name`,
			...(user.role === 'admin' ? [] : [user.id]),
		);
	}
	submissions(user: User, studentId?: string) {
		return this.db.all(
			`SELECT s.*,l.title AS lesson_title,m.course_id,u.name,r.text FROM school.submissions s JOIN school.lessons l ON l.id=s.lesson_id JOIN school.modules m ON m.id=l.module_id JOIN pd.users u ON u.id=s.student_id LEFT JOIN pd.responses r ON r.id=s.id ${studentId ? 'WHERE s.student_id=?' : user.role === 'admin' ? '' : "WHERE s.status!='draft' AND EXISTS(SELECT 1 FROM school.teacher_students ts WHERE ts.student_id=s.student_id AND ts.teacher_id=?)"} ORDER BY COALESCE(s.submitted_at,'9999') DESC`,
			...(studentId ? [studentId] : user.role === 'admin' ? [] : [user.id]),
		);
	}
	submission(user: User, id: string, studentId?: string): Row {
		if (studentId) this.student(user, studentId);
		const item = this.db.one(
			'SELECT s.*,l.title AS lesson_title,l.homework,r.text,u.name FROM school.submissions s JOIN school.lessons l ON l.id=s.lesson_id JOIN pd.users u ON u.id=s.student_id LEFT JOIN pd.responses r ON r.id=s.id WHERE s.id=?',
			id,
		);
		if (
			!item ||
			!(studentId ? item.student_id === studentId : this.canManage(user, item.student_id))
		)
			throw new SchoolError(404, 'Работа не найдена.');
		if(!studentId&&user.role==='teacher'&&item.status==='draft')throw new SchoolError(404,'Работа ещё не отправлена.');
		return {
			...item,
			reviews: this.db.all(
				'SELECT id,text,decision,created_at FROM pd.reviews WHERE submission_id=? ORDER BY created_at',
				id,
			),
			file: item.upload_id
				? this.db.one('SELECT id,name,size FROM pd.uploads WHERE id=?', item.upload_id)
				: null,
			history: this.db.all(
				'SELECT id,attempt_no,status,submitted_at FROM school.submissions WHERE student_id=? AND lesson_id=? ORDER BY attempt_no',
				item.student_id,
				item.lesson_id,
			),
		};
	}
	saveHomework(user: User, data: Row) {
		this.require(user, ['student']);
		this.lesson(this.text(data.lessonId, 100), user, user.id);
		const text = this.text(data.text ?? '', 12000, false),
			uploadId = data.uploadId ? this.text(data.uploadId, 100) : null;
		if (
			uploadId &&
			!this.db.one('SELECT id FROM pd.uploads WHERE id=? AND owner_id=?', uploadId, user.id)
		)
			throw new SchoolError(404, 'Файл не найден.');
		const status = data.submit === true ? 'submitted' : 'draft';
		if (status === 'submitted' && !text && !uploadId)
			throw new SchoolError(422, 'Добавьте ответ или файл.');
		return this.db.transaction(() => {
			const last = this.db.one(
				'SELECT * FROM school.submissions WHERE student_id=? AND lesson_id=? ORDER BY attempt_no DESC LIMIT 1',
				user.id,
				data.lessonId,
			);
			if (last?.status === 'submitted' || last?.status === 'checked')
				throw new SchoolError(409, 'Работа уже отправлена. Новая попытка доступна после возврата.');
			const id = last?.status === 'draft' ? last.id : randomUUID(),
				attempt = last?.status === 'draft' ? last.attempt_no : Number(last?.attempt_no ?? 0) + 1;
			this.db.run(
				'INSERT INTO pd.responses(id,student_id,text) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET text=excluded.text',
				id,
				user.id,
				text,
			);
			this.db.run(
				'INSERT INTO school.submissions(id,lesson_id,student_id,attempt_no,status,upload_id,submitted_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,upload_id=excluded.upload_id,submitted_at=excluded.submitted_at,version=version+1',
				id,
				data.lessonId,
				user.id,
				attempt,
				status,
				uploadId,
				status === 'submitted' ? new Date().toISOString() : null,
			);
			this.db.run('UPDATE school.submissions SET assignment_id=lesson_id,due_at=(SELECT a.due_at FROM school.assignments a WHERE a.lesson_id=school.submissions.lesson_id) WHERE id=?', id);
			return { id };
		});
	}
	review(user: User, data: Row) {
		this.require(user, ['teacher', 'admin']);
		const item = this.submission(user, this.text(data.id, 100));
		if (item.status !== 'submitted')
			throw new SchoolError(409, 'Эта попытка уже проверена или ещё не отправлена.');
		const text = this.text(data.text, 12000),
			decision = data.decision;
		if (!['returned', 'checked'].includes(decision))
			throw new SchoolError(422, 'Выберите результат проверки.');
		this.db.transaction(() => {
			const result = this.db.run(
				"UPDATE school.submissions SET status=?,version=version+1 WHERE id=? AND status='submitted' AND version=?",
				decision,
				item.id,
				Number(data.version),
			);
			if (!result.changes) throw new SchoolError(409, 'Работа изменилась. Обновите страницу.');
			this.db.run(
				'INSERT INTO pd.reviews VALUES(?,?,?,?,?,?)',
				randomUUID(),
				item.id,
				user.id,
				text,
				decision,
				new Date().toISOString(),
			);
		});
		return { id: item.id };
	}
	attempt(user: User | null, data: Row, publicDemo = false): Row {
		const lesson = this.lesson(this.text(data.lessonId, 100), user, user?.id, false, publicDemo);
		if (!publicDemo) this.require(user, ['student']);
		const raw = this.db.one('SELECT exercises,version FROM school.lessons WHERE id=?', lesson.id)!;
		const ex = (JSON.parse(raw.exercises) as Exercise[]).find((x) => x.id === data.exerciseId);
		if (
			!ex ||
			!Array.isArray(data.answers) ||
			data.answers.length > 100 ||
			data.answers.some((x: unknown) => typeof x !== 'string' || x.length > 12000)
		)
			throw new SchoolError(422, 'Неверный формат ответа.');
		if (data.version !== undefined && Number(data.version) !== raw.version)
			throw new SchoolError(409, 'Урок обновлён. Перезагрузите страницу.');
		const answers = data.answers as string[];
		let score: number | null = null;
		if (ex.kind !== 'text' && ex.kind !== 'cards') {
			const norm = (v: string) => v.trim().toLocaleLowerCase('es');
			const actual = answers.map(norm),
				expected = (ex.answer ?? []).map(norm);
			if (ex.kind === 'multiple') {
				actual.sort();
				expected.sort();
			}
			score = JSON.stringify(actual) === JSON.stringify(expected) ? 1 : 0;
		}
		const feedback =
			ex.kind === 'text'
				? 'Ответ сохранён для проверки преподавателем.'
				: ex.kind === 'cards'
					? 'Повторение сохранено. Это ваша самооценка.'
					: score
						? 'Верно! ' + ex.explanation
						: 'Попробуйте ещё раз. ' + ex.explanation;
		if (!publicDemo && user) {
			const key = this.text(data.requestKey, 150);
			const previous = this.db.one(
				'SELECT score,feedback FROM school.attempts WHERE student_id=? AND request_key=?',
				user.id,
				key,
			);
			if (previous) return previous;
			const id = randomUUID();
			this.db.transaction(() => {
				if (ex.kind === 'text') {
					this.db.run('INSERT INTO pd.responses VALUES(?,?,?)', id, user.id, answers.join('\n'));
					this.saveHomework(user, { lessonId: lesson.id, text: answers.join('\n'), submit: true });
				}
				this.db.run(
					'INSERT INTO school.attempts VALUES(?,?,?,?,?,?,?,?,?,?)',
					id,
					user.id,
					lesson.id,
					ex.id,
					raw.version,
					ex.kind === 'text' ? '[]' : JSON.stringify(answers),
					score,
					feedback,
					key,
					new Date().toISOString(),
				);
			});
		}
		return {
			score,
			feedback:
				publicDemo && ex.kind === 'text'
					? 'Это публичный пример. Войдите в учебный кабинет, чтобы отправить ответ преподавателю.'
					: feedback,
		};
	}
	grant(user: User, data: Row) {
		this.require(user, ['admin', 'teacher']);
		const studentId = this.text(data.studentId, 100),
			courseId = this.text(data.courseId, 100);
		if (!this.canManage(user, studentId)) throw new SchoolError(404, 'Ученик не найден.');
		this.staffCourse(user, courseId);
		if (data.expiresAt && !Number.isFinite(Date.parse(data.expiresAt)))
			throw new SchoolError(422, 'Неверная дата окончания доступа.');
		this.db.run(
			'INSERT INTO school.entitlements(id,student_id,course_id,source,granted_by,expires_at) VALUES(?,?,?,?,?,?) ON CONFLICT(student_id,course_id,source) DO UPDATE SET revoked_at=NULL,expires_at=excluded.expires_at,granted_by=excluded.granted_by',
			randomUUID(),
			studentId,
			courseId,
			data.source ?? 'manual',
			user.id,
			data.expiresAt ? new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(data.expiresAt)?data.expiresAt:data.expiresAt+'Z').toISOString() : null,
		);
		return { id: studentId };
	}
	materials(user: User | null, opts: Row = {}) {
		const page = Math.max(1, Math.min(100000, Number(opts.page) || 1)),
			query = String(opts.q ?? '').slice(0, 100),
			clauses = ['(m.title LIKE ? OR m.description LIKE ?)'],
			params: any[] = [`%${query}%`, `%${query}%`];
		const staff = user && ['admin', 'teacher'].includes(user.role) && !opts.publicOnly;
		if(staff&&user?.role==='teacher')clauses.push("m.privacy!='restricted'");
		if(staff&&opts.folder){clauses.push('m.id IN (SELECT am.material_id FROM school.archive_materials am WHERE am.folder_id IN (WITH RECURSIVE tree(id) AS (SELECT id FROM school.archive_folders WHERE id=? UNION ALL SELECT f.id FROM school.archive_folders f JOIN tree t ON f.parent_id=t.id) SELECT id FROM tree))');params.push(String(opts.folder));}
		if (!staff) {
			clauses.push(
				"m.publication='published' AND m.editorial='checked' AND (m.rights='public_allowed' AND m.privacy='public'" +
					(opts.studentId
						? " OR m.rights IN ('internal','public_allowed') AND m.privacy!='restricted' AND EXISTS(SELECT 1 FROM school.lesson_materials lm JOIN school.lessons l ON l.id=lm.lesson_id JOIN school.modules mo ON mo.id=l.module_id JOIN school.courses c ON c.id=mo.course_id JOIN school.entitlements e ON e.course_id=c.id WHERE lm.material_id=m.id AND e.student_id=? AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?) AND l.publication='published' AND c.publication='published')"
						: '') +
					')',
			);
			if (opts.studentId) params.push(opts.studentId, new Date().toISOString());
		}
		if(staff&&opts.module){clauses.push('m.id IN (SELECT material_id FROM school.archive_module_materials WHERE module_id=?)');params.push(String(opts.module));}
		if (opts.lessonId) {
			clauses.push(
				'EXISTS(SELECT 1 FROM school.lesson_materials lm WHERE lm.lesson_id=? AND lm.material_id=m.id)',
			);
			params.push(opts.lessonId);
		}
		for (const key of ['topic', 'level', 'format', ...(staff ? ['rights', 'publication'] : [])])
			if (opts[key]) {
				clauses.push(`m.${key}=?`);
				params.push(String(opts[key]).slice(0, 100));
			}
		if (opts.favorites && opts.studentId) {
			clauses.push(
				'EXISTS(SELECT 1 FROM school.favorites f WHERE f.material_id=m.id AND f.student_id=?)',
			);
			params.push(opts.studentId);
		}
		const where = clauses.join(' AND '),
			total = Number(
				this.db.one('SELECT COUNT(*) n FROM school.materials m WHERE ' + where, ...params)?.n ?? 0,
			);
		const fields = staff
			? 'm.*'
			: 'm.id,m.title,m.description,m.format,m.topic,m.level,m.instructions,m.missing';
		const items = this.db.all(
			`SELECT ${fields} FROM school.materials m WHERE ${where} ORDER BY m.title,m.id LIMIT 25 OFFSET ?`,
			...params,
			(page - 1) * 25,
		);
		return { items, total, page, pages: Math.max(1, Math.ceil(total / 25)) };
	}
	file(user: User | null, id: string, studentId?: string) {
		if (user && ['parent', 'student'].includes(user.role))
			studentId = this.student(user, studentId);
		const upload = this.db.one('SELECT * FROM pd.uploads WHERE id=?', id);
		if (upload) {
			if (
				!user ||
				!(
					upload.owner_id === user.id ||
					this.db
						.all('SELECT * FROM school.submissions WHERE upload_id=?', id)
						.some((s) =>
							user.role === 'parent'
								? s.student_id === studentId
								: this.canManage(user, s.student_id)&&(user.role==='admin'||s.status!=='draft'),
						)
				)
			)
				throw new SchoolError(404, 'Файл не найден.');
			return {
				name: upload.name,
				mime: upload.mime,
				body: this.db.files.read(resolve(this.db.directory, 'uploads', upload.storage_key)),
			};
		}
		const material = this.db.one('SELECT * FROM school.materials WHERE id=?', id);
		const allowed = this.materialAccess(user, id, studentId);
		if (!material || !allowed || material.missing || !material.storage_key)
			throw new SchoolError(404, 'Вложение недоступно.');
		return {
			name: material.relative_path.split(/[\\/]/).pop(),
			mime: material.format === 'txt' ? 'text/plain; charset=utf-8' : 'application/octet-stream',
			body: this.db.files.read(resolve(this.db.directory, 'files', material.storage_key)),
		};
	}
	materialAccess(user: User | null, id: string, studentId?: string) {
		if (user && ['teacher', 'admin'].includes(user.role))
			return !!this.db.one("SELECT id FROM school.materials WHERE id=?"+(user.role==='teacher'?" AND privacy!='restricted'":''), id);
		if (studentId && user) this.student(user, studentId);
		const item = this.db.one(
			"SELECT * FROM school.materials WHERE id=? AND publication='published' AND editorial='checked'",
			id,
		);
		if (!item) return false;
		if (item.rights === 'public_allowed' && item.privacy === 'public') return true;
		return (
			!!studentId &&
			item.privacy !== 'restricted' &&
			['internal', 'public_allowed'].includes(item.rights) &&
			!!this.db.one(
				"SELECT 1 FROM school.lesson_materials lm JOIN school.lessons l ON l.id=lm.lesson_id JOIN school.modules mo ON mo.id=l.module_id JOIN school.courses c ON c.id=mo.course_id JOIN school.entitlements e ON e.course_id=c.id WHERE lm.material_id=? AND e.student_id=? AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?) AND l.publication='published' AND c.publication='published'",
				id,
				studentId,
				new Date().toISOString(),
			)
		);
	}
	validateExercises(exercises: unknown) {
		if (!Array.isArray(exercises) || exercises.length > 50)
			throw new SchoolError(422, 'Нужен массив до 50 упражнений.');
		const ids = new Set<string>();
		for (const item of exercises) {
			if (!item || typeof item !== 'object')
				throw new SchoolError(422, 'Проверьте структуру упражнения.');
			const ex = item as Exercise;
			this.text(ex.id, 100);
			this.text(ex.prompt, 2000);
			this.text(ex.explanation, 2000);
			if (
				ids.has(ex.id) ||
				!['single', 'multiple', 'matching', 'gaps', 'ordering', 'cards', 'text'].includes(
					ex.kind,
				) ||
				!Array.isArray(ex.options) ||
				ex.options.length > 50
			)
				throw new SchoolError(422, 'Проверьте тип, варианты и уникальность id упражнения.');
			ids.add(ex.id);
			const optionIds = ex.options.map((o) => {
				this.text(o.text, 1000);
				return this.text(o.id, 100);
			});
			if (new Set(optionIds).size !== optionIds.length)
				throw new SchoolError(422, 'Варианты ответа должны иметь разные id.');
			if (ex.kind === 'text') continue;
			if (['matching', 'cards'].includes(ex.kind)) {
				if (!Array.isArray(ex.pairs) || !ex.pairs.length || ex.pairs.length > 50)
					throw new SchoolError(422, 'Добавьте пары для упражнения.');
				for (const pair of ex.pairs) {
					this.text(pair.id, 100);
					this.text(pair.left, 1000);
					this.text(pair.right, 1000);
					if (ex.kind === 'matching' && !optionIds.includes(pair.right))
						throw new SchoolError(422, 'Пара ссылается на неизвестный вариант.');
				}
			}
			if (ex.kind === 'cards') continue;
			if (
				!Array.isArray(ex.answer) ||
				!ex.answer.length ||
				ex.answer.length > 50 ||
				ex.answer.some((a) => typeof a !== 'string' || !a.trim())
			)
				throw new SchoolError(422, 'У закрытого упражнения должен быть ключ ответа.');
			if (
				['single', 'multiple', 'matching', 'ordering'].includes(ex.kind) &&
				ex.answer.some((a) => !optionIds.includes(a))
			)
				throw new SchoolError(422, 'Ключ содержит неизвестный вариант.');
			if (ex.kind === 'single' && (ex.answer.length !== 1 || optionIds.length < 2))
				throw new SchoolError(422, 'Для одного ответа нужны варианты и один ключ.');
			if (ex.kind === 'matching' && ex.answer.length !== ex.pairs!.length)
				throw new SchoolError(422, 'Для каждой строки сопоставления нужен ответ.');
			if (
				ex.kind === 'ordering' &&
				(ex.answer.length !== optionIds.length || new Set(ex.answer).size !== optionIds.length)
			)
				throw new SchoolError(422, 'Порядок должен содержать все слова ровно один раз.');
			if (ex.kind === 'gaps' && ex.answer.length !== 1)
				throw new SchoolError(422, 'Текущий блок пропуска принимает один ответ.');
		}
	}
	async upload(user: User, file: File) {
		this.require(user, ['student']);
		if (!file || file.size < 1 || file.size > 10 * 1024 * 1024)
			throw new SchoolError(422, 'Файл должен быть не больше 10 МБ.');
		if(Number(this.db.one('SELECT COALESCE(SUM(size),0) n FROM pd.uploads WHERE owner_id=? AND created_at>?',user.id,new Date(Date.now()-86400000).toISOString())?.n)+file.size>200*1024*1024)throw new SchoolError(429,'Лимит вложений за сутки — 200 МБ.');
		const bytes = Buffer.from(await file.arrayBuffer()),
			ext = file.name.split('.').pop()?.toLowerCase();
		const valid =
			(ext === 'pdf' && bytes.subarray(0, 5).toString() === '%PDF-') ||
			(['jpg', 'jpeg'].includes(ext ?? '') &&
				bytes[0] === 255 &&
				bytes[1] === 216 &&
				bytes[2] === 255) ||
			(ext === 'png' &&
				bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
			(ext === 'mp3' &&
				(bytes.subarray(0, 3).toString() === 'ID3' ||
					(bytes[0] === 255 && (bytes[1] & 224) === 224))) ||
			(ext === 'wav' &&
				bytes.subarray(0, 4).toString() === 'RIFF' &&
				bytes.subarray(8, 12).toString() === 'WAVE');
		const expected =
			ext === 'pdf'
				? 'application/pdf'
				: ['jpg', 'jpeg'].includes(ext ?? '')
					? 'image/jpeg'
					: ext === 'png'
						? 'image/png'
						: ext === 'mp3'
							? 'audio/mpeg'
							: 'audio/wav';
		if (
			!valid ||
			(file.type && file.type !== expected && !(ext === 'wav' && file.type === 'audio/x-wav'))
		)
			throw new SchoolError(
				422,
				'Разрешены PDF, PNG, JPEG, MP3 и WAV с соответствующим содержимым.',
			);
		const id = randomUUID();
		this.db.files.mkdir(resolve(this.db.directory,'uploads'));
		this.db.files.write(resolve(this.db.directory, 'uploads', id), bytes);
		this.db.run(
			'INSERT INTO pd.uploads VALUES(?,?,?,?,?,?,?)',
			id,
			user.id,
			file.name.replace(/[\x00-\x1f]/g, '').slice(0, 180),
			expected,
			file.size,
			id,
			new Date().toISOString(),
		);
		return { id };
	}
	command(user: User | null, command: string, data: Row): Row {
		return this.db.transaction(() => {
			const output = this.execute(user, command, data);
			if (user)
				this.db.run(
					'INSERT INTO school.audit VALUES(?,?,?,?,?)',
					randomUUID(),
					user.id,
					command,
					String(output.id ?? data.id ?? ''),
					new Date().toISOString(),
				);
			return output;
		});
	}
	execute(user: User | null, command: string, data: Row): Row {
		if (command === 'homework') return this.saveHomework(this.require(user), data);
		if (command === 'review') return this.review(this.require(user), data);
		if (command === 'grant') return this.grant(this.require(user), data);
		if (command === 'attempt') return this.attempt(user, data);
		const actor = this.require(user);
		if (command === 'complete') {
			this.require(actor, ['student']);
			this.lesson(data.id, actor, actor.id);
			this.db.run(
				'INSERT OR IGNORE INTO school.completions VALUES(?,?,?)',
				actor.id,
				data.id,
				new Date().toISOString(),
			);
			return { id: data.id };
		}
		if (command === 'favorite') {
			this.require(actor, ['student']);
			if (!this.materialAccess(actor, data.id, actor.id))
				throw new SchoolError(404, 'Материал не найден.');
			if (
				this.db.one(
					'SELECT 1 FROM school.favorites WHERE student_id=? AND material_id=?',
					actor.id,
					data.id,
				)
			)
				this.db.run(
					'DELETE FROM school.favorites WHERE student_id=? AND material_id=?',
					actor.id,
					data.id,
				);
			else this.db.run('INSERT INTO school.favorites VALUES(?,?)', actor.id, data.id);
			return {};
		}
		if (command === 'profile') {
			const name = this.text(data.name, 120),
				timezone = this.text(data.timezone, 80);
			try {
				new Intl.DateTimeFormat('ru', { timeZone: timezone });
			} catch {
				throw new SchoolError(422, 'Неизвестный часовой пояс.');
			}
			this.db.run(
				'UPDATE pd.users SET name=?,timezone=?,notifications=? WHERE id=?',
				name,
				timezone,
				data.notifications ? 1 : 0,
				actor.id,
			);
			return {};
		}
		this.require(actor, ['teacher', 'admin']);
		if (command === 'createMaterial') {
			const id = randomUUID(),
				text = this.text(data.text, 100000),
				body = Buffer.from(text, 'utf8'),
				checksum = this.hash(text);
			this.db.files.mkdir(resolve(this.db.directory,'files'));
			this.db.files.write(resolve(this.db.directory, 'files', checksum), body);
			this.db.run(
				'INSERT OR IGNORE INTO school.files VALUES(?,?,?,?,?)',
				checksum,
				checksum,
				body.length,
				checksum,
				'txt',
			);
			this.db.run(
				"INSERT INTO school.materials(id,source_id,relative_path,original_path,title,description,description_source,format,bytes,checksum,processing,rights,privacy,storage_key,missing,file_id) VALUES(?,?,?,?,?,?,?,'txt',?,?,'full','internal','internal',?,0,?)",
				id,
				'own-created:' + actor.id,
				id + '.txt',
				id + '.txt',
				this.text(data.title, 200),
				this.text(data.description ?? '', 6000, false),
				'Авторский текст преподавателя',
				body.length,
				checksum,
				checksum,
				checksum,
			);
			return { id };
		}
		if (command === 'credentials') {
			if (!this.canManage(actor, data.studentId)) throw new SchoolError(404, 'Ученик не найден.');
			this.setCredentials(data.studentId, data.login, data.password);
			return {};
		}
		if (command === 'createUser') {
			this.require(actor, ['admin']);
			if (!['teacher', 'admin', 'parent', 'student'].includes(data.role))
				throw new SchoolError(422, 'Выберите роль.');
			const id = randomUUID();
			this.db.run(
				'INSERT INTO pd.users(id,name,role) VALUES(?,?,?)',
				id,
				this.text(data.name, 120),
				data.role,
			);
			this.setCredentials(id, data.login, data.password);
			return { id };
		}
		if (command === 'linkChild') {
			this.require(actor, ['admin']);
			if (
				!this.db.one("SELECT id FROM pd.users WHERE id=? AND role='parent'", data.parentId) ||
				!this.db.one("SELECT id FROM pd.users WHERE id=? AND role='student'", data.studentId)
			)
				throw new SchoolError(422, 'Проверьте роли профилей.');
			this.db.run(
				'INSERT OR IGNORE INTO school.guardians VALUES(?,?)',
				data.parentId,
				data.studentId,
			);
			return {};
		}
		if (command === 'linkTeacher') {
			this.require(actor, ['admin']);
			if (
				!this.db.one("SELECT id FROM pd.users WHERE id=? AND role='teacher'", data.teacherId) ||
				!this.db.one("SELECT id FROM pd.users WHERE id=? AND role='student'", data.studentId)
			)
				throw new SchoolError(422, 'Проверьте роли профилей.');
			this.db.run(
				'INSERT OR IGNORE INTO school.teacher_students VALUES(?,?)',
				data.teacherId,
				data.studentId,
			);
			return {};
		}
		if (command === 'courseOwner') {
			this.require(actor, ['admin']);
			this.staffCourse(actor, data.courseId);
			if (
				!this.db.one(
					"SELECT id FROM pd.users WHERE id=? AND role IN ('teacher','admin')",
					data.teacherId,
				)
			)
				throw new SchoolError(422, 'Преподаватель не найден.');
			this.db.run(
				'UPDATE school.courses SET owner_id=?,version=version+1 WHERE id=?',
				data.teacherId,
				data.courseId,
			);
			return {};
		}
		if (command === 'revoke') {
			const item = this.db.one('SELECT * FROM school.entitlements WHERE id=?', data.id);
			if (!item || !this.canManage(actor, item.student_id))
				throw new SchoolError(404, 'Назначение не найдено.');
			this.staffCourse(actor, item.course_id);
			this.db.run(
				'UPDATE school.entitlements SET revoked_at=? WHERE id=?',
				new Date().toISOString(),
				data.id,
			);
			return {};
		}
		if (command === 'note') {
			if (!this.canManage(actor, data.studentId)) throw new SchoolError(404, 'Ученик не найден.');
			this.db.run(
				'INSERT INTO pd.notes VALUES(?,?) ON CONFLICT(student_id) DO UPDATE SET text=excluded.text',
				data.studentId,
				this.text(data.text ?? '', 12000, false),
			);
			return {};
		}
		if (command === 'course') {
			const title = this.text(data.title, 160),
				summary = this.text(data.summary, 2000),
				id = data.id || randomUUID();
			if (data.id) this.staffCourse(actor, id);
			const publication = data.publication === 'published' ? 'published' : 'draft',
				status = ['available', 'enrolling', 'preparing'].includes(data.status)
					? data.status
					: 'preparing';
			if (data.id) {
				const result = this.db.run(
					'UPDATE school.courses SET title=?,summary=?,level=?,topic=?,audience=?,format=?,publication=?,status=?,version=version+1 WHERE id=? AND version=?',
					title,
					summary,
					this.text(data.level ?? 'A1', 30),
					this.text(data.topic ?? 'Общее', 100),
					this.text(data.audience ?? 'Не уточнена', 160),
					this.text(data.format ?? 'Уточняется', 160),
					publication,
					status,
					id,
					Number(data.version),
				);
				if (!result.changes) throw new SchoolError(409, 'Курс изменился. Обновите страницу.');
			} else
				this.db.run(
					'INSERT INTO school.courses(id,slug,title,summary,owner_id) VALUES(?,?,?,?,?)',
					id,
					id,
					title,
					summary,
					actor.id,
				);
			return { id };
		}
		if (command === 'module') {
			this.staffCourse(actor, data.courseId);
			const id = randomUUID();
			this.db.run(
				'INSERT INTO school.modules VALUES(?,?,?,?)',
				id,
				data.courseId,
				this.text(data.title, 160),
				Number(
					this.db.one(
						'SELECT COALESCE(MAX(position),0)+1 n FROM school.modules WHERE course_id=?',
						data.courseId,
					)?.n,
				),
			);
			return { id };
		}
		if (command === 'lesson') {
			const mod = this.db.one('SELECT * FROM school.modules WHERE id=?', data.moduleId);
			if (!mod) throw new SchoolError(404, 'Модуль не найден.');
			this.staffCourse(actor, mod.course_id);
			let blocks, exercises;
			try {
				blocks = JSON.parse(data.blocks);
				exercises = JSON.parse(data.exercises ?? '[]');
			} catch {
				throw new SchoolError(422, 'Проверьте JSON блоков и упражнений.');
			}
			if (
				!Array.isArray(blocks) ||
				blocks.length > 100 ||
				blocks.some(
					(b: Row) =>
						!['text', 'image', 'audio', 'video', 'attachment'].includes(b.type) ||
						(b.type === 'text' && typeof b.text !== 'string'),
				) ||
				JSON.stringify(blocks).length > 100000
			)
				throw new SchoolError(422, 'Некорректные блоки урока.');
			if (
				!Array.isArray(exercises) ||
				exercises.length > 50 ||
				exercises.some(
					(e: Row) =>
						!e.id ||
						!['single', 'multiple', 'matching', 'gaps', 'ordering', 'cards', 'text'].includes(
							e.kind,
						) ||
						!e.prompt ||
						!Array.isArray(e.options) ||
						!e.explanation,
				) ||
				new Set(exercises.map((e: Row) => e.id)).size !== exercises.length
			)
				throw new SchoolError(422, 'Проверьте упражнения и уникальность id.');
			this.validateExercises(exercises);
			if (data.dueAt && !Number.isFinite(Date.parse(data.dueAt)))
				throw new SchoolError(422, 'Проверьте срок задания.');
			const id = data.id || randomUUID(),
				fields = [
					this.text(data.title, 160),
					this.text(data.goal, 1000),
					JSON.stringify(blocks),
					JSON.stringify(exercises),
					this.text(data.homework ?? '', 4000, false),
					this.text(data.teacher_notes ?? '', 12000, false),
					Math.max(1, Number(data.position) || 1),
					data.publication === 'published' ? 'published' : 'draft',
				];
			if (data.id) {
				const prior = this.db.one(
					'SELECT l.*,m.course_id FROM school.lessons l JOIN school.modules m ON m.id=l.module_id WHERE l.id=?',
					id,
				);
				if (!prior || prior.module_id !== mod.id) throw new SchoolError(404, 'Урок не найден.');
				const result = this.db.run(
					'UPDATE school.lessons SET title=?,goal=?,blocks=?,exercises=?,homework=?,teacher_notes=?,position=?,publication=?,version=version+1 WHERE id=? AND version=?',
					...fields,
					id,
					Number(data.version),
				);
				if (!result.changes) throw new SchoolError(409, 'Урок изменился. Обновите страницу.');
			} else
				this.db.run(
					'INSERT INTO school.lessons(id,module_id,title,goal,blocks,exercises,homework,teacher_notes,position,publication) VALUES(?,?,?,?,?,?,?,?,?,?)',
					id,
					mod.id,
					...fields,
				);
			this.db.run(
				'INSERT INTO school.assignments(id,lesson_id,title,instructions,due_at) VALUES(?,?,?,?,?) ON CONFLICT(lesson_id) DO UPDATE SET title=excluded.title,instructions=excluded.instructions,due_at=excluded.due_at',
				id,
				id,
				fields[0],
				fields[4],
				data.dueAt ? new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(data.dueAt)?data.dueAt:data.dueAt+'Z').toISOString() : null,
			);
			this.db.run('DELETE FROM school.lesson_materials WHERE lesson_id=?', id);
			for (const materialId of String(data.materialIds ?? '')
				.split(',')
				.map((x) => x.trim())
				.filter(Boolean)) {
				if (!this.db.one('SELECT id FROM school.materials WHERE id=?', materialId))
					throw new SchoolError(422, 'Материал не найден.');
				this.db.run('INSERT OR IGNORE INTO school.lesson_materials VALUES(?,?)', id, materialId);
			}
			return { id };
		}
		if (command === 'assignLead') {
			this.require(actor, ['admin']);
			if (!this.db.one("SELECT id FROM pd.users WHERE id=? AND role='teacher'", data.teacherId))
				throw new SchoolError(422, 'Преподаватель не найден.');
			this.db.run(
				'UPDATE lead_funnel SET assigned_teacher_id=? WHERE id=?',
				data.teacherId,
				data.id,
			);
			return {};
		}
		if (command === 'lead') {
			if (
				actor.role !== 'admin' &&
				!this.db.one(
					'SELECT 1 FROM lead_funnel WHERE id=? AND assigned_teacher_id=?',
					data.id,
					actor.id,
				)
			)
				throw new SchoolError(404, 'Заявка не найдена.');
			if (!['new', 'contacted', 'enrolled', 'closed'].includes(data.status))
				throw new SchoolError(422, 'Неизвестный статус.');
			this.db.transaction(() => {
				this.db.run(
					'UPDATE lead_funnel SET status=?,version=version+1 WHERE id=?',
					data.status,
					data.id,
				);
				this.db.run(
					'UPDATE pd.leads SET notes=? WHERE id=?',
					this.text(data.notes ?? '', 4000, false),
					data.id,
				);
			});
			return {};
		}
		if (command === 'enrolLead') {
			if (
				actor.role !== 'admin' &&
				!this.db.one(
					'SELECT 1 FROM lead_funnel WHERE id=? AND assigned_teacher_id=?',
					data.id,
					actor.id,
				)
			)
				throw new SchoolError(404, 'Заявка не найдена.');
			const lead = this.db.one('SELECT * FROM pd.leads WHERE id=?', data.id);
			if (!lead) throw new SchoolError(404, 'Заявка не найдена.');
			const existing = this.db.one(
				'SELECT enrolled_student_id FROM lead_funnel WHERE id=?',
				lead.id,
			)?.enrolled_student_id;
			if (existing) return { id: existing };
			const id = randomUUID();
			this.db.transaction(() => {
				this.db.run("INSERT INTO pd.users(id,name,role) VALUES(?,?,'student')", id, lead.name);
				this.db.run(
					'INSERT INTO school.teacher_students VALUES(?,?)',
					actor.role === 'teacher'
						? actor.id
						: (this.db.one('SELECT assigned_teacher_id FROM lead_funnel WHERE id=?', lead.id)
								?.assigned_teacher_id ?? actor.id),
					id,
				);
				this.grant(actor, { studentId: id, courseId: data.courseId });
				this.db.run(
					"UPDATE lead_funnel SET status='enrolled',enrolled_student_id=? WHERE id=?",
					id,
					lead.id,
				);
			});
			return { id };
		}
		if (command === 'event') {
			const studentId = this.text(data.studentId, 100);
			if (!this.canManage(actor, studentId)) throw new SchoolError(404, 'Ученик не найден.');
			if (!Number.isFinite(Date.parse(data.startsAt)))
				throw new SchoolError(422, 'Проверьте дату занятия.');
			if (data.meetingUrl && !/^https:\/\//.test(data.meetingUrl))
				throw new SchoolError(422, 'Ссылка встречи должна начинаться с https://');
			const id = randomUUID();
			this.db.run(
				'INSERT INTO school.events(id,title,teacher_id,student_id,starts_at,timezone,meeting_url) VALUES(?,?,?,?,?,?,?)',
				id,
				this.text(data.title, 160),
				actor.id,
				studentId,
				new Date(
					/(?:Z|[+-]\d{2}:\d{2})$/.test(data.startsAt) ? data.startsAt : data.startsAt + 'Z',
				).toISOString(),
				'UTC',
				data.meetingUrl ? this.text(data.meetingUrl, 1000) : null,
			);
			return { id };
		}
		if (command === 'eventStatus') {
			const event = this.db.one('SELECT * FROM school.events WHERE id=?', data.id);
			if (!event || (actor.role !== 'admin' && event.teacher_id !== actor.id))
				throw new SchoolError(404, 'Занятие не найдено.');
			if (!['scheduled', 'cancelled', 'rescheduled'].includes(data.status))
				throw new SchoolError(422, 'Неизвестный статус.');
			let starts = event.starts_at;
			if (data.startsAt) {
				if (!Number.isFinite(Date.parse(data.startsAt)))
					throw new SchoolError(422, 'Проверьте новую дату.');
				starts = new Date(
					/(?:Z|[+-]\d{2}:\d{2})$/.test(data.startsAt) ? data.startsAt : data.startsAt + 'Z',
				).toISOString();
			}
			this.db.run(
				'UPDATE school.events SET status=?,starts_at=? WHERE id=?',
				data.status,
				starts,
				data.id,
			);
			return {};
		}
		if (command === 'group') {
			const id = randomUUID();
			this.db.run(
				'INSERT INTO school.groups VALUES(?,?,?)',
				id,
				this.text(data.title, 160),
				actor.id,
			);
			return { id };
		}
		if (command === 'groupMember' || command === 'groupGrant') {
			const group = this.db.one('SELECT * FROM school.groups WHERE id=?', data.groupId);
			if (!group || (actor.role !== 'admin' && group.teacher_id !== actor.id))
				throw new SchoolError(404, 'Группа не найдена.');
			if (command === 'groupMember') {
				if (!this.canManage(actor, data.studentId)) throw new SchoolError(404, 'Ученик не найден.');
				this.db.run(
					'INSERT OR IGNORE INTO school.group_members VALUES(?,?)',
					group.id,
					data.studentId,
				);
			} else {
				for (const m of this.db.all(
					'SELECT * FROM school.group_members WHERE group_id=?',
					group.id,
				))
					this.grant(actor, {
						studentId: m.student_id,
						courseId: data.courseId,
						source: 'group:' + group.id,
					});
			}
			return {};
		}
		if (command === 'groupRemove') {
			const group = this.db.one('SELECT * FROM school.groups WHERE id=?', data.groupId);
			if (!group || (actor.role !== 'admin' && group.teacher_id !== actor.id))
				throw new SchoolError(404, 'Группа не найдена.');
			this.db.run(
				'DELETE FROM school.group_members WHERE group_id=? AND student_id=?',
				group.id,
				data.studentId,
			);
			this.db.run(
				'UPDATE school.entitlements SET revoked_at=? WHERE student_id=? AND source=?',
				new Date().toISOString(),
				data.studentId,
				'group:' + group.id,
			);
			return {};
		}
		if (command === 'material' || command === 'bulkMaterial') {
			const ids =
				command === 'bulkMaterial'
					? String(data.ids)
							.split(',')
							.map((x) => x.trim())
							.filter(Boolean)
					: [data.id];
			if (!ids.length || ids.length > 100)
				throw new SchoolError(422, 'Выберите от 1 до 100 записей.');
			for (const id of ids) {
				const material = this.db.one('SELECT * FROM school.materials WHERE id=?', id);
				if (!material || !this.materialAccess(actor,id)) throw new SchoolError(404, 'Материал не найден.');
				if (command === 'bulkMaterial') {
					this.db.run(
						'UPDATE school.materials SET topic=? WHERE id=?',
						this.text(data.topic ?? '', 100, false),
						id,
					);
					continue;
				}
				if (
					!['unknown', 'internal', 'public_allowed'].includes(data.rights) ||
					!['unchecked', 'checked', 'needs_fix'].includes(data.editorial) ||
					!['draft', 'published', 'archived'].includes(data.publication)
				)
					throw new SchoolError(422, 'Неизвестные статусы.');
				const evidence = this.text(data.rights_note ?? material.rights_note ?? '', 2000, false),
					privacy =
						material.privacy === 'restricted'
							? 'restricted'
							: data.publicAccess === 'true'
								? 'public'
								: 'internal';
				if (data.rights === 'public_allowed' && material.rights !== 'public_allowed') {
					this.require(actor, ['admin']);
					if (!evidence) throw new SchoolError(422, 'Укажите основание разрешения на публикацию.');
				}
				if (material.privacy === 'restricted' && data.publicAccess === 'true')
					throw new SchoolError(422, 'Персональные материалы нельзя открыть этой командой.');
				if (
					privacy === 'public' &&
					(data.rights !== 'public_allowed' ||
						data.editorial !== 'checked' ||
						(!evidence && material.source_id !== 'own-demo'))
				)
					throw new SchoolError(
						422,
						'Для открытого каталога нужны проверка и подтверждённые права.',
					);
				if (data.publication === 'published' && data.rights === 'unknown')
					throw new SchoolError(422, 'Сначала подтвердите права.');
				this.db.run(
					'UPDATE school.materials SET title=?,description=?,topic=?,level=?,editorial=?,publication=?,rights=?,rights_note=?,privacy=? WHERE id=?',
					this.text(data.title, 200),
					this.text(data.description ?? '', 6000, false),
					this.text(data.topic ?? '', 100, false),
					this.text(data.level ?? '', 30, false),
					data.editorial,
					data.publication,
					data.rights,
					evidence,
					privacy,
					id,
				);
			}
			return {};
		}
		if (command === 'settings') {
			this.require(actor, ['admin']);
			if (data.faq) {
				let faq;
				try {
					faq = JSON.parse(data.faq);
				} catch {
					throw new SchoolError(422, 'Проверьте JSON вопросов.');
				}
				if (
					!Array.isArray(faq) ||
					faq.length > 50 ||
					faq.some(
						(f: Row) =>
							typeof f.question !== 'string' ||
							typeof f.answer !== 'string' ||
							!f.question.trim() ||
							f.answer.length > 4000,
					)
				)
					throw new SchoolError(422, 'Нужен массив question/answer.');
				this.db.run(
					'INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
					'faq',
					JSON.stringify(faq),
				);
			}
			for (const key of [
				'name',
				'teacher',
				'email',
				'telegram',
				'price',
				'schedule',
				'heroTitle',
				'heroDescription',
			])
				this.db.run(
					'INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
					key,
					JSON.stringify(this.text(data[key] ?? '', 2000, false)),
				);
			return {};
		}
		throw new SchoolError(400, 'Неизвестное действие.');
	}
}
