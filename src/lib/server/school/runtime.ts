import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { openSchoolDatabase } from './database.ts';
import { seedSchool } from './seed.ts';
import { SchoolService } from './service.ts';
import { SchoolError } from './types.ts';

let instance: Promise<SchoolService> | undefined;
export function getSchool() {
	if (!dev && env.SCHOOL_STORAGE !== 'sqlite')
		throw new SchoolError(
			503,
			'Хранилище не настроено. Для Node-сервера задайте SCHOOL_STORAGE=sqlite или подключите production-сервисы данных.',
		);
	instance ??= openSchoolDatabase(
		env.SCHOOL_DATA_DIR || (dev ? '.school-data' : '.school-production'),
	).then((db) => {
		if (
			!dev &&
			(db.one("SELECT 1 FROM settings WHERE key='__development_seed'") ||
				db.one(
					"SELECT 1 FROM pd.users WHERE id IN ('admin','teacher','student','student-b','parent','parent-b')",
				))
		) {
			db.close();
			throw new SchoolError(
				503,
				'Выбрана демонстрационная база. Используйте отдельный production-каталог данных.',
			);
		}
		seedSchool(db, dev, dev ? 'teacher' : 'school-content');
		return new SchoolService(db, dev);
	});
	return instance;
}
