const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createServer}=require('node:http');
const {chromium,webkit}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.resolve(__dirname,'docs');
const out=process.env.CARROT_EVIDENCE||path.resolve(__dirname,'artifacts/carrot-visibility',engine);
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.COUNT_URL||`http://127.0.0.1:${server.address().port}/beta/`;
 browser=await({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.MM_CHROME?{executablePath:process.env.MM_CHROME}:{})});
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 // Probe the orange root itself, rather than the sprite's transparent centre.
 async function visibleRoots(){await page.locator('#scene[data-art-state="ready"]').waitFor();return page.evaluate(async()=>{
  const garden=document.querySelector('image[href="count-art/carrot-garden.webp"]');
  const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
  const farm=await load(garden.getAttribute('href')),carrot=await load('count-art/carrot.webp');
  const imagePoint=(el,image,u,v)=>{
   const b=el.getBBox(),scale=Math.min(b.width/image.naturalWidth,b.height/image.naturalHeight);
   return new DOMPoint(b.x+(b.width-image.naturalWidth*scale)/2+u*image.naturalWidth*scale,b.y+(b.height-image.naturalHeight*scale)/2+v*image.naturalHeight*scale).matrixTransform(el.getScreenCTM());
  };
  const farmBox=garden.getBBox(),scale=Math.min(farmBox.width/farm.naturalWidth,farmBox.height/farm.naturalHeight),matrix=garden.getScreenCTM().inverse();
  return [...document.querySelectorAll('[data-count-fruit]')].map(node=>{
   const image=node.querySelector('image');
   const probes=[.53,.72,.91].map(v=>{
    const p=imagePoint(image,carrot,.49,v),local=p.matrixTransform(matrix);
    const x=(local.x-farmBox.x-(farmBox.width-farm.naturalWidth*scale)/2)/(farm.naturalWidth*scale),y=(local.y-farmBox.y-(farmBox.height-farm.naturalHeight*scale)/2)/(farm.naturalHeight*scale);
    // The dark soil trapezoid in the original farm PNG, above its orange boards.
    const t=(y-.235)/(.65-.235),left=.145+t*(.08-.145),right=.855+t*(.92-.855);
    return{onSoil:y>=.235&&y<=.65&&x>=left&&x<=right,hit:document.elementFromPoint(p.x,p.y)?.closest('[data-count-fruit]')===node,x:p.x,y:p.y};
   });
   return{id:Number(node.dataset.countFruit),probes};
  });
 });}
 async function open(){await page.goto(base+'play.html?age=3');await page.locator('[data-age-option="3"]').click();await page.locator('[data-activity="abacus"]').click();}
 const viewports=process.env.CARROT_RED?[[1024,768]]:[[1024,768],[844,390],[390,844],[320,568],[768,1024],[1366,768]];
 for(const [width,height] of viewports){
  await page.setViewportSize({width,height});
  for(const order of [[0,1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4,3,2,1,0]]){
   await open();const label=`${width}x${height} order ${order[0]}`;
   check(label+' starts with ten carrots',await page.locator('[data-count-fruit]').count()===10);
   const initial=await visibleRoots();
   check(label+' every orange root is clearly on dark soil and directly touchable',initial.every(n=>n.probes.every(p=>p.onSoil&&p.hit)),initial);
   if(order[0]===0)await page.screenshot({path:path.join(out,`ten-carrots-${width}x${height}.png`)});
   for(let count=0;count<10;count++){
    const stock=await visibleRoots(),chosen=stock.find(n=>n.id===order[count]),from=chosen.probes[1];
    const to=await page.locator('[data-count-drop]').evaluate(el=>{const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y};});
    if(engine==='chromium'){
     const cdp=await context.newCDPSession(page);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
     for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8,id:1}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}
    const left=await page.locator('[data-count-fruit]').count(),collected=await page.locator('[data-count-collected]').count();
    check(label+` visible-root drag ${count+1} leaves ${9-count}`,left===9-count&&collected===count+1,{left,collected});
    await page.clock.runFor(1600);
    if(count===4){const remaining=await visibleRoots();check(label+' five remaining carrots are clear and touchable',remaining.length===5&&remaining.every(n=>n.probes.every(p=>p.onSoil&&p.hit)),remaining);await page.screenshot({path:path.join(out,`five-left-${width}x${height}-order-${order[0]}.png`)});}
   }
   check(label+' completes all ten thumbnails',await page.locator('#item-progress-strip .is-done').count()===10);
  }
 }
 check('No uncaught carrot-game errors',errors.length===0,errors);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors},null,2));assert(results.every(r=>r.pass),'Visible carrot checks failed');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({engine,results,errors,exception:String(e)},null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
