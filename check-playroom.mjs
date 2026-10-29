import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit,firefox,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const root=dirname(fileURLToPath(import.meta.url));
const server=createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const output=resolve(root,'..','artifacts','toddler-playroom',engine);await mkdir(output,{recursive:true});
const browser=await ({chromium,webkit,firefox})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
let checks=0;const errors=[];
const touchSessions=new WeakMap();
const center=async locator=>{const r=await locator.boundingBox();assert(r,'Visible gesture target');return {x:r.x+r.width/2,y:r.y+r.height/2};};
async function drag(page,from,to){
  const cdp=touchSessions.get(page);
  if(cdp){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
    for(let step=1;step<=16;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*step/16,y:from.y+(to.y-from.y)*step/16,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:16});await page.mouse.up();}
}
try{
  for(const [name,width,height,touch] of [['laptop',1280,800,false],['tablet',1024,768,true],['phone',844,390,true],['portrait-phone',390,844,true]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:touch,...(engine==='firefox'?{}:{isMobile:touch}),reducedMotion:'reduce',serviceWorkers:'block'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    if(touch&&engine==='chromium')touchSessions.set(page,await context.newCDPSession(page));
    await page.goto(base);
    await expect(page).toHaveTitle(/SaNa.*Little Hands/);
    await expect(page.getByRole('button',{name:'Play level, ages 2 to 4'})).toHaveAttribute('aria-pressed','true');
    await page.screenshot({path:resolve(output,`${name}-home.png`)});checks++;
    await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
    const pieces=page.locator('[data-piece]');await expect(pieces).toHaveCount(4);
    for(const shape of ['circle','triangle','square','star']){
      await drag(page,await center(page.locator(`[data-piece="${shape}"]`)),await center(page.locator(`[data-target="${shape}"]`)));
    }
    await expect(page.getByRole('status')).toContainText('Lovely matching');checks++;
    await page.screenshot({path:resolve(output,`${name}-drag.png`)});
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();
    while(await page.locator('[data-bubble]').count()){
      const point=await center(page.locator('[data-bubble]').first());
      if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    }
    await expect(page.getByRole('status')).toContainText('Pop, pop, hooray');checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Slide to reveal',exact:true}).click();
    for(let i=0;i<2;i++){
      const to=await page.locator(`[data-slider-track="${i}"]`).evaluate(line=>{
        const p=new DOMPoint(Number(line.getAttribute('x2')),Number(line.getAttribute('y2'))).matrixTransform(line.getScreenCTM());return {x:p.x,y:p.y};
      });
      await drag(page,await center(page.locator(`[data-slider-handle="${i}"]`)),to);
    }
    await expect(page.getByRole('status')).toContainText('You found our friends');checks++;
    await page.screenshot({path:resolve(output,`${name}-slide.png`)});
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Brush and paint',exact:true}).click();
    for(let i=0;i<24&&await page.locator('[data-dirt]').count();i++){
      const p=await center(page.locator('[data-dirt]').first());
      await drag(page,{x:p.x-12,y:p.y},{x:p.x+12,y:p.y});
    }
    await expect(page.getByRole('status')).toContainText('All clean');checks++;
    await page.getByRole('button',{name:'Finger paint',exact:true}).click();
    const [paintFrom,paintTo]=await page.locator('#scene').evaluate(svg=>[[500,280],[600,290]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};}));
    await drag(page,paintFrom,paintTo);
    await expect(page.locator('[data-stroke]')).toHaveCount(1);checks++;
    await page.getByRole('button',{name:'Again',exact:true}).click();
    await expect(page.locator('[data-stroke]')).toHaveCount(0);checks++;
    await page.screenshot({path:resolve(output,`${name}-paint.png`)});
    await page.getByRole('button',{name:'Explore level'}).click();
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
    await expect(page.locator('[data-piece]')).toHaveCount(2);checks++;
    await page.getByRole('button',{name:'Challenge level'}).click();
    await expect(page.locator('[data-piece]')).toHaveCount(6);checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();
    await expect(page.locator('[data-bubble]')).toHaveCount(9);
    await page.locator('[data-allowed="false"]').first().click();
    await expect(page.locator('[data-bubble]')).toHaveCount(9);
    await page.locator('[data-allowed="true"]').first().click();
    await expect(page.locator('[data-allowed="true"]')).toHaveCount(2);
    while(await page.locator('[data-bubble]').count())await page.locator('[data-allowed="true"]').first().click();
    await expect(page.getByRole('status')).toContainText('Pop, pop, hooray');checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Slide to reveal',exact:true}).click();
    await expect(page.locator('[data-slider-handle]')).toHaveCount(3);
    await page.getByRole('button',{name:'Explore level'}).click();
    await expect(page.locator('[data-slider-handle]')).toHaveCount(1);checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Brush and paint',exact:true}).click();
    await expect(page.locator('[data-dirt]')).toHaveCount(4);
    await page.getByRole('button',{name:'Challenge level'}).click();
    await expect(page.locator('[data-dirt]')).toHaveCount(14);checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
    const circle=page.locator('[data-piece="circle"]'),before=await circle.getAttribute('transform'),point=await center(circle),cdp=touchSessions.get(page);
    if(cdp){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+20,y:point.y+15,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    }else{
      await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+20,point.y+15);
      await page.locator('#scene').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
    }
    await expect(circle).toHaveAttribute('transform',before);
    await drag(page,await center(circle),await center(page.locator('[data-target="circle"]')));
    await expect(page.locator('[data-piece]')).toHaveCount(5);checks++;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true,'Play frame does not overflow');checks++;
    await context.close();
  }
  const offline=await browser.newContext({reducedMotion:'reduce'}),installed=await offline.newPage();
  await installed.goto(base);
  await expect.poll(()=>installed.evaluate(async()=>{
    const registration=await navigator.serviceWorker.getRegistration();
    const cached=await caches.match(new URL('./index.html',location.href));
    return registration?.active?.state==='activated'&&navigator.serviceWorker.controller===registration.active&&!!cached;
  }),{timeout:20000}).toBe(true);
  if(engine==='webkit'){
    // Playwright WebKit offline emulation rejects even literal SW responses (#42775).
    // Stop the real origin instead and require the cached app to launch without it.
    const stopped=new Promise(resolve=>server.close(resolve));server.closeAllConnections();await stopped;
    assert.equal(server.listening,false);
  }else await offline.setOffline(true);
  await installed.goto(base+'index.html?offline=1',{waitUntil:'domcontentloaded'});
  await expect(installed.getByRole('button',{name:'Brush and paint',exact:true})).toBeVisible();
  await installed.getByRole('button',{name:'Challenge level'}).click();
  await installed.reload({waitUntil:'domcontentloaded'});
  await expect(installed.getByRole('button',{name:'Challenge level'})).toHaveAttribute('aria-pressed','true');checks++;
  await offline.close();
  const fileContext=await browser.newContext({reducedMotion:'reduce'}),filePage=await fileContext.newPage();
  if(engine!=='webkit')await fileContext.setOffline(true);
  else await fileContext.route(/^https?:\/\//,route=>route.abort());
  const fileNetwork=[];filePage.on('request',request=>{if(/^https?:/.test(request.url()))fileNetwork.push(request.url());});
  await filePage.goto(pathToFileURL(resolve(root,'SaNa-Little-Hands-Prototype.html')).href);
  await filePage.getByRole('button',{name:'Drag shapes',exact:true}).click();
  await expect(filePage.locator('[data-piece]')).toHaveCount(4);checks++;
  await drag(filePage,await center(filePage.locator('[data-piece="circle"]')),await center(filePage.locator('[data-target="circle"]')));
  await expect(filePage.locator('[data-piece]')).toHaveCount(3);
  assert.deepEqual(fileNetwork,[],'The self-contained file has no HTTP dependencies');checks++;
  await fileContext.close();
  assert.deepEqual(errors,[]);checks++;
  console.log(`PASS: ${checks} play checks (${engine}) across laptop, tablet, phone, and rotated portrait frame. Offline control: ${engine==='webkit'?'origin stopped; local file has HTTP blocked':'network offline'}. Screenshots: ${output}`);
}finally{await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));}
