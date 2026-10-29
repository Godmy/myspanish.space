import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { seedSchool } from '../../src/lib/server/school/seed.ts';
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--schema-only'))
	throw new Error('Development seed is forbidden in production.');
const db = await openSchoolDatabase(process.env.SCHOOL_DATA_DIR);
if (!process.argv.includes('--schema-only')) seedSchool(db);
console.log('Local schema and demo data ready:', db.directory);
db.close();
