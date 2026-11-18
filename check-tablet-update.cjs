// Run real-browser checks for the read-only Fire tablet diagnostic page.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs/beta'),results=[];
let browser,mode='ok',workerRequests=0;
const check=(name,pass)=>{results.push({name,pass:!!pass});console.log((pass?'PASS ':'FAIL ')+name);};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(pathname==='/beta/sw.js'){
  workerRequests++;
  if(mode==='stall')return;
  if(mode==='503'){res.writeHead(503).end('Temporary failure');return;}
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(fs.readFileSync(path.join(root,'sw.js')));return;
 }
 const file=path.join(root,path.basename(pathname));
 if(!fs.existsSync(file)){res.writeHead(404).end('Missing tablet check page');return;}
 res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'}).end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await(process.env.PLAYROOM_BROWSER==='webkit'?webkit:chromium).launch();
 for(const scenario of ['ok','offline-hint','unsupported','insecure','503','stall']){
  mode=scenario;workerRequests=0;
  const context=await browser.newContext({viewport:{width:1024,height:600}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(scenario=>{
   if(scenario==='offline-hint')Object.defineProperty(Navigator.prototype,'onLine',{get:()=>false,configurable:true});
   if(scenario==='unsupported')delete Navigator.prototype.serviceWorker;
   if(scenario==='insecure')Object.defineProperty(window,'isSecureContext',{value:false,configurable:true});
  },scenario);
  // Seed a setting before opening the diagnostic; avoid running the updater fixture.
  await page.route('**/v1.98.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Seed settings</title>'}));
  await page.goto(base+'v1.98.html');
  await page.evaluate(()=>localStorage.setItem('sana-diagnostic-preserve','keep'));
  await page.goto(base+'tablet-check.html');
  const exists=await page.getByRole('heading',{name:'SaNa tablet check'}).count();
  check(scenario+': diagnostic page exists',exists===1);
  if(!exists){await context.close();break;}
  await page.waitForFunction(()=>document.getElementById('result').dataset.complete==='true',{},{timeout:15000});
  const data=await page.evaluate(()=>({result:document.getElementById('result').textContent,network:document.getElementById('network').textContent,secure:document.getElementById('secure').textContent,support:document.getElementById('support').textContent,version:document.getElementById('release').textContent,setting:localStorage.getItem('sana-diagnostic-preserve'),overflow:document.documentElement.scrollWidth>innerWidth}));
  if(scenario==='ok')check('Healthy browser reports available release and passes connection',/checks passed/i.test(data.result)&&/HTTP 200/.test(data.network)&&/v1\.98/.test(data.version));
  if(scenario==='offline-hint')check('A false offline hint is distinguished from a working network',/offline/i.test(data.result)&&/HTTP 200/.test(data.network));
  if(scenario==='unsupported')check('Missing worker support has its own explanation',/browser.*update support/i.test(data.result)&&data.support==='No');
  if(scenario==='insecure')check('An insecure context has its own explanation',/secure/i.test(data.result)&&data.secure==='No');
  if(scenario==='503')check('A host error displays its actual HTTP status',/HTTP 503/.test(data.network)&&/connection/i.test(data.result));
  if(scenario==='stall')check('A stalled connection finishes with a bounded timeout',/timed out/i.test(data.network));
  check(scenario+': settings survive and no script errors or horizontal overflow',data.setting==='keep'&&!errors.length&&!data.overflow);
  check(scenario+': only one read-only network probe runs',workerRequests===1);
  if(scenario==='ok'){
   check('The check page never registers a service worker',(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(items=>items.length)))===0);
   await page.screenshot({path:path.join(__dirname,'artifacts/tablet-check-'+(process.env.PLAYROOM_BROWSER||'chromium')+'.png'),fullPage:true});
  }
  await context.close();
 }
})().catch(error=>{check('Tablet diagnostic completes without an exception',false);console.error(error.stack);}).finally(async()=>{
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 const failed=results.filter(result=>!result.pass);console.log(JSON.stringify({checks:results.length,failed:failed.length,failures:failed}));process.exitCode=failed.length?1:0;
});
