import { json, type RequestHandler } from '@sveltejs/kit';
import { schoolBackend } from '$lib/server/school/backend';
import { SchoolError } from '$lib/server/school/types';

export const GET:RequestHandler=async(event)=>{
 try{const backend=await schoolBackend(event);if(!event.params.path?.startsWith('files/'))return json({message:'Не найдено'},{status:404});const id=event.params.path.slice(6);const file=await backend.attachment(id,event.url.searchParams.get('child')??undefined);return new Response(new Uint8Array(file.body),{headers:{'Content-Type':file.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});}catch(e){if(e instanceof SchoolError)return json({message:e.message},{status:e.status});console.error('school.file.failed');return json({message:'Не удалось получить файл.'},{status:500});}
};
export const POST:RequestHandler=async(event)=>{
 try{if(event.request.headers.get('origin')!==event.url.origin)return json({message:'Источник запроса не разрешён.'},{status:403});if(event.params.path!=='attempt')return json({message:'Не найдено'},{status:404});const text=await event.request.text();if(text.length>50000)return json({message:'Ответ слишком большой.'},{status:413});let body;try{body=JSON.parse(text);}catch{return json({message:'Неверный JSON.'},{status:400});}const backend=await schoolBackend(event);return json(await backend.attempt(body));}catch(e){if(e instanceof SchoolError)return json({message:e.message},{status:e.status});console.error('school.attempt.failed');return json({message:'Не удалось сохранить ответ.'},{status:500});}
};
