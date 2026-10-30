import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',out=resolve(root,'artifacts','parent-controls',engine);await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=process.env.CONTROLS_URL||`http://127.0.0.1:${server.address().port}/docs/beta/`;
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});let checks=0;const failures=[];
async function check(name,run){try{await run();checks++;}catch(error){failures.push(name+': '+error.message);console.log('FAIL: '+name+': '+error.message);}}
async function fits(page,selector,width,height){const box=await page.locator(selector).boundingBox();assert(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,selector+' fits on screen: '+JSON.stringify(box));}
async function age(page,value){await page.getByRole('button',{name:'Choose starting age',exact:true}).click();await page.getByRole('option',{name:`Age ${value}`,exact:true}).click();}
try{
 await check('Opening age chips are four distinct inert information labels',async()=>{
  const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage();try{await page.goto(new URL('index.html?age=3',base).href);const before=await page.evaluate(()=>({url:location.href,age:localStorage.getItem('sanaLittleHandsAgeV1'),play:document.getElementById('play').href}));
   assert.equal(await page.locator('.age-choices button,.age-choices a,.age-choices [tabindex],.age-choices [aria-pressed]').count(),0,'Age information must not be interactive or show selection');const chips=page.locator('.age-choices [data-age]');await expect(chips).toHaveCount(4);const colors=await chips.evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor));assert.equal(new Set(colors).size,4,'All four age chips have different backgrounds');
   for(const chip of await chips.all()){await chip.tap();await chip.click();}assert.deepEqual(await page.evaluate(()=>({url:location.href,age:localStorage.getItem('sanaLittleHandsAgeV1'),play:document.getElementById('play').href})),before,'Touching information cannot change age, link or page');await page.screenshot({path:resolve(out,'portrait-information.png')});await page.getByRole('link',{name:'Tap to play',exact:true}).click();await expect(page.locator('#age-choice')).toHaveText('Age 3');
  }finally{await context.close();}
 });
 for(const [width,height] of [[320,568],[393,852],[667,375],[844,390],[1024,768]])await check(`Parent controls work in every room, hide only in fullscreen ${width}x${height}`,async()=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
  try{await page.goto(new URL('play.html?age=2',base).href);for(const [name,view] of [['Drag shapes','drag'],['Pop bubbles','bubbles'],['Slide to reveal','slide'],['Brush and paint','brush'],['Abacus colors','abacus']]){
    await page.getByRole('button',{name,exact:true}).click();assert(await page.locator('#age-choice').isVisible(),'Age remains visible in '+name);assert(await page.locator('#update-app').isVisible(),'Update remains visible in '+name);await fits(page,'#age-choice',width,height);await fits(page,'#update-app',width,height);
    for(const selector of ['#show-me','#again']){assert(await page.locator(selector).isVisible(),'Existing game actions remain available');await fits(page,selector,width,height);}
    const boxes=await Promise.all(['#age-choice','#update-app','#show-me','#again'].map(selector=>page.locator(selector).boundingBox()));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),'Parent and game action controls never overlap');}
    const scene=await page.locator('#scene').boundingBox();assert(Math.min(scene.width,scene.height)>80,'The controls leave room for play');await page.locator('#age-choice').click();await fits(page,'#age-menu',width,height);await page.getByRole('option',{name:'Age 5',exact:true}).click();await expect(page.locator('#app')).toHaveAttribute('data-view',view);await expect(page.locator('#age-choice')).toHaveText('Age 5');if(view==='drag')await expect(page.locator('[data-piece]')).toHaveCount(4);
    if(view==='drag'){await page.locator('[data-piece="circle"]').click();await page.locator('[data-target="circle"]').click();await age(page,5);await expect(page.locator('#result-score')).toHaveText('Matched 1 / 4');}
    await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Update unavailable');await page.keyboard.press('Escape');await expect(page.locator('#app')).toHaveAttribute('data-view',view);
    await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await expect(page.locator('#age-choice')).toBeHidden();await expect(page.locator('#update-app')).toBeHidden();await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await expect(page.locator('#age-choice')).toBeVisible();await expect(page.locator('#update-app')).toBeVisible();
    if(view==='drag')await page.screenshot({path:resolve(out,`${width}x${height}-normal-play.png`)});await age(page,2);await page.getByRole('button',{name:'Games',exact:true}).click();
   }assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 if(failures.length)throw new Error(failures.join('\n'));console.log(`PASS: ${checks} informational ages and all-room parent control checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
