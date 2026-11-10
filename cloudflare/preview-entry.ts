// The SvelteKit artifact is built before this independent preview Worker.
import app from '../.svelte-kit-school-preview/cloudflare/_worker.js';
import { previewGate } from './preview-gate';
export { SchoolPreview } from './school-object';

export default {
 async fetch(request:Request,env:any,ctx:ExecutionContext){
  const denied=await previewGate(request,env);if(denied)return denied;
  const response=await app.fetch(request,env,ctx),headers=new Headers(response.headers);
  headers.set('X-Robots-Tag','noindex,nofollow,noarchive');headers.set('Cache-Control','private, no-store');headers.set('X-Preview-Data','archive-metadata-and-demo-accounts');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
};
