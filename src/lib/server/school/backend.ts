import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getSchool } from './runtime.ts';
import { previewClient,unwrapPreview } from './preview-client.ts';
import { buildSchoolView } from './view-model.ts';
import { previewImport,applyImport } from './importer.ts';
import { importArchiveBatch } from './archive.ts';
import { localAttachment } from './local-download.ts';
import { SchoolError, type Row } from './types.ts';
import { hasPreviewAccess } from '../../../../cloudflare/preview-gate.ts';

export async function schoolBackend(event:RequestEvent){
 const remote=previewClient(event),token=event.cookies.get('school_session')??'';
 let ip=event.request.headers.get('CF-Connecting-IP')??'preview-local';try{ip=event.getClientAddress();}catch{}
 if(remote){
 const accessKey=Reflect.get(event.platform?.env??{},'PREVIEW_ACCESS_KEY');
 const demoAccess=!Reflect.get(event.platform?.env??{},'SCHOOL')&&await hasPreviewAccess(event.request,{PREVIEW_ACCESS_KEY:typeof accessKey==='string'?accessKey:undefined});
 return {
  development:demoAccess,
  async archive(data:Row){return unwrapPreview(await remote.archiveImport(token,data));},
  async view(){const result=unwrapPreview(await remote.view(token,event.url.pathname,Object.fromEntries(event.url.searchParams)));result.school.local=demoAccess;if(!demoAccess)result.school.demoUsers=[];return result;},
  async login(data:Row){if(data.userId){if(!demoAccess)throw new SchoolError(403,'Войдите по логину и паролю, предоставленным школой.');return unwrapPreview(await remote.login(String(data.userId)));}return unwrapPreview(await remote.authenticate(data.login,data.password,ip));},
  async logout(){return unwrapPreview(await remote.logout(token));},
  async enquiry(data:Row){return unwrapPreview(await remote.enquiry(data,ip));},
  async attempt(data:Row){return unwrapPreview(await remote.attempt(token,data));},
  async attachment(id:string,child?:string,_range?:string|null){return unwrapPreview(await remote.attachment(token,id,child));},
  async command(command:string,data:Row,file?:File){const {file:ignored,...fields}=data;return unwrapPreview(await remote.command(token,command,fields,file?{name:file.name,type:file.type,bytes:await file.arrayBuffer()}:undefined));},
  async importRegistry(csv:string,sourceId:string,digest?:string){return unwrapPreview(await remote.importRegistry(token,csv,sourceId,digest));}
 };}
 const service=await getSchool(),user=service.user(token);
 const localPreview=dev&&env.SCHOOL_PREVIEW_AUTH==='true';
 return {
  development:localPreview,
  async archive(data:Row){return importArchiveBatch(service,user,data);},
  async view(){const result=buildSchoolView(service,user,event.url.pathname,event.url.searchParams);result.school.local=localPreview;if(!localPreview)result.school.demoUsers=[];return result;},
  async login(data:Row){if(data.userId){if(!localPreview)throw new SchoolError(403,'Тестовый вход доступен только на preview.');return service.login(String(data.userId));}return service.authenticate(data.login,data.password,ip);},
  async logout(){return service.logout(token);},
  async enquiry(data:Row){return service.enquire(data,ip);},
  async attempt(data:Row){return service.attempt(user,data,data.demo===true);},
  async attachment(id:string,child?:string,range?:string|null){const studentId=user&&['student','parent'].includes(user.role)?service.student(user,child):undefined;try{return await localAttachment(service,user,id,studentId,range);}catch(error){if(!user&&error instanceof SchoolError&&error.status===404)throw new SchoolError(401,'Войдите в кабинет, чтобы скачать материал.');throw error;}},
  async command(command:string,data:Row,file?:File){if(file){const upload=await service.upload(service.require(user),file);data.uploadId=upload.id;}return service.command(user,command,data);},
  async importRegistry(csv:string,sourceId:string,digest?:string){service.require(user,['admin']);if(digest)return applyImport(service.db,csv,sourceId,digest,env.ARCHIVE_SOURCE_ROOT||undefined);const {records,...report}=await previewImport(csv,sourceId,env.ARCHIVE_SOURCE_ROOT||undefined);return {...report,records:records.slice(0,100).map(({physical,...row})=>row)};}
 };
}
