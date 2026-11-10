// Share the verified SvelteKit artifact, with a separate production entry and data binding.
import app from '../.svelte-kit-school-preview/cloudflare/_worker.js';
export { SchoolProduction } from './production-object';

export default {
 async fetch(request:Request,env:ProductionEnv,ctx:ExecutionContext){
  const url=new URL(request.url);
  if(url.hostname==='www.myspanish.space'){
   url.hostname='myspanish.space';return Response.redirect(url.href,301);
  }
  // Preview permissions and demo shortcuts have no production endpoint.
  if(url.pathname.startsWith('/__preview/'))return new Response('Not found',{status:404});
  return app.fetch(request,env,ctx);
 }
};
