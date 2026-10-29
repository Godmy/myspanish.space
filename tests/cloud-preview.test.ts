import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {PreviewSqlStore} from '../cloudflare/sql-store.ts';
import {seedSchool} from '../src/lib/server/school/seed.ts';
import {SchoolService} from '../src/lib/server/school/service.ts';
import {buildSchoolView} from '../src/lib/server/school/view-model.ts';
import {previewGate} from '../cloudflare/preview-gate.ts';
import type {User} from '../src/lib/server/school/types.ts';

test('preview namespace preserves existing school scenarios and persists blob chunks',async t=>{
 const native=new DatabaseSync(':memory:');t.after(()=>native.close());
 const storage={sql:{exec(sql:string,...values:any[]){const rows=sql.includes(';')&&!values.length?(native.exec(sql),[]):native.prepare(sql).all(...values);return {toArray:()=>rows,one:()=>rows[0]};}},transactionSync<T>(callback:()=>T){native.exec('BEGIN');try{const result=callback();native.exec('COMMIT');return result;}catch(e){native.exec('ROLLBACK');throw e;}}};
 const store=new PreviewSqlStore(storage as any,readFileSync('cloudflare/preview-schema.sql','utf8'));seedSchool(store);const service=new SchoolService(store,true),student=store.one("SELECT * FROM pd.users WHERE id='student'") as User,teacher=store.one("SELECT * FROM pd.users WHERE id='teacher'") as User;
 const session=service.login(student.id);assert.equal(service.user(session.token)?.role,'student');assert.equal(service.lesson('hola',student,student.id).title,'¡Hola! Первые слова');
 assert.equal(service.attempt(student,{lessonId:'hola',exerciseId:'hello',answers:['hola'],requestKey:'preview-test'}).score,1);
 const response=service.saveHomework(student,{lessonId:'hola',text:'¡Hola! Gracias.',submit:true});service.review(teacher,{id:response.id,text:'Проверено в preview',decision:'checked',version:1});assert.equal(service.submission(student,response.id,student.id).reviews.length,1);
 assert.equal(buildSchoolView(service,student,'/account',new URLSearchParams()).school.courses.length,1);
 for(const role of ['admin','teacher']){
  const user=store.one('SELECT * FROM pd.users WHERE id=?',role) as User;
  for(const path of ['/staff','/staff/leads','/staff/students','/staff/courses','/staff/review','/staff/library'])
   assert.equal(buildSchoolView(service,user,path,new URLSearchParams()).school.user.id,role);
 }
 const bytes=new Uint8Array(1500000).fill(19);store.files.write('blob-test',bytes);const restored=new PreviewSqlStore(storage as any,readFileSync('cloudflare/preview-schema.sql','utf8'));assert.deepEqual(restored.files.read('blob-test'),Buffer.from(bytes));assert(service.file(student,'demo-words',student.id).body.length>0);
});

test('preview migrates the legacy lead notes column without losing records and stays idempotent',t=>{
 const native=new DatabaseSync(':memory:');t.after(()=>native.close());
 native.exec("CREATE TABLE pd_leads(id TEXT PRIMARY KEY,name TEXT NOT NULL,contact TEXT NOT NULL,pd_notes TEXT NOT NULL DEFAULT '',request_key TEXT NOT NULL UNIQUE,ip_hash TEXT NOT NULL,created_at TEXT NOT NULL); INSERT INTO pd_leads VALUES('legacy','Demo','demo@example.test','Сохранить заметку','legacy-request','hash','2026-10-29');");
 const storage={sql:{exec(sql:string,...values:any[]){const rows=sql.includes(';')&&!values.length?(native.exec(sql),[]):native.prepare(sql).all(...values);return {toArray:()=>rows,one:()=>rows[0]};}},transactionSync<T>(callback:()=>T){native.exec('BEGIN');try{const result=callback();native.exec('COMMIT');return result;}catch(e){native.exec('ROLLBACK');throw e;}}};
 const schema=readFileSync('cloudflare/preview-schema.sql','utf8');
 for(let iteration=0;iteration<2;iteration++){
  const store=new PreviewSqlStore(storage as any,schema);
  assert.equal(store.one('SELECT notes FROM pd.leads WHERE id=?','legacy')?.notes,'Сохранить заметку');
  store.run('UPDATE pd.leads SET notes=? WHERE id=?','Сохранить заметку','legacy');
  assert.equal(store.one('SELECT COUNT(*) count FROM pd.leads')?.count,1);
 }
});

test('private preview gate fails closed and checks a signed session',async()=>{
 const env={PREVIEW_ACCESS_KEY:'test-only-key-never-used-on-a-server',PREVIEW_SCHOOL:{getByName:()=>({gateLimit:async()=>true})}},origin='https://preview.example';
 assert.equal((await previewGate(new Request(origin),{...env,PREVIEW_ACCESS_KEY:undefined}))?.status,503);
 assert((await previewGate(new Request(origin+'/staff'),env))?.headers.get('X-Robots-Tag')?.includes('noindex'));
 const denied=await previewGate(new Request(origin+'/__preview/login',{method:'POST',headers:{Origin:origin},body:new URLSearchParams({key:'wrong'})}),env);assert.equal(denied?.status,401);
 const login=await previewGate(new Request(origin+'/__preview/login',{method:'POST',headers:{Origin:origin},body:new URLSearchParams({key:env.PREVIEW_ACCESS_KEY})}),env);assert.equal(login?.status,303);const cookie=login?.headers.get('Set-Cookie')?.split(';')[0];assert(cookie);assert.equal(await previewGate(new Request(origin+'/staff',{headers:{Cookie:cookie}}),env),null);assert((await previewGate(new Request(origin+'/staff',{headers:{Cookie:cookie+'bad'}}),env)) instanceof Response);
});
