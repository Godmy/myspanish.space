import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { SchoolDatabase } from '../../src/lib/server/school/database.ts';
import { SchoolService } from '../../src/lib/server/school/service.ts';
import { localAttachment } from '../../src/lib/server/school/local-download.ts';
import { buildSchoolView } from '../../src/lib/server/school/view-model.ts';
import type { User } from '../../src/lib/server/school/types.ts';

const directory = resolve(process.argv[2] ?? '.school-data');
const report = JSON.parse(readFileSync(resolve(directory, 'local-archive-connection.json'), 'utf8'));
const native = new DatabaseSync(resolve(directory, 'site.sqlite'), { readOnly: true });
native.prepare('ATTACH DATABASE ? AS school').run(resolve(directory, 'school.sqlite'));
native.prepare('ATTACH DATABASE ? AS pd').run(resolve(directory, 'pd.sqlite'));
const db = new SchoolDatabase(native, directory), service = new SchoolService(db, true);
try {
 const admin = db.one("SELECT * FROM pd.users WHERE role='admin' AND active=1 LIMIT 1") as User;
 const teacher = db.one("SELECT * FROM pd.users WHERE role='teacher' AND active=1 LIMIT 1") as User;
 assert(admin); assert(teacher);
 assert.equal(db.one('PRAGMA school.integrity_check')?.integrity_check, 'ok');
 const catalogue = db.all("SELECT * FROM school.materials WHERE source_id IN ('spanish-original','derived-packs')");
 const connected = catalogue.filter(m => !m.missing);
 assert.equal(connected.length, report.connected);
 assert.equal(catalogue.filter(m => m.missing).length, report.unavailable.length);
 for (const material of connected) {
  assert(material.file_id && material.storage_key && material.checksum);
  assert.equal(statSync(resolve(directory, 'files', material.storage_key)).size, material.bytes);
  const file = db.one('SELECT * FROM school.files WHERE id=?', material.file_id);
  assert.equal(file?.checksum, material.checksum);
 }
 // Compare all editorial and learning state with the online backup made before the latest run.
 native.prepare('ATTACH DATABASE ? AS prior').run(report.database_backup);
 for (const table of ['courses','modules','lessons','assignments','entitlements','completions','attempts','submissions','events','lesson_materials','archive_module_materials']) {
  assert.deepEqual(db.all(`SELECT * FROM school.${table} ORDER BY rowid`), db.all(`SELECT * FROM prior.${table} ORDER BY rowid`), table);
 }
 for (const row of db.all('SELECT * FROM prior.materials')) {
  const current = db.one('SELECT * FROM school.materials WHERE id=?', row.id)!;
  assert(current, row.id);
  for (const key of ['title','description','description_source','editorial','publication','rights','privacy','rights_note','topic','level','audience','skills','related'])
   assert.deepEqual(current[key], row[key], `${row.id}.${key}`);
 }
 const samples = [
  connected.find(m => m.source_id === 'spanish-original' && m.format === 'pdf' && m.privacy !== 'restricted' && m.bytes < 5_000_000),
  connected.find(m => m.source_id === 'spanish-original' && m.format === 'mp3' && m.privacy !== 'restricted' && m.bytes < 5_000_000),
  connected.find(m => m.source_id === 'derived-packs' && m.format === 'pdf'),
  connected.find(m => m.id.startsWith('local-unpacked:')),
  connected.find(m => m.id === 'E6e04561c79fc'),
 ].filter((material) => material !== undefined);
 assert.equal(samples.length, 5);
 for (const material of samples) {
  const attachment = service.file(admin, material.id);
  assert.equal(attachment.body.length, material.bytes);
  assert.equal(createHash('sha256').update(attachment.body).digest('hex'), material.checksum);
  assert.throws(() => service.file(null, material.id));
  if (material.privacy === 'restricted') assert.throws(() => service.file(teacher, material.id));
  else assert.equal(service.file(teacher, material.id).body.length, material.bytes);
  assert.equal(buildSchoolView(service, admin, `/staff/library/${material.id}`, new URLSearchParams()).school.material.id, material.id);
 }
 const largest = [...connected].sort((a,b) => b.bytes - a.bytes)[0];
 const download = await localAttachment(service, admin, largest.id);
 assert.equal(Number(download.headers['Content-Length']), largest.bytes);
 const reader = download.body.getReader(), firstChunk = await reader.read();
 assert(!firstChunk.done && firstChunk.value.byteLength <= 64 * 1024); await reader.cancel();
 const range = await localAttachment(service, admin, largest.id, undefined, 'bytes=0-31');
 assert.equal(range.status, 206); assert.equal((await new Response(range.body).arrayBuffer()).byteLength, 32);
 const archive = buildSchoolView(service, admin, '/staff/archive', new URLSearchParams()).school.archive;
 assert.equal(archive.totals.materials, catalogue.length);
 for (const unavailable of report.unavailable) {
  assert.throws(() => service.file(admin, unavailable.id));
  const item = db.one('SELECT instructions FROM school.materials WHERE id=?', unavailable.id)!;
  assert(item.instructions.includes('[Локальный архив]'));
 }
 console.log(JSON.stringify({ connected: connected.length, explainedUnavailable: report.unavailable.length,
  fileServiceSamples: samples.length, editorialAndLearningState: 'preserved', database: 'ok',
  accessControl: 'passed', largestFileStreamed: largest.bytes, archiveMaterials: archive.totals.materials }, null, 2));
} finally { db.close(); }
