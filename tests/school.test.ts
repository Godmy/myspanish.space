import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSchoolDatabase } from '../src/lib/server/school/database.ts';
import { seedSchool } from '../src/lib/server/school/seed.ts';
import { SchoolService } from '../src/lib/server/school/service.ts';
import { previewImport, applyImport, parseCsv } from '../src/lib/server/school/importer.ts';
import { SchoolError, type User } from '../src/lib/server/school/types.ts';

async function setup(t: any) {
	const dir = mkdtempSync(join(tmpdir(), 'spanish-test-')),
		db = await openSchoolDatabase(dir);
	seedSchool(db);
	const service = new SchoolService(db, true);
	t.after(() => {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});
	const u = (id: string) => db.one('SELECT * FROM pd.users WHERE id=?', id) as User;
	return {
		dir,
		db,
		s: service,
		a: u('student'),
		b: u('student-b'),
		parent: u('parent'),
		otherParent: u('parent-b'),
		teacher: u('teacher'),
		otherTeacher: u('teacher-b'),
		admin: u('admin'),
	};
}
const denied = (fn: () => unknown, status = 404) =>
	assert.throws(fn, (e: any) => e instanceof SchoolError && e.status === status);

test('sessions persist, revoke, expire; development entry is disabled in production', async (t) => {
	const { s, db } = await setup(t);
	const login = s.login('student');
	assert.equal(s.user(login.token)?.id, 'student');
	s.logout(login.token);
	assert.equal(s.user(login.token), null);
	const session = s.login('student');
	db.run('UPDATE pd.sessions SET expires_at=0');
	assert.equal(s.user(session.token), null);
	denied(() => new SchoolService(db, false).login('admin'), 403);
});
test('student sees assigned published course; another student cannot open a direct lesson or attempt', async (t) => {
	const { s, a, b, db } = await setup(t);
	assert.equal(s.lesson('hola', a, a.id).id, 'hola');
	denied(() => s.lesson('hola', b, b.id));
	denied(() =>
		s.attempt(b, { lessonId: 'hola', exerciseId: 'hello', answers: ['hola'], requestKey: 'x' }),
	);
	db.run("UPDATE school.lessons SET publication='draft' WHERE id='hola'");
	denied(() => s.lesson('hola', a, a.id));
});
test('parent can only select linked children and cannot submit work or mark completion', async (t) => {
	const { s, parent, otherParent } = await setup(t);
	assert.equal(s.student(parent), 'student');
	denied(() => s.student(parent, 'student-b'));
	denied(() => s.student(otherParent, 'student'));
	denied(
		() => s.command(parent, 'homework', { lessonId: 'hola', text: 'Hola', submit: true }),
		403,
	);
	denied(() => s.command(parent, 'complete', { id: 'hola' }), 403);
});
test('learner DTO never contains teacher notes, answer keys or matching targets', async (t) => {
	const { s, a } = await setup(t);
	const lesson = s.lesson('me-llamo', a, a.id);
	assert.equal('teacher_notes' in lesson, false);
	assert(lesson.exercises.every((x: any) => !('answer' in x)));
	assert(
		lesson.exercises
			.find((x: any) => x.kind === 'matching')
			.pairs.every((p: any) => !('right' in p)),
	);
});
test('lead persists idempotently and teacher creates student + course access', async (t) => {
	const { s, teacher, db } = await setup(t);
	const data = {
		name: 'Тест',
		contact: 'test@example.com',
		direction: 'demo-a1',
		consent: true,
		requestKey: 'lead-test',
	};
	const lead = s.enquire(data, '127.0.0.1');
	assert.equal(s.enquire(data, '127.0.0.1').id, lead.id);
	assert.equal(db.one('SELECT count(*) n FROM lead_funnel')?.n, 1);
	const enrol = s.command(teacher, 'enrolLead', { id: lead.id, courseId: 'demo-a1' });
	const user = db.one('SELECT * FROM pd.users WHERE id=?', enrol.id) as User;
	assert.equal(s.lesson('hola', user, user.id).id, 'hola');
	denied(() => s.enquire({ ...data, requestKey: 'bad', consent: 'true' }, 'x'), 422);
});
test('exercise results persist, retry keys do not duplicate, old versions are rejected', async (t) => {
	const { s, a, db } = await setup(t);
	const data = {
		lessonId: 'hola',
		exerciseId: 'hello',
		answers: ['hola'],
		requestKey: 'attempt-1',
		version: 1,
	};
	assert.equal(s.attempt(a, data).score, 1);
	s.attempt(a, data);
	assert.equal(db.one('SELECT count(*) n FROM school.attempts')?.n, 1);
	assert.equal(s.attempt(a, { ...data, answers: ['adios'], requestKey: 'attempt-2' }).score, 0);
	denied(() => s.attempt(a, { ...data, version: 0 }), 409);
});
test('all seven exercise types operate; text is private and flashcards are not scored as knowledge', async (t) => {
	const { s, a, db } = await setup(t);
	const run = (lessonId: string, exerciseId: string, answers: string[]) =>
		s.attempt(a, { lessonId, exerciseId, answers, requestKey: crypto.randomUUID() });
	assert.equal(run('hola', 'greetings', ['buenos', 'hola']).score, 1);
	assert.equal(run('me-llamo', 'pairs', ['hello', 'thanks', 'bye']).score, 1);
	assert.equal(run('me-llamo', 'gap', ['  LLAMO ']).score, 1);
	assert.equal(run('me-llamo', 'order', ['me', 'llamo', 'ana']).score, 1);
	assert.equal(run('hola', 'cards', ['1']).score, null);
	assert.equal(run('dialogue', 'write', ['Me llamo Ana.']).score, null);
	assert.equal(
		db.one("SELECT text FROM pd.responses WHERE text='Me llamo Ana.'")?.text,
		'Me llamo Ana.',
	);
	assert.equal(
		db.one("SELECT answers FROM school.attempts WHERE exercise_id='write'")?.answers,
		'[]',
	);
});
test('homework cycle: draft, submit, return, new attempt, checked; foreign work is inaccessible', async (t) => {
	const { s, a, b, parent, teacher, otherTeacher } = await setup(t);
	const draft = s.saveHomework(a, { lessonId: 'hola', text: 'Hola', submit: false });
	assert.equal(s.submission(a, draft.id, a.id).status, 'draft');
	const submitted = s.saveHomework(a, { lessonId: 'hola', text: '¡Hola!', submit: true });
	assert.equal(submitted.id, draft.id);
	denied(() => s.submission(b, draft.id, b.id));
	denied(() => s.submission(otherTeacher, draft.id));
	assert.equal(s.submission(parent, draft.id, s.student(parent)).text, '¡Hola!');
	s.review(teacher, { id: draft.id, text: 'Добавьте спасибо.', decision: 'returned', version: 2 });
	const next = s.saveHomework(a, { lessonId: 'hola', text: '¡Hola! Gracias.', submit: true });
	assert.notEqual(next.id, draft.id);
	s.review(teacher, { id: next.id, text: 'Верно, спасибо!', decision: 'checked', version: 1 });
	assert.equal(s.submission(a, next.id, a.id).status, 'checked');
	assert.equal(s.submission(a, next.id, a.id).history.length, 2);
	denied(
		() => s.review(teacher, { id: next.id, text: 'Повтор', decision: 'checked', version: 1 }),
		409,
	);
});
test('expired/revoked access closes lessons and exercises', async (t) => {
	const { s, a, admin, db } = await setup(t);
	const grant = db.one('SELECT * FROM school.entitlements WHERE student_id=?', a.id)!;
	s.command(admin, 'revoke', { id: grant.id });
	denied(() => s.lesson('hola', a, a.id));
	s.grant(admin, { studentId: a.id, courseId: 'demo-a1', expiresAt: '2000-01-01' });
	denied(() => s.lesson('hola', a, a.id));
});
test('private upload cannot be fetched or attached by another student or unrelated parent', async (t) => {
	const { s, a, b, parent, otherParent, teacher, otherTeacher } = await setup(t);
	const file = new File([Buffer.from('%PDF-1.4\nDemo')], 'ответ.pdf', { type: 'application/pdf' }),
		upload = await s.upload(a, file);
	denied(() => s.file(b, upload.id, b.id));
	denied(() => s.file(otherParent, upload.id, 'student-b'));
	denied(() => s.saveHomework(b, { lessonId: 'hola', uploadId: upload.id, submit: true }));
	const sub = s.saveHomework(a, { lessonId: 'hola', uploadId: upload.id, submit: true });
	assert(s.file(parent, upload.id, s.student(parent)).body.length > 0);
	assert(s.file(teacher, upload.id).body.length > 0);
	denied(() => s.file(otherTeacher, upload.id));
	assert.equal(s.submission(teacher, sub.id).upload_id, upload.id);
});
test('uploads reject executable/HTML, MIME spoof and oversized files', async (t) => {
	const { s, a } = await setup(t);
	await assert.rejects(() =>
		s.upload(a, new File(['<script>alert(1)</script>'], 'x.pdf', { type: 'application/pdf' })),
	);
	await assert.rejects(() => s.upload(a, new File(['%PDF-1.4'], 'x.pdf', { type: 'image/png' })));
	await assert.rejects(() =>
		s.upload(
			a,
			new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' }),
		),
	);
});
test('teacher authors module + lesson, publishes, grants; another teacher cannot edit', async (t) => {
	const { s, teacher, otherTeacher, b, admin, db } = await setup(t);
	const course = s.command(teacher, 'course', {
		title: 'Тестовый курс',
		summary: 'Собственный материал',
	});
	const module = s.command(teacher, 'module', { courseId: course.id, title: 'Модуль' });
	const lesson = s.command(teacher, 'lesson', {
		moduleId: module.id,
		title: 'Новый урок',
		goal: 'Проверить создание',
		blocks: JSON.stringify([{ type: 'text', text: 'Hola' }]),
		exercises: '[]',
		publication: 'published',
	});
	denied(() => s.staffCourse(otherTeacher, course.id));
	s.command(teacher, 'course', {
		...db.one('SELECT * FROM school.courses WHERE id=?', course.id),
		publication: 'published',
	});
	db.run('INSERT INTO school.teacher_students VALUES(?,?)', teacher.id, b.id);
	s.grant(teacher, { studentId: b.id, courseId: course.id });
	assert.equal(s.lesson(lesson.id, b, b.id).title, 'Новый урок');
	assert.equal(s.course(course.id, admin, undefined, true).modules.length, 1);
});
test('CSV handles Cyrillic, BOM, quoted multiline; missing files remain metadata, legacy processed is unknown', async (t) => {
	const { db } = await setup(t);
	const csv =
		'\uFEFFrelative_path;title;description;processed\r\n"01 Курсы/А1/урок.pdf";"Привет";"Первая строка\nВторая строка";обработано';
	assert.equal(parseCsv(csv).length, 2);
	const preview = await previewImport(csv, 'archive');
	assert.equal(preview.missing, 1);
	await applyImport(db, csv, 'archive', preview.digest);
	const record = db.one("SELECT * FROM school.materials WHERE source_id='archive'")!;
	assert.equal(record.processing, null);
	assert.equal(record.legacy_processed, 'обработано');
	assert.equal(record.rights, 'unknown');
	assert.equal(record.description, 'Первая строка\nВторая строка');
});
test('import is idempotent, preview is read-only, path escape and student work are excluded', async (t) => {
	const { db, s } = await setup(t);
	const csv =
		'relative_path,title\n01 Курсы/a.pdf,A\n../outside.pdf,X\n13 Работы учеников и проверка/a.pdf,Private';
	const before = Number(db.one('SELECT count(*) n FROM school.materials')?.n),
		preview = await previewImport(csv, 'source');
	assert.equal(db.one('SELECT count(*) n FROM school.materials')?.n, before);
	assert.equal(preview.errors.length, 2);
	await applyImport(db, csv, 'source', preview.digest);
	await applyImport(db, csv, 'source', preview.digest);
	assert.equal(db.one('SELECT count(*) n FROM school.materials')?.n, before + 1);
	assert.equal(s.materials(null).items.length, 1);
	await assert.rejects(() => applyImport(db, csv + '\nb.pdf,B', 'source', preview.digest));
});
test('checksum distinguishes same names and finds identical content; source files stay unchanged', async (t) => {
	const { dir, db } = await setup(t);
	const root = join(dir, 'archive');
	for (const sub of ['а', 'б', 'в']) mkdirSync(join(root, sub), { recursive: true });
	writeFileSync(join(root, 'а', 'урок.txt'), 'один');
	writeFileSync(join(root, 'б', 'урок.txt'), 'два');
	writeFileSync(join(root, 'в', 'копия.txt'), 'один');
	const csv = 'relative_path,title\nа/урок.txt,A\nб/урок.txt,B\nв/копия.txt,C';
	const preview = await previewImport(csv, 'physical', root);
	assert.equal(preview.missing, 0);
	assert.equal(preview.duplicates, 1);
	assert.notEqual(preview.records[0].checksum, preview.records[1].checksum);
	await applyImport(db, csv, 'physical', preview.digest, root);
	assert.equal(readFileSync(join(root, 'а', 'урок.txt'), 'utf8'), 'один');
	assert.equal(db.one("SELECT count(*) n FROM school.materials WHERE source_id='physical'")?.n, 3);
});

test('password authentication uses a salted hash, limits failures and revokes old sessions on reset', async (t) => {
	const { s, db, a } = await setup(t);
	s.setCredentials(a.id, 'learner-test', 'Only-a-test-password-942!');
	const record = db.one('SELECT * FROM pd.credentials WHERE user_id=?', a.id)!;
	assert.notEqual(record.password_hash, 'Only-a-test-password-942!');
	const production = new SchoolService(db, false),
		login = production.authenticate('learner-test', 'Only-a-test-password-942!', 'one-ip');
	assert.equal(production.user(login.token)?.id, a.id);
	s.setCredentials(a.id, 'learner-test', 'Another-test-password-813!');
	assert.equal(s.user(login.token), null);
	for (let i = 0; i < 8; i++)
		denied(() => production.authenticate('learner-test', 'wrong-test-password', 'blocked-ip'), 401);
	denied(
		() => production.authenticate('learner-test', 'Another-test-password-813!', 'blocked-ip'),
		429,
	);
});
test('production content seed creates no users, sessions or automatic grants', async (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'spanish-test-')),
		db = await openSchoolDatabase(directory);
	t.after(() => {
		db.close();
		rmSync(directory, { recursive: true, force: true });
	});
	seedSchool(db, false, 'school-content');
	assert.equal(db.one('SELECT count(*) n FROM pd.users')?.n, 0);
	assert.equal(db.one('SELECT count(*) n FROM school.entitlements')?.n, 0);
	assert.equal(db.one("SELECT value FROM settings WHERE key='__development_seed'"), undefined);
	assert.equal(db.one('SELECT count(*) n FROM school.lessons')?.n, 3);
});
test('private course material closes on revoked access and forged parent child context is denied', async (t) => {
	const { s, a, b, parent, admin, db } = await setup(t);
	db.run(
		"INSERT INTO school.materials(id,source_id,relative_path,title,description_source,editorial,publication,rights,privacy,missing,storage_key) VALUES('private','test','private.txt','Private','test','checked','published','internal','internal',0,'demo-words.txt')",
	);
	db.run("INSERT INTO school.lesson_materials VALUES('hola','private')");
	assert(s.file(a, 'private', a.id).body.length > 0);
	denied(() => s.file(b, 'private', b.id));
	denied(() => s.file(parent, 'private', 'student-b'));
	const entitlement = db.one('SELECT id FROM school.entitlements WHERE student_id=?', a.id)!;
	s.command(admin, 'revoke', { id: entitlement.id });
	denied(() => s.file(a, 'private', a.id));
});
test('group removal revokes only group grants and preserves manual course access', async (t) => {
	const { s, a, teacher, db } = await setup(t);
	s.command(teacher, 'groupGrant', { groupId: 'beginners', courseId: 'demo-a1' });
	assert.equal(db.one('SELECT count(*) n FROM school.entitlements WHERE student_id=?', a.id)?.n, 2);
	s.command(teacher, 'groupRemove', { groupId: 'beginners', studentId: a.id });
	assert(s.access(a.id, 'demo-a1'));
	assert(
		db.one("SELECT revoked_at FROM school.entitlements WHERE source='group:beginners'")?.revoked_at,
	);
});
test('material publication needs administrator evidence; bulk edits cannot change rights', async (t) => {
	const { s, db, teacher, admin } = await setup(t);
	db.run(
		"INSERT INTO school.materials(id,source_id,relative_path,title,description_source) VALUES('unknown','publisher','Twinkl.pdf','Closed','CSV')",
	);
	const data = {
		id: 'unknown',
		title: 'Closed',
		description: '',
		topic: '',
		level: '',
		rights: 'public_allowed',
		editorial: 'checked',
		publication: 'published',
		publicAccess: 'true',
	};
	denied(() => s.command(teacher, 'material', { ...data, rights_note: 'not permission' }), 403);
	denied(() => s.command(admin, 'material', data), 422);
	assert.equal(
		s.materials(null).items.some((x) => x.id === 'unknown'),
		false,
	);
	s.command(admin, 'bulkMaterial', { ids: 'unknown', topic: 'Words', rights: 'public_allowed' });
	assert.equal(db.one("SELECT rights FROM school.materials WHERE id='unknown'")?.rights, 'unknown');
	s.command(admin, 'material', {
		...data,
		rights_note: 'Test permission provided explicitly by the administrator',
	});
	assert(s.materials(null).items.some((x) => x.id === 'unknown'));
});
test('invalid lesson content rolls back the whole command; closed exercises require valid answer keys', async (t) => {
	const { s, teacher, db } = await setup(t);
	const before = db.one("SELECT title FROM school.lessons WHERE id='hola'")?.title;
	const lesson = {
		id: 'hola',
		moduleId: 'first',
		title: 'Changed',
		goal: 'test',
		blocks: '[{"type":"text","text":"Hola"}]',
		exercises: '[]',
		version: 1,
		materialIds: 'not-found',
	};
	denied(() => s.command(teacher, 'lesson', lesson), 422);
	assert.equal(db.one("SELECT title FROM school.lessons WHERE id='hola'")?.title, before);
	denied(
		() =>
			s.command(teacher, 'lesson', {
				...lesson,
				materialIds: '',
				exercises: JSON.stringify([
					{
						id: 'bad',
						kind: 'single',
						prompt: 'Test',
						options: [
							{ id: 'a', text: 'A' },
							{ id: 'b', text: 'B' },
						],
						explanation: 'Test',
						answer: ['unknown'],
					},
				]),
			}),
		422,
	);
});
test('repeat enrolment of a lead returns the existing student, not a second account', async (t) => {
	const { s, teacher, db } = await setup(t);
	const lead = s.enquire(
			{
				name: 'Test',
				contact: 'user@example.com',
				direction: 'demo-a1',
				consent: true,
				requestKey: 'enrol-once',
			},
			'x',
		),
		first = s.command(teacher, 'enrolLead', { id: lead.id, courseId: 'demo-a1' }),
		next = s.command(teacher, 'enrolLead', { id: lead.id, courseId: 'demo-a1' });
	assert.equal(next.id, first.id);
	assert.equal(db.one("SELECT count(*) n FROM pd.users WHERE name='Test'")?.n, 1);
});

test('draft text and attachments stay out of the teacher queue until submission',async t=>{
 const {s,a,teacher}=await setup(t);const upload=await s.upload(a,new File(['%PDF-1.4\nDraft'],'draft.pdf',{type:'application/pdf'}));const draft=s.saveHomework(a,{lessonId:'hola',text:'Private draft',uploadId:upload.id,submit:false});assert.equal(s.submissions(teacher).length,0);denied(()=>s.submission(teacher,draft.id));denied(()=>s.file(teacher,upload.id));s.saveHomework(a,{lessonId:'hola',text:'Ready',uploadId:upload.id,submit:true});assert.equal(s.submissions(teacher).length,1);assert(s.file(teacher,upload.id).body.length);
});

test('catalogue pagination and direct file access do not confuse identically named materials',async t=>{
 const {s,db,a}=await setup(t);db.transaction(()=>{for(let i=0;i<31;i++)db.run("INSERT INTO school.materials(id,source_id,relative_path,title,description_source,editorial,publication,rights,privacy,missing,storage_key) VALUES(?,'pages',?,'Same title','own test','checked','published','public_allowed','public',0,'demo-words.txt')",'page-'+i,i+'.txt');});const first=s.materials(null,{q:'Same title'}),second=s.materials(null,{q:'Same title',page:2});assert.equal(first.items.length,25);assert.equal(second.items.length,6);assert.equal(second.total,31);assert(s.file(a,second.items[5].id,a.id).body.length);
});
