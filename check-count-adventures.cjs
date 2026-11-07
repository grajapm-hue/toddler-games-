// Run the published Beta, not the older prototype/build inputs.
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFileSync, mkdirSync, writeFileSync} = require('node:fs');
const {resolve, extname, sep} = require('node:path');
const {chromium, webkit} = require(process.env.MM_PLAYWRIGHT || '@playwright/test');
const engine = process.env.PLAYROOM_BROWSER || 'chromium';
const root = resolve(__dirname, 'docs');
const output = process.env.COUNT_EVIDENCE || resolve(__dirname, 'artifacts/count-adventures', engine);
mkdirSync(output, {recursive:true});
const results = [], errors = [];
const check = (name, pass, detail) => { results.push({name, pass:!!pass, detail}); console.log((pass?'PASS ':'FAIL ') + name); };
const server = createServer((req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = resolve(root, '.' + pathname + (pathname.endsWith('/')?'index.html':''));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    res.writeHead(200, {'Content-Type':({'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.webmanifest':'application/manifest+json'})[extname(file)] || 'application/octet-stream'}).end(readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
let browser;
(async () => {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = process.env.COUNT_URL || `http://127.0.0.1:${server.address().port}/beta/`;
  browser = await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
  const context = await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce'});
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  async function open(age) {
    await page.goto(base+'play.html?age='+age);
    await page.locator(`[data-age-option="${age}"]`).click();
    await page.locator('[data-activity="abacus"]').click();
  }
  async function state() {
    return page.evaluate(() => ({text:document.getElementById('scene').textContent,
      chips:[...document.querySelectorAll('#item-progress-strip .item-chip')].map(el=>({label:el.getAttribute('aria-label'),done:el.classList.contains('is-done'),current:el.classList.contains('is-current')})),
      praise:document.querySelector('[data-count-praise]')?.textContent || '',
      sources:[...document.querySelectorAll('[data-count-fruit]')].map(el=>el.dataset.countFruit),
      collected:document.querySelectorAll('[data-count-collected]').length,
      hint:document.getElementById('hint').textContent,
      demoDisabled:document.getElementById('show-me').disabled}));
  }
  async function drag(age, options={}) {
    const source = page.locator('[data-count-fruit]').last();
    const id = await source.getAttribute('data-count-fruit');
    const from = await source.evaluate(el => { const p=el.ownerSVGElement.createSVGPoint();p.x=0;p.y=0;const t=p.matrixTransform(el.getScreenCTM());return {x:t.x,y:t.y}; });
    const to = await page.locator('#scene').evaluate((svg, args) => {
      const target = svg.querySelector('[data-count-drop]');
      const box = target.getBBox();const p=svg.createSVGPoint();
      p.x=args.invalid?500:box.x+box.width/2;p.y=args.invalid?30:box.y+box.height/2;
      const t=p.matrixTransform(target.getScreenCTM());return {x:t.x,y:t.y};
    }, options);
    if(options.touch && engine==='chromium') {
      const cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
      for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:options.cancel?'touchCancel':'touchEnd',touchPoints:[]});await cdp.detach();
    } else {
      await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});
      if(options.cancel)await page.locator('#scene').dispatchEvent('pointercancel',{pointerId:1});
      await page.mouse.up();
    }
    return id;
  }
  for(const age of (process.env.COUNT_QUICK?[]:[2,3])) {
    await open(age);
    const max=age===2?5:10;
    for(let target=1;target<=(process.env.COUNT_RED?1:max);target++) {
      for(let item=0;item<1;item++) {
        const id=await drag(age);
        const s=await state();
        check(`Age ${age} count ${target} drop ${item+1} removes exactly the picked item`,!s.sources.includes(id)&&s.sources.length===max-target&&s.collected===target,s);
      }
      const completedAt=Date.now();
      const before=await state();
      check(`Age ${age} count ${target} stays complete before its thumbnail ticks`,before.text.includes(`${target} / ${target}`)&&before.chips.filter(c=>c.done).length===target-1&&before.chips[target-1].current,before);
      check(`Age ${age} count ${target} shows SaNa's wait message`,before.praise.includes('Well done!')&&before.praise.includes('Wait for the next count')&&before.demoDisabled,before);
      if(process.env.COUNT_RED)continue;
      if(target===1) {
        await page.screenshot({path:resolve(output,`age-${age}-completed.png`)});
        if(before.sources.length)await drag(age);
        const blocked=await state();check(`Age ${age} blocks extra drops during the hold`,blocked.collected===target&&blocked.text===before.text,blocked);
      }
      await page.waitForTimeout(Math.max(0,2750-(Date.now()-completedAt)));
      const held=await state();check(`Age ${age} count ${target} remains visible through the three-second hold`,held.praise&&held.text.includes(`${target} / ${target}`)&&held.chips.filter(c=>c.done).length===target-1,held);
      await page.waitForFunction(n=>document.querySelectorAll('#item-progress-strip .is-done').length===n,target,{timeout:1800});
      const next=await state();check(`Age ${age} count ${target} ticks only after three seconds`,Date.now()-completedAt>=2900&&next.chips.filter(c=>c.done).length===target,next);
      if(target<max)check(`Age ${age} enables only the next count`,next.text.includes(`${target} / ${target+1}`)&&next.chips[target].current&&!next.praise,next);
      else {await page.waitForTimeout(2100);const end=await state();check(`Age ${age} final collection remains visible until Again`,end.collected===max&&end.chips.every(c=>c.done)&&!end.text.includes('Count to '+(max+1)),end);}
    }
  }
  if(!process.env.COUNT_RED) {
    await open(2);const beforeDemo=await state();await page.locator('#show-me').click();
    await page.waitForTimeout(150);await drag(2);await page.locator('#show-me').click();
    const afterDemo=await state();
    check('Count Demo and touching its illustration do not change the real round',beforeDemo.text===afterDemo.text&&beforeDemo.collected===afterDemo.collected&&JSON.stringify(beforeDemo.chips)===JSON.stringify(afterDemo.chips),afterDemo);
    for(const action of (process.env.COUNT_QUICK?[]:['again','game-home','age'])) {
      await open(2);await drag(2);
      if(action==='age')await page.locator('[data-age-option="3"]').click();
      else {await page.locator('#'+action).click();if(action==='game-home')await page.locator('[data-activity="abacus"]').click();}
      await page.waitForTimeout(3200);const s=await state();check(action+' cancels the old countdown',s.text.includes('0 / 1')&&!s.chips.some(c=>c.done)&&!s.praise,s);
    }
    for(const [width,height] of [[844,390],[390,844],[667,375],[320,568],[768,1024],[1366,768]]) {
      await page.setViewportSize({width,height});await open(3);const initial=await state();
      await drag(3,{invalid:true});check(width+'x'+height+' invalid drop does not count',(await state()).sources.length===initial.sources.length);
      await drag(3,{cancel:true});check(width+'x'+height+' canceled drag does not count',(await state()).sources.length===initial.sources.length);
      await drag(3,{touch:true});const s=await state();
      const visible=await page.locator('[data-count-praise]').evaluate(el=>{const r=el.getBoundingClientRect();return r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;});
      check(width+'x'+height+' drag and praise fit the game window',s.collected===1&&visible,s);
      await page.locator('#again').click();
    }
    await page.setViewportSize({width:844,height:390});await open(2);await page.locator('#fullscreen').click();await drag(2,{touch:true});
    check('SaNa praise stays visible in immersive play',await page.locator('[data-count-praise]').isVisible());
    await page.screenshot({path:resolve(output,'age-2-immersive-completed.png')});await page.locator('#exit-play').click();await page.locator('#again').click();
    await open(4);await page.locator('[data-count-choice="1"]').click();check('Age 4 train keeps its existing progression',(await state()).text.includes('Find number: 2'));
    await open(5);check('Age 5 abacus remains available',await page.locator('[data-bead-row]').count()===100);
    await page.locator('#home').click();await page.locator('[data-activity="slide"]').click();check('Slide still opens',await page.locator('#scene').textContent().then(t=>t.includes('SLIDE TO OPEN')));
    await page.locator('#home').click();await page.locator('[data-activity="brush"]').click();check('Paint still opens',await page.locator('#app').getAttribute('data-view')==='brush');
    await page.goto(base+'index.html');await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    const cached=await page.evaluate(async()=>{const cache=await caches.open('sana-little-hands-beta-v125-real-train');return Promise.all(['app.js?v125',...['apple-tree','basket','carrot-garden','rabbit','apple','carrot'].map(name=>'count-art/'+name+'.png')].map(name=>cache.match(new URL(name,location.href)).then(Boolean)));});
    check('The worker precaches the exact game script and every illustration',cached.every(Boolean),cached);
    if(engine==='chromium')await context.setOffline(true);else await new Promise(done=>server.close(done));
    await open(2);await drag(2);check('Offline counting retains the completed apple',(await state()).collected===1);
    const assets=await page.evaluate(async()=>{const names=['apple-tree','basket','carrot-garden','rabbit','apple','carrot'];return Promise.all(names.map(name=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src='count-art/'+name+'.png';})));});
    check('All six illustrations load offline',assets.every(Boolean),assets);
  }
  check('No uncaught game errors',errors.length===0,errors);
  writeFileSync(resolve(output,'checks.json'),JSON.stringify({engine,results,errors},null,2));
  assert(results.every(r=>r.pass),'Counting adventure checks failed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
