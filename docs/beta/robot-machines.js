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
  const shapeOf=at=>({widthScale:at?.widthScale??1,heightScale:at?.heightScale??1,angle:at?.angle??0,flipX:at?.flipX??false});
  function partBounds(part,at){const s=shapeOf(at),a=s.angle*Math.PI/180,c=Math.abs(Math.cos(a)),n=Math.abs(Math.sin(a)),w=part.width*s.widthScale,h=part.height*s.heightScale,width=w*c+h*n,height=w*n+h*c;return{x:at.x+part.width/2-width/2,y:at.y+part.height/2-height/2,width,height};}
  function localPoint(part,at,p){const s=shapeOf(at),a=s.angle*Math.PI/180,c=Math.cos(a),n=Math.sin(a),dx=p.x-at.x-part.width/2,dy=p.y-at.y-part.height/2;return{x:(dx*c+dy*n)/(s.widthScale*(s.flipX?-1:1))+part.width/2,y:(-dx*n+dy*c)/s.heightScale+part.height/2};}
  function transform(state,id,patch){const part=poseOf(state).parts.find(p=>p.id===id),at=state.placed[id];if(!part||!at)return false;const s={...shapeOf(at),...patch};if(![s.widthScale,s.heightScale,s.angle].every(Number.isFinite))return false;s.widthScale=Math.max(.5,Math.min(1.5,s.widthScale));s.heightScale=Math.max(.5,Math.min(1.5,s.heightScale));s.angle=((s.angle%360)+360)%360;s.flipX=!!s.flipX;Object.assign(at,s);at.fitted=s.widthScale===1&&s.heightScale===1&&s.angle===0&&!s.flipX&&Math.abs(at.x-part.x)<.000001&&Math.abs(at.y-part.y)<.000001;state.bounds=worldBounds(state);return true;}
  /** Drop coordinates use the common source canvas, independent of screen size. */
  function drop(state,id,cx,cy,{snap=true,radius=state.age===4?112:72,free=false}={}){
    const pose=poseOf(state),part=pose.parts.find(piece=>piece.id===id),bounds=state.bounds;
    if(!part||![cx,cy].every(Number.isFinite))return false;
    const distance=Math.hypot(cx-part.x-part.width/2,cy-part.y-part.height/2);
    const fitted=snap&&distance<=radius;
    const previous=state.placed[id],shape=!fitted&&previous&&['widthScale','heightScale','angle','flipX'].some(k=>k in previous)?shapeOf(previous):{};
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
  const core={create,drop,remove,fittedCount,isComplete,resizeCanvas,worldBounds,assemblyBounds,shapeOf,partBounds,localPoint,transform};
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
          <div class="robot-heading"><h2>Assemble</h2><button id="robot-look" type="button" class="soft-button" aria-pressed="false">Look</button><button id="robot-tools-toggle" type="button" class="soft-button" aria-expanded="false" aria-controls="robot-tools-panel">Tools</button><output id="robot-progress" aria-live="polite">0 / 16 fitted</output></div>
          <div class="robot-view-tools" aria-label="Canvas view"><button id="robot-zoom-out" class="soft-button" type="button" aria-label="Zoom out">−</button><button id="robot-zoom-level" class="soft-button" type="button" aria-label="Reset canvas to reference 100 percent" title="Return to reference 100%">100%</button><button id="robot-zoom-in" class="soft-button" type="button" aria-label="Zoom in">+</button><button id="robot-view-fit" class="soft-button" type="button" aria-label="Fit canvas">Fit</button><button id="robot-pan" class="soft-button" type="button" aria-pressed="false">Move canvas</button></div><output id="robot-selected-label" aria-live="polite">Choose a part</output>
          <div class="robot-board-wrap"><svg id="robot-board" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 848 1264" preserveAspectRatio="xMidYMid meet" role="group" tabindex="0" aria-label="Assemble robot. Select a part, then tap to place it. For keyboard placement use arrow keys and Enter."></svg><img id="robot-reference" alt="Completed standing robot reference" hidden></div>
          <div class="robot-actions"><button id="robot-remove" type="button" class="soft-button" disabled>Remove</button><button id="robot-clear" type="button" class="soft-button" disabled>Clear</button><button id="robot-done" type="button" class="soft-button" disabled>Done</button><button id="robot-snapshot" type="button" class="soft-button" disabled>Save picture</button></div>
        </section>
      </div>`;
    scene.after(room);
    const tools=document.createElement('section');tools.id='robot-tools-panel';tools.hidden=true;tools.tabIndex=-1;tools.setAttribute('role','group');tools.setAttribute('aria-label','Assembly tools');
    tools.innerHTML='<div class="robot-tools-title"><strong>Part size</strong><button id="robot-tools-close" type="button" aria-label="Close assembly tools">×</button></div><div class="robot-tools-row"><select id="robot-part-axis" aria-label="Part dimension"><option value="both">Both</option><option value="width">Width</option><option value="height">Height</option></select><button id="robot-part-decrease" type="button" aria-label="Decrease selected part size">−</button><button id="robot-part-percent" type="button" aria-label="Reset selected dimension to 100 percent">100%</button><button id="robot-part-increase" type="button" aria-label="Increase selected part size">+</button></div><div class="robot-tools-row"><button id="robot-rotate-left" type="button" aria-label="Rotate selected part counterclockwise 45 degrees">↶</button><button id="robot-rotate-right" type="button" aria-label="Rotate selected part clockwise 45 degrees">↷</button><button id="robot-part-flip" type="button" aria-pressed="false">Flip</button><button id="robot-part-original" type="button">Original</button></div><div class="robot-tools-row"><button id="robot-grid" type="button" aria-pressed="false">Grid</button><small>100% = original part.<br>Original resets size and turn.</small></div>';document.body.append(tools);
    const $=name=>room.querySelector('#robot-'+name)||tools.querySelector('#robot-'+name),svg=$('board');
    let state=create(),active=false,selected=null,page=0,pointer=null,ghost=null,look=false,finished=false,demoTimer=null,demoActive=false,demoParts=[],keyboard=false,cursor={x:424,y:632},canvasFrame=0,view=null,panMode=false,armed=false,pendingLayout=false,grid=false;
    const touches=new Map(),masks=new Map();let demoSavedView=null;
    const pose=()=>poseOf(state),ready=()=>active&&state.age>=4&&state.age<=5;
    const shelfOrder=['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'];
    const pageSize=()=>window.matchMedia('(max-height:460px) and (orientation:landscape)').matches?3:6;
    const pageCount=()=>Math.ceil(pose().parts.length/pageSize());
    function syncButtons(){
      const lifting=pointer?.kind==='piece'&&pointer.moved&&state.placed[pointer.part.id]?.fitted?1:0;
      $('progress').textContent=`${fittedCount(state)-lifting} / ${pose().parts.length} fitted`;
      $('done').disabled=!isComplete(state)||finished||demoActive||!!pointer;
      $('remove').disabled=!state.placed[selected]||finished||look||demoActive||!!pointer;
      $('clear').disabled=!Object.keys(state.placed).length||demoActive;
      $('snapshot').disabled=!Object.keys(state.placed).length||demoActive||!!pointer;
      $('variant').disabled=demoActive;$('look').disabled=demoActive;
      $('zoom-level').textContent=`${Math.round((view?.zoom||1)*100)}%`;
      $('zoom-in').disabled=!view||demoActive||view.zoom>=8;$('zoom-out').disabled=!view||demoActive||view.zoom<=.5;
      $('zoom-level').disabled=!view||demoActive;$('view-fit').disabled=!view||demoActive;$('pan').disabled=!view||demoActive;$('pan').setAttribute('aria-pressed',String(panMode));room.dataset.pan=String(panMode);
      $('tools-toggle').disabled=!ready()||demoActive;const editable=!!state.placed[selected]&&!finished&&!look&&!demoActive&&!pointer,s=shapeOf(state.placed[selected]);
      for(const id of ['part-axis','part-percent','part-original','rotate-left','rotate-right','part-flip'])$(id).disabled=!editable;
      const axis=$('part-axis').value,scales=axis==='both'?[s.widthScale,s.heightScale]:[axis==='width'?s.widthScale:s.heightScale];$('part-increase').disabled=!editable||scales.every(n=>n>=1.5-.000001);$('part-decrease').disabled=!editable||scales.every(n=>n<=.5+.000001);
      $('part-percent').textContent=axis==='both'&&s.widthScale!==s.heightScale?`${Math.round(s.widthScale*100)}×${Math.round(s.heightScale*100)}%`:`${Math.round(scales[0]*100)}%`;$('part-flip').setAttribute('aria-pressed',String(s.flipX));$('grid').setAttribute('aria-pressed',String(grid));$('grid').disabled=demoActive;
    }
    function renderShelf(){
      page=Math.min(page,pageCount()-1);room.dataset.pageSize=pageSize();
      const ordered=shelfOrder.map(id=>pose().parts.find(part=>part.id===id));
      const parts=ready()?ordered.slice(page*pageSize(),(page+1)*pageSize()):[];
      $('parts').innerHTML=parts.map(part=>`<button type="button" data-robot-part="${part.id}" data-used="${!!state.placed[part.id]}" aria-label="${esc(part.name)}" aria-pressed="${selected===part.id}" ${finished||demoActive?'disabled':''}><img src="${part.asset}" alt="" draggable="false"><span>${esc(part.name)}</span></button>`).join('');
      $('page-label').textContent=`${page+1} / ${pageCount()}`;$('previous-page').disabled=page===0;$('next-page').disabled=page===pageCount()-1;
    }
    const pieceImage=(part,placed,extra='')=>{const s=shapeOf(placed),cx=placed.x+part.width/2,cy=placed.y+part.height/2;return `<image href="${part.asset}" x="${placed.x}" y="${placed.y}" width="${part.width}" height="${part.height}" transform="translate(${cx} ${cy}) rotate(${s.angle}) scale(${s.widthScale*(s.flipX?-1:1)} ${s.heightScale}) translate(${-cx} ${-cy})" preserveAspectRatio="xMidYMid meet" ${extra}/>`;};
    function renderGrid(){svg.querySelector('[data-robot-grid]')?.remove();if(!grid||!view)return;const b=viewport.rect(view),step=100,lines=[];for(let x=Math.ceil(b.x/step)*step;x<=b.x+b.width;x+=step)lines.push(`M${x} ${b.y}v${b.height}`);for(let y=Math.ceil(b.y/step)*step;y<=b.y+b.height;y+=step)lines.push(`M${b.x} ${y}h${b.width}`);svg.insertAdjacentHTML('afterbegin',`<path data-robot-grid="" d="${lines.join(' ')}" fill="none" stroke="#88a885" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6" pointer-events="none"/>`);}
    function renderBoard(){
      svg.dataset.assembly=JSON.stringify(state.placed);
      svg.dataset.canvasBounds=JSON.stringify(view?viewport.rect(view):state.bounds);
      svg.innerHTML=look?'':pose().parts.filter(p=>state.placed[p.id]).map(part=>pieceImage(part,state.placed[part.id],`data-robot-placed="${part.id}" data-fitted="${state.placed[part.id].fitted}" class="${selected===part.id?'robot-selected':''}" aria-label="${esc(part.name)}${state.placed[part.id].fitted?', fitted':''}"`)).join('');renderGrid();
      if(keyboard&&selected&&!state.placed[selected]&&!look){const part=pose().parts.find(p=>p.id===selected);svg.insertAdjacentHTML('beforeend',pieceImage(part,{x:cursor.x-part.width/2,y:cursor.y-part.height/2},'opacity=".5" pointer-events="none"'));}
      if(demoActive)svg.insertAdjacentHTML('beforeend',demoParts.map(({part,offset})=>pieceImage(part,{x:part.x+offset,y:part.y+offset},'class="robot-demo-piece" pointer-events="none"')).join(''));
      syncButtons();
    }
    function render(){renderShelf();renderBoard();}
    function renderView(){if(!view)return;const b=viewport.rect(view),s=viewport.scale(view),ref=$('reference');svg.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);svg.dataset.canvasBounds=JSON.stringify(b);svg.dataset.view=JSON.stringify({...b,zoom:view.zoom,centerX:view.centerX,centerY:view.centerY});ref.style.left=(-b.x*s)+'px';ref.style.top=(-b.y*s)+'px';ref.style.width=(pose().width*s)+'px';ref.style.height=(pose().height*s)+'px';renderGrid();syncButtons();}
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
      look=value;$('reference').hidden=!value;svg.hidden=false;
      $('look').textContent=value?'Back to build':'Look';$('look').setAttribute('aria-pressed',String(value));render();fitCanvas();
    }
    function stopGesture(){
      const old=pointer;pointer=null;
      if(old?.owner&&Number.isInteger(old.id)&&old.owner.hasPointerCapture?.(old.id))old.owner.releasePointerCapture(old.id);
      for(const [id,touch]of touches)if(touch.owner?.hasPointerCapture?.(id))touch.owner.releasePointerCapture(id);
      touches.clear();ghost?.remove();ghost=null;delete svg.dataset.dragging;if(active)syncButtons();
      if(pendingLayout)requestAnimationFrame(()=>{if(active){renderShelf();fitCanvas();}});
    }
    function cancel(){
      closeTools();armed=false;stopGesture();clearTimeout(demoTimer);demoTimer=null;demoActive=false;demoParts=[];
      if(demoSavedView){view=demoSavedView;demoSavedView=null;const r=svg.getBoundingClientRect();viewport.resize(view,r.width,r.height);renderView();}
      document.getElementById('show-me')?.setAttribute('aria-pressed','false');
      if(active)renderBoard();
    }
    function cancelPointer(){armed=false;keyboard=false;stopGesture();if(active)renderBoard();}
    function choose(id,{arm=false}={}){
      if(!ready()||look||demoActive||finished)return;
      selected=id;keyboard=false;armed=arm;panMode=false;
      for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed',String(button.dataset.robotPart===id));
      for(const node of svg.querySelectorAll('[data-robot-placed]'))node.classList.toggle('robot-selected',node.dataset.robotPlaced===id);
      const part=pose().parts.find(p=>p.id===id),at=state.placed[id];cursor=at?{x:at.x+part.width/2,y:at.y+part.height/2}:{x:pose().width/2,y:pose().height/2};
      $('selected-label').textContent=part.name;syncButtons();hint(`${part.name} selected.`);
    }
    function point(x,y){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):null;}
    function placeSelected(p,{snap=true}={}){
      if(!selected||!p||![p.x,p.y].every(Number.isFinite)||!ready()||look||finished||demoActive)return;
      const wasFitted=state.placed[selected]?.fitted;
      const fitted=drop(state,selected,p.x,p.y,{snap,free:true,radius:(state.age===4?112:72)/(view?.zoom||1)}),part=pose().parts.find(p=>p.id===selected);armed=false;keyboard=false;
      if(fitted&&!wasFitted)feedback();
      render();
      hint(isComplete(state)?'All 16 parts fit! Tap Done.':fitted?`${part.name} fits!`:`${part.name} placed. Move freely or use Look.`);
    }
    function makeGhost(part,x,y){
      ghost=document.createElement('img');ghost.className='robot-drag-ghost';ghost.src=part.asset;ghost.alt='';ghost.draggable=false;
      const scale=viewport.scale(view),s=shapeOf(state.placed[part.id]);ghost.style.width=`${part.width*scale}px`;ghost.style.height=`${part.height*scale}px`;ghost.style.transform=`translate(-50%,-50%) rotate(${s.angle}deg) scale(${s.widthScale*(s.flipX?-1:1)},${s.heightScale})`;document.body.append(ghost);moveGhost(x,y);
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
      for(const part of [...pose().parts].reverse()){
        const at=state.placed[part.id];if(!at)continue;const {x,y}=localPoint(part,at,p),shape=shapeOf(at),mask=masks.get(part.asset),inside=x>=0&&x<part.width&&y>=0&&y<part.height;
        if(inside&&(!mask||mask.alpha[(Math.floor(y/part.height*mask.height)*mask.width+Math.floor(x/part.width*mask.width))*4+3]>96))return part;
        if(!mask||Math.hypot(Math.max(0,-x,x-part.width)*shape.widthScale,Math.max(0,-y,y-part.height)*shape.heightScale)>tolerance)continue;
        const sx=part.width/mask.width,sy=part.height/mask.height,tx=distance/shape.widthScale,ty=distance/shape.heightScale,left=Math.max(0,Math.floor((x-tx)/sx)),right=Math.min(mask.width-1,Math.ceil((x+tx)/sx)),top=Math.max(0,Math.floor((y-ty)/sy)),bottom=Math.min(mask.height-1,Math.ceil((y+ty)/sy));
        for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)if(mask.alpha[(row*mask.width+col)*4+3]>96){const dx=Math.max(0,col*sx-x,x-(col+1)*sx)*shape.widthScale,dy=Math.max(0,row*sy-y,y-(row+1)*sy)*shape.heightScale,d=Math.hypot(dx,dy);if(d<distance){distance=d;nearest=part;}}
      }
      return nearest;
    }
    function startPinch(){
      const points=[...touches.values()];if(points.length<2)return;
      ghost?.remove();ghost=null;delete svg.dataset.dragging;armed=false;
      pointer={kind:'pinch',owner:svg,lastMid:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},lastDistance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)};
      for(const [id,touch]of touches){touch.owner=svg;svg.setPointerCapture(id);}renderBoard();
    }
    function down(event){
      if(!ready()||!view||demoActive||event.button>0)return;
      const source=event.target.closest('[data-robot-part]'),owner=source||svg;
      if(source&&(look||source.disabled||pointer))return;
      if(event.pointerType==='touch')touches.set(event.pointerId,{x:event.clientX,y:event.clientY,owner});
      if(touches.size>=2&&[...touches.values()].every(p=>clientInside(p.x,p.y))){startPinch();event.preventDefault();return;}
      if(pointer)return;
      const p=point(event.clientX,event.clientY),picked=source?pose().parts.find(p=>p.id===source.dataset.robotPart):!look&&!panMode&&!finished?(armed&&selected?pose().parts.find(p=>p.id===selected):pickPart(p,event.pointerType)):null;
      const explicit=!!source||armed;
      if(picked){choose(picked.id,{arm:!!source||armed});const previous=state.placed[picked.id],fromJoint=!!previous&&!explicit&&Math.hypot(previous.x-picked.x,previous.y-picked.y)<=(state.age===4?112:72)/view.zoom;pointer={kind:'piece',part:picked,source:!!source,placeOnTap:!source&&explicit,fromJoint,leftZone:!fromJoint,offsetX:previous&&!explicit?p.x-previous.x-picked.width/2:0,offsetY:previous&&!explicit?p.y-previous.y-picked.height/2:0};}
      else pointer={kind:'pan',offsetX:0,offsetY:0};
      Object.assign(pointer,{id:event.pointerId,owner,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType});
      owner.setPointerCapture(event.pointerId);syncButtons();event.preventDefault();
    }
    function move(event){
      const touch=touches.get(event.pointerId);if(touch){touch.x=event.clientX;touch.y=event.clientY;}
      if(pointer?.kind==='pinch'){
        const points=[...touches.values()];if(points.length<2)return;const mid={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),r=svg.getBoundingClientRect();
        if(pointer.lastDistance>0)viewport.zoomAt(view,distance/pointer.lastDistance,{x:pointer.lastMid.x-r.left,y:pointer.lastMid.y-r.top});viewport.pan(view,mid.x-pointer.lastMid.x,mid.y-pointer.lastMid.y);pointer.lastMid=mid;pointer.lastDistance=distance;renderView();event.preventDefault();return;
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
      if(drag.kind==='piece'&&(drag.moved||drag.placeOnTap)&&(!drag.source||inside)){p.x-=drag.offsetX;p.y-=drag.offsetY;placeSelected(p,{snap:!(drag.moved&&drag.fromJoint&&!drag.leftZone)});}
      else if(drag.source&&!drag.moved&&state.placed[selected]){const at=state.placed[selected];view.centerX=at.x+drag.part.width/2;view.centerY=at.y+drag.part.height/2;view.manual=true;renderView();}
      syncButtons();
    }
    $('parts').addEventListener('pointerdown',down);svg.addEventListener('pointerdown',down);
    for(const owner of [$('parts'),svg]){
      owner.addEventListener('pointermove',move);owner.addEventListener('pointerup',up);owner.addEventListener('pointercancel',cancelPointer);owner.addEventListener('lostpointercapture',event=>{if(pointer?.kind!=='pinch'&&pointer?.id===event.pointerId&&!pointer.owner.hasPointerCapture(event.pointerId))cancelPointer();});
    }
    $('parts').addEventListener('click',event=>{const button=event.target.closest('[data-robot-part]');if(button&&event.detail===0)choose(button.dataset.robotPart,{arm:true});});
    $('zoom-in').addEventListener('click',()=>{stopGesture();viewport.zoomAt(view,1.25);renderView();});$('zoom-out').addEventListener('click',()=>{stopGesture();viewport.zoomAt(view,.8);renderView();});
    $('view-fit').addEventListener('click',()=>{stopGesture();viewport.fit(view,assemblyBounds(state));renderView();});
    $('zoom-level').addEventListener('click',()=>{stopGesture();viewport.reset(view);renderView();});
    $('pan').addEventListener('click',()=>{stopGesture();armed=false;panMode=!panMode;syncButtons();hint(panMode?'Drag the canvas in any direction.':'Choose a part to move.');});
    svg.addEventListener('wheel',event=>{if(!ready()||demoActive||pointer)return;event.preventDefault();const r=svg.getBoundingClientRect();if(event.ctrlKey)viewport.zoomAt(view,Math.exp(-event.deltaY*.002),{x:event.clientX-r.left,y:event.clientY-r.top});else viewport.pan(view,-event.deltaX,-event.deltaY);renderView();},{passive:false});
    svg.addEventListener('keydown',event=>{
      if(!ready()||look||demoActive)return;
      const panSteps={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(panMode&&panSteps[event.key]){event.preventDefault();viewport.pan(view,...panSteps[event.key]);renderView();return;}
      if(finished||!selected)return;
      const steps={ArrowLeft:[-32,0],ArrowRight:[32,0],ArrowUp:[0,-32],ArrowDown:[0,32]};
      if(steps[event.key]){event.preventDefault();keyboard=true;const b=state.bounds;cursor.x=Math.max(b.x,Math.min(b.x+b.width,cursor.x+steps[event.key][0]));cursor.y=Math.max(b.y,Math.min(b.y+b.height,cursor.y+steps[event.key][1]));renderBoard();}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();placeSelected(cursor,{snap:!state.placed[selected]?.fitted});}
    });
    for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{stopGesture();page=Math.max(0,Math.min(pageCount()-1,page+delta));renderShelf();});
    $('look').addEventListener('click',()=>{stopGesture();setLook(!look);hint(look?'Look at the full robot. Tap Back to build when ready.':'Choose a part and fit it into Assemble.');});
    function closeTools(restore=false){const open=!tools.hidden;tools.hidden=true;$('tools-toggle').setAttribute('aria-expanded','false');if(restore&&open)$('tools-toggle').focus({preventScroll:true});}
    $('tools-toggle').addEventListener('click',()=>{if(!tools.hidden){closeTools();return;}syncButtons();tools.hidden=false;$('tools-toggle').setAttribute('aria-expanded','true');const r=$('tools-toggle').getBoundingClientRect(),w=tools.offsetWidth,h=tools.offsetHeight,selectedRect=svg.querySelector(`[data-robot-placed="${selected}"]`)?.getBoundingClientRect(),left=Math.max(8,Math.min(innerWidth-w-8,r.right-w)),candidates=[r.bottom+6,r.top-h-6,8].map(y=>Math.max(8,Math.min(innerHeight-h-8,y))),covers=y=>selectedRect&&left<selectedRect.right&&left+w>selectedRect.left&&y<selectedRect.bottom&&y+h>selectedRect.top;tools.style.left=left+'px';tools.style.top=(candidates.find(y=>!covers(y))??candidates[0])+'px';tools.focus({preventScroll:true});});
    $('tools-close').addEventListener('click',()=>closeTools(true));$('part-axis').addEventListener('change',syncButtons);
    function editPart(patch){if(!state.placed[selected]||finished||look||demoActive)return;stopGesture();armed=false;if(transform(state,selected,patch)){render();renderView();hint('Part changed. Fit at its joint to restore the original shape.');}}
    for(const [id,factor]of[['part-decrease',1/1.1],['part-increase',1.1]])$(id).addEventListener('click',()=>{const s=shapeOf(state.placed[selected]),axis=$('part-axis').value;editPart({...s,...(axis!=='height'?{widthScale:s.widthScale*factor}:{}),...(axis!=='width'?{heightScale:s.heightScale*factor}:{})});});
    $('part-percent').addEventListener('click',()=>{const axis=$('part-axis').value;editPart({...shapeOf(state.placed[selected]),...(axis!=='height'?{widthScale:1}:{}),...(axis!=='width'?{heightScale:1}:{})});});
    $('rotate-left').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle-45}));$('rotate-right').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle+45}));$('part-flip').addEventListener('click',()=>editPart({flipX:!shapeOf(state.placed[selected]).flipX}));$('part-original').addEventListener('click',()=>editPart({widthScale:1,heightScale:1,angle:0,flipX:false}));
    $('grid').addEventListener('click',()=>{grid=!grid;renderGrid();syncButtons();});
    document.addEventListener('pointerdown',event=>{if(!tools.hidden&&!tools.contains(event.target)&&!$('tools-toggle').contains(event.target))closeTools();},{capture:true});
    function reset(){
      cancel();onReset();state=create($('variant').value,state.age);view=null;armed=false;panMode=false;selected=null;page=0;finished=false;keyboard=false;cursor={x:424,y:632};$('selected-label').textContent='Choose a part';setLook(false);render();fitCanvas();pose().parts.forEach(warmMask);
      $('reference').src=pose().reference;$('reference').alt=`Completed ${pose().label.toLowerCase()} reference`;
    }
    $('variant').addEventListener('change',()=>{reset();hint('Choose a loose part and fit it into the robot.');});
    $('clear').addEventListener('click',()=>{reset();hint('Fresh assembly. Choose a robot part.');});
    $('remove').addEventListener('click',()=>{if(selected&&!finished){remove(state,selected);render();hint('Part returned to Stores.');}});
    $('done').addEventListener('click',()=>{if(isComplete(state)&&!finished){finished=true;syncButtons();complete('You built the whole robot!');}});
    $('snapshot').addEventListener('click',async()=>{
      if(!Object.keys(state.placed).length)return;
      const snapshotPose=pose(),snapshotBounds=worldBounds(state),snapshotParts=Object.fromEntries(Object.entries(state.placed).map(([id,at])=>[id,{...at}]));$('snapshot').disabled=true;hint('Preparing your picture…');
      let url;
      try{
        const canvas=document.createElement('canvas');canvas.width=Math.ceil(snapshotBounds.width);canvas.height=Math.ceil(snapshotBounds.height);const ctx=canvas.getContext('2d');
        const images=await Promise.all(snapshotPose.parts.filter(p=>snapshotParts[p.id]).map(async part=>{const image=new Image();image.src=part.asset;await image.decode();return{part,image};}));
        for(const {part,image} of images){const at=snapshotParts[part.id],s=shapeOf(at);ctx.save();ctx.translate(at.x+part.width/2-snapshotBounds.x,at.y+part.height/2-snapshotBounds.y);ctx.rotate(s.angle*Math.PI/180);ctx.scale(s.widthScale*(s.flipX?-1:1),s.heightScale);ctx.drawImage(image,-part.width/2,-part.height/2,part.width,part.height);ctx.restore();}
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Picture unavailable');
        url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`SaNa-robot-${snapshotPose.id}-v2.04.png`;link.click();hint('Your robot picture is ready.');
      }catch{hint('Picture could not be saved. Please try again.');}
      finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);if(active)syncButtons();}
    });
    function demo(){
      if(!ready()||finished)return;if(demoActive){cancel();hint('Your turn. Your robot pieces are still here.');return;}
      closeTools();stopGesture();setLook(false);demoSavedView={...view,basis:{...view.basis}};viewport.reset(view);renderView();demoActive=true;demoParts=[];document.getElementById('show-me').setAttribute('aria-pressed','true');
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
    window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);window.addEventListener('orientationchange',cancelPointer);
    window.addEventListener('resize',()=>{closeTools();if(active){if(pointer){pendingLayout=true;return;}renderShelf();fitCanvas();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){cancel();setLook(false);}});
    return {start,leave,cancel,demo,reset};
  }
  return {catalogue,core,mount};
});
