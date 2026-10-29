import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
// Read-only page checks against the real preview. Never log credentials or cookies.
const base = 'https://myspanish-school-preview.pavarenkinda.workers.dev';
const key = process.env.PREVIEW_ACCESS_KEY || readFileSync('.preview.local/access-key.txt', 'utf8').trim();
const gate = await fetch(base + '/__preview/login', {
  method: 'POST', headers: { Origin: base }, body: new URLSearchParams({ key }), redirect: 'manual',
});
assert.equal(gate.status, 303, 'Preview password login');
const access = gate.headers.get('set-cookie')?.split(';')[0];
assert(access, 'Preview cookie');
const staff = ['/staff', '/staff/students', '/staff/groups', '/staff/courses', '/staff/review', '/staff/library', '/staff/leads', '/staff/schedule'];
for (const role of ['admin', 'teacher', 'teacher-b', 'student', 'parent']) {
  const login = await fetch(base + '/login', {
    method: 'POST', headers: { Origin: base, Cookie: access, Accept: 'text/html' },
    body: new URLSearchParams({ command: 'login', userId: role }), redirect: 'manual',
  });
  assert.equal(login.status, 303, role + ' login');
  const session = login.headers.get('set-cookie')?.split(';')[0];
  assert(session, role + ' session');
  const staffRole = ['admin', 'teacher', 'teacher-b'].includes(role);
  const cases = staffRole
    ? [...staff.map(path => [path, 200]), ['/staff/settings', role === 'admin' ? 200 : 403], ['/staff/library/import', role === 'admin' ? 200 : 403]]
    : [['/account', 200], ['/account/courses', 200], ['/account/homework', 200], ['/account/materials', 200], ['/staff', 403]];
  for (const [path, expected] of cases) {
    const response = await fetch(base + path, { headers: { Cookie: access + '; ' + session }, redirect: 'manual' });
    assert.equal(response.status, expected, `${role} ${path}`);
    await response.arrayBuffer();
  }
  console.log(`${role}: ${cases.length} deployed page/access checks passed`);
}
