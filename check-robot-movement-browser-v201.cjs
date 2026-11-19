const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),out=path.join(__dirname,'artifacts/robots-v201',engine);
fs.mkdirSync(out,{recursive:true});let browser,checks=0;
const check=(name,pass)=>{assert(pass,name);checks++;console.log('PASS '+name);};
const server=http.createServer((req,res)=>{try{const pathname=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));assert(file.startsWith(root+path.sep));res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=process.env.MACHINES_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await pw[engine].launch({headless:true});const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'play.html?age=4');await page.locator('#more-games').click();await page.locator('[data-activity="machines"]').click();
 const cdp=engine==='chromium'?await context.newCDPSession(page):null;
 const state=()=>page.locator('#robot-board').getAttribute('data-assembly').then(JSON.parse);
 async function point(x,y){return page.locator('#robot-board').evaluate((svg,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());return{x:q.x,y:q.y};},{x,y});}
 async function drag(from,to,touch=false){
  if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x:from.x,y:from.y}]});for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:7,x:from.x+(to.x-from.x)*n/8,y:from.y+(to.y-from.y)*n/8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}
 }
 for(const poseId of ['standing','waving'])for(const age of [4,5]){
  await page.locator('#robot-variant').selectOption(poseId);await page.locator(`[data-age-option="${age}"]`).click();
  const hip=await page.evaluate(id=>window.SaNaRobotCatalogue.poses[id].parts.find(p=>p.id==='hip'),poseId),center={x:hip.x+hip.width/2,y:hip.y+hip.height/2};
  await page.locator('[data-robot-part="hip"]').click();let target=await point(center.x,center.y);await page.mouse.click(target.x,target.y);
  check(`${poseId}/${age}: marked hips snap into place`,(await state()).hip.fitted);
  const away=await point(center.x+230,center.y+230);await drag(target,away);
  check(`${poseId}/${age}: fitted hips remain draggable`,!(await state()).hip.fitted&&(await state()).hip.x!==hip.x);
  check(`${poseId}/${age}: counter updates after moving away`,await page.locator('#robot-progress').textContent()==='0 / 16 fitted');
  await drag(away,target);check(`${poseId}/${age}: dragged hips snap back`,(await state()).hip.fitted&&await page.locator('[data-robot-placed]').count()===1);
  if(cdp){await drag(target,away,true);check(`${poseId}/${age}: real touch drag lifts fitted hips`,!(await state()).hip.fitted);await drag(away,target,true);check(`${poseId}/${age}: real touch drag refits the same hips`,(await state()).hip.fitted&&await page.locator('[data-robot-placed]').count()===1);}
  await page.locator('[data-robot-part="chest"]').click();const chest=await point(650,300);await page.mouse.click(chest.x,chest.y);const before=(await state()).chest.y,moved=await point(650,500);await drag(chest,moved);check(`${poseId}/${age}: loose parts also remain draggable`,Math.abs((await state()).chest.y-before-200)<8);
  await page.screenshot({path:path.join(out,`${poseId}-age${age}.png`)});
 }
 check('No script errors while moving placed parts',errors.length===0);console.log(`Robot movement browser: ${checks} checks passed (${engine}).`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
