import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, openSync, ftruncateSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSchoolDatabase } from '../src/lib/server/school/database.ts';
import { seedSchool } from '../src/lib/server/school/seed.ts';
import { SchoolService } from '../src/lib/server/school/service.ts';
import { localAttachment } from '../src/lib/server/school/local-download.ts';
import { SchoolError, type User } from '../src/lib/server/school/types.ts';

async function fixture(t: any) {
 const dir = mkdtempSync(join(tmpdir(), 'school-download-'));
 const db = await openSchoolDatabase(dir); seedSchool(db);
 t.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
 const service = new SchoolService(db, true);
 const admin = db.one("SELECT * FROM pd.users WHERE id='admin'") as User;
 return { dir, db, service, admin };
}

test('local download streams bounded chunks of a file larger than the CSV limit', async t => {
 const { dir, db, service, admin } = await fixture(t);
 const fd = openSync(join(dir, 'files', 'large'), 'w'); ftruncateSync(fd, 101 * 1024 * 1024); closeSync(fd);
 db.run("UPDATE school.materials SET storage_key='large',bytes=?,publication='draft' WHERE id='demo-words'", 101 * 1024 * 1024);
 const file = await localAttachment(service, admin, 'demo-words');
 assert.equal(file.status, 200); assert.equal(file.headers['Content-Length'], String(101 * 1024 * 1024));
 const reader = file.body.getReader(); const first = await reader.read();
 assert(!first.done); assert(first.value.byteLength <= 64 * 1024); await reader.cancel();
 await assert.rejects(localAttachment(service, null, 'demo-words'), (e: unknown) => e instanceof SchoolError && e.status === 404);
});

test('byte ranges, suffix ranges, malformed ranges and empty files', async t => {
 const { dir, db, service, admin } = await fixture(t);
 writeFileSync(join(dir, 'files', 'range'), '0123456789');
 db.run("UPDATE school.materials SET storage_key='range',bytes=10 WHERE id='demo-words'");
 const middle = await localAttachment(service, admin, 'demo-words', undefined, 'bytes=2-5');
 assert.equal(middle.status, 206); assert.equal(middle.headers['Content-Range'], 'bytes 2-5/10');
 assert.equal(await new Response(middle.body).text(), '2345');
 const suffix = await localAttachment(service, admin, 'demo-words', undefined, 'bytes=-3');
 assert.equal(await new Response(suffix.body).text(), '789');
 const last = await localAttachment(service, admin, 'demo-words', undefined, 'bytes=8-99');
 assert.equal(await new Response(last.body).text(), '89');
 for (const range of ['bytes=99-', 'bytes=5-2', 'bytes=-0', 'bytes=0-1,4-5', 'bytes=-'])
  await assert.rejects(localAttachment(service, admin, 'demo-words', undefined, range), (e: unknown) => e instanceof SchoolError && e.status === 416);
 writeFileSync(join(dir, 'files', 'empty'), '');
 db.run("UPDATE school.materials SET storage_key='empty',bytes=0 WHERE id='demo-words'");
 const empty = await localAttachment(service, admin, 'demo-words');
 assert.equal(empty.headers['Content-Length'], '0'); assert.equal(await new Response(empty.body).text(), '');
});

test('restricted files and historical records remain inaccessible to unrelated viewers', async t => {
 const { db, service, admin } = await fixture(t);
 const teacher = db.one("SELECT * FROM pd.users WHERE id='teacher'") as User;
 db.run("UPDATE school.materials SET privacy='restricted' WHERE id='demo-words'");
 await assert.rejects(localAttachment(service, teacher, 'demo-words'));
 const file = await localAttachment(service, admin, 'demo-words'); await file.body.cancel();
 db.run("UPDATE school.materials SET missing=1 WHERE id='demo-words'");
 await assert.rejects(localAttachment(service, admin, 'demo-words'));
});
