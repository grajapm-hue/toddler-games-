import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=import.meta.dirname;
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',out=resolve(root,'artifacts','mobile-frame',engine);await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=process.env.MOBILE_URL||`http://127.0.0.1:${server.address().port}/docs/beta/`;
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});let checks=0;const failures=[];
async function check(name,run){try{await run();checks++;console.log('PASS: '+name);}catch(error){failures.push(name+': '+error.message);console.log('FAIL: '+name+': '+error.message);}}
async function pinch(page){const session=await page.context().newCDPSession(page);const points=distance=>[{id:1,x:195-distance,y:330-distance},{id:2,x:195+distance,y:330+distance}];await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(35)});for(const distance of [45,60,80,100,125])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(distance)});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
async function fits(page,selector,width,height){const box=await page.locator(selector).boundingBox();assert(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,selector+' stays on screen: '+JSON.stringify(box));}
try{
 if(engine==='chromium')await check('Touch pinch cannot enlarge or move the welcome',async()=>{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Linux; Android 14; moto g45 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}),page=await context.newPage();
  try{await page.goto(new URL('index.html',base).href);await page.locator('#play').waitFor();const before=await page.locator('#frame').boundingBox();await pinch(page);await expect.poll(()=>page.evaluate(()=>visualViewport.scale)).toBe(1);assert.deepEqual(await page.locator('#frame').boundingBox(),before);
   const session=await context.newCDPSession(page);for(let tap=0;tap<2;tap++){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:195,y:330}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:195,y:330}]});for(const y of [310,280,240,200])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:195,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await expect.poll(()=>page.evaluate(()=>visualViewport.scale)).toBe(1);assert.deepEqual(await page.locator('#frame').boundingBox(),before);assert.equal(await page.locator('#frame').evaluate(el=>el.scrollTop),0);await page.screenshot({path:resolve(out,'welcome-after-pinch.png')});}finally{await context.close();}
 });
 for(const [width,height] of [[393,852],[852,393],[320,568],[1024,768]])await check(`Age menu follows game orientation and changes profile ${width}x${height}`,async()=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),page=await context.newPage();
  page.setDefaultTimeout(5000);
  try{await page.goto(new URL('index.html',base).href);await page.getByRole('button',{name:'Age 2 starting set',exact:true}).click();await fits(page,'#play',width,height);await fits(page,'#about',width,height);assert(await page.locator('#frame').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Welcome needs no scrolling');await page.screenshot({path:resolve(out,`${width}x${height}-welcome.png`)});await page.getByRole('link',{name:'Tap to play',exact:true}).click();
   const trigger=page.getByRole('button',{name:'Choose starting age',exact:true});await trigger.click();const menu=page.getByRole('listbox',{name:'Starting age',exact:true});await expect(menu).toBeVisible();await fits(page,'#age-menu',width,height);
   assert(await menu.evaluate(el=>el.closest('#app')!==null),'Age popup rotates with the actual game frame');
   const orientation=await menu.getByRole('option',{name:'Age 5',exact:true}).evaluate(el=>{const q=el.getBoxQuads?.()[0];return q?{dx:q.p2.x-q.p1.x,dy:q.p2.y-q.p1.y}:null;});if(orientation)assert(width<height?Math.abs(orientation.dy)>Math.abs(orientation.dx):Math.abs(orientation.dx)>Math.abs(orientation.dy),'Popup text follows landscape game');
   await page.screenshot({path:resolve(out,`${width}x${height}-age-menu.png`)});await menu.getByRole('option',{name:'Age 5',exact:true}).click();await expect(menu).toBeHidden();await expect(trigger).toHaveText('Age 5');
   await page.getByRole('button',{name:'Drag shapes',exact:true}).click();await expect(page.locator('[data-piece]')).toHaveCount(4);await page.getByRole('button',{name:'Games',exact:true}).click();await trigger.click();await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
   await trigger.click();await page.locator('.welcome h1').click();await expect(menu).toBeHidden();
   await trigger.focus();await page.keyboard.press('ArrowDown');await expect(menu).toBeVisible();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(trigger).toHaveText('Age 2');await expect(menu).toBeHidden();
  }finally{await context.close();}
 });
 if(failures.length)throw new Error(failures.join('\n'));console.log(`PASS: ${checks} stationary mobile frame and landscape age menu checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
