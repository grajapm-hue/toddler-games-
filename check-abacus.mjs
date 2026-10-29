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
const out=resolve(root,'artifacts','abacus',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.ABACUS_URL||`http://127.0.0.1:${server.address().port}/docs/beta/play.html`;
const colors=['Red','Orange','Yellow','Green','Blue','Indigo','Violet','Pink','Brown','White'];
const fills=['#ff3b30','#ff9500','#ffe500','#35d44b','#2395ff','#6454d9','#bb52ed','#ff8fc7','#b5794a','#ffffff'];
async function gesture(page,row,index,fraction=1,cancel=false){
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const bead=page.locator(`[data-bead-row="${row}"][data-bead-index="${index}"]`);await expect(bead).toBeVisible();const from=await bead.boundingBox();assert(from,'Bead remains visible for a gesture');
  const end=await page.locator(`[data-abacus-destination="${row}"]`).evaluate(el=>{const p=new DOMPoint(Number(el.getAttribute('cx')),Number(el.getAttribute('cy'))).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y};});
  const start={x:from.x+from.width/2,y:from.y+from.height/2},to={x:start.x+(end.x-start.x)*fraction,y:start.y+(end.y-start.y)*fraction};
  const session=engine==='chromium'?await page.context().newCDPSession(page):null;
  if(session){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(to.x-start.x)*i/8,y:start.y+(to.y-start.y)*i/8,id:1}]});await session.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await session.detach();}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});if(cancel)await page.locator('#scene').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();}
}
try{
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  assert.equal(await page.getByRole('button',{name:'Abacus colors',exact:true}).count(),1,'The new Count puzzle must be available from the game menu');await page.getByRole('button',{name:'Abacus colors',exact:true}).click();
  await expect(page.locator('[data-bead-row]')).toHaveCount(100);await expect(page.locator('[data-rainbow-band]')).toHaveCount(7);await expect(page.locator('[data-circle-region]')).toHaveCount(3);checks++;
  for(const region of await page.locator('[data-color-region]').all()){await expect(region).toHaveAttribute('fill','#000');await expect(region).toHaveAttribute('stroke','#90969e');}
  await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);await expect(page.locator('#rainbow-picture text,#circle-picture text')).toHaveCount(0);await page.screenshot({path:resolve(out,'blank-drawings.png')});checks++;
  await gesture(page,1,9);await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);await gesture(page,0,9,.2);await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);checks++;
  await gesture(page,0,9,.5,true);await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);checks++;
  await gesture(page,0,9);await expect(page.locator('[data-color-label="0"]')).toBeVisible();await expect(page.locator('[data-color-label="0"]')).toHaveText('1 Red');await expect(page.locator('[data-color-region="0"]')).toHaveAttribute('fill',fills[0]);checks++;
  await gesture(page,1,9);await expect(page.locator('[data-color-label="1"]')).toBeHidden();await gesture(page,1,8);await expect(page.locator('[data-color-label="1"]')).toHaveText('2 Orange');await expect(page.locator('[data-color-label="1"]')).toBeVisible();checks++;
  for(let row=2;row<10;row++){
    for(let count=0;count<=row;count++){
      await expect(page.locator(`[data-color-region="${row}"]`)).toHaveAttribute('fill','#000');
      const bead=page.locator(`[data-bead-row="${row}"][data-bead-index="${9-count}"]`);await bead.focus();await page.keyboard.press('ArrowRight');
    }
    await expect(page.locator(`[data-color-region="${row}"]`)).toHaveAttribute('fill',fills[row]);await expect(page.locator(`[data-color-label="${row}"]`)).toHaveText(`${row+1} ${colors[row]}`);await expect(page.locator('[data-color-label]:visible')).toHaveCount(row+1);
  }checks++;
  await expect(page.locator('[data-circle-region="outer"]')).toHaveAttribute('fill',fills[7]);await expect(page.locator('[data-circle-region="middle"]')).toHaveAttribute('fill',fills[9]);await expect(page.locator('[data-circle-region="inner"]')).toHaveAttribute('fill',fills[8]);
  await expect(page.locator('#result-score')).toContainText('10');await expect(page.locator('#art-reward')).toBeVisible();await page.locator('[data-color-label="9"]').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));await page.screenshot({path:resolve(out,'all-colors-complete.png')});checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);await expect(page.locator('[data-bead-row][data-moved="true"]')).toHaveCount(0);await expect(page.locator('#art-reward')).toBeHidden();checks++;
  await gesture(page,0,9);await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await expect(page.locator('[data-color-label="0"]')).toBeVisible();await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await expect(page.locator('[data-color-label="0"]')).toBeVisible();checks++;
  for(const [name,width,height] of [['phone',844,390],['small-phone',667,375],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    await page.setViewportSize({width,height});await page.getByRole('button',{name:'Again',exact:true}).click();
    await expect(page.locator('[data-bead-row]')).toHaveCount(100);await gesture(page,0,9);await expect(page.locator('[data-color-label="0"]')).toBeVisible();
    for(const selector of ['#abacus-frame','#rainbow-picture','#circle-picture','[data-color-label="0"]']){
      const box=await page.locator(selector).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Both drawings and the abacus fit the screen');
    }
    await page.screenshot({path:resolve(out,`${name}-normal.png`)});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await gesture(page,1,9);await gesture(page,1,8);await expect(page.locator('[data-color-label="1"]')).toBeVisible();await page.screenshot({path:resolve(out,`${name}-fullscreen.png`)});await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();checks++;
  }
  await page.getByRole('button',{name:'Games',exact:true}).click();await expect(page.getByRole('button',{name:'Abacus colors',exact:true})).toBeVisible();assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} abacus counting and drawing checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
