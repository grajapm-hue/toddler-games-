const assert=require('node:assert/strict'),pw=require(process.env.MM_PLAYWRIGHT||'playwright');
const engine=process.env.PLAYROOM_BROWSER||'chromium',base=process.env.RESPONSIVE_URL||'http://127.0.0.1:8783/beta/';
(async()=>{const browser=await pw[engine].launch();let failed=0,passed=0;
try{for(const [name,run] of [
 ['named palette and custom validation',async p=>{
  assert(await p.locator('[data-glossy-colour]').count()===12,'12 named palette colours must exist');
  await p.locator('[data-glossy-item]').first().press('Enter');await p.locator('#glossy-colour-toggle').click();await p.locator('[data-glossy-colour="#405f76"]').click();
  assert.equal(JSON.parse(await p.locator('#glossy-board').getAttribute('data-blocks'))[0].color,'#405f76','named palette changes actual block');
  await p.locator('#glossy-colour-toggle').click();const field=p.locator('#glossy-colour');if(await field.evaluate(n=>n.type)==='text'){
   await field.fill('bad');assert.equal(await field.getAttribute('aria-invalid'),'true');assert.equal(JSON.parse(await p.locator('#glossy-board').getAttribute('data-blocks'))[0].color,'#405f76');
  }
 }],
 ['colour words and next block stay correct',async p=>{
  await p.locator('#glossy-category').selectOption('mixed');await p.locator('[data-glossy-item]').first().press('Enter');
  await p.locator('#glossy-colour').evaluate(n=>{n.value='#405f76';n.dispatchEvent(new Event('input',{bubbles:true}));});
  let blocks=JSON.parse(await p.locator('#glossy-board').getAttribute('data-blocks'));assert.equal(blocks[0].color,'#405f76','palette recolours a selected block');
  await p.locator('[data-glossy-item]').nth(1).press('Enter');blocks=JSON.parse(await p.locator('#glossy-board').getAttribute('data-blocks'));assert.equal(blocks[1].color,'#f5c84d','next shelf block keeps its displayed colour');
  await p.locator('#again').click();assert.equal(await p.locator('#glossy-colour').inputValue(),'#ed7b75','Again resets colour UI');
 }],
 ['Escape and window blur cancel drags',async p=>{
  for(const mode of ['Escape','blur']){const a=await p.locator('[data-glossy-item]').first().boundingBox(),b=await p.locator('#glossy-board').evaluate(n=>{const p=new DOMPoint(300,250).matrixTransform(n.getScreenCTM());return{x:p.x,y:p.y};});
   await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:8});if(mode==='Escape')await p.keyboard.press('Escape');else await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.mouse.up();assert.equal(await p.locator('[data-glossy-placed]').count(),0,mode+' must not commit a drop');
  }
 }],
 ['new game and chooser guide match actual controls',async p=>{
  await p.locator('#how-to-play').click();assert(!/undefined/.test(await p.locator('#guide-panel').textContent()),'game guide has a real title');assert(/Glossy Blocks/.test(await p.locator('#guide-panel').textContent()));await p.locator('#guide-close').click();
  await p.locator('#game-home').click();await p.locator('#how-to-play').click();const words=await p.locator('#guide-panel').textContent();assert(/More games/.test(words),'chooser guide describes More games');assert(!/swipe the row|Go for new games|All games shown/i.test(words),'no obsolete chooser instructions');
 }]
]){const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'}),p=await context.newPage();try{await p.goto(base+'play.html?age=5');await p.locator('#more-games').click();await p.locator('[data-activity="glossy"]').click();await run(p);passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}finally{await context.close();}}
}finally{await browser.close();}console.log(`${engine}: ${passed} passed, ${failed} failed`);if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
