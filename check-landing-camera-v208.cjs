'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),pw=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),checks=[];
const baseline=process.env.ROBOT_LANDING_BASELINE?execFileSync('git',['show','32605b0e58670441c8822fb83127ec289bd9bbdc:docs/beta/robot-machines.js']):null;
const check=(name,value)=>{assert(value,name);checks.push(name);};let browser;
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+url.pathname);assert(file.startsWith(root+path.sep));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(baseline&&url.pathname==='/beta/robot-machines.js'?baseline:fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await pw[engine].launch();
 for(const [pose,age,width,height,steps]of[['standing',4,393,852,0],['waving',5,393,852,2],['standing',5,852,393,-2],['waving',4,640,480,2]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/beta/play.html?age=${age}`);await page.locator('#more-games').click();await page.locator('[data-activity="machines"]').click();await page.locator('#robot-variant').selectOption(pose);
   const view=()=>page.locator('#robot-board').getAttribute('data-view').then(JSON.parse),state=()=>page.locator('#robot-board').getAttribute('data-assembly').then(JSON.parse);
   check('Fresh camera starts at 100%',(await view()).zoom===1);
   for(let n=0;n<Math.abs(steps);n++)await page.locator(steps<0?'#robot-zoom-out':'#robot-zoom-in').click();
   const before=await view(),part=await page.evaluate(id=>window.SaNaRobotCatalogue.poses[id].parts.find(part=>part.id==='head'),pose),button=page.getByRole('button',{name:'Head',exact:true});
   await button.locator('img').evaluate(image=>image.decode());const source=await button.locator('img').boundingBox(),sourceScale=Math.min(source.width/part.width,source.height/part.height);
   await button.click();const board=await page.locator('#robot-board').boundingBox();await page.mouse.click(board.x+board.width/2,board.y+board.height/2);
   const box=await page.locator('[data-robot-placed="head"]').boundingBox(),placed=(await state()).head;
   check('Drop retains the chosen camera',JSON.stringify(await view())===JSON.stringify(before));
   check('New selected part starts at 100%',await page.locator('#robot-zoom-level').textContent()==='100%');
   check('Drop size follows Stores times the existing camera zoom',Math.abs(box.width/(part.width*sourceScale*before.zoom)-1)<.025&&Math.abs(box.height/(part.height*sourceScale*before.zoom)-1)<.025);
   await page.mouse.click(board.x+3,board.y+3);await page.locator('#robot-zoom-level').click();
   const reset=await page.locator('[data-robot-placed="head"]').boundingBox();
   check('Returning camera to 100% restores equal Stores size',Math.abs(reset.width/(part.width*sourceScale)-1)<.025&&Math.abs(reset.height/(part.height*sourceScale)-1)<.025);
   check('Camera reset does not rebase the dropped part',(await state()).head.baseScale===placed.baseScale);
  }finally{await context.close();}
 }
 const output=path.join(__dirname,'artifacts/landing-controls-v208',engine);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'camera-results.json'),JSON.stringify({checks:checks.length,results:checks},null,2));console.log(JSON.stringify({engine,checks:checks.length,failed:0}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(async()=>{await browser?.close();server.closeAllConnections();server.close();});
