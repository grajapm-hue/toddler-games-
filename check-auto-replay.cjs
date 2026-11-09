// Exercise the shipped Beta through real input, including the navigation that hid Drag artwork.
const fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const sharp=require(process.env.MM_SHARP||'C:/Users/jeyan/Projects/DotMd/node_modules/sharp');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.REPLAY_EVIDENCE||path.resolve(__dirname,'artifacts/auto-replay',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
 await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 async function open(age,activity){await page.goto(base+'play.html?age='+age);await page.locator(`[data-activity="${activity}"]`).click();await page.locator(`[data-age-option="${age}"]`).click();await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));}
 async function switchTo(activity){await page.locator('#game-home').click();await page.locator(`[data-activity="${activity}"]`).click();await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));}
 async function point(selector,x=0,y=0){return page.locator(selector).first().evaluate((el,p)=>{const v=new DOMPoint(p.x,p.y).matrixTransform(el.getScreenCTM());return{x:v.x,y:v.y};},{x,y});}
 async function drag(selector,to){const from=await point(selector);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}
 async function harvest(){if(process.env.REPLAY_IMMERSIVE&&!await page.locator('#app').evaluate(el=>el.classList.contains('immersive')))await page.locator('#fullscreen').click();const to=await page.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await drag('[data-count-fruit]',to);}
 async function pause(label,advanced){if(process.env.REPLAY_IMMERSIVE&&!await page.locator('#app').evaluate(el=>el.classList.contains('immersive')))await page.locator('#fullscreen').click();await page.clock.runFor(1400);check(label+' holds before 1.5 seconds',!await advanced());await page.clock.runFor(100);check(label+' advances at 1.5 seconds',await advanced());}
 async function pixels(name){const points=await page.locator('[data-piece]').evaluateAll(nodes=>nodes.map(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{id:el.dataset.piece,x:p.x,y:p.y};}));const buffer=await page.screenshot({path:path.join(out,name+'.png')}),{data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});return points.map(p=>({...p,rgb:[...data.subarray((Math.round(p.y)*info.width+Math.round(p.x))*info.channels,(Math.round(p.y)*info.width+Math.round(p.x))*info.channels+3)]}));}
 // A pixel comparison is essential: invisible filtered shapes still have DOM boxes and hit targets.
 await open(5,'drag');const baseline=await pixels('drag-before-bubbles');
 await switchTo('bubbles');await page.locator('[data-bubble-mode="shapes"]').click();await switchTo('drag');
 const after=await pixels('drag-after-shape-bubbles');
 check('Drag shapes remain visibly coloured after visiting Shape Bubbles',after.length===4&&after.every((p,i)=>p.rgb.every((c,j)=>Math.abs(c-baseline[i].rgb[j])<12)),{baseline,after});
 for(const age of [2,3]){
  await open(age,'abacus');const max=age===2?5:10;
  for(let n=1;n<=max;n++){await harvest();await page.clock.runFor(1400);check(`Age ${age} count ${n} retains its collection before ticking`,await page.locator('[data-count-collected]').count()===n&&await page.locator('#item-progress-strip .is-done').count()===n-1);await page.clock.runFor(100);check(`Age ${age} count ${n} ticks at 1.5 seconds`,await page.locator('#item-progress-strip .is-done').count()===n);}
  check(`Age ${age} celebrates the whole completed collection`,await page.locator('[data-count-collected]').count()===max&&await page.locator('#item-progress-strip .is-done').count()===max);
  await pause(`Age ${age} final count`,async()=>await page.locator('[data-count-collected]').count()===0);
  check(`Age ${age} automatically refills for another game`,await page.locator('[data-count-fruit]').count()===max&&await page.locator('[data-count-collected]').count()===0&&await page.locator('#item-progress-strip .is-done').count()===0);
 }
 if(!process.env.REPLAY_RED){
  for(const age of [2,3,4,5]){
   await open(age,'drag');const limit={2:4,3:12,4:16,5:20}[age];
   for(let round=0;round<2;round++){
    for(let n=0;n<limit;n++){const id=await page.locator('[data-piece]').first().getAttribute('data-piece');await page.locator(`[data-piece="${id}"]`).press('Enter');await page.locator(`[data-target="${id}"]`).press('Enter');if((n+1)%4===0&&n+1<limit)await pause(`Age ${age} next shape batch`,async()=>await page.locator('[data-piece]').count()===4);}
    await pause(`Age ${age} Drag`,async()=>await page.locator('[data-piece]').count()===4);check(`Age ${age} Drag automatically starts round ${round+2}`,await page.locator('[data-piece]').count()===4&&await page.locator('[data-piece="circle"]').count()===1&&await page.locator('#art-reward').isHidden());
   }
   await open(age,'slide');const rooms={2:4,3:8,4:12,5:16}[age];
   for(let i=0;i<rooms;i++){await page.locator('[data-slide-swipe]').press('ArrowRight');await page.clock.runFor(400);await page.locator('[data-slide-swipe]').press('ArrowLeft');await page.clock.runFor(400);}
   check(`Age ${age} Cave loops to its first closed room`,(await page.locator('#scene').getAttribute('aria-label')).includes('Cave door 1 of')&&await page.locator('[data-slide-swipe]').getAttribute('aria-label')==='Slide door open to reveal Apple');
  }
  // A tall board lets keyboard play wait for whole bubbles rather than clipped edges.
  await page.setViewportSize({width:1024,height:768});
  for(const age of [2,3,4,5])for(const mode of ['plain','numbers','letters','shapes']){
   await open(age,'bubbles');await page.locator(`[data-bubble-mode="${mode}"]`).click();await page.locator('[data-bubble-size="small"]').click();await page.locator('[data-bubble-speed="slow"]').click();
   for(let tick=0;tick<600;tick++){if(await page.locator('#art-reward').isVisible())break;const b=page.locator('[data-bubble][data-onstage="true"]').first();if(await b.count())await b.press('Enter');else await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));}
   check(`Age ${age} ${mode} bubbles can finish`,await page.locator('#art-reward').isVisible());await pause(`Age ${age} ${mode} bubbles`,async()=>await page.locator('#art-reward').isHidden());
   check(`Age ${age} ${mode} bubbles automatically refill`,await page.locator('#art-reward').isHidden()&&await page.locator('#item-progress-strip .is-done').count()===0&&await page.locator('[data-bubble]').count()>0);
  }
  await open(4,'abacus');for(let n=1;n<=20;n++){await page.locator(`[data-count-choice="${n}"]`).press('Enter');if(n<20)await page.clock.runFor(300);}await pause('Number Train',async()=>await page.locator('#item-progress-strip .is-done').count()===0);
  check('Number Train restarts at its fixed 1-4 group',JSON.stringify(await page.locator('[data-count-choice]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.countChoice))))==='[1,2,3,4]'&&await page.locator('#art-reward').isHidden());
  await open(5,'abacus');for(let row=0;row<10;row++)await page.locator(`[data-bead-row="${row}"][data-bead-index="9"]`).press('ArrowRight');await page.clock.runFor(5000);
  check('Rainbow Abacus keeps its beads as a counting monitor',await page.locator('[data-bead-row][data-moved="true"]').count()===10&&await page.locator('#art-reward').isHidden());await page.locator('[data-bead-row="0"][data-bead-index="8"]').press('ArrowRight');await page.clock.runFor(300);check('Rainbow Abacus continues counting after every row is used',await page.locator('[data-bead-row][data-moved="true"]').count()===11);await page.locator('#again').click();check('Rainbow Abacus resets only when Again is chosen',await page.locator('[data-bead-row][data-moved="true"]').count()===0);
  async function finishArt(mode){
   if(mode==='clean')for(let t=0;t<50&&await page.locator('[data-dirt]').count();t++){const p=await page.locator('[data-dirt]').first().evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+4,p.y,{steps:3});await page.mouse.up();}
   else for(let y=65;y<=405;y+=12){const centre=await point('#scene',500,225),from=await point('#scene',300,y),to=await point('#scene',710,y);await page.mouse.move(centre.x,centre.y);await page.mouse.down();await page.mouse.move(from.x,from.y,{steps:8});await page.mouse.move(to.x,to.y,{steps:40});await page.mouse.up();}
  }
  for(const mode of ['clean','paint']){
   await open(2,'brush');if(mode==='paint')await page.locator('#paint-mode').click();await page.locator('[data-brush-size="large"]').click();await finishArt(mode);
   check(`${mode} art celebrates completion`,await page.locator('#art-reward').isVisible());await pause(`${mode} art`,async()=>await page.locator('#art-reward').isHidden());
   check(`${mode} art automatically opens the next drawing`,(await page.locator('#activity-name').textContent()).includes('Sun')&&await page.locator('#art-reward').isHidden());
   await page.locator('[data-brush-choice="3"]').click();await finishArt(mode);await pause(`${mode} art`,async()=>await page.locator('#art-reward').isHidden());
   check(`${mode} art wraps to the first drawing with fresh progress`,(await page.locator('#activity-name').textContent()).includes('Apple')&&await page.locator('#item-progress-strip .is-done').count()===0);
  }
  // A cancelled completion must never wipe a later round or another game.
  for(const action of ['again','game-home','age','front']){
   await open(2,'drag');for(const id of ['circle','square','triangle','rectangle']){await page.locator(`[data-piece="${id}"]`).press('Enter');await page.locator(`[data-target="${id}"]`).press('Enter');}
   if(action==='age')await page.locator('[data-age-option="3"]').click();else if(action==='front')await page.locator('#game-front').click();else await page.locator('#'+action).click();
   if(action==='again'||action==='age'){await page.locator('[data-piece="circle"]').press('Enter');await page.locator('[data-target="circle"]').press('Enter');}
   const before=await page.locator('#app').getAttribute('data-view');await page.clock.runFor(3000);
   check(action+' cancels the previous game completion',await page.locator('#app').getAttribute('data-view')===before&&(!(action==='again'||action==='age')||await page.locator('[data-piece]').count()===3));
  }
  // Repeat the actual offending route, with Demo, cancelled touch and rotation mixed in.
  for(const [width,height] of [[480,320],[844,390],[390,844],[1024,768]]){
   await page.setViewportSize({width,height});await open(5,'drag');const before=await pixels(`drag-${width}x${height}-initial`);
   for(let cycle=0;cycle<4;cycle++){
    await switchTo('bubbles');await page.locator('[data-bubble-mode="shapes"]').click();await switchTo('drag');
    await page.locator('#show-me').click();await page.clock.runFor(1000);await page.locator('#show-me').click();
    const p=await point('[data-piece]');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+20,p.y+10);await page.locator('#scene').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
    const now=await pixels(`drag-${width}x${height}-cycle-${cycle}`);
    check(`${width}x${height} cycle ${cycle+1} keeps every left-hand shape visible`,now.length===4&&now.every((p,i)=>p.rgb.every((c,j)=>Math.abs(c-before[i].rgb[j])<12)),{before,now});
   }
   const from=await point('[data-piece="circle"]'),to=await point('[data-target="circle"]');await page.touchscreen.tap(from.x,from.y);await page.touchscreen.tap(to.x,to.y);
   check(`${width}x${height} touch matches a visible shape after repeated navigation`,await page.locator('[data-piece]').count()===3&&await page.locator('[data-piece="circle"]').count()===0);
   await drag('[data-piece="square"]',await point('[data-target="square"]'));
   check(`${width}x${height} dragging also matches after repeated navigation`,await page.locator('[data-piece]').count()===2&&await page.locator('[data-piece="square"]').count()===0);
  }
 }
 check('No browser errors',errors.length===0,errors);await context.close();
})().catch(error=>{results.push({name:'Unexpected exception',pass:false,detail:error.stack});}).finally(async()=>{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results},null,2));await browser?.close();await new Promise(r=>server.close(r));const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checks:results.length,failed:failed.length,failures:failed.map(r=>({name:r.name,detail:r.detail}))}));process.exitCode=failed.length?1:0;});
