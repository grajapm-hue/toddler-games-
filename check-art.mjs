import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,webkit,expect}=require(process.env.MM_PLAYWRIGHT||'@playwright/test');
const root=import.meta.dirname,engine=process.env.PLAYROOM_BROWSER||'chromium';
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':extname(path)==='.js'?'text/javascript':'text/html'}).end(await readFile(path));
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.MM_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const output=resolve(root,'artifacts','art',engine);await mkdir(output,{recursive:true});
let checks=0;
try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const touch=engine==='chromium'?await context.newCDPSession(page):null;
  await page.goto(process.env.ART_URL||`http://127.0.0.1:${server.address().port}/index.html`);
  const point=async(x,y)=>page.locator('#scene').evaluate((svg,{x,y})=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};},{x,y});
  const stroke=async(...points)=>{
    let from=await point(...points[0]);
    if(touch)await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
    else{await page.mouse.move(from.x,from.y);await page.mouse.down();}
    for(const coords of points.slice(1)){
      const p=await point(...coords);
      if(touch){for(let i=1;i<=8;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(p.x-from.x)*i/8,y:from.y+(p.y-from.y)*i/8,id:1}]});}
      else await page.mouse.move(p.x,p.y,{steps:8});
      from=p;
    }
    if(touch)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
  };
  const pixel=async(x,y)=>page.locator('#scene').evaluate(async(svg,{x,y})=>{
    const copy=svg.cloneNode(true);copy.setAttribute('width','1000');copy.setAttribute('height','440');copy.removeAttribute('style');
    const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));await image.decode();
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=440;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,1000,440);return [...ctx.getImageData(x,y,1,1).data];
  },{x,y});
  await page.getByRole('button',{name:'Brush and paint',exact:true}).click();
  await page.getByRole('button',{name:'Finger paint',exact:true}).click();
  await stroke([200,100],[250,150]);
  await expect(page.locator('[data-stroke]')).toHaveCount(0);checks++;
  await page.getByRole('button',{name:'Large brush',exact:true}).click();
  await stroke([500,280],[800,280]);
  await page.screenshot({path:resolve(output,'paint-boundary.png')});
  assert.deepEqual(await pixel(740,280),[255,253,245,255],'Painting must not mark the blank paper outside the puppy');
  assert.deepEqual(await pixel(500,280),[223,127,104,255],'Brush must color inside the puppy');checks++;
  const large=Number(await page.locator('[data-stroke]').last().getAttribute('stroke-width'));
  await page.getByRole('button',{name:'Small brush',exact:true}).click();
  await stroke([500,300],[520,300]);
  assert(Number(await page.locator('[data-stroke]').last().getAttribute('stroke-width'))<large,'Selected size must change the actual brush');checks++;
  await page.getByRole('button',{name:'Large brush',exact:true}).click();
  await page.getByRole('button',{name:'Erase paint',exact:true}).click();
  await stroke([480,280],[550,280]);
  assert.deepEqual(await pixel(500,280),[255,253,245,255],'Eraser must reveal the original paper');
  await page.getByRole('button',{name:'Green paint',exact:true}).click();
  await stroke([480,280],[550,280]);
  assert.deepEqual(await pixel(500,280),[101,165,138,255],'Painting after erasing must work over the erased area');checks++;
  await page.getByRole('button',{name:'Again',exact:true}).click();
  for(let y=85;y<=350;y+=24)await stroke([500,y],[310,y],[755,y]);
  await expect(page.locator('#art-reward')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('SaNa');
  await page.screenshot({path:resolve(output,'paint-complete-phone.png')});checks++;
  await stroke([500,280],[550,280]);
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect(page.locator('#art-reward')).toBeHidden();
  await expect(page.locator('[data-stroke]')).toHaveCount(0);checks++;
  await page.getByRole('button',{name:'Brush clean',exact:true}).click();
  await page.getByRole('button',{name:'Small brush',exact:true}).click();
  await stroke([370,129],[371,129]);
  const smallOpacity=await page.locator('[data-dirt="0"]').getAttribute('opacity');
  await page.getByRole('button',{name:'Large brush',exact:true}).click();
  await stroke([370,129],[371,129]);
  assert(Number(await page.locator('[data-dirt="0"]').getAttribute('opacity'))<Number(smallOpacity),'Large cleaning brush must reach mud beyond the small brush');checks++;
  for(const [name,width,height] of [['small-phone',667,375],['portrait',390,844],['tablet',1024,768]]){
    await page.setViewportSize({width,height});
    await page.getByRole('button',{name:'Finger paint',exact:true}).click();
    for(const control of await page.locator('#art-tools button').all()){
      const box=await control.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Art controls must fit the screen');
    }
    await stroke([500,280],[600,280]);
    assert.deepEqual(await pixel(500,280),[101,165,138,255],'Painting must work after rotation');
    await page.screenshot({path:resolve(output,`paint-${name}.png`)});checks++;
  }
  await page.setViewportSize({width:844,height:390});
  for(const [level,picture,inside,count,size] of [
    ['Explore level','fish',[650,200],4,'Large brush'],
    ['Play level, ages 2 to 4','puppy',[500,280],8,'Medium brush'],
    ['Challenge level','butterfly',[340,140],14,'Small brush']
  ]){
    await page.getByRole('button',{name:level,exact:true}).click();
    await expect(page.getByRole('button',{name:level,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#scene')).toHaveAttribute('aria-label',`Paint the ${picture}`);
    await expect(page.getByRole('button',{name:size,exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Coral paint',exact:true}).click();
    await stroke(inside,[inside[0]+3,inside[1]]);
    assert.deepEqual(await pixel(...inside),[223,127,104,255],`${level} must render and paint its own picture`);
    await page.getByRole('button',{name:'Large brush',exact:true}).click();
    await stroke(inside,[750,380]);
    assert.deepEqual(await pixel(750,380),[255,253,245,255],`${picture} must retain its painting boundary`);
    await page.screenshot({path:resolve(output,`level-${picture}-paint.png`)});
    await page.getByRole('button',{name:'Again',exact:true}).click();
    for(let y=75;y<=365;y+=18)await stroke([500,y],[300,y],[720,y]);
    await expect(page.locator('#art-reward')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(picture);
    await page.getByRole('button',{name:'Brush clean',exact:true}).click();
    await expect(page.locator('#scene')).toHaveAttribute('aria-label',`Clean the ${picture}`);
    await expect(page.locator('[data-dirt]')).toHaveCount(count);
    for(let i=0;i<70&&await page.locator('[data-dirt]').count();i++){
      const target=page.locator('[data-dirt]').first();
      const box=await target.boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
      await page.mouse.move(box.x+box.width/2+12,box.y+box.height/2,{steps:6});await page.mouse.up();
    }
    await expect(page.getByRole('status')).toContainText('All clean');
    await page.screenshot({path:resolve(output,`level-${picture}-clean.png`)});
    await page.getByRole('button',{name:'Finger paint',exact:true}).click();checks++;
  }
  for(const [name,width,height] of [['small-phone-butterfly',667,375],['portrait-butterfly',390,844]]){
    await page.setViewportSize({width,height});
    await expect.poll(async()=>{
      const heading=await page.locator('#activity-name').boundingBox(),modes=await page.locator('#brush-modes').boundingBox();
      if(width<height)return heading.y+heading.height<=modes.y+1;
      return heading.x+heading.width<=modes.x+1;
    }).toBe(true);
    await page.screenshot({path:resolve(output,`${name}.png`)});checks++;
  }
  await page.reload();
  await expect(page.getByRole('button',{name:'Challenge level',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Brush and paint',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('aria-label','Clean the butterfly');checks++;
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS: ${checks} art checks (${engine})`);
}finally{await browser.close();await new Promise(done=>server.close(done));}
