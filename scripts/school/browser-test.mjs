import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout } from 'node:timers/promises';
const require=createRequire(import.meta.url),base='http://127.0.0.1:5187';
let occupied=false;try{await fetch(base);occupied=true;}catch{}
if(occupied)throw new Error('Test port 5187 is occupied. Stop the previous test server first.');
const server=spawn(process.execPath,['scripts/school/e2e-server.mjs'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';server.stdout.on('data',b=>{log+=b.toString();});server.stderr.on('data',b=>{log+=b.toString();});
try{
 let ready=false;for(let i=0;i<480;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}if(server.exitCode!==null)break;await setTimeout(250);}
 if(!ready)throw new Error('Browser test server failed to start. '+log.slice(-3000));
 const tests=spawn(process.execPath,[require.resolve('@playwright/test/cli'),'test',...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});
 const code=await new Promise(resolve=>tests.once('exit',resolve));process.exitCode=typeof code==='number'?code:1;
}finally{
 if(server.exitCode===null){
  if(process.platform==='win32'){try{execFileSync('taskkill',['/PID',String(server.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{server.kill();}}
  else server.kill('SIGTERM');
 }
}
