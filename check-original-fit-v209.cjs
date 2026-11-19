'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const pw=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const sharp=require('C:/Users/jeyan/Projects/DotMd/node_modules/sharp');
const {catalogue}=require('./docs/beta/robot-machines.js');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs'),out=path.join(__dirname,'artifacts/original-fit-v209',engine),results=[];
fs.mkdirSync(out,{recursive:true});
const check=(name,ok,detail)=>{results.push({name,pass:!!ok,detail});assert(ok,name+(detail?' '+JSON.stringify(detail):''));};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);assert(file.startsWith(root+path.sep));res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function originals(){
 for(const pose of Object.values(catalogue.poses)){
  const svg=fs.readFileSync(path.resolve(root,'beta',pose.reference),'utf8');
  const entries=[...svg.matchAll(/<image\b[^>]*\/>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
  check(pose.id+' full image has every part in the same order',JSON.stringify(entries.map(x=>x.id))===JSON.stringify(pose.parts.map(x=>x.id)));
  for(const part of pose.parts){
   const e=entries.find(x=>x.id===part.id),bytes=fs.readFileSync(path.resolve(root,'beta',part.asset));
   check(pose.id+'/'+part.id+' is the identical raw PNG embedded in the full image',bytes.equals(Buffer.from(e['xlink:href'].split(',')[1],'base64')));
   check(pose.id+'/'+part.id+' uses original placement and dimensions',['x','y','width','height'].every(k=>part[k]===Number(e[k])));
   const meta=await sharp(bytes).metadata();check(pose.id+'/'+part.id+' retains native size and transparency',meta.width===part.width&&meta.height===part.height&&meta.hasAlpha);
  }
 }
}
async function findSource(p,part){const b=p.getByRole('button',{name:part.name,exact:true});for(let n=0;n<12&&!await b.count();n++){if(await p.locator('#robot-next-page').isEnabled())await p.locator('#robot-next-page').click();else while(await p.locator('#robot-previous-page').isEnabled())await p.locator('#robot-previous-page').click();}await b.locator('img').evaluate(i=>i.decode());return b;}
(async()=>{
 await originals();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.MACHINES_URL||`http://127.0.0.1:${server.address().port}/beta/`,browser=await pw[engine].launch(),errors=[];
 try{
  const cases=process.env.RAW_FIT_CASES?JSON.parse(process.env.RAW_FIT_CASES):process.env.RAW_FIT_QUICK?[['standing',4,393,852]]:[['standing',4,393,852],['standing',5,480,320],['standing',4,320,568],['waving',4,1280,800],['waving',5,393,852],['waving',5,852,393],['waving',4,800,1280],['standing',5,480,320,true],['waving',4,393,852,true]];
  for(const [id,age,width,height,full=false]of cases){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),p=await context.newPage(),pose=catalogue.poses[id],name=`${id}/age${age}/${width}x${height}${full?'/fullscreen':''}`;
   p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(8000);
   try{
    await p.goto(base+'play.html?age='+age);await p.locator('#more-games').click();await p.locator('[data-activity="machines"]').click();await p.locator('#robot-variant').selectOption(id);if(full)await p.locator('#fullscreen').click();await p.locator('#robot-board[data-view]').waitFor();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    for(const part of pose.parts){
     const button=await findSource(p,part);
     const measured=await button.evaluate((b,part)=>{const im=b.querySelector('img'),r=im.getBoundingClientRect(),br=b.getBoundingClientRect(),label=b.querySelector('span').getBoundingClientRect(),svg=document.getElementById('robot-board'),m=svg.getScreenCTM(),base=Math.hypot(m.a,m.b)/JSON.parse(svg.dataset.view).zoom;return {scaleX:r.width/part.width/base,scaleY:r.height/part.height/base,widthError:Math.abs(r.width-part.width*base),heightError:Math.abs(r.height-part.height*base),inside:r.x>=br.x-.25&&r.right<=br.right+.25&&r.y>=br.y-.25&&r.bottom<=label.y+.25};},part);
     check(name+'/'+part.id+' Stores retains the original relative scale',measured.widthError<.02&&measured.heightError<.02,measured);
     check(name+'/'+part.id+' remains inside its whole-card touch target',measured.inside,measured);
     await button.click();const point=await p.locator('#robot-board').evaluate((svg,part)=>{const q=new DOMPoint(part.x+part.width/2,part.y+part.height/2).matrixTransform(svg.getScreenCTM());return{x:q.x,y:q.y};},part);await p.mouse.click(point.x,point.y);
     const at=JSON.parse(await p.locator('#robot-board').getAttribute('data-assembly'))[part.id];
     check(name+'/'+part.id+' fits its original joint at native scale',at?.fitted&&Math.abs(at.baseScale-1)<.002&&at.x===part.x&&at.y===part.y,at);
     check(name+'/'+part.id+' starts at selected-part100%',await p.locator('#robot-zoom-level').textContent()==='100%');
    }
    await p.keyboard.press('Escape');
    const images=await p.locator('[data-robot-placed]').evaluateAll(ns=>ns.map(n=>n.outerHTML));
    const embedded=images.map(s=>s.replace(/href="([^"]+)"/,(_,file)=>'href="data:image/png;base64,'+fs.readFileSync(path.resolve(root,'beta',file)).toString('base64')+'"')).join('');
    const actualSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${pose.width}" height="${pose.height}" viewBox="0 0 ${pose.width} ${pose.height}">${embedded}</svg>`;
    const actual=await sharp(Buffer.from(actualSvg)).ensureAlpha().raw().toBuffer(),expected=await sharp(path.resolve(root,'beta',pose.reference)).ensureAlpha().raw().toBuffer();
    let differentChannels=0,maxDifference=0;for(let n=0;n<actual.length;n++){const d=Math.abs(actual[n]-expected[n]);if(d){differentChannels++;maxDifference=Math.max(maxDifference,d);}}
    check(name+' all16 assembled parts reproduce the raw full image pixels',differentChannels===0,{differentChannels,maxDifference});
    await sharp(Buffer.from(actualSvg)).png().toFile(path.join(out,`${id}-${width}-assembly.png`));await p.screenshot({path:path.join(out,`${id}-${width}-room.png`)});
    const model=await p.locator('#robot-board').getAttribute('data-assembly'),source=await findSource(p,pose.parts[0]),before=await source.locator('img').boundingBox();
    await p.locator('#robot-zoom-in').click();await p.locator('#robot-zoom-in').click();const after=await source.locator('img').boundingBox();
    check(name+' camera zoom leaves Stores size and all piece geometry unchanged',Math.abs(before.width-after.width)<.1&&Math.abs(before.height-after.height)<.1&&await p.locator('#robot-board').getAttribute('data-assembly')===model);
    await p.locator('#robot-zoom-level').click();await source.click();await p.locator('#robot-part-axis').selectOption('width');await p.locator('#robot-zoom-in').click();await p.locator('#robot-rotate-right').click();await p.locator('#robot-part-flip').click();const custom=JSON.parse(await p.locator('#robot-board').getAttribute('data-assembly')).head;
    await p.locator('#robot-next-page').click();await p.locator('#robot-previous-page').click();await p.setViewportSize({width:height,height:width});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const preserved=JSON.parse(await p.locator('#robot-board').getAttribute('data-assembly')).head;check(name+' paging and rotation preserve deliberate creative geometry',JSON.stringify(preserved)===JSON.stringify(custom)&&custom.widthScale===1.25&&custom.heightScale===1&&custom.angle===45&&custom.flipX);
    console.log('PASS '+name+' all original parts and exact full-image fit');
   }finally{await context.close();}
  }
  check('No browser script errors',errors.length===0,errors);
 }finally{await browser.close();}
 console.log(JSON.stringify({engine,checks:results.length,failed:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));server.closeAllConnections();server.close();});
