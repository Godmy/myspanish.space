import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { seedSchool } from '../../src/lib/server/school/seed.ts';
import { SchoolService } from '../../src/lib/server/school/service.ts';
import { importArchiveBatch } from '../../src/lib/server/school/archive.ts';
import type { User } from '../../src/lib/server/school/types.ts';

const folder=resolve(process.argv[2]??'.school-import');
const manifest=JSON.parse(readFileSync(resolve(folder,'manifest.json'),'utf8'));
const db=await openSchoolDatabase(process.env.SCHOOL_DATA_DIR??'.school-data');
try{
 seedSchool(db);const service=new SchoolService(db,true),admin=db.one("SELECT * FROM pd.users WHERE role='admin' AND active=1 LIMIT 1") as User;
 if(!admin)throw Error('Нужен существующий администратор.');
 for(const name of manifest.batches)importArchiveBatch(service,admin,JSON.parse(readFileSync(resolve(folder,name),'utf8')));
 console.log(JSON.stringify(manifest.report,null,2));
}finally{db.close();}
