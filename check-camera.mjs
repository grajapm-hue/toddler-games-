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
const out=resolve(root,'artifacts','camera',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.CAMERA_URL||`http://127.0.0.1:${server.address().port}/docs/beta/play.html`;
async function safeFrame(page,insets){
  const size=page.viewportSize(),phone=Math.min(size.width,size.height)<=600,rotated=size.width<size.height;
  const fallback=phone?32:0;
  const top=Math.max(insets.top,rotated?fallback:0),bottom=Math.max(insets.bottom,rotated?fallback:0),left=Math.max(insets.left,rotated?0:fallback),right=Math.max(insets.right,rotated?0:fallback);
  const frame=await page.locator('#app').boundingBox();
  assert(frame.x>=left-1&&frame.y>=top-1&&frame.x+frame.width<=size.width-right+1&&frame.y+frame.height<=size.height-bottom+1,'The whole frame must stay clear of camera and system safe areas');
  assert(frame.width>=size.width-left-right-5&&frame.height>=size.height-top-bottom-5,'Use the full remaining safe area');
}
async function centeredReward(page){
  await expect(page.locator('#art-reward')).toBeVisible();
  const layout=await page.locator('#art-reward').evaluate(el=>({center:el.offsetLeft+el.offsetWidth/2,boardCenter:el.parentElement.clientWidth/2,rewardBottom:el.offsetTop+el.offsetHeight,toolbarTop:document.querySelector('.play-toolbar').offsetTop}));
  assert(Math.abs(layout.center-layout.boardCenter)<2,'Appreciation stays in the middle at the top, including rotated screens');
  assert(layout.rewardBottom<=layout.toolbarTop,'Appreciation has its own top row, clear of results and play content');
}
try{
  for(const [name,width,height] of [['phone',844,390],['small-phone',667,375],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();await page.goto(base);
    for(const insets of [{top:0,right:0,bottom:0,left:0},{top:0,right:0,bottom:0,left:62},{top:54,right:66,bottom:20,left:0}]){
      // Supply device inset values at the CSS boundary; run the real frame-fitting and input code.
      await page.addStyleTag({content:`#viewport{--device-safe-top:${insets.top}px;--device-safe-right:${insets.right}px;--device-safe-bottom:${insets.bottom}px;--device-safe-left:${insets.left}px}`});
      await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
      for(const label of ['Drag shapes','Pop bubbles','Slide to reveal','Brush and paint','Abacus colors']){
        await page.getByRole('button',{name:label,exact:true}).click();await safeFrame(page,insets);
        await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await safeFrame(page,insets);
        await page.getByRole('button',{name:'Games',exact:true}).click();await safeFrame(page,insets);checks++;
      }
    }
    // Real abacus completion displays a centered reward, without covering the edge bead or controls.
    await page.getByRole('button',{name:'Abacus colors',exact:true}).click();
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
    for(let row=0;row<10;row++){await page.locator(`[data-bead-row="${row}"][data-bead-index="0"]`).focus();await page.keyboard.press('End');await expect(page.locator(`[data-color-label="${row}"]`)).toContainText('10 Ten');}
    await centeredReward(page);await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await centeredReward(page);
    await page.screenshot({path:resolve(out,`${name}-appreciation.png`)});await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();
    await page.getByRole('button',{name:'Again',exact:true}).click();await expect(page.locator('#art-reward')).toBeHidden();checks++;
    await page.getByRole('button',{name:'Games',exact:true}).click();await page.getByRole('button',{name:'Explore level',exact:true}).click();await page.getByRole('button',{name:'Drag shapes',exact:true}).click();
    for(const id of ['circle','triangle']){await page.locator(`[data-piece="${id}"]`).click();await page.locator(`[data-target="${id}"]`).click();}
    await centeredReward(page);checks++;
    await context.close();
  }
  console.log(`PASS: ${checks} camera clearance and centered appreciation checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
