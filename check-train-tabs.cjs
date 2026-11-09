// Equal train headings, no obstructed bottom instruction, and working choices 1–20.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),out=process.env.TABS_EVIDENCE||path.join(__dirname,'artifacts/train-tabs',engine),results=[],errors=[];let browser;
fs.mkdirSync(out,{recursive:true});const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name,JSON.stringify(detail));};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+u.pathname);if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
async function inspect(page){return page.locator('#scene').evaluate(scene=>{
 const glyph=n=>{const boxes=Array.from({length:n.getNumberOfChars()},(_,i)=>n.getExtentOfChar(i));return{x:Math.min(...boxes.map(b=>b.x)),y:Math.min(...boxes.map(b=>b.y)),right:Math.max(...boxes.map(b=>b.x+b.width)),bottom:Math.max(...boxes.map(b=>b.y+b.height))};};
 const labels=['train-title','train-target'].map(key=>{const n=scene.querySelector(`[data-label-for="${key}"]`),g=glyph(n),t=n.previousElementSibling,b=t.getBBox(),m=n.getScreenCTM();return{key,text:n.textContent,font:+n.getAttribute('font-size'),pixels:parseFloat(getComputedStyle(n).fontSize)*Math.hypot(m.a,m.b),tab:t.hasAttribute('data-caption-tab'),x:b.x,y:b.y,width:b.width,height:b.height,fit:g.x>=b.x-1&&g.y>=b.y-1&&g.right<=b.x+b.width+1&&g.bottom<=b.y+b.height+1,centered:Math.abs((g.x+g.right)/2-b.x-b.width/2)<1&&Math.abs((g.y+g.bottom)/2-b.y-b.height/2)<1};});
 return{labels,footer:!!scene.querySelector('[data-train-instruction]')||scene.textContent.includes('Tap the carriage showing'),engine:scene.querySelector('[data-train-engine]')?.textContent,world:{width:scene.viewBox.baseVal.width,height:scene.viewBox.baseVal.height},choices:[...scene.querySelectorAll('[data-count-choice]')].map(n=>+n.dataset.countChoice)};
 });}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 const sizes=process.env.TABS_RED?[[844,390]]:[[480,320],[844,390],[390,844],[1024,768],[768,1024]];
 for(const [width,height] of sizes){await page.setViewportSize({width,height});let normal;
  for(const full of process.env.TABS_RED?[false]:[false,true]){
   await page.goto(base+'play.html?age=4');await page.locator('[data-age-option="4"]').click();await page.locator('[data-activity="abacus"]').click();await page.locator('#scene[data-art-state="ready"]').waitFor();if(full){await page.locator('#fullscreen').click();await page.clock.runFor(150);}await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));
   for(let n=1;n<=(process.env.TABS_RED?1:20);n++){
    await page.clock.runFor(50);const state=await inspect(page),[left,right]=state.labels,label=`${width}x${height}/${full?'full':'normal'}/number ${n}`;
    check(label+' removes the bottom instruction and its tab',!state.footer,state);
    if(n===1)check(label+' names the engine SaNa Express',state.engine==='SaNa Express',state.engine);
    check(label+' uses the left caption font for both headings',Math.abs(left.font-right.font)<.01,state.labels);
    check(label+' gives both top tabs the left tab dimensions',left.tab&&right.tab&&Math.abs(left.width-right.width)<.1&&Math.abs(left.height-right.height)<.1&&Math.abs(left.y-right.y)<.1,state.labels);
    check(label+' centres both captions inside clear on-screen tabs',state.labels.every(v=>v.fit&&v.centered&&v.x>=0&&v.y>=0&&v.x+v.width<=state.world.width&&v.y+v.height<=state.world.height),state);
    if(n===1){if(!full)normal=state.labels.map(v=>v.pixels);else check(`${width} fullscreen headings remain only slightly larger`,state.labels.every((v,i)=>v.pixels/normal[i]>=.95&&v.pixels/normal[i]<=1.16),{normal,full:state.labels.map(v=>v.pixels)});}
    if(width===844&&[1,10,20].includes(n))await page.screenshot({path:path.join(out,`train-${n}-${full?'full':'normal'}.png`)});
    if(!process.env.TABS_RED){await page.locator(`[data-count-choice="${n}"]`).press('Enter');await page.clock.runFor(350);check(label+' still completes exactly its carriage',await page.locator('#item-progress-strip .is-done').count()===n);}
   }
  }
 }
 check('No train layout errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));console.log(JSON.stringify({checks:results.length,failed:results.filter(r=>!r.pass).length}));assert(results.every(r=>r.pass),'Train tab checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
