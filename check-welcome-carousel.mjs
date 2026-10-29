import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',out=resolve(root,'artifacts','welcome-carousel',engine);
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const base=process.env.FLOW_URL||`http://127.0.0.1:${server.address().port}/docs/beta/`;
const sizes=[['small-phone',667,375],['phone',844,390],['iphone15',393,852],['moto',412,915],['short-portrait',320,568],['tablet',1024,768],['portrait-tablet',768,1024],['wide',1600,720]];
let checks=0;
const dimensions=page=>page.locator('[data-activity]').first().evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
async function swipe(page,direction){
  const grid=page.locator('#activity-grid'),rect=await grid.boundingBox(),rotated=await page.locator('#app').evaluate(el=>el.classList.contains('rotated'));
  const from=rotated?{x:rect.x+rect.width/2,y:rect.y+rect.height*(direction>0?.76:.24)}:{x:rect.x+rect.width*(direction>0?.76:.24),y:rect.y+rect.height/2};
  const to=rotated?{x:from.x,y:rect.y+rect.height*(direction>0?.24:.76)}:{x:rect.x+rect.width*(direction>0?.24:.76),y:from.y};
  if(engine==='chromium'){
    const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
    for(let n=1;n<=12;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*n/12,y:from.y+(to.y-from.y)*n/12,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();}
}
try{
  if(process.env.FLOW_BASELINE){
    const records={};for(const [name,width,height] of sizes){const page=await browser.newPage({viewport:{width,height}});await page.goto(new URL('play.html',base).href);await expect(page.locator('[data-activity]')).toHaveCount(5);records[name]=await dimensions(page);await page.close();}
    await writeFile(resolve(out,'card-baseline.json'),JSON.stringify(records,null,2));console.log('Recorded current card dimensions');
  }else{
    let baseline;try{baseline=JSON.parse(await readFile(resolve(out,'card-baseline.json'),'utf8'));}catch{/* Hosted checks may run on another machine. */}
    for(const [name,width,height] of sizes){
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(new URL(process.env.FLOW_SECTION==='menu'?'play.html':'index.html',base).href);
      if(process.env.FLOW_SECTION!=='menu'){
        await expect(page.locator('#frame')).not.toHaveClass(/rotated/);const frame=await page.locator('#frame').boundingBox();assert(frame.width<=width+1&&frame.height<=height+1,'Welcome uses the natural viewport');
        if(height>width)assert(frame.height>frame.width,'Portrait welcome stays upright');
        for(const selector of ['#play','#install','#update-app','#share-app','#about']){const item=page.locator(selector);await item.scrollIntoViewIfNeeded();const box=await item.boundingBox();assert(box.x>=-1&&box.x+box.width<=width+1,'Welcome controls do not overflow sideways');await expect(item).toBeInViewport();}
        await page.locator('#frame').evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:resolve(out,`${name}-welcome.png`)});
        await page.getByRole('button',{name:'Share app',exact:true}).click();await expect(page.getByRole('dialog')).toBeInViewport();await page.getByRole('button',{name:'Got it',exact:true}).click();
        await page.getByRole('button',{name:'About this little world',exact:true}).click();await expect(page.getByRole('button',{name:'Close About',exact:true})).toBeInViewport();await page.keyboard.press('Escape');
        await page.getByRole('link',{name:'Tap to play',exact:true}).click();checks++;
      }
      await expect(page.locator('[data-activity]')).toHaveCount(5);
      assert.equal(await page.locator('#app').evaluate(el=>el.clientWidth>el.clientHeight),true,'Game menu stays landscape');
      await expect(page.getByRole('button',{name:'Next games',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Previous games',exact:true})).toBeDisabled();
      const original=await dimensions(page);if(baseline?.[name]){assert(Math.abs(original.width-baseline[name].width)<=1,'Existing card width stays unchanged');assert(Math.abs(original.height-baseline[name].height)<=1,'Existing card height stays unchanged');}
      const existing=await page.locator('[data-activity]').evaluateAll(els=>els.map(el=>({w:el.offsetWidth,h:el.offsetHeight})));assert(existing.every(box=>Math.abs(box.w-original.width)<=1&&box.h===original.height));
      await page.screenshot({path:resolve(out,`${name}-first-cards.png`)});
      await page.getByRole('button',{name:'Next games',exact:true}).click();await expect(page.getByRole('group',{name:'More games coming',exact:true})).toBeInViewport();await expect(page.getByRole('button',{name:'Next games',exact:true})).toBeDisabled();
      await page.screenshot({path:resolve(out,`${name}-more-games.png`)});await page.getByRole('button',{name:'Previous games',exact:true}).click();await expect.poll(()=>page.locator('#activity-grid').evaluate(el=>el.scrollLeft)).toBeLessThan(2);checks++;
      await swipe(page,1);await expect.poll(()=>page.locator('#activity-grid').evaluate(el=>el.scrollLeft)).toBeGreaterThan(original.width/2);await expect(page.locator('#home-view')).toBeVisible();
      await swipe(page,-1);await expect.poll(()=>page.locator('#activity-grid').evaluate(el=>el.scrollLeft)).toBeLessThan(2);await expect(page.locator('#home-view')).toBeVisible();checks++;
      // Future cards are fixture-only: prove the row grows without shrinking current cards.
      await page.locator('#activity-grid').evaluate(grid=>{for(let n=0;n<8;n++){const card=grid.lastElementChild.cloneNode(true);card.removeAttribute('aria-label');card.querySelector('b').textContent=`Future ${n+1}`;grid.append(card);}});
      assert.deepEqual(await dimensions(page),original,'Adding eight future cards never squeezes the originals');
      await page.locator('#activity-grid').focus();await page.keyboard.press('End');await expect.poll(()=>page.locator('#activity-grid').evaluate(el=>Math.abs(el.scrollWidth-el.clientWidth-el.scrollLeft))).toBeLessThan(2);
      await page.keyboard.press('Home');await expect.poll(()=>page.locator('#activity-grid').evaluate(el=>el.scrollLeft)).toBeLessThan(2);checks++;
      await page.getByRole('button',{name:'Drag shapes',exact:true}).click();await expect(page.locator('#game-pages')).toBeHidden();await expect(page.locator('#play-levels')).toBeVisible();
      await page.locator('[data-piece="circle"]').click();await page.locator('[data-target="circle"]').click();await expect(page.locator('#result-score')).toHaveText('Matched 1 / 4');
      if(height>width){await page.setViewportSize({width:height,height:width});await expect(page.locator('#app')).not.toHaveClass(/rotated/);await expect(page.locator('#result-score')).toHaveText('Matched 1 / 4');await page.setViewportSize({width,height});await expect(page.locator('#app')).toHaveClass(/rotated/);}
      assert.equal(await page.evaluate(()=>document.fullscreenElement),null);await page.getByRole('button',{name:'Games',exact:true}).click();await expect(page.locator('#home-view')).toBeVisible();
      await page.getByRole('link',{name:'SaNa Beta welcome',exact:true}).click();await expect(page.locator('#frame')).not.toHaveClass(/rotated/);checks++;
      assert.deepEqual(errors,[]);await context.close();
    }
    const manifest=await (await fetch(new URL('manifest.webmanifest',base))).json();assert.equal(manifest.orientation,'any','Installed welcome must not be forced into landscape');assert.equal(manifest.id,'./');checks++;
    console.log(`PASS: ${checks} portrait welcome, fixed-size cards and swipe navigation checks (${engine})`);
  }
}finally{await browser.close();await new Promise(done=>server.close(done));}
