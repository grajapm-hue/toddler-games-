import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',baseline=process.env.LAYOUT_BASELINE==='1';
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const out=resolve(root,'artifacts','layout',engine);await mkdir(out,{recursive:true});let checks=0;
const metrics={};
try{
  for(const [label,width,height] of [['phone',844,390],['small-phone',667,375],['portrait',390,844],['tablet',1024,768],['wide',1600,720]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.LAYOUT_URL||`http://127.0.0.1:${server.address().port}/index.html`);
    const home=await page.evaluate(()=>{const bar=document.getElementById('hint').parentElement,home=document.getElementById('home-view');return {barBottom:bar.offsetTop+bar.offsetHeight,homeTop:home.offsetTop};});
    await page.screenshot({path:resolve(out,`${baseline?'before':'after'}-${label}-home.png`)});
    if(!baseline)assert(home.barBottom<=home.homeTop+1,'SaNa guidance must be above the home content');
    await page.getByRole('button',{name:'Pop bubbles',exact:true}).click();await page.getByRole('button',{name:'Letter bubbles',exact:true}).click();
    const measure=await page.evaluate(()=>{
      const app=document.getElementById('app'),bar=document.getElementById('hint').parentElement,board=document.querySelector('.play-mat'),settings=document.getElementById('bubble-settings'),scene=document.getElementById('scene');
      const hint=getComputedStyle(document.getElementById('hint')),speed=getComputedStyle(settings.querySelector('button'));
      return {width:app.clientWidth,height:app.clientHeight,boardTop:board.offsetTop,boardBottom:board.offsetTop+board.offsetHeight,barBottom:bar.offsetTop+bar.offsetHeight,settingsBottom:settings.offsetTop+settings.offsetHeight,fieldHeight:scene.clientHeight,hintSize:parseFloat(hint.fontSize),hintWeight:Number(hint.fontWeight),hintColor:hint.color,settingSize:parseFloat(speed.fontSize),settingWeight:Number(speed.fontWeight)};
    });metrics[label]=measure;
    if(!baseline){
      assert(measure.barBottom<=measure.boardTop+1,'Hints and actions must be above the game table');
      assert(measure.settingsBottom<=measure.boardTop+1,'Speed and size must be above the game table');
      assert(measure.boardBottom>=measure.height-12,'The game table must extend to the bottom of the available frame');
      assert(measure.hintSize>=14&&measure.settingSize>=13&&measure.hintWeight>=800&&measure.settingWeight>=800,'Instructions and settings must have larger bold type');
      assert(measure.hintColor.match(/\d+/g).slice(0,3).every(n=>Number(n)<110),'Instruction text must remain dark');
      assert(measure.fieldHeight>=80,`${label} must retain playable height with the in-board controls`);
      for(const control of await page.locator('button:visible').all()){
        const rect=await control.boundingBox();assert(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,'All controls must fit the screen');
      }
    }
    await page.screenshot({path:resolve(out,`${baseline?'before':'after'}-${label}-bubbles.png`)});
    if(!baseline){
      await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Brush and paint',exact:true}).click();await page.getByRole('button',{name:'Finger paint',exact:true}).click();
      assert(await page.locator('#art-tools').evaluate(el=>el.offsetTop+el.offsetHeight<=document.querySelector('.play-mat').offsetTop+1),'Art tools must also be above the table');
      await page.screenshot({path:resolve(out,`after-${label}-art.png`)});
    }
    assert.deepEqual(errors,[]);await context.close();checks++;
  }
  await writeFile(resolve(out,baseline?'before.json':'after.json'),JSON.stringify(metrics,null,2));
  console.log(`${baseline?'BASELINE':'PASS'}: ${checks} layout sizes (${engine}); field heights ${JSON.stringify(Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,value.fieldHeight])))}`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
