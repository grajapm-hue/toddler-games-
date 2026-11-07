const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.THUMB_EVIDENCE||path.resolve(__dirname,'artifacts/fitted-thumbnails',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
 await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 async function open(age,activity){await page.goto(base+'play.html?age='+age);await page.locator(`[data-age-option="${age}"]`).click();await page.locator(`[data-activity="${activity}"]`).click();await page.clock.runFor(100);}
 async function layout(preview=false){return page.evaluate(preview=>{
  const strip=document.querySelector(preview?'[data-demo-progress]':'#item-progress-strip'),r=strip.getBoundingClientRect();
  const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
  const chips=[...strip.children].map(node=>{const b=node.getBoundingClientRect(),glyphs=[...node.querySelectorAll('svg,.item-emoji,.item-index,.abacus-chip-label,.abacus-chip-value')];
   return{label:node.getAttribute('aria-label'),inside:inside(b,r)&&inside(b,{left:0,right:innerWidth,top:0,bottom:innerHeight}),width:node.offsetWidth,height:node.offsetHeight,glyphsFit:glyphs.every(g=>inside(g.getBoundingClientRect(),b))&&[...node.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).every(n=>{const range=document.createRange();range.selectNodeContents(n);return inside(range.getBoundingClientRect(),b);}),font:parseFloat(getComputedStyle(node).fontSize),hit:preview||node.tagName!=='BUTTON'||document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===node};
  });
  return{count:chips.length,client:strip.clientWidth,scroll:strip.scrollWidth,scrollLeft:strip.scrollLeft,stripHeight:strip.offsetHeight,sceneHeight:document.querySelector('#scene').getBoundingClientRect().height,chips};
 },preview);}
 async function fitted(label,expected,preview=false){const v=await layout(preview);check(label+' shows every thumbnail without sliding',v.count===expected&&v.scroll<=v.client+1&&v.scrollLeft===0&&v.chips.every(n=>n.inside&&n.glyphsFit&&n.hit),v);check(label+' keeps readable labels and the full game height',v.stripHeight<=(label.includes('Count')?47:55)&&v.sceneHeight>45&&v.chips.every(n=>n.font>=9.9&&n.height>=30),v);}
 const viewports=process.env.THUMB_RED?[[568,320]]:[[480,320],[320,480],[568,320],[320,568],[844,390],[390,844],[1024,768],[768,1024],[1366,768]];
 for(const [width,height] of viewports){await page.setViewportSize({width,height});
  for(const age of (process.env.THUMB_RED?[5]:[2,3,4,5])){
   const prefix=`${width}x${height} Age ${age}`;
   for(const [game,total] of [['drag',{2:4,3:12,4:16,5:20}[age]],['slide',{2:4,3:8,4:12,5:16}[age]],['brush',{2:4,3:8,4:12,5:16}[age]],['abacus',{2:5,3:10,4:20,5:10}[age]]]){
    await open(age,game);await fitted(prefix+' '+(game==='abacus'?'Count':game),total);
    if(game==='brush'){
     const last=page.locator(`[data-brush-choice="${total-1}"]`),b=await last.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
     check(prefix+' last drawing is selectable without scrolling',await last.getAttribute('aria-pressed')==='true'&&(await layout()).scrollLeft===0);
     await page.locator('#paint-mode').click();await fitted(prefix+' paint',total);
    }
    if(age===5&&(width===568||width===1024))await page.screenshot({path:path.join(out,`${game}-${width}x${height}.png`)});
   }
   await open(age,'bubbles');
   if(await page.locator('#bubble-full-set').getAttribute('aria-pressed')!=='true')await page.locator('#bubble-full-set').click();
   for(const [mode,total] of [['numbers',20],['letters',26],['shapes',20]]){
    await page.locator(`[data-bubble-mode="${mode}"]`).click();await fitted(prefix+' '+mode+' full set',total);
    if(mode==='letters'&&age===5&&(width===568||width===1024))await page.screenshot({path:path.join(out,`alphabet-${width}x${height}.png`)});
   }
  }
 }
 if(!process.env.THUMB_RED){
  await page.setViewportSize({width:568,height:320});await open(5,'bubbles');await page.locator('[data-bubble-mode="plain"]').click();
  for(const age of [2,3,4,5]){await open(age,'bubbles');await page.locator('[data-bubble-mode="plain"]').click();const n=await page.locator('#item-progress-strip .item-chip').count();await fitted('Plain bubbles Age '+age,n);}
  await page.locator('[data-bubble-mode="letters"]').click();if(await page.locator('#bubble-full-set').getAttribute('aria-pressed')!=='true')await page.locator('#bubble-full-set').click();
  await page.locator('#fullscreen').click();await fitted('Immersive alphabet',26);await page.locator('#exit-play').click();
  await open(5,'brush');await page.locator('#fullscreen').click();await fitted('Immersive drawing buttons',16);await page.locator('#exit-play').click();
  await open(4,'abacus');for(let n=1;n<20;n++)await page.locator(`[data-count-choice="${n}"]`).press('Enter');await fitted('Count 20 after progression',20);check('Completed train thumbnails stay visible',await page.locator('#item-progress-strip .is-done').count()===19);
  for(const [age,game,total] of [[5,'drag',20],[5,'slide',16],[5,'brush',16],[5,'bubbles',26],[4,'abacus',20],[5,'abacus',10]]){
   await open(age,game);if(game==='bubbles'){await page.locator('[data-bubble-mode="letters"]').click();if(await page.locator('#bubble-full-set').getAttribute('aria-pressed')!=='true')await page.locator('#bubble-full-set').click();}
   await page.locator('#show-me').click();
   for(let n=0;n<100;n++){if(await page.locator('[data-demo-progress] .is-demo-done').count())break;await page.clock.runFor(500);}
   await fitted('Demo preview '+game,total,true);check('Demo '+game+' tick fits in the thumbnail row',await page.locator('[data-demo-progress] .is-demo-done').count()===1);await page.locator('#show-me').click();await fitted('Restored '+game,total);
  }
 }
 check('No uncaught thumbnail/game errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Fitted thumbnail checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
