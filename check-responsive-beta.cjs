'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('node:http'),{spawnSync}=require('node:child_process');
const pw=require(process.env.MM_PLAYWRIGHT||'playwright');
const engine=process.env.PLAYROOM_BROWSER||'chromium',out=process.env.RESPONSIVE_EVIDENCE||path.join(__dirname,'artifacts/responsive-beta');
fs.mkdirSync(out,{recursive:true});const results=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://local'),file=path.resolve(__dirname,'docs','.'+url.pathname);if(!file.startsWith(path.join(__dirname,'docs')+path.sep))throw Error();res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function upright(page,id){return page.locator(id).evaluate(n=>{const r=n.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(n).transform);return {upright:Math.abs(m.b)<.01&&Math.abs(m.c)<.01,inside:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,width:r.width,height:r.height};});}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.RESPONSIVE_URL||`http://127.0.0.1:${server.address().port}/beta/`,browser=await pw[engine].launch();
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'play.html?age=2');await page.locator('[data-activity="puzzle"]').scrollIntoViewIfNeeded();await context.route('**/puzzle-sana-banana.webp',r=>r.abort());
  // A reload guarantees the very first built-in load fails, independent of browser image cache.
  await page.reload();await page.locator('[data-activity="puzzle"]').scrollIntoViewIfNeeded();await page.locator('[data-activity="puzzle"]').click();await page.waitForFunction(()=>document.getElementById('puzzle-message').textContent.includes('could not'));
  await context.unroute('**/puzzle-sana-banana.webp');await page.locator('[data-puzzle-choice="sana"]').click();
  let recovered=true;try{await page.locator('#puzzle-board[data-ready="true"]').waitFor({timeout:2500});}catch{recovered=false;}check('Failed built-in picture recovers without reloading',recovered);
  await context.close();
  const sizes=process.env.RESPONSIVE_QUICK?[[393,852]]:[[320,568],[393,852],[852,393],[800,1280],[1280,800],[1366,768],[360,640],[740,360]];
  for(const [width,height]of sizes){const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'index.html');const welcome=await upright(p,'#frame');check(`${width}x${height} welcome stays upright and inside viewport`,welcome.upright&&welcome.inside,welcome);await p.screenshot({path:path.join(out,`${engine}-${width}-welcome.png`)});await p.locator('#play').click();await p.waitForFunction(()=>document.querySelectorAll('[data-activity]').length===6);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const frame=await upright(p,'#app');check(`${width}x${height} playroom stays upright and fills screen`,frame.upright&&frame.inside&&frame.width>=width-4&&frame.height>=height-4,frame);
   const cards=await p.locator('[data-activity]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.activity,visible:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};}));check(`${width}x${height} all six games visible together`,cards.length===6&&cards.every(n=>n.visible),cards);
   await p.screenshot({path:path.join(out,`${engine}-${width}-home.png`)});
   if(!process.env.RESPONSIVE_QUICK)for(const id of ['drag','bubbles','slide','brush','abacus','puzzle']){
    await p.locator(`[data-activity="${id}"]`).click();await p.locator(id==='puzzle'?'#puzzle-board[data-ready="true"]':'#scene[data-art-state="ready"]').waitFor();
    const navigation=await p.locator('.play-navigation').evaluate(nav=>{const r=nav.getBoundingClientRect();return [...nav.querySelectorAll('#game-back,#game-front,#game-home,#fullscreen,#play-settings>summary')].every(n=>{const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.x>=r.x-1&&b.right<=r.right+1&&b.width>0&&!!hit&&n.contains(hit);});});check(`${width}x${height} ${id} navigation is visible and reachable`,navigation);
    const geometry=await p.locator(id==='puzzle'?'#picture-puzzle':'#scene').boundingBox();check(`${width}x${height} ${id} playable board`,geometry.width>100&&geometry.height>80&&geometry.y>=0&&geometry.y+geometry.height<=height+1,geometry);
    if(id==='puzzle'){const headings=await p.locator('#puzzle-caption-slot').evaluate(n=>{const r=n.getBoundingClientRect();return [...document.querySelectorAll('.puzzle-panel-label')].every(l=>{const b=l.getBoundingClientRect();return Math.min(r.right,b.right)<=Math.max(r.left,b.left)+.5||Math.min(r.bottom,b.bottom)<=Math.max(r.top,b.top)+.5;});});check(`${width}x${height} picture headings remain separate`,headings);const board=await p.locator('#puzzle-board').boundingBox();check(`${width}x${height} picture grid retains usable size`,board.width>=90&&board.height>=80,board);}
    await p.screenshot({path:path.join(out,`${engine}-${width}-${id}.png`)});await p.locator('#game-home').click();
   }
   await ctx.close();
  }
  check('Normal flows have no script errors',errors.length===0,errors);
  if(!process.env.RESPONSIVE_URL){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sana-legacy-'));fs.mkdirSync(path.join(dir,'docs/beta'),{recursive:true});fs.copyFileSync(path.join(__dirname,'build-beta.mjs'),path.join(dir,'build-beta.mjs'));fs.writeFileSync(path.join(dir,'docs/beta/index.html'),'maintained sentinel');fs.writeFileSync(path.join(dir,'docs/beta/sw.js'),"const CACHE='sana-little-hands-beta-v160-gallery-icon';");const run=spawnSync(process.execPath,[path.join(dir,'build-beta.mjs')],{encoding:'utf8'});check('Legacy builder refuses maintained Beta before writing',run.status!==0&&/maintained Beta/.test(run.stderr)&&fs.readFileSync(path.join(dir,'docs/beta/index.html'),'utf8')==='maintained sentinel',run.stderr);}
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,`${engine}-results.json`),JSON.stringify(results,null,2));}
 if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
