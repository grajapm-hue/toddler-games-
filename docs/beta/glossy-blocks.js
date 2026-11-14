/* Shared-shell Glossy Blocks. Catalogue/model are also usable by local checks. */
((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./shape-library.js'):root.SaNaShapes,typeof module==='object'&&module.exports?require('./glossy-catalogue.js'):root.SaNaGlossyCatalogue);if(typeof module==='object'&&module.exports)module.exports=api;else root.SaNaGlossyBlocks=api;})(typeof window==='object'?window:globalThis,(shapeLibrary,catalogue)=>{
  'use strict';
  const palette=[['Coral','#ed7b75'],['Yellow','#f5c84d'],['Green','#78b98b'],['Blue','#73bde0'],['Purple','#aa91d5'],['Orange','#eda05d'],['Pink','#e99fbd'],['White','#fffaf0'],['Brown','#ad805e'],['Grey','#8c9da0'],['Turquoise','#54b8b2'],['Navy','#405f76']];
  const categories=[['plain','Plain'],['mixed','Mixed'],['numbers','Numbers'],['letters','Letters'],['shapes','Shapes'],['animals','Animals'],['fruits','Fruits'],['vegetables','Vegetables'],['utensils','Utensils'],['colors','Colours']].map(([id,name])=>({id,name}));
  const geometry=[...catalogue.nativeGeometry,...catalogue.geometry.map(g=>({...g,id:'ai-'+g.id}))],geometryById=id=>geometry.find(g=>g.id===id);
  const extraColours=[['Red','#e83e3e'],['Crimson','#be3455'],['Maroon','#7c3447'],['Magenta','#d94eaa'],['Lavender','#c8b6e8'],['Indigo','#55559c'],['Cyan','#40cedc'],['Aqua','#79d9ce'],['Teal','#268d8b'],['Mint','#a1d9b2'],['Lime','#b4d455'],['Olive','#869544'],['Gold','#dfb53d'],['Silver','#c4ccd2'],['Cream','#fff1cd'],['Beige','#d9c3a3'],['Peach','#ffc49b'],['Rose','#e890a1'],['Ruby','#ae2848'],['Plum','#845579'],['Ochre','#bd8d3d'],['Mauve','#b78ea9'],['Slate','#657d91'],['Seafoam','#8ec8b9']],namedColours=[...palette,...extraColours];
  const symbols=['!','?','&','@','#','%','=','+','×','÷'];
  const patternList=[['Row',[[0,0],[1,0],[2,0]]],['Tower',[[0,0],[0,1],[0,2]]],['Steps',[[0,1],[1,1],[1,0]]],['Square',[[0,0],[1,0],[0,1],[1,1]]],['Staircase',[[0,2],[1,2],[1,1],[2,1],[2,0]]],['Rectangle',[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]],['Pyramid',[[0,1],[1,1],[2,1],[1,0]]],['Cross',[[1,0],[0,1],[1,1],[2,1],[1,2]]]].map(([name,cells])=>({name,cells}));
  const ageIndex=age=>Math.max(0,Math.min(3,(Number(age)||2)-2));
  function items(category,age){
    const a=ageIndex(age),count=(category==='mixed'?[4,18,32,36]:['numbers','letters'].includes(category)?[8,18,32,36]:['plain','colors'].includes(category)?[8,9,16,36]:[4,9,16,36])[a];
    return Array.from({length:count},(_,i)=>{
      const shape=category==='mixed'&&a===1&&i>=12?geometry[20+i-12]:geometry[i];
      const name=category==='numbers'?String(i+1):category==='letters'?(i<26?String.fromCharCode(65+i):symbols[i-26]):category==='colors'?namedColours[i][0]:catalogue.pictures[category]?.[i].name||shape.name;
      return{id:category==='mixed'?'mixed-'+shape.id:category+'-'+i,kind:category,name,content:name,unit:180,color:category==='colors'?namedColours[i][1]:palette[i%palette.length][1],...(['plain','mixed','shapes','colors'].includes(category)?{shapeId:shape.id}:{}),...(catalogue.pictures[category]?{asset:catalogue.pictures[category][i].asset}:{} )};
    });
  }
  function patterns(age,level=1){if(ageIndex(age)===0)return [{name:'Row',cells:[[0,0],[1,0]]},{name:'Tower',cells:[[0,0],[0,1]]},patternList[2],patternList[3]];return patternList.slice(0,Math.min(8,[4,5,7,8][ageIndex(age)]+Math.max(0,level-1)));}
  const SIZE=180;
  const gridSize=age=>({2:2,3:3,4:4,5:6}[age]||2);
  const stores=(category,age)=>items(category,age);
  const create=(age=2)=>{const n=gridSize(age);return{blocks:[],columns:n,rows:n};};
  const validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
  const overlap=(a,b)=>a.x<b.x+SIZE-1&&a.x+SIZE>b.x+1&&a.y<b.y+SIZE-1&&a.y+SIZE>b.y+1;
  const angleOf=item=>Number.isFinite(item.angle)?((item.angle%360)+360)%360:0;
  const dimensionsOf=item=>{const fit=item.cellFit?(item.gridScale??1):1,w=(item.widthScale??1)*fit,h=(item.heightScale??1)*fit,a=angleOf(item)*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));return{width:SIZE*(w*c+h*s),height:SIZE*(w*s+h*c)};};
  const validSize=item=>[item.widthScale??1,item.heightScale??1].every(v=>Number.isFinite(v)&&v>0&&v<=2.5);
  function place(board,item,x,y,index=-1,{grid=false,fit=true}={}){
    if(!item||!validColor(item.color)||!validSize(item)||(item.angle!==undefined&&!Number.isFinite(item.angle))||![x,y].every(Number.isFinite)||!Number.isInteger(index)||index< -1||index>=board.blocks.length)return false;
    let block={...item,widthScale:item.widthScale??1,heightScale:item.heightScale??1,cellFit:!!(grid||item.cellFit),gridScale:item.cellFit?(item.gridScale??1):1};const W=(board.columns||2)*SIZE,H=(board.rows||2)*SIZE,area=!grid&&board.freeBounds?board.freeBounds:{x:0,y:0,width:W,height:H};
    if(grid&&fit)block.gridScale=1;
    let d=dimensionsOf(block);if(grid&&fit){block.gridScale=Math.min(1,SIZE/d.width,SIZE/d.height);d=dimensionsOf(block);}
    if(d.width>area.width+.001||d.height>area.height+.001||grid&&(d.width>SIZE+.001||d.height>SIZE+.001))return false;
    const mx=(d.width-SIZE)/2,my=(d.height-SIZE)/2,bound=p=>({x:Math.max(area.x+mx,Math.min(area.x+area.width-SIZE-mx,p.x)),y:Math.max(area.y+my,Math.min(area.y+area.height-SIZE-my,p.y))});
    let point=bound({x,y});if(grid)point={x:Math.max(0,Math.min(W-SIZE,Math.round(point.x/SIZE)*SIZE)),y:Math.max(0,Math.min(H-SIZE,Math.round(point.y/SIZE)*SIZE))};
    block={...block,...point};if(index<0)board.blocks.push(block);else board.blocks[index]=block;return true;
  }
  function rotate(board,index,step=45,{grid=false}={}){
    if(!Number.isInteger(index)||!board.blocks[index]||!Number.isFinite(step))return false;const item=board.blocks[index];return place(board,{...item,angle:((angleOf(item)+step)%360+360)%360},item.x,item.y,index,{grid});
  }
  function resize(board,index,axis,factor,{grid=false,preview=false}={}){
    if(!Number.isInteger(index)||!board.blocks[index]||!['width','height','both'].includes(axis)||!Number.isFinite(factor)||factor<=0)return false;
    const old=board.blocks[index],item={...old,widthScale:old.widthScale??1,heightScale:old.heightScale??1};
    const keys=axis==='both'?['widthScale','heightScale']:[axis==='width'?'widthScale':'heightScale'];let ratio=factor;
    if(ratio>1)ratio=Math.min(ratio,...keys.map(k=>2.5/item[k]));else if(ratio<1){if(keys.some(k=>item[k]<=.25))return false;ratio=Math.max(ratio,...keys.map(k=>.25/item[k]));}
    if(Math.abs(ratio-1)<1e-7)return false;for(const key of keys)item[key]=Math.round(item[key]*ratio*1e6)/1e6;
    const copy={...board,blocks:[...board.blocks]};if(!place(copy,item,item.x,item.y,index,{grid,fit:false}))return false;
    if(!preview)board.blocks[index]=copy.blocks[index];return true;
  }
  function remove(board,index){if(!Number.isInteger(index)||index<0||index>=board.blocks.length)return false;board.blocks.splice(index,1);return true;}
  function ink(hex){
    if(!/^#[0-9a-f]{6}$/i.test(hex))return '#173e35';
    const luminance=color=>{const c=[1,3,5].map(i=>{const v=parseInt(color.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    const value=luminance(hex);if((value+.05)/(luminance('#173e35')+.05)>=4.5)return '#173e35';return value<=.179?'#ffffff':'#000000';
  }
  const core={categories,items,stores,patterns,create,place,rotate,resize,remove,ink};
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function art(item,scope){
    if(item.kind==='numbers'||item.kind==='letters')return `<text x="0" y="0" dominant-baseline="central" text-anchor="middle" font-size="94" font-weight="900" fill="${ink(item.color)}">${esc(item.content)}</text>`;
    if(item.asset)return `<image href="${esc(item.asset)}" x="-55" y="-55" width="110" height="110" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>`;
    if(item.kind==='shapes')return geometryArt(item,scope,0,0,105,false);return '';
  }
  const effects=scope=>`<defs><linearGradient id="glossy-${scope}-sheen" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".67"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#152a24" stop-opacity=".2"/></linearGradient></defs>`;
  let shineSequence=0;
  const shapeShines={triangle:'M-23 8L-2-29',cone:'M-24 14L-3-29',diamond:'M-28-2L-4-28',cross:'M-8-32V-39Q-8-45-2-45H7',heart:'M-38-18Q-38-38-20-35',crescent:'M-26-27Q-42-4-27 17',cube:'M-33-30L-4-46',cylinder:'M-30-5V-14Q-30-22-22-22H8',semicircle:'M-27 18Q-19-1 4-3',arrow:'M-45-11H1',star:'M-5-27L0-43'};
  function geometryArt(item,scope,cx=90,cy=90,span=150,hit=true){
    const shape=geometryById(item.shapeId),token=`glossy-${scope}-art-${++shineSequence}`;
    if(shape.native){const b=shape.bounds,scale=span/Math.max(b.width,b.height),shine=shapeShines[shape.id]||'M-25-20Q-25-31-12-31H12';return `<g data-glossy-shape="${esc(shape.id)}" transform="translate(${cx} ${cy}) scale(${scale}) translate(${-b.x-b.width/2} ${-b.y-b.height/2})"${hit?'':' pointer-events="none"'}><defs><clipPath id="${token}">${shapeLibrary.primitive(shape.id,'#fff','none')}</clipPath></defs>${shapeLibrary.primitive(shape.id,item.color,'#274b44')}<g opacity=".45" pointer-events="none">${shapeLibrary.primitive(shape.id,`url(#glossy-${scope}-sheen)`,'none')}</g><path clip-path="url(#${token})" d="${shine}" fill="none" stroke="#fff" stroke-opacity=".76" stroke-width="5" stroke-linecap="round" pointer-events="none"/></g>`;}
    const scale=span/Math.max(shape.width,shape.height),rgb=[1,3,5].map(i=>parseInt(item.color.slice(i,i+2),16)/255);
    return `<g data-glossy-shape="${esc(shape.id)}" transform="translate(${cx} ${cy}) scale(${scale}) translate(${-shape.width/2} ${-shape.height/2})"><defs><filter id="${token}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues=".153 ${rgb[0]} 1"/><feFuncG type="table" tableValues=".294 ${rgb[1]} 1"/><feFuncB type="table" tableValues=".267 ${rgb[2]} 1"/></feComponentTransfer></filter></defs><image href="${esc(shape.asset)}" width="${shape.width}" height="${shape.height}" filter="url(#${token})" pointer-events="none"/>${hit?`<path data-glossy-hit="" d="${shape.hitPath}" fill="transparent" fill-rule="evenodd" pointer-events="all"/>`:''}</g>`;
  }
  function tile(item,scope='board'){
    if(['plain','mixed','colors'].includes(item.kind))return `<rect width="180" height="180" fill="transparent" pointer-events="${scope==='store'?'all':'none'}"/>`+geometryArt(item,scope,90,item.kind==='colors'?80:90)+(item.kind==='colors'?`<text x="90" y="174" text-anchor="middle" font-size="18" font-weight="800" fill="#173e35" pointer-events="none">${esc(item.name)}</text>`:'');
    const light=[1,3,5].reduce((sum,i)=>sum+parseInt(item.color.slice(i,i+2),16),0)>720,label=['numbers','letters'].includes(item.kind)?'':item.name,font=Math.min(label.length>9?18:22,160/Math.max(1,label.length*.6));
    return `<rect x="2.5" y="2.5" width="175" height="175" rx="3" fill="${item.color}" stroke="#527e62" stroke-width="5"/>${light?'<path d="M20 48Q20 20 48 20H143" fill="none" stroke="#8aa67a" stroke-opacity=".45" stroke-width="14" stroke-linecap="round"/>':''}<path d="M20 48Q20 20 48 20H143" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="10" stroke-linecap="round"/><g transform="translate(90 ${label?77:90}) scale(.82)">${art(item,scope)}</g>${label?`<text x="90" y="157" text-anchor="middle" font-size="${font}" font-weight="800" fill="${ink(item.color)}">${esc(label)}</text>`:''}`;
  }
  function turned(item,content){const fit=item.cellFit?(item.gridScale??1):1;return `<g data-glossy-transform="" data-glossy-rotation="${angleOf(item)}" transform="translate(90 90) rotate(${angleOf(item)}) scale(${(item.widthScale??1)*fit} ${(item.heightScale??1)*fit}) translate(-90 -90)">${content}</g>`;}
  function mount({app,scene,hint,feedback,complete,onReset}){
    const room=document.createElement('section');room.id='glossy-room';room.hidden=true;room.setAttribute('aria-label','Glossy Blocks playroom');
    room.innerHTML=`<div class="glossy-workspace"><section class="glossy-shelf" aria-label="Block shelf"><div class="glossy-shelf-heading"><h2>Stores</h2><button id="glossy-store-pan-hint" class="soft-button" type="button" aria-label="Scroll Stores to next row" title="See more Stores rows" hidden>↕</button><div class="glossy-paging"><button id="glossy-previous" class="soft-button" aria-label="Previous blocks" type="button">‹</button><output id="glossy-inventory"></output><button id="glossy-next" class="soft-button" aria-label="Next blocks" type="button">›</button></div></div><div class="glossy-store-canvas"><svg id="glossy-store" class="glossy-shelf-grid" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Available blocks"></svg></div></section><section class="glossy-build" aria-label="Assemble"><div class="glossy-build-heading"><h2>Assemble</h2><label class="glossy-blocks-label">Blocks <select id="glossy-category">${categories.filter(c=>!['plain','shapes','colors'].includes(c.id)).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><details id="glossy-colours" class="glossy-palette"><summary id="glossy-colour-toggle" aria-label="Block colours">Colour <span id="glossy-colour-preview" aria-hidden="true"></span></summary><div class="glossy-palette-panel"><div class="glossy-swatches" role="group" aria-label="Block colours">${palette.map(([name,color])=>`<button type="button" data-glossy-colour="${color}" aria-label="${name} block colour" aria-pressed="false" style="--swatch:${color}"></button>`).join('')}</div><label>Custom <input id="glossy-colour" type="color" value="#ed7b75" maxlength="7" pattern="#[0-9a-fA-F]{6}" aria-label="Custom block colour" aria-invalid="false"></label></div></details><span id="glossy-pan-hint" hidden aria-label="Scroll Assemble">↕</span><button id="glossy-size-toggle" class="soft-button secondary" type="button" aria-controls="glossy-size-panel" aria-expanded="false" disabled>Size</button><button id="glossy-rotate" class="soft-button secondary" type="button" aria-label="Rotate selected block 45 degrees clockwise" title="Rotate selected block 45°" disabled>Rotate</button><button id="glossy-grid" class="soft-button" type="button" aria-pressed="false">Grid</button><button id="glossy-snapshot" class="soft-button" type="button" aria-label="Save block snapshot" title="Save snapshot" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="4"/></svg></button><div class="glossy-actions"><output id="glossy-count" aria-live="polite">0 Blocks</output><button id="glossy-remove" class="soft-button secondary" type="button">Remove</button><button id="glossy-clear" class="soft-button secondary" type="button">Clear</button><button id="glossy-finish" class="soft-button" type="button">Done</button></div></div><div class="glossy-canvas"><svg id="glossy-board" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Building area" tabindex="0"></svg></div></section></div>`;
    const sizePanel=document.createElement('section');sizePanel.id='glossy-size-panel';sizePanel.hidden=true;sizePanel.tabIndex=-1;sizePanel.setAttribute('role','group');sizePanel.setAttribute('aria-label','Selected piece size');sizePanel.innerHTML='<div class="glossy-size-row"><select id="glossy-axis" aria-label="Dimension to change"><option value="both">Both</option><option value="width">Width</option><option value="height">Height</option></select><button id="glossy-decrease" class="soft-button" type="button" aria-label="Decrease selected dimension">−</button><button id="glossy-increase" class="soft-button" type="button" aria-label="Increase selected dimension">+</button></div><small id="glossy-size-note"></small>';app.append(sizePanel);
    scene.before(room);const $=id=>room.querySelector('#glossy-'+id)||sizePanel.querySelector('#glossy-'+id),svg=$('board'),shelf=room.querySelector('.glossy-shelf-grid');
    let board=create(2),age=2,level=1,active=false,page=0,pageSize=4,selected=-1,picked=null,pickedKey=null,pointer=null,demoTimer=null,demoBoard=null,done=false,grid=false,layoutFrame=0;
    let W=360,H=360,drawingKey='';
    const stock=()=>stores($('category').value,age),current=()=>demoBoard||board;
    function dimensions(){drawingKey='';const n=gridSize(age);W=H=n*SIZE;pageSize=n*n;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);shelf.setAttribute('viewBox',`0 0 ${W} ${H}`);room.style.setProperty('--glossy-canvas-min',`${n*45}px`);}
    // The SVG camera fills the complete pane. The source and board share a scale;
    // a viewport change also fits existing free-positioned pieces without moving them.
    function fitDrawing(){
      const a=svg.getBoundingClientRect(),s=shelf.getBoundingClientRect(),key=[a.width,a.height,s.width,s.height,W,H].map(n=>n.toFixed(3)).join('/');
      if(!a.width||!a.height||!s.width||!s.height||key===drawingKey)return false;
      drawingKey=key;let left=0,top=0,right=W,bottom=H;
      for(const b of board.blocks){const d=dimensionsOf(b),mx=(d.width-SIZE)/2,my=(d.height-SIZE)/2;left=Math.min(left,b.x-mx);top=Math.min(top,b.y-my);right=Math.max(right,b.x+SIZE+mx);bottom=Math.max(bottom,b.y+SIZE+my);}
      const scale=Math.min(s.width/W,s.height/H,a.width/(right-left),a.height/(bottom-top)),width=a.width/scale,height=a.height/scale;
      board.freeBounds={x:(left+right-width)/2,y:(top+bottom-height)/2,width,height};const v=board.freeBounds;
      svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.width} ${v.height}`);
      const sw=s.width/scale,sh=s.height/scale;shelf.setAttribute('viewBox',`${(W-sw)/2} ${(H-sh)/2} ${sw} ${sh}`);
      svg.dataset.gridSize=String(W/SIZE);return true;
    }
    function stopDemo(){const showing=!!demoBoard;clearTimeout(demoTimer);demoTimer=null;demoBoard=null;if(showing){room.dataset.demo='false';document.getElementById('show-me').setAttribute('aria-pressed','false');}}
    function releasePointer(){const held=pointer;pointer=null;if(held&&room.hasPointerCapture?.(held.id)){try{room.releasePointerCapture(held.id);}catch{/* The browser may already have cancelled this pointer. */}}return !!held;}
    function cancel(){const dragging=releasePointer(),showing=!!demoBoard;stopDemo();if(active&&(dragging||showing))renderBoard();}
    function renderBoard(){
      fitDrawing();const area=board.freeBounds||{x:0,y:0,width:W,height:H};
      const columns=W/SIZE;
      svg.innerHTML=effects('board')+`<rect x="${area.x+2}" y="${area.y+2}" width="${area.width-4}" height="${area.height-4}" rx="14" fill="#fffaf0" stroke="#8aa67a" stroke-width="4"/>`+(grid?`<g data-glossy-grid="" aria-hidden="true" fill="none" stroke="#9bb18f" stroke-width="1" vector-effect="non-scaling-stroke">${Array.from({length:columns+1},(_,i)=>`<path d="M${i*SIZE} 0V${H}"/>`).join('')}${Array.from({length:columns+1},(_,i)=>`<path d="M0 ${i*SIZE}H${W}"/>`).join('')}</g>`:'')+current().blocks.map((item,i)=>`<g transform="translate(${item.x} ${item.y})" data-glossy-placed="${i}" role="button" tabindex="0" aria-label="${esc(item.name)} block ${i+1}${i===selected?', selected':''}" aria-pressed="${i===selected}">${turned(item,tile(item)+`<rect data-glossy-placed-focus="" x="10" y="10" width="160" height="160" rx="8" fill="none" stroke="#173e35" stroke-width="6" stroke-dasharray="14 7" pointer-events="none"/>`)}</g>`).join('');
      syncColour();svg.dataset.blocks=JSON.stringify(board.blocks);$('count').textContent=board.blocks.length+' Block'+(board.blocks.length===1?'':'s');$('remove').disabled=selected<0||done||!!demoBoard;$('rotate').disabled=selected<0||done||!!demoBoard;$('size-toggle').disabled=selected<0||done||!!demoBoard;syncSize();$('clear').disabled=board.blocks.length===0||!!demoBoard;$('finish').disabled=board.blocks.length===0||done||!!demoBoard;$('snapshot').disabled=board.blocks.length===0||!!demoBoard;
    }
    function syncColour(){
      const color=board.blocks[selected]?.color||picked?.color||palette[0][1];
      $('colour').value=color;$('colour').setAttribute('aria-invalid','false');$('colour-preview').style.background=color;
      for(const button of room.querySelectorAll('[data-glossy-colour]'))button.setAttribute('aria-pressed',String(button.dataset.glossyColour===color));
    }
    function setColour(color){
      if(!validColor(color)){$('colour').setAttribute('aria-invalid','true');hint('Choose a named colour, or a full colour value.');return;}
      if(done||demoBoard)return;
      const recolour=item=>{const name=namedColours.find(entry=>entry[1].toLowerCase()===color.toLowerCase())?.[0]||'Custom colour';return {...item,color,...(item.kind==='colors'?{content:name,name}:{})};};
      if(selected>=0)board.blocks[selected]=recolour(board.blocks[selected]);else if(picked)picked=recolour(picked);else{syncColour();hint('Select a block first, then choose its colour.');return;}
      render();hint('Colour changed. Keep creating!');
    }
    function renderShelf(){
      const all=stock(),pages=Math.ceil(all.length/pageSize);page=Math.max(0,Math.min(page,pages-1));const previous=room.querySelector('#glossy-previous'),next=room.querySelector('#glossy-next');previous.hidden=pages<=1;next.hidden=pages<=1;const columns=W/SIZE;
      shelf.innerHTML=effects('store')+all.slice(page*pageSize,(page+1)*pageSize).map((item,slot)=>{const key=page+'/'+slot,shown=pickedKey===key&&picked?picked:item;return `<g transform="translate(${slot%columns*SIZE} ${Math.floor(slot/columns)*SIZE})" data-glossy-item="${item.id}" data-glossy-key="${key}" data-glossy-kind="${item.kind}" role="button" tabindex="0" aria-label="${esc(shown.name)} block" aria-pressed="${pickedKey===key}"><title>${esc(shown.name)}</title>${tile(shown,'store')}<rect data-glossy-source-focus="" x="10" y="10" width="160" height="160" rx="8" fill="none" stroke="#173e35" stroke-width="6" stroke-dasharray="14 7" pointer-events="none"/></g>`;}).join('');
      $('inventory').textContent=pageSize+' Blocks';$('inventory').setAttribute('aria-label',`${pageSize} Blocks. Page ${page+1} of ${pages}. ${all.length} choices available.`);$('previous').disabled=page===0;$('next').disabled=page===pages-1;
    }
    function updatePanHint(){if(!active)return;const canvas=room.querySelector('.glossy-canvas'),store=room.querySelector('.glossy-store-canvas');$('pan-hint').hidden=canvas.scrollHeight<=canvas.clientHeight+1;$('store-pan-hint').hidden=store.scrollHeight<=store.clientHeight+1;}
    room.querySelector('.glossy-canvas').addEventListener('scroll',updatePanHint,{passive:true});
    room.querySelector('.glossy-store-canvas').addEventListener('scroll',updatePanHint,{passive:true});
    $('store-pan-hint').addEventListener('click',()=>{cancel();const canvas=room.querySelector('.glossy-store-canvas'),cell=SIZE*Math.hypot(shelf.getScreenCTM().a,shelf.getScreenCTM().b);canvas.scrollTop=canvas.scrollTop+canvas.clientHeight>=canvas.scrollHeight-1?0:canvas.scrollTop+cell;});
    function render(){renderShelf();renderBoard();requestAnimationFrame(updatePanHint);}
    function reset(){cancel();closeSize();$('axis').value='both';onReset();done=false;board=create(Number(age)||2);drawingKey='';selected=-1;picked=null;pickedKey=null;$('colours').open=false;render();room.querySelector('.glossy-canvas').scrollTop=0;room.querySelector('.glossy-store-canvas').scrollTop=0;}
    function start(nextAge,nextLevel){active=true;age=nextAge;level=nextLevel;dimensions();room.hidden=false;page=0;$('category').value='mixed';grid=false;$('grid').setAttribute('aria-pressed','false');reset();layout();}
    function leave(){cancel();closeSize();$('colours').open=false;active=false;room.hidden=true;}
    function layout(){
      layoutFrame=0;if(!active)return;
      const rect=room.getBoundingClientRect(),pane=room.querySelector('.glossy-shelf').getBoundingClientRect(),compact=rect.height<300;
      if(room.classList.contains('glossy-compact')!==compact)room.classList.toggle('glossy-compact',compact);
      if(fitDrawing()){
        closeSize();renderBoard();const piece=svg.querySelector(`[data-glossy-placed="${selected}"]`),canvas=room.querySelector('.glossy-canvas');
        if(piece){const p=piece.getBoundingClientRect(),v=canvas.getBoundingClientRect(),cy=p.y+p.height/2;if(cy<v.top||cy>v.bottom)canvas.scrollTop+=(cy-(v.top+v.height/2))*canvas.offsetHeight/v.height;}
      }updatePanHint();
    }
    const sizes=new ResizeObserver(()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(layout);});sizes.observe(room);sizes.observe(svg);sizes.observe(shelf);
    function finish(){if(done||!board.blocks.length||demoBoard)return;cancel();done=true;selected=-1;renderBoard();hint('Your blocks are ready to snapshot.');}
    async function snapshot(){if(!board.blocks.length||demoBoard)return;const button=$('snapshot');button.disabled=true;hint('Preparing your snapshot…');let imageUrl;try{const copy=svg.cloneNode(true);copy.querySelectorAll('[data-glossy-placed-focus]').forEach(node=>node.remove());copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',String(W));copy.setAttribute('height',String(H));for(const image of copy.querySelectorAll('image')){const href=image.getAttribute('href');if(href&&!/^(?:data:|https?:|blob:)/.test(href))image.setAttribute('href',new URL(href,document.baseURI).href);}const source=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'});imageUrl=URL.createObjectURL(source);const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=imageUrl;});const scale=Math.min(2,2400/Math.max(W,H)),canvas=document.createElement('canvas');canvas.width=Math.round(W*scale);canvas.height=Math.round(H*scale);const context=canvas.getContext('2d');context.fillStyle='#fffaf0';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('Image export failed');const url=URL.createObjectURL(png),link=document.createElement('a'),stamp=new Date().toISOString().replace(/[:.]/g,'-');link.href=url;link.download=`SaNa-Blocks-${stamp}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);hint('Snapshot saved to Downloads.');}catch{hint('Snapshot could not be saved. Try again.');}finally{if(imageUrl)URL.revokeObjectURL(imageUrl);button.disabled=board.blocks.length===0||!!demoBoard;}}
    function added(item,x,y,index=-1){
      const block={...item};
      if(!place(board,block,x,y,index,{grid})){hint('That space is full. Try an empty spot.');renderBoard();return false;}
      selected=index<0?board.blocks.length-1:index;picked=null;pickedKey=null;renderShelf();renderBoard();feedback();hint('Block placed! Keep building.');return true;
    }
    function autoAdd(item){for(let y=0;y<=H-SIZE;y+=SIZE)for(let x=0;x<=W-SIZE;x+=SIZE)if(!board.blocks.some(b=>overlap({x,y},b))){added(item,x,y);svg.querySelector(`[data-glossy-placed="${selected}"]`)?.focus({preventScroll:true});return;}added(item,(W-SIZE)/2,(H-SIZE)/2);}
    function point(event){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;}
    function down(event){
      if(!active||done||demoBoard||event.button!==0||event.isPrimary===false||pointer)return;
      const itemNode=event.target.closest('[data-glossy-item]'),placedNode=event.target.closest('[data-glossy-placed]'),onBoard=svg.contains(event.target);
      if(!itemNode&&!onBoard)return;const p=point(event);if(!p)return;
      event.preventDefault();const index=placedNode&&!picked?Number(placedNode.dataset.glossyPlaced):-1,item=itemNode?stock().find(i=>i.id===itemNode.dataset.glossyItem):picked||board.blocks[index];
      if(!item)return;const offset=index>=0?{x:p.x-item.x,y:p.y-item.y}:{x:SIZE/2,y:SIZE/2};pointer={id:event.pointerId,item,index,offset,start:p,point:p,moved:false,kind:itemNode?'shelf':index>=0?'placed':'board'};
      if(itemNode){picked=item;pickedKey=itemNode.dataset.glossyKey;selected=-1;for(const button of shelf.querySelectorAll('[data-glossy-item]'))button.setAttribute('aria-pressed',String(button.dataset.glossyKey===pickedKey));}else if(index>=0)selected=index;
      try{room.setPointerCapture?.(event.pointerId);}catch{/* Window listeners still finish the gesture when capture is unavailable. */}
    }
    function move(event){if(!pointer||pointer.id!==event.pointerId)return;const p=point(event);if(!p)return;pointer.point=p;if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>8)pointer.moved=true;if(!pointer.moved)return;
      let preview=svg.querySelector('[data-glossy-drag]');if(!preview){const sample=create(age);place(sample,pointer.item,0,0,-1,{grid});preview=document.createElementNS('http://www.w3.org/2000/svg','g');preview.dataset.glossyDrag='';preview.setAttribute('opacity','.8');preview.setAttribute('pointer-events','none');preview.innerHTML=turned(sample.blocks[0]||pointer.item,tile(pointer.item));svg.append(preview);if(pointer.index>=0)svg.querySelector(`[data-glossy-placed="${pointer.index}"]`).setAttribute('visibility','hidden');}preview.setAttribute('transform',`translate(${p.x-pointer.offset.x} ${p.y-pointer.offset.y})`);
    }
    function up(event){if(!pointer||pointer.id!==event.pointerId)return;const action=pointer,p=point(event);releasePointer();
      if(event.type==='pointercancel'||!p){renderBoard();return;}
      const area=board.freeBounds||{x:0,y:0,width:W,height:H},clip=room.querySelector('.glossy-canvas').getBoundingClientRect(),insideView=event.clientX>=clip.left&&event.clientX<=clip.right&&event.clientY>=clip.top&&event.clientY<=clip.bottom,inside=insideView&&p.x>=area.x&&p.y>=area.y&&p.x<=area.x+area.width&&p.y<=area.y+area.height;
      if((action.moved||action.kind==='board')&&inside)added(action.item,p.x-action.offset.x,p.y-action.offset.y,action.index);
      else{if(action.kind==='placed'){selected=action.index;$('colour').value=action.item.color;hint('Block selected. Change its colour or drag it.');}else if(action.kind==='shelf')hint(action.item.name+': tap to place.');renderBoard();}
    }
    room.addEventListener('pointerdown',down);window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
    room.addEventListener('lostpointercapture',()=>{if(pointer)cancel();});
    shelf.addEventListener('keydown',event=>{const node=event.target.closest('[data-glossy-item]');if(node&&['Enter',' '].includes(event.key)&&!done&&!demoBoard){event.preventDefault();autoAdd(stock().find(item=>item.id===node.dataset.glossyItem));}});
    shelf.addEventListener('click',event=>{const node=event.target.closest('[data-glossy-item]');if(node&&event.detail===0&&!done&&!demoBoard)autoAdd(stock().find(item=>item.id===node.dataset.glossyItem));});
    svg.addEventListener('keydown',event=>{
      if(done||demoBoard)return;const target=event.target.closest('[data-glossy-placed]'),index=target?Number(target.dataset.glossyPlaced):-1;
      if(index<0&&['Enter',' '].includes(event.key)&&picked){event.preventDefault();autoAdd(picked);return;}
      if(index<0)return;selected=index;
      if(['Delete','Backspace'].includes(event.key)){event.preventDefault();remove(board,index);selected=-1;renderBoard();svg.focus();}
      else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const b=board.blocks[index];added(b,b.x+({'ArrowLeft':-SIZE,'ArrowRight':SIZE}[event.key]||0),b.y+({'ArrowUp':-SIZE,'ArrowDown':SIZE}[event.key]||0),index);svg.querySelector(`[data-glossy-placed="${index}"]`)?.focus();}
      else if(['Enter',' '].includes(event.key)){event.preventDefault();$('colour').value=board.blocks[index].color;renderBoard();svg.querySelector(`[data-glossy-placed="${index}"]`)?.focus();}
    });
    $('category').addEventListener('change',()=>{cancel();page=0;picked=null;pickedKey=null;selected=-1;render();hint('Pick a block. Build stays.');});
    $('colour').addEventListener('input',event=>setColour(event.target.value));
    room.querySelector('.glossy-swatches').addEventListener('click',event=>{const button=event.target.closest('[data-glossy-colour]');if(button){setColour(button.dataset.glossyColour);$('colours').open=false;$('colour-toggle').focus({preventScroll:true});}});
    function closeSize(restore=false){const wasOpen=!sizePanel.hidden;sizePanel.hidden=true;$('size-toggle').setAttribute('aria-expanded','false');if(restore&&wasOpen)$('size-toggle').focus({preventScroll:true});}
    function syncSize(){const disabled=selected<0||done||!!demoBoard;for(const [id,factor] of [['decrease',1/1.1],['increase',1.1]])$(id).disabled=disabled||!resize(board,selected,$('axis').value,factor,{grid,preview:true});$('size-note').textContent=grid?'Grid keeps pieces inside a cell.':'Change only this selected piece.';}
    $('size-toggle').addEventListener('click',()=>{if(!sizePanel.hidden){closeSize();return;}syncSize();sizePanel.hidden=false;$('size-toggle').setAttribute('aria-expanded','true');const ar=app.getBoundingClientRect(),br=$('size-toggle').getBoundingClientRect(),sx=ar.width/app.offsetWidth,sy=ar.height/app.offsetHeight,pw=sizePanel.offsetWidth,ph=sizePanel.offsetHeight,left=app.offsetWidth-pw-8,selectedBox=svg.querySelector(`[data-glossy-placed="${selected}"]`)?.getBoundingClientRect();
      const candidates=[(br.bottom-ar.top)/sy+4,(br.top-ar.top)/sy-ph-4,app.offsetHeight-ph-8].map(top=>({left,top:Math.max(8,Math.min(app.offsetHeight-ph-8,top))}));
      const covers=box=>selectedBox&&ar.left+box.left*sx<selectedBox.right&&ar.left+(box.left+pw)*sx>selectedBox.left&&ar.top+box.top*sy<selectedBox.bottom&&ar.top+(box.top+ph)*sy>selectedBox.top,position=candidates.find(box=>!covers(box))||candidates[0];sizePanel.style.left=Math.max(8,position.left)+'px';sizePanel.style.top=position.top+'px';sizePanel.focus({preventScroll:true});});
    $('axis').addEventListener('change',syncSize);
    for(const [id,factor] of [['decrease',1/1.1],['increase',1.1]])$(id).addEventListener('click',()=>{cancel();if(resize(board,selected,$('axis').value,factor,{grid})){renderBoard();feedback();hint($('axis').value==='both'?'Both dimensions changed.':$('axis').value==='width'?'Width changed.':'Height changed.');}});
    document.addEventListener('pointerdown',e=>{if(!sizePanel.hidden&&!sizePanel.contains(e.target)&&!$('size-toggle').contains(e.target))closeSize();},{capture:true});
    function rotateSelected(){if(done||demoBoard||selected<0)return;cancel();if(rotate(board,selected,45,{grid})){renderBoard();feedback();hint('Turned 45°.');}}
    $('rotate').addEventListener('click',rotateSelected);
    $('grid').addEventListener('click',()=>{cancel();grid=!grid;$('grid').setAttribute('aria-pressed',String(grid));renderBoard();hint(grid?'Grid on. New and moved blocks fit inside cells.':'Grid off. Use the whole Assemble window. Join and overlap freely.');});
    for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{cancel();page+=delta;renderShelf();});
    $('remove').addEventListener('click',()=>{if(done||demoBoard)return;remove(board,selected);selected=-1;renderBoard();hint('Block removed. Keep creating!');});
    $('clear').addEventListener('click',()=>{reset();hint('Fresh board. Pick a block.');});$('finish').addEventListener('click',finish);$('snapshot').addEventListener('click',snapshot);
    function demo(){if(!active||done)return;if(demoBoard){cancel();hint('Your turn! Your building is still here.');return;}cancel();demoBoard=create(Number(age)||2);room.dataset.demo='true';document.getElementById('show-me').setAttribute('aria-pressed','true');let step=0;const sample=items('plain',age);const tick=()=>{if(!active||!demoBoard)return;if(step===3){stopDemo();render();hint('Your turn! Select a block, then tap or drag it onto the board.');return;}place(demoBoard,sample[step],step===1?SIZE:0,step===2?SIZE:0,-1,{grid:true});step++;renderBoard();hint('Demo: put blocks beside each other.');demoTimer=setTimeout(tick,650);};tick();}
    window.addEventListener('keydown',event=>{
      if(!active||done||demoBoard||selected<0||event.key.toLowerCase()!=='r'||event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.('input,select,textarea,[contenteditable="true"]')||event.target!==document.body&&!room.contains(event.target)&&!sizePanel.contains(event.target))return;
      event.preventDefault();const wasBoard=svg.contains(event.target);rotateSelected();if(wasBoard)svg.querySelector(`[data-glossy-placed="${selected}"]`)?.focus({preventScroll:true});
    });
    window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){closeSize(true);cancel();$('colours').open=false;hint('Your building stays here. Choose a block to continue.');}},{capture:true});
    window.addEventListener('blur',()=>{if(active)cancel();});
    window.addEventListener('orientationchange',()=>{if(active)cancel();});window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    return {start,leave,reset,demo,cancel};
  }
  return {core,mount};
});
