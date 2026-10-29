import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'docs');
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(file)]||'application/octet-stream'}).end(body);
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=process.env.BETA_URL||`http://127.0.0.1:${server.address().port}/beta/`;
const testURL=new URL('index.html',base).href;
const canonical='https://grajapm-hue.github.io/toddler-games-/beta/index.html';
let checks=0;
try{
  for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await type.launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
    try{
      for(const restricted of [false,true]){
        const context=await browser.newContext({serviceWorkers:'block',viewport:{width:844,height:390}});
        try{
          if(restricted)await context.route(testURL,async route=>{
            const response=await route.fetch();
            await route.fulfill({response,headers:{...response.headers(),'permissions-policy':'web-share=(), clipboard-write=()'}});
          });
          const page=await context.newPage();await page.goto(testURL);
          await page.evaluate(()=>document.addEventListener('copy',()=>{window.compatCopyEvents=(window.compatCopyEvents||0)+1;}));
          await page.getByRole('button',{name:'Share app',exact:true}).click();
          await page.getByRole('button',{name:'Copy link',exact:true}).click();
          await expect(page.locator('#share-result')).toHaveText('Link copied. Paste it into your group.');
          const copyEvents=await page.evaluate(()=>window.compatCopyEvents||0);
          if(engine==='chromium'){
            if(restricted){
              assert(copyEvents>0,'Denied Async Clipboard must use the actual selection-copy fallback');
              await expect(page.getByRole('button',{name:'More apps',exact:true})).toHaveCount(0);
            }
            await context.grantPermissions(['clipboard-read'],{origin:new URL(testURL).origin});
            // Only compare after our own successful copy; never print clipboard contents.
            const matches=await page.evaluate(async expected=>(await navigator.clipboard.readText())===expected,canonical);
            assert(matches,'Actual system clipboard must contain the canonical test link');
          }
          console.log(`PASS ${engine}: real clipboard ${restricted?'with denied-policy header':'without restrictions'}, selection-copy events=${copyEvents}`);checks++;
        }finally{await context.close();}
      }
    }finally{await browser.close();}
  }
  console.log(`PASS: ${checks} browser sharing checks; navigator.clipboard and navigator.share are not mocked.`);
}finally{await new Promise(done=>server.close(done));}
