'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {before,after,test}=require('node:test');
const playwright=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const {createHash}=require('node:crypto');
const root=path.join(__dirname,'docs'),beta=path.join(root,'beta'),engine=process.env.PLAYROOM_BROWSER||'chromium';
const out=path.join(__dirname,'artifacts/puppy-v199',engine);
let browser,server,base;
before(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{try{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  assert(file.startsWith(root+path.sep));const body=fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=process.env.BETA_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await playwright[engine].launch();
});
after(async()=>{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
test('new puppy install icons preserve SaNa identity and provide real 192/512 PNGs',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(beta,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./index.html');
 assert.equal(manifest.name,'SaNa Beta');assert.equal(manifest.short_name,'SaNa Beta');
 assert.equal(manifest.icons.length,2);
 for(const size of [192,512]){
  const icon=manifest.icons.find(icon=>icon.sizes===`${size}x${size}`);
  assert.equal(icon.src,`sana-puppy-v199-${size}.png`);
  const image=fs.readFileSync(path.join(beta,icon.src));
  assert.equal(image.subarray(1,4).toString(),'PNG');assert.equal(image.readUInt32BE(16),size);assert.equal(image.readUInt32BE(20),size);
  assert.deepEqual(fs.readFileSync(path.join(beta,`icon-${size}.png`)),image,'legacy icon URLs must display the puppy too');
 }
 assert.match(manifest.icons.find(icon=>icon.sizes==='512x512').purpose,/maskable/);
});
test('the circular welcome portrait is separate from the approved PWA icons',()=>{
 const source=fs.readFileSync(path.join(beta,'index.html'),'utf8');
 assert(/<image[^>]+data-sana-puppy[^>]+href="sana-puppy-welcome-circle-v199\.png"/.test(source),'the welcome must select its own circular portrait');
 const unchanged={
  'icon.svg':'08ddad3b3b54804facfd85999dca057b1441f1943af3311ef7158c9753268132',
  'icon-192.png':'32b0df4951785e2173cb96c81ef4ed14806766ed1bf757a303b350d50b340bbf',
  'icon-512.png':'00b1e56ac5e6ee95f5a5bfcf20f2accf945f26776a1245e9770bb28ac1c06c07',
  'sana-puppy-v199-192.png':'32b0df4951785e2173cb96c81ef4ed14806766ed1bf757a303b350d50b340bbf',
  'sana-puppy-v199-512.png':'00b1e56ac5e6ee95f5a5bfcf20f2accf945f26776a1245e9770bb28ac1c06c07'
 };
 for(const [file,hash] of Object.entries(unchanged))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(beta,file))).digest('hex'),hash,file+' must remain byte-for-byte unchanged');
});
for(const [width,height] of [[320,568],[393,852],[844,390],[800,1280],[1280,800],[1024,768]]){
 test(`puppy welcome keeps SaNa and usable controls at ${width}x${height}`,async()=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  try{
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'index.html');
   assert.equal((await page.locator('#welcome-title').innerText()).replace(/\s+/g,' '),'SaNa Little Hands');
   assert.match(await page.locator('.family').innerText(),/A little world with SaNa/);
   assert.equal(await page.locator('.mascot-art image[data-sana-puppy]').count(),1);
   assert.match(await page.locator('.mascot-art').getAttribute('aria-label'),/SaNa the puppy/);
   assert.match(await page.locator('.family img').getAttribute('src'),/sana-puppy-welcome-circle-v199\.png/);
   assert.equal(await page.locator('.sese-welcome').getAttribute('src'),'sese-enhanced-v89.png');
   assert.equal(await page.locator('[data-release-version]').first().textContent(),'v1.99');
   await page.evaluate(async()=>{const image=new Image();image.src=document.querySelector('[data-sana-puppy]').getAttribute('href');await image.decode();});
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const geometry=await page.evaluate(()=>{
    const box=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const controls=['#play','#install','#about','#update-app'].map(selector=>box(document.querySelector(selector)));
    return {controls,art:box(document.querySelector('[data-sana-puppy]')),overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert.equal(geometry.overflow,false);
   assert(geometry.controls.every(box=>box.x>=-1&&box.y>=-1&&box.right<=width+1&&box.bottom<=height+1&&box.height>0),'welcome controls must fit the viewport: '+JSON.stringify(geometry));
   assert(geometry.art.width>=48&&geometry.art.x>=-1&&geometry.art.right<=width+1&&geometry.art.y>=-1&&geometry.art.bottom<=height+1,'puppy must be visible without clipping');
   await page.screenshot({path:path.join(out,`welcome-${width}x${height}.png`)});
   await page.locator('#play').click();
   await page.locator('[data-activity="puzzle"]').waitFor();
   assert.match(await page.locator('.wordmark').innerText(),/SaNa/);
   assert.equal(await page.locator('#update-app [data-release-version]').textContent(),'v1.99');
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
}
test('preview, favicon and offline assets all point to puppy art',()=>{
 const worker=fs.readFileSync(path.join(beta,'sw.js'),'utf8');
 const assets=JSON.parse(worker.match(/const ASSETS=(\[[^;]+\]);/)[1]);
 assert.match(worker,/sana-little-hands-beta-v199-circle-welcome/);
 for(const size of [192,512])assert(assets.includes(`./sana-puppy-v199-${size}.png`));
 for(const name of ['index.html','play.html']){
  const head=fs.readFileSync(path.join(beta,name),'utf8').split('</head>')[0];
  assert(head.includes('sana-puppy-v199-512.png'));assert(head.includes('sana-puppy-v199-192.png'));
  assert(!head.includes('Tap monkey'));assert(head.includes('Tap puppy'));
  assert(!head.includes('SaNa the smiling monkey'));assert(head.includes('SaNa the puppy'));
 }
});
