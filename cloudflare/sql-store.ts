import type { DurableObjectStorage, SqlStorage, SqlStorageValue } from '@cloudflare/workers-types';
import type { SchoolStore,SchoolFiles } from '../src/lib/server/school/store.ts';
import type { Row } from '../src/lib/server/school/types.ts';

export class PreviewSqlStore implements SchoolStore {
 directory='/preview';
 private depth=0;
 private storage:DurableObjectStorage;
 sql:SqlStorage;
 files:SchoolFiles;
 constructor(storage:DurableObjectStorage,schema:string){
  this.storage=storage;this.sql=storage.sql;
  this.sql.exec(schema);
  // Repair previews created by the initial schema generator, preserving existing lead notes.
  this.storage.transactionSync(()=>{
   const columns=this.sql.exec<{name:string}>('PRAGMA table_info(pd_leads)').toArray();
   if(columns.some(c=>c.name==='pd_notes')&&!columns.some(c=>c.name==='notes'))
    this.sql.exec('ALTER TABLE pd_leads RENAME COLUMN pd_notes TO notes');
  });
  this.sql.exec('CREATE TABLE IF NOT EXISTS preview_file_chunks(path TEXT NOT NULL,part INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(path,part))');
  this.sql.exec('CREATE TABLE IF NOT EXISTS preview_gate_attempts(ip TEXT PRIMARY KEY,started INTEGER NOT NULL,failures INTEGER NOT NULL)');
  this.files={
   mkdir:()=>{},
   read:(path)=>{
    const rows=this.sql.exec<{data:string}>('SELECT data FROM preview_file_chunks WHERE path=? ORDER BY part',path).toArray();
    if(!rows.length)throw new Error('Preview attachment missing');
    return Buffer.concat(rows.map(row=>Buffer.from(row.data,'base64')));
   },
   write:(path,value)=>this.transaction(()=>{
    this.sql.exec('DELETE FROM preview_file_chunks WHERE path=?',path);
    const bytes=Buffer.from(value);for(let part=0;part*524288<bytes.length;part++)this.sql.exec('INSERT INTO preview_file_chunks VALUES(?,?,?)',path,part,bytes.subarray(part*524288,(part+1)*524288).toString('base64'));
   })
  };
 }
 query(sql:string){return sql.replace(/\b(school|pd)\.(\w+)/g,'$1_$2');}
 all(sql:string,...values:any[]):Row[]{return this.sql.exec(this.query(sql),...values as SqlStorageValue[]).toArray();}
 one(sql:string,...values:any[]):Row|undefined{return this.all(sql,...values)[0];}
 run(sql:string,...values:any[]){this.sql.exec(this.query(sql),...values as SqlStorageValue[]);const row=this.sql.exec<{n:number,id:number}>('SELECT changes() n,last_insert_rowid() id').one();return {changes:row.n,lastInsertRowid:row.id};}
 transaction<T>(callback:()=>T):T{
  if(this.depth)return callback();
  return this.storage.transactionSync(()=>{this.depth++;try{return callback();}finally{this.depth--;}});
 }
}
