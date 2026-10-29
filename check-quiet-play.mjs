import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),path=resolve(root,'.'+url.pathname);
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[extname(path)]||'application/octet-stream',...(url.searchParams.has('deny')?{'Permissions-Policy':'fullscreen=()'}:{})}).end(await readFile(path));
}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const out=resolve(root,'artifacts','quiet-play',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.QUIET_URL||`http://127.0.0.1:${server.address().port}/docs/beta/`;
async function protectedText(page,selector){
  const node=page.locator(selector).first();await expect(node).toBeVisible();
  const policy=await node.evaluate(el=>{const style=getComputedStyle(el);return {select:style.userSelect||style.webkitUserSelect,supportsCallout:CSS.supports('-webkit-touch-callout','none'),callout:style.getPropertyValue('-webkit-touch-callout'),blocked:['contextmenu','selectstart','dragstart'].map(type=>!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})))}});
  assert.equal(policy.select,'none','App text must not become selectable on hold or drag');if(policy.supportsCallout)assert.equal(policy.callout,'none','Touch callouts are disabled on platforms exposing that property');assert.deepEqual(policy.blocked,[true,true,true],'Native context, selection and drag actions are cancelled');
  await page.evaluate(()=>{window.contextGuard=null;document.addEventListener('contextmenu',event=>{window.contextGuard={trusted:event.isTrusted,blocked:event.defaultPrevented}},{once:true});});
  await node.click({button:'right'});assert.deepEqual(await page.evaluate(()=>window.contextGuard),{trusted:true,blocked:true},'Real right-click context menus are cancelled');
  const box=await node.boundingBox();await page.mouse.move(box.x+3,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+Math.min(box.width-2,90),box.y+box.height/2,{steps:8});await page.mouse.up();assert.equal(await page.evaluate(()=>getSelection()?.toString()||''),'','Dragging app text does not create a selection');checks++;
}
try{
  const early=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block'}),loading=await early.newPage();let releaseGameScript;
  const held=new Promise(done=>{releaseGameScript=done;});
  await loading.route('**/app.js',async route=>{await held;try{await route.continue();}catch{/* The page may close after a failed assertion. */}});
  await loading.goto(new URL('play.html',base).href,{waitUntil:'commit'});
  try{await protectedText(loading,'#hint');assert.equal(await loading.locator('[data-activity]').count(),0,'Touch protection works before the held game script initializes');}finally{releaseGameScript();}
  await expect(loading.getByRole('button',{name:'Abacus colors',exact:true})).toBeVisible();await early.close();
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL('index.html',base).href);await protectedText(page,'.family');await protectedText(page,'.tagline');
  await page.getByRole('button',{name:'About this project',exact:true}).click();await protectedText(page,'.about-card h3');await page.getByRole('button',{name:'Close About',exact:true}).click();
  await page.getByRole('button',{name:'Share app',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Beta test link'})).toHaveCSS('pointer-events','none');await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
  await page.getByRole('link',{name:'Tap to play',exact:true}).click();await expect(page.getByRole('button',{name:'Abacus colors',exact:true})).toBeVisible();await protectedText(page,'#hint');await protectedText(page,'.welcome h1');
  for(const label of ['Drag shapes','Pop bubbles','Slide to reveal','Brush and paint','Abacus colors']){
    await page.getByRole('button',{name:label,exact:true}).click();await protectedText(page,'#activity-name');await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
    await expect(page.locator('#app')).toHaveClass(/immersive/);assert.equal(await page.evaluate(()=>document.fullscreenElement),null,'No native fullscreen means no browser fullscreen URL notice');await expect(page.getByRole('dialog')).toBeHidden();await protectedText(page,'#activity-name');
    await page.screenshot({path:resolve(out,`${label.split(' ')[0]}-expanded.png`)});await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await page.getByRole('button',{name:'Games',exact:true}).click();checks++;
  }
  await page.getByRole('button',{name:'Abacus colors',exact:true}).click();await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const from=await page.locator('[data-bead-row="4"][data-bead-index="9"]').boundingBox(),to=await page.locator('[data-abacus-destination="4"]').boundingBox(),start={x:from.x+from.width/2,y:from.y+from.height/2},end={x:to.x+to.width/2,y:to.y+to.height/2};
  if(engine==='chromium'){
    const session=await context.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});await new Promise(done=>setTimeout(done,850));for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/8,y:start.y+(end.y-start.y)*i/8,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  }else{await page.mouse.move(start.x,start.y);await page.mouse.down();await new Promise(done=>setTimeout(done,850));await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();}
  await expect(page.locator('[data-color-label="4"]')).toHaveText('1 One Blue');await expect(page.getByRole('dialog')).toBeHidden();assert.equal(await page.evaluate(()=>getSelection()?.toString()||''),'');await page.keyboard.press('Escape');await expect(page.locator('#app')).not.toHaveClass(/immersive/);checks++;
  if(!process.env.QUIET_URL){
    for(const name of ['index.html','SaNa-Little-Hands-Prototype.html']){await page.goto(`http://127.0.0.1:${server.address().port}/${name}`);await protectedText(page,'#hint');await page.getByRole('button',{name:'Abacus colors',exact:true}).click();await page.getByRole('button',{name:'Fullscreen',exact:true}).click();assert.equal(await page.evaluate(()=>document.fullscreenElement),null);checks++;}
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} quiet expansion, text guard and held-pointer gameplay checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
