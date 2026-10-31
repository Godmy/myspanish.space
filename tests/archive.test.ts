import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import {PreviewSqlStore} from '../cloudflare/sql-store.ts';
import {seedSchool} from '../src/lib/server/school/seed.ts';
import {SchoolService} from '../src/lib/server/school/service.ts';
import {importArchiveBatch,archiveView} from '../src/lib/server/school/archive.ts';
import {buildSchoolView} from '../src/lib/server/school/view-model.ts';
import {previewImport} from '../src/lib/server/school/importer.ts';
import type {User} from '../src/lib/server/school/types.ts';

function fixture(t:any){
 const native=new DatabaseSync(':memory:');t.after(()=>native.close());
 const storage={sql:{exec(sql:string,...values:any[]){const rows=sql.includes(';')&&!values.length?(native.exec(sql),[]):native.prepare(sql).all(...values);return {toArray:()=>rows,one:()=>rows[0]};}},transactionSync<T>(fn:()=>T){native.exec('BEGIN');try{const v=fn();native.exec('COMMIT');return v;}catch(e){native.exec('ROLLBACK');throw e;}}};
 const db=new PreviewSqlStore(storage as any,readFileSync('cloudflare/preview-schema.sql','utf8'));seedSchool(db);const service=new SchoolService(db,true);
 return {db,service,user:(id:string)=>db.one('SELECT * FROM pd.users WHERE id=?',id) as User};
}

test('archive batches enforce administrator scope, retain raw Unicode paths, and preserve edits on retry',async t=>{
 const {db,service,user}=fixture(t),digest='a'.repeat(64);
 const batch=(kind:string,records:any[],part=kind)=>({digest,part,kind,records});
 assert.throws(()=>importArchiveBatch(service,user('teacher'),batch('folders',[])),/роли/);
 assert.throws(()=>archiveView(service,user('student')),/роли/);
 importArchiveBatch(service,user('admin'),batch('folders',[{id:'folder',parent_id:null,title:'Учебные',relative_path:'',depth:0,purpose:'learning',source_id:'spanish-test'}]));
 const rows=['café.pdf','cafe\u0301.pdf'].map((path,i)=>({id:'raw'+i,folder_id:'folder',file_id:'file'+i,title:path,relative_path:path,description:'Метаданные',provenance:'fixture',source_id:'spanish-test',format:'pdf',bytes:1,checksum:null,legacy_processed:'1',processing:'result_completeness_unknown',metadata:{disposition:'catalog'}}));
 const payload=batch('materials',rows);importArchiveBatch(service,user('admin'),payload);
 db.run('UPDATE school.materials SET description=? WHERE id=?','Редакторская правка','raw0');
 assert.equal(importArchiveBatch(service,user('admin'),payload).duplicate,true);
 assert.equal(db.one('SELECT description FROM school.materials WHERE id=?','raw0')?.description,'Редакторская правка');
 assert.equal(db.one("SELECT COUNT(*) n FROM school.materials WHERE source_id='spanish-test'")?.n,2);
 assert.throws(()=>importArchiveBatch(service,user('admin'),{...payload,records:[]}),/изменилось/);
 assert.equal(service.materialAccess(user('student'),'raw0','student'),false);
 assert.equal(service.materials(null,{publicOnly:true}).items.some(r=>r.id==='raw0'),false);
 const csv=await previewImport('relative_path;title\ncafé.pdf;NFC\ncafe\u0301.pdf;NFD','unicode');assert.equal(csv.records.length,2);
 importArchiveBatch(service,user('admin'),batch('materials',[{...rows[0],id:'secret',restricted:true}], 'restricted'));
 assert.equal(service.materialAccess(user('teacher'),'secret'),false);
 assert.throws(()=>service.command(user('teacher'),'bulkMaterial',{ids:'secret',topic:'Попытка изменения'}),/не найден/);
 assert.throws(()=>buildSchoolView(service,user('teacher'),'/staff/library/secret',new URLSearchParams()),/не найден/);
 assert.throws(()=>importArchiveBatch(service,user('admin'),batch('materials',[{...rows[0],id:'personal',personal:true}],'personal')),/исключены/);
});

test('supplied real snapshot imports completely through the preview adapter and preserves existing learning data',{skip:!existsSync('.school-import/manifest.json')},t=>{
 const {db,service,user}=fixture(t),manifest=JSON.parse(readFileSync('.school-import/manifest.json','utf8'));
 const prior=service.saveHomework(user('student'),{lessonId:'hola',text:'Сохранить существующий ответ',submit:true});
 for(let pass=0;pass<2;pass++)for(const name of manifest.batches)importArchiveBatch(service,user('admin'),JSON.parse(readFileSync('.school-import/'+name,'utf8')));
 for(const [table,n] of [['archive_folders',556],['archive_materials',4704],['archive_programs',30]])assert.equal(db.one('SELECT COUNT(*) n FROM school.'+table)?.n,n);
 assert.equal(service.submission(user('student'),prior.id,'student').text,'Сохранить существующий ответ');
 assert.equal(db.one("SELECT COUNT(*) n FROM school.materials WHERE relative_path LIKE '13 %'")?.n,0);
 assert.equal(service.publicCourses().length,31);
 assert.equal(service.materials(null,{publicOnly:true}).total,1);
 const lesson=service.lesson('pack:autumn:lesson-1',user('teacher'),undefined,true);assert(lesson.blocks.length>0);assert.equal(lesson.exercises[0].kind,'cards');assert(lesson.teacher_notes);
 assert(!/\?{3}/.test(JSON.stringify(lesson)), 'Imported Russian text must survive UTF-8 export');
 assert.throws(()=>service.lesson(lesson.id,user('student'),'student'),/недоступен/);
 assert.equal(archiveView(service,user('admin')).runs[0].report.excluded_personal_files,220);
 assert.equal(archiveView(service,user('admin')).totals.materials,4704);
 const folder=db.one("SELECT id FROM school.archive_folders WHERE relative_path='01 Курсы'")!;
 assert(service.materials(user('teacher'),{folder:folder.id}).total>0);
 for(const role of ['admin','teacher','teacher-b'])assert.equal(buildSchoolView(service,user(role),'/staff',new URLSearchParams()).school.user.id,role);
});
