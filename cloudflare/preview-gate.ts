type GateEnv={PREVIEW_ACCESS_KEY?:string;PREVIEW_SCHOOL:{getByName(name:string):{gateLimit(ip:string,failed:boolean):Promise<boolean>}}};
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function sign(secret:string,value:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
function equal(a:string,b:string){let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return difference===0;}
function page(message='',status=200){return new Response(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Закрытый preview · Школа испанского</title><style>body{margin:0;background:#fffaf3;color:#262126;font:500 18px/1.65 system-ui}main{max-width:440px;margin:12vh auto;padding:32px}h1{font:800 42px/1.1 system-ui;letter-spacing:-.05em}input,button{box-sizing:border-box;width:100%;padding:14px;border-radius:12px;border:1px solid #d0b5a2;font:inherit;margin:10px 0}button{background:#b9321d;color:white;cursor:pointer;font-weight:700}small{color:#66534c}p[role]{color:#a24930}</style><main><p>MYSPANISH · ЗАКРЫТЫЙ PREVIEW</p><h1>Добро пожаловать.</h1><p>Введите пароль preview. Внутри доступны демонстрационные роли школы.</p>${message?`<p role="alert">${message}</p>`:''}<form action="/__preview/login" method="post"><label for="key">Пароль preview</label><input id="key" name="key" type="password" autocomplete="current-password" required maxlength="200"><button>Открыть preview →</button></form><small>Только демонстрационные данные. Не вводите настоящие контакты, документы и работы учеников.</small></main></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow,noarchive','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});}

export async function previewGate(request:Request,env:GateEnv):Promise<Response|null>{
 const secret=env.PREVIEW_ACCESS_KEY,url=new URL(request.url);
 if(!secret||secret.length<24)return page('Preview ещё настраивается.',503);
 const cookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('preview_access='))?.slice(15)??'';
 const [expires,signature]=cookie.split('.');
 if(expires&&signature&&Number(expires)>Date.now()&&Number(expires)<Date.now()+90000000&&equal(await sign(secret,expires),signature))return null;
 if(url.pathname==='/__preview/login'&&request.method==='POST'){
  if(request.headers.get('origin')!==url.origin)return page('Источник запроса не разрешён.',403);
  const reader=request.body?.getReader();let body='',size=0;if(reader){for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return page('Запрос слишком большой.',413);}body+=new TextDecoder().decode(value);}}
  const ip=await sign(secret,request.headers.get('CF-Connecting-IP')??'local'),stub=env.PREVIEW_SCHOOL.getByName('school-v1');
  if(!await stub.gateLimit(ip,false))return page('Слишком много попыток. Подождите 10 минут.',429);
  const supplied=new URLSearchParams(body).get('key')??'';
  if(!equal(await sign(secret,supplied),await sign(secret,secret))){await stub.gateLimit(ip,true);return page('Неверный пароль preview.',401);}
  const expiration=String(Date.now()+86400000),value=expiration+'.'+await sign(secret,expiration);
  return new Response(null,{status:303,headers:{Location:'/', 'Set-Cookie':`preview_access=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${url.protocol==='https:'?'; Secure':''}`,'Cache-Control':'no-store'}});
 }
 return page();
}
