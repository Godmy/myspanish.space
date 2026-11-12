import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { openSchoolDatabase } from '../src/lib/server/school/database.ts';
import { seedSchool } from '../src/lib/server/school/seed.ts';
import { SchoolService } from '../src/lib/server/school/service.ts';
import type { User } from '../src/lib/server/school/types.ts';

const plan=JSON.parse(readFileSync('scripts/school/content/autumn-course.json','utf8'));

test('complete course: exercises, learner downloads, homework, private keys and repeat application',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'spanish-first-course-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 let db=await openSchoolDatabase(dir);seedSchool(db);
 db.run("INSERT INTO school.courses(id,slug,title,summary,owner_id) VALUES(?,?,'old','old','teacher')",plan.id,plan.slug);
 db.run("INSERT INTO school.modules VALUES('autumn-module',?,'old',1)",plan.id);
 for(const lesson of plan.lessons)db.run("INSERT INTO school.lessons(id,module_id,title,goal,blocks,exercises,position,publication) VALUES(?,'autumn-module','old','old','[]','[]',?,'draft')",lesson.id,lesson.position);
 writeFileSync(join(dir,'files','fixture-pdf'),'%PDF-fixture');
 for(const name of ['guide','printables'])db.run("INSERT INTO school.materials(id,source_id,relative_path,title,description_source,format,bytes,storage_key,missing) VALUES(?,'derived-packs',?,'fixture','fixture','pdf',12,'fixture-pdf',0)",'pdf-'+name,'autumn/'+name+'.pdf');
 db.run("INSERT INTO school.materials(id,source_id,relative_path,title,description,description_source) VALUES('source','spanish-original','one.docx','source','','fixture')");
 db.run("INSERT INTO school.materials(id,source_id,relative_path,title,description,description_source) VALUES('edited','spanish-original','two.docx','edited','Human description','fixture')");
 writeFileSync(join(dir,'prepared-material-descriptions.json'),JSON.stringify({records:[{id:'source',description:'Prepared source description',description_source:'saved extraction'},{id:'edited',description:'Must not overwrite',description_source:'generated'}]}));db.close();
 const apply=()=>{const result=spawnSync(process.execPath,['--experimental-strip-types','scripts/school/prepare-first-course.ts'],{encoding:'utf8',env:{...process.env,SCHOOL_DATA_DIR:dir}});assert.equal(result.status,0,result.stderr+' '+result.stdout);return JSON.parse(result.stdout);};
 const first=apply();assert.equal(first.lessons,5);assert.equal(first.exercises,31);assert.equal(first.descriptionsFilled,1);
 db=await openSchoolDatabase(dir);
 const service=new SchoolService(db,true),student=db.one("SELECT * FROM pd.users WHERE id='student'") as User,other=db.one("SELECT * FROM pd.users WHERE id='student-b'") as User;
 const course=service.course(plan.id,student,student.id);assert.equal(course.modules.flatMap((m:any)=>m.lessons).length,5);
 assert.throws(()=>service.course(plan.id,other,other.id));
 const kinds=new Set();
 for(const source of plan.lessons){
  const lesson=service.lesson(source.id,student,student.id);assert(!('teacher_notes' in lesson));assert.equal(lesson.materials.length,3);
  assert(lesson.exercises.every((e:any)=>!('answer' in e)));
  for(const material of lesson.materials){assert(service.file(student,material.id,student.id).body.length);assert.throws(()=>service.file(null,material.id));}
  for(const exercise of source.exercises){kinds.add(exercise.kind);if(['text','cards'].includes(exercise.kind))continue;
   const attempt=service.attempt(student,{lessonId:source.id,exerciseId:exercise.id,answers:exercise.answer,requestKey:exercise.id,version:lesson.version});assert.equal(attempt.score,1,exercise.id);
  }
 }
 assert.equal(kinds.size,7);
 const submission=service.saveHomework(student,{lessonId:plan.lessons[0].id,text:'Практику выполнили, вопросы сохранили.',submit:true});assert(submission.id);
 assert.equal(db.one("SELECT description FROM school.materials WHERE id='edited'")?.description,'Human description');
 assert.equal(db.one("SELECT editorial FROM school.materials WHERE id='source'")?.editorial,'unchecked');
 assert(!service.materials(null,{publicOnly:true}).items.some(m=>m.source_id==='school-authored'));
 const count=db.one('SELECT COUNT(*) n FROM school.materials')?.n;db.run("UPDATE school.lessons SET title='Owner edit' WHERE id=?",plan.lessons[0].id);db.close();
 const second=apply();assert.equal(second.courseChanged,false);assert.equal(second.descriptionsFilled,0);
 db=await openSchoolDatabase(dir);try{assert.equal(db.one('SELECT COUNT(*) n FROM school.materials')?.n,count);assert.equal(db.one('SELECT title FROM school.lessons WHERE id=?',plan.lessons[0].id)?.title,'Owner edit');assert(db.one('SELECT id FROM school.submissions WHERE id=?',submission.id));}finally{db.close();}
});
