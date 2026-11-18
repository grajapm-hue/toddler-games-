'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {before,after,test}=require('node:test');
const {chromium,expect}=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs');let browser,server,base;
before(async()=>{
 server=http.createServer((req,res)=>{try{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);assert(file.startsWith(root+path.sep));
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.css':'text/css','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch();
});
after(async()=>{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
for(const stalled of ['keys','match'])test(`a stalled cache ${stalled} check offers retry within 15 seconds`,async()=>{
 const context=await browser.newContext();try{
  const page=await context.newPage();await page.goto(base+'/beta/index.html');
  await expect(page.locator('#offline-status')).toHaveText('Ready for offline play',{timeout:30000});
  await page.evaluate(()=>localStorage.setItem('update-wait-preserve','keep'));
  await context.addInitScript(stalled=>{
   if(!location.pathname.includes('update-beta-v1.99'))return;
   const hang=()=>{window.testCacheWait=true;return new Promise(()=>{});};
   if(stalled==='keys')Object.defineProperty(window.caches,'keys',{value:hang});
   else Object.defineProperty(Cache.prototype,'match',{value:hang});
  },stalled);
  await page.clock.install();await page.goto(base+'/update-beta-v1.99.html');
  await expect.poll(()=>page.evaluate(()=>!!window.testCacheWait)).toBe(true);
  await page.clock.fastForward(16000);
  assert.equal(await page.locator('#retry').isVisible(),true,'the updater must leave Checking even when browser storage never responds');
  assert.match(await page.locator('#progress').textContent(),/too long|Try again/i);
  assert.equal(await page.evaluate(()=>localStorage.getItem('update-wait-preserve')),'keep');
 }finally{await context.close();}
});
