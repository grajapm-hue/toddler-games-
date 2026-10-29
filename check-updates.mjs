import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const out=resolve(root,'artifacts','updates',engine);await mkdir(out,{recursive:true});let checks=0,revision=1,failAsset=false,slowAsset=false;
const names=['index.html','play.html','app.js','pwa.js','sw.js','share.js','share.css','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
const assets=new Map(await Promise.all(names.map(async name=>[name,await readFile(resolve(root,'docs','beta',name))])));
const cacheKey=n=>`sana-little-hands-beta-manual-test-${n}`;
const server=createServer(async(req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname.split('/').at(-1)||'index.html';let body=assets.get(name);
  if(!body){res.writeHead(404).end();return;}
  if(failAsset&&name==='icon-512.png'){res.writeHead(503).end();return;}
  if(slowAsset&&name==='icon-512.png')await new Promise(done=>setTimeout(done,700));
  if(name==='sw.js')body=body.toString().replace(/const CACHE='[^']+'/,`const CACHE='${cacheKey(revision)}'`);
  if(name==='index.html')body=body.toString().replace(/(<meta name="sana-release" content=")[^"]+/,`$1${cacheKey(revision)}`).replace(/Beta · v[\d.]+/,`Beta · test ${revision}`);
  res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(name)],'Cache-Control':'no-store'}).end(body);
}catch{res.writeHead(500).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const port=server.address().port,base=`http://127.0.0.1:${port}/beta/`;
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
async function activeCache(page,key){await expect.poll(()=>page.evaluate(async()=>{const channel=new MessageChannel();const answer=new Promise(done=>channel.port1.onmessage=e=>{channel.port1.close();done(e.data)});navigator.serviceWorker.controller?.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);return (await answer)?.version;})).toBe(key);}
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.UPDATE_URL||base);await expect(page.getByRole('button',{name:'Update app',exact:true})).toBeVisible();checks++;
  for(const [label,width,height] of [['phone',844,390],['small-phone',667,375],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    await page.setViewportSize({width,height});
    const update=await page.getByRole('button',{name:'Update app',exact:true}).boundingBox();assert(update&&update.x>=0&&update.y>=0&&update.x+update.width<=width+1&&update.y+update.height<=height+1,'Update button fits all opening-screen sizes');
    for(const selector of ['#play','#install','#share-app','#about','.preview-tag']){
      const box=await page.locator(selector).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'All grown-up controls and version remain visible');
      assert(!(update.x<box.x+box.width&&update.x+update.width>box.x&&update.y<box.y+box.height&&update.y+update.height>box.y),'Update does not overlap other controls');
    }
    await page.screenshot({path:resolve(out,`${label}-welcome.png`)});checks++;
  }
  await page.setViewportSize({width:844,height:390});await expect(page.locator('#offline-status')).toHaveText('Ready for offline play');
  if(process.env.UPDATE_URL){
    await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('up to date');await page.screenshot({path:resolve(out,'up-to-date.png')});await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
    await page.getByRole('link',{name:'Tap to play',exact:true}).click();await expect(page.locator('#update-app')).toHaveCount(0);checks++;
  }else{
    await activeCache(page,cacheKey(1));await page.evaluate(()=>caches.open('unrelated-library-test'));let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
    await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('up to date');assert.equal(navigations,0,'Already-current check does not reload');await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
    const game=await context.newPage();await game.goto(base+'play.html');await expect(game.locator('#update-app')).toHaveCount(0);
    await game.getByRole('button',{name:'Challenge level',exact:true}).click();await game.getByRole('button',{name:'Drag shapes',exact:true}).click();await game.locator('[data-piece="circle"]').click();await game.locator('[data-target="circle"]').click();await game.evaluate(()=>{window.playSurvived='yes'});
    const saved=await game.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'));
    revision=2;slowAsset=true;await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.locator('#update-app')).toBeDisabled();await expect(page.locator('#update-app')).toHaveAttribute('aria-busy','true');checks++;
    await expect(page.getByRole('dialog')).toContainText('App updated',{timeout:20000});slowAsset=false;await expect(page.locator('.preview-tag')).toHaveText('Beta · test 2');await activeCache(page,cacheKey(2));assert.equal(navigations,1,'A downloaded update reloads exactly once');
    assert.equal(await page.evaluate(()=>localStorage.getItem('sanaLittleHandsV1')),saved,'Updating preserves saved game settings');assert.equal(await game.evaluate(()=>window.playSurvived),'yes');await expect(game.locator('#result-score')).toHaveText('Matched 1 / 6');await page.screenshot({path:resolve(out,'updated.png')});checks++;
    await page.getByRole('button',{name:'Got it',exact:true}).click();await expect(page.getByRole('button',{name:'Update app',exact:true})).toBeFocused();checks++;
    // A failed asset download must retain the previous working release and permit a retry.
    revision=3;failAsset=true;await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Update unavailable',{timeout:20000});await expect(page.getByRole('button',{name:'Update app',exact:true})).toBeEnabled();await activeCache(page,cacheKey(2));await expect(page.locator('.preview-tag')).toHaveText('Beta · test 2');checks++;
    await page.getByRole('button',{name:'Got it',exact:true}).click();failAsset=false;await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('App updated',{timeout:20000});await activeCache(page,cacheKey(3));await expect(page.locator('.preview-tag')).toHaveText('Beta · test 3');await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
    // Automatic checks remain active, but never reload a child who is playing in another tab.
    revision=4;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await activeCache(page,cacheKey(4));await expect(page.locator('.preview-tag')).toHaveText('Beta · test 3');assert.equal(await game.evaluate(()=>window.playSurvived),'yes');await expect(game.locator('#result-score')).toHaveText('Matched 1 / 6');checks++;
    await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('App updated',{timeout:20000});await expect(page.locator('.preview-tag')).toHaveText('Beta · test 4');await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
    const stopped=new Promise(done=>server.close(done));server.closeAllConnections();await stopped;
    await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Update unavailable');await expect(page.getByRole('dialog')).toContainText('internet');await expect(page.getByRole('button',{name:'Update app',exact:true})).toBeEnabled();await page.screenshot({path:resolve(out,'offline.png')});await page.getByRole('button',{name:'Got it',exact:true}).click();checks++;
    await page.reload();await expect(page.locator('.preview-tag')).toHaveText('Beta · test 4');await page.getByRole('link',{name:'Tap to play',exact:true}).click();await page.getByRole('button',{name:'Abacus colors',exact:true}).click();await expect(page.locator('[data-bead-row]')).toHaveCount(100);checks++;
    await new Promise(done=>server.listen(port,'127.0.0.1',done));await page.getByRole('link',{name:'SaNa Beta welcome',exact:true}).click();await page.getByRole('button',{name:'Update app',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('up to date');checks++;
    assert.deepEqual((await page.evaluate(()=>caches.keys())).sort(),[cacheKey(4),'unrelated-library-test'].sort(),'Successful updates retire obsolete app releases and preserve other apps');await game.close();
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} manual update, automatic update, failure recovery and welcome layout checks (${engine})`);
}finally{await browser.close();if(server.listening)await new Promise(done=>server.close(done));}
