const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.VOICE_EVIDENCE||path.resolve(__dirname,'artifacts/demo-voice',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce'});
 // Control voice-completion events to prove that a slow device cannot be cut off.
 await context.addInitScript(()=>{
  localStorage.setItem('sanaLittleHandsV1',JSON.stringify({sound:true}));
  window.__voice={lines:[],mode:'normal',active:null};
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  const synth={getVoices:()=>window.__voice.voices||[{name:'English US',lang:'en-US'},{name:'English India',lang:'en-IN'}],speak(u){
   const v=window.__voice,entry={text:u.text,rate:u.rate,lang:u.lang,voice:u.voice?.lang,start:performance.now(),hint:document.getElementById('hint').textContent};
   const hand=document.querySelector('[data-demo-hand]'),target=document.querySelector('[data-demo-target]');
   entry.fingerVisible=!!hand&&getComputedStyle(hand).visibility==='visible';
   if(hand&&target){const p=new DOMPoint(0,0).matrixTransform(hand.getScreenCTM()),b=target.getBoundingClientRect();entry.tipError=Math.hypot(p.x-b.x-b.width/2,p.y-b.y-b.height/2);}
   entry.finish=()=>{entry.end=performance.now();if(v.active?.entry===entry)v.active=null;u.onend?.();};
   v.lines.push(entry);v.active={u,entry};
   if(v.mode==='normal')entry.timer=setTimeout(entry.finish,3500);
   if(v.mode==='error')entry.timer=setTimeout(()=>{entry.error=true;v.active=null;u.onerror?.({error:'synthesis-failed'});},10);
  },cancel(){const v=window.__voice,a=v.active;if(a){clearTimeout(a.entry.timer);a.entry.cancelled=performance.now();v.active=null;a.u.onerror?.({error:'canceled'});}}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
 });
 const page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
 const advance=ms=>page.clock.runFor(ms);
 async function open(age,activity){await page.goto(base+'play.html?age='+age);await page.locator(`[data-age-option="${age}"]`).click();await page.locator(`[data-activity="${activity}"]`).click();}
 const lines=()=>page.evaluate(()=>window.__voice.lines.map(({finish,timer,...line})=>line));
 async function waitLine(fragment){for(let i=0;i<160;i++){if(await page.evaluate(fragment=>window.__voice.lines.some(l=>l.text.includes(fragment)),fragment))return true;await advance(250);}return false;}
 async function finish(){for(let i=0;i<300;i++){if(!await page.locator('[data-demo-layer]').count())return true;await advance(500);}return false;}
 async function realState(){return page.evaluate(()=>({chips:document.getElementById('item-progress-strip').innerHTML,saved:JSON.stringify({...localStorage}),view:document.getElementById('app').dataset.view}));}
 await open(2,'abacus');const before=await realState();await page.locator('#show-me').click();await advance(2200);
 let spoken=await lines();check('The first instruction is allowed to finish',spoken.length===1&&!spoken[0].cancelled&&!spoken[0].end,spoken);
 check('The voice pace is midway between original and slow, with Indian English preferred',spoken[0]?.rate>=.73&&spoken[0]?.rate<=.75&&spoken[0]?.voice==='en-IN',spoken);
 check('The finger is already pointing at the target when speech starts',spoken[0]?.fingerVisible&&spoken[0]?.tipError<1.5,spoken);
 check('SaNa keeps the complete instruction visible while speaking',(await page.locator('#hint').textContent()).includes('Pick an apple.'),spoken);
 check('No item moves while the picking instruction is spoken',await page.locator('[data-demo-moving]').count()===0);
 await page.screenshot({path:path.join(out,'first-finger-and-voice.png')});
 await finish();spoken=await lines();
 check('Every instruction finishes without being interrupted',spoken.length>=3&&spoken.every(l=>l.end&&!l.cancelled),spoken);
 check('The finger stays visible throughout all spoken steps',spoken.every(l=>l.fingerVisible),spoken);
 check('Instructions have a clear gap instead of overlapping',spoken.slice(1).every((l,i)=>l.start-spoken[i].end>=490),spoken);
 check('The demo returns the child to exactly the same progress and settings',JSON.stringify(await realState())===JSON.stringify(before));
 // Check that the demonstrated object also waits, not only the pointing hand.
 for(const fixture of [
  {age:2,game:'abacus',line:'Put it in the basket',selector:'[data-demo-moving]',attribute:'transform',expected:'translate(110 99)'},
  {age:2,game:'drag',line:'Slide it into its shadow',selector:'[data-piece]',attribute:'transform'},
  {age:3,game:'slide',line:'Slide to open',selector:'[data-cave-door]',attribute:'transform',expected:'translate(0 0) scale(1 1)'},
  {age:5,game:'abacus',line:'Slide the bead',selector:'[data-bead-row="0"][data-bead-index="9"]',attribute:'transform'},
  {age:2,game:'brush',line:'Move the finger to paint',selector:'polyline',attribute:'points',expected:null,paint:true}
 ]){
  await open(fixture.age,fixture.game);if(fixture.paint)await page.locator('#paint-mode').click();
  await page.locator('#show-me').click();
  const original=fixture.selector==='polyline'||fixture.selector==='[data-demo-moving]'?null:await page.locator('[data-demo-layer] '+fixture.selector).first().getAttribute(fixture.attribute);
  const found=await waitLine(fixture.line);
  if(found&&await page.locator('[data-demo-layer] '+fixture.selector).count()){await advance(1000);const value=await page.locator('[data-demo-layer] '+fixture.selector).first().getAttribute(fixture.attribute);check(fixture.game+' object waits for its spoken action instruction',value===(Object.hasOwn(fixture,'expected')?fixture.expected:original),{value,expected:fixture.expected??original});}
  else check('The action instruction is spoken: '+fixture.line,false,await lines());
  await page.locator('#show-me').click();
 }
 await open(3,'slide');await page.locator('#show-me').click();await finish();spoken=await lines();
 const look=spoken.find(l=>l.text==='Look!'),friend=spoken.find(l=>l.text==='You found a friend.');
 check('Short phrases have a natural half-second pause',!!look?.end&&!!friend&&friend.start-look.end>=490&&friend.start-look.end<700,spoken);
 check('Every Slide instruction and phrase finishes completely',spoken.length>=6&&spoken.every(l=>l.end&&!l.cancelled),spoken);
 for(const voices of [[{name:'English US',lang:'en-US'}],[]]){
  await open(4,'abacus');await page.evaluate(voices=>window.__voice.voices=voices,voices);await page.locator('#show-me').click();await advance(1000);spoken=await lines();
  check('A device without an Indian voice keeps its English fallback',spoken[0]?.lang==='en-US'&&spoken[0]?.rate>=.73&&spoken[0]?.rate<=.75,spoken);await page.locator('#show-me').click();
 }
 await open(4,'abacus');await page.locator('#show-me').click();
 for(let i=0;i<160;i++){if(await page.locator('[data-demo-phase="hold"]').count())break;await advance(250);}
 const holding=await page.locator('[data-demo-phase="hold"]').count();check('Successful action reaches the praise pause',holding===1);
 if(holding){await advance(2200);check('The thumbnail remains unticked while Well done is spoken',await page.locator('[data-demo-progress][data-success-index]').count()===0);for(let i=0;i<80;i++){if(await page.locator('[data-demo-progress][data-success-index]').count())break;await advance(250);}const timing=await page.evaluate(()=>({now:performance.now(),line:window.__voice.lines.find(l=>l.text.includes('Well done'))}));check('Well done finishes plus a two-second pause before the tick',!!timing.line?.end&&timing.now-timing.line.end>=1990,timing);}
 if(await page.locator('[data-demo-layer]').count())await page.locator('#show-me').click();
 for(const action of ['stop','again','games','age']){
  await open(3,'abacus');await page.locator('#show-me').click();await advance(1000);
  if(action==='stop')await page.locator('#show-me').click();
  if(action==='again')await page.locator('#again').click();
  if(action==='games')await page.locator('#game-home').click();
  if(action==='age')await page.locator('[data-age-option="4"]').click();
  await advance(30000);const history=await lines();check(action+' stops speech and prevents stale demo steps',await page.locator('[data-demo-layer],[data-demo-progress]').count()===0&&history.length===1&&!!history[0].cancelled,history);
 }
 await open(2,'abacus');await page.locator('#show-me').click();await advance(1000);await page.locator('#show-me').click();await page.locator('#show-me').click();await advance(1000);
 await page.evaluate(()=>window.__voice.lines[0].finish());await finish();spoken=await lines();
 check('A late completion from a stopped voice cannot affect a restarted demo',spoken.length===4&&!!spoken[0].cancelled&&spoken.slice(1).every(l=>l.end&&!l.cancelled),spoken);
 await open(2,'bubbles');await page.locator('#show-me').click();await advance(1000);await page.locator('#sound').click();await finish();
 spoken=await lines();check('Muting stops the voice and continues a readable text demo',spoken.length===1&&!!spoken[0].cancelled&&await page.locator('[data-demo-layer]').count()===0,spoken);
 for(const mode of ['error','never']){await open(4,'abacus');await page.evaluate(mode=>window.__voice.mode=mode,mode);await page.locator('#show-me').click();check('A '+mode+' speech engine falls back without hanging',await finish());}
 await open(3,'slide');await page.evaluate(()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});});await page.locator('#show-me').click();check('An unavailable speech engine keeps the full readable demo',await finish());
 check('No uncaught voice/demo errors',errors.length===0,errors);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Demo voice checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
