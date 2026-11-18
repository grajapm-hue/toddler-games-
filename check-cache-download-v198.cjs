// Emulate a host that rejects concurrent request bursts and a temporary asset 503.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs'),worker=fs.readFileSync(path.join(root,'beta/sw.js'),'utf8');
const assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]),results=[];
let browser,active=0,peak=0,mode='burst',transientFailures=0;
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=http.createServer((req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
 if(pathname==='/beta/install-check.html'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Cache installation check</title>');return;}
 const file=path.resolve(root,'.'+pathname);assert(file.startsWith(root+path.sep));
 const isAsset=pathname.startsWith('/beta/')&&!pathname.endsWith('/sw.js');let finished=false;
 const finish=()=>{if(isAsset&&!finished){finished=true;active--;}};
 if(isAsset){active++;peak=Math.max(peak,active);res.on('finish',finish);res.on('close',finish);}
 if(isAsset&&mode==='burst'&&active>4){res.writeHead(503).end('Temporary host overload');return;}
 if(isAsset&&pathname.endsWith('/icon-512.png')&&(mode==='persistent'||mode==='transient'&&transientFailures<2)){transientFailures++;res.writeHead(503).end('Temporary host error');return;}
 const send=()=>{if(res.destroyed)return;res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(fs.readFileSync(file));};
 if(isAsset)setTimeout(send,25);else send();
}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch();
 for(const scenario of ['burst','transient','persistent']){
  mode=scenario;peak=0;active=0;transientFailures=0;
  const context=await browser.newContext(),page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/beta/install-check.html`);
  const installed=await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}),worker=registration.installing||registration.waiting||registration.active;
   const state=await new Promise(resolve=>{const timer=setTimeout(()=>resolve('timeout'),30000),check=()=>{if(['activated','redundant'].includes(worker.state)){clearTimeout(timer);worker.removeEventListener('statechange',check);resolve(worker.state);}};worker.addEventListener('statechange',check);check();});
   const keys=await caches.keys();let entries=0;for(const key of keys)entries+=(await(await caches.open(key)).keys()).length;
   return {state,entries};
  });
  if(scenario==='persistent'){
   check('A persistent download failure stops after three attempts',installed.state==='redundant'&&transientFailures===3,{installed,transientFailures});
   check('A failed release does not leave an incomplete cache',installed.entries===0,installed);
  }else{
   check(`${scenario}: the complete release installs`,installed.state==='activated'&&installed.entries===assets.length,installed);
   if(scenario==='burst')check('Asset downloads stay within four concurrent requests',peak<=4,{peak});
   else check('Two temporary 503 responses are retried successfully',transientFailures===2&&installed.state==='activated');
  }
  await context.close();await new Promise(resolve=>setTimeout(resolve,100));
 }
})().catch(error=>{check('Cache-download scenarios complete without an exception',false,error.stack);}).finally(async()=>{
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 const failed=results.filter(result=>!result.pass);console.log(JSON.stringify({checks:results.length,failed:failed.length,failures:failed}));process.exitCode=failed.length?1:0;
});
