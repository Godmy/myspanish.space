import { writeFileSync,mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
const directory=mkdtempSync(join(tmpdir(),'spanish-schema-')),db=await openSchoolDatabase(directory);
try{
 let output='-- Generated from the local school migrations. Preview-only namespace, no live data.\n';
 for(const schema of ['main','school','pd']){
  const entries=db.db.prepare(`SELECT type,name,sql FROM ${schema}.sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type='index',rowid`).all() as {type:string;name:string;sql:string}[];
  const tables=entries.filter(e=>e.type==='table').map(e=>e.name);
  for(const entry of entries){let sql=entry.sql;if(schema!=='main'){
   const names=[...tables,...entries.filter(e=>e.type==='index').map(e=>e.name)].sort((a,b)=>b.length-a.length).join('|');
   // Rewrite relation/index identifiers only. A table called notes must not rename a notes column.
   sql=sql.replace(new RegExp('\\b(CREATE(?: UNIQUE)? (?:TABLE|INDEX)\\s+|REFERENCES\\s+|ON\\s+)('+names+')\\b','g'),(_match,prefix,name)=>prefix+schema+'_'+name);
  }sql=sql.replace(/^CREATE TABLE /,'CREATE TABLE IF NOT EXISTS ').replace(/^CREATE INDEX /,'CREATE INDEX IF NOT EXISTS ').replace(/^CREATE UNIQUE INDEX /,'CREATE UNIQUE INDEX IF NOT EXISTS ');output+=sql+';\n';}
 }
 writeFileSync('cloudflare/preview-schema.sql',output);console.log('Preview schema generated without user data.');
}finally{db.close();rmSync(directory,{recursive:true,force:true});}
