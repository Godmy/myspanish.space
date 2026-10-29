import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { SchoolService } from '../../src/lib/server/school/service.ts';

const directory = mkdtempSync(join(tmpdir(), 'spanish-production-test-')),
	db = await openSchoolDatabase(directory),
	id = randomUUID(),
	password = randomBytes(24).toString('base64url');
db.run("INSERT INTO pd.users(id,name,role) VALUES(?,?,'admin')", id, 'Production smoke');
new SchoolService(db, false).setCredentials(id, 'smoke-owner', password);
db.close();
const base = 'http://127.0.0.1:5186';
const server = spawn(process.execPath, ['scripts/school/start-node.mjs'], {
	env: {
		...process.env,
		PORT: '5186',
		HOST: '127.0.0.1',
		ORIGIN: base,
		SCHOOL_DATA_DIR: directory,
	},
	stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', (chunk) => {
	logs += chunk.toString();
});
server.stderr.on('data', (chunk) => {
	logs += chunk.toString();
});
try {
	let ready = false;
	for (let i = 0; i < 120; i++) {
		try {
			if ((await fetch(base + '/login')).ok) {
				ready = true;
				break;
			}
		} catch {}
		await setTimeout(250);
	}
	assert(ready, 'Node server did not start. ' + logs.slice(-2000));
	const html = await (await fetch(base + '/login')).text();
	assert(!html.includes('name="userId"'), 'Demo picker must not exist in production');
	const fake = await fetch(base + '/login', {
		method: 'POST',
		headers: {
			Origin: base,
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/html',
		},
		body: new URLSearchParams({ command: 'login', userId: 'admin' }),
		redirect: 'manual',
	});
	assert.equal(fake.status, 422);
	const login = await fetch(base + '/login', {
		method: 'POST',
		headers: {
			Origin: base,
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/html',
		},
		body: new URLSearchParams({ command: 'login', login: 'smoke-owner', password }),
		redirect: 'manual',
	});
	assert.equal(login.status, 303);
	const cookie = login.headers.get('set-cookie')?.split(';')[0];
	assert(cookie);
	assert.equal((await fetch(base + '/staff', { headers: { Cookie: cookie } })).status, 200);
	assert.equal((await fetch(base + '/account/lessons/hola', { redirect: 'manual' })).status, 303);
	console.log(
		'Production Node smoke passed: password auth, admin page, no demo login, anonymous protection.',
	);
} finally {
	server.kill();
	await new Promise((resolve) => {
		if (server.exitCode !== null) resolve(null);
		else server.once('exit', resolve);
	});
	rmSync(directory, { recursive: true, force: true });
}
