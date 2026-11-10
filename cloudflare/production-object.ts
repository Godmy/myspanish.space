import { DurableObject } from 'cloudflare:workers';
import schema from './preview-schema.sql';
import { PreviewSqlStore } from './sql-store';
import { SchoolService } from '../src/lib/server/school/service';
import { seedSchool } from '../src/lib/server/school/seed';
import { buildSchoolView } from '../src/lib/server/school/view-model';
import { SchoolError,type Row } from '../src/lib/server/school/types';

// A distinct namespace: production never reads preview users, sessions or enquiries.
export class SchoolProduction extends DurableObject<ProductionEnv> {
 private school:SchoolService;
 constructor(ctx:DurableObjectState,env:ProductionEnv){
  super(ctx,env);
  const store=new PreviewSqlStore(ctx.storage as any,schema);
  seedSchool(store,false,'school-content');
  this.school=new SchoolService(store,false);
 }
 private async result(callback:()=>any){
  try{return {ok:true,value:await callback()};}
  catch(error){
   if(error instanceof SchoolError)return {ok:false,status:error.status,message:error.message};
   console.error(JSON.stringify({event:'school.operation.failed',type:error instanceof Error?error.name:'unknown'}));
   return {ok:false,status:500,message:'Не удалось выполнить операцию. Попробуйте позже.'};
  }
 }
 async view(token:string,path:string,query:Record<string,string>){return this.result(()=>buildSchoolView(this.school,this.school.user(token),path,new URLSearchParams(query)));}
 async authenticate(login:unknown,password:unknown,ip:string){return this.result(()=>this.school.authenticate(login,password,ip));}
 async logout(token:string){return this.result(()=>this.school.logout(token));}
 async enquiry(data:Row,ip:string){return this.result(()=>this.school.enquire(data,ip));}
 async attempt(token:string,data:Row){return this.result(()=>this.school.attempt(this.school.user(token),data,data.demo===true));}
 async command(token:string,command:string,data:Row,file?:{name:string;type:string;bytes:ArrayBuffer}){
  return this.result(async()=>{const user=this.school.require(this.school.user(token));if(file){const uploaded=await this.school.upload(user,new File([file.bytes],file.name,{type:file.type}));data.uploadId=uploaded.id;}return this.school.command(user,command,data);});
 }
 async attachment(token:string,id:string,child?:string){return this.result(()=>{const user=this.school.user(token),studentId=user&&['student','parent'].includes(user.role)?this.school.student(user,child):undefined;return this.school.file(user,id,studentId);});}
}
