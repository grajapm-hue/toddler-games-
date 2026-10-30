import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':extname(path)==='.js'?'text/javascript':'text/html'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const output=resolve(root,'artifacts','bubble-settings',engine);await mkdir(output,{recursive:true});let checks=0;
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.clock.install();
  await page.goto(process.env.BUBBLES_URL||`http://127.0.0.1:${server.address().port}/index.html`);
  await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();await page.getByRole('button',{name:'Letter bubbles',exact:true}).click();
  await expect(page.getByRole('button',{name:'Slow bubble speed',exact:true})).toBeVisible();
  const bubble=page.locator('[data-bubble][data-onstage="true"]').first(),hit=await bubble.getAttribute('data-token'),box=await bubble.boundingBox();
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  const target=page.locator(`[data-bubble-target="${hit}"]`),color=await target.evaluate(el=>getComputedStyle(el).backgroundColor);
  const moving=page.locator('[data-bubble][data-onstage="true"]').first(),id=await moving.getAttribute('data-bubble');
  const y=()=>page.locator(`[data-bubble="${id}"]`).evaluate(el=>el.transform.baseVal.getItem(0).matrix.f);
  await page.getByRole('button',{name:'Slow bubble speed',exact:true}).click();const start=await y();await page.clock.runFor(1000);const slow=start-await y();
  await page.getByRole('button',{name:'Fast bubble speed',exact:true}).click();const middle=await y();await page.clock.runFor(1000);const fast=middle-await y();
  assert(slow>0&&fast>slow*2,'Fast must move the same bubble substantially farther than Slow in equal time');checks++;
  await page.getByRole('button',{name:'Small bubbles',exact:true}).click();
  const small=Number(await page.locator(`[data-bubble="${id}"] > circle`).first().getAttribute('r'));
  await page.getByRole('button',{name:'Large bubbles',exact:true}).click();
  const large=Number(await page.locator(`[data-bubble="${id}"] > circle`).first().getAttribute('r'));
  assert(large>small*1.5,'Size must immediately resize the existing bubble');
  await expect(target).toHaveAttribute('data-collected','true');await expect(target).toHaveCSS('background-color',color);
  await expect(page.locator('[data-bubble-target][data-collected="true"]')).toHaveCount(1);checks++;
  for(const label of ['Plain bubbles','Number bubbles','Letter bubbles','Shape bubbles']){
    await page.getByRole('button',{name:label,exact:true}).click();await expect(page.getByRole('button',{name:'Fast bubble speed',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('button',{name:'Large bubbles',exact:true})).toHaveAttribute('aria-pressed','true');
  }checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect(page.getByRole('button',{name:'Large bubbles',exact:true})).toHaveAttribute('aria-pressed','true');checks++;
  for(const [label,width,height] of [['small-phone',667,375],['portrait',390,844],['tablet',1024,768]]){
    await page.setViewportSize({width,height});await page.clock.runFor(100);
    for(const control of await page.locator('#bubble-settings button:visible').all()){
      const rect=await control.boundingBox();assert(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,'Settings fit the screen');
    }
    assert(await page.locator('#scene').evaluate(svg=>svg.clientHeight)>80,'Settings leave room for moving bubbles');
    await page.screenshot({path:resolve(output,`${label}.png`)});checks++;
  }
  await page.reload();await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();
  await expect(page.getByRole('button',{name:'Fast bubble speed',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Large bubbles',exact:true})).toHaveAttribute('aria-pressed','true');checks++;
  await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Brush and paint',exact:true}).click();
  await expect(page.locator('#bubble-settings')).toBeHidden();assert.deepEqual(errors,[]);checks++;
  console.log(`PASS: ${checks} bubble speed/size checks (${engine})`);await context.close();
}finally{await browser.close();await new Promise(done=>server.close(done));}
