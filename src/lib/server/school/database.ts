import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { Row } from './types.ts';

export class SchoolDatabase {
	files={read:(path:string)=>readFileSync(path),write:(path:string,value:Uint8Array)=>{writeFileSync(path,value);},mkdir:(path:string)=>{mkdirSync(path,{recursive:true});}};
	db: DatabaseSync;
	directory: string;
	constructor(db: DatabaseSync, directory: string) {
		this.db = db;
		this.directory = directory;
	}
	all(sql: string, ...values: SQLInputValue[]): Row[] {
		return this.db.prepare(sql).all(...values) as Row[];
	}
	one(sql: string, ...values: SQLInputValue[]): Row | undefined {
		return this.db.prepare(sql).get(...values) as Row | undefined;
	}
	run(sql: string, ...values: SQLInputValue[]) {
		return this.db.prepare(sql).run(...values);
	}
	transaction<T>(fn: () => T): T {
		if (this.db.isTransaction) return fn();
		this.db.exec('BEGIN IMMEDIATE');
		try {
			const value = fn();
			this.db.exec('COMMIT');
			return value;
		} catch (e) {
			this.db.exec('ROLLBACK');
			throw e;
		}
	}
	close() {
		this.db.close();
	}
}

export async function openSchoolDatabase(directory = resolve('.school-data')) {
	mkdirSync(directory, { recursive: true });
	// Runtime-only: the local adapter is not bundled as a Cloudflare SQLite implementation.
	const nativeModule = 'node:sqlite';
	const { DatabaseSync } = (await import(
		/* @vite-ignore */ nativeModule
	)) as typeof import('node:sqlite');
	const db = new DatabaseSync(resolve(directory, 'site.sqlite'));
	db.prepare('ATTACH DATABASE ? AS school').run(resolve(directory, 'school.sqlite'));
	db.prepare('ATTACH DATABASE ? AS pd').run(resolve(directory, 'pd.sqlite'));
	db.exec('PRAGMA busy_timeout=5000;');
	db.exec(readFileSync(resolve('database/migrations/001_school.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=2').get())
		db.exec(readFileSync(resolve('database/migrations/002_assignments.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=3').get())
		db.exec(readFileSync(resolve('database/migrations/003_rights_evidence.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=4').get())
		db.exec(readFileSync(resolve('database/migrations/004_builtin_directions.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=5').get())
		db.exec(readFileSync(resolve('database/migrations/005_import_provenance.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=6').get())
		db.exec(readFileSync(resolve('database/migrations/006_audit.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=7').get())
		db.exec(readFileSync(resolve('database/migrations/007_credentials.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=8').get())
		db.exec(readFileSync(resolve('database/migrations/008_files.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=9').get())
		db.exec(readFileSync(resolve('database/migrations/009_lead_ownership.sql'), 'utf8'));
	if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=10').get())
		db.exec(readFileSync(resolve('database/migrations/010_archive.sql'), 'utf8'));
	return new SchoolDatabase(db, directory);
}
