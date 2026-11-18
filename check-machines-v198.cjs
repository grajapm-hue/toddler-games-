// Release checks for the new Machines activity and its boundaries with existing games.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const engine=process.env.PLAYROOM_BROWSER||'chromium',root=path.join(__dirname,'docs');
const out=path.join(__dirname,'artifacts/machines-v198',engine),results=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const server=http.createServer((req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  assert(file.startsWith(root+path.sep));
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
}catch{res.writeHead(404).end();}});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=process.env.MACHINES_URL||`http://127.0.0.1:${server.address().port}/beta/`;
  browser=await pw[engine].launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'play.html?age=2');await page.locator('#more-games').click();
  const available=await page.locator('[data-activity="machines"]:visible').count()===1;
  check('Machines is available alongside Blocks in More games',available);
  if(!available)return;
  check('Blocks remains available',await page.locator('[data-activity="glossy"]').isVisible());
  await page.locator('[data-activity="machines"]').click();
  check('V198 is displayed as v1.98',await page.locator('#update-app [data-release-version]').textContent()==='v1.98');
  check('Fixed-colour machine artwork does not offer a misleading Colour control',!await page.locator('#glossy-colour-toggle').isVisible());
  await page.locator('#help-toggle').count().then(async count=>{if(count)await page.locator('#help-toggle').click();else await page.getByRole('button',{name:'How to Play',exact:true}).click();});
  const title=await page.locator('#guide-title').textContent();
  check('Machines has its own named How to Play guide',title.includes('Machines')&&!title.includes('undefined'),title);
  check('Machines guide includes actual activity instructions',await page.locator('#guide-body > .guide-steps > li').count()>=4);
  await page.locator('#guide-close').click();
  for(const [age,total,pages,style] of [[2,9,1,'toy'],[3,18,2,'toy'],[4,27,3,'real'],[5,36,4,'real']]){
    await page.locator(`[data-age-option="${age}"]`).click();
    for(const family of ['robots','cars','ships','planes','rockets']){
      await page.locator('#glossy-category-toggle').click();
      await page.locator(`[data-glossy-category-option="machine-${family}"]`).click();
      const inventory=await page.locator('#glossy-inventory').innerText();
      check(`Age ${age} ${family} offers ${total} parts`,Number(inventory.match(/\d+/)?.[0])===total,inventory);
      const seen=new Set();let assetsOk=true;
      for(let current=1;current<=pages;current++){
        const shown=await page.locator('#glossy-store [data-glossy-item]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.glossyItem,asset:node.querySelector('image')?.getAttribute('href')})));
        shown.forEach(item=>seen.add(item.id));
        const loaded=await page.evaluate(async items=>Promise.all(items.map(async item=>{if(!item.asset)return false;const image=new Image();image.src=item.asset;try{await image.decode();return image.naturalWidth>0;}catch{return false;}})),shown);
        assetsOk&&=shown.length===9&&shown.every(item=>item.asset.includes('/'+style+'/'))&&loaded.every(Boolean);
        if(current<pages)await page.locator('#glossy-store-next').click();
      }
      check(`Age ${age} ${family} all parts are reachable and rendered`,seen.size===total&&assetsOk,{seen:seen.size,assetsOk});
      await page.locator('#glossy-look').click();
      check(`Age ${age} ${family} complete reference loads`,await page.locator('#glossy-look-image').evaluate(async image=>{try{await image.decode();return image.naturalWidth>0;}catch{return false;}}));
      await page.locator('#glossy-look').click();
    }
  }
  await page.locator('[data-age-option="2"]').click();
  await page.locator('#glossy-category-toggle').click();await page.locator('[data-glossy-category-option="machine-robots"]').click();
  await page.locator('#glossy-store [data-glossy-item]').first().click();
  await page.locator('#glossy-board').click({position:{x:130,y:150}});
  check('Tap a part then Assemble adds the selected part',await page.locator('[data-glossy-placed]').count()===1);
  const saved=await page.locator('#glossy-board').getAttribute('data-blocks');
  await page.locator('#show-me').click();await page.locator('#glossy-room[data-demo="true"]').waitFor();await page.locator('#show-me').click();
  check('Demo returns to the existing machine build',await page.locator('#glossy-board').getAttribute('data-blocks')===saved);
  for(const [width,height] of [[360,800],[800,360],[1280,800]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    check(`${width}x${height} rotation keeps the machine build`,await page.locator('#glossy-board').getAttribute('data-blocks')===saved);
    const geometry=await page.locator('#glossy-room button:visible,#game-home,#game-back,#game-front').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{id:node.id,inside:r.x>=-1&&r.y>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};}));
    check(`${width}x${height} controls remain on screen`,geometry.every(item=>item.inside),geometry.filter(item=>!item.inside));
    await page.screenshot({path:path.join(out,`${width}x${height}.png`)});
  }
  await page.locator('#glossy-finish').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#glossy-snapshot').click()]);
  await download.saveAs(path.join(out,'machine-snapshot.png'));
  const bytes=fs.readFileSync(path.join(out,'machine-snapshot.png'));
  check('Machine snapshot exports a valid PNG',bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  await page.locator('#game-home').click();await page.locator('[data-activity="glossy"]').click();
  check('Existing Blocks retains Colour',await page.locator('#glossy-colour-toggle').isVisible());
  await page.locator('#glossy-store [data-glossy-item]').first().press('Enter');
  await page.locator('#glossy-colour').evaluate(input=>{input.value='#73bde0';input.dispatchEvent(new Event('input',{bubbles:true}));});
  check('Existing Blocks still recolours the selected block',JSON.parse(await page.locator('#glossy-board').getAttribute('data-blocks'))[0].color==='#73bde0');
  await page.locator('#game-home').click();await page.locator('#first-games').click();
  check('Original six activities remain on the first menu page',await page.locator('[data-activity]:visible').count()===6);
  await page.goto(base+'index.html');
  check('Welcome also reports v1.98',await page.locator('[data-release-version]').first().textContent()==='v1.98');
  check('No browser script errors',errors.length===0,errors);
  await context.close();
})().catch(error=>{check('Release checks completed without an exception',false,error.stack);}).finally(async()=>{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,results,errors},null,2));
  const failed=results.filter(result=>!result.pass);console.log(JSON.stringify({engine,checks:results.length,failed:failed.length,failures:failed}));
  process.exitCode=failed.length?1:0;
});
