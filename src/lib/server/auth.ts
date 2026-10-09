import { error, redirect, type Cookies } from '@sveltejs/kit';
import type { KVNamespace } from '@cloudflare/workers-types';

export const SESSION_COOKIE = 'mss_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const TELEGRAM_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24;

export type UserRole = 'admin' | 'student' | 'teacher' | 'parent';

export interface AuthEnv {
	AUTH_SECRET?: string;
	TELEGRAM_LOGIN_BOT_TOKEN?: string;
	ADMIN_TELEGRAM_IDS?: string;
	ADMIN_TELEGRAM_USERNAMES?: string;
	KV?: KVNamespace;
}

export interface TelegramLoginUser {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: number;
}

export interface SessionClaims {
	sub: number;
	uname?: string;
	name: string;
	role: UserRole;
	iat: number;
	exp: number;
	jti: string;
}

export class AuthError extends Error {
	constructor(public code: string, message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value: string): Uint8Array {
	const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toHex(bytes: ArrayBuffer): string {
	return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

async function sha256(value: string): Promise<ArrayBuffer> {
	return crypto.subtle.digest('SHA-256', encoder.encode(value));
}

async function hmacSha256Hex(message: string, secret: ArrayBuffer): Promise<string> {
	const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return base64UrlEncode(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))));
}

function getRequiredEnv(value: string | undefined, name: string): string {
	if (!value) {
		throw new AuthError('missing_config', `${name} is not configured`);
	}
	return value;
}

function parseAdminIds(raw: string | undefined): Set<number> {
	return new Set(
		(raw ?? '')
			.split(',')
			.map((id) => Number(id.trim()))
			.filter((id) => Number.isSafeInteger(id) && id > 0),
	);
}

function parseAdminUsernames(raw: string | undefined): Set<string> {
	return new Set(
		(raw ?? '')
			.split(',')
			.map((username) => username.trim().replace(/^@/, '').toLowerCase())
			.filter(Boolean),
	);
}

export async function verifyTelegramLogin(params: URLSearchParams, env: AuthEnv): Promise<TelegramLoginUser> {
	const botToken = getRequiredEnv(env.TELEGRAM_LOGIN_BOT_TOKEN, 'TELEGRAM_LOGIN_BOT_TOKEN');
	const receivedHash = params.get('hash');
	const id = Number(params.get('id'));
	const authDate = Number(params.get('auth_date'));
	const firstName = params.get('first_name');

	if (!receivedHash || !Number.isSafeInteger(id) || !Number.isSafeInteger(authDate) || !firstName) {
		throw new AuthError('bad_payload', 'Telegram authorization payload is incomplete');
	}

	const dataCheckString = [...params.entries()]
		.filter(([key]) => key !== 'hash')
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n');

	const secretKey = await sha256(botToken);
	const computedHash = await hmacSha256Hex(dataCheckString, secretKey);
	if (!constantTimeEqual(computedHash, receivedHash)) {
		throw new AuthError('bad_hash', 'Telegram authorization hash is invalid');
	}

	const now = Math.floor(Date.now() / 1000);
	if (authDate > now + 300 || now - authDate > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
		throw new AuthError('stale_payload', 'Telegram authorization payload is stale');
	}

	return {
		id,
		first_name: firstName,
		last_name: params.get('last_name') ?? undefined,
		username: params.get('username') ?? undefined,
		photo_url: params.get('photo_url') ?? undefined,
		auth_date: authDate,
	};
}

export function roleForTelegramUser(user: TelegramLoginUser, env: AuthEnv): UserRole | null {
	if (parseAdminIds(env.ADMIN_TELEGRAM_IDS).has(user.id)) return 'admin';
	if (user.username && parseAdminUsernames(env.ADMIN_TELEGRAM_USERNAMES).has(user.username.toLowerCase())) {
		return 'admin';
	}
	return null;
}

export async function issueSession(user: TelegramLoginUser, role: UserRole, env: AuthEnv): Promise<string> {
	const authSecret = getRequiredEnv(env.AUTH_SECRET, 'AUTH_SECRET');
	const now = Math.floor(Date.now() / 1000);
	const claims: SessionClaims = {
		sub: user.id,
		uname: user.username,
		name: [user.first_name, user.last_name].filter(Boolean).join(' '),
		role,
		iat: now,
		exp: now + SESSION_TTL_SECONDS,
		jti: crypto.randomUUID(),
	};
	const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
	const payload = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
	const body = `${header}.${payload}`;
	const signature = await hmacSha256Base64Url(body, authSecret);
	return `${body}.${signature}`;
}

export async function readSession(token: string | undefined, env: AuthEnv): Promise<SessionClaims | null> {
	if (!token) return null;
	const authSecret = getRequiredEnv(env.AUTH_SECRET, 'AUTH_SECRET');
	const parts = token.split('.');
	if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

	const body = `${parts[0]}.${parts[1]}`;
	const expectedSignature = await hmacSha256Base64Url(body, authSecret);
	if (!constantTimeEqual(expectedSignature, parts[2])) return null;

	const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]))) as SessionClaims;
	const now = Math.floor(Date.now() / 1000);
	if (!Number.isSafeInteger(claims.sub) || !claims.jti || !claims.role || !claims.exp || claims.exp <= now) {
		return null;
	}

	if (env.KV) {
		const [revoked, revokeAll] = await Promise.all([
			env.KV.get(`auth:revoked:${claims.jti}`),
			env.KV.get(`auth:revoke_all:${claims.sub}`),
		]);
		if (revoked) return null;
		if (revokeAll && claims.iat < Number(revokeAll)) return null;
	}

	return claims;
}

export async function revokeSession(claims: SessionClaims | null, env: AuthEnv): Promise<void> {
	if (!claims?.jti || !env.KV) return;
	const ttl = Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
	if (ttl > 0) {
		await env.KV.put(`auth:revoked:${claims.jti}`, '1', { expirationTtl: ttl });
	}
}

export function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_SECONDS,
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function requireAdmin(user: SessionClaims | null): asserts user is SessionClaims {
	if (!user) {
		redirect(302, '/auth/login');
	}
	if (user.role !== 'admin') {
		error(403, 'Forbidden');
	}
}
