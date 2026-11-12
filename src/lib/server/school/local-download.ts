import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { SchoolService } from './service.ts';
import { SchoolError, type User } from './types.ts';

/** Local Node downloads use bounded streams after the existing access check. */
export async function localAttachment(service: SchoolService, user: User | null, id: string, studentId?: string, range?: string | null) {
 const { path, name, mime } = service.fileLocation(user, id, studentId);
 let size: number;
 try { size = (await stat(path)).size; }
 catch { throw new SchoolError(404, 'Вложение недоступно.'); }
 let start = 0, end = size - 1, status = 200;
 const headers: Record<string, string> = { 'Accept-Ranges': 'bytes' };
 if (range) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) throw new SchoolError(416, 'Недопустимый диапазон файла.');
  if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
  else { const length = Number(match[2]); if (!Number.isSafeInteger(length) || length <= 0) throw new SchoolError(416, 'Недопустимый диапазон файла.'); start = Math.max(0, size - length); }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start)
   throw new SchoolError(416, 'Недопустимый диапазон файла.');
  status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length'] = String(size ? end - start + 1 : 0);
 const body = size ? Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream<Uint8Array> : new ReadableStream<Uint8Array>({ start(controller) { controller.close(); } });
 return { name, mime, body, status, headers };
}
