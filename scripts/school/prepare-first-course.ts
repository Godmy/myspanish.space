import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { backup } from 'node:sqlite';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { SchoolService } from '../../src/lib/server/school/service.ts';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(app);
const data = resolve(process.env.SCHOOL_DATA_DIR ?? '.school-data');
const plan = JSON.parse(readFileSync(resolve(app, 'scripts/school/content/autumn-course.json'), 'utf8'));
const publicCopy = JSON.parse(readFileSync(resolve(app, 'scripts/school/content/public-pages.json'), 'utf8'));
const descriptions = JSON.parse(readFileSync(resolve(data, 'prepared-material-descriptions.json'), 'utf8'));
const revision = createHash('sha256').update(JSON.stringify(plan)).digest('hex');
const db = await openSchoolDatabase(data), service = new SchoolService(db, true);
try {
 for (const lesson of plan.lessons) service.validateExercises(lesson.exercises);
 const course = db.one('SELECT * FROM school.courses WHERE id=?', plan.id);
 if (!course) throw Error('Existing autumn course is required.');
 const pdfs = db.all("SELECT * FROM school.materials WHERE source_id='derived-packs' AND relative_path IN ('autumn/guide.pdf','autumn/printables.pdf')");
 if (pdfs.length !== 2 || pdfs.some(p => p.missing || !existsSync(resolve(data,'files',p.storage_key)))) throw Error('Prepared PDFs are not connected.');
 const backupDir = resolve(data,'content-backups',new Date().toISOString().replace(/[:.]/g,'-'));
 mkdirSync(backupDir,{recursive:true});
 await backup(db.db,resolve(backupDir,'site.sqlite'));
 await backup(db.db,resolve(backupDir,'school.sqlite'),{source:'school'});
 await backup(db.db,resolve(backupDir,'pd.sqlite'),{source:'pd'});
 const priorRevision = db.one('SELECT value FROM settings WHERE key=?','__first_course_revision')?.value;
 const courseChanged = priorRevision !== JSON.stringify(revision);
 const handouts = plan.lessons.map((lesson: any) => {
  const bytes = Buffer.from(lesson.handout,'utf8'), checksum=createHash('sha256').update(bytes).digest('hex');
  const storage=resolve(data,'files',checksum);
  if (!existsSync(storage)) writeFileSync(storage,bytes);
  return { id:lesson.id+':handout',lessonId:lesson.id,title:'Памятка — '+lesson.title,path:'autumn/lesson-'+lesson.position+'.txt',checksum,bytes:bytes.length };
 });
 let filled=0, preserved=0;
 db.transaction(() => {
  for (const draft of descriptions.records) {
   const current=db.one('SELECT description FROM school.materials WHERE id=?',draft.id);
   if (!current || (current.description.trim() && current.description !== draft.previous_generated_description)) { preserved++; continue; }
   db.run('UPDATE school.materials SET description=?,description_source=? WHERE id=?',draft.description,draft.description_source,draft.id);filled++;
  }
  if (courseChanged) {
   db.run("UPDATE school.courses SET title=?,summary=?,level=?,audience=?,topic=?,format=?,status=?,publication='published',version=version+1 WHERE id=?",plan.title,plan.summary,plan.level,plan.audience,plan.topic,plan.format,plan.status,plan.id);
   db.run('UPDATE school.modules SET title=? WHERE course_id=?','Осень: пять игр и первые реплики',plan.id);
   for (const lesson of plan.lessons) {
    const handout=handouts.find((h:any)=>h.lessonId===lesson.id)!;
    const blocks=[...lesson.blocks,{type:'attachment',fileId:handout.id}];
    db.run("UPDATE school.lessons SET title=?,goal=?,blocks=?,exercises=?,homework=?,teacher_notes=?,position=?,publication='published',version=version+1 WHERE id=?",lesson.title,lesson.goal,JSON.stringify(blocks),JSON.stringify(lesson.exercises),lesson.homework,lesson.teacher_notes,lesson.position,lesson.id);
    db.run('INSERT INTO school.assignments(id,lesson_id,title,instructions) VALUES(?,?,?,?) ON CONFLICT(lesson_id) DO UPDATE SET title=excluded.title,instructions=excluded.instructions',lesson.id,lesson.id,'Практика дома — '+lesson.title,lesson.homework);
    db.run('INSERT OR IGNORE INTO school.files VALUES(?,?,?,?,?)',handout.checksum,handout.checksum,handout.bytes,handout.checksum,'txt');
    db.run("INSERT INTO school.materials(id,source_id,relative_path,original_path,title,description,description_source,format,bytes,checksum,processing,editorial,publication,rights,privacy,topic,level,instructions,storage_key,missing,file_id) VALUES(?,'school-authored',?,?,?,?,?,'txt',?,?,'full','checked','published','internal','internal',?,'С нуля',?,?,0,?) ON CONFLICT(id) DO UPDATE SET bytes=excluded.bytes,checksum=excluded.checksum,file_id=excluded.file_id,storage_key=excluded.storage_key,missing=0",handout.id,handout.path,handout.path,handout.title,'Реплики с переводом и домашняя практика занятия «'+lesson.title+'». Памятка дополняет урок и пригодится для повторения без открытого браузера.','Цифровая редакция осеннего курса: '+lesson.source_ids.join(', '),handout.bytes,handout.checksum,plan.topic,'Скачайте памятку перед совместной игрой.',handout.checksum,handout.checksum);
    db.run('INSERT OR IGNORE INTO school.lesson_materials VALUES(?,?)',lesson.id,handout.id);
    for (const pdf of pdfs) db.run('INSERT OR IGNORE INTO school.lesson_materials VALUES(?,?)',lesson.id,pdf.id);
   }
   for (const pdf of pdfs) db.run("UPDATE school.materials SET editorial='checked',publication='published',rights='internal',privacy='internal',rights_note=? WHERE id=?",'Разрешено только внутреннее использование для локальной проверки подготовленного курса владельцем. Публичная выдача не разрешена.',pdf.id);
   db.run('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value','__first_course_revision',JSON.stringify(revision));
  }
  // Only the existing test learner gets access; another learner remains a negative test.
  db.run("INSERT INTO school.entitlements(id,student_id,course_id,source,granted_by) VALUES(?,'student',?,'manual','admin') ON CONFLICT(student_id,course_id,source) DO NOTHING",'local-autumn-test-access',plan.id);
  for (const [key,value] of Object.entries(publicCopy)) {
   if (value==='' && db.one('SELECT value FROM settings WHERE key=?',key)?.value) continue;
   db.run('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,JSON.stringify(value));
  }
  const existingPages=JSON.parse(db.one("SELECT value FROM settings WHERE key='coursePages'")?.value ?? '{}');
  db.run('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value','coursePages',JSON.stringify({...existingPages,[plan.id]:plan.page}));
  const prior=db.one('SELECT metadata FROM school.archive_programs WHERE course_id=?',plan.id);
  if(prior){const metadata=JSON.parse(prior.metadata);metadata.local_course_readiness={status:'complete_for_local_owner_review',lessons:5,exercises:plan.lessons.reduce((n:number,l:any)=>n+l.exercises.length,0),revision};db.run('UPDATE school.archive_programs SET metadata=? WHERE course_id=?',JSON.stringify(metadata),plan.id);}
 });
 const report={courseId:plan.id,coursePath:'/account/courses/'+plan.id,courseChanged,lessons:plan.lessons.length,exercises:plan.lessons.reduce((n:number,l:any)=>n+l.exercises.length,0),handouts:handouts.length,pdfMaterials:pdfs.length,descriptionsFilled:filled,concurrentDescriptionsPreserved:preserved,descriptionsStillEmpty:db.one("SELECT COUNT(*) n FROM school.materials WHERE source_id IN ('spanish-original','derived-packs') AND trim(description)=''")?.n,backupDir,revision};
 writeFileSync(resolve(data,'first-course-preparation.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
} finally { db.close(); }
