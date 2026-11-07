const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs'),out=process.env.TRAIN_EVIDENCE||path.resolve(__dirname,'artifacts/real-train',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 async function open(){await page.goto(base+'play.html?age=4');await page.locator('[data-age-option="4"]').click();await page.locator('[data-activity="abacus"]').click();await page.locator('[data-count-choice]').first().hover();await page.clock.runFor(150);}
 const viewports=process.env.TRAIN_RED?[[844,390]]:[[480,320],[568,320],[844,390],[390,844],[1024,768],[768,1024],[1366,768]];
 async function geometry(){return page.evaluate(()=>{
  const scene=document.querySelector('#scene'),frame=scene.getBoundingClientRect();
  const nodes=[...scene.querySelectorAll('[data-count-choice]')];
  const boxes=nodes.map(n=>{const b=n.getBoundingClientRect(),label=n.querySelector('text'),text=label.getBoundingClientRect(),matrix=label.getScreenCTM();return{number:Number(n.dataset.countChoice),inside:b.left>=frame.left-1&&b.right<=frame.right+1&&b.top>=frame.top-1&&b.bottom<=frame.bottom+1,numberHeight:parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.a,matrix.b),hit:document.elementFromPoint(text.x+text.width/2,text.y+text.height/2)?.closest('[data-count-choice]')===n};});
  const world=scene.viewBox.baseVal,p1=new DOMPoint(world.x,world.y).matrixTransform(scene.getScreenCTM()),p2=new DOMPoint(world.x+world.width,world.y).matrixTransform(scene.getScreenCTM());
  return{boxes,art:[...scene.querySelectorAll('image[data-train-art]')].map(n=>n.getAttribute('href')),farm:getComputedStyle(document.querySelector('.play-mat')).backgroundImage.includes('farm-sky-v126.png'),fill:Math.hypot(p2.x-p1.x,p2.y-p1.y)/scene.clientWidth,row:{count:document.querySelector('#item-progress-strip').children.length,width:document.querySelector('#item-progress-strip').clientWidth,scroll:document.querySelector('#item-progress-strip').scrollWidth}};
 });}
 for(const [width,height] of viewports){await page.setViewportSize({width,height});await open();const g=await geometry();
  check(`${width}x${height} has one real engine and four real carriages`,g.art.length===5&&g.art.filter(s=>s.includes('locomotive')).length===1&&g.art.filter(s=>s.includes('carriage')).length===4,g);
  check(`${width}x${height} shows four different colourful carriages in farmland`,new Set(g.art.filter(s=>s.includes('carriage'))).size===4&&g.farm,g);
  check(`${width}x${height} uses the play width and clear tappable numbers`,g.fill>.85&&g.boxes.length===4&&g.boxes.every(n=>n.inside&&n.hit&&n.numberHeight>=14),g);
  check(`${width}x${height} keeps all twenty thumbnails fitted`,g.row.count===20&&g.row.scroll<=g.row.width+1,g.row);
  await page.screenshot({path:path.join(out,`train-${width}x${height}.png`)});
 }
 await page.setViewportSize({width:844,height:390});await open();
 const before=await page.locator('#scene').textContent();await page.locator('[data-count-choice="2"]').click();check('A wrong carriage does not advance the count',await page.locator('#scene').textContent()===before);
 for(let n=1;n<=20;n++){
  const values=await page.locator('[data-count-choice]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.countChoice)));
  check('Count '+n+' has four different carriage choices including its target',values.length===4&&new Set(values).size===4&&values.includes(n),values);
  await page.locator(`[data-count-choice="${n}"]`).first().click();check('Count '+n+' completes exactly its thumbnail',await page.locator('#item-progress-strip .is-done').count()===n);
 }
 check('All twenty counts finish',await page.locator('#item-progress-strip .is-done').count()===20);
 await open();await page.locator('#show-me').click();await page.clock.runFor(1000);
 const pointing=await page.locator('[data-demo-hand]').evaluate(el=>{const target=document.querySelector('[data-demo-target]'),p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM()),b=target.getBoundingClientRect();return{visible:getComputedStyle(el).visibility==='visible',error:Math.hypot(p.x-b.x-b.width/2,p.y-b.y-b.height/2)};});
 check('Demo finger starts on the real carriage number',pointing.visible&&pointing.error<1.5,pointing);
 for(let n=0;n<100;n++){if(await page.locator('[data-demo-progress] .is-demo-done').count())break;await page.clock.runFor(250);}
 check('Real train Demo finishes and ticks only its preview',await page.locator('[data-demo-progress] .is-demo-done').count()===1&&await page.locator('#item-progress-strip .is-done').count()===0);
 await page.locator('#show-me').click();check('Stopping Demo preserves the real train collection',await page.locator('#item-progress-strip .is-done').count()===0&&await page.locator('[data-count-choice="1"]').count()===1);
 await page.setViewportSize({width:390,height:844});await page.locator('[data-count-choice]').first().hover();await page.clock.runFor(200);const rotated=await geometry();check('Resizing the open train keeps its choices clear',rotated.fill>.85&&rotated.boxes.every(n=>n.inside&&n.hit),rotated);
  const number=await page.locator('[data-count-choice="1"] text').evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  if(engine==='chromium')await page.touchscreen.tap(number.x,number.y);
  else await page.mouse.click(number.x,number.y);
  check('The real carriage works with rotated '+(engine==='chromium'?'touch':'pointer')+' input',await page.locator('#item-progress-strip .is-done').count()===1,number);
  check('Train artwork decodes as actual images',await page.evaluate(async()=>{const imgs=[...new Set([...document.querySelectorAll('image[data-train-art]')].map(n=>n.getAttribute('href')))];return imgs.length===5&&(await Promise.all(imgs.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>200);i.onerror=()=>resolve(false);i.src=src;})))).every(Boolean);}));
  if(!process.env.TRAIN_RED){
   await page.goto(base+'index.html');await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   const cached=await page.evaluate(async()=>{const cache=await caches.open('sana-little-hands-beta-v126-colourful-train');return Promise.all(['locomotive-colour-v126','carriage-turquoise-v126','carriage-yellow-v126','carriage-coral-v126','carriage-violet-v126','farm-sky-v126'].map(name=>cache.match(new URL('train-art/'+name+'.png',location.href)).then(Boolean)));});check('The installed cache includes every colourful train and farm picture',cached.every(Boolean),cached);
   if(engine==='chromium'){
    const cdp=await context.newCDPSession(page);await cdp.send('Network.clearBrowserCache');await context.setOffline(true);await open();
    const decoded=await page.evaluate(async()=>Promise.all(['locomotive-colour-v126','carriage-turquoise-v126','carriage-yellow-v126','carriage-coral-v126','carriage-violet-v126','farm-sky-v126'].map(name=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>200);i.onerror=()=>resolve(false);i.src='train-art/'+name+'.png';}))));check('All train and farm pictures reload from the installed cache offline',decoded.every(Boolean),decoded);
    await page.locator('[data-count-choice="1"]').click();check('The real train game advances offline',await page.locator('#item-progress-strip .is-done').count()===1);
   }
   await page.goto(base+'play.html?age=3');await page.locator('[data-age-option="3"]').click();await page.locator('[data-activity="abacus"]').click();
   check('The carrot game retains its own background',await page.locator('.play-mat').evaluate(el=>!getComputedStyle(el).backgroundImage.includes('farm-sky-v126.png')));
   await page.locator('[data-age-option="4"]').click();await page.locator('#game-home').click();await page.locator('[data-activity="drag"]').click();
   check('Other Age 4 games retain their own backgrounds',await page.locator('.play-mat').evaluate(el=>!getComputedStyle(el).backgroundImage.includes('farm-sky-v126.png')));
  }
 check('No uncaught train-game errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Real train checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
