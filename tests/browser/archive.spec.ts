import {test,expect} from '@playwright/test';

test('archive catalogue requires staff; import requires admin; draft metadata does not grant lessons',async({page})=>{
 await page.request.post('/login',{form:{command:'login',userId:'student'}});
 expect((await page.request.get('/staff/archive')).status()).toBe(403);
 const denied=await page.request.post('/api/school/archive',{headers:{Origin:'http://127.0.0.1:5187'},data:{digest:'c'.repeat(64),part:'empty',kind:'folders',records:[]}});
 expect(denied.status()).toBe(403);
 await page.request.post('/login',{form:{command:'login',userId:'admin'}});
 const digest='b'.repeat(64);
 for(const [kind,records] of [
  ['folders',[{id:'browser-folder',parent_id:null,title:'Папка архива · браузер',relative_path:'browser',depth:0,purpose:'learning',source_id:'spanish-browser'}]],
  ['materials',[{id:'browser-original',folder_id:'browser-folder',file_id:'browser-file',source_id:'spanish-browser',relative_path:'browser/original.pdf',title:'Реестр · браузер',description:'Описание из источника',provenance:'browser-fixture',format:'pdf',bytes:10,checksum:null,legacy_processed:'1',processing:'result_completeness_unknown',metadata:{disposition:'catalog'}}]],
 ]){
  const response=await page.request.post('/api/school/archive',{headers:{Origin:'http://127.0.0.1:5187'},data:{digest,part:kind,kind,records}});expect(response.status()).toBe(200);
 }
 for(const width of [360,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/staff/archive');
  await page.getByRole('link',{name:'Папка архива · браузер',exact:false}).click();
  await expect(page.getByRole('heading',{name:'Реестр · браузер'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('link',{name:'Реестр · браузер',exact:true}).click();
 await page.getByText('Происхождение и файл',{exact:true}).click();
 await expect(page.getByText(/Полнота и качество не подтверждены/)).toBeVisible();
 expect((await page.request.get('/api/school/files/browser-original')).status()).toBe(404);
 await page.request.post('/login',{form:{command:'login',userId:'student'}});
 expect((await page.request.get('/staff/library/browser-original')).status()).toBe(403);
 await page.goto('/free-materials');await expect(page.getByRole('heading',{name:'Реестр · браузер'})).toHaveCount(0);
});
