export type Role = 'admin' | 'teacher' | 'student' | 'parent';
export type User = {
	id: string;
	name: string;
	role: Role;
	timezone: string;
	notifications: number;
};
export type Row = Record<string, any>;
export type Exercise = {
	id: string;
	kind: 'single' | 'multiple' | 'matching' | 'gaps' | 'ordering' | 'cards' | 'text';
	prompt: string;
	options: { id: string; text: string }[];
	answer?: string[];
	pairs?: { id: string; left: string; right: string }[];
	explanation: string;
};
export type Block = {
	type: 'text' | 'image' | 'audio' | 'video' | 'attachment';
	text?: string;
	fileId?: string;
	alt?: string;
};
export class SchoolError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}
