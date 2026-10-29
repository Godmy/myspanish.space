// The SvelteKit artifact is built before this independent preview Worker.
import app from '../.svelte-kit-school/cloudflare/_worker.js';
import { previewGate } from './preview-gate';
export { SchoolPreview } from './school-object';

export default {
 async fetch(request:Request,env:any,ctx:ExecutionContext){
  const denied=await previewGate(request,env);if(denied)return denied;
  // Native dev-only role entry is intentionally available only behind the preview gate.
  if(new URL(request.url).pathname==='/__preview/login')return Response.redirect(new URL('/',request.url).href,303);
  const response=await app.fetch(request,env,ctx),headers=new Headers(response.headers);
  headers.set('X-Robots-Tag','noindex,nofollow,noarchive');headers.set('Cache-Control','private, no-store');headers.set('X-Preview-Data','demo-only');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
};
