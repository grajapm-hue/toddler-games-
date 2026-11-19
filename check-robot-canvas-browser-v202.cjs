const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),out=path.join(__dirname,'artifacts/robots-canvas-v202',engine);
fs.mkdirSync(out,{recursive:true});let browser,page,checks=0,partCases=0;const errors=[];
const check=(name,pass)=>{assert(pass,name);checks++;};
const server=http.createServer((req,res)=>{try{const pathname=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));assert(file.startsWith(root+path.sep));res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
class RobotRoom{
 constructor(p,cdp){this.page=p;this.cdp=cdp;}
 async state(){return JSON.parse(await this.page.locator('#robot-board').getAttribute('data-assembly'));}
 async settled(){await this.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
 async frame(){return this.page.locator('#robot-board').evaluate(svg=>{const rect=svg.getBoundingClientRect(),m=svg.getScreenCTM(),inv=m.inverse(),a=new DOMPoint(rect.left,rect.top).matrixTransform(inv),b=new DOMPoint(rect.right,rect.bottom).matrixTransform(inv);return{x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y,scale:m.a};});}
 async screen(x,y){return this.page.locator('#robot-board').evaluate((svg,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());return{x:q.x,y:q.y};},{x,y});}
 async source(part){const button=this.page.getByRole('button',{name:part.name,exact:true});for(let n=0;n<12&&!await button.count();n++){if(await this.page.getByRole('button',{name:'Next',exact:true}).isEnabled())await this.page.getByRole('button',{name:'Next',exact:true}).click();else while(await this.page.getByRole('button',{name:'Previous',exact:true}).isEnabled())await this.page.getByRole('button',{name:'Previous',exact:true}).click();}const r=await button.boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,u:.5,v:.5};}
 async grab(part){
  return this.page.evaluate(async part=>{
   window.robotAuditPixels??={};let pixels=window.robotAuditPixels[part.asset];
   if(!pixels){const image=new Image();image.src=part.asset;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;pixels=[];for(let y=1;y<c.height;y+=3)for(let x=1;x<c.width;x+=3)if(data[(y*c.width+x)*4+3]>160)pixels.push({u:x/c.width,v:y/c.height,d:Math.hypot(x/c.width-.5,y/c.height-.5)});pixels.sort((a,b)=>a.d-b.d);window.robotAuditPixels[part.asset]=pixels;}
   const svg=document.getElementById('robot-board'),at=JSON.parse(svg.dataset.assembly)[part.id],matrix=svg.getScreenCTM();
   for(const p of pixels){const q=new DOMPoint(at.x+p.u*part.width,at.y+p.v*part.height).matrixTransform(matrix);if(document.elementFromPoint(q.x,q.y)?.closest('[data-robot-placed]')?.dataset.robotPlaced===part.id)return{x:q.x,y:q.y,u:p.u,v:p.v};}
   return null;
  },part);
 }
 async movePart(part,x,y,fromStore=false){
  const start=fromStore?await this.source(part):await this.grab(part);assert(start,`${part.id}: a visible cutout area must remain selectable`);
  const end=await this.screen(x+start.u*part.width,y+start.v*part.height);
  if(this.cdp){await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,x:start.x,y:start.y}]});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:3,x:end.x,y:end.y}]});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await this.page.mouse.move(start.x,start.y);await this.page.mouse.down();await this.page.mouse.move(end.x,end.y,{steps:2});await this.page.mouse.up();}
 }
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=process.env.MACHINES_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await pw[engine].launch({headless:true});const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,serviceWorkers:'block',acceptDownloads:true});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.tracing.start({screenshots:true,snapshots:true});await page.goto(base+'play.html?age=4');await page.locator('#more-games').click();await page.locator('[data-activity="machines"]').click();
 const room=new RobotRoom(page,engine==='chromium'?await context.newCDPSession(page):null),layouts=process.env.CANVAS_QUICK?[['portrait',393,852]]:[['portrait',393,852],['landscape',852,393],['tablet',1280,800]];
 for(const [layout,width,height]of layouts)for(const immersive of [false,true]){
  await page.setViewportSize({width,height});if(immersive)await page.locator('#fullscreen').click();await room.settled();
  for(const poseId of ['standing','waving'])for(const age of [4,5]){
   await page.locator('#robot-variant').selectOption(poseId);if(immersive)await page.locator('#exit-play').click();await page.locator(`[data-age-option="${age}"]`).click();if(immersive)await page.locator('#fullscreen').click();await room.settled();
   const pose=await page.evaluate(id=>window.SaNaRobotCatalogue.poses[id],poseId),frame=await room.frame(),margin=5/frame.scale;
   const parts=[...pose.parts].sort((a,b)=>['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'].indexOf(a.id)-['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'].indexOf(b.id));
   for(const part of parts){
    const label=`${layout}/${immersive?'full':'normal'}/${poseId}/${age}/${part.id}`;
    for(const [i,[hx,vy]]of [[0,0],[1,0],[1,1],[0,1]].entries()){
     const x=frame.x+margin+hx*(frame.width-part.width-2*margin),y=frame.y+margin+vy*(frame.height-part.height-2*margin);await room.movePart(part,x,y,i===0);const at=(await room.state())[part.id];
     check(`${label}: reaches visible corner ${i+1}`,at&&Math.abs(at.x-x)*frame.scale<3&&Math.abs(at.y-y)*frame.scale<3);
     check(`${label}: remains fully inside canvas`,at.x>=frame.x-.01&&at.y>=frame.y-.01&&at.x+part.width<=frame.x+frame.width+.01&&at.y+part.height<=frame.y+frame.height+.01);
    }
    await room.movePart(part,part.x,part.y);check(`${label}: fits back after crossing canvas`,(await room.state())[part.id].fitted);
    await room.movePart(part,frame.x+margin,frame.y+margin);check(`${label}: fitted part can move again`,!(await room.state())[part.id].fitted&&await page.locator('#robot-progress').textContent()==='0 / 16 fitted');
    await room.movePart(part,part.x,part.y);check(`${label}: refits without duplication`,(await room.state())[part.id].fitted&&Object.keys(await room.state()).length===1);
    await page.getByRole('button',{name:'Remove',exact:true}).click();partCases++;
   }
   for(const part of parts)await room.movePart(part,part.x,part.y,true);
   check(`${layout}/${immersive}/${poseId}/${age}: all 16 complete`,await page.locator('#robot-progress').textContent()==='16 / 16 fitted'&&!await page.getByRole('button',{name:'Done',exact:true}).isDisabled());
   for(const part of parts){await room.movePart(part,frame.x+margin,frame.y+margin);check(`${part.id}: movable within the complete assembly`,await page.locator('#robot-progress').textContent()==='15 / 16 fitted');await room.movePart(part,part.x,part.y);check(`${part.id}: complete assembly restores correctly`,await page.locator('#robot-progress').textContent()==='16 / 16 fitted');}
   await page.screenshot({path:path.join(out,`${layout}-${immersive?'full':'normal'}-${poseId}-age${age}.png`)});
   const head=parts.find(p=>p.id==='head');await room.movePart(head,frame.x+margin,frame.y+margin);await page.setViewportSize({width:height,height:width});await room.settled();const rotated=await room.frame(),at=(await room.state()).head;
   check('Rotation retains loose part within the whole canvas',at.x>=rotated.x-.01&&at.y>=rotated.y-.01&&at.x+head.width<=rotated.x+rotated.width+.01&&at.y+head.height<=rotated.y+rotated.height+.01);
   await room.movePart(head,head.x,head.y);check('Rotation preserves and restores completion',await page.locator('#robot-progress').textContent()==='16 / 16 fitted');await page.setViewportSize({width,height});await room.settled();
   console.log(`PASS ${layout}/${immersive?'fullscreen':'normal'}/${poseId}/age${age}: all 16 parts and full assembly`);
  }
  if(immersive)await page.locator('#exit-play').click();
 }
 check('No script errors throughout full-canvas audit',errors.length===0);await context.tracing.stop({path:path.join(out,'trace.zip')});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,partCases,checks,errors},null,2));console.log(JSON.stringify({engine,partCases,checks,errors}));
})().catch(async e=>{console.error(e);if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
