"""Build private bounded JSON batches from the supplied SQLite snapshot, read-only."""
import argparse, hashlib, json, sqlite3, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,default=Path(__file__).resolve().parents[4]/'.docs/myspanish.space/init-data/school-stage1.sqlite')
parser.add_argument('--output',type=Path,default=Path('.school-import'))
a=parser.parse_args();a.output.mkdir(parents=True,exist_ok=True)
c=sqlite3.connect(a.source.resolve().as_uri()+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
def rows(sql,*args):return [dict(r) for r in c.execute(sql,args)]
def display(s):
 import re
 return re.sub(r'%U([0-9a-fA-F]{4})',lambda m:chr(int(m[1],16)),s)
digest=hashlib.sha256(b'spanish-archive-adapter-v1'+a.source.read_bytes()).hexdigest();batches=[]
def emit(kind,records):
 group=[];size=0
 def save(items):
  part=f'{len(batches):04d}-{kind}';name=part+'.json';body={'digest':digest,'part':part,'kind':kind,'records':items}
  (a.output/name).write_text(json.dumps(body,ensure_ascii=False,separators=(',',':')),encoding='utf-8');batches.append(name)
 for record in records:
  n=len(json.dumps(record,ensure_ascii=False).encode('utf-8'))
  if group and (len(group)>=50 or size+n>700000):save(group);group=[];size=0
  group.append(record);size+=n
 if group:save(group)
folders=rows("select * from archive_folders where purpose!='personal' order by depth,id")
# Also exclude personal descendants regardless of their individual classification.
folder_ids=set();kept=[]
for f in folders:
 if f['parent_id'] is None or f['parent_id'] in folder_ids:folder_ids.add(f['id']);kept.append(f)
emit('folders',kept)
terms={r['id']:r for r in rows('select * from taxonomy_terms')};mt={}
for r in rows('select * from material_terms'):mt.setdefault(r['material_id'],[]).append({**r,'term':terms[r['term_id']]})
evidence={}
for r in rows('select * from material_evidence'):evidence.setdefault(r['material_id'],[]).append(r)
sources={r['id']:r for r in rows('select * from archive_sources')}
materials=[];all_files=rows('select m.*,f.id file_id,f.source_id,f.folder_id,f.relative_path,f.extension,f.bytes,f.binary_sha256,f.legacy_processed,f.processing,f.disposition from materials m join material_files mf on mf.material_id=m.id join archive_files f on f.id=mf.file_id')
for r in all_files:
 if r['disposition']=='personal' or r['folder_id'] not in folder_ids or r['privacy']=='personal':continue
 tags=mt.get(r['id'],[]);topic=next((t['term']['title'] for t in tags if t['term']['kind']=='topic'),'')
 folder=next(f for f in kept if f['id']==r['folder_id'])
 restricted=r['disposition'] in ('technical','quarantine','staff') or folder['purpose'] in ('marketing','evidence','technical','quarantine')
 materials.append({'id':r['id'],'title':display(r['title']),'description':r['description'],'provenance':r['provenance'],'relative_path':r['relative_path'],'source_id':r['source_id'],'folder_id':r['folder_id'],'file_id':r['file_id'],'format':r['extension'].lstrip('.'),'bytes':r['bytes'],'checksum':r['binary_sha256'],'legacy_processed':None if r['legacy_processed'] is None else str(r['legacy_processed']),'processing':r['processing'],'restricted':restricted,'topic':topic,'metadata':{'source':sources[r['source_id']],'disposition':r['disposition'],'source_review':r['source_review'],'kind':r['kind'],'terms':tags,'evidence':evidence.get(r['id'],[]),'rights':'unknown','editorial':'unchecked','publication':'draft','storage':'not_connected'}})
emit('materials',materials)
programs=rows('select * from programs order by id')
for r in programs:r['metadata']=dict(r);r['owner_id']='teacher'
emit('courses',programs)
modules=rows('select id,program_id course_id,title,position,source_folder_id from modules order by program_id,position')
for r in modules:r['title']=display(r['title'])
emit('modules',modules)
lessons=[]
for r in rows('select * from lessons order by module_id,position'):
 blocks=[];notes=[]
 for b in rows('select * from lesson_blocks where lesson_id=? order by position',r['id']):
  body=json.loads(b['body_json'])
  if b['visibility']=='staff':notes.append(json.dumps(body,ensure_ascii=False));continue
  if b['kind']=='phrases':text='Реплики занятия\n'+'\n'.join(p.get('es','')+' ? '+p.get('ru','') for p in (body if isinstance(body,list) else body.get('phrases',[])))
  elif isinstance(body,list):text='\n'.join(str(t) if isinstance(t,str) else json.dumps(t,ensure_ascii=False) for t in body)
  elif isinstance(body,dict):text='\n'.join(str(k)+': '+(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False)) for k,v in body.items())
  else:text=str(body)
  blocks.append({'type':'text','text':text})
 exercises=[]
 for e in rows('select * from exercises where lesson_id=? order by position',r['id']):
  config=json.loads(e['config_json']);exercises.append({'id':e['id'],'kind':e['kind'],'prompt':e['prompt'],'options':[],'pairs':[{'id':str(i),'left':p['es'],'right':p['ru']} for i,p in enumerate(config.get('pairs',[]))],'explanation':'Повторение реплик. Самооценка; адаптация требует редакторского просмотра.'})
 assignment=rows('select * from assignments where lesson_id=?',r['id']);homework=assignment[0]['instructions'] if assignment else ''
 lessons.append({**r,'blocks':blocks,'exercises':exercises,'homework':homework,'teacher_notes':'\n'.join(notes)+'\nИсточник: '+r['provenance']+'\n'+json.dumps(assignment,ensure_ascii=False)})
emit('lessons',lessons)
emit('moduleMaterials',[{'id':r['module_id']+':'+r['material_id'],**r} for r in rows('select * from module_materials')])
emit('lessonMaterials',[{'id':r['lesson_id']+':'+r['material_id'],**r} for r in rows('select * from lesson_materials')])
report={'folders':len(kept),'materials':len(materials),'courses':len(programs),'modules':len(modules),'lessons':len(lessons),'source_files':len(all_files),'original_files':4892,'derived_files':32,'excluded_personal_files':len(all_files)-len(materials),'physical_files_connected':0,'digest':digest,'snapshot':'2026-10-30','source_schema_tables':55}
emit('finish',[report]);(a.output/'manifest.json').write_text(json.dumps({'digest':digest,'batches':batches,'report':report},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));print('Batches:',len(batches));c.close()
