// Exercise the published V198 to puppy V199 upgrade without losing a saved photo or an open game.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const playwright=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test'),{expect}=playwright;
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const root=path.join(__dirname,'docs'),prior=process.env.CIRCLE_UPDATE?'01bc6a65a9b073d0cc2566182e5718bf30597311':'5278cc75e8cec6903bc478512a898c9bb53c6af0',older=new Map();
const changed=new Set(['index.html','play.html','app.js','glossy-blocks.js','glossy-blocks.css','parent-guide.js','pwa.js','sw.js','share.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','update-v1.98.html','v1.98.html','v1.99.html']);
const out=path.join(__dirname,'artifacts/puppy-v199',engine,process.env.BROWSER_ENTRY?'browser-entry':process.env.RECOVERY_ENTRY?'fresh-entry':'manual-update');fs.mkdirSync(out,{recursive:true});
const target=fs.readFileSync(path.join(root,'beta/sw.js'),'utf8').match(/const CACHE='([^']+)'/)[1];
const previousCache=process.env.CIRCLE_UPDATE?'sana-little-hands-beta-v199-puppy-art':'sana-little-hands-beta-v198-r5-short-share';
let revision=198,browser,checks=0,heldUnchanged=0,refetchedMusic=0,stalePages=0,bustedPages=0,heldChanged=0;
const heldResponses=[];
const check=(name,pass)=>{assert(pass,name);checks++;console.log('PASS '+name);};
const server=http.createServer((req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/toddler-games-\//,'/');
  const filename=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));assert(filename.startsWith(root+path.sep));
  const relative=path.relative(path.join(root,'beta'),filename).replaceAll('\\','/');let body;
  if(revision===199&&relative==='bgm-sana-v86.mp3')refetchedMusic++;
  if(revision===199&&process.env.HOLD_UNCHANGED&&relative==='bgm-sana-v86.mp3'){
    heldUnchanged++;heldResponses.push(res);return;
  }
  if(revision===199&&process.env.STALL_CHANGED&&relative==='sana-puppy-welcome-circle-v199.png'){
    heldChanged++;heldResponses.push(res);return;
  }
  if(revision===198&&changed.has(relative)){
    if(!older.has(relative))older.set(relative,execFileSync('git',['show',`${prior}:docs/beta/${relative}`],{cwd:__dirname,maxBuffer:20000000}));
    body=older.get(relative);
  }else body=fs.readFileSync(filename);
  if(revision===199&&process.env.STALE_PAGE&&relative==='index.html'){
    if(!new URL(req.url,'http://local').searchParams.has('sana_update')){body=older.get('index.html');stalePages++;}
    else bustedPages++;
  }
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'})[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
}catch{res.writeHead(404).end();}});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/toddler-games-/beta/`;
  browser=await playwright[engine].launch({headless:true});
  const context=await browser.newContext({viewport:{width:393,height:852},acceptDownloads:true,...(process.env.BROWSER_ENTRY?{userAgent:'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/133.0.0.0 Mobile Safari/537.36'}:{})});
  const welcome=await context.newPage();welcome.setDefaultTimeout(15000);
  await welcome.goto(base+'index.html');await expect(welcome.locator('#offline-status')).toHaveText('Ready for offline play',{timeout:30000});
  check('The previous published release is initially installed',await welcome.locator('[data-release-version]').first().textContent()===(process.env.CIRCLE_UPDATE?'v1.99':'v1.98'));
  if(process.env.CIRCLE_UPDATE)check('The previous welcome uses the square portrait',await welcome.locator('[data-sana-puppy]').getAttribute('href')==='sana-puppy-v199-512.png');
  await welcome.evaluate(()=>caches.open('unrelated-library-test'));
  const game=await context.newPage();await game.goto(base+'play.html?age=3');
  await game.locator('[data-activity="puzzle"]').click();
  await game.locator('#puzzle-file').setInputFiles(path.join(root,'beta/icon-192.png'));
  await expect(game.locator('[data-puzzle-choice]')).toHaveCount(2);
  await expect(game.locator('#puzzle-board')).toHaveAttribute('data-ready','true');
  await game.evaluate(()=>{window.releaseTestMarker='playing';});
  const settings=await game.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'));
  if(process.env.CORRUPT_AUDIO)await welcome.evaluate(async({cacheName,url})=>{
    const cache=await caches.open(cacheName);await cache.put(url,new Response(new Uint8Array([1,2,3])));
  },{cacheName:previousCache,url:base+'bgm-sana-v86.mp3'});
  revision=199;
  if(process.env.BROWSER_ENTRY){
    assert(fs.existsSync(path.join(root,'update-beta-v1.99.html')),'A browser updater must exist outside the installed Beta scope');
    await welcome.goto(new URL('../update-beta-v1.99-r4.html',base).href);
    check('The browser update page is outside the old Beta worker scope',!welcome.url().startsWith(base)&&await welcome.evaluate(()=>!navigator.serviceWorker.controller));
    check('Android has a user-operated Open in Chrome link',await welcome.locator('#open-chrome').isVisible()&&(await welcome.locator('#open-chrome').getAttribute('href')).includes('package=com.android.chrome;'));
    await welcome.waitForURL('**/beta/index.html',{timeout:30000});
  }else if(process.env.RECOVERY_ENTRY){
    await welcome.goto(base+'v1.99.html');
    await welcome.waitForURL('**/index.html',{timeout:30000});
  }else await welcome.getByRole('button',{name:'Update app',exact:true}).click();
  if(process.env.STALL_CHANGED){
    await expect(welcome.locator('#dialog-title')).toHaveText('Update unavailable',{timeout:65000});
    check('A stalled changed-file download is aborted and retried three times',heldChanged===3);
    const keys=await welcome.evaluate(()=>caches.keys());
    check('A failed download retains the previous working release and removes only its incomplete cache',keys.includes(previousCache)&&!keys.includes(target));
    check('A failed download preserves saved game settings',await welcome.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'))===settings);
    await game.reload();await game.locator('[data-activity="puzzle"]').click();await expect(game.locator('[data-puzzle-choice]')).toHaveCount(2);
    check('The saved puzzle photo remains after a failed download',await game.locator('[data-puzzle-choice]').count()===2);
    await context.close();return;
  }
  await expect(welcome.locator('meta[name="sana-release"]')).toHaveAttribute('content',target,{timeout:process.env.HOLD_UNCHANGED?6000:30000});
  if(process.env.HOLD_UNCHANGED)check('A welcome-only upgrade does not re-download unchanged cached music',heldUnchanged===0);
  if(process.env.CORRUPT_AUDIO)check('Corrupted cached music is rejected and downloaded again',refetchedMusic>0);
  if(process.env.STALE_PAGE)check('An older downloaded welcome is rejected and retried with a fresh URL',stalePages>0&&bustedPages>0);
  await expect(welcome.locator('[data-release-version]').first()).toHaveText('v1.99',{timeout:30000});
  await expect(welcome.locator('#offline-status')).toHaveText('Ready for offline play',{timeout:30000});
  check('Update installs and displays puppy V199',await welcome.locator('[data-release-version]').first().textContent()==='v1.99');
  check('Updated welcome loads the puppy while retaining SaNa',await welcome.locator('[data-sana-puppy]').count()===1&&(await welcome.locator('#welcome-title').textContent()).includes('SaNa'));
  const notice=welcome.getByRole('button',{name:'Got it',exact:true});
  if(await notice.isVisible())await notice.click();
  await welcome.getByRole('button',{name:'Share app',exact:true}).click();
  const newShare=new URL(await welcome.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href'));
  check('Updated app keeps link-only sharing',newShare.searchParams.get('text')==='https://grajapm-hue.github.io/toddler-games-/beta/index.html');
  await welcome.getByRole('button',{name:'Got it',exact:true}).click();
  check('An open child game survives the update',await game.evaluate(()=>window.releaseTestMarker)==='playing');
  check('Update preserves saved game settings',await welcome.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'))===settings);
  const cachesAfter=await welcome.evaluate(()=>caches.keys());
  check('The current cache is present and the previous release cache is removed',cachesAfter.includes(target)&&!cachesAfter.includes(previousCache));
  if(process.env.CIRCLE_UPDATE)check('The updated welcome uses the circular portrait',await welcome.locator('[data-sana-puppy]').getAttribute('href')==='sana-puppy-welcome-circle-v199.png');
  check('Unrelated cached data is preserved',cachesAfter.includes('unrelated-library-test'));
  await game.reload();await game.locator('[data-activity="puzzle"]').click();
  await expect(game.locator('[data-puzzle-choice]')).toHaveCount(2);
  check('Saved puzzle photo remains available after upgrading',await game.locator('[data-puzzle-choice]').count()===2);
  await context.setOffline(true);
  const offline=await context.newPage();await offline.goto(base+'index.html');
  check('Puppy V199 welcome reopens offline',await offline.locator('[data-release-version]').first().textContent()==='v1.99');
  check('Puppy artwork decodes offline',await offline.evaluate(async()=>{const image=new Image();image.src=document.querySelector('[data-sana-puppy]').getAttribute('href');await image.decode();return image.naturalWidth===512;}));
  await offline.locator('#play').click();await offline.locator('#more-games').click();await offline.locator('[data-activity="machines"]').click();
  check('New Machines activity starts offline',await offline.locator('#glossy-room').isVisible());
  await offline.locator('#glossy-look').click();
  check('Complete machine reference renders offline',await offline.locator('#glossy-look-image').evaluate(async image=>{await image.decode();return image.naturalWidth>0;}));
  await offline.screenshot({path:path.join(out,'v199-offline-machine-reference.png')});
  if(process.env.BROWSER_ENTRY){
    await context.setOffline(false);
    await welcome.evaluate(async({html,url,target})=>{
      localStorage.setItem('browser-repair-preserved','keep');
      const cache=await caches.open(target);
      await cache.put(url,new Response(html,{headers:{'Content-Type':'text/html'}}));
    },{html:older.get('index.html').toString(),url:base+'index.html',target});
    await welcome.goto(new URL('../update-beta-v1.99-r4.html',base).href);
    await expect(welcome.locator('#retry')).toBeVisible();
    check('An older welcome inside a newer cache cannot be reported as a completed puppy update',!welcome.url().startsWith(base)&&(await welcome.locator('#progress').textContent()).includes('not ready'));
    check('An incomplete update preserves local data',await welcome.evaluate(()=>localStorage.getItem('browser-repair-preserved'))==='keep');
    const embedded=await browser.newContext({userAgent:'Mozilla/5.0 (Linux; Android 15; wv) AppleWebKit/537.36 Version/4.0 Chrome/133.0.0.0 Mobile Safari/537.36'});
    const embeddedPage=await embedded.newPage();await embeddedPage.goto(new URL('../update-beta-v1.99-r4.html',base).href);
    check('An embedded Android browser waits for Chrome instead of updating its separate storage',
      (await embeddedPage.locator('#progress').textContent()).includes('Tap Open in Chrome')&&
      await embeddedPage.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length===0));
    await embedded.close();
  }
  await context.close();
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  await browser?.close();heldResponses.forEach(response=>response.end());server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,failed:process.exitCode||0},null,2));
  console.log(JSON.stringify({checks,failed:process.exitCode||0}));
});
