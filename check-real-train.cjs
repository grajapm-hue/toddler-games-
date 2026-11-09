const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs'),out=process.env.TRAIN_EVIDENCE||path.resolve(__dirname,'artifacts/real-train',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
// These literal groups follow the child's requested sequence, independently of rendering.
const groups=[[1,2,3,4],[5,6,7,8,9],[10,11,12,13],[14,15,16],[17,18,19,20]];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 async function open(){await page.goto(base+'play.html?age=4');await page.locator('[data-age-option="4"]').click();await page.locator('[data-activity="abacus"]').click();await page.locator('[data-count-choice]').first().hover();await page.clock.runFor(150);}
 const viewports=process.env.TRAIN_RED?[[844,390]]:[[480,320],[568,320],[844,390],[390,844],[1024,768],[768,1024],[1366,768]];
 async function geometry(){return page.evaluate(()=>{
  const scene=document.querySelector('#scene'),frame=scene.getBoundingClientRect();
  const nodes=[...scene.querySelectorAll('[data-count-choice]')];
  const boxes=nodes.map(n=>{const b=n.getBoundingClientRect(),label=n.querySelector('text'),text=label.getBoundingClientRect(),matrix=label.getScreenCTM();return{number:Number(n.dataset.countChoice),x:text.x+text.width/2,y:text.y+text.height/2,inside:b.left>=frame.left-1&&b.right<=frame.right+1&&b.top>=frame.top-1&&b.bottom<=frame.bottom+1,numberHeight:parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.a,matrix.b),hit:document.elementFromPoint(text.x+text.width/2,text.y+text.height/2)?.closest('[data-count-choice]')===n};});
  const world=scene.viewBox.baseVal,p1=new DOMPoint(world.x,world.y).matrixTransform(scene.getScreenCTM()),p2=new DOMPoint(world.x+world.width,world.y).matrixTransform(scene.getScreenCTM());
  return{boxes,art:[...scene.querySelectorAll('image[data-train-art]')].map(n=>n.getAttribute('href')),farm:getComputedStyle(document.querySelector('.play-mat')).backgroundImage.includes('farm-sky-v126.webp'),fill:Math.hypot(p2.x-p1.x,p2.y-p1.y)/scene.clientWidth,row:{count:document.querySelector('#item-progress-strip').children.length,width:document.querySelector('#item-progress-strip').clientWidth,scroll:document.querySelector('#item-progress-strip').scrollWidth}};
 });}
 for(const [width,height] of viewports){await page.setViewportSize({width,height});await open();const g=await geometry();
  check(`${width}x${height} has one real engine and four real carriages`,g.art.length===5&&g.art.filter(s=>s.includes('locomotive')).length===1&&g.art.filter(s=>s.includes('carriage')).length===4,g);
  check(`${width}x${height} shows four different colourful carriages in farmland`,new Set(g.art.filter(s=>s.includes('carriage'))).size===4&&g.farm,g);
  check(`${width}x${height} uses the play width and clear tappable numbers`,g.fill>.85&&g.boxes.length===4&&g.boxes.every(n=>n.inside&&n.hit&&n.numberHeight>=14),g);
  check(`${width}x${height} keeps all twenty thumbnails fitted`,g.row.count===20&&g.row.scroll<=g.row.width+1,g.row);
  // Decode the pictures before visual evidence; network completion can follow SVG insertion.
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('image[data-train-art]')].map(n=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=n.getAttribute('href');})).concat(new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='train-art/farm-sky-v126.webp';}))));
  for(const values of groups){
   const start=await geometry();
   check(`${width}x${height} fits group ${values.join('-')} with clear tappable numbers`,JSON.stringify(start.boxes.map(b=>b.number))===JSON.stringify(values)&&start.boxes.every(b=>b.inside&&b.hit&&b.numberHeight>=14),start);
   await page.screenshot({path:path.join(out,`train-${width}x${height}-group-${values[0]}.png`)});
   for(const number of values){
    const current=await geometry();
    check(`${width}x${height} keeps group ${values[0]} fixed while choosing ${number}`,JSON.stringify(current.boxes.map(b=>b.number))===JSON.stringify(values)&&current.boxes.every((b,i)=>Math.hypot(b.x-start.boxes[i].x,b.y-start.boxes[i].y)<1),current);
    await page.locator(`[data-count-choice="${number}"]`).click();await page.clock.runFor(300);
   }
  }
 }
 await page.setViewportSize({width:844,height:390});await open();
 const before=await page.locator('#scene').textContent();await page.locator('[data-count-choice="2"]').click();check('A wrong carriage enlarges its own number without advancing the count',await page.locator('[data-object-feedback="train"]').textContent()==='2'&&await page.locator('#item-progress-strip .is-done').count()===0);await page.clock.runFor(300);check('A wrong carriage restores the unchanged target after its feedback',await page.locator('#scene').textContent()===before);
 for(let n=1;n<=20;n++){
  const values=await page.locator('[data-count-choice]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.countChoice)));
  check('Count '+n+' keeps the complete current group available',JSON.stringify(values)===JSON.stringify(groups.find(g=>g.includes(n))),values);
  if(n===5){
   await page.locator('#show-me').click();await page.clock.runFor(500);
   const pointer=await page.locator('[data-demo-hand]').evaluate(el=>{const target=document.querySelector('[data-demo-target]'),p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM()),b=target.getBoundingClientRect();return Math.hypot(p.x-b.x-b.width/2,p.y-b.y-b.height/2);});
   check('Five-carriage Demo points at the current number',pointer<1.5,pointer);
   for(let t=0;t<100;t++){if(await page.locator('[data-demo-progress] .is-demo-done').count())break;await page.clock.runFor(250);}
   check('Five-carriage Demo completes its preview while preserving four real answers',await page.locator('[data-demo-progress] .is-demo-done').count()===1&&await page.locator('[data-demo-progress] .is-done').count()===5&&await page.locator('#item-progress-strip .is-done').count()===4);
   await page.locator('#show-me').click();
   check('Closing Demo restores the unchanged 5-9 group',JSON.stringify(await page.locator('[data-count-choice]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.countChoice))))===JSON.stringify([5,6,7,8,9]));
  }
  if(n===2||n===6){await page.locator(`[data-count-choice="${n-1}"]`).click();check('A completed carriage cannot advance target '+n,await page.locator('#item-progress-strip .is-done').count()===n-1);}
  const carriage=page.locator(`[data-count-choice="${n}"]`).first();
  if(n===9||n===16){await carriage.focus();await carriage.press(n===9?'Enter':' ');}else await carriage.click();await page.clock.runFor(300);
  check('Count '+n+' completes exactly its thumbnail',await page.locator('#item-progress-strip .is-done').count()===n);
 }
 check('All twenty counts finish',await page.locator('#item-progress-strip .is-done').count()===20);
 await page.clock.runFor(1600);check('Finishing twenty starts a fresh fixed 1-4 group',await page.locator('#item-progress-strip .is-done').count()===0&&JSON.stringify(await page.locator('[data-count-choice]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.countChoice))))===JSON.stringify([1,2,3,4]));
 await open();await page.locator('#show-me').click();await page.clock.runFor(500);
 const pointing=await page.locator('[data-demo-hand]').evaluate(el=>{const target=document.querySelector('[data-demo-target]'),p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM()),b=target.getBoundingClientRect();return{visible:getComputedStyle(el).visibility==='visible',error:Math.hypot(p.x-b.x-b.width/2,p.y-b.y-b.height/2)};});
 check('Demo finger starts on the real carriage number',pointing.visible&&pointing.error<1.5,pointing);
 for(let n=0;n<100;n++){if(await page.locator('[data-demo-progress] .is-demo-done').count())break;await page.clock.runFor(250);}
 check('Real train Demo finishes and ticks only its preview',await page.locator('[data-demo-progress] .is-demo-done').count()===1&&await page.locator('#item-progress-strip .is-done').count()===0);
 await page.locator('#show-me').click();check('Stopping Demo preserves the real train collection',await page.locator('#item-progress-strip .is-done').count()===0&&await page.locator('[data-count-choice="1"]').count()===1);
 await page.setViewportSize({width:390,height:844});await page.locator('[data-count-choice]').first().hover();await page.clock.runFor(200);const rotated=await geometry();check('Resizing the open train keeps its choices clear',rotated.fill>.85&&rotated.boxes.every(n=>n.inside&&n.hit),rotated);
  const number=await page.locator('[data-count-choice="1"] text').evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  if(engine==='chromium')await page.touchscreen.tap(number.x,number.y);
  else await page.mouse.click(number.x,number.y);
  await page.clock.runFor(300);check('The real carriage works with rotated '+(engine==='chromium'?'touch':'pointer')+' input',await page.locator('#item-progress-strip .is-done').count()===1,number);
  check('Train artwork decodes as actual images',await page.evaluate(async()=>{const imgs=[...new Set([...document.querySelectorAll('image[data-train-art]')].map(n=>n.getAttribute('href')))];return imgs.length===5&&(await Promise.all(imgs.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>200);i.onerror=()=>resolve(false);i.src=src;})))).every(Boolean);}));
  if(!process.env.TRAIN_RED){
   await page.goto(base+'index.html');await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   const cached=await page.evaluate(async()=>{const cache=await caches.open(document.querySelector('meta[name="sana-release"]').content);return Promise.all(['locomotive-colour-v126','carriage-turquoise-v126','carriage-yellow-v126','carriage-coral-v126','carriage-violet-v126','farm-sky-v126'].map(name=>cache.match(new URL('train-art/'+name+'.webp',location.href)).then(Boolean)));});check('The installed cache includes every colourful train and farm picture',cached.every(Boolean),cached);
   if(engine==='chromium'){
    const cdp=await context.newCDPSession(page);await cdp.send('Network.clearBrowserCache');await context.setOffline(true);await open();
    const decoded=await page.evaluate(async()=>Promise.all(['locomotive-colour-v126','carriage-turquoise-v126','carriage-yellow-v126','carriage-coral-v126','carriage-violet-v126','farm-sky-v126'].map(name=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>200);i.onerror=()=>resolve(false);i.src='train-art/'+name+'.webp';}))));check('All train and farm pictures reload from the installed cache offline',decoded.every(Boolean),decoded);
    await page.locator('[data-count-choice="1"]').click();await page.clock.runFor(300);check('The real train game advances offline',await page.locator('#item-progress-strip .is-done').count()===1);
   }
   await page.goto(base+'play.html?age=3');await page.locator('[data-age-option="3"]').click();await page.locator('[data-activity="abacus"]').click();
   check('The carrot game shares the requested countryside background',await page.locator('.play-mat').evaluate(el=>getComputedStyle(el).backgroundImage.includes('farm-sky-v126.webp')));
   await page.locator('[data-age-option="4"]').click();await page.locator('#game-home').click();await page.locator('[data-activity="drag"]').click();
   check('All Age 4 games share the requested countryside',await page.locator('.play-mat').evaluate(el=>getComputedStyle(el).backgroundImage.includes('farm-sky-v126.webp')));
  }
 check('No uncaught train-game errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Real train checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
