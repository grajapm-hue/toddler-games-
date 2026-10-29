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
const out=resolve(root,'artifacts','parents',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.PARENTS_URL||`http://127.0.0.1:${server.address().port}/docs/beta/index.html`;
try{
  for(const [name,width,height] of [['small-phone',667,375],['phone',844,390],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
    const sizes=await page.evaluate(()=>{const size=q=>parseFloat(getComputedStyle(document.querySelector(q)).fontSize);return {family:size('.family'),mascot:size('.family span'),name:size('h1 span'),footer:size('.bottomline p')};});
    assert(sizes.family>=16&&sizes.mascot>=26&&sizes.name>=28&&sizes.footer>=14,'Welcome labels and small SaNa must be larger and readable');
    for(const control of await page.locator('button:visible,a:visible').all()){
      const box=await control.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Welcome controls fit');
    }
    await page.screenshot({path:resolve(out,`${name}-welcome.png`)});checks++;
    const about=page.getByRole('button',{name:'About this little world',exact:true});await about.click();const dialog=page.getByRole('dialog');
    await expect(dialog).toContainText('About this project');await expect(dialog).toContainText('SaNa Little Hands');await expect(dialog).toContainText('G.RajaPathamuthu');await expect(dialog).toContainText('Guided by : JNT');await expect(dialog).toContainText('AI-Assistances');
    await expect(dialog).toContainText('short breaks');await expect(dialog).toContainText('play with a parent');
    const feedback=dialog.getByRole('link',{name:/Feedback & Suggestion/}),mail=new URL(await feedback.getAttribute('href'));assert.equal(mail.pathname,'grajapm@gmail.com');assert(mail.searchParams.get('subject').includes('SaNa'));
    await page.screenshot({path:resolve(out,`${name}-about-start.png`)});
    const close=dialog.getByRole('button',{name:'Close About',exact:true});await expect(close).toBeVisible();await feedback.scrollIntoViewIfNeeded();await expect(close).toBeInViewport();
    await page.screenshot({path:resolve(out,`${name}-about.png`)});await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(about).toBeFocused();checks++;
    await page.getByRole('link',{name:'Tap to play',exact:true}).click();await expect(page.locator('#share-app')).toHaveCount(0);await expect(page.locator('#game-back')).toBeHidden();
    for(const name of ['Drag shapes','Pop bubbles','Slide to reveal','Brush and paint']){
      await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('#share-app')).toHaveCount(0);await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('#home-view')).toBeVisible();
    }checks++;
    assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS: ${checks} welcome, About and Back checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
