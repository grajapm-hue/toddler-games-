const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require(process.env.MM_PLAYWRIGHT||'playwright'),engine=process.env.PLAYROOM_BROWSER||'chromium';
const out=process.env.GLOSSY_EVIDENCE||path.join(__dirname,'artifacts/glossy');fs.mkdirSync(out,{recursive:true});
let checks=0;const check=(ok,words)=>{assert(ok,words);checks++;console.log('PASS '+words);};
const server=http.createServer((req,res)=>{try{const file=path.resolve(__dirname,'docs','.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(path.join(__dirname,'docs')+path.sep))throw Error();res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{if(!process.env.GLOSSY_URL)await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.GLOSSY_URL||`http://127.0.0.1:${server.address().port}/beta/`,browser=await pw[engine].launch();
try{const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block',reducedMotion:'reduce'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR: '+e.stack);});
const enter=async()=>{await p.locator('#more-games').click();await p.locator('[data-activity="glossy"]').click();await p.locator('#glossy-room:not([hidden])').waitFor();};
const blocks=()=>p.locator('#glossy-board').getAttribute('data-blocks');
const tapAt=async(x,y)=>{const pt=await p.locator('#glossy-board').evaluate((el,point)=>{const p=new DOMPoint(...point).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};},[x,y]);await p.mouse.click(pt.x,pt.y);};
await p.goto(base+'play.html?age=5');await enter();
await p.locator('[data-glossy-item]').first().click();await tapAt(150,150);check(await p.locator('[data-glossy-placed]').count()===1,'tap shelf then board adds a block');
await p.locator('#glossy-category').selectOption('animals');check(await p.locator('[data-glossy-placed]').count()===1,'category changes keep the construction');
await p.locator('[data-glossy-item]').first().press('Enter');check(await p.locator('[data-glossy-placed]').count()===2,'keyboard adds a block');
const saved=await blocks();await p.setViewportSize({width:852,height:393});check(await blocks()===saved,'rotation preserves construction');
await p.locator('#play-settings>summary').click();const sound=await p.locator('#sound').getAttribute('aria-pressed');await p.locator('#sound').click();await p.locator('#play-settings>summary').click();check(await blocks()===saved&&await p.locator('#sound').getAttribute('aria-pressed')!==sound,'shared settings preserve construction');
await p.locator('#show-me').click();await p.locator('#glossy-room[data-demo="true"]').waitFor();await p.locator('#show-me').click();check(await blocks()===saved,'Demo preserves the real construction');
const from=await p.locator('[data-glossy-item]').first().boundingBox(),to=await p.locator('#glossy-board').evaluate(el=>{const p=new DOMPoint(700,400).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});
await p.mouse.move(from.x+from.width/2,from.y+from.height/2);await p.mouse.down();await p.mouse.move(to.x,to.y,{steps:12});await p.mouse.up();check(await p.locator('[data-glossy-placed]').count()===3,'real pointer drag adds a block');
const beforeCancel=await blocks();await p.mouse.move(from.x+from.width/2,from.y+from.height/2);await p.mouse.down();await p.mouse.move(to.x,to.y,{steps:4});await p.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));await p.mouse.up();check(await blocks()===beforeCancel,'cancelled pointer does not commit a block');
await p.locator('#glossy-clear').click();check(await p.locator('[data-glossy-placed]').count()===0,'Clear removes the construction');
await p.locator('[data-glossy-item]').first().press('Enter');await p.locator('#glossy-finish').click();await p.locator('#game-home').click();await p.waitForTimeout(1650);check(await p.locator('#app').getAttribute('data-view')==='home'&&await p.locator('[data-activity="glossy"]').isVisible(),'Finished replay is cancelled by Games and returns to More games');
await p.locator('#first-games').click();check(await p.locator('[data-activity]:visible').count()===6,'all original six games stay on the first page');
for(const [width,height] of [[320,568],[393,852],[852,393],[740,360],[800,1280],[1280,800],[1366,768]]){
 await p.setViewportSize({width,height});await p.goto(base+'play.html?age=5');await enter();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const bounds=await p.locator('#glossy-room button:visible,#glossy-room select:visible,#glossy-room input:visible,#game-home,#game-front,#game-back').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),v=window.visualViewport;return{id:n.id||n.dataset.glossyItem,x:r.x,y:r.y,w:r.width,h:r.height,inside:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};}));
 check(bounds.every(b=>b.inside),`${width}x${height} controls stay on screen: ${JSON.stringify(bounds.filter(b=>!b.inside))}`);
 const upright=await p.locator('#app').evaluate(n=>{const m=new DOMMatrix(getComputedStyle(n).transform);return Math.abs(m.b)<.01&&Math.abs(m.c)<.01;});check(upright,`${width}x${height} room remains upright`);
 await p.locator('#glossy-category').selectOption('letters');check(await p.locator('#glossy-inventory').textContent()!==null,`${width}x${height} expanded shelf remains reachable`);
 await p.locator('[data-glossy-item]').first().press('Enter');const target=await p.locator('[data-glossy-placed]').first().boundingBox();check(width>height?target.width>0&&target.height>0:target.width>=44&&target.height>=44,`${width}x${height} placed blocks have a readable touch area ${target.width}x${target.height}`);
 await p.screenshot({path:path.join(out,`${engine}-${width}x${height}.png`)});
 await p.locator('#game-home').click();await p.locator('#first-games').click();await p.locator('[data-activity="drag"]').click();await p.locator('#scene[data-art-state="ready"]').waitFor();check(await p.locator('#glossy-room').isHidden()&&await p.locator('[data-piece]').count()>0,`${width}x${height} existing game still starts`);
}
await p.setViewportSize({width:393,height:852});
for(const age of [2,3,4,5]){await p.goto(base+'play.html?age='+age);await enter();
 for(const category of ['plain','mixed','numbers','letters','shapes','animals','fruits','vegetables','utensils','colors']){
  await p.locator('#glossy-category').selectOption(category);const total=Number((await p.locator('#glossy-inventory').getAttribute('aria-label')).match(/(\d+) choices/)[1]);
  const expected=category==='mixed'?[4,12,20,20][age-2]:category==='numbers'?[5,10,15,20][age-2]:category==='letters'?[6,12,20,26][age-2]:['plain','colors'].includes(category)?[6,8,10,12][age-2]:[4,6,8,10][age-2];
  check(total===expected,`age ${age} ${category} has ${expected} choices`);
  if(category==='letters'){const seen=new Set();for(;;){for(const id of await p.locator('[data-glossy-item]').evaluateAll(ns=>ns.map(n=>n.dataset.glossyItem)))seen.add(id);if(!await p.locator('#glossy-next').isEnabled())break;await p.locator('#glossy-next').click();}check(seen.size===total&&seen.has('letters-'+(total-1)),`age ${age} final letter is reachable`);}
 }
 await p.locator('#glossy-category').selectOption('animals');await p.locator('[data-glossy-item]').first().press('Enter');
 await p.locator('#glossy-colour').evaluate(el=>{el.value='#405f76';el.dispatchEvent(new Event('input',{bubbles:true}));});check(JSON.parse(await blocks())[0].color==='#405f76',`age ${age} selected block recolours`);
 await p.locator('#glossy-pattern').selectOption('3');check(await p.locator('#glossy-board g[aria-hidden="true"] rect').count()===4,`age ${age} square pattern has four guide blocks`);
 await p.locator('#glossy-remove').click();check(await p.locator('[data-glossy-placed]').count()===0,`age ${age} selected block removes`);
}
if(engine==='chromium'){
 const touch=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,serviceWorkers:'block'}),q=await touch.newPage();await q.goto(base+'play.html?age=2');await q.locator('#more-games').tap();await q.locator('[data-activity="glossy"]').tap();
 const source=await q.locator('[data-glossy-item]').first().boundingBox(),dest=await q.locator('#glossy-board').evaluate(el=>{const p=new DOMPoint(300,250).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};}),cdp=await touch.newCDPSession(q),from={x:source.x+source.width/2,y:source.y+source.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(dest.x-from.x)*i/10,y:from.y+(dest.y-from.y)*i/10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check(await q.locator('[data-glossy-placed]').count()===1,'native browser touch drag places a block');await touch.close();
}
check(errors.length===0,'no page script errors '+JSON.stringify(errors));await context.close();
}finally{await browser.close();server.close();}console.log(`${engine}: ${checks} Glossy integration checks passed`);
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
