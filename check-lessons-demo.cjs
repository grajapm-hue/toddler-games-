const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const root=path.resolve(__dirname,'docs'),out=process.env.DEMO_EVIDENCE||path.resolve(__dirname,'artifacts/lesson-demo',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 async function open(age,activity){await page.goto(base+'play.html?age='+age);await page.locator(`[data-age-option="${age}"]`).click();await page.locator(`[data-activity="${activity}"]`).click();}
 async function snapshot(){return page.evaluate(()=>({scene:document.getElementById('app').dataset.view==='bubbles'?[]:[...document.querySelector('#scene').children].filter(n=>!n.hasAttribute('data-demo-layer')).map(n=>n.outerHTML.replace(/ style=""/g,'').replace(/ style="[^"]*visibility: hidden;?[^"]*"/g,'')),chips:document.querySelector('#item-progress-strip').innerHTML,saved:JSON.stringify({...localStorage}),title:document.querySelector('#activity-name').textContent,score:document.querySelector('#result-score').textContent}));}
 async function harvestDrag(){const from=await page.locator('[data-count-fruit]').last().evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});const to=await page.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}
 async function imageSizes(){return page.locator('#scene image').evaluateAll(images=>images.filter(el=>!el.closest('[data-count-fruit],[data-count-collected]')).map(el=>({href:el.getAttribute('href'),box:el.getBoundingClientRect().toJSON()})));}
 if(process.env.DEMO_RED){
  const sizes=[];
  for(const age of [2,3]){await open(age,'abacus');sizes.push({age,images:await imageSizes()});check('Age '+age+' has two live calculator displays',await page.locator('[data-count-ledger-value]').count()===2);await harvestDrag();await page.clock.runFor(3200);check('Age '+age+' keeps a running collection after the next count',await page.locator('[data-count-collected]').count()===1&&await page.locator('[data-count-fruit]').count()===(age===2?4:9));}
  fs.writeFileSync(path.join(out,'image-sizes.json'),JSON.stringify(sizes,null,2));await open(4,'abacus');const font=await page.locator('#scene').evaluate(s=>[...s.querySelectorAll('text')].filter(t=>t.textContent.startsWith('Tap the carriage'))[0]?.getAttribute('font-size'));check('Train instruction matches the title size',Number(font)>=38);
  await page.locator('#show-me').click();await page.clock.runFor(1200);check('Demo has an accurately positioned, adaptive finger',await page.locator('[data-demo-hand]').count()===1);
 }else{
  async function demo(label){
   const before=await snapshot();await page.locator('#show-me').click();
   for(let i=0;i<80;i++){if(await page.locator('[data-demo-layer][data-demo-phase="hold"]').count())break;await page.clock.runFor(500);}
   const holding=await page.locator('[data-demo-layer][data-demo-phase="hold"]').count();
   check(label+' reaches a successful virtual action',holding===1);
   if(!holding)throw Error('Demo never held: '+label);
   const geometry=await page.evaluate(()=>{const hand=document.querySelector('[data-demo-hand]'),target=document.querySelector('[data-demo-target]'),h=hand.getBoundingClientRect(),t=target.getBoundingClientRect(),tip=new DOMPoint(0,0).matrixTransform(hand.getScreenCTM());return{offset:Math.hypot(tip.x-(t.x+t.width/2),tip.y-(t.y+t.height/2)),hand:[h.width,h.height],target:[...(target.closest('[data-count-choice]')?.querySelector('rect')?.getBoundingClientRect()?(()=>{const zone=target.closest('[data-count-choice]').querySelector('rect').getBoundingClientRect();return[zone.width,zone.height];})():[t.width,t.height])],tick:document.querySelector('[data-demo-progress]')?.getAttribute('data-success-index')};});
   check(label+' fingertip points to the target centre',geometry.offset<1.5,geometry);
   check(label+' finger is smaller than its touch target',Math.max(...geometry.hand)<Math.min(...geometry.target)+1,geometry);
   await page.clock.runFor(550);check(label+' waits before ticking',await page.locator('[data-demo-layer][data-demo-phase="hold"]').count()===1);
   await page.clock.runFor(3600);if(label.startsWith('Abacus colour')){const chip=await page.locator('[data-demo-progress] .is-demo-done').textContent();check(label+' preview number agrees with its bead',chip.includes('1'),chip);}check(label+' ticks its preview thumbnail',await page.locator('[data-demo-progress][data-success-index] .is-demo-done').count()===1);
   await page.clock.runFor(2200);const after=await snapshot(),remaining=await page.locator('[data-demo-layer],[data-demo-progress]').count();check(label+' restores the real game',remaining===0&&await page.locator('#scene > [style*="visibility: hidden"]').count()===0&&JSON.stringify(after)===JSON.stringify(before));
  }
  for(const age of (process.env.DEMO_FOCUS?[]:[2,3])){await open(age,'abacus');const total=age===2?5:10;for(let n=0;n<total;n++){await demo(`Age ${age} count ${n+1}`);await harvestDrag();const ledger=await page.locator('[data-count-ledger-value]').evaluateAll(nodes=>nodes.map(n=>Number(n.textContent)));check(`Age ${age} collection ${n+1} balances`,ledger[0]===total-n-1&&ledger[1]===n+1,ledger);await page.clock.runFor(1600);check(`Age ${age} keeps all ${n+1} collected items`,await page.locator('[data-count-collected]').count()===n+1&&await page.locator('[data-count-fruit]').count()===total-n-1);}await page.locator('#again').click();check('Again refills age '+age,await page.locator('[data-count-fruit]').count()===total&&await page.locator('[data-count-collected]').count()===0);}
  await open(4,'abacus');for(let n=1;n<=(process.env.DEMO_FOCUS?0:20);n++){await demo('Train carriage '+n);if(n<20)await page.locator(`[data-count-choice="${n}"]`).press('Enter');}
  for(const age of (process.env.DEMO_FOCUS?[]:[2,3,4,5])){
   await open(age,'drag');const total=await page.locator('#item-progress-strip .item-chip').count();
   for(let n=0;n<total;n++){await demo(`Age ${age} shape ${n+1}`);if(n===total-1)break;const id=await page.locator('[data-piece]').first().getAttribute('data-piece');await page.locator(`[data-piece="${id}"]`).press('Enter');await page.locator(`[data-target="${id}"]`).press('Enter');await page.clock.runFor(1600);}
   await open(age,'slide');const rooms=await page.locator('#item-progress-strip .item-chip').count();
   for(let n=0;n<rooms;n++){await demo(`Age ${age} cave room ${n+1}`);if(n===rooms-1)break;await page.locator('[data-slide-swipe]').press('ArrowRight');await page.clock.runFor(420);await page.locator('[data-slide-swipe]').press('ArrowLeft');await page.clock.runFor(420);}
   for(const mode of ['clean','paint']){await open(age,'brush');if(mode==='paint')await page.locator('#paint-mode').click();const rooms=await page.locator('#item-progress-strip .item-chip').count();for(let n=0;n<rooms;n++){await page.locator(`[data-brush-choice="${n}"]`).scrollIntoViewIfNeeded();await page.locator(`[data-brush-choice="${n}"]`).click();await demo(`Age ${age} ${mode} picture ${n+1}`);}}
   await open(age,'bubbles');for(const mode of ['plain','numbers','letters','shapes']){await page.locator(`[data-bubble-mode="${mode}"]`).click();await demo(`Age ${age} ${mode} bubbles`);}
  }
  await open(5,'abacus');for(let row=0;row<10;row++){await page.locator(`[data-bead-row="${row}"][data-bead-index="9"]`).click();await demo('Abacus colour '+row);}
  for(const [width,height] of [[844,390],[390,844],[667,375],[320,568],[768,1024],[1366,768]]){await page.setViewportSize({width,height});await open(4,'abacus');await demo(width+'x'+height+' train');await page.screenshot({path:path.join(out,`train-${width}x${height}.png`)});await open(3,'abacus');await demo(width+'x'+height+' rabbit');}
  const imageSnapshots=[];for(const age of [2,3]){await page.setViewportSize({width:1024,height:768});await open(age,'abacus');imageSnapshots.push({age,images:await imageSizes()});await page.screenshot({path:path.join(out,'count-age-'+age+'.png')});}fs.writeFileSync(path.join(out,'image-sizes.json'),JSON.stringify(imageSnapshots,null,2));
 }
 if(!process.env.DEMO_RED){
  const native=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'no-preference'}),real=await native.newPage();real.on('pageerror',e=>errors.push(e.message));
  await real.goto(base+'play.html?age=4');await real.locator('[data-age-option="4"]').click();await real.locator('[data-activity="abacus"]').click();await real.evaluate(()=>{window.__lessonTiming={};new MutationObserver(()=>{const layer=document.querySelector('[data-demo-layer]');if(layer?.dataset.demoPhase==='hold'&&!window.__lessonTiming.start){window.__lessonTiming.start=performance.now();setTimeout(()=>{window.__lessonTiming.midUnticked=!document.querySelector('[data-demo-progress][data-success-index]');},650);}if(layer?.dataset.demoPhase==='success'&&!window.__lessonTiming.end)window.__lessonTiming.end=performance.now();}).observe(document.getElementById('scene'),{subtree:true,attributes:true,attributeFilter:['data-demo-phase']});});await real.locator('#show-me').click();
  await real.locator('[data-demo-layer][data-demo-phase="hold"]').waitFor();
  const aim=await real.evaluate(()=>{const hand=document.querySelector('[data-demo-hand]'),target=document.querySelector('[data-demo-target]'),h=hand.getBoundingClientRect(),t=target.getBoundingClientRect(),p=new DOMPoint(0,0).matrixTransform(hand.getScreenCTM());return{error:Math.hypot(p.x-t.x-t.width/2,p.y-t.y-t.height/2),hand:Math.max(h.width,h.height),target:Math.min(...(()=>{const zone=target.closest('[data-count-choice]')?.querySelector('rect')?.getBoundingClientRect()||t;return[zone.width,zone.height];})())};});
  check('Normal animation points the contrasting finger at the train numeral',aim.error<2&&aim.hand<aim.target,aim);
  await real.screenshot({path:path.join(out,'train-demo-calm-praise-hold.png')});
  await real.locator('[data-demo-progress][data-success-index="0"]').waitFor({timeout:7000});const timing=await real.evaluate(()=>window.__lessonTiming);check('Real-time Demo keeps the thumbnail unticked during the pause',timing.midUnticked,timing);check('Real-time Demo holds praise before the tick',timing.end-timing.start>=3450,timing);
  await real.locator('#show-me').click();check('Stopping the real-time preview restores Count 1',await real.locator('[data-demo-layer],[data-demo-progress]').count()===0&&await real.locator('#item-progress-strip .is-done').count()===0);await native.close();
 }
 check('No uncaught lesson or demo errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Lesson/demo checks failed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
