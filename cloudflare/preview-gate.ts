type GateEnv = {
 PREVIEW_ACCESS_KEY?: string;
 PREVIEW_SCHOOL: { getByName(name: string): { gateLimit(ip: string, failed: boolean): Promise<boolean> } };
};
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
async function sign(secret: string, value: string) {
 const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
 return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function equal(a: string, b: string) {
 let difference = a.length ^ b.length;
 for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
 return difference === 0;
}
function failure(message: string, status: number) {
 return Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex,nofollow,noarchive' } });
}

// Only the internal demonstration-role shortcut needs this permission.
// Public pages and ordinary school sessions never require a preview password.
export async function hasPreviewAccess(request: Request, env: Pick<GateEnv, 'PREVIEW_ACCESS_KEY'>): Promise<boolean> {
 const secret = env.PREVIEW_ACCESS_KEY;
 if (!secret || secret.length < 24) return false;
 const cookie = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('preview_access='))?.slice(15) ?? '';
 const [expires, signature] = cookie.split('.');
 return Boolean(expires && signature && Number(expires) > Date.now() && Number(expires) < Date.now() + 90000000 && equal(await sign(secret, expires), signature));
}

export async function previewGate(request: Request, env: GateEnv): Promise<Response | null> {
 const url = new URL(request.url);
 if (url.pathname !== '/__preview/login') return null;
 // Old bookmarks go straight to the site. There is no preview-password page.
 if (request.method !== 'POST') return Response.redirect(new URL('/', url).href, 303);
 const secret = env.PREVIEW_ACCESS_KEY;
 if (!secret || secret.length < 24) return failure('Демонстрационный вход недоступен.', 503);
 if (request.headers.get('origin') !== url.origin) return failure('Источник запроса не разрешён.', 403);
 const reader = request.body?.getReader();
 let body = '', size = 0;
 if (reader) {
  const decoder = new TextDecoder();
  for (;;) {
   const { done, value } = await reader.read();
   if (done) { body += decoder.decode(); break; }
   size += value.byteLength;
   if (size > 4096) { await reader.cancel(); return failure('Запрос слишком большой.', 413); }
   body += decoder.decode(value, { stream: true });
  }
 }
 const ip = await sign(secret, request.headers.get('CF-Connecting-IP') ?? 'local');
 const stub = env.PREVIEW_SCHOOL.getByName('school-v1');
 if (!await stub.gateLimit(ip, false)) return failure('Слишком много попыток. Подождите 10 минут.', 429);
 const supplied = new URLSearchParams(body).get('key') ?? '';
 if (!equal(await sign(secret, supplied), await sign(secret, secret))) {
  await stub.gateLimit(ip, true);
  return failure('Демонстрационный вход не разрешён.', 401);
 }
 const expiration = String(Date.now() + 86400000);
 const value = expiration + '.' + await sign(secret, expiration);
 return new Response(null, { status: 303, headers: {
  Location: '/',
  'Set-Cookie': `preview_access=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${url.protocol === 'https:' ? '; Secure' : ''}`,
  'Cache-Control': 'no-store',
 } });
}
