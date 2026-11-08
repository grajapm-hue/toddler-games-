const fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.READY_EVIDENCE||path.resolve(__dirname,'artifacts/fullscreen-ready',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');const body=fs.readFileSync(f);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 let release;const held=new Promise(r=>{release=r;});let intercepted=false;
 await page.route(/\/count-art\/apple\.(png|webp)$/,async route=>{intercepted=true;await held;await route.continue();});
 await page.goto(base+'play.html?age=2');await page.locator('[data-activity="abacus"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-count-fruit]'));
 for(let i=0;i<100&&!intercepted;i++)await page.waitForTimeout(10);
 const loading=await page.locator('#scene').evaluate(el=>({hidden:getComputedStyle(el).visibility==='hidden',busy:el.parentElement.getAttribute('aria-busy')}));
 check('Slow artwork is not exposed as a half-drawn playable board',intercepted&&loading.hidden&&loading.busy==='true',loading);
 await page.locator('#fullscreen').click();
 check('Entering fullscreen during a download keeps the board behind its loading message',await page.locator('#app').evaluate(el=>el.classList.contains('immersive'))&&await page.locator('#scene').evaluate(el=>getComputedStyle(el).visibility==='hidden'));
 release();await page.unrouteAll({behavior:'wait'});
 if(process.env.READY_RED){await context.close();return;}
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.artState==='ready');
 check('The complete apple game becomes playable after decoding',await page.locator('#scene').isVisible()&&await page.locator('[data-count-fruit]').count()===5&&await page.locator('#show-me').isEnabled());
 await page.screenshot({path:path.join(out,'cold-apple-ready-fullscreen.png')});
 await page.locator('#exit-play').click();
 // Fail/retry must be recoverable; leaving a downloading game must not resurrect it.
 let failed=true;await page.route(/\/count-art\/apple\.(png|webp)$/,async route=>{if(failed)await route.abort();else await route.continue();});
 await page.reload();await page.locator('[data-activity="abacus"]').click();await page.waitForFunction(()=>document.querySelector('#scene').dataset.artState==='error');
 check('Unavailable artwork offers a retry while Games remains usable',await page.locator('#game-art-retry').isVisible()&&await page.locator('#game-home').isVisible());failed=false;await page.locator('#game-art-retry').click();await page.waitForFunction(()=>document.querySelector('#scene').dataset.artState==='ready');
 check('Retry restores the original untouched round',await page.locator('[data-count-fruit]').count()===5&&await page.locator('#item-progress-strip .is-done').count()===0);await page.unroute(/\/count-art\/apple\.(png|webp)$/);
 await context.close();
 for(const [age,activity,asset] of [[3,'abacus','carrot.webp'],[4,'abacus','locomotive-colour-v126.webp'],[2,'slide','slide-cave.jpg'],[2,'drag','sana-space-sky-v83.jpg'],[2,'brush','sana-space-sky-v83.jpg'],[2,'bubbles','sana-space-sky-v83.jpg']]){
  const cold=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block'}),p=await cold.newPage();p.on('pageerror',e=>errors.push(e.message));let allow;
  const gate=new Promise(r=>{allow=r;});await p.route('**/'+asset,async route=>{await gate;await route.continue();});
  await p.goto(base+'play.html?age='+age);await p.locator(`[data-activity="${activity}"]`).click();
  check(activity+' waits for its required '+asset,await p.locator('#scene').evaluate(el=>el.dataset.artState==='loading'&&getComputedStyle(el).visibility==='hidden'));
  await p.locator('#game-home').click();allow();await p.unrouteAll({behavior:'wait'});await p.waitForTimeout(100);
  check(activity+' late artwork cannot reopen or block the Games menu',await p.locator('#app').getAttribute('data-view')==='home'&&await p.locator('#game-art-status').isHidden());await cold.close();
 }
 const warm=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'}),game=await warm.newPage();game.on('pageerror',e=>errors.push(e.message));await game.clock.install();
 let requests=0;game.on('request',r=>{if(/\.(png|webp|jpg)(\?|$)/.test(r.url()))requests++;});
 async function ready(){await game.waitForFunction(()=>document.querySelector('#scene').dataset.artState==='ready');}
 async function open(age,activity,mode){await game.goto(base+'play.html?age='+age);await game.locator(`[data-activity="${activity}"]`).click();if(activity==='brush'&&mode==='paint')await game.locator('#paint-mode').click();if(activity==='bubbles')await game.locator(`[data-bubble-mode="${mode}"]`).click();await ready();await game.clock.pauseAt(new Date(await game.evaluate(()=>Date.now()+50)));}
 async function point(selector,x=0,y=0){return game.locator(selector).first().evaluate((el,p)=>{const v=new DOMPoint(p.x,p.y).matrixTransform(el.getScreenCTM());return{x:v.x,y:v.y};},{x,y});}
 async function stroke(from,to){await game.mouse.move(from.x,from.y);await game.mouse.down();await game.mouse.move(to.x,to.y,{steps:6});await game.mouse.up();}
 async function snapshot(){return game.evaluate(()=>({chips:document.querySelector('#item-progress-strip').innerHTML,count:document.querySelectorAll('[data-count-collected]').length,strokes:document.querySelectorAll('[data-stroke]').length,dirt:[...document.querySelectorAll('[data-dirt]')].map(el=>el.getAttribute('opacity')),shapes:[...document.querySelectorAll('[data-piece]')].map(el=>el.dataset.piece),door:document.querySelector('[data-slide-swipe]')?.getAttribute('aria-label'),beads:[...document.querySelectorAll('[data-bead-row][data-moved="true"]')].map(el=>el.dataset.beadRow+'/'+el.dataset.beadIndex),score:document.querySelector('#bubble-score').textContent}));}
 for(const [width,height] of (process.env.READY_EXTRAS_ONLY?[]:process.env.READY_QUICK?[[844,390]]:[[480,320],[844,390],[390,844],[1024,768]])){
  await game.setViewportSize({width,height});
  for(const age of [2,3,4,5])for(const [activity,mode] of [['abacus',''],['drag',''],['slide',''],['brush','clean'],['brush','paint'],['bubbles','plain'],['bubbles','numbers'],['bubbles','letters'],['bubbles','shapes']]){
   await open(age,activity,mode);
   if(activity==='abacus'&&age<4){const to=await game.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await stroke(await point('[data-count-fruit]'),to);}
   if(activity==='abacus'&&age===4)await game.locator('[data-count-choice="1"]').press('Enter');
   if(activity==='abacus'&&age===5)await game.locator('[data-bead-row="0"][data-bead-index="9"]').press('ArrowRight');
   if(activity==='drag'){await game.locator('[data-piece="circle"]').press('Enter');await game.locator('[data-target="circle"]').press('Enter');}
   if(activity==='slide'){await game.locator('[data-slide-swipe]').press('ArrowRight');await game.clock.runFor(400);}
   if(activity==='brush')await stroke(await point('#scene',500,225),await point('#scene',520,225));
   const before=await snapshot(),loads=requests;const timings=[];
   for(let cycle=0;cycle<3;cycle++){
    const start=Date.now();await game.locator('#fullscreen').click();await ready();await game.clock.runFor(80);timings.push(Date.now()-start);
    check(`${width}x${height} age ${age} ${activity}/${mode} fullscreen preserves play ${cycle+1}`,JSON.stringify(await snapshot())===JSON.stringify(before));
    await game.locator('#exit-play').click();await ready();await game.clock.runFor(80);
    check(`${width}x${height} age ${age} ${activity}/${mode} normal preserves play ${cycle+1}`,JSON.stringify(await snapshot())===JSON.stringify(before));
   }
   check(`${width}x${height} age ${age} ${activity}/${mode} reuses artwork without network refresh`,requests===loads,{before:loads,after:requests,toggleMs:timings});
   if(width===844&&age===2&&activity==='abacus'){await game.locator('#fullscreen').click();await game.screenshot({path:path.join(out,'warm-apple-fullscreen.png')});await game.locator('#exit-play').click();}
  }
 }
 await warm.close();
 const native=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),real=await native.newPage();real.on('pageerror',e=>errors.push(e.message));
 await real.addInitScript(()=>{window.__switches=[];document.addEventListener('click',event=>{if(!event.target.closest('#fullscreen,#exit-play'))return;const start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>window.__switches.push(performance.now()-start)));},{capture:true});});
 await real.goto(base+'play.html?age=2');await real.locator('[data-activity="abacus"]').click();await real.waitForFunction(()=>document.querySelector('#scene').dataset.artState==='ready');
 await real.locator('#show-me').click();await real.locator('[data-demo-layer]').waitFor();await real.locator('#fullscreen').click();
 check('Fullscreen safely returns from Demo to the untouched real round',await real.locator('[data-demo-layer]').count()===0&&await real.locator('[data-count-fruit]').count()===5&&!(await real.locator('#hint').textContent()).startsWith('Demo:'));
 await real.locator('#exit-play').click();await real.waitForFunction(()=>window.__switches.length===2);await real.evaluate(()=>{window.__switches=[];});
 const cdp=engine==='chromium'?await native.newCDPSession(real):null;if(cdp)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 for(let i=0;i<6;i++){await real.locator(i%2?'#exit-play':'#fullscreen').click();await real.waitForFunction(n=>window.__switches.length>=n,i+1);}
 const times=await real.evaluate(()=>window.__switches);check('Warm fullscreen switches paint within half a second without an artificial wait',times.length===6&&times.every(t=>t<500),{cpuSlowdown:cdp?4:1,paintMs:times});
 await cdp?.detach();await native.close();check('No browser errors',errors.length===0,errors);
})().catch(error=>{results.push({name:'Unexpected exception',pass:false,detail:error.stack});}).finally(async()=>{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results},null,2));await browser?.close();await new Promise(r=>server.close(r));const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checks:results.length,failed:failed.length,failures:failed.map(r=>({name:r.name,detail:r.detail}))}));process.exitCode=failed.length?1:0;});
