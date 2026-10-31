import { importArchiveBatch } from '../src/lib/server/school/archive';
import { DurableObject } from 'cloudflare:workers';
import schema from './preview-schema.sql';
import { PreviewSqlStore } from './sql-store';
import { SchoolService } from '../src/lib/server/school/service';
import { seedSchool } from '../src/lib/server/school/seed';
import { buildSchoolView } from '../src/lib/server/school/view-model';
import { SchoolError,type Row } from '../src/lib/server/school/types';
import { previewImport,applyImport } from '../src/lib/server/school/importer';

export class SchoolPreview extends DurableObject<PreviewEnv> {
 private store:PreviewSqlStore;
 private school:SchoolService;
 constructor(ctx:DurableObjectState,env:PreviewEnv){
  super(ctx,env);this.store=new PreviewSqlStore(ctx.storage as any,schema);seedSchool(this.store);this.school=new SchoolService(this.store,true);
 }
 private async result(callback:()=>any){try{return {ok:true,value:await callback()};}catch(e){if(e instanceof SchoolError)return {ok:false,status:e.status,message:e.message};console.error(JSON.stringify({event:'preview.operation.failed',type:e instanceof Error?e.name:'unknown',message:e instanceof Error?e.message:'unknown'}));return {ok:false,status:500,message:'Не удалось выполнить операцию preview.'};}}
 async view(token:string,path:string,query:Record<string,string>){return this.result(()=>buildSchoolView(this.school,this.school.user(token),path,new URLSearchParams(query)));}
 async archiveImport(token:string,data:Row){return this.result(()=>importArchiveBatch(this.school,this.school.user(token),data));}
 async login(userId:string){return this.result(()=>this.school.login(userId));}
 async logout(token:string){return this.result(()=>this.school.logout(token));}
 async enquiry(data:Row,ip:string){return this.result(()=>this.school.enquire(data,ip));}
 async attempt(token:string,data:Row){return this.result(()=>this.school.attempt(this.school.user(token),data,data.demo===true));}
 async command(token:string,command:string,data:Row,file?:{name:string;type:string;bytes:ArrayBuffer}){
  return this.result(async()=>{const user=this.school.require(this.school.user(token));if(file){const uploaded=await this.school.upload(user,new File([file.bytes],file.name,{type:file.type}));data.uploadId=uploaded.id;}return this.school.command(user,command,data);});
 }
 async attachment(token:string,id:string,child?:string){return this.result(()=>{const user=this.school.user(token),studentId=user&&['student','parent'].includes(user.role)?this.school.student(user,child):undefined;return this.school.file(user,id,studentId);});}
 async importRegistry(token:string,csv:string,sourceId:string,digest?:string){return this.result(async()=>{this.school.require(this.school.user(token),['admin']);if(!digest){const {records,...report}=await previewImport(csv,sourceId);return {...report,records:records.slice(0,100).map(({physical,...row})=>row)};}return applyImport(this.store,csv,sourceId,digest);});}
 async gateLimit(ip:string,failed:boolean){
  const now=Date.now(),row=this.store.sql.exec<{started:number;failures:number}>('SELECT started,failures FROM preview_gate_attempts WHERE ip=?',ip).toArray()[0];
  if(row&&now-row.started<600000&&row.failures>=10)return false;
  if(failed)this.store.sql.exec('INSERT INTO preview_gate_attempts VALUES(?,?,1) ON CONFLICT(ip) DO UPDATE SET started=excluded.started,failures=?',ip,row&&now-row.started<600000?row.started:now,row&&now-row.started<600000?row.failures+1:1);
  return true;
 }
}
