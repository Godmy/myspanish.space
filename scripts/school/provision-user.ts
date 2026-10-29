import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';
import { createInterface as createPrompt } from 'node:readline/promises';
import { openSchoolDatabase } from '../../src/lib/server/school/database.ts';
import { SchoolService } from '../../src/lib/server/school/service.ts';
// Read credentials from stdin. No defaults, password logging or argument interpolation.
let input;
if (process.argv.includes('--stdin')) input = JSON.parse(readFileSync(0, 'utf8'));
else {
	if (!process.stdin.isTTY)
		throw new Error('Run in a terminal, or pass a JSON object through --stdin.');
	const prompt = createPrompt({ input: process.stdin, output: process.stdout });
	const name = await prompt.question('Name: '),
		login = await prompt.question('Login: '),
		role = await prompt.question('Role (admin/teacher/student/parent): ');
	prompt.close();
	const password = await new Promise<string>((done, reject) => {
		let value = '';
		process.stdout.write('Password (12+ characters, hidden): ');
		emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.resume();
		const handler = (text: string, key: { name?: string; ctrl?: boolean }) => {
			if (key.ctrl && key.name === 'c') {
				cleanup();
				reject(new Error('Cancelled'));
			} else if (key.name === 'return') {
				cleanup();
				done(value);
			} else if (key.name === 'backspace') {
				value = value.slice(0, -1);
			} else if (!key.ctrl && text) {
				value += text;
			}
		};
		const cleanup = () => {
			process.stdin.off('keypress', handler);
			process.stdin.setRawMode(false);
			process.stdin.pause();
			process.stdout.write('\n');
		};
		process.stdin.on('keypress', handler);
	});
	input = { name, login, role, password };
}
if (!['admin', 'teacher', 'student', 'parent'].includes(input.role))
	throw new Error('Invalid role.');
const db = await openSchoolDatabase(process.env.SCHOOL_DATA_DIR ?? '.school-production'),
	service = new SchoolService(db, false);
try {
	const id = randomUUID();
	db.transaction(() => {
		db.run(
			'INSERT INTO pd.users(id,name,role) VALUES(?,?,?)',
			id,
			service.text(input.name, 120),
			input.role,
		);
		service.setCredentials(id, input.login, input.password);
	});
	console.log('User created:', id, 'role:', input.role);
} finally {
	db.close();
}
