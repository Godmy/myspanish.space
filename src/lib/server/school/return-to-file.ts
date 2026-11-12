/** Accept only same-site school-file destinations after login. */
export function fileReturnPath(value: string | null): string | null {
 if (!value || value.length > 2048 || !value.startsWith('/api/school/files/') || /[\u0000-\u001f\u007f]/.test(value)) return null;
 try {
  const url = new URL(value, 'http://school.invalid');
  const prefix = '/api/school/files/';
  if (url.origin !== 'http://school.invalid' || !url.pathname.startsWith(prefix) || url.hash) return null;
  const id = decodeURIComponent(url.pathname.slice(prefix.length));
  if (!/^[a-zA-Z0-9:_-]{1,200}$/.test(id)) return null;
  const child = url.searchParams.get('child');
  if (child !== null && !/^[a-zA-Z0-9:_-]{1,200}$/.test(child)) return null;
  return prefix + id + (child ? '?child=' + encodeURIComponent(child) : '');
 } catch { return null; }
}
