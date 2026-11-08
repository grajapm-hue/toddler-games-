// Regressions: one row per lane leaves long waits; resizing or recycling must not stack balloons.
const fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.FLOW_EVIDENCE||path.resolve(__dirname,'artifacts/balloon-flow',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
function check(name,pass,detail){results.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name,JSON.stringify(detail));}
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 async function open(age){await page.goto(base+'play.html?age='+age);await page.locator('[data-activity="bubbles"]').click();await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));}
 async function snapshot(target=page){return target.locator('#scene').evaluate(svg=>{const balloons=[...svg.querySelectorAll('[data-bubble]')].map(el=>{const m=el.transform.baseVal.getItem(0).matrix,r=+el.querySelector('[data-balloon-body]').getAttribute('r'),b=el.getBBox();return{id:el.dataset.bubble,x:m.e,y:m.f,r,token:el.dataset.token,box:{left:m.e+b.x,right:m.e+b.x+b.width,top:m.f+b.y,bottom:m.f+b.y+b.height}};});const visible=balloons.filter(b=>Math.min(440,b.y+b.r)-Math.max(0,b.y-b.r)>=b.r*.8),rows=[];for(const b of visible.toSorted((a,b)=>a.y-b.y))if(!rows.some(y=>Math.abs(y-b.y)<b.r*1.5))rows.push(b.y);const touching=[];for(let i=0;i<balloons.length;i++)for(let j=i+1;j<balloons.length;j++){const a=balloons[i],b=balloons[j];if(a.box.left<b.box.right+2&&a.box.right+2>b.box.left&&a.box.top<b.box.bottom+2&&a.box.bottom+2>b.box.top)touching.push([a.id,b.id]);}return{balloons,rows,touching,width:svg.viewBox.baseVal.width};});}
 function field(label,s){check(label+' shows at least two separated rows',s.rows.length>=2,{rows:s.rows,balloons:s.balloons});check(label+' keeps balloon bodies and strings apart',!s.touching.length,s.touching);check(label+' keeps the pool bounded',s.balloons.length>0&&s.balloons.length<=256,s.balloons.length);}
 if(process.env.FLOW_SIZE_ONLY){
  for(const [width,height] of process.env.FLOW_SIZE_RED?[[844,390]]:[[480,320],[844,390],[390,844],[1024,768]]){await page.setViewportSize({width,height});
   for(const age of process.env.FLOW_SIZE_RED?[4]:[2,3,4,5]){await open(age);for(const size of process.env.FLOW_SIZE_RED?['large']:['small','medium','large']){
    await page.locator(`[data-bubble-size="${size}"]`).click();await page.clock.runFor(100);const before=await page.locator('[data-balloon-body]').first().boundingBox(),count=await page.locator('[data-bubble][data-onstage="true"]').count();
    if(width===844&&age===4&&size==='large')await page.screenshot({path:path.join(out,'large-normal.png')});
    await page.locator('#fullscreen').click();await page.clock.runFor(100);const full=await page.locator('[data-balloon-body]').first().boundingBox(),more=await page.locator('[data-bubble][data-onstage="true"]').count();
    if(width===844&&age===4&&size==='large')await page.screenshot({path:path.join(out,'large-fullscreen.png')});
    const label=`${width}x${height} age ${age}/${size}`;check(label+' keeps the same visible balloon size in fullscreen',Math.abs(full.width/before.width-1)<=.05,{normal:before.width,fullscreen:full.width});check(label+' uses fullscreen for more balloons',more>count,{normal:count,fullscreen:more});if(!process.env.FLOW_SIZE_RED)field(label+' fullscreen',await snapshot());
    await page.locator('#exit-play').click();await page.clock.runFor(100);const after=await page.locator('[data-balloon-body]').first().boundingBox();check(label+' returns at the same visible size',Math.abs(after.width/before.width-1)<=.05,{normal:before.width,returned:after.width});
   }}console.log('Checked fullscreen sizes at '+width+'x'+height);
  }await context.close();return;
 }
 await open(4);await page.locator('[data-bubble-size="medium"]').click();await page.clock.runFor(100);field('Initial phone play',await snapshot());await page.screenshot({path:path.join(out,process.env.FLOW_RED?'before.png':'phone.png')});
 if(!process.env.FLOW_RED){const body=await page.locator('[data-balloon-body]').first().boundingBox();check('Normal phone rows retain readable medium balloons',Math.min(body.width,body.height)>=30,body);}
 if(process.env.FLOW_RED){await context.close();return;}
 for(const [width,height] of [[480,320],[844,390],[390,844],[1024,768]]){
  await page.setViewportSize({width,height});
  for(const age of [2,3,4,5]){await open(age);
   for(const size of ['small','medium','large']){await page.locator(`[data-bubble-size="${size}"]`).click();
    for(const mode of ['plain','numbers','letters','shapes']){await page.locator(`[data-bubble-mode="${mode}"]`).click();await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.runFor(100);const label=`${width}x${height} age ${age} ${size}/${mode}`;field(label,await snapshot());await page.clock.runFor(600);field(label+' moving',await snapshot());}
   }
  }
  console.log('Checked all ages, sizes and modes at '+width+'x'+height);
 }
 await page.setViewportSize({width:844,height:390});
 for(const age of [2,3,4,5]){await open(age);for(const level of [2,3]){await page.locator(`[data-level="${level}"]`).evaluate(el=>el.click());for(const size of ['small','medium','large']){await page.locator(`[data-bubble-size="${size}"]`).click();await page.clock.runFor(100);field(`Age ${age} optional level ${level}/${size}`,await snapshot());}}}
 await open(4);await page.locator('[data-bubble-mode="letters"]').click();
 for(const size of ['small','medium','large']){await page.locator(`[data-bubble-size="${size}"]`).click();await page.locator('#again').click();
  for(const speed of ['slow','medium','fast']){await page.locator(`[data-bubble-speed="${speed}"]`).click();for(let i=0;i<36;i++){await page.clock.runFor(250);field(`${size}/${speed} cycle ${i}`,await snapshot());}}
 }
 const s=await snapshot(),visible=s.balloons.filter(b=>b.y>=b.r&&b.y<=440-b.r),first=visible[0];
 const point=await page.locator(`[data-bubble="${first.id}"]`).evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await page.touchscreen.tap(point.x,point.y);await page.clock.runFor(300);
 const hits=await page.locator('#item-progress-strip .is-done').count();check('A touch pops the correct balloon and records its collection',!await page.locator(`[data-bubble="${first.id}"]`).count()&&hits===1);
 await page.locator('#fullscreen').click();await page.clock.runFor(100);field('Fullscreen',await snapshot());check('Fullscreen retains the collection',await page.locator('#item-progress-strip .is-done').count()===hits);await page.screenshot({path:path.join(out,'fullscreen.png')});
 await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);field('Rotated fullscreen',await snapshot());await page.locator('#exit-play').click();await page.clock.runFor(100);field('Return from fullscreen',await snapshot());
 await page.locator('#again').click();check('Again clears the collection',await page.locator('#item-progress-strip .is-done').count()===0);field('Again',await snapshot());
 await page.locator('[data-bubble-mode="plain"]').click();await page.clock.runFor(100);const goal=await page.locator('#item-progress-strip .item-chip').count();
 for(let i=0;i<goal;i++){const bubble=page.locator('[data-bubble][data-onstage="true"]').first();await bubble.press('Enter');await page.clock.runFor(300);}
 check('Completed rounds retain their 1.5-second pause after the final splash',await page.locator('#item-progress-strip .is-done').count()===goal);await page.clock.runFor(1499);check('The completed collection holds before the replay',await page.locator('#item-progress-strip .is-done').count()===goal);await page.clock.runFor(1);check('Automatic replay clears at 1.5 seconds',await page.locator('#item-progress-strip .is-done').count()===0);field('Automatic replay',await snapshot());
 await context.close();
 const native=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),real=await native.newPage();real.on('pageerror',e=>errors.push(e.message));await real.goto(base+'play.html?age=4');await real.locator('[data-activity="bubbles"]').click();await real.locator('#scene[data-art-state="ready"]').waitFor();await real.locator('[data-bubble-mode="letters"]').click();await real.locator('[data-bubble-size="large"]').click();await real.locator('[data-bubble-speed="slow"]').click();const before=await snapshot(real);await real.waitForTimeout(700);const after=await snapshot(real);field('Native moving rows',after);check('Real browser animation moves the rows upwards',before.balloons.some(b=>after.balloons.some(a=>a.id===b.id&&a.y<b.y-20)));
 const target=after.balloons.filter(b=>b.y>b.r&&b.y<440-b.r).toSorted((a,b)=>b.y-a.y)[0];const touch=await real.locator(`[data-bubble="${target.id}"]`).evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});await real.touchscreen.tap(touch.x,touch.y);check('Native touch first enlarges a balloon in the following row',!!await real.locator(`[data-bubble="${target.id}"]`).count());await real.waitForTimeout(350);check('Native feedback records the following-row choice',await real.locator('#item-progress-strip .is-done').count()===1);await real.screenshot({path:path.join(out,'native-phone.png')});await native.close();check('No browser errors',errors.length===0,errors);
})().catch(e=>check('Unexpected exception',false,e.stack)).finally(async()=>{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));await browser?.close();await new Promise(r=>server.close(r));const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({engine,checks:results.length,failed:failed.length,failures:failed.slice(0,4)}));process.exitCode=failed.length?1:0;});
