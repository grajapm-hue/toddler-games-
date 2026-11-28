/* Free building with transparent machine parts. */
((root,factory)=>{
  const catalogue=typeof module==='object'&&module.exports?require('./robot-catalogue.js'):root.SaNaRobotCatalogue;
  const viewport=typeof module==='object'&&module.exports?require('./robot-viewport.js'):root.SaNaRobotViewport;
  if(typeof module==='object'&&module.exports)module.exports=factory(catalogue,viewport);
  else root.SaNaRobotMachines=factory(catalogue,viewport);
})(typeof window==='object'?window:globalThis,(catalogue,viewport)=>{
  'use strict';
  // Standalone SVG connector artwork; no network assets or third-party libraries.
  const connectorSVG=(kind,color)=>{
    const ribs=Array.from({length:7},(_,i)=>`<ellipse cx="60" cy="${36+i*18}" rx="${kind==='spring'?25:32}" ry="9" fill="none" stroke="url(#metal)" stroke-width="${kind==='spring'?8:11}"/><path d="M${kind==='spring'?40:32} ${33+i*18} Q60 ${25+i*18} ${kind==='spring'?80:88} ${33+i*18}" fill="none" stroke="#fff" opacity=".72" stroke-width="3"/>`).join('');
    const tube=kind==='elbow45'?'M37 151 L37 99 Q37 73 61 60 L94 40':kind==='elbow90'?'M35 151 V85 Q35 49 74 49 H101':'';
    const body=tube?`<path d="${tube}" fill="none" stroke="#183d5c" stroke-width="43" stroke-linecap="round"/><path d="${tube}" fill="none" stroke="url(#metal)" stroke-width="35" stroke-linecap="round"/><path d="${tube}" fill="none" stroke="#fff" stroke-width="8" opacity=".8" stroke-dasharray="12 9"/>`:kind==='coupler'?`<rect x="25" y="48" width="70" height="83" rx="17" fill="url(#metal)" stroke="#20405b" stroke-width="4"/><path d="M40 54V125" stroke="white" opacity=".8" stroke-width="8"/><rect x="19" y="46" width="82" height="16" rx="5" fill="url(#silver)"/><rect x="19" y="117" width="82" height="16" rx="5" fill="url(#silver)"/>`:`<rect x="29" y="22" width="62" height="138" rx="13" fill="url(#metal)" stroke="#1e455d" stroke-width="4"/>${ribs}`;
    const collars=(!tube&&kind!=='coupler')?`<rect x="23" y="11" width="74" height="23" rx="7" fill="url(#silver)" stroke="#26455d" stroke-width="3"/><rect x="23" y="145" width="74" height="23" rx="7" fill="url(#silver)" stroke="#26455d" stroke-width="3"/>`:'';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180"><defs><linearGradient id="metal"><stop stop-color="#14364f"/><stop offset=".16" stop-color="#fff"/><stop offset=".32" stop-color="${color}"/><stop offset=".55" stop-color="#e9ffff"/><stop offset=".72" stop-color="${color}"/><stop offset="1" stop-color="#163a58"/></linearGradient><linearGradient id="silver"><stop stop-color="#3e687d"/><stop offset=".25" stop-color="#fff"/><stop offset=".55" stop-color="#8feaff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#37516b"/></linearGradient></defs>${body}${collars}</svg>`);
  };
  const connectorParts=[['straight','Straight bellows','#3677b9'],['spring','Spring','#4c8790'],['coupler','Short coupler','#c45c42'],['elbow45','45° elbow','#427cb9'],['elbow90','90° elbow','#d18b31'],['straight','Red bellows','#b83d38'],['straight','Black bellows','#383e47'],['coupler','Blue coupler','#3a77ad']].map(([kind,name,color],i)=>({id:'connector-'+i,name,width:120,height:180,storeScale:.8,asset:connectorSVG(kind,color)}));
  const connectorPose={id:'connectors',label:'Flexible connectors',category:'connectors',age:5,width:848,height:1264,reference:'',parts:connectorParts};
  const referenceBounds={x:0,y:0,width:catalogue.poses.standing.width,height:catalogue.poses.standing.height};
  const create=(age=5)=>({age:Number(age),placed:{},nextId:1,locked:false});
  const shapeOf=at=>({baseScale:at?.baseScale??1,widthScale:at?.widthScale??1,heightScale:at?.heightScale??1,angle:at?.angle??0,flipX:at?.flipX??false});

  const normalizeAngle=degrees=>((degrees%360)+360)%360;
  const partCenter=at=>({x:at.x+at.part.width/2,y:at.y+at.part.height/2});
  const isConnector=part=>part.id.startsWith('connector-');
  const layerRank=at=>at.layer??(isConnector(at.part)?0:Number(at.id));
  const placedByLayer=state=>Object.values(state.placed).sort((a,b)=>layerRank(a)-layerRank(b));
  function partBounds(part,at){
    const shape=shapeOf(at),angle=shape.angle*Math.PI/180;
    const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
    const w=part.width*shape.widthScale*shape.baseScale,h=part.height*shape.heightScale*shape.baseScale;
    const width=w*c+h*s,height=w*s+h*c;
    return {x:at.x+part.width/2-width/2,y:at.y+part.height/2-height/2,width,height};
  }

  function selectionContains(mode,points,x,y){
    const a=points[0],b=points.at(-1);
    if(mode==='rect')return x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)&&y>=Math.min(a.y,b.y)&&y<=Math.max(a.y,b.y);
    if(mode==='oval'){
      const rx=Math.abs(a.x-b.x)/2,ry=Math.abs(a.y-b.y)/2;
      return rx>0&&ry>0&&((x-(a.x+b.x)/2)/rx)**2+((y-(a.y+b.y)/2)/ry)**2<=1;
    }
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }

  function localPoint(part,at,p){
    const shape=shapeOf(at),angle=shape.angle*Math.PI/180;
    const c=Math.cos(angle),s=Math.sin(angle),dx=p.x-at.x-part.width/2,dy=p.y-at.y-part.height/2;
    return {
      x:(dx*c+dy*s)/(shape.widthScale*shape.baseScale*(shape.flipX?-1:1))+part.width/2,
      y:(-dx*s+dy*c)/(shape.heightScale*shape.baseScale)+part.height/2
    };
  }

  function pointOnBoard(at,point){
    const shape=shapeOf(at),center=partCenter(at),angle=shape.angle*Math.PI/180;
    const x=(point.x-at.part.width/2)*shape.baseScale*shape.widthScale*(shape.flipX?-1:1);
    const y=(point.y-at.part.height/2)*shape.baseScale*shape.heightScale;
    return {x:center.x+x*Math.cos(angle)-y*Math.sin(angle),y:center.y+x*Math.sin(angle)+y*Math.cos(angle)};
  }

  function addPart(state,part,center){
    if(state.locked||!part||![center.x,center.y].every(Number.isFinite))return null;
    const id=String(state.nextId++);
    state.placed[id]={id,part,x:center.x-part.width/2,y:center.y-part.height/2,baseScale:part.assemblyScale||part.storeScale||1};
    if(state.frontLayer&&!isConnector(part))state.placed[id].layer=++state.frontLayer;
    return id;
  }

  function movePart(state,id,center){
    const at=state.placed[id];
    if(state.locked||!at||![center.x,center.y].every(Number.isFinite))return false;
    at.x=center.x-at.part.width/2;
    at.y=center.y-at.part.height/2;
    return true;
  }

  function transform(state,id,patch){
    const at=state.placed[id];
    if(state.locked||!at)return false;
    const shape={...shapeOf(at),...patch,baseScale:at.baseScale};
    if(![shape.widthScale,shape.heightScale,shape.angle].every(Number.isFinite))return false;
    shape.widthScale=Math.max(.25,Math.min(4,shape.widthScale));
    shape.heightScale=Math.max(.25,Math.min(4,shape.heightScale));
    shape.angle=((shape.angle%360)+360)%360;
    Object.assign(at,shape);
    if(patch.angle!==undefined)delete at.turnAtFullCircle;
    return true;
  }

  function remove(state,id){if(!state.locked)delete state.placed[id];}

  const designBounds=state=>partsBounds(Object.values(state.placed));
  function partsBounds(parts){
    const boxes=parts.map(at=>partBounds(at.part,at));
    if(!boxes.length)return {...referenceBounds};
    const x=Math.min(...boxes.map(box=>box.x)),y=Math.min(...boxes.map(box=>box.y));
    const right=Math.max(...boxes.map(box=>box.x+box.width)),bottom=Math.max(...boxes.map(box=>box.y+box.height));
    return {x,y,width:right-x,height:bottom-y};
  }

  function lock(state){
    if(state.locked||!Object.keys(state.placed).length)return false;
    state.locked=true;
    return true;
  }
  const core={create,addPart,movePart,remove,transform,designBounds,shapeOf,partBounds,localPoint,lock};
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount({scene,hint,feedback,complete,onReset}){
    const room=document.createElement('section');room.id='robot-machines-room';room.hidden=true;
    room.setAttribute('aria-label','Machine assembly');
    room.innerHTML=`<div id="robot-age-note" hidden>The machine assembly trial is ready at age 5. More age groups will be added later.</div>
      <div class="robot-workspace">
        <section class="robot-stores" aria-label="Stores">
          <div class="robot-heading"><h2>Stores</h2><label class="robot-category-label"><span class="robot-sr">Machine collection</span><select id="robot-category" aria-label="Machine collection"><option value="robots">Robots</option><option value="cars">Cars</option><option disabled>Ships — later</option><option disabled>Planes — later</option><option disabled>Rockets — later</option></select></label></div>
          <label class="robot-store-label"><span class="robot-sr">Parts store</span><select id="robot-store" aria-label="Parts store"><option value="parts">Parts</option><option value="connectors">Connectors</option></select></label><label class="robot-variant-label"><span class="robot-sr">Machine model</span><select id="robot-variant" aria-label="Machine model">${Object.values(catalogue.poses).map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
          <div id="robot-parts" aria-label="Loose machine parts"></div>
          <nav class="robot-pages" aria-label="Stores pages"><button id="robot-previous-page" type="button" class="soft-button">Previous</button><output id="robot-page-label">1 / 2</output><button id="robot-next-page" type="button" class="soft-button">Next</button></nav>
        </section>
        <section class="robot-assemble" aria-label="Assemble">
          <div class="robot-heading robot-assemble-title"><h2>Assemble</h2><output id="robot-progress" aria-live="polite"></output></div>
          <div class="robot-toolbar" role="group" aria-label="Assembly tools">
            <div class="robot-tool-row robot-heading robot-control-heading"><button id="robot-look" type="button" class="soft-button" aria-pressed="false">Look</button><select id="robot-part-axis" aria-label="Part dimension"><option value="both">Both</option><option value="width">Width</option><option value="height">Height</option></select><button id="robot-rotate-left" class="soft-button" type="button" aria-label="Rotate selected part counterclockwise 45 degrees">↶</button><button id="robot-rotate-right" class="soft-button" type="button" aria-label="Rotate selected part clockwise 45 degrees">↷</button><button id="robot-copy" type="button" class="soft-button" disabled>Copy</button><button id="robot-paste" type="button" class="soft-button" disabled>Paste</button><button id="robot-remove" type="button" class="soft-button" aria-label="Remove" title="Remove selected part" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg><span>Remove</span></button><button id="robot-clear" type="button" class="soft-button" disabled>Clear</button></div>
            <div class="robot-tool-row robot-view-tools"><button id="robot-zoom-out" class="soft-button" type="button" aria-label="Zoom out">−</button><button id="robot-zoom-level" class="soft-button" type="button" aria-label="Reset canvas to reference 100 percent">100%</button><button id="robot-zoom-in" class="soft-button" type="button" aria-label="Zoom in">+</button><button id="robot-view-fit" class="soft-button" type="button" aria-label="Fit the current assembly within the canvas" title="Fit assembly to screen">Fit</button><button id="robot-grid" class="soft-button" type="button" aria-pressed="false">Grid</button><button id="robot-done" type="button" class="soft-button" disabled>Done</button><button id="robot-snapshot" type="button" class="soft-button" disabled aria-label="Save picture" title="Save picture">Save</button></div>
            <div class="robot-tool-row robot-edit-tools" role="group" aria-label="Selected part editing"><button id="robot-bring-front" type="button" class="soft-button" aria-label="Bring to Front" title="Bring to Front" disabled>Bring to Front</button><label class="robot-select-label">Select <select id="robot-selection-mode" aria-label="Selection shape · Rectangle selects all enclosed parts for color, move and resize"><option value="part">Tap part</option><option value="rect">Rectangle</option><option value="oval">Oval / Tube</option><option value="free" aria-label="Free Selection" title="Free Selection · dotted-square boundary">▧</option></select></label><label class="robot-color-label">Color <input id="robot-color" type="color" value="#8c55e9" aria-label="Choose color for selected part"/></label><button id="robot-apply-color" type="button" class="soft-button" title="Apply this color again to the selected part">Apply</button><button id="robot-part-original" class="soft-button" type="button">Original</button><button id="robot-part-mirror" class="soft-button" type="button" aria-label="Mirror selected part horizontally" aria-pressed="false" title="Flip selected part left or right">⇄ Mirror</button></div>
            <div id="robot-precision-tools" class="robot-precision-tools" role="group" aria-label="Precision transforms" hidden>
              <div id="robot-turn-controls" class="robot-precision-group">
                <button id="robot-turn-minus" type="button" class="soft-button" aria-label="Rotate selection counterclockwise by one degree">−</button>
                <output id="robot-turn-angle" aria-live="polite">Turn 0°</output>
                <button id="robot-turn-plus" type="button" class="soft-button" aria-label="Rotate selection clockwise by one degree">+</button>
              </div>
              <div id="robot-transform-history" class="robot-precision-group" role="group" aria-label="Transform history">
                <button id="robot-transform-undo" type="button" class="soft-button" aria-label="Undo last Assembly edit">Undo</button>
                <button id="robot-transform-redo" type="button" class="soft-button" aria-label="Redo last Assembly edit">Redo</button>
              </div>
            </div>
          </div>
          <div class="robot-selection-row robot-sr"><output id="robot-selected-label" aria-live="polite">Canvas · zoom</output></div>
          <div class="robot-board-wrap"><svg id="robot-board" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 848 1264" preserveAspectRatio="xMidYMid meet" role="group" tabindex="0" aria-label="Assembly canvas. Tap or drag a part into place; drag empty space to pan."></svg><img id="robot-reference" alt="Completed machine reference" hidden></div>
        </section>
      </div>`;
    scene.after(room);
    const $=name=>room.querySelector('#robot-'+name),svg=$('board'),app=scene.closest('#app');
    let state=create(),active=false,selected=null,storePick=null,storeModel=null;
    let page=0,pointer=null,ghost=null,look=false,demoTimer=null,demoActive=false,demoParts=[];
    let keyboard=false,cursor=null,canvasFrame=0,view=null,pendingLayout=false,grid=false;
    const touches=new Map(),masks=new Map();
    let demoSavedView=null,picture=null,groupMode=false,editRevision=0,saveSerial=0,selectionStroke=null,rectangleIds=[];
    let clipboard=null,copyRequest=0,copyPending=false;
    const bringFront=$('bring-front');
    function activateOnTap(control,activate){
      let press=null,lastTouch=-Infinity;
      control.addEventListener('pointerdown',event=>{
        lastTouch=-Infinity;
        if(event.pointerType==='touch'&&event.isPrimary)press={id:event.pointerId,x:event.clientX,y:event.clientY};
      });
      control.addEventListener('pointercancel',()=>{press=null;});
      control.addEventListener('pointerup',event=>{
        const tap=press;press=null;
        if(!tap||tap.id!==event.pointerId||Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>10)return;
        if(!control.contains(document.elementFromPoint(event.clientX,event.clientY)))return;
        // A touchscreen tap after a selection drag may end without a click.
        lastTouch=performance.now();
        activate();
      });
      control.addEventListener('click',event=>{
        event.preventDefault();
        if(event.detail===0||performance.now()-lastTouch>=500)activate();
      });
    }
    function sizePicker(details,summary,options,heightLimit){
      const rect=summary.getBoundingClientRect(),bounds=room.getBoundingClientRect();
      const below=Math.min(innerHeight,bounds.bottom)-rect.bottom-3;
      const above=rect.top-Math.max(0,bounds.top)-3;
      const opensUp=below<heightLimit&&above>below;
      details.classList.toggle('opens-up',opensUp);
      options.style.maxHeight=Math.max(0,Math.min(heightLimit,opensUp?above:below))+'px';
    }
    const menus=Array.from(room.querySelectorAll('select'),select=>{
      const details=document.createElement('details');
      details.className='robot-picker';
      details.id=select.id+'-menu';
      const summary=document.createElement('summary');
      const options=document.createElement('div');
      const label=select.getAttribute('aria-label').split(' · ')[0];
      options.id=select.id+'-options';
      options.className='robot-picker-options';
      options.setAttribute('role','group');
      options.setAttribute('aria-label',label+' choices');
      details.append(summary,options);
      select.hidden=true;
      select.after(details);
      function sync(){
        summary.textContent=select.selectedOptions[0]?.text||label;
        summary.setAttribute('aria-label',label+': '+summary.textContent);
        summary.setAttribute('aria-disabled',String(select.disabled));
      }
      const isSelection=select.id==='robot-selection-mode';
      function showOptions(){
        sizePicker(details,summary,options,select.id==='robot-category'?select.options.length*48+2:180);
        options.replaceChildren(...Array.from(select.options,option=>{
          const button=document.createElement('button');
          button.type='button';
          button.textContent=option.text;
          button.disabled=option.disabled;
          button.setAttribute('aria-current',String(option.selected));
          const chooseOption=()=>{
            if(button.disabled)return;
            select.value=option.value;
            select.dispatchEvent(new Event('change',{bubbles:true}));
            sync();
            details.open=false;
            summary.focus({preventScroll:true});
          };
          if(isSelection)activateOnTap(button,chooseOption);
          else button.addEventListener('click',chooseOption);
          return button;
        }));
      }
      const unavailable=()=>select.disabled||state.locked||demoActive;
      if(isSelection)activateOnTap(summary,()=>{
        if(unavailable())return;
        if(!details.open)showOptions();
        details.open=!details.open;
      });
      else summary.addEventListener('click',event=>{
        if(unavailable()){event.preventDefault();return;}
        if(!details.open)showOptions();
      });
      select.addEventListener('change',()=>queueMicrotask(sync));
      return {details,summary,sync};
    });
    for(const {details,summary} of menus)details.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&details.open){event.stopPropagation();details.open=false;summary.focus();}
    });
    document.addEventListener('click',event=>{
      for(const {details} of menus)if(details.open&&!details.contains(event.target))details.open=false;
    });
    window.addEventListener('resize',()=>{for(const {details} of menus)details.open=false;});
    const pose=()=>storeModel,ready=()=>active&&!!storeModel;
    const displayScale=part=>{
      const base=part.storeScale||1;
      if(!part||!/(^|[_ -])head($|[_ -])/i.test(`${part.id} ${part.name}`)||!pose()?.parts)return base;
      const chest=pose().parts.find(p=>/(^|[_ -])(chest|torso)($|[_ -])/i.test(`${p.id} ${p.name}`));
      if(!chest)return base;
      const chestScale=chest.storeScale||1;
      const maxWidth=chest.width*chestScale*.90,maxHeight=chest.height*chestScale*.88;
      return Math.min(base,maxWidth/Math.max(1,part.width),maxHeight/Math.max(1,part.height));
    };
    const shelfOrder=new Map(['head','chest','waist','hip','upper_arm_L','upper_arm_R','forearm_L','forearm_R','hand_L','hand_R','thigh_L','thigh_R','shin_L','shin_R','foot_L','foot_R'].map((id,index)=>[id,index]));
    const shelfIndex=part=>shelfOrder.get(part.id)??shelfOrder.size;
    const pageCapacity=()=>pose()?.category==='cars'&&window.matchMedia('(orientation:portrait), (max-height:460px)').matches?2:window.matchMedia('(max-height:650px) and (max-width:360px) and (orientation:portrait)').matches?3:6;
    const pageCount=()=>ready()?Math.max(1,Math.ceil(pose().parts.length/pageCapacity())):1;
    const pageRange=()=>{const total=ready()?pose().parts.length:0,pages=pageCount(),base=Math.floor(total/pages),extra=total%pages,start=page*base+Math.min(page,extra);return{start,end:start+base+(page<extra?1:0),size:base+(page<extra?1:0)};};
    const partCount=()=>Object.keys(state.placed).length;
    const selectedShape=()=>$('selection-mode').value;
    const rectangleParts=()=>rectangleIds.map(id=>state.placed[id]).filter(Boolean);
    const selectionTargets=()=>rectangleParts().length?rectangleParts():selectedPart()?[selectedPart()]:[];
    let rectangleAngle=0;
    const clearShapeSelection=()=>{rectangleIds=[];selectionStroke=null;rectangleAngle=0;};
    function layersToRaise(targets){
      if(!targets.length)return [];
      const ordered=placedByLayer(state),selectedLayers=new Set(targets);
      return ordered.slice(-targets.length).every(at=>selectedLayers.has(at))?[]:ordered.filter(at=>selectedLayers.has(at));
    }
    const transformUndo=[],transformRedo=[];
    const transformKeys=['x','y','widthScale','heightScale','angle','flipX','turnAtFullCircle','layer','part','originalAsset'];
    const selectionPose=()=>({key:rectangleIds.join(','),angle:rectangleAngle});
    const captureTransform=(parts,present=true)=>({
      pose:selectionPose(),parts:parts.map(at=>({at,present,values:transformKeys.map(key=>at[key])}))
    });
    function updateRectangleBounds(){
      const parts=rectangleParts();
      if(!parts.length||!selectionStroke?.closed)return;
      const boxes=parts.map(at=>partBounds(at.part,at)),pad=8/viewport.scale(view);
      selectionStroke.points=[
        {x:Math.min(...boxes.map(box=>box.x))-pad,y:Math.min(...boxes.map(box=>box.y))-pad},
        {x:Math.max(...boxes.map(box=>box.x+box.width))+pad,y:Math.max(...boxes.map(box=>box.y+box.height))+pad}
      ];
    }
    function recordTransform(before){
      const changes=before.parts.map(({at,present,values})=>({
        at,presence:{before:present,after:state.placed[at.id]===at},
        fields:transformKeys.flatMap((key,i)=>at[key]===values[i]?[]:[{key,before:values[i],after:at[key]}])
      })).filter(({presence,fields})=>presence.before!==presence.after||fields.length);
      if(!changes.length)return;
      transformUndo.push({changes,before:before.pose,after:selectionPose()});
      if(transformUndo.length>360)transformUndo.shift();
      transformRedo.length=0;
    }
    function matchesTransform(entry,side){
      return entry.changes.every(({at,presence,fields})=>{
        const placed=state.placed[at.id];
        return presence[side]?placed===at&&fields.every(field=>at[field.key]===field[side]):!placed;
      });
    }
    function stepTransformHistory(from,to,current,restore){
      if(!canMoveCanvas()||pointer||look)return;
      while(from.length){
        const entry=from.pop();
        if(!matchesTransform(entry,current))continue;
        recolorRequest++;
        for(const {at,presence,fields} of entry.changes){
          if(presence[restore])state.placed[at.id]=at;
          else delete state.placed[at.id];
          for(const field of fields)at[field.key]=field[restore];
        }
        if((selected&&!state.placed[selected])||rectangleIds.some(id=>!state.placed[id]))deselect();
        const pose=entry[restore];
        if(pose.key===selectionPose().key)rectangleAngle=pose.angle;
        const restoredCutout=entry.changes.find(({at,presence})=>at.outline&&!presence[current]&&presence[restore]);
        if(restoredCutout&&!selected&&!rectangleIds.length){
          selected=restoredCutout.at.id;$('selection-mode').value='free';cursor=partCenter(restoredCutout.at);
        }
        to.push(entry);
        updateRectangleBounds();dirty();renderBoard();
        hint(restore==='before'?'Undid the last Assembly edit.':'Redid the last Assembly edit.');
        return;
      }
      syncButtons();
    }
    function syncPrecisionTools(targets){
      const editing=canMoveCanvas()&&!look&&!pointer;
      const draft=selectionStroke?.mode==='free'?selectionStroke:null;
      const canUndo=editing&&(draft?draft.points.length>0:transformUndo.some(entry=>matchesTransform(entry,'after')));
      const canRedo=editing&&(draft?!draft.closed&&draft.redo.length>0:transformRedo.some(entry=>matchesTransform(entry,'before')));
      const target=targets[0],multi=rectangleIds.length>0;
      $('precision-tools').hidden=(!target&&!canUndo&&!canRedo)||state.locked||look||demoActive;
      $('turn-controls').hidden=!target;
      $('transform-history').hidden=!target&&!canUndo&&!canRedo;
      $('turn-minus').disabled=$('turn-plus').disabled=!editing||!target;
      $('transform-undo').disabled=!canUndo;
      $('transform-redo').disabled=!canRedo;
      const angle=multi?rectangleAngle:normalizeAngle(Math.round(shapeOf(target).angle));
      $('turn-angle').textContent='Turn '+(angle===0&&target?.turnAtFullCircle&&!multi?360:angle)+'°';
    }
    function rectangleSelect(){
      if(!selectionStroke||selectionStroke.mode!=='rect'||selectionStroke.points.length<2)return;
      const a=selectionStroke.points[0],b=selectionStroke.points.at(-1),left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);
      rectangleIds=Object.values(state.placed).filter(at=>{
        const center=partCenter(at);
        return center.x>=left&&center.x<=right&&center.y>=top&&center.y<=bottom;
      }).map(at=>at.id);
      selectionStroke.closed=true;
      rectangleAngle=0;
      updateRectangleBounds();
    }
    function resizeRectangle(factor){
      const parts=rectangleParts();if(!parts.length)return;
      const before=captureTransform(parts);
      const cx=parts.reduce((v,p)=>v+p.x+p.part.width/2,0)/parts.length,cy=parts.reduce((v,p)=>v+p.y+p.part.height/2,0)/parts.length;
      for(const at of parts){const sh=shapeOf(at),nx=Math.max(.25,Math.min(4,sh.widthScale*factor)),ny=Math.max(.25,Math.min(4,sh.heightScale*factor));const actual=Math.min(nx/sh.widthScale,ny/sh.heightScale);at.x=cx+(at.x+at.part.width/2-cx)*actual-at.part.width/2;at.y=cy+(at.y+at.part.height/2-cy)*actual-at.part.height/2;at.widthScale=nx;at.heightScale=ny;}
      recordTransform(before);updateRectangleBounds();dirty();render();
    }
    const selectedPart=()=>!groupMode&&!look&&!state.locked&&!demoActive?state.placed[selected]:null;
    const canFinish=()=>ready()&&!state.locked&&!demoActive&&!pointer&&partCount()>0;
    const canSave=()=>ready()&&partCount()>0&&!demoActive&&!pointer&&!picture?.pending;
    const canMoveCanvas=()=>ready()&&!!view&&!state.locked&&!demoActive;
    const dirty=()=>{editRevision++;picture=null;};
    const groupCenter=()=>{const b=designBounds(state);return{x:b.x+b.width/2,y:b.y+b.height/2};};
    function groupTransform(dx=0,dy=0,degrees=0,factor=1){
      if(!groupMode||!canMoveCanvas()||!partCount())return;
      const center=groupCenter(),rad=degrees*Math.PI/180,c=Math.cos(rad),si=Math.sin(rad);
      for(const at of Object.values(state.placed)){
        const px=at.x+at.part.width/2-center.x,py=at.y+at.part.height/2-center.y;
        at.x=center.x+(px*c-py*si)*factor+dx-at.part.width/2;
        at.y=center.y+(px*si+py*c)*factor+dy-at.part.height/2;
        at.angle=((shapeOf(at).angle+degrees)%360+360)%360;
        at.widthScale=Math.max(.25,Math.min(4,shapeOf(at).widthScale*factor));
        at.heightScale=Math.max(.25,Math.min(4,shapeOf(at).heightScale*factor));
      }
      dirty();renderBoard();
    }
    const buildHint=()=>partCount()?'Build your way. Tap Done when you’re ready.':'Pick any part from Stores and place it where you like.';
    function syncButtons(){
      const at=selectedPart(),targets=selectionTargets();
      bringFront.disabled=!canMoveCanvas()||!!pointer||look||groupMode||!layersToRaise(targets).length;
      const count=partCount();
      $('progress').textContent=state.locked?'Locked':`${count} ${count===1?'part':'parts'}`;
      $('done').disabled=state.locked?false:!canFinish();$('done').textContent=state.locked?'Edit':'Done';$('done').setAttribute('aria-pressed',String(state.locked));$('done').setAttribute('title',state.locked?'Frozen: tap to edit again':'Editing: tap to freeze');$('done').classList.toggle('robot-frozen',state.locked);$('done').classList.toggle('robot-editing',!state.locked);
      $('remove').disabled=!selectedPart()||!!pointer;
      $('copy').disabled=!targets.length||!!pointer;
      $('paste').disabled=!clipboard||copyPending||!canMoveCanvas()||groupMode||look||!!pointer;
      $('color').disabled=!selectionTargets().length||!!pointer;
       $('apply-color').disabled=!selectionTargets().length||!!pointer||state.locked;
      $('part-original').disabled=!selectedPart()||!!pointer;
      $('part-mirror').disabled=!targets.length||!!pointer;
      $('part-mirror').setAttribute('aria-pressed',String(targets.length>0&&targets.every(at=>shapeOf(at).flipX)));
      syncPrecisionTools(targets);
      $('clear').disabled=state.locked||!count||demoActive||!!pointer;
      $('snapshot').disabled=!canSave();
      $('snapshot').textContent=picture?.pending?'Preparing…':'Save';$('view-fit').textContent='Fit';$('view-fit').setAttribute('title','Fit current assembly to canvas without changing parts');
      $('category').disabled=$('store').disabled=$('variant').disabled=state.locked||demoActive;
      $('look').disabled=!ready()||state.locked||demoActive;
      const multi=rectangleParts().length>0,editable=!!at&&!pointer&&!multi,s=shapeOf(at),axis=$('part-axis').value,scales=axis==='both'?[s.widthScale,s.heightScale]:[axis==='width'?s.widthScale:s.heightScale];
      $('zoom-level').textContent=multi?`${Math.round(shapeOf(rectangleParts()[0]).widthScale*100)}%`:at?(axis==='both'&&s.widthScale!==s.heightScale?`${Math.round(s.widthScale*100)}×${Math.round(s.heightScale*100)}%`:`${Math.round(scales[0]*100)}%`):`${Math.round((view?.zoom||1)*100)}%`;
      $('zoom-level').setAttribute('aria-label',at?'Reset selected dimension to 100 percent':'Reset canvas to reference 100 percent');
      const target=multi?`${rectangleIds.length} selected parts`:at?`${at.part.name} ${axis==='both'?'size':axis}`:null;$('zoom-in').setAttribute('aria-label',target?`Increase ${target}`:'Zoom in');$('zoom-out').setAttribute('aria-label',target?`Decrease ${target}`:'Zoom out');
      $('selected-label').textContent=multi?`${rectangleIds.length} ${rectangleIds.length===1?'part':'parts'} · size`:at?`${at.part.name} · size`:'Canvas · zoom';
      const viewControlsDisabled=!canMoveCanvas()||!!pointer;
      $('zoom-in').disabled=viewControlsDisabled||(multi?rectangleParts().every(p=>shapeOf(p).widthScale>=4-.000001):at?scales.every(n=>n>=4-.000001):view.zoom>=8);
      $('zoom-out').disabled=viewControlsDisabled||(multi?rectangleParts().every(p=>shapeOf(p).widthScale<=.25+.000001):at?scales.every(n=>n<=.25+.000001):view.zoom<=.5);
      $('zoom-level').disabled=viewControlsDisabled;
      $('view-fit').disabled=!ready()||!view||demoActive||!!pointer;
      for(const id of ['part-axis','part-original','rotate-left','rotate-right'])$(id).disabled=!editable;
      for(const menu of menus)menu.sync();
      $('grid').setAttribute('aria-pressed',String(grid));$('grid').disabled=state.locked||demoActive;
    }
    function renderShelf(){
      for(const menu of menus)menu.sync();
      page=Math.min(page,pageCount()-1);const range=pageRange();room.dataset.pageSize=range.size;
      const parts=ready()?[...pose().parts].sort((a,b)=>shelfIndex(a)-shelfIndex(b)).slice(range.start,range.end):[];
      $('parts').innerHTML=parts.map(part=>`<button type="button" data-robot-part="${part.id}" aria-label="${esc(part.name)}" aria-pressed="${storePick===part}" ${state.locked||look||groupMode||demoActive?'disabled':''}><div class="robot-part-preview"><img src="${part.asset}" alt="" draggable="false"></div><span>${esc(part.name)}</span></button>`).join('');
      $('page-label').textContent=`${page+1} / ${pageCount()}`;$('previous-page').disabled=state.locked||page===0;$('next-page').disabled=state.locked||page===pageCount()-1;
      sizeShelfParts();
    }
    /** Stores and the reference share the same native scale at canvas 100%. */
    function sizeShelfParts(){
      if(!view)return;const m=svg.getScreenCTM(),base=m?Math.hypot(m.a,m.b)/(view.zoom||1):0;if(!(base>0))return;
      for(const image of $('parts').querySelectorAll('img')){const part=pose().parts.find(p=>p.id===image.closest('[data-robot-part]').dataset.robotPart),storeScale=displayScale(part);image.style.width=`${part.width*base*storeScale}px`;image.style.height=`${part.height*base*storeScale}px`;}
    }
    const pieceImage=(part,placed,extra='')=>{const s=shapeOf(placed),cx=placed.x+part.width/2,cy=placed.y+part.height/2;return `<image href="${part.asset}" x="${placed.x}" y="${placed.y}" width="${part.width}" height="${part.height}" transform="translate(${cx} ${cy}) rotate(${s.angle}) scale(${s.baseScale*s.widthScale*(s.flipX?-1:1)} ${s.baseScale*s.heightScale}) translate(${-cx} ${-cy})" preserveAspectRatio="xMidYMid meet" ${extra}/>`;};
    function renderSelection(){
      svg.querySelectorAll('[data-robot-selection],[data-free-selection-marker]').forEach(el=>el.remove());
      const at=selectedPart();
      if(!at||!view||selectionStroke)return;
      const scale=viewport.scale(view);
      if(at.outline){
        const points=at.outline.map(point=>pointOnBoard(at,point));
        svg.insertAdjacentHTML('beforeend',`<polygon data-robot-selection="${at.id}" points="${points.map(({x,y})=>x+','+y).join(' ')}" fill="#ffe887" fill-opacity=".28" stroke="#e43d3d" stroke-width="${2/scale}" stroke-dasharray="${6/scale} ${4/scale}" pointer-events="none" aria-hidden="true"/>`);
        renderFreeDots(points,'data-free-selection-marker');return;
      }
      const bounds=partBounds(at.part,at),pad=4/scale;
      svg.insertAdjacentHTML('beforeend',`<rect data-robot-selection="${at.id}" class="robot-selection-outline" x="${bounds.x-pad}" y="${bounds.y-pad}" width="${bounds.width+pad*2}" height="${bounds.height+pad*2}" rx="${3/scale}" fill="none" stroke="#775400" stroke-width="${2/scale}" stroke-dasharray="${5/scale} ${4/scale}" pointer-events="none" aria-hidden="true"/>`);
    }
    function renderStroke(){
      svg.querySelectorAll('[data-selection-stroke]').forEach(el=>el.remove());
      if(!selectionStroke||!selectionStroke.points.length||!view)return;
      const pts=selectionStroke.points,first=pts[0],last=pts[pts.length-1],mode=selectionStroke.mode;
      let markup='';
      if(mode==='rect')markup=`<rect x="${Math.min(first.x,last.x)}" y="${Math.min(first.y,last.y)}" width="${Math.abs(last.x-first.x)}" height="${Math.abs(last.y-first.y)}"`;
      else if(mode==='oval')markup=`<ellipse cx="${(first.x+last.x)/2}" cy="${(first.y+last.y)/2}" rx="${Math.abs(last.x-first.x)/2}" ry="${Math.abs(last.y-first.y)/2}"`;
      else markup=`<path d="M${pts.map(p=>`${p.x},${p.y}`).join(' L')}${selectionStroke.closed?' Z':''}"`;
      svg.insertAdjacentHTML('beforeend',markup+` data-selection-stroke="" fill="${selectionStroke.closed?'#ffe887':'none'}" fill-opacity=".24" stroke="#e43d3d" stroke-width="${3/viewport.scale(view)}" stroke-dasharray="${8/viewport.scale(view)} ${5/viewport.scale(view)}" pointer-events="none"/>`);
      if(mode==='free')renderFreeDots(pts,'data-selection-stroke');
    }
    function renderFreeDots(points,attribute){
      const scale=viewport.scale(view);
      svg.insertAdjacentHTML('beforeend',points.map((p,i)=>`<circle ${attribute}="" cx="${p.x}" cy="${p.y}" r="${(i===0?8:5)/scale}" fill="${i===0?'#19b968':'#e43d3d'}" stroke="white" stroke-width="${2/scale}" pointer-events="none" aria-hidden="true"/>`).join(''));
    }
    async function copySelection(at,stroke){
      const {part}=at,shape=shapeOf(at),center=partCenter(at);
      const source=new Image();source.src=part.asset;await source.decode();
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(part.width));canvas.height=Math.max(1,Math.round(part.height));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const scaleX=shape.baseScale*shape.widthScale*(shape.flipX?-1:1),scaleY=shape.baseScale*shape.heightScale;
      // Map the outline from the board into this part's image coordinates.
      ctx.translate(part.width/2,part.height/2);
      ctx.scale(1/scaleX,1/scaleY);
      ctx.rotate(-shape.angle*Math.PI/180);
      ctx.translate(-center.x,-center.y);
      const pts=stroke.points,a=pts[0],b=pts.at(-1);ctx.beginPath();
      if(stroke.mode==='oval')ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.abs(a.x-b.x)/2,Math.abs(a.y-b.y)/2,0,0,Math.PI*2);
      else{ctx.moveTo(a.x,a.y);pts.slice(1).forEach(pt=>ctx.lineTo(pt.x,pt.y));ctx.closePath();}
      ctx.resetTransform();ctx.clip();ctx.drawImage(source,0,0,part.width,part.height);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]){
        const asset=canvas.toDataURL('image/png');
        return {...at,originalAsset:undefined,outline:undefined,part:{...part,id:`cut-${at.id}-${Date.now()}`,name:`${part.name} selection`,asset}};
      }
      return null;
    }
    function partsUnderStroke(stroke,ordered){
      const points=stroke.mode==='oval'?[stroke.points[0],stroke.points.at(-1)]:stroke.points;
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
      const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
      return ordered.filter(at=>{
        const box=partBounds(at.part,at);
        return box.x<right&&box.x+box.width>left&&box.y<bottom&&box.y+box.height>top;
      });
    }
    function traceFreePath(ctx,points){
      ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
      for(const point of points.slice(1))ctx.lineTo(point.x,point.y);
      ctx.closePath();
    }
    async function decodeImage(asset){
      const source=new Image();source.src=asset;await source.decode();return source;
    }
    function partImageContext(at,source){
      const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}),part=at.part,shape=shapeOf(at),center=partCenter(at);
      ctx.scale(canvas.width/part.width,canvas.height/part.height);
      ctx.translate(part.width/2,part.height/2);
      ctx.scale(1/(shape.baseScale*shape.widthScale*(shape.flipX?-1:1)),1/(shape.baseScale*shape.heightScale));
      ctx.rotate(-shape.angle*Math.PI/180);ctx.translate(-center.x,-center.y);
      return ctx;
    }
    function hasArtwork(ctx){
      const pixels=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i])return true;
      return false;
    }
    function outsideFreePath(at,source,points){
      const ctx=partImageContext(at,source);
      traceFreePath(ctx,points);
      ctx.resetTransform();ctx.drawImage(source,0,0);
      ctx.globalCompositeOperation='destination-out';ctx.fill();
      return ctx;
    }
    async function splitFreePart(at,points){
      const source=await decodeImage(at.part.asset),inside=partImageContext(at,source);
      traceFreePath(inside,points);inside.resetTransform();inside.clip();inside.drawImage(source,0,0);
      if(!hasArtwork(inside))return null;
      const outside=outsideFreePath(at,source,points);
      const remainder=hasArtwork(outside)?{...at.part,asset:outside.canvas.toDataURL('image/png')}:null;
      const originalAsset=remainder&&at.originalAsset?outsideFreePath(at,await decodeImage(at.originalAsset),points).canvas.toDataURL('image/png'):undefined;
      return {at,source,remainder,originalAsset};
    }
    function freeCutoutAsset(parts,points,bounds){
      const canvas=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(bounds.width,bounds.height));
      canvas.width=Math.max(1,Math.ceil(bounds.width*scale));canvas.height=Math.max(1,Math.ceil(bounds.height*scale));
      const ctx=canvas.getContext('2d');ctx.scale(canvas.width/bounds.width,canvas.height/bounds.height);
      ctx.translate(-bounds.x,-bounds.y);traceFreePath(ctx,points);ctx.clip();
      for(const {at,source} of parts){
        const shape=shapeOf(at),center=partCenter(at),part=at.part;
        ctx.save();ctx.translate(center.x,center.y);ctx.rotate(shape.angle*Math.PI/180);
        ctx.scale(shape.baseScale*shape.widthScale*(shape.flipX?-1:1),shape.baseScale*shape.heightScale);
        ctx.drawImage(source,-part.width/2,-part.height/2,part.width,part.height);ctx.restore();
      }
      return canvas.toDataURL('image/png');
    }
    async function closeFreeSelection(){
      const stroke=selectionStroke,points=stroke.points.slice(),revision=editRevision;
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys));
      const width=Math.ceil(Math.max(...xs))-x,height=Math.ceil(Math.max(...ys))-y;
      if(width<=0||height<=0){hint('Make an outline around the artwork before closing it.');return;}
      stroke.closed=true;renderStroke();syncButtons();
      try{
        const candidates=partsUnderStroke(stroke,placedByLayer(state));
        const parts=(await Promise.all(candidates.map(at=>splitFreePart(at,points)))).filter(Boolean);
        if(selectionStroke!==stroke||!active)return;
        if(editRevision!==revision||!canMoveCanvas()||look||pointer){deselect(true);return;}
        if(!parts.length){stroke.closed=false;renderStroke();syncButtons();hint('Add dots around visible artwork, then tap the green dot.');return;}
        const asset=freeCutoutAsset(parts,points,{x,y,width,height});
        const before=captureTransform(parts.map(({at})=>at));
        const part={id:'free-'+state.nextId,name:'Free selection',asset,width,height,assemblyScale:1};
        const id=addPart(state,part,{x:x+width/2,y:y+height/2});
        const cutout=state.placed[id];
        cutout.outline=points.map(p=>({x:p.x-x,y:p.y-y}));
        for(const {at,remainder,originalAsset} of parts){
          if(remainder){Object.assign(at,{part:remainder,originalAsset});warmMask(remainder);}
          else remove(state,at.id);
        }
        warmMask(part);
        before.parts.push(...captureTransform([cutout],false).parts);
        clearShapeSelection();
        choose(part,id);finishTransform(before);
        hint('Free selection ready. Drag inside the outline, or use Copy or the editing tools.');
      }catch{
        if(selectionStroke===stroke&&active){stroke.closed=false;renderStroke();syncButtons();hint('The outline could not be selected. Add dots or try again.');}
      }
    }
    function renderGrid(){svg.querySelector('[data-robot-grid]')?.remove();if(!grid||!view)return;const b=viewport.rect(view),step=100,lines=[];for(let x=Math.ceil(b.x/step)*step;x<=b.x+b.width;x+=step)lines.push(`M${x} ${b.y}v${b.height}`);for(let y=Math.ceil(b.y/step)*step;y<=b.y+b.height;y+=step)lines.push(`M${b.x} ${y}h${b.width}`);svg.insertAdjacentHTML('afterbegin',`<path data-robot-grid="" d="${lines.join(' ')}" fill="none" stroke="#88a885" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6" pointer-events="none"/>`);}
    function renderBoard(){
      svg.dataset.assembly=JSON.stringify(state.placed);
      svg.dataset.canvasBounds=JSON.stringify(view?viewport.rect(view):referenceBounds);
      svg.innerHTML=look&&pose()?pose().parts.map(part=>pieceImage(part,{x:part.x+(referenceBounds.width-pose().width)/2,y:part.y+(referenceBounds.height-pose().height)/2,baseScale:1},'pointer-events="none" aria-hidden="true"')).join(''):placedByLayer(state).map(at=>pieceImage(at.part,at,`data-robot-placed="${at.id}" class="${selected===at.id?'robot-selected':''}" aria-label="${esc(at.part.name)}"`)).join('');
      renderGrid();renderStroke();
      const at=selectedPart(),preview=storePick||at?.part;
      if(keyboard&&preview&&!look){
        const position={...(at||{baseScale:preview.storeScale||1}),x:cursor.x-preview.width/2,y:cursor.y-preview.height/2};
        svg.insertAdjacentHTML('beforeend',pieceImage(preview,position,'data-robot-keyboard-preview="" opacity=".5" style="pointer-events:none" aria-hidden="true"'));
      }
      if(demoActive)svg.insertAdjacentHTML('beforeend',demoParts.map(({part,offset})=>pieceImage(part,{x:part.x+offset,y:part.y+offset},'class="robot-demo-piece" pointer-events="none"')).join(''));
      renderSelection();syncButtons();
    }
    function render(){renderShelf();renderBoard();}
    function renderView(){
      if(!view||!pose())return;
      const bounds=viewport.rect(view),scale=viewport.scale(view),ref=$('reference');
      svg.setAttribute('viewBox',`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
      svg.dataset.canvasBounds=JSON.stringify(bounds);
      svg.dataset.view=JSON.stringify({...bounds,zoom:view.zoom,centerX:view.centerX,centerY:view.centerY});
      ref.style.left=((referenceBounds.width-pose().width)/2-bounds.x)*scale+'px';
      ref.style.top=((referenceBounds.height-pose().height)/2-bounds.y)*scale+'px';
      ref.style.width=pose().width*scale+'px';
      ref.style.height=pose().height*scale+'px';
      sizeShelfParts();renderGrid();renderSelection();syncButtons();
    }
    function fitCanvas(){
      canvasFrame=0;if(!ready()||svg.hidden)return;
      const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
      if(pointer){pendingLayout=true;return;}
      if(!view)view=viewport.create(referenceBounds,rect.width,rect.height);
      else viewport.resize(view,rect.width,rect.height);
      pendingLayout=false;renderView();
    }
    const canvasSizes=new ResizeObserver(()=>{cancelAnimationFrame(canvasFrame);canvasFrame=requestAnimationFrame(fitCanvas);});
    canvasSizes.observe(room.querySelector('.robot-board-wrap'));
    function setLook(value){
      if(value)deselect();look=value;$('reference').hidden=true;svg.hidden=false;
      $('look').textContent=value?'Build':'Look';$('look').setAttribute('aria-label',value?'Back to build':'Look');$('look').setAttribute('aria-pressed',String(value));render();fitCanvas();
    }
    function stopGesture(){
      const old=pointer;pointer=null;
      if(old?.transformStart)recordTransform(old.transformStart);
      if(old?.owner&&Number.isInteger(old.id)&&old.owner.hasPointerCapture?.(old.id))old.owner.releasePointerCapture(old.id);
      for(const [id,touch]of touches)if(touch.owner?.hasPointerCapture?.(id))touch.owner.releasePointerCapture(id);
      touches.clear();ghost?.remove();ghost=null;delete svg.dataset.dragging;if(active)syncButtons();
      if(pendingLayout)requestAnimationFrame(()=>{if(active){renderShelf();fitCanvas();}});
    }
    function cancel(){
      const drawing=pointer?.kind==='selection';
      stopGesture();if(storePick||drawing)deselect(true);clearTimeout(demoTimer);demoTimer=null;demoActive=false;demoParts=[];
      if(demoSavedView){view=demoSavedView;demoSavedView=null;const r=svg.getBoundingClientRect();viewport.resize(view,r.width,r.height);renderView();}
      document.getElementById('show-me')?.setAttribute('aria-pressed','false');
      if(active)renderBoard();
    }
    function cancelPointer(event){
      const pendingTap=event?.type==='pointercancel'&&event.currentTarget===svg&&pointer?.placeOnTap&&!pointer.moved;
      const drawing=pointer?.kind==='selection';
      keyboard=false;stopGesture();
      if(drawing||(storePick&&!pendingTap))deselect(true);
      if(active)renderBoard();
    }
    function choose(part,id=null){
      if(!canMoveCanvas()||look||groupMode||!part)return;
      if(selected!==id)$('part-axis').value='both';
      if(rectangleIds.length||(selectionStroke&&selectionStroke.placedId!==id))clearShapeSelection();
      selected=id;
      storePick=id===null?part:null;
      keyboard=false;
      svg.querySelector('[data-robot-keyboard-preview]')?.remove();
      for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed',String(storePick?.id===button.dataset.robotPart));
      for(const node of svg.querySelectorAll('[data-robot-placed]'))node.classList.toggle('robot-selected',node.dataset.robotPlaced===id);
      const at=state.placed[id];
      cursor=at?{x:at.x+part.width/2,y:at.y+part.height/2}:{x:view.centerX,y:view.centerY};
      renderStroke();renderSelection();syncButtons();
      hint(at?`${part.name} selected.`:`Place ${part.name} anywhere in Assemble.`);
    }
    function deselect(announce=false){
      selected=null;storePick=null;keyboard=false;
      clearShapeSelection();
      renderStroke();
      svg.querySelector('[data-robot-keyboard-preview]')?.remove();
      $('part-axis').value='both';
      for(const button of $('parts').querySelectorAll('[data-robot-part]'))button.setAttribute('aria-pressed','false');
      for(const node of svg.querySelectorAll('.robot-selected'))node.classList.remove('robot-selected');
      renderSelection();syncButtons();
      if(announce&&!state.locked)hint(buildHint());
    }
    function point(x,y){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):null;}
    function placeSelected(p){
      if(!canMoveCanvas()||look||!p||groupMode)return;
      if(storePick){
        const id=addPart(state,{...storePick,assemblyScale:displayScale(storePick)},p);
        if(!id)return;
        selected=id;
        storePick=null;
        recordTransform(captureTransform([state.placed[id]],false));
        feedback();
      }else{
        const at=selectedPart();if(!at)return;
        const before=captureTransform([at]);
        if(!movePart(state,at.id,p))return;
        recordTransform(before);
      }
      keyboard=false;
      cursor=p;dirty();
      render();hint(buildHint());
    }
    function makeGhost(part,x,y){
      ghost=document.createElement('img');ghost.className='robot-drag-ghost';ghost.src=part.asset;ghost.alt='';ghost.draggable=false;
      const scale=viewport.scale(view),s=shapeOf(state.placed[pointer.placedId]||{baseScale:displayScale(part)});ghost.style.width=`${part.width*scale}px`;ghost.style.height=`${part.height*scale}px`;ghost.style.transform=`translate(-50%,-50%) rotate(${s.angle}deg) scale(${s.baseScale*s.widthScale*(s.flipX?-1:1)},${s.baseScale*s.heightScale})`;document.body.append(ghost);moveGhost(x,y);
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
      for(const at of placedByLayer(state).reverse()){
        const part=at.part,{x,y}=localPoint(part,at,p),shape=shapeOf(at),mask=masks.get(part.asset),inside=x>=0&&x<part.width&&y>=0&&y<part.height;
        if(inside&&(!mask||mask.alpha[(Math.floor(y/part.height*mask.height)*mask.width+Math.floor(x/part.width*mask.width))*4+3]>96))return at;
        const scaleX=shape.widthScale*shape.baseScale,scaleY=shape.heightScale*shape.baseScale;
        if(!mask||Math.hypot(Math.max(0,-x,x-part.width)*scaleX,Math.max(0,-y,y-part.height)*scaleY)>tolerance)continue;
        const sx=part.width/mask.width,sy=part.height/mask.height,tx=distance/scaleX,ty=distance/scaleY,left=Math.max(0,Math.floor((x-tx)/sx)),right=Math.min(mask.width-1,Math.ceil((x+tx)/sx)),top=Math.max(0,Math.floor((y-ty)/sy)),bottom=Math.min(mask.height-1,Math.ceil((y+ty)/sy));
        for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)if(mask.alpha[(row*mask.width+col)*4+3]>96){const dx=Math.max(0,col*sx-x,x-(col+1)*sx)*scaleX,dy=Math.max(0,row*sy-y,y-(row+1)*sy)*scaleY,d=Math.hypot(dx,dy);if(d<distance){distance=d;nearest=at;}}
      }
      return nearest;
    }
    function completePartSelection(pointerType){
      const {mode,points,placedId}=selectionStroke;
      let at=state.placed[placedId];
      if(!at&&mode==='oval'){
        const a=points[0],b=points.at(-1);
        at=pickPart({x:(a.x+b.x)/2,y:(a.y+b.y)/2},pointerType);
      }
      if(!at)at=placedByLayer(state).reverse().find(part=>{
        const center=partCenter(part);
        return selectionContains(mode,points,center.x,center.y);
      });
      if(!at){deselect();hint('Draw over an existing part to select an area.');return;}
      selectionStroke.placedId=at.id;
      selectionStroke.closed=true;
      choose(at.part,at.id);
      hint('Selection ready. Tap Copy to copy the enclosed shape.');
    }
    function startPinch(){
      const points=[...touches.values()];if(points.length<2)return;
      ghost?.remove();ghost=null;delete svg.dataset.dragging;
      pointer={kind:'pinch',owner:svg,originView:{zoom:view.zoom,centerX:view.centerX,centerY:view.centerY},originMid:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},originDistance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)};
      deselect(true);
      for(const [id,touch]of touches){touch.owner=svg;svg.setPointerCapture(id);}renderBoard();
    }
    function down(event){
      if(!canMoveCanvas()||event.button>0)return;
      const inSelectionMode=event.currentTarget===svg&&selectedShape()!=='part'&&!groupMode&&!look&&!storePick;
      const freePart=inSelectionMode&&selectedShape()==='free'&&selectedPart()?.outline?selectedPart():null;
      if(freePart){
        if(pointer)return;
        const p=point(event.clientX,event.clientY);if(!p)return;
        const local=localPoint(freePart.part,freePart,p);
        if(!selectionContains('free',freePart.outline,local.x,local.y)){deselect(true);event.preventDefault();return;}
      }
      if(inSelectionMode&&!freePart){
        if(pointer)return;
        const p=point(event.clientX,event.clientY),mode=selectedShape();if(!p)return;
        if(selectionStroke?.closed){
          const inside=selectionContains(mode,selectionStroke.points,p.x,p.y);
          if(inside){
            if(mode==='rect'){
              pointer={kind:'rectangle-drag',transformStart:captureTransform(rectangleParts()),id:event.pointerId,owner:svg,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType};
              svg.setPointerCapture(event.pointerId);
            }
            event.preventDefault();return;
          }
          if(mode==='free'){deselect(true);event.preventDefault();return;}
        }
        if(mode==='free'&&selectionStroke?.points.length){
          const start=selectionStroke.points[0],near=Math.hypot(p.x-start.x,p.y-start.y)<14/viewport.scale(view);
          if(near&&selectionStroke.points.length>=3)closeFreeSelection();
          else{selectionStroke.points.push(p);selectionStroke.redo.length=0;renderStroke();syncButtons();}
          event.preventDefault();return;
        }
        const at=mode==='oval'?pickPart(p,event.pointerType):null;
        deselect();
        selectionStroke={mode,points:[p],placedId:at?.id,closed:false};
        if(mode==='free'){
          selectionStroke.redo=[];syncButtons();
          hint('Start at green, add red dots around the artwork, then tap green to close.');
        }
        else{
          pointer={kind:'selection',id:event.pointerId,owner:svg,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType};
          svg.setPointerCapture(event.pointerId);
        }
        renderStroke();event.preventDefault();return;
      }
      if(groupMode&&!event.target.closest('[data-robot-part]')){const pt=point(event.clientX,event.clientY);if(!pt)return;pointer={kind:'group',id:event.pointerId,owner:svg,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType};svg.setPointerCapture(event.pointerId);event.preventDefault();return;}
      const source=event.target.closest('[data-robot-part]'),owner=source||svg;
      if(source&&(look||source.disabled||pointer))return;
      if(event.pointerType==='touch')touches.set(event.pointerId,{x:event.clientX,y:event.clientY,owner});
      if(touches.size>=2&&[...touches.values()].every(p=>clientInside(p.x,p.y))){startPinch();event.preventDefault();return;}
      if(pointer)return;
      const p=point(event.clientX,event.clientY);
      if(!p)return;
      const pending=!look&&!source&&storePick;
      const previous=!look&&!source&&!pending?(freePart||pickPart(p,event.pointerType)):null;
      const picked=source?pose().parts.find(part=>part.id===source.dataset.robotPart):pending||previous?.part;
      if(picked){
        choose(picked,previous?.id);
        pointer={kind:'piece',part:picked,placedId:previous?.id,source:!!source,placeOnTap:!!pending,
          offsetX:previous?p.x-previous.x-picked.width/2:0,
          offsetY:previous?p.y-previous.y-picked.height/2:0};
      }
      else{deselect(true);pointer={kind:'pan',offsetX:0,offsetY:0};}
      Object.assign(pointer,{id:event.pointerId,owner,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,type:event.pointerType});
      owner.setPointerCapture(event.pointerId);syncButtons();event.preventDefault();
    }
    function move(event){
      if(!canMoveCanvas())return;
      const touch=touches.get(event.pointerId);if(touch){touch.x=event.clientX;touch.y=event.clientY;}
      if(pointer?.kind==='pinch'){
        const points=[...touches.values()];if(points.length<2)return;const mid={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),r=svg.getBoundingClientRect();
        Object.assign(view,pointer.originView);if(pointer.originDistance>0)viewport.zoomAt(view,distance/pointer.originDistance,{x:pointer.originMid.x-r.left,y:pointer.originMid.y-r.top});viewport.pan(view,mid.x-pointer.originMid.x,mid.y-pointer.originMid.y);renderView();event.preventDefault();return;
      }
      if(!pointer||pointer.id!==event.pointerId)return;
      if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>(pointer.type==='touch'?4:2))pointer.moved=true;
      if(pointer.kind==='selection'){
        const p=point(event.clientX,event.clientY);if(p){if(pointer.moved||selectionStroke.points.length===1)selectionStroke.points.push(p);renderStroke();}
        event.preventDefault();return;
      }
      if(!pointer.moved)return;
      if(pointer.kind==='rectangle-drag'){
        const before=point(pointer.lastX,pointer.lastY),after=point(event.clientX,event.clientY);
        if(before&&after){const dx=after.x-before.x,dy=after.y-before.y;for(const at of rectangleParts()){at.x+=dx;at.y+=dy;}for(const pt of selectionStroke.points){pt.x+=dx;pt.y+=dy;}dirty();renderBoard();}
      }
      else if(pointer.kind==='group'){const before=point(pointer.lastX,pointer.lastY),after=point(event.clientX,event.clientY);if(before&&after)groupTransform(after.x-before.x,after.y-before.y);}
      else if(pointer.kind==='pan'){viewport.pan(view,event.clientX-pointer.lastX,event.clientY-pointer.lastY);renderView();}
      else{
        if(!ghost){makeGhost(pointer.part,event.clientX,event.clientY);svg.dataset.dragging='true';}
        else moveGhost(event.clientX,event.clientY);
      }
      pointer.lastX=event.clientX;pointer.lastY=event.clientY;
      event.preventDefault();
    }
    function up(event){
      if(!canMoveCanvas())return;
      if(pointer?.kind==='pinch'){
        touches.delete(event.pointerId);if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
        if(touches.size){const [id,p]=[...touches][0];pointer={kind:'pan',id,owner:svg,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,moved:true};}else stopGesture();return;
      }
      if(!pointer||pointer.id!==event.pointerId)return;
      if(pointer.kind==='selection'){
        const {moved,type}=pointer;
        const p=point(event.clientX,event.clientY);if(p)selectionStroke.points.push(p);
        stopGesture();
        if(!moved){deselect(true);return;}
        if(selectionStroke.mode==='rect'){
          rectangleSelect();
          const count=rectangleIds.length;
          if(!count)clearShapeSelection();
          renderBoard();
          hint(count?count+' whole '+(count===1?'part':'parts')+' selected. Drag to move, or use resize, turn and mirror.':'Draw a rectangle around the center of the parts to select.');
        }else completePartSelection(type);
        return;
      }
      const drag=pointer,inside=clientInside(event.clientX,event.clientY),r=svg.getBoundingClientRect();
      const p=!inside&&drag.kind==='piece'&&!drag.source?point(Math.max(r.left+2,Math.min(r.right-2,event.clientX)),Math.max(r.top+2,Math.min(r.bottom-2,event.clientY))):point(event.clientX,event.clientY);stopGesture();
      if(drag.source&&drag.moved&&!inside){deselect(true);return;}
      if(p&&drag.kind==='piece'&&(drag.moved||drag.placeOnTap)&&(!drag.source||inside)){
        placeSelected({x:p.x-drag.offsetX,y:p.y-drag.offsetY});
      }
      syncButtons();
    }
    room.addEventListener('pointerdown',event=>{
      if(event.button!==0||pointer||!(selectionStroke||selectedPart())||event.composedPath().includes(svg))return;
      if(!event.target.closest('button,summary,select,input,label'))deselect(true);
    });
    $('parts').addEventListener('pointerdown',down);svg.addEventListener('pointerdown',down);
    for(const owner of [$('parts'),svg]){
      owner.addEventListener('pointermove',move);owner.addEventListener('pointerup',up);owner.addEventListener('pointercancel',cancelPointer);owner.addEventListener('lostpointercapture',event=>{if(pointer?.kind!=='pinch'&&pointer?.id===event.pointerId&&!pointer.owner.hasPointerCapture(event.pointerId))cancelPointer();});
    }
    svg.addEventListener('click',event=>{
      // WebKit can cancel the pointer sequence before dispatching a valid board tap.
      if(event.isTrusted&&event.detail>0&&storePick&&!pointer)placeSelected(point(event.clientX,event.clientY));
    });
    $('parts').addEventListener('click',event=>{
      const button=event.target.closest('[data-robot-part]');
      if(button&&event.detail===0)choose(pose()?.parts.find(part=>part.id===button.dataset.robotPart));
    });
    function resizeSelected(factor){const s=shapeOf(selectedPart()),axis=$('part-axis').value;editPart({...(axis!=='height'?{widthScale:s.widthScale*factor}:{}),...(axis!=='width'?{heightScale:s.heightScale*factor}:{})});}
    function zoom(factor){
      if(!canMoveCanvas())return;
      stopGesture();
      if(rectangleParts().length)resizeRectangle(factor);else if(groupMode)groupTransform(0,0,0,factor);else if(selectedPart())resizeSelected(factor);
      else{viewport.zoomAt(view,factor);renderView();}
    }
    function zoomStep(delta){
      if(!canMoveCanvas())return;
      const parts=rectangleParts();
      if(parts.length){const n=shapeOf(parts[0]).widthScale;resizeRectangle(Math.max(.25,Math.min(4,n+delta))/n);}
      else if(selectedPart()){const at=selectedPart(),axis=$('part-axis').value,sh=shapeOf(at),patch={};if(axis!=='height')patch.widthScale=Math.max(.25,Math.min(4,sh.widthScale+delta));if(axis!=='width')patch.heightScale=Math.max(.25,Math.min(4,sh.heightScale+delta));editPart(patch);}
      else{const target=Math.max(.5,Math.min(8,view.zoom+delta));viewport.zoomAt(view,target/view.zoom);renderView();}
      syncButtons();
    }
    $('zoom-in').addEventListener('click',()=>zoomStep(.05));$('zoom-out').addEventListener('click',()=>zoomStep(-.05));
    $('view-fit').addEventListener('click',()=>{
      if(!ready()||!view||demoActive||pointer)return;
      stopGesture();groupMode=false;clearShapeSelection();$('selection-mode').value='part';viewport.fit(view,partCount()?designBounds(state):referenceBounds);renderView();render();hint('Assembly fitted to screen. Tap any part to continue editing.');
    });
    $('zoom-level').addEventListener('click',()=>{
      if(!canMoveCanvas())return;
      stopGesture();
      if(rectangleParts().length){const first=rectangleParts()[0];resizeRectangle(1/Math.max(.25,shapeOf(first).widthScale));}
      else if(selectedPart()){
        const axis=$('part-axis').value;
        editPart({...(axis!=='height'?{widthScale:1}:{}),...(axis!=='width'?{heightScale:1}:{})});
      }else{viewport.reset(view);renderView();}
    });
    svg.addEventListener('wheel',event=>{
      if(!ready())return;
      if(state.locked){event.preventDefault();return;}
      if(!canMoveCanvas()||pointer)return;
      event.preventDefault();
      deselect(true);
      const r=svg.getBoundingClientRect();
      if(event.ctrlKey)viewport.zoomAt(view,Math.exp(-event.deltaY*.002),{x:event.clientX-r.left,y:event.clientY-r.top});
      else viewport.pan(view,-event.deltaX,-event.deltaY);
      renderView();
    },{passive:false});
    svg.addEventListener('keydown',event=>{
      if(!ready())return;
      const panSteps={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
      if(state.locked){if(panSteps[event.key])event.preventDefault();return;}
      if(!canMoveCanvas())return;
      if(rectangleParts().length&&panSteps[event.key]&&!look&&!pointer){
        event.preventDefault();
        const parts=rectangleParts(),before=captureTransform(parts),[dx,dy]=panSteps[event.key];
        const step=viewport.scale(view);
        for(const at of parts){at.x-=dx/step/4;at.y-=dy/step/4;}
        recordTransform(before);updateRectangleBounds();dirty();renderBoard();return;
      }
      if((!selected&&!storePick||look)&&panSteps[event.key]){event.preventDefault();viewport.pan(view,...panSteps[event.key]);renderView();return;}
      if(look||(!selected&&!storePick))return;
      const steps={ArrowLeft:[-32,0],ArrowRight:[32,0],ArrowUp:[0,-32],ArrowDown:[0,32]};
      if(steps[event.key]){event.preventDefault();keyboard=true;const b=viewport.rect(view);cursor.x=Math.max(b.x,Math.min(b.x+b.width,cursor.x+steps[event.key][0]));cursor.y=Math.max(b.y,Math.min(b.y+b.height,cursor.y+steps[event.key][1]));renderBoard();}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();placeSelected(cursor);}
    });
    for(const [id,delta] of [['previous-page',-1],['next-page',1]])$(id).addEventListener('click',()=>{if(state.locked)return;stopGesture();page=Math.max(0,Math.min(pageCount()-1,page+delta));renderShelf();});
    $('look').addEventListener('click',()=>{
      if(state.locked)return;
      stopGesture();
      setLook(!look);
      hint(look?'Reference picture. Tap Build to return to your design.':buildHint());
    });
    $('part-axis').addEventListener('change',syncButtons);
    function editPart(patch){
      const at=selectedPart();if(!at)return;
      stopGesture();
      const before=captureTransform([at]);
      if(transform(state,at.id,patch)){recordTransform(before);dirty();render();renderView();hint(buildHint());}
    }
    function selectionCenter(parts){
      const centers=parts.map(partCenter);
      return {x:centers.reduce((sum,p)=>sum+p.x,0)/centers.length,y:centers.reduce((sum,p)=>sum+p.y,0)/centers.length};
    }
    function positionPart(at,x,y){at.x=x-at.part.width/2;at.y=y-at.part.height/2;}
    function finishTransform(before){
      recordTransform(before);updateRectangleBounds();dirty();renderBoard();
    }
    function turnSelection(step){
      const targets=selectionTargets();
      if(!targets.length||!canMoveCanvas()||pointer)return;
      const before=captureTransform(targets),center=selectionCenter(targets);
      const radians=step*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
      for(const at of targets){
        const p=partCenter(at);
        if(targets.length>1){
          const dx=p.x-center.x,dy=p.y-center.y;
          positionPart(at,center.x+c*dx-s*dy,center.y+s*dx+c*dy);
        }
        at.angle=normalizeAngle(shapeOf(at).angle+step);
        at.turnAtFullCircle=step>0&&at.angle===0?true:undefined;
      }
      if(rectangleIds.length){
        const next=normalizeAngle(rectangleAngle+step);
        rectangleAngle=step>0&&next===0?360:next;
      }
      finishTransform(before);
    }
    // Tap and keyboard activation use the normal click path. A held pointer
    // repeats that same one-degree edit and consumes the release click.
    for(const [id,step] of [['turn-minus',-1],['turn-plus',1]]){
      const button=$(id);
      let heldPointer=null,timer=0,repeated=false;
      function stop(event){
        if(event?.pointerId!=null&&event.pointerId!==heldPointer)return;
        clearTimeout(timer);timer=0;heldPointer=null;
      }
      function repeat(){
        if(heldPointer===null||button.disabled){stop();return;}
        repeated=true;turnSelection(step);
        timer=setTimeout(repeat,80);
      }
      button.addEventListener('pointerdown',event=>{
        if(!event.isPrimary||event.button!==0||button.disabled)return;
        stop();repeated=false;heldPointer=event.pointerId;
        button.setPointerCapture(event.pointerId);
        timer=setTimeout(repeat,350);
      });
      for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,stop);
      button.addEventListener('contextmenu',event=>event.preventDefault());
      window.addEventListener('blur',()=>stop());
      window.addEventListener('pagehide',()=>stop());
      document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
      button.addEventListener('click',event=>{
        if(repeated&&event.detail>0){repeated=false;return;}
        turnSelection(step);
      });
      button.title='Tap for 1°. Hold to keep turning.';
    }
    function stepAssemblyHistory(redo){
      const draft=selectionStroke?.mode==='free'?selectionStroke:null;
      if(!draft){
        if(redo)stepTransformHistory(transformRedo,transformUndo,'before','after');
        else stepTransformHistory(transformUndo,transformRedo,'after','before');
        return;
      }
      if(pointer||!canMoveCanvas()||look)return;
      if(draft.closed){
        if(redo)return;
        selectionStroke={...draft,closed:false};
      }else{
        const from=redo?draft.redo:draft.points,to=redo?draft.points:draft.redo;
        if(!from.length)return;
        to.push(from.pop());
      }
      renderStroke();syncButtons();
    }
    activateOnTap($('transform-undo'),()=>stepAssemblyHistory(false));
    activateOnTap($('transform-redo'),()=>stepAssemblyHistory(true));
    $('part-mirror').addEventListener('click',()=>{
      const group=rectangleParts();
      if(!group.length){
        const at=selectedPart();if(!at)return;
        editPart({flipX:!shapeOf(at).flipX});
        hint('Selected part mirrored in place.');return;
      }
      if(!canMoveCanvas()||pointer)return;
      const before=captureTransform(group);
      for(const at of group)at.flipX=!shapeOf(at).flipX;
      finishTransform(before);hint('Selected parts mirrored in place.');
    });
    $('rotate-left').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle-45}));$('rotate-right').addEventListener('click',()=>editPart({angle:shapeOf(state.placed[selected]).angle+45}));$('part-original').addEventListener('click',()=>{
      recolorRequest++;
      const at=selectedPart();if(!at)return;
      if(at.originalAsset){
        const before=captureTransform([at]);
        at.part={...at.part,asset:at.originalAsset};delete at.originalAsset;
        finishTransform(before);hint('Original colors restored.');
      }
    });
    let recolorRequest=0;
    async function recolorPart(at,color,request,region=null){
      const original=at.originalAsset||at.part.asset,source=new Image();source.src=original;
      try{await source.decode();}catch{return false;}
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(at.part.width));canvas.height=Math.max(1,Math.round(at.part.height));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);
      let pixels;try{pixels=ctx.getImageData(0,0,canvas.width,canvas.height);}catch{return false;}
      const d=pixels.data,hist=new Array(24).fill(0);
      const hue=(r,g,b)=>{const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;if(!delta)return 0;let h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;return (h*60+360)%360;};
      for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(d[i+3]<170||mx-mn<35||mx<60)continue;hist[Math.floor(hue(r,g,b)/15)%24]++;}
      const family=hist.indexOf(Math.max(...hist));if(!hist[family])return false;
      const target=[1,3,5].map(n=>parseInt(color.slice(n,n+2),16));
      const pts=region?.points.map(pt=>localPoint(at.part,at,pt));
      const inside=(x,y)=>!pts||selectionContains(region.mode,pts,x,y);
      let changed=0;
      for(let i=0;i<d.length;i+=4){const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);if(d[i+3]<170||!inside(x,y))continue;
        const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn;
        if(sat<35||mx<60)continue;
        const bucket=Math.floor(hue(r,g,b)/15)%24,dist=Math.min((bucket-family+24)%24,(family-bucket+24)%24);
        if(dist>2)continue;
        // Recolor vivid painted surfaces strongly; retain light/shadow variation and metallic neutral details.
        const light=Math.max(.43,Math.min(1.22,(mx+mn)/2/155));const mix=Math.min(.99,Math.max(.94,sat/Math.max(mx,1)));
        for(let c=0;c<3;c++)d[i+c]=Math.round(Math.min(255,Math.max(0,target[c]*light))*mix+d[i+c]*(1-mix));changed++;
      }
      if(!changed||request!==recolorRequest||state.locked||state.placed[at.id]!==at)return false;
      ctx.putImageData(pixels,0,0);
      return {at,originalAsset:original,part:{...at.part,asset:canvas.toDataURL('image/png')}};
    }
    const recolorSelection=async color=>{
      const targets=selectionTargets(),request=++recolorRequest;if(!targets.length)return;
      const region=rectangleParts().length?null:selectionStroke?.closed?{mode:selectionStroke.mode,points:[...selectionStroke.points]}:null;
      const results=await Promise.all(targets.map(at=>recolorPart(at,color,request,region)));
      if(request!==recolorRequest||state.locked)return;
      const changes=results.filter(change=>change&&state.placed[change.at.id]===change.at);
      if(!changes.length){hint('No eligible colored surface found. Try a different part or selection.');return;}
      const before=captureTransform(changes.map(({at})=>at));
      for(const {at,originalAsset,part} of changes)Object.assign(at,{originalAsset,part});
      finishTransform(before);
      hint(`${changes.length} selected part(s) recolored. Painted surfaces match the chosen color; details preserved.`);
    };
    $('color').addEventListener('input',e=>{if(!state.locked)recolorSelection(e.target.value);});
    $('apply-color').addEventListener('click',()=>{if(!state.locked)recolorSelection($('color').value);});
    $('selection-mode').addEventListener('change',()=>{
      stopGesture();deselect();
      const mode=selectedShape();
      if(mode==='rect')hint('Draw a rectangle around the center of one or more parts to select them whole.');
      else hint(mode==='part'?'Tap a complete part to select it.':'Draw a selection starting on a placed part, then tap Copy.');
    });
    function bringSelectionToFront(){
      if(!canMoveCanvas()||pointer||look||groupMode)return;
      const targets=layersToRaise(selectionTargets());
      if(!targets.length)return;
      const before=captureTransform(targets);
      raiseParts(targets);
      finishTransform(before);
      hint(targets.length===1?targets[0].part.name+' moved to the front.':'Selected parts moved to the front.');
    }
    function raiseParts(parts){
      state.frontLayer=Math.max(state.frontLayer??0,state.nextId-1);
      for(const at of parts)at.layer=++state.frontLayer;
    }
    activateOnTap(bringFront,bringSelectionToFront);
    activateOnTap($('copy'),async()=>{
      const targets=selectionTargets();
      if(!canMoveCanvas()||pointer||look||!targets.length)return;
      const request=++copyRequest,ordered=placedByLayer(state),selectedParts=new Set(targets);
      const stroke=selectionStroke?.closed&&selectionStroke.mode!=='rect'?selectionStroke:null;
      const angle=stroke?0:rectangleAngle;
      const candidates=(stroke?partsUnderStroke(stroke,ordered):ordered.filter(at=>selectedParts.has(at))).map(at=>({...at}));
      copyPending=true;syncButtons();
      try{
        const parts=stroke?(await Promise.all(candidates.map(at=>copySelection(at,stroke)))).filter(Boolean):candidates;
        if(request!==copyRequest||!active)return;
        if(!parts.length){hint('Draw around visible artwork to copy it.');return;}
        clipboard={parts,bounds:partsBounds(parts),angle};
        hint(parts.length===1?'Copied one piece. Tap Paste to add an independent copy.':`Copied ${parts.length} parts together. Tap Paste to add the group.`);
      }catch{
        if(request===copyRequest&&active)hint('The selection could not be copied. Please try again.');
      }finally{
        if(request===copyRequest){copyPending=false;if(active)syncButtons();}
      }
    });
    activateOnTap($('paste'),()=>{
      if(!clipboard||copyPending||!canMoveCanvas()||pointer||groupMode||look)return;
      const {parts,bounds,angle}=clipboard,visible=viewport.rect(view);
      const targets=selectionTargets(),reference=targets.length?partsBounds(targets):visible;
      const anchorX=reference.x+reference.width/2,anchorY=reference.y+reference.height/2;
      const offsetX=Math.max(bounds.width*.8,95),offsetY=targets.length?Math.max(bounds.height*.3,35):0;
      const marginX=Math.min(visible.width,bounds.width)/2,marginY=Math.min(visible.height,bounds.height)/2;
      const fitX=x=>Math.max(visible.x+marginX,Math.min(visible.x+visible.width-marginX,x));
      const x=fitX(anchorX+offsetX*(targets.length?1:.5));
      const alternate=fitX(anchorX-offsetX);
      const destX=targets.length&&Math.abs(x-anchorX)<Math.abs(alternate-anchorX)?alternate:x;
      const destY=Math.max(visible.y+marginY,Math.min(visible.y+visible.height-marginY,anchorY+offsetY));
      const dx=destX-bounds.x-bounds.width/2,dy=destY-bounds.y-bounds.height/2;
      const copies=parts.map(original=>{
        const center=partCenter(original);
        const id=addPart(state,original.part,{x:center.x+dx,y:center.y+dy});
        const at=state.placed[id];
        Object.assign(at,shapeOf(original),{turnAtFullCircle:original.turnAtFullCircle,originalAsset:original.originalAsset,outline:original.outline});
        return at;
      });
      storePick=null;keyboard=false;clearShapeSelection();
      $('part-axis').value='both';
      if(copies.length===1){
        selected=copies[0].id;$('selection-mode').value=copies[0].outline?'free':'part';
        cursor=partCenter(copies[0]);
      }else{
        raiseParts(copies);
        selected=null;rectangleIds=copies.map(at=>at.id);rectangleAngle=angle;
        selectionStroke={mode:'rect',points:[],closed:true};
        $('selection-mode').value='rect';updateRectangleBounds();
      }
      recordTransform(captureTransform(copies,false));
      dirty();render();hint(copies.length===1?'Pasted. Drag or resize this copy independently.':`Pasted ${copies.length} parts together. Drag the selection to move them.`);
    });
    $('grid').addEventListener('click',()=>{if(state.locked)return;grid=!grid;renderGrid();syncButtons();});
    function reset(keepHistory=false){
      cancel();onReset();recolorRequest++;
      if(keepHistory)state.placed={};
      else{transformUndo.length=transformRedo.length=0;state=create(state.age);}
      clipboard=null;copyRequest++;copyPending=false;clearShapeSelection();dirty();groupMode=false;view=null;selected=null;storePick=null;page=0;keyboard=false;cursor=null;
      $('part-axis').value='both';
      setLook(false);
      updateReference();
    }
    function updateReference(){
      if(!pose()){
        $('reference').removeAttribute('src');
        $('reference').alt='Completed machine reference';
        return;
      }
      $('reference').src=pose().reference||'';
      $('reference').alt=`${pose().label} reference`;
      pose().parts.forEach(warmMask);
    }
    $('variant').addEventListener('change',()=>{
      if(state.locked||demoActive){$('variant').value=pose()?.id||'';return;}
      const next=$('store').value==='connectors'?connectorPose:catalogue.poses[$('variant').value];
      if(!next||(next!==connectorPose&&!availableModels.includes(next)))return;
      cancel();
      deselect();
      storeModel=next;
      page=0;
      updateReference();
      setLook(false);
      hint(`Pick a ${pose().label.toLowerCase()} part. ${buildHint()}`);
    });
    const allModels=Object.values(catalogue.poses);
    let availableModels=[];
    const specialIds=['shiny-bot-combo','dino-space-rover','robot-leg'];
    const regularModels=category=>availableModels.filter(item=>(item.category||'robots')===category&&!specialIds.includes(item.id));
    function refreshStoreOptions(){
      const store=$('store');
      if(state.age!==5){
        store.innerHTML='<option value="parts">Parts</option><option value="connectors" disabled>Connectors — later</option>';
        return;
      }
      store.innerHTML='<option value="parts">Parts</option><option value="connectors">Connectors</option>'+($('category').value==='robots'?specialIds.filter(id=>availableModels.includes(catalogue.poses[id])).map(id=>'<option value="'+esc(id)+'">'+esc(catalogue.poses[id].label)+'</option>').join(''):'');
    }
    function selectStore(preferred){
      const key=$('store').value,variant=$('variant');
      variant.closest('.robot-variant-label').hidden=key==='robot-leg';
      const models=key==='connectors'?[connectorPose]:specialIds.includes(key)?[catalogue.poses[key]]:regularModels($('category').value);
      storeModel=models.find(item=>item.id===preferred)||models[0]||null;
      variant.innerHTML=models.length?models.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.label)+'</option>').join(''):'<option value="" disabled>No models yet</option>';
      variant.value=storeModel?.id||'';
    }
    function configureAge(age){
      const category=$('category'),variant=$('variant');
      availableModels=allModels.filter(item=>(item.age??5)===Number(age));
      const previous=storeModel&&availableModels.includes(storeModel)?storeModel:state.age===5&&storeModel===connectorPose?storeModel:null;
      category.innerHTML=['robots','cars','ships','planes','rockets'].map(key=>{
        const present=availableModels.some(item=>(item.category||'robots')===key);
        return '<option value="'+key+'" '+(present||key==='robots'?'':'disabled')+'>'+key[0].toUpperCase()+key.slice(1)+(present||key==='robots'?'':' — later')+'</option>';
      }).join('');
      category.value=previous?.category==='connectors'?'robots':previous?.category||availableModels[0]?.category||'robots';
      category.disabled=false;
      $('store').disabled=false;
      variant.disabled=false;
      refreshStoreOptions();$('store').value=previous?.id==='connectors'?'connectors':specialIds.includes(previous?.id)?previous.id:'parts';
      selectStore(previous?.id);
    }
    $('store').addEventListener('change',()=>{
      if(state.locked||demoActive)return;
      cancel();deselect();page=0;selectStore();
      updateReference();setLook(false);hint('Choose a part from this store.');
    });
    $('category').addEventListener('change',()=>{
      if(state.locked||demoActive)return;
      cancel();deselect();page=0;refreshStoreOptions();$('store').value='parts';selectStore();
      updateReference();setLook(false);hint(buildHint());
    });
    $('clear').addEventListener('click',()=>{
      if(state.locked||demoActive||pointer)return;
      const before=captureTransform(Object.values(state.placed));
      reset(true);
      recordTransform(before);syncButtons();hint(buildHint());
    });
    $('remove').addEventListener('click',()=>{
      const at=selectedPart();if(!at||pointer)return;
      const before=captureTransform([at]);
      remove(state,at.id);recordTransform(before);dirty();deselect();render();hint(buildHint());
    });
    $('done').addEventListener('click',()=>{
      if(state.locked){state.locked=false;picture=null;groupMode=false;clearShapeSelection();stopGesture();$('selection-mode').value='part';render();hint('Edit mode. Tap any part to move, rotate, resize or recolor it.');return;}
      if(!canFinish()||!lock(state))return;
      stopGesture();deselect();if(look)setLook(false);else render();
      hint('Frozen posture. Save now, or tap Edit to change it.');
    });
    async function preparePicture(){
      const finishedDesign=state,revision=editRevision;
      const result={pending:true,blob:null,revision};
      picture=result;
      syncButtons();
      try{
        const bounds=designBounds(finishedDesign),padding=12;
        const width=bounds.width+2*padding,height=bounds.height+2*padding;
        const scale=Math.min(1,3072/Math.max(width,height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
        const ctx=canvas.getContext('2d');
        ctx.scale(scale,scale);
        const images=new Map();
        const pieces=placedByLayer(finishedDesign);
        for(const {part} of pieces)if(!images.has(part.asset)){
          const image=new Image();image.src=part.asset;
          images.set(part.asset,image);
        }
        await Promise.all([...images.values()].map(image=>image.decode()));
        if(!active||state!==finishedDesign||revision!==editRevision)return;
        for(const at of pieces){
          const {part}=at,shape=shapeOf(at);
          ctx.save();
          ctx.translate(at.x+part.width/2-bounds.x+padding,at.y+part.height/2-bounds.y+padding);
          ctx.rotate(shape.angle*Math.PI/180);
          ctx.scale(shape.widthScale*shape.baseScale*(shape.flipX?-1:1),shape.heightScale*shape.baseScale);
          ctx.drawImage(images.get(part.asset),-part.width/2,-part.height/2,part.width,part.height);
          ctx.restore();
        }
        result.blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!result.blob)throw Error('Picture unavailable');
        if(active&&state===finishedDesign&&revision===editRevision)hint('Picture ready to save.');
      }catch{
        if(active&&state===finishedDesign&&revision===editRevision)hint('Picture could not be prepared. Try Save again.');
      }finally{
        result.pending=false;
        if(active&&state===finishedDesign)syncButtons();
      }
    }
    $('snapshot').addEventListener('click',async()=>{
      if(!canSave())return;
      if(!picture?.blob||picture.revision!==editRevision)await preparePicture();
      if(!picture?.blob||picture.revision!==editRevision)return;
      // Use the Save tap itself to start the download on touch browsers.
      const url=URL.createObjectURL(picture.blob);
      const link=document.createElement('a');
      link.href=url;link.download=`SaNa-Machine-Design-v2.26-${++saveSerial}.png`;
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      hint('Picture sent to your device’s downloads.');
    });
    function demo(){
      if(!ready()||state.locked||!view)return;if(demoActive){cancel();hint(buildHint());return;}
      stopGesture();setLook(false);demoSavedView={...view,basis:{...view.basis}};viewport.reset(view);renderView();demoActive=true;demoParts=[];document.getElementById('show-me').setAttribute('aria-pressed','true');
      const namedParts=['chest','head','upper_arm_L'].map(id=>pose().parts.find(p=>p.id===id)).filter(Boolean);
      const sample=namedParts.length?namedParts:pose().parts.slice(0,3);let step=0;
      const next=()=>{
        if(!active||!demoActive)return;
        if(step===sample.length){cancel();hint(buildHint());return;}
        const part=sample[step++];demoParts.push({part,offset:150});renderBoard();hint(`Drag ${part.name.toLowerCase()} to a place you choose.`);
        demoTimer=setTimeout(()=>{if(!demoActive)return;demoParts[demoParts.length-1].offset=0;renderBoard();demoTimer=setTimeout(next,900);},700);
      };next();
    }
    function start(age){
      look=false;
      cancel();active=true;groupMode=false;app?.classList.add('robot-active');state=create(age);configureAge(age);room.hidden=false;
      $('age-note').hidden=true;room.querySelector('.robot-workspace').hidden=false;reset();
      if(ready())hint(buildHint());
      else hint('More models are coming for this age.');
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


