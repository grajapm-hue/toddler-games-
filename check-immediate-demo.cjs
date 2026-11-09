// Demo starts at once, holds contact for one second, and clears its finger before a brief result.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs'),engine=process.env.PLAYROOM_BROWSER||'chromium',out=process.env.IMMEDIATE_EVIDENCE||path.join(__dirname,'artifacts/immediate-demo',engine),results=[],errors=[];let browser;
fs.mkdirSync(out,{recursive:true});const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name,JSON.stringify(detail));};
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function observe(page){await page.evaluate(()=>{
 window.__demoProbe={contacts:[],doors:[]};let previous,touched,initial;
 const key=e=>['transform','opacity','visibility'].map(a=>e?.getAttribute(a)).join('|')+'|'+(document.querySelector('[data-demo-layer] polyline')?.getAttribute('points')||'');
 const observer=new MutationObserver(()=>{
  const p=window.__demoProbe,layer=document.querySelector('[data-demo-layer]'),current=layer||previous,hand=current?.querySelector('[data-demo-hand]');
  if(!current)return;
  if(!p.first&&hand&&getComputedStyle(hand).visibility==='visible'&&layer){p.first=performance.now();const target=layer.querySelector('[data-demo-target]'),b=target.getBoundingClientRect(),tip=new DOMPoint(0,0).matrixTransform(hand.getScreenCTM()),h=hand.getBoundingClientRect();p.aim={error:Math.hypot(tip.x-b.x-b.width/2,tip.y-b.y-b.height/2),hand:Math.max(h.width,h.height)};touched=target.closest('[data-piece],[data-count-fruit],[data-count-choice] text,[data-bead-row],[data-cave-door],[data-bubble],[data-dirt]')||target;initial=key(touched);}
  const holding=layer?.dataset.demoContact==='holding',contact=p.contacts.at(-1);
  if(holding&&(!contact||contact.end))p.contacts.push({start:performance.now()});
  else if(!holding&&contact&&!contact.end)contact.end=performance.now();
  if(p.first&&!p.action&&touched&&key(touched)!==initial)p.action=performance.now();
  if(layer?.dataset.demoDoorState&&!p.doors.includes(layer.dataset.demoDoorState))p.doors.push(layer.dataset.demoDoorState);
  if(current.dataset.demoPhase==='success'&&!p.success){p.success=performance.now();p.successFingerVisible=!!hand&&getComputedStyle(hand).visibility==='visible';p.tick=document.querySelector('[data-demo-progress] .is-demo-done')?.textContent;}
  if(previous&&!layer&&!p.end){p.end=performance.now();observer.disconnect();}
  previous=current;
 });observer.observe(document.querySelector('.play-mat'),{subtree:true,childList:true,attributes:true});
 const button=document.getElementById('show-me');button.addEventListener('click',()=>window.__demoProbe.tap=performance.now(),{once:true,capture:true});
 });}
async function snapshot(page){return page.evaluate(()=>({scene:document.getElementById('app').dataset.view==='bubbles'?[]:[...document.querySelector('#scene').children].filter(n=>!n.hasAttribute('data-demo-layer')).map(n=>n.outerHTML.replace(/ style=""/g,'').replace(/ style="[^"]*visibility: hidden;?[^"]*"/g,'')),chips:document.getElementById('item-progress-strip').innerHTML,saved:JSON.stringify({...localStorage}),view:document.getElementById('app').dataset.view}));}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{
  window.__voice={mode:'muted',lines:[],active:null};window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'en-IN',name:'Indian English'}],speak(u){const v=window.__voice,line={text:u.text,start:performance.now(),rate:u.rate,lang:u.lang};v.lines.push(line);v.active={u,line};if(v.mode==='slow')line.timer=setTimeout(()=>{line.end=performance.now();u.onend?.();},8000);if(v.mode==='error')line.timer=setTimeout(()=>u.onerror?.({error:'failed'}),10);},cancel(){const v=window.__voice;if(v.active){clearTimeout(v.active.line.timer);v.active.line.cancelled=performance.now();v.active=null;}}}});
 });
 async function open(age,game,full=false,mode='muted'){
  await page.goto(base+'play.html?age='+age);await page.locator(`[data-activity="${game==='paint'?'brush':game}"]`).click();await page.locator(`[data-age-option="${age}"]`).click();if(game==='paint')await page.locator('#paint-mode').click();await page.locator('#scene[data-art-state="ready"]').waitFor();
  await page.evaluate(mode=>{window.__voice.mode=mode;if(mode==='missing')Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});},mode);const sound=await page.locator('#sound').getAttribute('aria-pressed');if((sound==='true')!==(mode!=='muted'))await page.locator('#sound').click();if(full){await page.locator('#fullscreen').click();await page.clock.runFor(100);}await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+50)));
 }
 async function demo(age,game,full,mode){
  await open(age,game,full,mode);const label=`Age ${age}/${game}/${full?'full':'normal'}/${mode}`,before=await snapshot(page);await observe(page);
  // The fullscreen toolbar is hidden by design; exercise its event for SVG geometry.
  if(full)await page.locator('#show-me').evaluate(el=>el.click());else await page.locator('#show-me').click();await page.clock.runFor(50);const first=await page.evaluate(()=>window.__demoProbe);check(label+' shows the pointing finger immediately',first.first-first.tap<=50&&first.first>=first.tap&&first.aim?.error<2,first);
  if(!process.env.IMMEDIATE_RED&&age===2&&game==='bubbles'&&!full&&mode==='muted')await page.screenshot({path:path.join(out,'bubble-finger-immediate.png')});
  for(let i=0;i<70;i++){if(await page.evaluate(()=>!!window.__demoProbe.end))break;await page.clock.runFor(150);}
  const p=await page.evaluate(()=>window.__demoProbe);check(label+' holds each object for one second',p.contacts.length>0&&p.contacts.every(c=>c.end-c.start>=995&&c.end-c.start<=1010),p);
  check(label+' acts immediately after the one-second contact',p.action-p.first>=995&&p.action-p.first<=1020,p);
  check(label+' clears the finger at success and shows the result for one second',p.success&&p.end-p.success>=995&&p.end-p.success<=1020&&p.successFingerVisible===false,p);
  const budget=game==='slide'?3720:['drag','abacus'].includes(game)&&!(age===4&&game==='abacus')?1870:['bubbles','abacus'].includes(game)?1020:5000;
  check(label+' finishes after its result without narration waits',p.end-p.first<=budget+1000,p);
  check(label+' returns to the unchanged real round',await page.locator('[data-demo-layer],[data-demo-progress]').count()===0&&JSON.stringify(await snapshot(page))===JSON.stringify(before),p);
  if(game==='slide')check(label+' still demonstrates both door directions',p.doors.includes('open')&&p.doors.includes('closed'),p);
 }
 if(process.env.IMMEDIATE_RED)await demo(2,'bubbles',false,'muted');
 else{
  for(const age of [2,3,4,5])for(const game of ['drag','bubbles','slide','brush','paint','abacus'])for(const full of [false,true])await demo(age,game,full,'muted');
  for(const mode of ['slow','error','never','missing'])for(const [age,game] of [[2,'drag'],[2,'abacus'],[3,'abacus'],[4,'abacus'],[5,'abacus'],[2,'bubbles'],[3,'slide'],[2,'brush'],[2,'paint']])await demo(age,game,false,mode);
  for(const action of ['stop','again','games','age'])for(const phase of ['contact','moving']){
   await open(2,'abacus',false,'never');await page.locator('#show-me').click();await page.clock.runFor(phase==='contact'?400:1200);
   if(action==='stop')await page.locator('#show-me').click();if(action==='again')await page.locator('#again').click();if(action==='games')await page.locator('#game-home').click();if(action==='age')await page.locator('[data-age-option="3"]').click();await page.clock.runFor(20000);check(action+'/'+phase+' cancels the finger, voice and stale actions',await page.locator('[data-demo-layer],[data-demo-progress]').count()===0&&!await page.locator('#scene > [style*="visibility: hidden"]').count());
  }
  const native=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'no-preference'}),real=await native.newPage();real.on('pageerror',e=>errors.push(e.message));
  for(const game of ['bubbles','drag']){await real.goto(base+'play.html?age=2');await real.locator(`[data-activity="${game}"]`).click();await real.locator('[data-age-option="2"]').click();await real.locator('#scene[data-art-state="ready"]').waitFor();if(await real.locator('#sound').getAttribute('aria-pressed')==='true')await real.locator('#sound').click();await observe(real);await real.locator('#show-me').click();await real.waitForFunction(()=>window.__demoProbe.end,{},{timeout:5000});const p=await real.evaluate(()=>window.__demoProbe);check('Native '+game+' acts after one second and displays the result without a finger',p.first-p.tap<150&&p.action-p.first>=990&&p.action-p.first<1200&&p.end-p.success>=990&&p.end-p.success<1200&&!p.successFingerVisible,p);await real.screenshot({path:path.join(out,'native-'+game+'-returned-to-play.png')});}await native.close();
 }
 check('No uncaught Demo errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));console.log(JSON.stringify({checks:results.length,failed:results.filter(r=>!r.pass).length}));assert(results.every(r=>r.pass),'Immediate Demo checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
