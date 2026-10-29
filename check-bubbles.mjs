import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const root=import.meta.dirname,engine=process.env.PLAYROOM_BROWSER||'chromium';
const server=createServer(async(req,res)=>{
  try{const file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':'text/html'}).end(await readFile(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const output=resolve(root,'artifacts','bubbles',engine);await mkdir(output,{recursive:true});let checks=0;
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
  await page.goto(process.env.BUBBLES_URL||`http://127.0.0.1:${server.address().port}/index.html`);
  await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();
  await expect(page.getByRole('button',{name:'Plain bubbles',exact:true})).toBeVisible();
  const pop=async bubble=>{
    const data=await bubble.evaluate(el=>({id:el.dataset.bubble,token:el.dataset.token,color:el.dataset.color}));
    const box=await bubble.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    await expect(page.locator(`[data-bubble="${data.id}"]`)).toHaveCount(0);return data;
  };
  const first=page.locator('[data-bubble][data-onstage="true"]').first();
  const id=await first.getAttribute('data-bubble'),y=await first.evaluate(el=>el.transform.baseVal.getItem(0).matrix.f);
  await page.clock.runFor(1200);
  assert(await page.locator(`[data-bubble="${id}"]`).evaluate(el=>el.transform.baseVal.getItem(0).matrix.f)<y,'Bubbles must move upwards with elapsed time');checks++;
  await pop(page.locator('[data-bubble][data-onstage="true"]').first());
  await expect(page.locator('[data-splash]')).toHaveCount(1);
  await expect(page.locator('#bubble-score')).toContainText('1');
  await page.clock.runFor(150);
  assert(Number(await page.locator('[data-splash] circle').first().getAttribute('cx'))>0,'Splash droplets must spread from the popped bubble');
  await page.screenshot({path:resolve(output,'plain-splash.png')});
  await page.clock.runFor(750);
  await expect(page.locator('[data-splash]')).toHaveCount(0);
  await expect(page.locator('[data-bubble]')).toHaveCount(6);checks++;
  for(const [label,count] of [['Number bubbles',20],['Letter bubbles',26],['Shape bubbles',6]]){
    console.log(`Checking ${label} (${engine})`);
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.locator('[data-bubble-target]')).toHaveCount(count);
    const hit=await pop(page.locator('[data-bubble][data-onstage="true"]').first());
    const target=page.locator(`[data-bubble-target="${hit.token}"]`);
    await expect(target).toHaveAttribute('data-collected','true');
    const rgb=hit.color.match(/\w\w/g).map(hex=>parseInt(hex,16)).join(', ');
    await expect(target).toHaveCSS('background-color',`rgb(${rgb})`);
    await expect(page.locator('[data-bubble-target][data-collected="true"]')).toHaveCount(1);checks++;
    for(let attempt=0;attempt<150&&await page.locator('[data-bubble-target][data-collected="true"]').count()<count;attempt++){
      const keys=await page.locator('[data-bubble-target][data-collected="false"]').evaluateAll(els=>els.map(el=>el.dataset.bubbleTarget));
      const candidates=await page.locator('[data-bubble][data-onstage="true"]').all();let found=false;
      for(const bubble of candidates){if(keys.includes(await bubble.getAttribute('data-token'))){await pop(bubble);found=true;}}
      await page.clock.runFor(found?600:2000);
    }
    await expect(page.locator('[data-bubble-target][data-collected="true"]')).toHaveCount(count);
    await expect(page.getByRole('status')).toContainText('SaNa');
    await page.clock.runFor(6000);
    assert((await page.locator('[data-bubble]').count())>0,'Bubbles must continue after the collection is complete');
    assert((await page.locator('[data-bubble]').count())<=6,'The bubble pool must remain bounded');
    await page.screenshot({path:resolve(output,`${label.split(' ')[0].toLowerCase()}-complete.png`)});checks++;
  }
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect(page.locator('[data-bubble-target][data-collected="true"]')).toHaveCount(0);checks++;
  await page.getByRole('button',{name:'Challenge level',exact:true}).click();
  await expect(page.locator('[data-bubble]')).toHaveCount(9);
  await page.getByRole('button',{name:'Explore level',exact:true}).click();
  await expect(page.locator('[data-bubble]')).toHaveCount(4);
  await page.getByRole('button',{name:'Play level, ages 2 to 4',exact:true}).click();checks++;
  await page.getByRole('button',{name:'Letter bubbles',exact:true}).click();
  for(const [label,width,height] of [['small-phone',667,375],['portrait',390,844],['tablet',1024,768]]){
    await page.setViewportSize({width,height});await page.clock.runFor(100);
    for(const locator of [page.locator('#bubble-modes'),...await page.locator('[data-bubble-target]').all()]){
      const box=await locator.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Modes and target list must fit the viewport');
    }
    assert((await page.locator('#scene').boundingBox()).width>80);
    await page.screenshot({path:resolve(output,`letters-${label}.png`)});checks++;
  }
  if(await page.locator('#share-app').count()){
    await page.getByRole('button',{name:'Share app',exact:true}).click();
    const before=await page.locator('[data-bubble]').first().getAttribute('transform');
    await page.clock.runFor(2000);
    assert.equal(await page.locator('[data-bubble]').first().getAttribute('transform'),before,'Share dialog must pause bubble motion');
    await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
  }
  await page.getByRole('button',{name:'Home',exact:true}).click();await page.clock.runFor(2000);
  await expect(page.locator('#bubble-tracker')).toBeHidden();
  await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('viewBox','0 0 1000 440');checks++;
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} rising bubble checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
