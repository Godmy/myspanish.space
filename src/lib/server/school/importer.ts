import { createHash, randomUUID } from 'node:crypto';
import {
	existsSync,
	realpathSync,
	statSync,
	createReadStream,
	copyFileSync,
	mkdirSync,
} from 'node:fs';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import type { SchoolStore } from './store.ts';
import { SchoolError, type Row } from './types.ts';

export function parseCsv(input: string): string[][] {
	const text = input.replace(/^\uFEFF/, '');
	if (text.length > 8_000_000)
		throw new SchoolError(413, 'Реестр не больше 8 МБ. Разбейте его на части.');
	const first = text.split(/\r?\n/, 1)[0],
		delimiter = first.includes(';') ? ';' : first.includes('\t') ? '\t' : ',';
	const rows: string[][] = [];
	let row: string[] = [],
		cell = '',
		quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (c === '"') {
			if (quoted && text[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (quoted || !cell) quoted = !quoted;
			else throw new SchoolError(422, 'Кавычка внутри незаключённого поля CSV.');
		} else if (c === delimiter && !quoted) {
			row.push(cell);
			cell = '';
		} else if ((c === '\n' || c === '\r') && !quoted) {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			if (row.some((x) => x.trim())) rows.push(row);
			row = [];
			cell = '';
		} else cell += c;
	}
	if (quoted) throw new SchoolError(422, 'Незакрытая кавычка CSV.');
	row.push(cell);
	if (row.some((x) => x.trim())) rows.push(row);
	if (rows.length > 10001) throw new SchoolError(413, 'Не более 10 000 записей в одной порции.');
	return rows;
}

export async function previewImport(csv: string, sourceId: string, root?: string) {
	if (!/^[a-zA-Z0-9_-]{1,80}$/.test(sourceId))
		throw new SchoolError(422, 'Идентификатор источника: латиница, цифры, _ и -.');
	const rows = parseCsv(csv),
		headers = (rows.shift() ?? []).map((x) => x.trim().toLowerCase());
	const column = (names: string[]) => headers.findIndex((x) => names.includes(x));
	const pathIndex = column([
		'relative_path',
		'path',
		'путь',
		'относительный путь',
		'исходный путь',
	]);
	if (pathIndex < 0)
		throw new SchoolError(
			422,
			'Нужна колонка relative_path (или path / путь). Сопоставьте поля исходного реестра с примером.',
		);
	const indices = {
		title: column(['title', 'название', 'имя файла']),
		description: column(['description', 'описание']),
		processed: column(['processed', 'обработано', 'legacy_processed']),
		topic: column(['topic', 'тема']),
		level: column(['level', 'уровень']),
	};
	const records: Row[] = [],
		errors: Row[] = [],
		seen = new Set<string>(),
		hashes = new Map<string, string>();
	if (root && !existsSync(root))
		throw new SchoolError(
			422,
			'Настроенный корень архива недоступен. Проверьте ARCHIVE_SOURCE_ROOT.',
		);
	const realRoot = root ? realpathSync(root) : null;
	for (let i = 0; i < rows.length; i++) {
		const values = rows[i],
			original = values[pathIndex] ?? '',
			path = original.replace(/\\/g, '/').normalize('NFC');
		if (
			!path ||
			isAbsolute(path) ||
			/^[a-zA-Z]:|^\//.test(path) ||
			path.split('/').some((x) => x === '..' || x === '' || x === '.') ||
			path.includes('\0')
		) {
			errors.push({
				row: i + 2,
				path: original,
				error: 'Небезопасный или пустой относительный путь',
			});
			continue;
		}
		if (seen.has(path)) {
			errors.push({ row: i + 2, path, error: 'Повтор пути в порции; запись пропущена' });
			continue;
		}
		seen.add(path);
		const restricted =
			/^13(?:\s|\/)|работы учеников|проверка|персональ|внутренн|\.env|\.sqlite|\.git\//i.test(path);
		if (restricted) {
			errors.push({ row: i + 2, path, error: 'Персональный или технический раздел исключён' });
			continue;
		}
		const record: Row = {
			relative_path: path,
			original_path: original,
			title: values[indices.title]?.trim() || path.split('/').pop(),
			description: values[indices.description] ?? '',
			legacy_processed: values[indices.processed] ?? null,
			topic: values[indices.topic] ?? '',
			level: values[indices.level] ?? '',
			format: extname(path).slice(1).toLowerCase(),
			bytes: null,
			checksum: null,
			missing: 1,
			duplicate_of: null,
			physical: null,
		};
		if (record.description.length > 10000 || record.title.length > 500) {
			errors.push({ row: i + 2, path, error: 'Слишком длинное описание или название' });
			continue;
		}
		if (realRoot) {
			const physical = resolve(realRoot, path);
			if (existsSync(physical)) {
				const real = realpathSync(physical),
					rel = relative(realRoot, real);
				if (rel.startsWith('..') || isAbsolute(rel) || !statSync(real).isFile()) {
					errors.push({
						row: i + 2,
						path,
						error: 'Путь выходит из источника или не является файлом',
					});
					continue;
				}
				const info = statSync(real);
				if (info.size > 100 * 1024 * 1024) {
					errors.push({
						row: i + 2,
						path,
						error: 'Файл больше локального лимита 100 МБ; метаданные импортируются без вложения',
					});
				} else {
					const hash = createHash('sha256');
					for await (const chunk of createReadStream(real)) hash.update(chunk);
					record.checksum = hash.digest('hex');
					record.bytes = info.size;
					record.missing = 0;
					record.physical = real;
					record.duplicate_of = hashes.get(record.checksum) ?? null;
					hashes.set(record.checksum, path);
				}
			}
		}
		records.push(record);
	}
	const safe = records.map(({ physical, ...r }) => r),
		digest = createHash('sha256')
			.update(JSON.stringify({ sourceId, records: safe, errors }))
			.digest('hex');
	return {
		sourceId,
		digest,
		records,
		errors,
		total: rows.length,
		missing: records.filter((r) => r.missing).length,
		duplicates: records.filter((r) => r.duplicate_of).length,
	};
}

export async function applyImport(
	db: SchoolStore,
	csv: string,
	sourceId: string,
	digest: string,
	root?: string,
) {
	const preview = await previewImport(csv, sourceId, root);
	if (preview.digest !== digest)
		throw new SchoolError(409, 'Источник изменился. Выполните новый предварительный просмотр.');
	let created = 0,
		updated = 0;
	db.files.mkdir(resolve(db.directory,'files'));
	// Files are copied by checksum into a separate directory, never moved from source.
	for (const record of preview.records)
		if (record.physical && record.checksum) {
			const target = resolve(db.directory, 'files', record.checksum);
			if (!existsSync(target)) copyFileSync(record.physical, target);
		}
	db.transaction(() => {
		for (const r of preview.records) {
			const prior = db.one(
					'SELECT id FROM school.materials WHERE source_id=? AND relative_path=?',
					sourceId,
					r.relative_path,
				),
				id = prior?.id ?? randomUUID();
			if (prior) {
				updated++;
				db.run(
					'UPDATE school.materials SET bytes=?,checksum=?,missing=?,storage_key=?,legacy_processed=?,original_path=? WHERE id=?',
					r.bytes,
					r.checksum,
					r.missing,
					r.checksum,
					r.legacy_processed,
					r.original_path,
					id,
				);
			} else {
				created++;
				db.run(
					'INSERT INTO school.materials(id,source_id,relative_path,title,description,description_source,format,bytes,checksum,processing,legacy_processed,topic,level,missing,storage_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
					id,
					sourceId,
					r.relative_path,
					r.title,
					r.description,
					'CSV ' + sourceId + '; степень проверки описания неизвестна',
					r.format,
					r.bytes,
					r.checksum,
					r.legacy_processed ? null : 'unprocessed',
					r.legacy_processed,
					r.topic,
					r.level,
					r.missing,
					r.checksum,
				);
			}
			db.run('UPDATE school.materials SET original_path=? WHERE id=?', r.original_path, id);
			if (r.checksum) {
				db.run(
					'INSERT OR IGNORE INTO school.files VALUES(?,?,?,?,?)',
					r.checksum,
					r.checksum,
					r.bytes,
					r.checksum,
					r.format,
				);
				db.run('UPDATE school.materials SET file_id=? WHERE id=?', r.checksum, id);
			}
		}
		db.run(
			'INSERT INTO school.import_runs VALUES(?,?,?,?,?)',
			randomUUID(),
			sourceId,
			digest,
			JSON.stringify({
				created,
				updated,
				errors: preview.errors,
				missing: preview.missing,
				duplicates: preview.duplicates,
			}),
			new Date().toISOString(),
		);
	});
	return {
		created,
		updated,
		missing: preview.missing,
		duplicates: preview.duplicates,
		errors: preview.errors,
	};
}
