// The written request must match the one extra object needed by cumulative counting.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),out=process.env.WORD_EVIDENCE||path.join(__dirname,'artifacts/count-instructions',engine),results=[],errors=[];let browser;
fs.mkdirSync(out,{recursive:true});const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name,JSON.stringify(detail));};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+u.pathname);if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 const instruction=()=>page.locator('#scene > text[data-label-for="harvest-prompt"]').last().textContent();
 async function read(){return page.evaluate(()=>({hint:document.getElementById('hint-copy').textContent,source:document.querySelector('[data-count-ledger-value="source"]').textContent,collected:document.querySelector('[data-count-ledger-value="collected"]').textContent,counter:document.querySelector('[data-count-counter]').textContent}));}
 const sizes=process.env.WORD_RED?[[1024,768]]:[[844,390],[390,844],[1024,768]];
 for(const [width,height] of sizes){await page.setViewportSize({width,height});for(const age of [2,3])for(const full of process.env.WORD_RED?[false]:[false,true]){
  await page.goto(base+'play.html?age='+age);await page.locator('[data-activity="abacus"]').click();await page.locator(`[data-age-option="${age}"]`).click();await page.locator('#scene[data-art-state="ready"]').waitFor();if(await page.locator('#sound').getAttribute('aria-pressed')==='true')await page.locator('#sound').click();if(full){await page.locator('#fullscreen').click();await page.clock.runFor(150);}await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));
  const total=age===2?5:10;
  for(let n=1;n<=(process.env.WORD_RED?2:total);n++){
   const label=`${width} age ${age}/${full?'full':'normal'}/count ${n}`,expected=n===1?(age===2?'Put 1 apple in the basket.':'Give 1 carrot to the rabbit.'):`${age===2?'Add 1 more apple':'Give 1 more carrot'} to make ${n}.`,state=await read(),text=await instruction();
   check(label+' asks for the additional item instead of the total again',text===expected,{text,expected,state});check(label+' hint agrees with the scene instruction',state.hint===expected,{hint:state.hint,expected});check(label+' still has the previous running total',state.collected===String(n-1)&&state.source===String(total-n+1)&&state.counter===`${n-1} / ${n}`,state);
   if(!process.env.WORD_RED&&n===2){
    const before=await read();if(full)await page.locator('#show-me').evaluate(el=>el.click());else await page.locator('#show-me').click();await page.clock.runFor(400);if(full)await page.locator('#show-me').evaluate(el=>el.click());else await page.locator('#show-me').click();check(label+' stopping Demo restores the same one-more instruction',await instruction()===expected&&JSON.stringify(await read())===JSON.stringify(before));
    if(full)await page.locator('#show-me').evaluate(el=>el.click());else await page.locator('#show-me').click();await page.clock.runFor(2000);
    const shown=await page.locator('[data-demo-phase="success"] [data-count-instruction]').textContent();check(label+' Demo names the completed total',shown===(age===2?'2 apples in the basket.':'2 carrots with the rabbit.'),shown);await page.clock.runFor(950);check(label+' Demo restores the request for one more',await instruction()===expected&&JSON.stringify(await read())===JSON.stringify(before));
    await page.screenshot({path:path.join(out,`count-two-age${age}-${width}-${full?'full':'normal'}.png`)});
   }
   const from=await page.locator('[data-count-fruit]').last().evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};}),to=await page.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();
   check(label+' completes by adding exactly one object',await page.locator('[data-count-collected]').count()===n&&await page.locator('[data-count-praise]').count()===1);await page.clock.runFor(1600);
  }
 }}
 check('No instruction or counting errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));console.log(JSON.stringify({checks:results.length,failed:results.filter(r=>!r.pass).length}));assert(results.every(r=>r.pass),'Count instruction checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
