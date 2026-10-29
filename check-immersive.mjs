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
const out=resolve(root,'artifacts','immersive',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.IMMERSIVE_URL||`http://127.0.0.1:${server.address().port}/docs/beta/play.html`;
async function fullPlay(page){
  await expect(page.getByRole('button',{name:'Exit fullscreen',exact:true})).toBeVisible();
  await expect(page.locator('.companion-bar')).toBeHidden();
  await expect(page.locator('.activity-heading')).toBeHidden();
  await expect(page.locator('#bubble-settings')).toBeHidden();
  const bubbles=await page.locator('#app').getAttribute('data-view')==='bubbles';
  const results=page.locator('#game-results');await expect(results).toBeVisible();
  await expect(page.locator('.play-mat')).toHaveCSS('background-color','rgb(0, 0, 0)');
  for(const id of ['fullscreen','game-back','game-front','game-home','sound'])await expect(page.locator('#'+id)).toBeVisible();
  const geometry=await page.evaluate(()=>{
    const app=document.getElementById('app'),scene=document.getElementById('scene'),board=scene.parentElement;
    const tracker=document.getElementById('bubble-tracker'),toolbar=document.querySelector('.play-toolbar'),navigation=document.querySelector('.play-navigation');
    return {width:app.clientWidth,height:app.clientHeight,sceneWidth:scene.clientWidth,sceneHeight:scene.clientHeight+(app.dataset.view==='bubbles'?tracker.clientHeight:0)+toolbar.offsetHeight+navigation.offsetHeight,top:board.offsetTop,left:board.offsetLeft};
  });
  assert(geometry.top<=1&&geometry.left<=1&&geometry.sceneWidth>=geometry.width-2&&geometry.sceneHeight>=geometry.height-2,'The animated game must fill the whole app frame');
  for(const button of await page.locator('button:visible').all()){
    const box=await button.boundingBox(),size=page.viewportSize();
    assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,'Floating controls remain on screen');
  }
  const back=await page.locator('#game-back').boundingBox(),sound=await page.locator('#sound').boundingBox();
  for(const item of await results.locator('.bubble-target:visible,.bubble-score:visible,#result-score:visible').all()){
    const box=await item.boundingBox();
    for(const control of [back,sound])assert(box.x+box.width<=control.x||box.x>=control.x+control.width||box.y+box.height<=control.y||box.y>=control.y+control.height,'Results must remain clear of floating controls, including rotated screens');
  }
}
try{
  for(const [name,width,height] of [['small-phone',667,375],['phone',844,390],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);
    const intro=await page.locator('.welcome').evaluate(el=>{
      const h=el.querySelector('h1'),p=el.querySelector('p'),hint=getComputedStyle(document.getElementById('hint'));
      const lines=node=>{const range=document.createRange();range.selectNodeContents(node);return range.getClientRects().length;};
      return {heading:getComputedStyle(h).fontSize,copy:getComputedStyle(p).fontSize,hint:hint.fontSize,sameRow:Math.abs(h.offsetTop-p.offsetTop)<2,headingLines:lines(h),copyLines:lines(p),height:el.offsetHeight,room:document.getElementById('home-view').clientHeight};
    });
    assert.equal(intro.heading,intro.hint,'Intro heading must match the hint above');assert.equal(intro.copy,intro.hint,'Intro copy must match the hint above');
    assert(intro.sameRow&&intro.headingLines===1&&intro.copyLines===1,'The whole introduction stays on one row');
    assert(intro.height<intro.room*.2,'The compact introduction leaves most of the menu for game cards');
    await expect(page.locator('.welcome svg')).toHaveCount(0);
    for(const card of await page.locator('[data-activity]').all())assert(await card.evaluate(el=>el.clientHeight)>150,'Game choices fill the available space');
    await page.screenshot({path:resolve(out,`${name}-home.png`)});checks++;
    await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();await page.getByRole('button',{name:'Letter bubbles',exact:true}).click();
    await expect(page.locator('#scene')).toHaveCSS('background-color','rgb(0, 0, 0)');
    const bubble=page.locator('[data-bubble][data-onstage="true"]').first(),token=await bubble.getAttribute('data-token'),box=await bubble.boundingBox();
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    const target=page.locator(`[data-bubble-target="${token}"]`),color=await target.evaluate(el=>getComputedStyle(el).backgroundColor);
    await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await fullPlay(page);
    if(engine==='chromium')assert(await page.evaluate(()=>Boolean(document.fullscreenElement)),'Supported browsers enter native fullscreen');
    await page.getByRole('button',{name:'Sound off',exact:true}).click();await expect(page.getByRole('button',{name:'Sound on',exact:true})).toHaveAttribute('aria-pressed','true');
    const moving=page.locator('[data-bubble][data-onstage="true"]').last(),id=await moving.getAttribute('data-bubble'),y=await moving.evaluate(el=>el.transform.baseVal.getItem(0).matrix.f);
    await page.clock.runFor(500);assert(await page.locator(`[data-bubble="${id}"]`).evaluate(el=>el.transform.baseVal.getItem(0).matrix.f)<y,'Bubbles keep moving in fullscreen');
    const next=page.locator('[data-bubble][data-onstage="true"]').first(),nextId=await next.getAttribute('data-bubble'),nextBox=await next.boundingBox();await page.touchscreen.tap(nextBox.x+nextBox.width/2,nextBox.y+nextBox.height/2);
    await expect(page.locator(`[data-bubble="${nextId}"]`)).toHaveCount(0);
    await page.screenshot({path:resolve(out,`${name}-fullscreen.png`)});
    await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await expect(page.locator('#bubble-settings')).toBeVisible();await expect(target).toHaveCSS('background-color',color);await expect(target).toHaveAttribute('data-collected','true');checks++;
    // Native browser exits must restore the settings just like the floating exit button.
    await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
    if(await page.evaluate(()=>Boolean(document.fullscreenElement)))await page.evaluate(()=>document.exitFullscreen());else await page.keyboard.press('Escape');
    await expect(page.locator('#bubble-settings')).toBeVisible();await expect(page.getByRole('button',{name:'Fullscreen',exact:true})).toHaveAttribute('aria-pressed','false');checks++;
    for(const label of ['Drag shapes','Slide to reveal','Brush and paint']){
      await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();await expect(page.locator('#scene')).toHaveCSS('background-color','rgb(0, 0, 0)');
      if(label==='Brush and paint')await page.getByRole('button',{name:'Finger paint',exact:true}).click();
      await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await fullPlay(page);
      if(label==='Drag shapes'){
        await page.locator('[data-piece="circle"]').click();await page.locator('[data-target="circle"]').click();await expect(page.locator('[data-placed="circle"]')).toHaveCount(1);
        await expect(page.locator('#result-score')).toHaveText('Matched 1 / 4');
      }else if(label==='Slide to reveal'){
        await page.getByRole('slider').first().focus();await page.keyboard.press('End');await expect(page.getByRole('slider').first()).toHaveAttribute('aria-valuenow','100');
        await expect(page.locator('#result-score')).toHaveText('Friends 1 / 2');
      }else{
        await expect(page.locator('#art-tools')).toBeHidden();
        const point=await page.locator('#scene').evaluate(svg=>{const p=new DOMPoint(500,280).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};});
        await page.touchscreen.tap(point.x,point.y);await expect(page.locator('[data-stroke]')).toHaveCount(1);
      }
      await page.screenshot({path:resolve(out,`${name}-${label.split(' ')[0].toLowerCase()}-fullscreen.png`)});
      await page.getByRole('button',{name:'Games',exact:true}).click();
      await expect(page.locator('#home-view')).toBeVisible();await expect(page.getByRole('button',{name:'Fullscreen',exact:true})).toHaveAttribute('aria-pressed','false');
    }checks++;
    await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
    await expect(page.locator('.welcome')).toBeHidden();await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();await fullPlay(page);await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();checks++;
    assert.deepEqual(errors,[]);await context.close();
  }
  // Chrome exercises a real policy denial; WebKit ignores that policy, so model Safari without the API.
  const context=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block'}),page=await context.newPage();
  if(engine==='webkit')await context.addInitScript(()=>Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true}));
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/beta/play.html?deny=1`);await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
  await fullPlay(page);assert.equal(await page.evaluate(()=>document.fullscreenElement),null);await page.keyboard.press('Escape');await expect(page.locator('#bubble-settings')).toBeVisible();checks++;
  await context.close();console.log(`PASS: ${checks} compact-home and immersive-play checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
