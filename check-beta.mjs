import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,mkdtemp} from 'node:fs/promises';
import {dirname,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const root=dirname(fileURLToPath(import.meta.url));
const docs=resolve(root,'docs');
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    let path=decodeURIComponent(url.pathname).replace(/^\/toddler-games-\//,'/');
    if(path.endsWith('/'))path+='index.html';
    const file=resolve(docs,'.'+path);
    if(!file.startsWith(docs+sep)){res.writeHead(403).end();return;}
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(body);
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const site=process.env.BETA_URL||`http://127.0.0.1:${server.address().port}/toddler-games-/beta/`;
const engine=process.env.PLAYROOM_BROWSER||'chromium';
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
let checks=0;const errors=[];
const output=resolve(root,'artifacts','beta',engine);await mkdir(output,{recursive:true});
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>window.addEventListener('beforeinstallprompt',event=>{
    // Suppress the real OS dialog; installation criteria are checked through CDP below.
    if(event.isTrusted){event.preventDefault();event.stopImmediatePropagation();}
  },true));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(site);assert.equal(response.status(),200,'Beta welcome must be published');checks++;
  await expect(page).toHaveTitle(/Beta/);
  await expect(page.getByRole('link',{name:'Tap to play'})).toHaveAttribute('href','play.html');
  const manifestResponse=await context.request.get(new URL('manifest.webmanifest',site).href);assert.equal(manifestResponse.status(),200);
  const manifest=await manifestResponse.json();assert.equal(manifest.name,'SaNa Little Hands Beta');assert.equal(manifest.orientation,'landscape');
  assert.equal(new URL(manifest.start_url,site).pathname,new URL('index.html',site).pathname);
  assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');checks++;
  for(const icon of manifest.icons){const response=await context.request.get(new URL(icon.src,site).href);assert.equal(response.status(),200);}checks++;
  // A neighbor cache must survive activation of this Beta worker.
  await page.evaluate(async()=>{await caches.open('sana-little-hands-main-preserve');});
  await expect(page.getByRole('status')).toHaveText('Ready for offline play',{timeout:20000});
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:20000}).toBe(true);
  const details=await page.evaluate(async()=>({scope:(await navigator.serviceWorker.getRegistration()).scope,keys:await caches.keys()}));
  assert.equal(details.scope,site);assert(details.keys.includes('sana-little-hands-main-preserve'));checks++;
  if(engine==='chromium'){
    // Normal persistent profile: incognito contexts are deliberately not installable.
    const profile=await mkdtemp(resolve(output,'install-profile-'));
    const installContext=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    try{
      const installPage=await installContext.newPage();await installPage.goto(site);
      const cdp=await installContext.newCDPSession(installPage);
      const {errors:manifestErrors}=await cdp.send('Page.getAppManifest');assert.deepEqual(manifestErrors,[]);
      const {installabilityErrors}=await cdp.send('Page.getInstallabilityErrors');assert.deepEqual(installabilityErrors,[]);checks++;
    }finally{await installContext.close();}
  }
  await page.getByRole('button',{name:'Install app',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Add to Home Screen');
  await page.getByRole('button',{name:'Got it'}).click();checks++;
  await page.screenshot({path:resolve(output,'welcome.png')});
  // Exercise our side of the native install-prompt contract without installing on the host.
  await page.evaluate(()=>{
    const event=new Event('beforeinstallprompt',{cancelable:true});
    event.prompt=async()=>{window.promptCalls=(window.promptCalls||0)+1;};
    event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);
  });
  await page.getByRole('button',{name:'Install app',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.promptCalls),1);
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('button',{name:'Installed',exact:true})).toBeVisible();checks++;
  await page.getByRole('link',{name:'Tap to play'}).click();
  await expect(page.getByRole('button',{name:'Play level, ages 2 to 4'})).toHaveAttribute('aria-pressed','true');checks++;
  await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
  await expect(page.locator('[data-piece]')).toHaveCount(4);
  await page.locator('[data-piece="circle"]').click();await page.locator('[data-target="circle"]').click();
  await expect(page.locator('[data-piece]')).toHaveCount(3);checks++;
  await page.screenshot({path:resolve(output,'play.png')});
  await page.getByRole('button',{name:'Home',exact:true}).click();
  await page.getByRole('button',{name:'Challenge level'}).click();
  await page.getByRole('link',{name:'SaNa Beta welcome'}).click();
  await expect(page.getByRole('status')).toHaveText('Ready for offline play');
  if(engine==='webkit'&&!process.env.BETA_URL){
    const closed=new Promise(done=>server.close(done));server.closeAllConnections();await closed;
    assert.equal(server.listening,false);
  }else if(engine!=='webkit')await context.setOffline(true);
  if(engine!=='webkit'||!process.env.BETA_URL){
    await page.goto(site+'?offline=1',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('link',{name:'Tap to play'})).toBeVisible();
    await page.getByRole('link',{name:'Tap to play'}).click();
    await expect(page.getByRole('button',{name:'Challenge level'})).toHaveAttribute('aria-pressed','true');
    await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('button',{name:'Drag shapes',exact:true})).toBeVisible();
    for(const [name,selector,count] of [['Pop bubbles','[data-bubble]',9],['Slide to reveal','[data-slider-handle]',3],['Brush and paint','[data-dirt]',14]]){
      await page.getByRole('button',{name,exact:true}).click();await expect(page.locator(selector)).toHaveCount(count);
      await page.getByRole('button',{name:'Home',exact:true}).click();checks++;
    }
    checks++;
  }
  assert.deepEqual(errors,[]);checks++;
  await context.close();
  console.log(`PASS: ${checks} Beta checks (${engine}); ${site}; offline control: ${engine==='webkit'?(process.env.BETA_URL?'local origin-shutdown proof used separately':'origin stopped'):'network offline'}`);
}finally{await browser.close();if(server.listening)await new Promise(done=>server.close(done));}
