import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

// Writes private curl configs only; the operator runs curl explicitly. No source data is bundled.
const folder=resolve('.school-import'),base='https://myspanish-school-preview.pavarenkinda.workers.dev';
const manifest=JSON.parse(readFileSync(resolve(folder,'manifest.json'),'utf8'));
const cookie=resolve(folder,'preview-cookies.txt').replaceAll('\\','/');
const key=process.env.PREVIEW_ACCESS_KEY||readFileSync('.preview.local/access-key.txt','utf8').trim();
const common=`cookie = ${JSON.stringify(cookie)}\nheader = "Origin: ${base}"\n`;
writeFileSync(resolve(folder,'gate.curl'),`url = "${base}/__preview/login"\nrequest = "POST"\nheader = "Origin: ${base}"\ndata = "key=${encodeURIComponent(key)}"\ncookie-jar = ${JSON.stringify(cookie)}\noutput = "NUL"\nwrite-out = "%{http_code}\\n"\n`);
writeFileSync(resolve(folder,'login.curl'),`url = "${base}/login"\nrequest = "POST"\n${common}header = "Accept: text/html"\ndata = "command=login&userId=admin"\ncookie-jar = ${JSON.stringify(cookie)}\noutput = "NUL"\nwrite-out = "%{http_code}\\n"\n`);
mkdirSync(resolve(folder,'responses'),{recursive:true});
const configs=manifest.batches.map(name=>`url = "${base}/api/school/archive"\nrequest = "POST"\n${common}header = "Content-Type: application/json"\ndata-binary = ${JSON.stringify('@'+resolve(folder,name).replaceAll('\\','/'))}\noutput = ${JSON.stringify(resolve(folder,'responses',name).replaceAll('\\','/'))}\nfail-with-body\nconnect-timeout = 15\nmax-time = 60\nwrite-out = "${name} %{http_code}\\n"\n`);
writeFileSync(resolve(folder,'upload.curl'),configs.join('\nnext\n'));
console.log(`Prepared ${configs.length} authenticated upload requests. Secrets stay in ignored .school-import; do not commit that folder.`);
