import { readFileSync } from 'node:fs';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { previewImport, applyImport } from '../../src/lib/server/school/importer.ts';
const [mode, registry, sourceId = 'archive', digest] = process.argv.slice(2);
if (!registry || !['preview', 'apply'].includes(mode))
	throw new Error(
		'Usage: preview|apply registry.csv source-id [preview-digest]. Source root: ARCHIVE_SOURCE_ROOT.',
	);
const csv = readFileSync(registry, 'utf8');
if (mode === 'preview') {
	const { records, ...report } = await previewImport(
		csv,
		sourceId,
		process.env.ARCHIVE_SOURCE_ROOT,
	);
	console.log(
		JSON.stringify(
			{ ...report, records: records.map(({ physical, ...record }) => record) },
			null,
			2,
		),
	);
} else {
	if (!digest) throw new Error('Supply the digest of a reviewed preview.');
	const db = await openSchoolDatabase(process.env.SCHOOL_DATA_DIR);
	try {
		console.log(
			JSON.stringify(
				await applyImport(db, csv, sourceId, digest, process.env.ARCHIVE_SOURCE_ROOT),
				null,
				2,
			),
		);
	} finally {
		db.close();
	}
}
