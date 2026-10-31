import { createHash } from 'node:crypto';
import type { SchoolService } from './service.ts';
import { SchoolError, type Row, type User } from './types.ts';

/** Additive, bounded import; source SQL is never executed against the live database. */
export function importArchiveBatch(service: SchoolService, user: User | null, data: Row) {
 service.require(user, ['admin']);
 const { digest, part, kind, records } = data;
 if (!/^[a-f0-9]{64}$/.test(digest ?? '') || !/^[a-zA-Z0-9_-]{1,100}$/.test(part ?? '') || !Array.isArray(records) || records.length > 100)
  throw new SchoolError(422, 'Неверная порция архива.');
 const checksum = createHash('sha256').update(JSON.stringify({kind, records})).digest('hex'), db=service.db;
 const prior=db.one('SELECT checksum FROM school.archive_batches WHERE digest=? AND part=?',digest,part);
 if(prior){if(prior.checksum!==checksum)throw new SchoolError(409,'Содержимое порции изменилось.');return {duplicate:true,part};}
 return db.transaction(()=>{
  for(const r of records){
   if(!r || typeof r!=='object')throw new SchoolError(422,'Неверная запись.');
   if(kind!=='finish')service.text(r.id,200);
   if(kind==='folders'){
    if(r.purpose==='personal')throw new SchoolError(422,'Персональные папки не загружаются в общий preview.');
    db.run('INSERT OR IGNORE INTO school.archive_folders VALUES(?,?,?,?,?,?,?)',r.id,r.parent_id,r.title,r.relative_path,r.depth,r.purpose,r.source_id);
   }else if(kind==='materials'){
    if(r.personal || r.metadata?.disposition==='personal' || /^13(?:\s|\/)/.test(r.relative_path??''))throw new SchoolError(422,'Исторические работы исключены из preview.');
    if(!db.one('SELECT id FROM school.archive_folders WHERE id=?',r.folder_id))throw new SchoolError(422,'Не найдена папка материала.');
    db.run('INSERT OR IGNORE INTO school.materials(id,source_id,relative_path,title,description,description_source,format,bytes,checksum,processing,legacy_processed,privacy,topic,level,skills,instructions,missing,original_path) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)',r.id,r.source_id,r.relative_path,r.title,r.description,r.provenance,r.format,r.bytes,r.checksum,null,r.legacy_processed,r.restricted?'restricted':'internal',r.topic??'','','',r.instructions??'',r.relative_path);
    db.run('INSERT OR IGNORE INTO school.archive_materials VALUES(?,?,?,?,?)',r.id,r.folder_id,r.file_id,r.processing,JSON.stringify(r.metadata));
   }else if(kind==='courses'){
    const summary=`Тематика: «${r.title}». Программа готовится; формат и условия участия уточняются.`;
    db.run("INSERT OR IGNORE INTO school.courses(id,slug,title,summary,level,audience,topic,format,status,publication,demo,owner_id) VALUES(?,?,?,?,'','Уточняется',?,'Уточняется','preparing','draft',0,?)",r.id,r.slug,r.title,summary,r.kind==='adapted_pack'?'Тематические занятия':r.kind==='marathon'?'Марафоны':'Испанский',r.owner_id??'teacher');
    db.run('INSERT OR IGNORE INTO school.archive_programs VALUES(?,?,?,?,?)',r.id,r.readiness,r.kind,r.provenance,JSON.stringify(r.metadata));
   }else if(kind==='modules'){
    if(!db.one('SELECT id FROM school.courses WHERE id=?',r.course_id))throw new SchoolError(422,'Не найдена программа.');
    db.run('INSERT OR IGNORE INTO school.modules VALUES(?,?,?,?)',r.id,r.course_id,r.title,r.position);
   }else if(kind==='lessons'){
    service.validateExercises(r.exercises);
    if(!db.one('SELECT id FROM school.modules WHERE id=?',r.module_id))throw new SchoolError(422,'Не найден модуль.');
    db.run("INSERT OR IGNORE INTO school.lessons(id,module_id,title,goal,blocks,exercises,homework,teacher_notes,position,publication) VALUES(?,?,?,?,?,?,?,?,?,'draft')",r.id,r.module_id,r.title,r.goal,JSON.stringify(r.blocks),JSON.stringify(r.exercises),r.homework,r.teacher_notes,r.position);
    db.run('INSERT OR IGNORE INTO school.assignments(id,lesson_id,title,instructions) VALUES(?,?,?,?)',r.id,r.id,r.title,r.homework);
   }else if(kind==='moduleMaterials'){
    if(db.one('SELECT id FROM school.materials WHERE id=?',r.material_id))db.run('INSERT OR IGNORE INTO school.archive_module_materials VALUES(?,?,?)',r.module_id,r.material_id,r.position);
   }else if(kind==='lessonMaterials'){
    if(db.one('SELECT id FROM school.materials WHERE id=?',r.material_id))db.run('INSERT OR IGNORE INTO school.lesson_materials VALUES(?,?)',r.lesson_id,r.material_id);
   }else if(kind==='finish'){
    for(const [table,key] of [['archive_folders','folders'],['archive_materials','materials'],['archive_programs','courses']]){
     const count=Number(db.one(`SELECT COUNT(*) n FROM school.${table}`)?.n??0);
     if(count<Number(r[key]))throw new SchoolError(409,'Импорт не завершён: '+key);
    }
    db.run("INSERT INTO school.archive_import_runs VALUES(?,'complete',?,?) ON CONFLICT(digest) DO NOTHING",digest,JSON.stringify(r),new Date().toISOString());
   }else throw new SchoolError(422,'Неизвестный вид данных архива.');
  }
  db.run('INSERT INTO school.archive_batches VALUES(?,?,?)',digest,part,checksum);
  return {part,records:records.length,duplicate:false};
 });
}

export function archiveView(service: SchoolService, user: User, folderId?: string) {
 service.require(user,['admin','teacher']);const db=service.db;
 const allowed=user.role==='admin'?"purpose!='personal'":"purpose IN ('root','learning','methodology')";
 const folder=folderId?db.one('SELECT * FROM school.archive_folders WHERE id=? AND '+allowed,folderId):null;
 if(folderId&&!folder)throw new SchoolError(404,'Папка не найдена.');
 const folders=db.all('SELECT f.*,(SELECT COUNT(*) FROM school.archive_folders ch WHERE ch.parent_id=f.id) children FROM school.archive_folders f WHERE '+(folder?'parent_id=?':'parent_id IS NULL')+' AND '+allowed+' ORDER BY title',...(folder?[folder.id]:[]));
 const runs=user.role==='admin'?db.all('SELECT * FROM school.archive_import_runs ORDER BY created_at DESC LIMIT 5').map(r=>({...r,report:JSON.parse(r.report)})):[];
 return {folder,folders,runs,totals:{materials:db.one('SELECT COUNT(*) n FROM school.archive_materials')?.n??0,programs:db.one('SELECT COUNT(*) n FROM school.archive_programs')?.n??0,lessons:db.one('SELECT COUNT(*) n FROM school.lessons WHERE id LIKE ?', 'pack:%')?.n??0}};
}
