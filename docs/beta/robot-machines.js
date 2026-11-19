/* Transparent cutout assembly, separate from the free-building Blocks model. */
((root,factory)=>{
  const catalogue=typeof module==='object'&&module.exports?require('./robot-catalogue.js'):root.SaNaRobotCatalogue;
  if(typeof module==='object'&&module.exports)module.exports=factory(catalogue);
  else root.SaNaRobotMachines=factory(catalogue);
})(typeof window==='object'?window:globalThis,catalogue=>{
  'use strict';
  const poseOf=state=>catalogue.poses[state.poseId];
  const create=(poseId='standing',age=4)=>{const pose=catalogue.poses[poseId]||catalogue.poses.standing;return{poseId:pose.id,age:Number(age),placed:{},bounds:{x:0,y:0,width:pose.width,height:pose.height}};};
  const fittedCount=state=>Object.values(state.placed).filter(part=>part.fitted).length;
  const isComplete=state=>fittedCount(state)===poseOf(state).parts.length;
  /** Drop coordinates use the common source canvas, independent of screen size. */
  function drop(state,id,cx,cy){
    const pose=poseOf(state),part=pose.parts.find(piece=>piece.id===id),bounds=state.bounds;
    if(!part||![cx,cy].every(Number.isFinite))return false;
    const distance=Math.hypot(cx-part.x-part.width/2,cy-part.y-part.height/2);
    const fitted=distance<=(state.age===4?112:72);
    state.placed[id]={x:fitted?part.x:Math.max(bounds.x,Math.min(bounds.x+bounds.width-part.width,cx-part.width/2)),y:fitted?part.y:Math.max(bounds.y,Math.min(bounds.y+bounds.height-part.height,cy-part.height/2)),fitted};
    return fitted;
  }
  function remove(state,id){delete state.placed[id];}
  /** Expand the source coordinate space to cover the visible pane without stretching art. */
  function resizeCanvas(state,width,height){
    if(![width,height].every(n=>Number.isFinite(n)&&n>0))return false;
    const pose=poseOf(state),ratio=width/height;
    const next=ratio>=pose.width/pose.height?{x:(pose.width-pose.height*ratio)/2,y:0,width:pose.height*ratio,height:pose.height}:{x:0,y:(pose.height-pose.width/ratio)/2,width:pose.width,height:pose.width/ratio};
    const old=state.bounds;if(Object.keys(next).every(k=>Math.abs(next[k]-old[k])<.00001))return false;
    for(const part of pose.parts){const at=state.placed[part.id];if(!at||at.fitted)continue;
      const fx=Math.max(0,Math.min(1,(at.x-old.x)/(old.width-part.width))),fy=Math.max(0,Math.min(1,(at.y-old.y)/(old.height-part.height)));
      state.placed[part.id]={...at,x:next.x+fx*(next.width-part.width),y:next.y+fy*(next.height-part.height)};
    }
    state.bounds=next;return true;
  }
  const core={create,drop,remove,fittedCount,isComplete,resizeCanvas};
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount({scene,hint,feedback,complete,onReset}){
    const room=document.createElement('section');room.id='robot-machines-room';room.hidden=true;
    room.setAttribute('aria-label','Robot cutout assembly');
    room.innerHTML=`<div id="robot-age-note" hidden>Robot cutouts are ready for ages 4 and 5. Choose 4 or 5 above to build.</div>
      <div class="robot-workspace">
        <section class="robot-stores" aria-label="Stores">
          <div class="robot-heading"><h2>Stores</h2><label class="robot-category-label"><span class="robot-sr">Machine collection</span><select id="robot-category" aria-label="Machine collection"><option value="robots">Robots</option><option disabled>Cars — pictures pending</option><option disabled>Ships — pictures pending</option><option disabled>Planes — pictures pending</option><option disabled>Rockets — pictures pending</option></select></label></div>
          <label class="robot-variant-label"><span class="robot-sr">Robot variant</span><select id="robot-variant" aria-label="Robot variant">${Object.values(catalogue.poses).map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
          <div id="robot-parts" aria-label="Loose robot cutouts"></div>
          <nav class="robot-pages" aria-label="Stores pages"><button id="robot-previous-page" type="button" class="soft-button">Previous</button><output id="robot-page-label">1 / 2</output><button id="robot-next-page" type="button" class="soft-button">Next</button></nav>
        </section>
        <section class="robot-assemble" aria-label="Assemble">
          <div class="robot-heading"><h2>Assemble</h2><button id="robot-look" type="button" class="soft-button" aria-pressed="false">Look</button><output id="robot-progress" aria-live="polite">0 / 16 fitted</output></div>
          <div class="robot-board-wrap"><svg id="robot-board" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 848 1264" preserveAspectRatio="xMidYMid meet" role="group" tabindex="0" aria-label="Assemble robot. Select a part, then tap to place it. For keyboard placement use arrow keys and Enter."></svg><img id="robot-reference" alt="Completed standing robot reference" hidden></div>
          <div class="robot-actions"><button id="robot-remove" type="button" class="soft-button" disabled>Remove</button><button id="robot-clear" type="button" class="soft-button" disabled>Clear</button><button id="robot-done" type="button" class="soft-button" disabled>Done</button><button id="robot-snapshot" type="button" class="soft-button" disabled>Save picture</button></div>
        </section>
      </div>`;
    scene.after(room);
    const $=name=>room.querySelector('#robot-'+name),svg=$('board');
    let state=create(),active=false,selected=null,page=0,pointer=null,ghost=null,look=false,finished=false,demoTimer=null,demoActive=false,demoParts=[],keyboard=false,cursor={x:424,y:632},canvasFrame=0;
    const pose=()=>poseOf(state),ready=()=>active&&state.age>=4&&state.age<=5;
    const shelfOrder=['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'];
    const pageSize=()=>window.matchMedia('(max-height:460px) and (orientation:landscape)').matches?3:6;
    const pageCount=()=>Math.ceil(pose().parts.length/pageSize());
    function syncButtons(){
      $('progress').textContent=`${fittedCount(state)} / ${pose().parts.length} fitted`;
      $('done').disabled=!isComplete(state)||finished||demoActive||!!pointer;
      $('remove').disabled=!state.placed[selected]||finished||look||demoActive||!!pointer;
      $('clear').disabled=!Object.keys(state.placed).length||demoActive;
      $('snapshot').disabled=!Object.keys(state.placed).length||demoActive||!!pointer;
      $('variant').disabled=demoActive;$('look').disabled=demoActive;
    }
    function renderShelf(){
      page=Math.min(page,pageCount()-1);room.dataset.pageSize=pageSize();
      const ordered=shelfOrder.map(id=>pose().parts.find(part=>part.id===id));
      const parts=ready()?ordered.slice(page*pageSize(),(page+1)*pageSize()):[];
      $('parts').innerHTML=parts.map(part=>`<button type="button" data-robot-part="${part.id}" data-used="${!!state.placed[part.id]}" aria-label="${esc(part.name)}" aria-pressed="${selected===part.id}" ${state.placed[part.id]?'disabled':''}><img src="${part.asset}" alt="" draggable="false"><span>${esc(part.name)}</span></button>`).join('');
      $('page-label').textContent=`${page+1} / ${pageCount()}`;$('previous-page').disabled=page===0;$('next-page').disabled=page===pageCount()-1;
    }
    const pieceImage=(part,placed,extra='')=>`<image href="${part.asset}" x="${placed.x}" y="${placed.y}" width="${part.width}" height="${part.height}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
    function renderBoard(){
      svg.dataset.assembly=JSON.stringify(state.placed);
      svg.dataset.canvasBounds=JSON.stringify(state.bounds);
      svg.innerHTML=pose().parts.filter(p=>state.placed[p.id]).map(part=>pieceImage(part,state.placed[part.id],`data-robot-placed="${part.id}" data-fitted="${state.placed[part.id].fitted}" class="${selected===part.id?'robot-selected':''}" aria-label="${esc(part.name)}${state.placed[part.id].fitted?', fitted':''}"`)).join('');
      if(keyboard&&selected&&!state.placed[selected]&&!look){const part=pose().parts.find(p=>p.id===selected);svg.insertAdjacentHTML('beforeend',pieceImage(part,{x:cursor.x-part.width/2,y:cursor.y-part.height/2},'opacity=".5" pointer-events="none"'));}
      if(demoActive)svg.insertAdjacentHTML('beforeend',demoParts.map(({part,offset})=>pieceImage(part,{x:part.x+offset,y:part.y+offset},'class="robot-demo-piece" pointer-events="none"')).join(''));
      syncButtons();
    }
    function render(){renderShelf();renderBoard();}
    function fitCanvas(){
      canvasFrame=0;if(!ready()||svg.hidden)return;
      const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const changed=resizeCanvas(state,rect.width,rect.height),b=state.bounds;
      svg.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);
      if(changed)renderBoard();
    }
    const canvasSizes=new ResizeObserver(()=>{cancelAnimationFrame(canvasFrame);canvasFrame=requestAnimationFrame(fitCanvas);});
    canvasSizes.observe(room.querySelector('.robot-board-wrap'));
    function setLook(value){
      look=value;$('reference').hidden=!value;svg.hidden=value;
      $('look').textContent=value?'Back to build':'Look';$('look').setAttribute('aria-pressed',String(value));syncButtons();if(!value)fitCanvas();
    }
    function stopGesture(){
      if(pointer?.owner?.hasPointerCapture?.(pointer.id))pointer.owner.releasePointerCapture(pointer.id);
      pointer=null;ghost?.remove();ghost=null;delete svg.dataset.dragging;if(active)syncButtons();
    }
    function cancel(){
      stopGesture();clearTimeout(demoTimer);demoTimer=null;demoActive=false;demoParts=[];
      document.getElementById('show-me')?.setAttribute('aria-pressed','false');
      if(active)renderBoard();
    }
    function choose(id){
      if(!ready()||look||demoActive||finished)return;
      selected=id;keyboard=false;
      for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed',String(button.dataset.robotPart===id));
      renderBoard();const part=pose().parts.find(p=>p.id===id);
      hint(state.placed[id]?.fitted?`${part.name} fits. You can still drag it to move it.`:`${part.name}: drag or tap to place. It will fit when close.`);
    }
    function point(x,y){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):null;}
    function inBoard(p){const b=state.bounds;return p&&p.x>=b.x&&p.y>=b.y&&p.x<=b.x+b.width&&p.y<=b.y+b.height;}
    function placeSelected(p){
      if(!selected||!inBoard(p)||!ready()||look||finished||demoActive)return;
      const wasFitted=state.placed[selected]?.fitted;
      const fitted=drop(state,selected,p.x,p.y),part=pose().parts.find(p=>p.id===selected);
      if(fitted&&!wasFitted)feedback();
      render();
      hint(isComplete(state)?'All 16 parts fit! Tap Done.':fitted?`${part.name} fits! Choose the next part.`:`Move ${part.name.toLowerCase()} closer to its place. Look shows the full robot.`);
    }
    function makeGhost(part,x,y){
      ghost=document.createElement('img');ghost.className='robot-drag-ghost';ghost.src=part.asset;ghost.alt='';ghost.draggable=false;
      const scale=Math.min(svg.getBoundingClientRect().width/pose().width,svg.getBoundingClientRect().height/pose().height);
      ghost.style.width=`${Math.max(34,part.width*scale)}px`;ghost.style.height='auto';document.body.append(ghost);moveGhost(x,y);
    }
    function moveGhost(x,y){if(ghost){ghost.style.left=x+'px';ghost.style.top=y+'px';}}
    function down(event){
      if(!ready()||look||finished||demoActive||event.button>0||pointer)return;
      const source=event.target.closest('[data-robot-part]'),placed=event.target.closest('[data-robot-placed]');
      if(!source&&!placed&&event.currentTarget!==svg)return;
      const id=source?.dataset.robotPart||placed?.dataset.robotPlaced||selected;if(!id)return;
      choose(id);
      // Selecting renders the board, so capture on its stable root rather than a replaced image.
      const owner=source||svg,part=pose().parts.find(p=>p.id===id),p=point(event.clientX,event.clientY),previous=state.placed[id];
      pointer={id:event.pointerId,owner,part,startX:event.clientX,startY:event.clientY,moved:false,source:!!source,offsetX:previous&&placed?p.x-previous.x-part.width/2:0,offsetY:previous&&placed?p.y-previous.y-part.height/2:0};
      owner.setPointerCapture(event.pointerId);syncButtons();event.preventDefault();
    }
    function move(event){
      if(!pointer||pointer.id!==event.pointerId)return;
      if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>5)pointer.moved=true;
      if(!pointer.moved)return;
      if(!ghost){makeGhost(pointer.part,event.clientX,event.clientY);svg.dataset.dragging=pointer.part.id;}else moveGhost(event.clientX,event.clientY);
      event.preventDefault();
    }
    function up(event){
      if(!pointer||pointer.id!==event.pointerId)return;
      const drag=pointer,p=point(event.clientX,event.clientY);stopGesture();
      if(drag.moved||!drag.source){if(p){p.x-=drag.offsetX;p.y-=drag.offsetY;}placeSelected(p);}
    }
    $('parts').addEventListener('pointerdown',down);svg.addEventListener('pointerdown',down);
    for(const owner of [$('parts'),svg]){
      owner.addEventListener('pointermove',move);owner.addEventListener('pointerup',up);owner.addEventListener('pointercancel',stopGesture);owner.addEventListener('lostpointercapture',()=>{if(pointer)stopGesture();});
    }
    $('parts').addEventListener('click',event=>{const button=event.target.closest('[data-robot-part]');if(button&&event.detail===0)choose(button.dataset.robotPart);});
    svg.addEventListener('keydown',event=>{
      if(!ready()||look||finished||demoActive||!selected)return;
      const steps={ArrowLeft:[-32,0],ArrowRight:[32,0],ArrowUp:[0,-32],ArrowDown:[0,32]};
      if(steps[event.key]){event.preventDefault();keyboard=true;const b=state.bounds;cursor.x=Math.max(b.x,Math.min(b.x+b.width,cursor.x+steps[event.key][0]));cursor.y=Math.max(b.y,Math.min(b.y+b.height,cursor.y+steps[event.key][1]));renderBoard();}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();placeSelected(cursor);}
    });
    for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{stopGesture();page=Math.max(0,Math.min(pageCount()-1,page+delta));renderShelf();});
    $('look').addEventListener('click',()=>{stopGesture();setLook(!look);hint(look?'Look at the full robot. Tap Back to build when ready.':'Choose a part and fit it into Assemble.');});
    function reset(){
      cancel();onReset();state=create($('variant').value,state.age);selected=null;page=0;finished=false;keyboard=false;cursor={x:424,y:632};setLook(false);render();
      $('reference').src=pose().reference;$('reference').alt=`Completed ${pose().label.toLowerCase()} reference`;
    }
    $('variant').addEventListener('change',()=>{reset();hint('Choose a loose part and fit it into the robot.');});
    $('clear').addEventListener('click',()=>{reset();hint('Fresh assembly. Choose a robot part.');});
    $('remove').addEventListener('click',()=>{if(selected&&!finished){remove(state,selected);render();hint('Part returned to Stores.');}});
    $('done').addEventListener('click',()=>{if(isComplete(state)&&!finished){finished=true;syncButtons();complete('You built the whole robot!');}});
    $('snapshot').addEventListener('click',async()=>{
      if(!Object.keys(state.placed).length)return;
      const snapshotPose=pose(),snapshotBounds={...state.bounds},snapshotParts=Object.fromEntries(Object.entries(state.placed).map(([id,at])=>[id,{...at}]));$('snapshot').disabled=true;hint('Preparing your picture…');
      let url;
      try{
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(snapshotBounds.width);canvas.height=Math.ceil(snapshotBounds.height);const ctx=canvas.getContext('2d');
        const images=await Promise.all(snapshotPose.parts.filter(p=>snapshotParts[p.id]).map(async part=>{const image=new Image();image.src=part.asset;await image.decode();return{part,image};}));
        for(const {part,image} of images){const at=snapshotParts[part.id];ctx.drawImage(image,at.x-snapshotBounds.x,at.y-snapshotBounds.y,part.width,part.height);}
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Picture unavailable');
        url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`SaNa-robot-${snapshotPose.id}-v2.02.png`;link.click();hint('Your robot picture is ready.');
      }catch{hint('Picture could not be saved. Please try again.');}
      finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);if(active)syncButtons();}
    });
    function demo(){
      if(!ready()||finished)return;if(demoActive){cancel();hint('Your turn. Your robot pieces are still here.');return;}
      stopGesture();setLook(false);demoActive=true;demoParts=[];document.getElementById('show-me').setAttribute('aria-pressed','true');
      const sample=['chest','head','upper_arm_L'].map(id=>pose().parts.find(p=>p.id===id));let step=0;
      const next=()=>{
        if(!active||!demoActive)return;
        if(step===sample.length){cancel();hint('Your turn. Drag a part close to its place to fit it.');return;}
        const part=sample[step++];demoParts.push({part,offset:150});renderBoard();hint(`${part.name}: move close, then it fits.`);
        demoTimer=setTimeout(()=>{if(!demoActive)return;demoParts[demoParts.length-1].offset=0;renderBoard();demoTimer=setTimeout(next,900);},700);
      };next();
    }
    function start(age){
      active=true;state=create($('variant').value,age);room.hidden=false;
      $('age-note').hidden=ready();room.querySelector('.robot-workspace').hidden=!ready();reset();
      if(ready())hint('Choose a robot part. Drag or tap to place it; nearby parts fit together.');
      else hint('Choose age 4 or 5 above for the robot cutouts.');
    }
    function leave(){cancel();active=false;room.hidden=true;}
    window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);window.addEventListener('orientationchange',stopGesture);
    window.addEventListener('resize',()=>{if(active){stopGesture();renderShelf();fitCanvas();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){cancel();setLook(false);}});
    return {start,leave,cancel,demo,reset};
  }
  return {catalogue,core,mount};
});
