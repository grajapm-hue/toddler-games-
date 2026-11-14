/* Shared-shell Glossy Blocks. Catalogue/model are also usable by local checks. */
((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./shape-library.js'):root.SaNaShapes);if(typeof module==='object'&&module.exports)module.exports=api;else root.SaNaGlossyBlocks=api;})(typeof window==='object'?window:globalThis,shapeLibrary=>{
  'use strict';
  const palette=[['Coral','#ed7b75'],['Yellow','#f5c84d'],['Green','#78b98b'],['Blue','#73bde0'],['Purple','#aa91d5'],['Orange','#eda05d'],['Pink','#e99fbd'],['White','#fffaf0'],['Brown','#ad805e'],['Grey','#8c9da0'],['Turquoise','#54b8b2'],['Navy','#405f76']];
  const categories=[['plain','Plain'],['mixed','Mixed'],['numbers','Numbers'],['letters','Letters'],['shapes','Shapes'],['animals','Animals'],['fruits','Fruits'],['vegetables','Vegetables'],['utensils','Utensils'],['colors','Colours']].map(([id,name])=>({id,name}));
  const names={shapes:['Circle','Square','Triangle','Rectangle','Heart','Oval','Diamond','Star','Pentagon','Hexagon'],animals:['Cat','Dog','Cow','Rabbit','Pig','Duck','Fox','Frog','Bear','Elephant'],fruits:['Apple','Banana','Mango','Orange','Grapes','Strawberry','Pear','Watermelon','Pineapple','Cherry'],vegetables:['Carrot','Tomato','Peas','Corn','Broccoli','Pepper','Onion','Potato','Pumpkin','Cucumber'],utensils:['Cup','Spoon','Plate','Fork','Bowl','Jug','Pan','Pot','Teapot','Bottle']};
  const patternList=[['Row',[[0,0],[1,0],[2,0]]],['Tower',[[0,0],[0,1],[0,2]]],['Steps',[[0,1],[1,1],[1,0]]],['Square',[[0,0],[1,0],[0,1],[1,1]]],['Staircase',[[0,2],[1,2],[1,1],[2,1],[2,0]]],['Rectangle',[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]],['Pyramid',[[0,1],[1,1],[2,1],[1,0]]],['Cross',[[1,0],[0,1],[1,1],[2,1],[1,2]]]].map(([name,cells])=>({name,cells}));
  const ageIndex=age=>Math.max(0,Math.min(3,(Number(age)||2)-2));
  function items(category,age){
    const a=ageIndex(age);
    if(category==='mixed')return shapeLibrary.shapes.slice(0,[4,12,20,20][a]).map(shape=>({id:'mixed-'+shape.id,kind:'mixed',shapeId:shape.id,name:shape.id[0].toUpperCase()+shape.id.slice(1),color:shape.color}));
    const count=category==='numbers'?[5,10,15,20][a]:category==='letters'?[6,12,20,26][a]:['plain','colors'].includes(category)?[6,8,10,12][a]:[4,6,8,10][a];
    return Array.from({length:count},(_,i)=>({id:category+'-'+i,kind:category,name:category==='numbers'?String(i+1):category==='letters'?String.fromCharCode(65+i):['plain','colors'].includes(category)?palette[i][0]:(names[category]||names.shapes)[i],color:palette[i%palette.length][1]}));
  }
  function patterns(age,level=1){if(ageIndex(age)===0)return [{name:'Row',cells:[[0,0],[1,0]]},{name:'Tower',cells:[[0,0],[0,1]]},patternList[2],patternList[3]];return patternList.slice(0,Math.min(8,[4,5,7,8][ageIndex(age)]+Math.max(0,level-1)));}
  const SIZE=180;
  const gridSize=age=>({2:2,3:3,4:4,5:6}[age]||2);
  const create=(age=2)=>{const n=gridSize(age);return{blocks:[],columns:n,rows:n};};
  const validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
  const overlap=(a,b)=>a.x<b.x+SIZE-1&&a.x+SIZE>b.x+1&&a.y<b.y+SIZE-1&&a.y+SIZE>b.y+1;
  const angleOf=item=>Number.isFinite(item.angle)?((item.angle%360)+360)%360:0;
  const turnSpan=item=>{const radians=angleOf(item)*Math.PI/180;return Math.abs(Math.cos(radians))+Math.abs(Math.sin(radians));};
  function place(board,item,x,y,index=-1,{grid=false}={}){
    if(!item||!validColor(item.color)||(item.angle!==undefined&&!Number.isFinite(item.angle))||![x,y].every(Number.isFinite)||!Number.isInteger(index)||index< -1||index>=board.blocks.length)return false;
    const W=(board.columns||2)*SIZE,H=(board.rows||2)*SIZE;
    const area=!grid&&board.freeBounds?board.freeBounds:{x:0,y:0,width:W,height:H},margin=grid?0:(turnSpan(item)-1)*SIZE/2;
    const bound=p=>({x:Math.max(area.x+margin,Math.min(area.x+area.width-SIZE-margin,p.x)),y:Math.max(area.y+margin,Math.min(area.y+area.height-SIZE-margin,p.y))});
    // Free build follows the child's exact position; square hit boxes must not block
    // irregular shapes from interlocking. Grid is an optional alignment aid only.
    let point=bound({x,y});
    if(grid)point=bound({x:Math.round(point.x/SIZE)*SIZE,y:Math.round(point.y/SIZE)*SIZE});
    const block={...item,...point,cellFit:!!grid};if(index<0)board.blocks.push(block);else board.blocks[index]=block;return true;
  }
  function rotate(board,index,step=45,{grid=false}={}){
    if(!Number.isInteger(index)||!board.blocks[index]||!Number.isFinite(step))return false;
    const item=board.blocks[index];return place(board,{...item,angle:((angleOf(item)+step)%360+360)%360},item.x,item.y,index,{grid});
  }
  function remove(board,index){if(!Number.isInteger(index)||index<0||index>=board.blocks.length)return false;board.blocks.splice(index,1);return true;}
  function ink(hex){
    if(!/^#[0-9a-f]{6}$/i.test(hex))return '#173e35';
    const luminance=color=>{const c=[1,3,5].map(i=>{const v=parseInt(color.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    const value=luminance(hex);if((value+.05)/(luminance('#173e35')+.05)>=4.5)return '#173e35';return value<=.179?'#ffffff':'#000000';
  }
  const core={categories,items,patterns,create,place,rotate,remove,ink};
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function art(item){
    const n=item.name,k=item.kind,stroke='stroke="#294f43" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
    if(k==='numbers'||k==='letters')return `<text x="0" y="22" text-anchor="middle" font-size="77" font-weight="900" fill="${ink(item.color)}">${esc(n)}</text>`;
    if(k==='plain'||k==='colors')return '';
    if(k==='shapes'){
      const forms={Circle:'<circle r="42"/>',Square:'<rect x="-40" y="-40" width="80" height="80" rx="4"/>',Triangle:'<path d="M0-46L46 38H-46Z"/>',Rectangle:'<rect x="-49" y="-29" width="98" height="58" rx="4"/>',Heart:'<path d="M0 43C-78-5-42-68 0-30C42-68 78-5 0 43Z"/>',Oval:'<ellipse rx="48" ry="32"/>',Diamond:'<path d="M0-46L38 0L0 46L-38 0Z"/>',Star:'<path d="M0-49L14-15L49-15L23 7L33 43L0 22L-33 43L-23 7L-49-15L-14-15Z"/>',Pentagon:'<path d="M0-48L46-15L29 40H-29L-46-15Z"/>',Hexagon:'<path d="M-25-42H25L49 0L25 42H-25L-49 0Z"/>'};
      return `<g fill="#fffaf0" ${stroke}>${forms[n]}</g>`;
    }
    if(k==='animals'){
      const body={Cat:'#eeb75d',Dog:'#c39b75',Cow:'#fffaf0',Rabbit:'#fffaf0',Pig:'#efa6b0',Duck:'#f5d35d',Fox:'#e99b5c',Frog:'#85c774',Bear:'#b98e68',Elephant:'#a6b7c4'}[n];
      const ears=n==='Rabbit'?'<ellipse cx="-23" cy="-43" rx="13" ry="34"/><ellipse cx="23" cy="-43" rx="13" ry="34"/>':n==='Cat'||n==='Fox'?'<path d="M-40-13L-44-58L-6-35M40-13L44-58L6-35"/>':n==='Dog'?'<ellipse cx="-41" cy="-4" rx="16" ry="36"/><ellipse cx="41" cy="-4" rx="16" ry="36"/>':n==='Elephant'?'<ellipse cx="-43" rx="24" ry="37"/><ellipse cx="43" rx="24" ry="37"/>':n==='Cow'?'<path d="M-28-31L-35-57L-12-35M28-31L35-57L12-35"/>':'<circle cx="-29" cy="-30" r="18"/><circle cx="29" cy="-30" r="18"/>';
      const mouth=n==='Elephant'?'<path d="M-10 17V54Q8 69 22 48" fill="none" stroke="#294f43" stroke-width="15"/>':n==='Duck'?'<path d="M-24 15Q0 0 24 15L0 36Z" fill="#ef9848"/>':n==='Pig'||n==='Cow'?'<ellipse cy="19" rx="23" ry="15" fill="#efb2b0"/><circle cx="-8" cy="19" r="3"/><circle cx="8" cy="19" r="3"/>':'<path d="M-13 19Q0 32 13 19M-5 10H5L0 16Z" fill="#294f43"/>';
      return `<g fill="${body}" ${stroke}>${ears}<circle r="40"/></g><g fill="#294f43"><circle cx="-14" cy="-5" r="5"/><circle cx="14" cy="-5" r="5"/>${mouth}</g>`;
    }
    if(k==='fruits'){
      const forms={Apple:'<path d="M0-27C-70-62-55 44-15 45Q0 38 15 45C55 44 70-62 0-27Z" fill="#e9665e"/>',Banana:'<path d="M-40-39Q-31 46 46-25Q30 69-29 43Q-63 13-40-39Z" fill="#ffe16a"/>',Mango:'<path d="M0-40C72-24 42 55-4 46C-62 38-41-44 0-40Z" fill="#ffbd4f"/>',Orange:'<circle r="43" fill="#f3a146"/>',Grapes:'<g fill="#a47dc6"><circle cx="-20" cy="-17" r="19"/><circle cx="18" cy="-17" r="19"/><circle cx="-20" cy="16" r="19"/><circle cx="18" cy="16" r="19"/><circle cy="43" r="17"/></g>',Strawberry:'<path d="M-38-24Q0-47 38-24Q36 18 0 47Q-36 18-38-24Z" fill="#ed746e"/><path d="M-18-7L-14-1M12-12L16-6M-2 15L2 21" stroke="#fff4b4"/>',Pear:'<path d="M-13-38Q0-50 13-38Q13-13 32 8C64 67-64 67-32 8Q-13-13-13-38Z" fill="#c6d269"/>',Watermelon:'<path d="M-47-27H47Q45 64 0 48Q-45 64-47-27Z" fill="#ed7c7b" stroke="#65a66d" stroke-width="13"/><path d="M-17-3L-14 4M15-3L12 4M0 22V28"/>',Pineapple:'<ellipse cy="13" rx="34" ry="43" fill="#edc35d"/><path d="M-30-21L-22-59L0-37L16-65L30-22M-24-7L24 33M24-7L-24 33" fill="#78ac73"/>',Cherry:'<circle cx="-24" cy="23" r="23" fill="#d85f6e"/><circle cx="26" cy="26" r="23" fill="#d85f6e"/><path d="M-24 0L2-48L26 3" fill="none"/>'};
      return `<g ${stroke}>${forms[n]}<path d="M0-35Q-2-58 19-53Q17-36 0-35Z" fill="#6eae73"/></g>`;
    }
    if(k==='vegetables'){
      const forms={Carrot:'<path d="M-28-26L28-26L0 52Z" fill="#eda05d"/><path d="M0-26L-18-56M0-26V-62M0-26L22-56" stroke="#6fa574"/>',Tomato:'<circle r="42" fill="#e97467"/><path d="M0-27L-25-43L0-38L23-48L14-25Z" fill="#6fa574"/>',Peas:'<path d="M-49 10Q-9-52 48-13Q18 52-49 10Z" fill="#80b772"/><g fill="#c2dc82"><circle cx="-20" cy="4" r="12"/><circle cx="5" cy="-2" r="12"/><circle cx="29" cy="-7" r="12"/></g>',Corn:'<ellipse rx="25" ry="50" fill="#f7d667"/><path d="M-25 45Q-62 4-37-14L-7 43M25 45Q62 4 37-14L7 43" fill="#80b772"/><path d="M-10-35V29M9-35V29M-22-17H22M-23 3H23M-22 22H22" stroke="#cea64a" stroke-width="3"/>',Broccoli:'<path d="M-9-2L-17 51H18L9-2Z" fill="#a0be76"/><g fill="#69a96c"><circle cx="-25" cy="-15" r="25"/><circle cy="-32" r="29"/><circle cx="26" cy="-13" r="25"/></g>',Pepper:'<path d="M-31-30Q0-47 31-30Q59 42 21 45L0 36L-20 45Q-59 42-31-30Z" fill="#e87b62"/><path d="M0-36Q-10-60 15-58" fill="none" stroke="#72a470"/>',Onion:'<path d="M0-49Q8-24 29-4Q62 47 0 48Q-62 47-29-4Q-8-24 0-49Z" fill="#e0b4ce"/><path d="M0-24Q-28 18-10 39M5-20Q32 19 13 40" fill="none"/>',Potato:'<path d="M-36-20Q-7-61 33-27Q65 9 25 43Q-35 65-46 22Z" fill="#c2a079"/><g fill="#8e755e" stroke="none"><circle cx="-15" cy="-10" r="5"/><circle cx="18" cy="15" r="4"/><circle cx="-15" cy="29" r="4"/></g>',Pumpkin:'<ellipse rx="48" ry="39" fill="#e9a25e"/><ellipse rx="23" ry="39" fill="#f2b762"/><path d="M0-36L6-57" stroke="#6d9b68"/>',Cucumber:'<rect x="-23" y="-53" width="46" height="106" rx="23" fill="#7db778" transform="rotate(27)"/><path d="M-9-29L-5-25M8-8L12-4M-10 16L-6 20" stroke="#d1dfad"/>'};
      return `<g ${stroke}>${forms[n]}</g>`;
    }
    const forms={Cup:'<path d="M-35-29H25V38H-35Z"/><path d="M25-21H42Q65 5 25 15" fill="none"/>',Spoon:'<ellipse cy="-26" rx="24" ry="31"/><rect x="-7" y="2" width="14" height="56" rx="6"/>',Plate:'<circle r="49"/><circle r="34" fill="#fffaf0"/>',Fork:'<path d="M-23-53V-14Q0 8 23-14V-53M0-53V53M-22-22H22" fill="none" stroke-width="12"/>',Bowl:'<path d="M-49-21H49Q43 44 0 44Q-43 44-49-21Z"/><ellipse cy="-21" rx="49" ry="12" fill="#fffaf0"/>',Jug:'<path d="M-29-46H22V-13Q54 52-31 48L-29-46L-48-40Z"/><path d="M24-22Q75-28 37 25" fill="none"/>',Pan:'<ellipse cx="-12" cy="6" rx="39" ry="29"/><path d="M26 6H69" stroke-width="15"/>',Pot:'<path d="M-39-22H39V36Q0 59-39 36Z"/><path d="M-48-25H48M-10-38H10M-39-6H-58M39-6H58" fill="none"/>',Teapot:'<ellipse cy="10" rx="38" ry="36"/><path d="M-31 0L-59-22L-48 26L-26 28M35-13Q81-28 46 32M-23-29H23M0-44V-30" fill="none"/>',Bottle:'<path d="M-12-52H12V-24L26-7V49H-26V-7L-12-24Z"/><path d="M-12-40H12M-23 3H23V28H-23Z" fill="#fffaf0"/>'};
    return `<g fill="#a7d6df" ${stroke}>${forms[n]||''}</g>`;
  }
  const effects=scope=>`<defs><linearGradient id="glossy-${scope}-sheen" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".67"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#152a24" stop-opacity=".2"/></linearGradient></defs>`;
  function tile(source,scope='board'){const item={...source,color:validColor(source.color)?source.color:'#ed7b75'};if(item.kind==='mixed')return `<rect width="180" height="180" fill="transparent" pointer-events="${scope==='store'?'all':'none'}"/><g data-glossy-shape="${esc(item.shapeId)}" transform="translate(90 90) scale(1.35)">${shapeLibrary.primitive(item.shapeId,item.color,'#274b44')}<g opacity=".45" pointer-events="none">${shapeLibrary.primitive(item.shapeId,`url(#glossy-${scope}-sheen)`,'none')}</g></g>`;return `<rect x="2.5" y="2.5" width="175" height="175" rx="3" fill="${item.color}" stroke="#527e62" stroke-width="5"/><path d="M20 48Q20 20 48 20H143" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="10" stroke-linecap="round"/><g transform="translate(90 77) scale(.82)">${art(item)}</g><text x="90" y="157" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${item.name.length>9?18:22}" font-weight="800" fill="${ink(item.color)}">${item.kind==='plain'?'':esc(item.name)}</text>`;}
  function turned(item,content){const angle=angleOf(item);if(!angle)return content;return `<g data-glossy-rotation="${angle}" transform="translate(90 90) rotate(${angle}) scale(${item.cellFit?1/turnSpan(item):1}) translate(-90 -90)">${content}</g>`;}
  function mount({app,scene,hint,feedback,complete,onReset}){
    const room=document.createElement('section');room.id='glossy-room';room.hidden=true;room.setAttribute('aria-label','Glossy Blocks playroom');
    room.innerHTML=`<div class="glossy-tools"><label>Blocks <select id="glossy-category">${categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><details id="glossy-colours" class="glossy-palette"><summary id="glossy-colour-toggle" aria-label="Block colours">Colour <span id="glossy-colour-preview" aria-hidden="true"></span></summary><div class="glossy-palette-panel"><div class="glossy-swatches" role="group" aria-label="Block colours">${palette.map(([name,color])=>`<button type="button" data-glossy-colour="${color}" aria-label="${name} block colour" aria-pressed="false" style="--swatch:${color}"></button>`).join('')}</div><label>Custom <input id="glossy-colour" type="color" value="#ed7b75" maxlength="7" pattern="#[0-9a-fA-F]{6}" aria-label="Custom block colour" aria-invalid="false"></label></div></details><label>Pattern <select id="glossy-pattern"><option value="">Free build</option></select></label></div><div class="glossy-workspace"><section class="glossy-shelf" aria-label="Block shelf"><div class="glossy-shelf-heading"><h2>Stores</h2><button id="glossy-store-pan-hint" class="soft-button" type="button" aria-label="Scroll Stores to next row" title="See more Stores rows" hidden>↕</button><div class="glossy-paging"><button id="glossy-previous" class="soft-button" aria-label="Previous blocks" type="button">‹</button><output id="glossy-inventory"></output><button id="glossy-next" class="soft-button" aria-label="Next blocks" type="button">›</button></div></div><div class="glossy-store-canvas"><svg id="glossy-store" class="glossy-shelf-grid" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Available blocks"></svg></div></section><section class="glossy-build" aria-label="Assemble"><div class="glossy-build-heading"><h2>Assemble</h2><span id="glossy-pan-hint" hidden>Swipe ↕</span><button id="glossy-rotate" class="soft-button secondary" type="button" aria-label="Rotate selected block 45 degrees clockwise" title="Rotate selected block 45°" disabled>Rotate</button><button id="glossy-grid" class="soft-button" type="button" aria-pressed="false">Grid</button></div><div class="glossy-canvas"><svg id="glossy-board" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Building area" tabindex="0"></svg></div></section></div><div class="glossy-actions"><output id="glossy-count" aria-live="polite">0 blocks</output><button id="glossy-remove" class="soft-button secondary" type="button">Remove</button><button id="glossy-clear" class="soft-button secondary" type="button">Clear</button><button id="glossy-finish" class="soft-button" type="button">Finished</button></div>`;
    scene.before(room);const $=id=>room.querySelector('#glossy-'+id),svg=$('board'),shelf=room.querySelector('.glossy-shelf-grid');
    let board=create(2),age=2,level=1,active=false,page=0,pageSize=4,selected=-1,picked=null,pickedKey=null,pointer=null,demoTimer=null,demoBoard=null,done=false,grid=false,layoutFrame=0;
    let W=360,H=360,drawingKey='';
    const stock=()=>items($('category').value,age),current=()=>demoBoard||board;
    function dimensions(){drawingKey='';const n=gridSize(age);W=H=n*SIZE;pageSize=n*n;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);shelf.setAttribute('viewBox',`0 0 ${W} ${H}`);room.style.setProperty('--glossy-canvas-min',`${n*45}px`);}
    // The SVG camera fills the complete pane. The source and board share a scale;
    // a viewport change also fits existing free-positioned pieces without moving them.
    function fitDrawing(){
      const a=svg.getBoundingClientRect(),s=shelf.getBoundingClientRect(),key=[a.width,a.height,s.width,s.height,W,H].map(n=>n.toFixed(3)).join('/');
      if(!a.width||!a.height||!s.width||!s.height||key===drawingKey)return false;
      drawingKey=key;let left=0,top=0,right=W,bottom=H;
      for(const b of board.blocks){const margin=b.cellFit?0:(turnSpan(b)-1)*SIZE/2;left=Math.min(left,b.x-margin);top=Math.min(top,b.y-margin);right=Math.max(right,b.x+SIZE+margin);bottom=Math.max(bottom,b.y+SIZE+margin);}
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
      const guide=patterns(age,level)[Number($('pattern').value)],columns=W/SIZE;
      const gx=guide?Math.floor((columns-Math.max(...guide.cells.map(p=>p[0]))-1)/2)*SIZE:0,gy=guide?Math.floor((columns-Math.max(...guide.cells.map(p=>p[1]))-1)/2)*SIZE:0;
      svg.innerHTML=effects('board')+`<rect x="${area.x+2}" y="${area.y+2}" width="${area.width-4}" height="${area.height-4}" rx="14" fill="#fffaf0" stroke="#8aa67a" stroke-width="4"/>`+(grid?`<g data-glossy-grid="" aria-hidden="true" fill="none" stroke="#9bb18f" stroke-width="1" vector-effect="non-scaling-stroke">${Array.from({length:columns+1},(_,i)=>`<path d="M${i*SIZE} 0V${H}"/>`).join('')}${Array.from({length:columns+1},(_,i)=>`<path d="M0 ${i*SIZE}H${W}"/>`).join('')}</g>`:'')+(!demoBoard&&$('pattern').value!==''&&guide?`<g aria-hidden="true" opacity=".2" fill="#78aabc" stroke="#527e62" stroke-width="3">${guide.cells.map(([x,y])=>`<rect x="${gx+x*SIZE}" y="${gy+y*SIZE}" width="${SIZE}" height="${SIZE}" rx="10"/>`).join('')}</g>`:'')+current().blocks.map((item,i)=>`<g transform="translate(${item.x} ${item.y})" data-glossy-placed="${i}" role="button" tabindex="0" aria-label="${esc(item.name)} block ${i+1}${i===selected?', selected':''}" aria-pressed="${i===selected}">${turned(item,tile(item)+`<rect data-glossy-placed-focus="" x="10" y="10" width="160" height="160" rx="8" fill="none" stroke="#173e35" stroke-width="6" stroke-dasharray="14 7" pointer-events="none"/>`)}</g>`).join('');
      syncColour();svg.dataset.blocks=JSON.stringify(board.blocks);$('count').textContent=board.blocks.length+' block'+(board.blocks.length===1?'':'s');$('remove').disabled=selected<0||done||!!demoBoard;$('rotate').disabled=selected<0||done||!!demoBoard;$('clear').disabled=board.blocks.length===0||!!demoBoard;$('finish').disabled=board.blocks.length===0||done||!!demoBoard;
    }
    function syncColour(){
      const color=board.blocks[selected]?.color||picked?.color||palette[0][1];
      $('colour').value=color;$('colour').setAttribute('aria-invalid','false');$('colour-preview').style.background=color;
      for(const button of room.querySelectorAll('[data-glossy-colour]'))button.setAttribute('aria-pressed',String(button.dataset.glossyColour===color));
    }
    function setColour(color){
      if(!validColor(color)){$('colour').setAttribute('aria-invalid','true');hint('Choose a named colour, or a full colour value.');return;}
      if(done||demoBoard)return;
      const recolour=item=>({...item,color,...(item.kind==='colors'?{name:palette.find(entry=>entry[1].toLowerCase()===color.toLowerCase())?.[0]||'Custom colour'}:{})});
      if(selected>=0)board.blocks[selected]=recolour(board.blocks[selected]);else if(picked)picked=recolour(picked);else{syncColour();hint('Select a block first, then choose its colour.');return;}
      render();hint('Colour changed. Keep creating!');
    }
    function renderShelf(){
      const all=stock(),pages=Math.ceil(all.length/pageSize);page=Math.max(0,Math.min(page,pages-1));const columns=W/SIZE;
      shelf.innerHTML=effects('store')+Array.from({length:pageSize},(_,slot)=>{const item=all[(page*pageSize+slot)%all.length],key=page+'/'+slot;return `<g transform="translate(${slot%columns*SIZE} ${Math.floor(slot/columns)*SIZE})" data-glossy-item="${item.id}" data-glossy-key="${key}" data-glossy-kind="${item.kind}" role="button" tabindex="0" aria-label="${esc(item.name)} block" aria-pressed="${pickedKey===key}"><title>${esc(item.name)}</title>${tile(pickedKey===key&&picked?picked:item,'store')}<rect data-glossy-source-focus="" x="10" y="10" width="160" height="160" rx="8" fill="none" stroke="#173e35" stroke-width="6" stroke-dasharray="14 7" pointer-events="none"/></g>`;}).join('');
      $('inventory').textContent=pageSize+' blocks';$('inventory').setAttribute('aria-label',`${pageSize} blocks. Page ${page+1} of ${pages}. ${all.length} choices available.`);$('previous').disabled=page===0;$('next').disabled=page===pages-1;
    }
    function updatePanHint(){if(!active)return;const canvas=room.querySelector('.glossy-canvas'),store=room.querySelector('.glossy-store-canvas');$('pan-hint').hidden=canvas.scrollHeight<=canvas.clientHeight+1;$('store-pan-hint').hidden=store.scrollHeight<=store.clientHeight+1;}
    room.querySelector('.glossy-canvas').addEventListener('scroll',updatePanHint,{passive:true});
    room.querySelector('.glossy-store-canvas').addEventListener('scroll',updatePanHint,{passive:true});
    $('store-pan-hint').addEventListener('click',()=>{cancel();const canvas=room.querySelector('.glossy-store-canvas'),cell=SIZE*Math.hypot(shelf.getScreenCTM().a,shelf.getScreenCTM().b);canvas.scrollTop=canvas.scrollTop+canvas.clientHeight>=canvas.scrollHeight-1?0:canvas.scrollTop+cell;});
    function render(){renderShelf();renderBoard();requestAnimationFrame(updatePanHint);}
    function reset(){cancel();onReset();done=false;board=create(Number(age)||2);drawingKey='';selected=-1;picked=null;pickedKey=null;$('colours').open=false;render();room.querySelector('.glossy-canvas').scrollTop=0;room.querySelector('.glossy-store-canvas').scrollTop=0;}
    function start(nextAge,nextLevel){active=true;age=nextAge;level=nextLevel;dimensions();room.hidden=false;page=0;$('category').value='plain';grid=false;$('grid').setAttribute('aria-pressed','false');$('pattern').innerHTML='<option value="">Free build</option>'+patterns(age,level).map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');reset();layout();}
    function leave(){cancel();$('colours').open=false;active=false;room.hidden=true;}
    function layout(){
      layoutFrame=0;if(!active)return;
      const rect=room.getBoundingClientRect(),pane=room.querySelector('.glossy-shelf').getBoundingClientRect(),compact=rect.height<300;
      if(room.classList.contains('glossy-compact')!==compact)room.classList.toggle('glossy-compact',compact);
      if(fitDrawing()){
        renderBoard();const piece=svg.querySelector(`[data-glossy-placed="${selected}"]`),canvas=room.querySelector('.glossy-canvas');
        if(piece){const p=piece.getBoundingClientRect(),v=canvas.getBoundingClientRect(),cy=p.y+p.height/2;if(cy<v.top||cy>v.bottom)canvas.scrollTop+=(cy-(v.top+v.height/2))*canvas.offsetHeight/v.height;}
      }updatePanHint();
    }
    const sizes=new ResizeObserver(()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(layout);});sizes.observe(room);sizes.observe(svg);sizes.observe(shelf);
    function finish(){if(done||!board.blocks.length||demoBoard)return;cancel();done=true;renderBoard();complete('Wonderful building! Let’s make another one.');}
    function added(item,x,y,index=-1){
      const block={...item};
      if(!place(board,block,x,y,index,{grid})){hint('That space is full. Try an empty spot.');renderBoard();return false;}
      selected=index<0?board.blocks.length-1:index;picked=null;pickedKey=null;for(const button of shelf.querySelectorAll('[data-glossy-item]'))button.setAttribute('aria-pressed','false');renderBoard();feedback();hint('Block placed! Keep building.');return true;
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
      let preview=svg.querySelector('[data-glossy-drag]');if(!preview){preview=document.createElementNS('http://www.w3.org/2000/svg','g');preview.dataset.glossyDrag='';preview.setAttribute('opacity','.8');preview.setAttribute('pointer-events','none');preview.innerHTML=turned({...pointer.item,cellFit:grid},tile(pointer.item));svg.append(preview);if(pointer.index>=0)svg.querySelector(`[data-glossy-placed="${pointer.index}"]`).setAttribute('visibility','hidden');}preview.setAttribute('transform',`translate(${p.x-pointer.offset.x} ${p.y-pointer.offset.y})`);
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
    function rotateSelected(){if(done||demoBoard||selected<0)return;cancel();if(rotate(board,selected,45,{grid})){renderBoard();feedback();hint('Turned 45°.');}}
    $('rotate').addEventListener('click',rotateSelected);
    $('grid').addEventListener('click',()=>{cancel();grid=!grid;$('grid').setAttribute('aria-pressed',String(grid));renderBoard();hint(grid?'Grid on. New and moved blocks fit inside cells.':'Grid off. Use the whole Assemble window. Join and overlap freely.');});
    $('pattern').addEventListener('change',()=>{cancel();renderBoard();hint($('pattern').value===''?'Free build. Make anything you like!':'Follow the faint blocks, or build your own idea.');});
    for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{cancel();page+=delta;renderShelf();});
    $('remove').addEventListener('click',()=>{if(done||demoBoard)return;remove(board,selected);selected=-1;renderBoard();hint('Block removed. Keep creating!');});
    $('clear').addEventListener('click',()=>{reset();hint('Fresh board. Pick a block.');});$('finish').addEventListener('click',finish);
    function demo(){if(!active||done)return;if(demoBoard){cancel();hint('Your turn! Your building is still here.');return;}cancel();demoBoard=create(Number(age)||2);room.dataset.demo='true';document.getElementById('show-me').setAttribute('aria-pressed','true');let step=0;const sample=items('plain',age);const tick=()=>{if(!active||!demoBoard)return;if(step===3){stopDemo();render();hint('Your turn! Select a block, then tap or drag it onto the board.');return;}place(demoBoard,sample[step],step===1?SIZE:0,step===2?SIZE:0,-1,{grid:true});step++;renderBoard();hint('Demo: put blocks beside each other.');demoTimer=setTimeout(tick,650);};tick();}
    window.addEventListener('keydown',event=>{
      if(!active||done||demoBoard||selected<0||event.key.toLowerCase()!=='r'||event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.('input,select,textarea,[contenteditable="true"]')||event.target!==document.body&&!room.contains(event.target))return;
      event.preventDefault();const wasBoard=svg.contains(event.target);rotateSelected();if(wasBoard)svg.querySelector(`[data-glossy-placed="${selected}"]`)?.focus({preventScroll:true});
    });
    window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){cancel();$('colours').open=false;hint('Your building stays here. Choose a block to continue.');}},{capture:true});
    window.addEventListener('blur',()=>{if(active)cancel();});
    window.addEventListener('orientationchange',()=>{if(active)cancel();});window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
    return {start,leave,reset,demo,cancel};
  }
  return {core,mount};
});
