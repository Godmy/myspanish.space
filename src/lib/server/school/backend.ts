import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSchool } from './runtime.ts';
import { previewClient,unwrapPreview } from './preview-client.ts';
import { buildSchoolView } from './view-model.ts';
import { previewImport,applyImport } from './importer.ts';
import type { Row } from './types.ts';

export async function schoolBackend(event:RequestEvent){
 const remote=previewClient(event),token=event.cookies.get('school_session')??'';
 let ip=event.request.headers.get('CF-Connecting-IP')??'preview-local';try{ip=event.getClientAddress();}catch{}
 if(remote)return {
  development:true,
  async view(){return unwrapPreview(await remote.view(token,event.url.pathname,Object.fromEntries(event.url.searchParams)));},
  async login(data:Row){if(!data.userId)throw new (await import('./types.ts')).SchoolError(422,'В закрытом preview используйте карточку демонстрационной роли.');return unwrapPreview(await remote.login(String(data.userId)));},
  async logout(){return unwrapPreview(await remote.logout(token));},
  async enquiry(data:Row){return unwrapPreview(await remote.enquiry(data,ip));},
  async attempt(data:Row){return unwrapPreview(await remote.attempt(token,data));},
  async attachment(id:string,child?:string){return unwrapPreview(await remote.attachment(token,id,child));},
  async command(command:string,data:Row,file?:File){const {file:ignored,...fields}=data;return unwrapPreview(await remote.command(token,command,fields,file?{name:file.name,type:file.type,bytes:await file.arrayBuffer()}:undefined));},
  async importRegistry(csv:string,sourceId:string,digest?:string){return unwrapPreview(await remote.importRegistry(token,csv,sourceId,digest));}
 };
 const service=await getSchool(),user=service.user(token);
 return {
  development:service.development,
  async view(){return buildSchoolView(service,user,event.url.pathname,event.url.searchParams);},
  async login(data:Row){return service.development&&data.userId?service.login(String(data.userId)):service.authenticate(data.login,data.password,ip);},
  async logout(){return service.logout(token);},
  async enquiry(data:Row){return service.enquire(data,ip);},
  async attempt(data:Row){return service.attempt(user,data,data.demo===true);},
  async attachment(id:string,child?:string){const studentId=user&&['student','parent'].includes(user.role)?service.student(user,child):undefined;return service.file(user,id,studentId);},
  async command(command:string,data:Row,file?:File){if(file){const upload=await service.upload(service.require(user),file);data.uploadId=upload.id;}return service.command(user,command,data);},
  async importRegistry(csv:string,sourceId:string,digest?:string){service.require(user,['admin']);if(digest)return applyImport(service.db,csv,sourceId,digest,env.ARCHIVE_SOURCE_ROOT||undefined);const {records,...report}=await previewImport(csv,sourceId,env.ARCHIVE_SOURCE_ROOT||undefined);return {...report,records:records.slice(0,100).map(({physical,...row})=>row)};}
 };
}
