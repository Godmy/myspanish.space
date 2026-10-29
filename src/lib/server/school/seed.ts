import demo from '../../../../../../stylist-svelte/modules/business/spanish/data/json/spanish-beginner-demo/index.json' with { type: 'json' };
import { randomUUID, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { SchoolStore } from './store.ts';
import type { Exercise } from './types.ts';

export function seedSchool(db: SchoolStore, withAccounts = true, ownerId = 'teacher') {
	if (db.one('SELECT id FROM school.courses LIMIT 1')) return;
	db.transaction(() => {
		if (withAccounts) {
			db.run('INSERT OR IGNORE INTO settings VALUES(?,?)', '__development_seed', 'true');
			for (const [id, name, role] of [
				['admin', 'Администратор · демо', 'admin'],
				['teacher', 'Преподаватель · демо', 'teacher'],
				['teacher-b', 'Другой преподаватель · демо', 'teacher'],
				['student', 'Аня · демо', 'student'],
				['student-b', 'Лев · демо', 'student'],
				['parent', 'Родитель Ани · демо', 'parent'],
				['parent-b', 'Родитель Льва · демо', 'parent'],
			])
				db.run('INSERT INTO pd.users(id,name,role) VALUES(?,?,?)', id, name, role);
			db.run('INSERT INTO school.guardians VALUES(?,?)', 'parent', 'student');
			db.run('INSERT INTO school.guardians VALUES(?,?)', 'parent-b', 'student-b');
			db.run('INSERT INTO school.teacher_students VALUES(?,?)', 'teacher', 'student');
			db.run('INSERT INTO school.teacher_students VALUES(?,?)', 'teacher-b', 'student-b');
			db.run(
				'INSERT INTO school.groups VALUES(?,?,?)',
				'beginners',
				'Первые шаги · демогруппа',
				'teacher',
			);
			db.run('INSERT INTO school.group_members VALUES(?,?)', 'beginners', 'student');
		}
		const directions = demo.directions;
		for (const [id, title, summary, topic, status, demo] of directions)
			db.run(
				'INSERT INTO school.courses(id,slug,title,summary,topic,status,demo,publication,owner_id) VALUES(?,?,?,?,?,?,?,?,?)',
				String(id),
				String(id),
				String(title),
				String(summary),
				String(topic),
				String(status),
				Number(demo),
				'published',
				ownerId,
			);
		db.run("UPDATE school.courses SET level='',format='Уточняется' WHERE demo=0");
		db.run(
			'INSERT INTO school.modules VALUES(?,?,?,?)',
			'first',
			'demo-a1',
			'Знакомимся с языком',
			1,
		);
		const lessons = demo.lessons as {
			id: string;
			title: string;
			goal: string;
			text: string;
			exercises: Exercise[];
			homework: string;
		}[];
		lessons.forEach((l, i) =>
			db.run(
				'INSERT INTO school.lessons(id,module_id,title,goal,blocks,exercises,homework,teacher_notes,position,publication) VALUES(?,?,?,?,?,?,?,?,?,?)',
				l.id,
				'first',
				l.title,
				l.goal,
				JSON.stringify([{ type: 'text', text: l.text }]),
				JSON.stringify(l.exercises),
				l.homework,
				'Демонстрационные заметки: не передавать ученику.',
				i + 1,
				'published',
			),
		);
		for (const lesson of lessons)
			db.run(
				'INSERT INTO school.assignments(id,lesson_id,title,instructions) VALUES(?,?,?,?)',
				lesson.id,
				lesson.id,
				lesson.title,
				lesson.homework,
			);
		if (withAccounts)
			db.run(
				'INSERT INTO school.entitlements(id,student_id,course_id,source,granted_by) VALUES(?,?,?,?,?)',
				randomUUID(),
				'student',
				'demo-a1',
				'manual',
				'admin',
			);
		db.files.mkdir(resolve(db.directory,'files'));
		const content = Buffer.from(
			'¡Hola! — Привет!\nGracias — Спасибо.\nMe llamo Ana. — Меня зовут Ана.\n\nСобственный демонстрационный материал школы.\n',
			'utf8',
		);
		db.files.write(resolve(db.directory, 'files', 'demo-words.txt'), content);
		db.run(
			'INSERT INTO school.materials(id,source_id,relative_path,title,description,description_source,format,bytes,checksum,processing,editorial,publication,rights,privacy,topic,level,instructions,storage_key,missing) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
			'demo-words',
			'own-demo',
			'demo-words.txt',
			'Первые испанские слова',
			'Небольшая памятка с приветствиями и фразой знакомства.',
			'Собственный демонстрационный текст',
			'txt',
			content.length,
			createHash('sha256').update(content).digest('hex'),
			'full',
			'checked',
			'published',
			'public_allowed',
			'public',
			'Основы',
			'A1',
			'Прочитайте фразы, закройте перевод и попробуйте вспомнить.',
			'demo-words.txt',
			0,
		);
		db.run('INSERT INTO school.lesson_materials VALUES(?,?)', 'hola', 'demo-words');
		const checksum = createHash('sha256').update(content).digest('hex');
		db.run(
			'INSERT OR IGNORE INTO school.files VALUES(?,?,?,?,?)',
			checksum,
			checksum,
			content.length,
			'demo-words.txt',
			'txt',
		);
		db.run(
			'UPDATE school.materials SET file_id=?,original_path=relative_path WHERE id=?',
			checksum,
			'demo-words',
		);
	});
}
