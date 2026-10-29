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
const out=resolve(root,'artifacts','abacus',engine);await mkdir(out,{recursive:true});let checks=0;
const base=process.env.ABACUS_URL||`http://127.0.0.1:${server.address().port}/docs/beta/play.html`;
const colors=['Red','Orange','Yellow','Green','Blue','Indigo','Violet','Pink','Brown','White'];
const fills=['#ff3b30','#ff9500','#ffe500','#35d44b','#2395ff','#6454d9','#bb52ed','#ff8fc7','#b5794a','#ffffff'];
async function gesture(page,row,index,fraction=1,cancel=false,direction='right'){
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const bead=page.locator(`[data-bead-row="${row}"][data-bead-index="${index}"]`);await expect(bead).toBeVisible();const from=await bead.boundingBox();assert(from,'Bead remains visible for a gesture');
  const end=await page.locator(`[${direction==='right'?'data-abacus-destination':'data-abacus-start'}="${row}"]`).evaluate(el=>{const p=new DOMPoint(Number(el.getAttribute('cx')),Number(el.getAttribute('cy'))).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y};});
  const start={x:from.x+from.width/2,y:from.y+from.height/2},to={x:start.x+(end.x-start.x)*fraction,y:start.y+(end.y-start.y)*fraction};
  const session=engine==='chromium'?await page.context().newCDPSession(page):null;
  if(session){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(to.x-start.x)*i/8,y:start.y+(to.y-start.y)*i/8,id:1}]});await session.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await session.detach();}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});if(cancel)await page.locator('#scene').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();}
}
const words=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
async function countIs(page,row,n){
  await expect(page.locator(`[data-color-label="${row}"]`)).toHaveText(`${n} ${words[n]} ${colors[row]}`);await expect(page.locator(`[data-color-label="${row}"]`)).toBeVisible();assert.equal(await page.locator('#scene').evaluate((svg,index)=>getComputedStyle(svg.querySelector(`[data-color-label="${index}"]`)).opacity,row),'1','The changing numeral and word must stay readable immediately');
  await expect(page.locator(`[data-bead-row="${row}"][data-moved="true"]`)).toHaveCount(n);await expect(page.locator(`[data-color-region="${row}"]`)).toHaveAttribute('fill',n?fills[row]:'#000');
}
try{
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.getByRole('button',{name:'Abacus colors',exact:true}).click();
  await expect(page.locator('[data-bead-row]')).toHaveCount(100);await expect(page.locator('[data-bead-row][aria-disabled="true"]')).toHaveCount(0);checks++;
  for(const region of await page.locator('[data-color-region]').all()){await expect(region).toHaveAttribute('fill','#000');await expect(region).toHaveAttribute('stroke','#90969e');}
  await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);await expect(page.locator('#rainbow-picture text,#circle-picture text')).toHaveCount(0);checks++;
  await page.evaluate(()=>{window.abacusNodes=[...document.querySelectorAll('[data-bead-row]')];});
  await gesture(page,4,5);await countIs(page,4,5);await expect(page.locator('#result-score')).toContainText('5 Five');checks++;
  await gesture(page,0,5);await countIs(page,0,5);await gesture(page,0,4);await countIs(page,0,6);await gesture(page,0,4,1,false,'left');await countIs(page,0,5);checks++;
  await gesture(page,0,0);await countIs(page,0,10);await gesture(page,0,9,1,false,'left');await countIs(page,0,0);checks++;
  assert(await page.evaluate(()=>window.abacusNodes.every((node,i)=>node===document.querySelectorAll('[data-bead-row]')[i])),'Dragging updates the existing beads instead of replacing their DOM nodes');checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await gesture(page,0,5,.2);await expect(page.locator('[data-bead-row][data-moved="true"]')).toHaveCount(0);await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);
  await gesture(page,0,5,.9,true);await expect(page.locator('[data-bead-row][data-moved="true"]')).toHaveCount(0);await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);checks++;
  // Check real pointer movement before release: neighbouring beads move with the selected group.
  const bead=page.locator('[data-bead-row="0"][data-bead-index="5"]'),from=await bead.boundingBox(),end=await page.locator('[data-abacus-destination="0"]').boundingBox();
  const transforms=await page.locator('[data-bead-row="0"]').evaluateAll(els=>els.map(el=>el.getAttribute('transform')));
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:8});
  assert(await page.locator('[data-bead-row="0"]').evaluateAll((els,old)=>els.slice(5).every((el,i)=>el.getAttribute('transform')!==old[i+5]),transforms),'The whole pushed group follows the finger before release');
  await expect(page.locator('[data-color-label="0"]')).toHaveText('5 Five Red');await page.mouse.up();await countIs(page,0,5);checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();
  // Some devices deliver the final position only on pointerup.
  const start=await page.locator('[data-bead-row="0"][data-bead-index="9"]').boundingBox(),target=await page.locator('[data-abacus-destination="0"]').boundingBox();
  await page.locator('#scene').dispatchEvent('pointerdown',{pointerId:42,button:0,clientX:start.x+start.width/2,clientY:start.y+start.height/2,pointerType:'touch'});
  await page.locator('#scene').dispatchEvent('pointerup',{pointerId:42,button:0,clientX:target.x+target.width/2,clientY:target.y+target.height/2,pointerType:'touch'});await countIs(page,0,1);checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await page.evaluate(()=>{window.abacusNodes=[...document.querySelectorAll('[data-bead-row]')];});
  for(const row of [9,2,7,0,5,1,8,4,6,3]){
    for(let n=1;n<=10;n++){await gesture(page,row,10-n);await countIs(page,row,n);}
    for(let index=0;index<10;index++){await gesture(page,row,index,1,false,'left');await countIs(page,row,9-index);}
    checks++;
  }
  assert(await page.evaluate(()=>window.abacusNodes.every((node,i)=>node===document.querySelectorAll('[data-bead-row]')[i])),'All 200 forward/backward slides retain the same bead nodes');
  await page.locator('[data-bead-row="4"][data-bead-index="5"]').focus();await page.keyboard.press('End');await countIs(page,4,5);await page.locator('[data-bead-row="4"][data-bead-index="5"]').focus();await page.keyboard.press('Home');await countIs(page,4,4);await page.locator('[data-bead-row="4"][data-bead-index="9"]').focus();await page.keyboard.press('Home');await countIs(page,4,0);checks++;
  for(let row=0;row<10;row++){await page.locator(`[data-bead-row="${row}"][data-bead-index="0"]`).focus();await page.keyboard.press('End');await countIs(page,row,10);}
  await expect(page.locator('[data-circle-region="outer"]')).toHaveAttribute('fill',fills[7]);await expect(page.locator('[data-circle-region="middle"]')).toHaveAttribute('fill',fills[9]);await expect(page.locator('[data-circle-region="inner"]')).toHaveAttribute('fill',fills[8]);await expect(page.locator('#art-reward')).toBeVisible();await page.screenshot({path:resolve(out,'free-counting-ten.png')});checks++;
  await gesture(page,2,9,1,false,'left');await countIs(page,2,0);await expect(page.locator('#art-reward')).toBeHidden();checks++;
  for(const [name,width,height,row] of [['phone',844,390,9],['small-phone',667,375,4],['portrait',390,844,7],['tablet',1024,768,3],['wide',1600,720,8]]){
    await page.setViewportSize({width,height});await page.getByRole('button',{name:'Again',exact:true}).click();await gesture(page,row,5);await countIs(page,row,5);
    for(const selector of ['#abacus-frame','#rainbow-picture','#circle-picture',`[data-color-label="${row}"]`]){const box=await page.locator(selector).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Abacus, drawings and count labels fit the screen');}
    await page.screenshot({path:resolve(out,`${name}-free-counting.png`)});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await countIs(page,row,5);await gesture(page,row,0);await countIs(page,row,10);await gesture(page,row,9,1,false,'left');await countIs(page,row,0);await page.screenshot({path:resolve(out,`${name}-free-fullscreen.png`)});await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await countIs(page,row,0);checks++;
  }
  await page.getByRole('button',{name:'Again',exact:true}).click();await expect(page.locator('[data-color-label]:visible')).toHaveCount(0);await expect(page.locator('[data-bead-row][data-moved="true"]')).toHaveCount(0);checks++;
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} free abacus counting, grouping and response checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
