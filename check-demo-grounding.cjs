// Rendered space recovery, real pointer collection, and measured Demo contact timing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createServer}=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',out=process.env.GROUND_EVIDENCE||path.join(__dirname,'artifacts/demo-grounding',engine),root=path.join(__dirname,'docs');
fs.mkdirSync(out,{recursive:true});const results=[],errors=[],old=new Map();let browser;
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name,JSON.stringify(detail));};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),baseline=u.pathname.startsWith('/baseline/'),name=u.pathname.replace(/^\/baseline/,'');const f=path.resolve(root,'.'+name);if(!f.startsWith(root+path.sep))throw Error('path');let body;if(baseline){if(!old.has(name))old.set(name,execFileSync('git',['show','aa7e50b278da9f1a02ab60196d4adc10df0df001:docs'+name],{cwd:__dirname,maxBuffer:20000000}));body=old.get(name);}else body=fs.readFileSync(f);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}/`,base=process.env.COUNT_URL||local+'beta/';
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 async function open(age,game,url=base){await page.goto(url+'play.html?age='+age);await page.locator(`[data-age-option="${age}"]`).click();await page.locator(`[data-activity="${game}"]`).click();await page.locator('#scene[data-art-state="ready"]').waitFor();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));}
 async function layout(){return page.evaluate(()=>{const s=document.getElementById('scene').getBoundingClientRect(),t=document.querySelector('.play-toolbar'),hidden=['brush-modes','paint-tools','art-tools'].map(id=>{const e=document.getElementById(id);return{id,hidden:e.hidden,display:getComputedStyle(e).display,box:e.getBoundingClientRect().toJSON()};});return{scene:s.toJSON(),toolbar:t.getBoundingClientRect().toJSON(),hidden};});}
 for(const [width,height] of [[844,390],[390,844],[1024,768]]){
  await page.setViewportSize({width,height});
  for(const [age,game] of [[2,'drag'],[3,'slide'],[2,'bubbles'],[2,'abacus'],[3,'abacus'],[4,'abacus'],[5,'abacus']]){
   let before;if(!process.env.COUNT_URL){await open(age,game,local+'baseline/beta/');before=await layout();}
   await open(age,game);const after=await layout();
   check(`${width} age ${age}/${game} has no art-control trace`,after.toolbar.height===0&&after.hidden.every(v=>v.display==='none'&&v.box.height===0),after);
   if(before)check(`${width} age ${age}/${game} reclaims unused normal space`,after.scene.height>=before.scene.height&&after.scene.height>0,{before:before.scene.height,after:after.scene.height,gain:after.scene.height-before.scene.height});
  }
  await open(3,'brush');check(`${width} Brush retains its own mode controls`,await page.locator('#brush-modes').isVisible()&&await page.locator('#clean-mode').isVisible());await page.locator('#paint-mode').click();check(`${width} Paint retains its palette`,await page.locator('#paint-tools').isVisible());
 }
 // Inspect alpha bounds of the actual artwork, not the SVG viewport padding.
 async function visibleBounds(selector){return page.locator(selector).evaluate(async el=>{
  const img=new Image();img.src=el.getAttribute('href');await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;let minX=canvas.width,minY=canvas.height,maxX=0,maxY=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(rgba[(y*canvas.width+x)*4+3]>32){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const b=el.getBBox(),scale=Math.min(b.width/canvas.width,b.height/canvas.height),x=b.x+(b.width-canvas.width*scale)/2,y=b.y+(b.height-canvas.height*scale)/2,m=document.getElementById('scene').getScreenCTM().inverse().multiply(el.getScreenCTM());const points=[[minX,minY],[maxX,minY],[minX,maxY],[maxX,maxY]].map(([px,py])=>new DOMPoint(x+px*scale,y+py*scale).matrixTransform(m));return{left:Math.min(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))};
 });}
 for(const [width,height] of [[844,390],[390,844],[1024,768]])for(const full of [false,true]){
  await page.setViewportSize({width,height});await open(3,'abacus');if(full){await page.locator('#fullscreen').click();await page.clock.runFor(250);}
  const rabbit=await visibleBounds('image[href="count-art/rabbit.webp"]'),garden=await visibleBounds('image[href="count-art/carrot-garden.webp"]');
  const ground=await page.locator('[data-count-ground]').evaluate(el=>[...el.children].map(e=>{const p=new DOMPoint(+e.getAttribute('cx'),+e.getAttribute('cy'));return{x:p.x,y:p.y};}));
  check(`${width}/${full?'full':'normal'} feet and soil touch their ground shadows`,Math.abs(rabbit.bottom-ground[1].y)<4&&Math.abs(garden.bottom-ground[0].y)<4,{rabbit,garden,ground});
  if(width!==390)await page.screenshot({path:path.join(out,`rabbit-${width}-${full?'full':'normal'}.png`)});
  for(let n=1;n<=10;n++){
   const from=await page.locator('[data-count-fruit]').last().evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});
   const to=await page.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});
   await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();await page.clock.runFor(450);
   check(`${width}/${full?'full':'normal'} carrot ${n} collects using a real drag`,await page.locator('[data-count-collected]').count()===n);
   if(n===1){await page.clock.runFor(750);check(`${width}/${full?'full':'normal'} preserves the 1.5-second count pause`,await page.locator('#item-progress-strip .is-done').count()===0);await page.clock.runFor(400);}else if(n<10)await page.clock.runFor(1150);
  }
  const boxes=[];for(let i=0;i<10;i++)boxes.push(await visibleBounds(`[data-count-collected="${i}"] image`));
  const ledger=await page.locator('[data-count-ledger]').evaluate(el=>el.getBBox().y);
  check(`${width}/${full?'full':'normal'} all ten carrots fit on grass above the ledger`,boxes.every(b=>b.bottom<ledger&&b.left>=10&&b.right<=990),{boxes,ledger});
  check(`${width}/${full?'full':'normal'} carrots do not overlap each other`,boxes.every((a,i)=>boxes.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)),boxes);
  if(width!==390)await page.screenshot({path:path.join(out,`rabbit-ten-${width}-${full?'full':'normal'}.png`)});
 }
 await page.setViewportSize({width:1024,height:768});
 for(const voiced of [false,true])for(const [age,game] of [[2,'drag'],[2,'abacus'],[3,'abacus'],[4,'abacus'],[5,'abacus'],[2,'bubbles'],[3,'slide'],[2,'brush']]){
  await open(age,game);
  await page.evaluate(voiced=>{
   // A slow three-second voice makes accidental extra contact waits visible.
   if(voiced){window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};let current;Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],speak(u){current=setTimeout(()=>u.onend?.(),3000);},cancel(){clearTimeout(current);}}});}
   window.__contact=[];let touched,initial;const key=e=>['transform','opacity','visibility'].map(a=>e.getAttribute(a)).join('|');new MutationObserver(()=>{const layer=document.querySelector('[data-demo-layer]'),hand=layer?.querySelector('[data-demo-hand]');if(!layer)return;const last=window.__contact.at(-1),holding=layer.dataset.demoContact==='holding';if(holding&&!last){const target=layer.querySelector('[data-demo-target]'),p=new DOMPoint(0,0).matrixTransform(hand.getScreenCTM()),b=target.getBoundingClientRect();touched=target.closest('[data-piece],[data-count-fruit],[data-count-choice] text,[data-bead-row],[data-cave-door],[data-bubble],[data-dirt]');initial=touched&&key(touched);window.__contact.push({start:performance.now(),error:Math.hypot(p.x-b.x-b.width/2,p.y-b.y-b.height/2),visible:getComputedStyle(hand).visibility});}else if(last){if(!holding&&!last.end)last.end=performance.now();if(touched&&!last.action&&key(touched)!==initial)last.action=performance.now();}}).observe(document.getElementById('scene'),{subtree:true,attributes:true});
  },voiced);
  const pressed=await page.locator('#sound').getAttribute('aria-pressed');if((pressed==='true')!==voiced)await page.locator('#sound').click();
  const before=await page.locator('#item-progress-strip').innerHTML();await page.locator('#show-me').click();check(`${age}/${game}/${voiced} Demo still starts with a tap`,await page.locator('[data-demo-layer]').count()===1);
  for(let i=0;i<100;i++){if(await page.evaluate(()=>window.__contact[0]?.end))break;await page.clock.runFor(150);}
  await page.clock.runFor(400);const contact=await page.evaluate(()=>window.__contact[0]);check(`${age}/${game}/${voiced} visible contact holds exactly one second`,contact&&contact.end-contact.start>=995&&contact.end-contact.start<=1010&&contact.visible==='visible'&&contact.error<2,contact);
  check(`${age}/${game}/${voiced} action begins immediately after contact`,contact&&contact.action-contact.start>=995&&contact.action-contact.start<=(game==='brush'?1250:1020),contact);
  if(age===3&&game==='abacus'&&!voiced)await page.screenshot({path:path.join(out,'rabbit-demo-moving.png')});
  if(await page.locator('[data-demo-layer]').count())await page.locator('#show-me').click();await page.clock.runFor(18000);check(`${age}/${game}/${voiced} completion or stopping restores the real round`,await page.locator('[data-demo-layer]').count()===0&&await page.locator('#item-progress-strip').innerHTML()===before);
 }
 const native=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'}),real=await native.newPage();real.on('pageerror',e=>errors.push(e.message));await real.goto(base+'play.html?age=4');await real.locator('[data-age-option="4"]').click();await real.locator('[data-activity="abacus"]').click();await real.locator('#scene[data-art-state="ready"]').waitFor();if(await real.locator('#sound').getAttribute('aria-pressed')==='true')await real.locator('#sound').click();
 await real.evaluate(()=>{window.__nativeContact={};let previous;new MutationObserver(()=>{const layer=document.querySelector('[data-demo-layer]');if(layer?.dataset.demoContact==='holding'&&!window.__nativeContact.start)window.__nativeContact.start=performance.now();if(window.__nativeContact.start&&layer?.dataset.demoContact!=='holding'&&!window.__nativeContact.action)window.__nativeContact.action=performance.now();if(previous&&!layer)window.__nativeContact.end=performance.now();previous=layer;}).observe(document.getElementById('scene'),{subtree:true,attributes:true,childList:true});});await real.locator('#show-me').click();await real.waitForFunction(()=>window.__nativeContact.end);const nativeTiming=await real.evaluate(()=>window.__nativeContact);check('Real-time animation acts after a one-second finger hold',nativeTiming.action-nativeTiming.start>=990&&nativeTiming.action-nativeTiming.start<1200,nativeTiming);await real.screenshot({path:path.join(out,'train-demo-one-second.png')});await native.close();
 check('No uncaught errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));console.log(JSON.stringify({checks:results.length,failed:results.filter(v=>!v.pass).length}));assert(results.every(v=>v.pass),'Demo/grounding checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
