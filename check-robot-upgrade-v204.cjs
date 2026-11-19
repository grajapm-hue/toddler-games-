// Upgrade the actual published v2.02 worker, including failed install and saved-photo retention.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium,expect}=require('C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs'),prior='f9441c0b7824080df43d88f8250dcf936e99744c',old=new Map();
const changed=new Set(execFileSync('git',['diff','--name-only',prior,'--','docs/'],{cwd:__dirname,encoding:'utf8'}).trim().split(/\r?\n/));
const target='sana-little-hands-beta-v204-reference-scale-tools',previous='sana-little-hands-beta-v203-zoom-pan-precision';
let latest=false,failDownload=false,browser,checks=0,failedRequests=0;
const check=(name,ok)=>{assert(ok,name);checks++;console.log('PASS '+name);};
const server=http.createServer((req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/toddler-games-\//,'/'),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));assert(file.startsWith(root+path.sep));const relative=path.relative(__dirname,file).replaceAll('\\','/');
 if(latest&&failDownload&&relative==='docs/beta/robot-machines.js'){failedRequests++;res.writeHead(503).end();return;}
 let body;if(!latest&&changed.has(relative)){if(!old.has(relative))old.set(relative,execFileSync('git',['show',prior+':'+relative],{cwd:__dirname,maxBuffer:20000000}));body=old.get(relative);}else body=fs.readFileSync(file);
 res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/toddler-games-/beta/`;
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:900,height:700}}),welcome=await context.newPage();
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));welcome.on('pageerror',e=>errors.push(e.message));
 await welcome.goto(base+'index.html');await expect(welcome.locator('#offline-status')).toHaveText('Ready for offline play',{timeout:45000});
 check('Published v2.03 is the starting installed release',await welcome.locator('[data-release-version]').first().textContent()==='v2.03');
 await welcome.evaluate(()=>caches.open('unrelated-app-keep'));
 const game=await context.newPage();await game.goto(base+'play.html?age=3');await game.locator('[data-activity="puzzle"]').click();await game.locator('#puzzle-file').setInputFiles(path.join(root,'beta/icon-192.png'));await expect(game.locator('[data-puzzle-choice]')).toHaveCount(2);await expect(game.locator('#puzzle-board')).toHaveAttribute('data-ready','true');
 const settings=await game.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'));await game.evaluate(()=>window.robotUpgradeMarker='still playing');latest=true;
 if(!process.env.BROWSER_ENTRY){
  failDownload=true;
  const result=await welcome.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();return new Promise(async(resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Failure installation did not settle')),20000);registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant'||worker.state==='activated'){clearTimeout(timer);resolve(worker.state);}});},{once:true});await registration.update();});});
  check('Missing changed robot script rejects the incomplete release',result==='redundant'&&failedRequests>=3);
  check('Failed install preserves the previous complete cache',await welcome.evaluate(async name=>(await caches.keys()).includes(name),previous));
  check('Incomplete new cache is removed',!await welcome.evaluate(async name=>(await caches.keys()).includes(name),target));failDownload=false;
 }
 if(process.env.BROWSER_ENTRY)await welcome.goto(new URL('../update-beta-v2.04.html',base).href);
 else await welcome.getByRole('button',{name:'Update app',exact:true}).click();
 await expect(welcome.locator('[data-release-version]').first()).toHaveText('v2.04',{timeout:45000});
 check('Update reaches v2.04',await welcome.locator('meta[name="sana-release"]').getAttribute('content')===target);
 check('Open old game is preserved until returning to Games',await game.evaluate(()=>window.robotUpgradeMarker)==='still playing');
 await game.locator('#game-home').click();await expect(game.locator('#update-app [data-release-version]')).toHaveText('v2.04',{timeout:20000});
 check('Saved settings survive the upgrade',await game.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'))===settings);
 if(await game.locator('#sana-update-shade').isVisible())await game.getByRole('button',{name:'Got it',exact:true}).click();
 await game.locator('[data-activity="puzzle"]').click();await expect(game.locator('[data-puzzle-choice]')).toHaveCount(2);check('Saved photo survives the upgrade',await game.locator('[data-puzzle-choice]').count()===2);
 const cached=await welcome.evaluate(async name=>{const cache=await caches.open(name);return(await cache.keys()).map(req=>req.url);},target);
 check('All 32 cutouts and two references are cached',cached.filter(url=>url.includes('/glossy-art/v200/robots/')).length===34);
 check('Old cartoon machine art is absent from the current cache',!cached.some(url=>url.includes('/v198/machines/')));
 check('Unrelated app caches survive',await welcome.evaluate(async()=>(await caches.keys()).includes('unrelated-app-keep')));
 await context.setOffline(true);const offline=await context.newPage();await offline.goto(base+'play.html?age=4');await offline.locator('#more-games').click();await offline.locator('[data-activity="machines"]').click();
 check('New robot room opens offline',await offline.locator('#robot-machines-room').isVisible());
 const beforeView=await offline.locator('#robot-board').getAttribute('data-assembly');await offline.getByRole('button',{name:'Zoom in',exact:true}).click();
 check('Zoom controls work offline',JSON.parse(await offline.locator('#robot-board').getAttribute('data-view')).zoom>1);
 await offline.getByRole('button',{name:'Move canvas',exact:true}).click();const board=await offline.locator('#robot-board').boundingBox(),viewBeforePan=JSON.parse(await offline.locator('#robot-board').getAttribute('data-view'));await offline.mouse.move(board.x+board.width/2,board.y+board.height/2);await offline.mouse.down();await offline.mouse.move(board.x+board.width/2+35,board.y+board.height/2+20);await offline.mouse.up();
 check('Panning works offline without changing parts',JSON.parse(await offline.locator('#robot-board').getAttribute('data-view')).centerX!==viewBeforePan.centerX&&await offline.locator('#robot-board').getAttribute('data-assembly')===beforeView);await offline.getByRole('button',{name:'Fit canvas',exact:true}).click();
 await offline.getByRole('button',{name:'Head',exact:true}).click();const targetPoint=await offline.locator('#robot-board').evaluate(s=>{const p=window.SaNaRobotCatalogue.poses.standing.parts.find(p=>p.id==='head'),q=new DOMPoint(p.x+p.width/2,p.y+p.height/2).matrixTransform(s.getScreenCTM());return{x:q.x,y:q.y};});await offline.mouse.click(targetPoint.x,targetPoint.y);await offline.locator('#robot-tools-toggle').click();await offline.locator('#robot-part-increase').click();await offline.locator('#robot-rotate-left').click();const edited=JSON.parse(await offline.locator('#robot-board').getAttribute('data-assembly')).head;check('Part size and rotation controls work offline',edited.widthScale===1.1&&edited.angle===315&&!edited.fitted);await offline.locator('#robot-grid').click();check('Grid works offline',await offline.locator('[data-robot-grid]').count()===1);await offline.locator('#robot-part-original').click();check('Original restores magnetic fit offline',JSON.parse(await offline.locator('#robot-board').getAttribute('data-assembly')).head.fitted);await offline.locator('#robot-tools-close').click();
 for(const id of ['standing','waving']){
  await offline.locator('#robot-variant').selectOption(id);await offline.locator('#robot-look').click();await offline.locator('#robot-reference').evaluate(img=>img.decode());check(`${id} full reference works offline`,await offline.locator('#robot-reference').isVisible());await offline.locator('#robot-look').click();
 }
 const decoded=await offline.evaluate(async()=>{for(const pose of Object.values(window.SaNaRobotCatalogue.poses))for(const part of pose.parts){const image=new Image();image.src=part.asset;await image.decode();}return true;});check('Every transparent part decodes offline',decoded);
 check('Upgrade and offline play have no script errors',errors.length===0);
 console.log(`Robot v2.04 upgrade: ${checks} checks passed (${process.env.BROWSER_ENTRY?'fresh browser updater':'manual update and failed install'}).`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
