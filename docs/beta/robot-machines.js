/* Transparent cutout assembly, separate from the free-building Blocks model. */
((root,factory)=>{
  const catalogue=typeof module==='object'&&module.exports?require('./robot-catalogue.js'):root.SaNaRobotCatalogue;
  const viewport=typeof module==='object'&&module.exports?require('./robot-viewport.js'):root.SaNaRobotViewport;
  if(typeof module==='object'&&module.exports)module.exports=factory(catalogue,viewport);
  else root.SaNaRobotMachines=factory(catalogue,viewport);
})(typeof window==='object'?window:globalThis,(catalogue,viewport)=>{
  'use strict';
  const poseOf=state=>catalogue.poses[state.poseId];
  const create=(poseId='standing',age=4)=>{const pose=catalogue.poses[poseId]||catalogue.poses.standing;return{poseId:pose.id,age:Number(age),placed:{},bounds:{x:0,y:0,width:pose.width,height:pose.height}};};
  const fittedCount=state=>Object.values(state.placed).filter(part=>part.fitted).length;
  const isComplete=state=>fittedCount(state)===poseOf(state).parts.length;
  const shapeOf=at=>({baseScale:at?.baseScale??1,widthScale:at?.widthScale??1,heightScale:at?.heightScale??1,angle:at?.angle??0,flipX:at?.flipX??false});
  function landingScale(part,width,height,canvasScale){return [width,height,canvasScale].every(n=>Number.isFinite(n)&&n>0) ? .5*Math.min(width/part.width,height/part.height)/canvasScale : 1;}
  function partBounds(part,at){const s=shapeOf(at),a=s.angle*Math.PI/180,c=Math.abs(Math.cos(a)),n=Math.abs(Math.sin(a)),w=part.width*s.widthScale*s.baseScale,h=part.height*s.heightScale*s.baseScale,width=w*c+h*n,height=w*n+h*c;return{x:at.x+part.width/2-width/2,y:at.y+part.height/2-height/2,width,height};}
  function localPoint(part,at,p){const s=shapeOf(at),a=s.angle*Math.PI/180,c=Math.cos(a),n=Math.sin(a),dx=p.x-at.x-part.width/2,dy=p.y-at.y-part.height/2;return{x:(dx*c+dy*n)/(s.widthScale*s.baseScale*(s.flipX?-1:1))+part.width/2,y:(-dx*n+dy*c)/(s.heightScale*s.baseScale)+part.height/2};}
  function transform(state,id,patch){const part=poseOf(state).parts.find(p=>p.id===id),at=state.placed[id];if(!part||!at)return false;const s={...shapeOf(at),...patch,baseScale:at.baseScale??1};if(![s.widthScale,s.heightScale,s.angle].every(Number.isFinite))return false;s.widthScale=Math.max(.25,Math.min(4,s.widthScale));s.heightScale=Math.max(.25,Math.min(4,s.heightScale));s.angle=((s.angle%360)+360)%360;s.flipX=!!s.flipX;Object.assign(at,s);at.fitted=Math.abs(at.x-part.x)<.000001&&Math.abs(at.y-part.y)<.000001;state.bounds=worldBounds(state);return true;}
  /** Drop coordinates use the common source canvas, independent of screen size. */
  function drop(state,id,cx,cy,{snap=true,radius=state.age===4?112:72,free=false,baseScale}={}){
    const pose=poseOf(state),part=pose.parts.find(piece=>piece.id===id),bounds=state.bounds;
    if(!part||![cx,cy].every(Number.isFinite))return false;
    const distance=Math.hypot(cx-part.x-part.width/2,cy-part.y-part.height/2);
    const fitted=snap&&distance<=radius;
    const previous=state.placed[id],shape=previous&&['baseScale','widthScale','heightScale','angle','flipX'].some(k=>k in previous)?shapeOf(previous):Number.isFinite(baseScale)&&baseScale>0?{baseScale}:{};
    state.placed[id]={x:fitted?part.x:free?cx-part.width/2:Math.max(bounds.x,Math.min(bounds.x+bounds.width-part.width,cx-part.width/2)),y:fitted?part.y:free?cy-part.height/2:Math.max(bounds.y,Math.min(bounds.y+bounds.height-part.height,cy-part.height/2)),fitted,...shape};
    if(free)state.bounds=worldBounds(state);
    return fitted;
  }
  function worldBounds(state,base=state.homeBounds||state.bounds){const b=base;let x=b.x,y=b.y,right=b.x+b.width,bottom=b.y+b.height;for(const p of poseOf(state).parts){const at=state.placed[p.id];if(at){const r=partBounds(p,at);x=Math.min(x,r.x);y=Math.min(y,r.y);right=Math.max(right,r.x+r.width);bottom=Math.max(bottom,r.y+r.height);}}return{x,y,width:right-x,height:bottom-y};}
  const referenceBounds=state=>({x:0,y:0,width:poseOf(state).width,height:poseOf(state).height});
  const assemblyBounds=state=>worldBounds(state,referenceBounds(state));
  function remove(state,id){delete state.placed[id];if(state.homeBounds)state.bounds=worldBounds({...state,bounds:state.homeBounds});}
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
  const core={create,drop,remove,fittedCount,isComplete,resizeCanvas,worldBounds,assemblyBounds,shapeOf,partBounds,localPoint,transform,landingScale};
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
          <div class="robot-heading robot-control-heading"><h2>Assemble</h2><button id="robot-look" type="button" class="soft-button" aria-pressed="false">Look</button><select id="robot-part-axis" aria-label="Part dimension"><option value="both">Both</option><option value="width">Width</option><option value="height">Height</option></select><button id="robot-rotate-left" class="soft-button" type="button" aria-label="Rotate selected part counterclockwise 45 degrees">↶</button><button id="robot-rotate-right" class="soft-button" type="button" aria-label="Rotate selected part clockwise 45 degrees">↷</button><button id="robot-part-flip" class="soft-button" type="button" aria-pressed="false">Flip</button></div>
          <div class="robot-view-tools" aria-label="Selected part size or canvas zoom"><button id="robot-zoom-out" class="soft-button" type="button" aria-label="Zoom out">−</button><button id="robot-zoom-level" class="soft-button" type="button" aria-label="Reset canvas to reference 100 percent">100%</button><button id="robot-zoom-in" class="soft-button" type="button" aria-label="Zoom in">+</button><button id="robot-view-fit" class="soft-button" type="button" aria-label="Fit canvas">Fit</button><button id="robot-part-original" class="soft-button" type="button">Original</button><button id="robot-grid" class="soft-button" type="button" aria-pressed="false">Grid</button></div>
          <div class="robot-selection-row"><output id="robot-selected-label" aria-live="polite">Canvas · zoom</output><output id="robot-progress" aria-live="polite">0 / 16 fitted</output></div>
          <div class="robot-actions"><button id="robot-remove" type="button" class="soft-button" disabled>Remove</button><button id="robot-clear" type="button" class="soft-button" disabled>Clear</button><button id="robot-done" type="button" class="soft-button" disabled>Done</button><button id="robot-snapshot" type="button" class="soft-button" disabled>Save picture</button></div>
          <div class="robot-board-wrap"><svg id="robot-board" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 848 1264" preserveAspectRatio="xMidYMid meet" role="group" tabindex="0" aria-label="Robot canvas. Tap a part to resize it; drag empty space to pan. Arrow keys pan when no part is selected."></svg><img id="robot-reference" alt="Completed standing robot reference" hidden></div>
        </section>
      </div>`;
    scene.after(room);
    const $=name=>room.querySelector('#robot-'+name),svg=$('board'),app=scene.closest('#app');
    let state=create(),active=false,selected=null,page=0,pointer=null,ghost=null,look=false,finished=false,demoTimer=null,demoActive=false,demoParts=[],keyboard=false,cursor={x:424,y:632},canvasFrame=0,view=null,armed=false,pendingLayout=false,grid=false,pendingScale=null,pendingStoreScale=null;
    const touches=new Map(),masks=new Map();let demoSavedView=null;
    const pose=()=>poseOf(state),ready=()=>active&&state.age>=4&&state.age<=5;
    const shelfOrder=['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'];
    const pageSize=()=>window.matchMedia('(max-height:460px) and (orientation:landscape), (max-height:650px) and (max-width:360px)').matches?3:6;
    const pageCount=()=>Math.ceil(pose().parts.length/pageSize());
    const selectedPart=()=>selected&&state.placed[selected]&&!look&&!finished&&!demoActive?state.placed[selected]:null;
    function syncButtons(){
      const lifting=pointer?.kind==='piece'&&pointer.moved&&state.placed[pointer.part.id]?.fitted?1:0;
      $('progress').textContent=`${fittedCount(state)-lifting} / ${pose().parts.length} fitted`;
      $('done').disabled=!isComplete(state)||finished||demoActive||!!pointer;
      $('remove').disabled=!state.placed[selected]||finished||look||demoActive||!!pointer;
      $('clear').disabled=!Object.keys(state.placed).length||demoActive;
      $('snapshot').disabled=!Object.keys(state.placed).length||demoActive||!!pointer;
      $('variant').disabled=demoActive;$('look').disabled=demoActive;
      const at=selectedPart(),editable=!!at&&!pointer,s=shapeOf(at),axis=$('part-axis').value,scales=axis==='both'?[s.widthScale,s.heightScale]:[axis==='width'?s.widthScale:s.heightScale];
      $('zoom-level').textContent=at?(axis==='both'&&s.widthScale!==s.heightScale?`${Math.round(s.widthScale*100)}×${Math.round(s.heightScale*100)}%`:`${Math.round(scales[0]*100)}%`):`${Math.round((view?.zoom||1)*100)}%`;
      $('zoom-level').setAttribute('aria-label',at?'Reset selected dimension to 100 percent':'Reset canvas to reference 100 percent');
      const target=at?`${pose().parts.find(p=>p.id===selected).name} ${axis==='both'?'size':axis}`:null;$('zoom-in').setAttribute('aria-label',target?`Increase ${target}`:'Zoom in');$('zoom-out').setAttribute('aria-label',target?`Decrease ${target}`:'Zoom out');
      $('selected-label').textContent=at?`${pose().parts.find(p=>p.id===selected).name} · size`:'Canvas · zoom';
      $('zoom-in').disabled=!view||demoActive||!!pointer||(at?scales.every(n=>n>=4-.000001):view.zoom>=8);$('zoom-out').disabled=!view||demoActive||!!pointer||(at?scales.every(n=>n<=.25+.000001):view.zoom<=.5);
      $('zoom-level').disabled=!view||demoActive||!!pointer;$('view-fit').disabled=!view||demoActive||!!pointer;
      for(const id of ['part-axis','part-original','rotate-left','rotate-right','part-flip'])$(id).disabled=!editable;
      $('part-flip').setAttribute('aria-pressed',String(s.flipX));$('grid').setAttribute('aria-pressed',String(grid));$('grid').disabled=demoActive;
    }
    function renderShelf(){
      page=Math.min(page,pageCount()-1);room.dataset.pageSize=pageSize();
      const ordered=shelfOrder.map(id=>pose().parts.find(part=>part.id===id));
      const parts=ready()?ordered.slice(page*pageSize(),(page+1)*pageSize()):[];
      $('parts').innerHTML=parts.map(part=>`<button type="button" data-robot-part="${part.id}" data-used="${!!state.placed[part.id]}" aria-label="${esc(part.name)}" aria-pressed="${selected===part.id}" ${finished||demoActive?'disabled':''}><img src="${part.asset}" alt="" draggable="false"><span>${esc(part.name)}</span></button>`).join('');
      $('page-label').textContent=`${page+1} / ${pageCount()}`;$('previous-page').disabled=page===0;$('next-page').disabled=page===pageCount()-1;
    }
    const pieceImage=(part,placed,extra='')=>{const s=shapeOf(placed),cx=placed.x+part.width/2,cy=placed.y+part.height/2;return `<image href="${part.asset}" x="${placed.x}" y="${placed.y}" width="${part.width}" height="${part.height}" transform="translate(${cx} ${cy}) rotate(${s.angle}) scale(${s.baseScale*s.widthScale*(s.flipX?-1:1)} ${s.baseScale*s.heightScale}) translate(${-cx} ${-cy})" preserveAspectRatio="xMidYMid meet" ${extra}/>`;};
    function renderSelection(){svg.querySelector('[data-robot-selection]')?.remove();const at=selectedPart();if(!at||!view)return;const part=pose().parts.find(p=>p.id===selected),r=partBounds(part,at),s=viewport.scale(view),pad=4/s;svg.insertAdjacentHTML('beforeend',`<rect data-robot-selection="${part.id}" class="robot-selection-outline" x="${r.x-pad}" y="${r.y-pad}" width="${r.width+pad*2}" height="${r.height+pad*2}" rx="${3/s}" fill="none" stroke="#775400" stroke-width="${2/s}" stroke-dasharray="${5/s} ${4/s}" pointer-events="none" aria-hidden="true"/>`);}
    function renderGrid(){svg.querySelector('[data-robot-grid]')?.remove();if(!grid||!view)return;const b=viewport.rect(view),step=100,lines=[];for(let x=Math.ceil(b.x/step)*step;x<=b.x+b.width;x+=step)lines.push(`M${x} ${b.y}v${b.height}`);for(let y=Math.ceil(b.y/step)*step;y<=b.y+b.height;y+=step)lines.push(`M${b.x} ${y}h${b.width}`);svg.insertAdjacentHTML('afterbegin',`<path data-robot-grid="" d="${lines.join(' ')}" fill="none" stroke="#88a885" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6" pointer-events="none"/>`);}
    function renderBoard(){
      svg.dataset.assembly=JSON.stringify(state.placed);
      svg.dataset.canvasBounds=JSON.stringify(view?viewport.rect(view):state.bounds);
      svg.innerHTML=look?'':pose().parts.filter(p=>state.placed[p.id]).map(part=>pieceImage(part,state.placed[part.id],`data-robot-placed="${part.id}" data-fitted="${state.placed[part.id].fitted}" class="${selected===part.id?'robot-selected':''}" aria-label="${esc(part.name)}${state.placed[part.id].fitted?', fitted':''}"`)).join('');renderGrid();
      if(keyboard&&selected&&!state.placed[selected]&&!look){const part=pose().parts.find(p=>p.id===selected);svg.insertAdjacentHTML('beforeend',pieceImage(part,{x:cursor.x-part.width/2,y:cursor.y-part.height/2,baseScale:measurePendingScale(part)},'data-robot-keyboard-preview="" opacity=".5" pointer-events="none"'));}
      if(demoActive)svg.insertAdjacentHTML('beforeend',demoParts.map(({part,offset})=>pieceImage(part,{x:part.x+offset,y:part.y+offset},'class="robot-demo-piece" pointer-events="none"')).join(''));
      renderSelection();syncButtons();
    }
    function render(){renderShelf();renderBoard();}
    function renderView(){if(!view)return;const b=viewport.rect(view),s=viewport.scale(view),ref=$('reference');svg.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);svg.dataset.canvasBounds=JSON.stringify(b);svg.dataset.view=JSON.stringify({...b,zoom:view.zoom,centerX:view.centerX,centerY:view.centerY});ref.style.left=(-b.x*s)+'px';ref.style.top=(-b.y*s)+'px';ref.style.width=(pose().width*s)+'px';ref.style.height=(pose().height*s)+'px';renderGrid();renderSelection();syncButtons();}
    function fitCanvas(){
      canvasFrame=0;if(!ready()||svg.hidden)return;
      const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
      if(pointer){pendingLayout=true;return;}
      if(!view){resizeCanvas(state,rect.width,rect.height);state.homeBounds={...state.bounds};view=viewport.create(referenceBounds(state),rect.width,rect.height);}
      else viewport.resize(view,rect.width,rect.height);
      pendingLayout=false;renderView();
    }
    const canvasSizes=new ResizeObserver(()=>{cancelAnimationFrame(canvasFrame);canvasFrame=requestAnimationFrame(fitCanvas);});
    canvasSizes.observe(room.querySelector('.robot-board-wrap'));
    function setLook(value){
      if(value)deselect();look=value;$('reference').hidden=!value;svg.hidden=false;
      $('look').textContent=value?'Build':'Look';$('look').setAttribute('aria-label',value?'Back to build':'Look');$('look').setAttribute('aria-pressed',String(value));render();fitCanvas();
    }
    function stopGesture(){
      const old=pointer;pointer=null;
      if(old?.owner&&Number.isInteger(old.id)&&old.owner.hasPointerCapture?.(old.id))old.owner.releasePointerCapture(old.id);
      for(const [id,touch]of touches)if(touch.owner?.hasPointerCapture?.(id))touch.owner.releasePointerCapture(id);
      touches.clear();ghost?.remove();ghost=null;delete svg.dataset.dragging;if(active)syncButtons();
      if(pendingLayout)requestAnimationFrame(()=>{if(active){renderShelf();fitCanvas();}});
    }
    function cancel(){
      armed=false;stopGesture();if(selected&&!state.placed[selected])deselect(true);clearTimeout(demoTimer);demoTimer=null;demoActive=false;demoParts=[];
      if(demoSavedView){view=demoSavedView;demoSavedView=null;const r=svg.getBoundingClientRect();viewport.resize(view,r.width,r.height);renderView();}
      document.getElementById('show-me')?.setAttribute('aria-pressed','false');
      if(active)renderBoard();
    }
    function cancelPointer(){armed=false;keyboard=false;stopGesture();if(selected&&!state.placed[selected])deselect(true);if(active)renderBoard();}
    function choose(id,{arm=false}={}){
      if(!ready()||look||demoActive||finished)return;
      if(selected!==id){$('part-axis').value='both';pendingScale=null;pendingStoreScale=null;}selected=id;keyboard=false;armed=arm;svg.querySelector('[data-robot-keyboard-preview]')?.remove();
      for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed',String(button.dataset.robotPart===id));
      for(const node of svg.querySelectorAll('[data-robot-placed]'))node.classList.toggle('robot-selected',node.dataset.robotPlaced===id);
      const part=pose().parts.find(p=>p.id===id),at=state.placed[id];cursor=at?{x:at.x+part.width/2,y:at.y+part.height/2}:{x:pose().width/2,y:pose().height/2};
      if(at){pendingScale=null;pendingStoreScale=null;}else measurePendingScale(part);
      renderSelection();syncButtons();hint(at?`${part.name} selected.`:`Place ${part.name} in Assemble.`);
    }
    function deselect(announce=false){const changed=!!selected||armed;selected=null;armed=false;keyboard=false;pendingScale=null;pendingStoreScale=null;svg.querySelector('[data-robot-keyboard-preview]')?.remove();$('part-axis').value='both';for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed','false');for(const node of svg.querySelectorAll('.robot-selected'))node.classList.remove('robot-selected');renderSelection();syncButtons();if(announce&&(changed||app?.querySelector('#hint')?.textContent!=='Canvas: drag or zoom.'))hint('Canvas: drag or zoom.');}
    function measurePendingScale(part){const source=$('parts').querySelector(`[data-robot-part="${part.id}"] img`)?.getBoundingClientRect();if(source?.width>0&&source?.height>0)pendingStoreScale=Math.min(source.width/part.width,source.height/part.height);const m=svg.getScreenCTM(),base=m?Math.hypot(m.a,m.b)/(view?.zoom||1):0;if(pendingStoreScale>0&&base>0)pendingScale=.5*pendingStoreScale/base;return pendingScale??1;}
    function point(x,y){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):null;}
    function placeSelected(p,{snap=true}={}){
      if(!selected||!p||![p.x,p.y].every(Number.isFinite)||!ready()||look||finished||demoActive)return;
      const wasFitted=state.placed[selected]?.fitted,part=pose().parts.find(p=>p.id===selected),initialScale=state.placed[selected]?undefined:measurePendingScale(part);
      const fitted=drop(state,selected,p.x,p.y,{snap,free:true,baseScale:initialScale,radius:(state.age===4?112:72)/(view?.zoom||1)});armed=false;keyboard=false;pendingScale=null;pendingStoreScale=null;
      if(fitted&&!wasFitted)feedback();
      render();
      hint(isComplete(state)?'All 16 joined! Tap Done.':fitted?`${part.name} joined!`:`${part.name} ready.`);
    }
    function makeGhost(part,x,y){
      ghost=document.createElement('img');ghost.className='robot-drag-ghost';ghost.src=part.asset;ghost.alt='';ghost.draggable=false;
      const scale=viewport.scale(view),s=shapeOf(state.placed[part.id]||{baseScale:pendingScale??1});ghost.style.width=`${part.width*scale}px`;ghost.style.height=`${part.height*scale}px`;ghost.style.transform=`translate(-50%,-50%) rotate(${s.angle}deg) scale(${s.baseScale*s.widthScale*(s.flipX?-1:1)},${s.baseScale*s.heightScale})`;document.body.append(ghost);moveGhost(x,y);
    }
    function moveGhost(x,y){if(ghost){const m=svg.getScreenCTM(),dx=(pointer?.offsetX||0),dy=(pointer?.offsetY||0);ghost.style.left=(x-dx*m.a-dy*m.c)+'px';ghost.style.top=(y-dx*m.b-dy*m.d)+'px';}}
    function clientInside(x,y){const r=svg.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}
    function warmMask(part){
      if(masks.has(part.asset))return;
      masks.set(part.asset,null);const image=new Image();image.src=part.asset;
      image.decode().then(()=>{const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);masks.set(part.asset,{alpha:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});}).catch(()=>{masks.delete(part.asset);});
    }
    function pickPart(p,type){
      const tolerance=(type==='touch'?22:2)/viewport.scale(view);let nearest=null,distance=tolerance;
      const parts=[...pose().parts].reverse();if(armed&&state.placed[selected])parts.sort((a,b)=>a.id===selected?-1:b.id===selected?1:0);
      for(const part of parts){
        const at=state.placed[part.id];if(!at)continue;const {x,y}=localPoint(part,at,p),shape=shapeOf(at),mask=masks.get(part.asset),inside=x>=0&&x<part.width&&y>=0&&y<part.height;
        if(inside&&(!mask||mask.alpha[(Math.floor(y/part.height*mask.height)*mask.width+Math.floor(x/part.width*mask.width))*4+3]>96))return part;
        const scaleX=shape.widthScale*shape.baseScale,scaleY=shape.heightScale*shape.baseScale;
        if(!mask||Math.hypot(Math.max(0,-x,x-part.width)*scaleX,Math.max(0,-y,y-part.height)*scaleY)>tolerance)continue;
        const sx=part.width/mask.width,sy=part.height/mask.height,tx=distance/scaleX,ty=distance/scaleY,left=Math.max(0,Math.floor((x-tx)/sx)),right=Math.min(mask.width-1,Math.ceil((x+tx)/sx)),top=Math.max(0,Math.floor((y-ty)/sy)),bottom=Math.min(mask.height-1,Math.ceil((y+ty)/sy));
        for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)if(mask.alpha[(row*mask.width+col)*4+3]>96){const dx=Math.max(0,col*sx-x,x-(col+1)*sx)*scaleX,dy=Math.max(0,row*sy-y,y-(row+1)*sy)*scaleY,d=Math.hypot(dx,dy);if(d<distance){distance=d;nearest=part;}}
      }
      return nearest;
    }
    function startPinch(){
      const points=[...touches.values()];if(points.length<2)return;
      ghost?.remove();ghost=null;delete svg.dataset.dragging;armed=false;
      pointer={kind:'pinch',owner:svg,originView:{zoom:view.zoom,centerX:view.centerX,centerY:view.centerY},originMid:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},originDistance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)};
      deselect(true);
      for(const [id,touch]of touches){touch.owner=svg;svg.setPointerCapture(id);}renderBoard();
    }
    function down(event){
      if(!ready()||!view||demoActive||event.button>0)return;
      const source=event.target.closest('[data-robot-part]'),owner=source||svg;
      if(source&&(look||source.disabled||pointer))return;
      if(event.pointerType==='touch')touches.set(event.pointerId,{x:event.clientX,y:event.clientY,owner});
      if(touches.size>=2&&[...touches.values()].every(p=>clientInside(p.x,p.y))){startPinch();event.preventDefault();return;}
      if(pointer)return;
      const p=point(event.clientX,event.clientY),pending=armed&&selected&&!state.placed[selected],picked=source?pose().parts.find(p=>p.id===source.dataset.robotPart):!look&&!finished?(pending?pose().parts.find(p=>p.id===selected):pickPart(p,event.pointerType)):null;
      const explicit=!!source||!!pending;
      if(picked){choose(picked.id,{arm:!!source||armed});const previous=state.placed[picked.id],startDistance=previous?Math.hypot(previous.x-picked.x,previous.y-picked.y):Infinity,fromJoint=!!previous&&!explicit&&startDistance<=(state.age===4?112:72)/view.zoom;pointer={kind:'piece',part:picked,source:!!source,placeOnTap:!source&&explicit,fromJoint,startDistance,leftZone:!fromJoint,offsetX:previous&&!explicit?p.x-previous.x-picked.width/2:0,offsetY:previous&&!explicit?p.y-previous.y-picked.height/2:0};}
      else{deselect(true);pointer={kind:'pan',offsetX:0,offsetY:0};}
      Object.assign(pointer,{id:event.pointerId,owner,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType});
      owner.setPointerCapture(event.pointerId);syncButtons();event.preventDefault();
    }
    function move(event){
      const touch=touches.get(event.pointerId);if(touch){touch.x=event.clientX;touch.y=event.clientY;}
      if(pointer?.kind==='pinch'){
        const points=[...touches.values()];if(points.length<2)return;const mid={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),r=svg.getBoundingClientRect();
        Object.assign(view,pointer.originView);if(pointer.originDistance>0)viewport.zoomAt(view,distance/pointer.originDistance,{x:pointer.originMid.x-r.left,y:pointer.originMid.y-r.top});viewport.pan(view,mid.x-pointer.originMid.x,mid.y-pointer.originMid.y);renderView();event.preventDefault();return;
      }
      if(!pointer||pointer.id!==event.pointerId)return;
      if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>(pointer.type==='touch'?4:2))pointer.moved=true;
      if(!pointer.moved)return;
      if(pointer.kind==='pan'){viewport.pan(view,event.clientX-pointer.lastX,event.clientY-pointer.lastY);renderView();}
      else{const p=point(event.clientX,event.clientY),part=pointer.part;if(Math.hypot(p.x-pointer.offsetX-part.x-part.width/2,p.y-pointer.offsetY-part.y-part.height/2)>(state.age===4?112:72)/view.zoom)pointer.leftZone=true;if(!ghost){makeGhost(part,event.clientX,event.clientY);svg.dataset.dragging=part.id;}else moveGhost(event.clientX,event.clientY);syncButtons();}
      pointer.lastX=event.clientX;pointer.lastY=event.clientY;
      event.preventDefault();
    }
    function up(event){
      if(pointer?.kind==='pinch'){
        touches.delete(event.pointerId);if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
        if(touches.size){const [id,p]=[...touches][0];pointer={kind:'pan',id,owner:svg,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,moved:true};}else stopGesture();return;
      }
      if(!pointer||pointer.id!==event.pointerId)return;
      const drag=pointer,inside=clientInside(event.clientX,event.clientY),r=svg.getBoundingClientRect();
      const p=!inside&&drag.kind==='piece'&&!drag.source?point(Math.max(r.left+2,Math.min(r.right-2,event.clientX)),Math.max(r.top+2,Math.min(r.bottom-2,event.clientY))):point(event.clientX,event.clientY);stopGesture();
      if(drag.source&&drag.moved&&!inside){deselect(true);return;}
      if(drag.kind==='piece'&&(drag.moved||drag.placeOnTap)&&(!drag.source||inside)){p.x-=drag.offsetX;p.y-=drag.offsetY;const distance=Math.hypot(p.x-drag.part.x-drag.part.width/2,p.y-drag.part.y-drag.part.height/2),tolerance=1/viewport.scale(view),departing=distance>tolerance&&distance>=drag.startDistance-tolerance;placeSelected(p,{snap:!(drag.moved&&drag.fromJoint&&!drag.leftZone&&departing)});}
      else if(drag.source&&!drag.moved&&state.placed[selected]){const at=state.placed[selected];view.centerX=at.x+drag.part.width/2;view.centerY=at.y+drag.part.height/2;view.manual=true;renderView();}
      syncButtons();
    }
    $('parts').addEventListener('pointerdown',down);svg.addEventListener('pointerdown',down);
    for(const owner of [$('parts'),svg]){
      owner.addEventListener('pointermove',move);owner.addEventListener('pointerup',up);owner.addEventListener('pointercancel',cancelPointer);owner.addEventListener('lostpointercapture',event=>{if(pointer?.kind!=='pinch'&&pointer?.id===event.pointerId&&!pointer.owner.hasPointerCapture(event.pointerId))cancelPointer();});
    }
    $('parts').addEventListener('click',event=>{const button=event.target.closest('[data-robot-part]');if(button&&event.detail===0)choose(button.dataset.robotPart,{arm:true});});
    function resizeSelected(factor){const s=shapeOf(selectedPart()),axis=$('part-axis').value;editPart({...(axis!=='height'?{widthScale:s.widthScale*factor}:{}),...(axis!=='width'?{heightScale:s.heightScale*factor}:{})});}
    function zoom(factor){stopGesture();if(selectedPart())resizeSelected(factor);else{viewport.zoomAt(view,factor);renderView();}}
    $('zoom-in').addEventListener('click',()=>zoom(1.25));$('zoom-out').addEventListener('click',()=>zoom(.8));
    $('view-fit').addEventListener('click',()=>{stopGesture();deselect(true);viewport.fit(view,assemblyBounds(state));renderView();});
    $('zoom-level').addEventListener('click',()=>{stopGesture();if(selectedPart()){const axis=$('part-axis').value;editPart({...(axis!=='height'?{widthScale:1}:{}),...(axis!=='width'?{heightScale:1}:{})});}else{viewport.reset(view);renderView();}});
    svg.addEventListener('wheel',event=>{if(!ready()||demoActive||pointer)return;event.preventDefault();deselect(true);const r=svg.getBoundingClientRect();if(event.ctrlKey)viewport.zoomAt(view,Math.exp(-event.deltaY*.002),{x:event.clientX-r.left,y:event.clientY-r.top});else viewport.pan(view,-event.deltaX,-event.deltaY);renderView();},{passive:false});
    svg.addEventListener('keydown',event=>{
      if(!ready()||demoActive)return;
      const panSteps={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if((!selected||look||finished)&&panSteps[event.key]){event.preventDefault();viewport.pan(view,...panSteps[event.key]);renderView();return;}
      if(look||finished||!selected)return;
      const steps={ArrowLeft:[-32,0],ArrowRight:[32,0],ArrowUp:[0,-32],ArrowDown:[0,32]};
      if(steps[event.key]){event.preventDefault();keyboard=true;const b=state.bounds;cursor.x=Math.max(b.x,Math.min(b.x+b.width,cursor.x+steps[event.key][0]));cursor.y=Math.max(b.y,Math.min(b.y+b.height,cursor.y+steps[event.key][1]));renderBoard();}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();placeSelected(cursor,{snap:!state.placed[selected]?.fitted});}
    });
    for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{stopGesture();page=Math.max(0,Math.min(pageCount()-1,page+delta));renderShelf();});
    $('look').addEventListener('click',()=>{stopGesture();setLook(!look);hint(look?'Look at the robot. Tap Build to return.':'Choose a part and fit it into Assemble.');});
    $('part-axis').addEventListener('change',syncButtons);
    function editPart(patch){if(!state.placed[selected]||finished||look||demoActive)return;stopGesture();if(transform(state,selected,patch)){render();renderView();}}
    $('rotate-left').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle-45}));$('rotate-right').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle+45}));$('part-flip').addEventListener('click',()=>editPart({flipX:!shapeOf(state.placed[selected]).flipX}));$('part-original').addEventListener('click',()=>editPart({widthScale:1,heightScale:1,angle:0,flipX:false}));
    $('grid').addEventListener('click',()=>{grid=!grid;renderGrid();syncButtons();});
    function reset(){
      cancel();onReset();state=create($('variant').value,state.age);view=null;armed=false;pendingScale=null;pendingStoreScale=null;selected=null;page=0;finished=false;keyboard=false;cursor={x:424,y:632};$('part-axis').value='both';setLook(false);render();fitCanvas();pose().parts.forEach(warmMask);
      $('reference').src=pose().reference;$('reference').alt=`Completed ${pose().label.toLowerCase()} reference`;
    }
    $('variant').addEventListener('change',()=>{reset();hint('Choose a loose part and fit it into the robot.');});
    $('clear').addEventListener('click',()=>{reset();hint('Fresh assembly. Choose a robot part.');});
    $('remove').addEventListener('click',()=>{if(selected&&!finished){remove(state,selected);deselect();render();hint('Part returned to Stores.');}});
    $('done').addEventListener('click',()=>{if(isComplete(state)&&!finished){finished=true;deselect();syncButtons();complete('You built the whole robot!');}});
    $('snapshot').addEventListener('click',async()=>{
      if(!Object.keys(state.placed).length)return;
      const snapshotPose=pose(),snapshotBounds=worldBounds(state),snapshotParts=Object.fromEntries(Object.entries(state.placed).map(([id,at])=>[id,{...at}]));$('snapshot').disabled=true;hint('Preparing your picture…');
      let url;
      try{
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(snapshotBounds.width);canvas.height=Math.ceil(snapshotBounds.height);const ctx=canvas.getContext('2d');
        const images=await Promise.all(snapshotPose.parts.filter(p=>snapshotParts[p.id]).map(async part=>{const image=new Image();image.src=part.asset;await image.decode();return{part,image};}));
        for(const {part,image} of images){const at=snapshotParts[part.id],s=shapeOf(at);ctx.save();ctx.translate(at.x+part.width/2-snapshotBounds.x,at.y+part.height/2-snapshotBounds.y);ctx.rotate(s.angle*Math.PI/180);ctx.scale(s.baseScale*s.widthScale*(s.flipX?-1:1),s.baseScale*s.heightScale);ctx.drawImage(image,-part.width/2,-part.height/2,part.width,part.height);ctx.restore();}
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Picture unavailable');
        url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`SaNa-robot-${snapshotPose.id}-v2.05.png`;link.click();hint('Your robot picture is ready.');
      }catch{hint('Picture could not be saved. Please try again.');}
      finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);if(active)syncButtons();}
    });
    function demo(){
      if(!ready()||finished)return;if(demoActive){cancel();hint('Your turn. Your robot pieces are still here.');return;}
      stopGesture();setLook(false);demoSavedView={...view,basis:{...view.basis}};viewport.reset(view);renderView();demoActive=true;demoParts=[];document.getElementById('show-me').setAttribute('aria-pressed','true');
      const sample=['chest','head','upper_arm_L'].map(id=>pose().parts.find(p=>p.id===id));let step=0;
      const next=()=>{
        if(!active||!demoActive)return;
        if(step===sample.length){cancel();hint('Your turn. Drag a part close to its place to fit it.');return;}
        const part=sample[step++];demoParts.push({part,offset:150});renderBoard();hint(`${part.name}: move close, then it fits.`);
        demoTimer=setTimeout(()=>{if(!demoActive)return;demoParts[demoParts.length-1].offset=0;renderBoard();demoTimer=setTimeout(next,900);},700);
      };next();
    }
    function start(age){
      active=true;app?.classList.add('robot-active');state=create($('variant').value,age);room.hidden=false;
      $('age-note').hidden=ready();room.querySelector('.robot-workspace').hidden=!ready();reset();
      if(ready())hint('Choose a robot part. Drag or tap to place it; nearby parts fit together.');
      else hint('Choose age 4 or 5 above for the robot cutouts.');
    }
    function leave(){cancel();active=false;room.hidden=true;app?.classList.remove('robot-active');}
    window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);window.addEventListener('orientationchange',cancelPointer);
    window.addEventListener('resize',()=>{if(active){if(pointer){pendingLayout=true;return;}renderShelf();fitCanvas();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){cancel();deselect();setLook(false);}});
    return {start,leave,cancel,demo,reset};
  }
  return {catalogue,core,mount};
});
