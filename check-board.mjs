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
const out=resolve(root,'artifacts','board',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.BOARD_URL||`http://127.0.0.1:${server.address().port}/docs/beta/play.html`;
const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
async function boardLayout(page){
  assert.equal(await page.locator('#play-options').count(),1,'Sub-level controls must have an in-board container');
  const activity=await page.locator('#app').getAttribute('data-view');
  await expect(page.locator('#bubble-modes')).toBeVisible({visible:activity==='bubbles'});
  await expect(page.locator('#brush-modes')).toBeVisible({visible:activity==='brush'});
  const board=await page.locator('.play-mat').boundingBox(),results=await page.locator('#game-results').boundingBox(),options=await page.locator('#play-options').boundingBox();
  assert(results&&options,'Results and sub-levels must be inside the black play rectangle');
  const scene=await page.locator('#scene').boundingBox();assert(scene.width>80&&scene.height>80,`The controls leave room to play: ${activity} ${JSON.stringify(page.viewportSize())} ${JSON.stringify(scene)}`);
  for(const selector of ['#game-back','#game-front','#game-home','#play-options','#game-results']){
    const box=await page.locator(selector).boundingBox();assert(box&&box.x>=board.x-1&&box.y>=board.y-1&&box.x+box.width<=board.x+board.width+1&&box.y+box.height<=board.y+board.height+1,'All game controls remain inside the board');
    assert(!intersects(box,scene),'Controls do not cover playable content');
  }
  const box=await page.locator('.play-toolbar').evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));assert(box.height>0&&box.width>300);
  const positions=await page.evaluate(()=>{const board=document.querySelector('.play-mat'),back=document.getElementById('game-back'),front=document.getElementById('game-front'),options=document.getElementById('play-options'),results=document.getElementById('game-results');const pos=el=>{let x=0,y=0;while(el&&el!==board){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent;}return {x,y};};return {height:board.clientHeight,width:board.clientWidth,backY:pos(back).y,frontY:pos(front).y,backX:pos(back).x,frontRight:pos(front).x+front.offsetWidth,resultsX:pos(results).x,optionsRight:pos(options).x+options.offsetWidth};});
  assert(positions.backY>positions.height-60&&positions.frontY>positions.height-60,'Back and Front are in the bottom corners');
  assert(positions.backX<15&&positions.frontRight>positions.width-15,'Back is left and Front is right');
  assert(results&&!intersects(results,options),'Results and sub-levels do not overlap');
  assert(positions.resultsX<15&&positions.optionsRight>positions.width-15,'Results stay left and sub-levels stay right');
}
try{
  for(const [name,width,height] of [['small-phone',667,375],['phone',844,390],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
    await expect(page.getByRole('button',{name:'Abacus colors',exact:true})).toBeVisible();
    await expect(page.locator('#play-levels')).toBeHidden();
    await expect(page.locator('.topbar [data-level]')).toHaveCount(0);
    await page.screenshot({path:resolve(out,`${name}-home.png`)});
    for(const label of ['Drag shapes','Pop bubbles','Slide to reveal','Brush and paint','Abacus colors']){
      await page.getByRole('button',{name:label,exact:true}).click();if(label==='Pop bubbles'){
        const before=await page.locator('#scene').boundingBox(),bubble=page.locator('[data-bubble][data-onstage="true"]').first(),point=await bubble.boundingBox();
        await page.touchscreen.tap(point.x+point.width/2,point.y+point.height/2);
        const after=await page.locator('#scene').boundingBox();assert(Math.abs(after.height-before.height)<1&&Math.abs(after.width-before.width)<1,'The first pop must not resize or shift the moving game field');
        await page.getByRole('button',{name:'Letter bubbles',exact:true}).click();
      }
      await boardLayout(page);await page.screenshot({path:resolve(out,`${name}-${label.split(' ')[0]}-normal.png`)});
      await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await boardLayout(page);
      const selected=()=>page.locator('#play-options [aria-pressed="true"]:visible').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')));
      const original=await selected();await page.getByRole('button',{name:label==='Abacus colors'?'Back':'Front',exact:true}).click();await expect(page.locator('#app')).toHaveClass(/immersive/);
      await page.getByRole('button',{name:label==='Abacus colors'?'Front':'Back',exact:true}).click();assert.deepEqual(await selected(),original,'Front and Back work inside fullscreen and restore the selected step');await boardLayout(page);
      await expect(page.locator('#play-options [data-level]')).toHaveCount(3);await page.screenshot({path:resolve(out,`${name}-${label.split(' ')[0]}-fullscreen.png`)});
      await page.getByRole('button',{name:'Games',exact:true}).click();await expect(page.locator('#home-view')).toBeVisible();await expect(page.locator('#play-levels')).toBeHidden();await expect(page.locator('.topbar [data-level]')).toHaveCount(0);checks++;
    }
    assert.deepEqual(errors,[]);await context.close();
  }
  const context=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block'}),page=await context.newPage();await page.goto(base);await page.getByRole('button',{name:'Drag shapes',exact:true}).click();await page.getByRole('button',{name:'Explore level',exact:true}).click();
  const sequence=[];
  for(const activity of ['drag','bubbles','slide','brush'])for(const level of [1,2,3])for(const mode of activity==='bubbles'?['plain','numbers','letters','shapes']:activity==='brush'?['clean','paint']:[''])sequence.push({activity,level,mode});
  sequence.push({activity:'abacus',level:1,mode:''});
  async function current(){return page.evaluate(()=>({activity:document.getElementById('app').dataset.view,level:Number(document.querySelector('[data-level][aria-pressed="true"]').dataset.level),mode:document.getElementById('app').dataset.view==='bubbles'?document.querySelector('[data-bubble-mode][aria-pressed="true"]').dataset.bubbleMode:document.getElementById('app').dataset.view==='brush'?(document.getElementById('paint-mode').getAttribute('aria-pressed')==='true'?'paint':'clean'):''}));}
  for(const stage of sequence){assert.deepEqual(await current(),stage,'Front visits every sub-level and game in order');await page.getByRole('button',{name:'Front',exact:true}).click();}
  await expect(page.locator('#home-view')).toBeVisible();checks++;
  await page.getByRole('button',{name:'Abacus colors',exact:true}).click();
  for(const stage of sequence.toReversed()){assert.deepEqual(await current(),stage,'Back reverses every sub-level and game');await page.getByRole('button',{name:'Back',exact:true}).click();}
  await expect(page.locator('#home-view')).toBeVisible();checks++;await context.close();
  console.log(`PASS: ${checks} in-board layout and navigation checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
