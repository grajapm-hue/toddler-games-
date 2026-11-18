// A held real sw.js response must not leave the manual Update button disabled forever.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,expect}=require(process.env.MM_PLAYWRIGHT||'C:/Users/jeyan/Projects/DotMd/node_modules/@playwright/test');
const root=path.join(__dirname,'docs'),results=[];let hold=false,held=0,releaseWorker,browser,alternate=false,holdAsset=false,assetsHeld=0,releaseAsset;
let gate=new Promise(resolve=>{releaseWorker=resolve;});
const assetGate=new Promise(resolve=>{releaseAsset=resolve;});
const check=(name,pass)=>{results.push({name,pass:!!pass});console.log((pass?'PASS ':'FAIL ')+name);};
const server=http.createServer(async(req,res)=>{try{
  const pathname=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  assert(file.startsWith(root+path.sep));
  if(hold&&pathname.endsWith('/sw.js')){held++;await gate;}
  if(holdAsset&&pathname.endsWith('/icon-512.png')){assetsHeld++;await assetGate;}
  let body=fs.readFileSync(file);
  if(alternate&&['sw.js','index.html','play.html'].includes(path.basename(file)))body=Buffer.from(body.toString().replaceAll('sana-little-hands-beta-v198-r2-update-recovery','sana-little-hands-beta-v198-r3-download-test'));
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
}catch{res.writeHead(404).end();}});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/beta/index.html`);
  await expect(page.locator('#offline-status')).toHaveText('Ready for offline play',{timeout:30000});
  const saved=await page.evaluate(()=>{localStorage.setItem('update-preservation-test','keep');return localStorage.getItem('sanaLittleHandsV1');});
  await page.clock.install();hold=true;
  await page.locator('#update-app').click();await expect.poll(()=>held).toBeGreaterThan(0);
  await page.clock.fastForward(16000);
  const restored=await page.locator('#update-app').isEnabled();
  check('Stalled update check restores the button within 15 seconds',restored);
  const label=await page.locator('[data-update-label]').textContent();
  check('Stalled check stops showing Checking',label.includes('Update')&&!label.includes('Checking'));
  if(!restored)return;
  check('Timeout gives an actionable connection message',(await page.locator('#sana-dialog-copy').count()?await page.locator('#sana-dialog-copy').innerText():await page.getByRole('dialog').innerText()).toLowerCase().includes('connection'));
  hold=false;releaseWorker();
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  await page.locator('#update-app').click();
  await expect(page.getByRole('dialog')).toContainText('up to date');
  check('Retry succeeds once the network responds',await page.locator('#update-app').isEnabled());
  check('Retry keeps v1.98 visible',await page.locator('[data-release-version]').first().textContent()==='v1.98');
  check('Failed check and retry preserve local data',await page.evaluate(()=>localStorage.getItem('update-preservation-test'))==='keep'&&await page.evaluate(()=>localStorage.getItem('sanaLittleHandsV1'))===saved);
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  alternate=true;holdAsset=true;await page.locator('#update-app').click();
  await expect.poll(()=>assetsHeld).toBeGreaterThan(0);
  await expect(page.locator('[data-update-label]')).toHaveText('Downloading…');
  await page.clock.fastForward(21000);
  check('Slow asset downloads show Downloading instead of Checking',await page.locator('[data-update-label]').textContent()==='Downloading…');
  check('A slow download continues beyond the old 20-second limit',!await page.locator('#update-app').isEnabled());
  check('Previous downloaded games remain cached until the replacement is complete',await page.evaluate(async()=> (await caches.keys()).includes('sana-little-hands-beta-v198-r2-update-recovery')));
  holdAsset=false;releaseAsset();
  await expect(page.locator('meta[name="sana-release"]')).toHaveAttribute('content','sana-little-hands-beta-v198-r3-download-test',{timeout:30000});
  check('A slow download applies successfully after all assets arrive',await page.locator('[data-release-version]').first().textContent()==='v1.98');
  await context.close();
  alternate=false;hold=true;const heldBefore=held;gate=new Promise(resolve=>{releaseWorker=resolve;});
  const fresh=await browser.newContext(),recovery=await fresh.newPage();await recovery.clock.install();
  await recovery.goto(`http://127.0.0.1:${server.address().port}/beta/update-v1.98.html`);
  await expect.poll(()=>held).toBeGreaterThan(heldBefore);await recovery.clock.fastForward(16000);
  check('Fresh update entry offers Try again after a stalled connection',await recovery.locator('#retry').isVisible()&&await recovery.locator('#retry').isEnabled());
  check('Fresh entry explains the stalled connection',(await recovery.locator('#progress').textContent()).includes('connection'));
  hold=false;releaseWorker();await recovery.locator('#retry').click();
  await recovery.waitForURL('**/index.html',{timeout:30000});
  check('Fresh entry retry opens v1.98 when the connection recovers',await recovery.locator('[data-release-version]').first().textContent()==='v1.98');
  await fresh.close();
})().catch(error=>{console.error(error);check('Timeout scenario completes without an exception',false);}).finally(async()=>{
  hold=false;releaseWorker();holdAsset=false;releaseAsset();await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  const failed=results.filter(result=>!result.pass);console.log(JSON.stringify({checks:results.length,failed:failed.length,failures:failed}));process.exitCode=failed.length?1:0;
});
