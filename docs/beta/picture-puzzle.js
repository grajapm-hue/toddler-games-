(function(root){
  'use strict';
  const solved=board=>board.placed.every(Boolean);
  function create(size,random=Math.random){
    if(![2,3,4,5].includes(size))throw new RangeError('Grid must be 2 to 5');
    const tiles=Array.from({length:size*size},(_,i)=>i+1);
    for(let i=tiles.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}
    if(tiles.every((value,i)=>value===i+1))[tiles[0],tiles[1]]=[tiles[1],tiles[0]];
    return {size,tiles,placed:Array(size*size).fill(false)};
  }
  function place(board,value){
    if(!Number.isInteger(value)||value<1||value>board.size*board.size||board.placed[value-1])return false;
    board.placed[value-1]=true;return true;
  }
  const core={solved,create,place};
  if(typeof module==='object'&&module.exports){module.exports={core};return;}
  function mount({app,scene,strip,hint,complete,status,readyChanged,onReset}){
    const panel=document.createElement('section');panel.id='picture-puzzle';panel.hidden=true;panel.setAttribute('aria-label','Picture Puzzle');
    panel.innerHTML='<div class="puzzle-stage"><section class="puzzle-half" aria-label="Scrambled pieces"><span class="puzzle-panel-label">Pieces</span><div class="puzzle-canvas"><div id="puzzle-board" class="puzzle-grid" data-puzzle-side="pieces" role="group" aria-label="Choose a picture piece" data-ready="false"></div></div></section><section class="puzzle-half" aria-label="Your picture"><span class="puzzle-panel-label">Your picture</span><div class="puzzle-canvas"><div id="puzzle-target-board" class="puzzle-grid" data-puzzle-side="picture" role="group" aria-label="Drop pieces here to make the picture"></div><img id="puzzle-reference" class="puzzle-reference" alt="Complete picture to help make your picture" hidden></div></section><div id="puzzle-demo-hand" hidden aria-hidden="true">☝️</div></div><span id="puzzle-message" class="visually-hidden" role="status" aria-live="polite"></span>';
    scene.after(panel);
    const $=id=>panel.querySelector('#'+id),boardNode=$('puzzle-board'),targetNode=$('puzzle-target-board'),stage=panel.querySelector('.puzzle-stage'),halves=[...stage.querySelectorAll(':scope>.puzzle-half')],reference=$('puzzle-reference'),hand=$('puzzle-demo-hand'),message=$('puzzle-message');
    const file=document.createElement('input');file.type='file';file.accept='image/*';file.id='puzzle-file';file.hidden=true;panel.append(file);
    let active=false,age=2,board=null,picture=null,numbers=true,preview=false,busy=true,generation=0,demoToken=0,demoTimer=null,demoResolve=null,demoSaved=null,winTimer=null,won=false,selected=null,drag=null,ghost=null,ignoreClick=false;
    const storageName='sana-picture-puzzle',storeName='pictures';
    let database;
    function db(){
      if(database)return database;
      database=new Promise((resolve,reject)=>{try{const request=indexedDB.open(storageName,1);request.onupgradeneeded=()=>request.result.createObjectStore(storeName);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Storage unavailable'));}catch(e){reject(e);}});return database;
    }
    async function store(value){
      const database=await db();await new Promise((resolve,reject)=>{const transaction=database.transaction(storeName,'readwrite'),items=transaction.objectStore(storeName);if(value)items.put(value,'chosen');else items.delete('chosen');transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});
    }
    async function loadStored(){
      try{const database=await db();return await new Promise((resolve,reject)=>{const request=database.transaction(storeName).objectStore(storeName).get('chosen');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}catch{return null;}
    }
    function imageFrom(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth?resolve(image):reject(Error('Empty picture'));image.onerror=()=>reject(Error('Picture unavailable'));image.src=src;});}
    function fileData(chosen){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.onabort=()=>reject(Error('Picture selection cancelled'));reader.readAsDataURL(chosen);});}
    async function normalize(src,custom){
      const image=await imageFrom(src),ratio=Math.max(1,Math.min(2,image.naturalWidth/image.naturalHeight)),canvas=document.createElement('canvas');
      canvas.width=Math.round(1200*ratio/2);canvas.height=600;
      const context=canvas.getContext('2d');context.fillStyle='#e8f0dd';context.fillRect(0,0,canvas.width,canvas.height);
      const scale=Math.min(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
      context.drawImage(image,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
      return {src:canvas.toDataURL('image/jpeg',.9),ratio,custom};
    }
    const initial=(async()=>{
      const saved=await loadStored();
      if(saved?.src?.startsWith('data:image/')&&saved.ratio>=1&&saved.ratio<=2){try{await imageFrom(saved.src);return saved;}catch{/* A damaged saved picture uses the SaNa picture. */}}
      return normalize('puzzle-garden.svg',false);
    })();
    // Prevent an unused-room image failure from becoming an unhandled rejection.
    initial.catch(()=>{});
    function say(text){message.textContent=text;if(active)hint(text);}

    const placedCount=()=>board?.placed.filter(Boolean).length||0;
    function fit(){
      if(!active||!picture)return;
      const width=Math.max(1,Math.min((stage.clientWidth-30)/2,(stage.clientHeight-32)*picture.ratio)),height=width/picture.ratio;
      panel.style.setProperty('--puzzle-width',width+'px');panel.style.setProperty('--puzzle-height',height+'px');
    }
    new ResizeObserver(()=>{if(panel.hasAttribute('data-puzzle-demo'))stopDemo();if(drag){cancelDrag();render();}fit();}).observe(stage);
    function syncStrip(){
      if(!active)return;
      strip.hidden=false;strip.style.setProperty('--thumb-count','7');strip.setAttribute('aria-label','Picture Puzzle controls');
      if(!strip.querySelector('#puzzle-upload')){
        strip.innerHTML='<button class="item-chip" type="button" id="puzzle-upload" aria-label="Choose your picture"><span aria-hidden="true">📷</span><small>Picture</small></button><button class="item-chip" type="button" id="puzzle-preview" aria-label="Show complete picture" aria-pressed="false"><img alt=""><small>Look</small></button><button class="item-chip" type="button" id="puzzle-numbers" aria-label="Show piece numbers" aria-pressed="true"><span>1 2 3</span><small>Numbers</small></button><button class="item-chip" type="button" id="puzzle-default" aria-label="Use SaNa picture" title="Use SaNa picture"><span aria-hidden="true">🐵</span><small>SaNa</small></button><button class="item-chip" type="button" id="puzzle-again" aria-label="Shuffle picture" title="Shuffle picture"><span aria-hidden="true">↻</span><small>Again</small></button><span class="puzzle-grid-label" id="puzzle-grid-label"></span><span class="puzzle-placed" id="puzzle-placed" aria-live="polite"></span>';
        strip.querySelector('#puzzle-upload').addEventListener('click',()=>{stopDemo();cancelDrag();file.click();});
        strip.querySelector('#puzzle-preview').addEventListener('click',()=>{if(!picture||busy)return;stopDemo();cancelDrag();preview=!preview;render();});
        strip.querySelector('#puzzle-numbers').addEventListener('click',()=>{stopDemo();cancelDrag();numbers=!numbers;render();});
        strip.querySelector('#puzzle-again').addEventListener('click',()=>{if(!busy&&picture){stopDemo();shuffle();}});
        strip.querySelector('#puzzle-default').addEventListener('click',()=>{void useDefault();});
      }
      strip.querySelector('#puzzle-grid-label').innerHTML=`<span>${age} × ${age}</span><small>Grid</small>`;
      strip.querySelector('#puzzle-placed').innerHTML=`<span>${placedCount()} / ${age*age}</span><small>Placed</small>`;
      const thumbnail=strip.querySelector('#puzzle-preview');thumbnail.setAttribute('aria-pressed',String(preview||won));thumbnail.setAttribute('aria-label',preview?'Return to puzzle':'Show complete picture');thumbnail.querySelector('small').textContent=preview?'Play':'Look';thumbnail.dataset.completed=String(won);thumbnail.classList.toggle('is-done',won);
      if(picture)thumbnail.querySelector('img').src=picture.src;
      strip.querySelector('#puzzle-numbers').setAttribute('aria-pressed',String(numbers));strip.querySelector('#puzzle-default').disabled=busy||!picture?.custom;
      status(`${age} × ${age} · ${placedCount()} / ${age*age} placed`);
    }
    function paintPosition(node,value,position){
      const source=value-1;node.style.setProperty('--tile-x',position%age);node.style.setProperty('--tile-y',Math.floor(position/age));node.style.backgroundPosition=`${source%age/(age-1)*100}% ${Math.floor(source/age)/(age-1)*100}%`;
    }
    function render(){
      if(!active||!board||!picture)return;
      const done=solved(board);Object.assign(boardNode.dataset,{size:String(age),order:JSON.stringify(board.tiles),placed:JSON.stringify(board.placed),done:String(done),source:picture.custom?'custom':'default',ready:String(!busy),numbers:String(numbers)});
      panel.dataset.numbers=String(numbers);targetNode.dataset.numbers=String(numbers);targetNode.dataset.done=String(done);panel.style.setProperty('--grid',age);panel.style.setProperty('--puzzle-image',`url("${picture.src}")`);
      if(boardNode.children.length!==age*age){boardNode.innerHTML=board.tiles.map(value=>`<button type="button" class="puzzle-tile" data-puzzle-tile="${value}"><span>${value}</span></button>`).join('');targetNode.innerHTML=Array.from({length:age*age},(_,i)=>`<button type="button" class="puzzle-pocket" data-puzzle-target="${i+1}"><span>${i+1}</span></button>`).join('');}
      for(const node of boardNode.children){const value=Number(node.dataset.puzzleTile),position=board.tiles.indexOf(value);paintPosition(node,value,position);node.hidden=board.placed[value-1];node.classList.toggle('is-selected',selected===value);node.setAttribute('aria-pressed',String(selected===value));node.setAttribute('aria-label',`Picture piece ${value}. Move it to the picture grid.`);node.disabled=busy||done;}
      for(const node of targetNode.children){const value=Number(node.dataset.puzzleTarget),filled=board.placed[value-1];paintPosition(node,value,value-1);node.dataset.filled=String(filled);node.dataset.highlight=String(selected===value&&!filled);node.setAttribute('aria-label',filled?`Piece ${value} placed`:`Place picture piece ${value} here`);node.tabIndex=selected===value&&!filled?0:-1;node.disabled=busy||done||filled;}
      reference.src=picture.src;reference.hidden=!(preview||won);boardNode.inert=targetNode.inert=preview||done||busy;syncStrip();fit();readyChanged();
    }
    function shuffle(){clearTimeout(winTimer);cancelDrag();onReset();won=false;preview=false;selected=null;board=create(age);boardNode.replaceChildren();targetNode.replaceChildren();render();say('Picture ready. Move the pieces on the left onto the picture grid.');}
    async function start(value){
      active=true;age=[2,3,4,5].includes(value)?value:2;panel.hidden=false;busy=true;const token=++generation;stopDemo();syncStrip();boardNode.dataset.ready='false';
      try{picture ||= await initial;if(!active||token!==generation)return;busy=false;shuffle();}
      catch{if(active&&token===generation){busy=false;say('The SaNa picture could not load. Choose a picture from your device.');syncStrip();readyChanged();}}
    }
    function leave(){active=false;generation++;stopDemo();clearTimeout(winTimer);panel.hidden=true;cancelDrag();}
    async function choose(chosen){
      if(!chosen)return;
      stopDemo();const token=++generation;
      if(chosen.size>20*1024*1024){say('Choose a picture smaller than 20 MB.');return;}
      if(!chosen.size||(!chosen.type.startsWith('image/')&&!/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i.test(chosen.name))){say('Choose a different picture, such as a JPG or PNG.');return;}
      busy=true;boardNode.dataset.ready='false';readyChanged();
      try{
        // Read the selected file locally; no upload request is involved.
        const next=await normalize(await fileData(chosen),true);if(!active||token!==generation)return;
        // The photo never leaves this browser. Storage failure still permits play.
        let saved=true;try{await store(next);}catch{saved=false;}if(!active||token!==generation)return;
        picture=next;busy=false;shuffle();if(!saved)say('Picture ready. Choose it again next time you open the app.');
      }catch{if(active&&token===generation){busy=false;render();say('Choose a different picture. This file could not be opened.');}}
      finally{if(active&&token===generation){busy=false;readyChanged();}}
    }
    file.addEventListener('change',()=>{const chosen=file.files?.[0];file.value='';void choose(chosen);});
    async function useDefault(){
      stopDemo();const token=++generation;busy=true;boardNode.dataset.ready='false';readyChanged();
      try{const next=await normalize('puzzle-garden.svg',false);if(!active||token!==generation)return;await store(null).catch(()=>{});if(!active||token!==generation)return;picture=next;busy=false;shuffle();}
      catch{if(active&&token===generation){busy=false;render();say('The SaNa picture could not load. Try again.');}}
    }

    function canPlay(){return active&&!busy&&!preview&&board&&!solved(board)&&!panel.hasAttribute('data-puzzle-demo');}
    function select(value,keyboard=false){if(!canPlay()||board.placed[value-1])return;selected=value;render();if(keyboard)targetNode.querySelector(`[data-puzzle-target="${value}"]`)?.focus({preventScroll:true});}
    function put(value){
      if(!canPlay()||!place(board,value))return;
      cancelDrag();selected=null;render();
      if(solved(board)){const token=generation;winTimer=setTimeout(()=>{if(!active||token!==generation)return;won=true;render();complete('You made the whole picture! Well done!');},matchMedia('(prefers-reduced-motion:reduce)').matches?0:220);}
      else say('Lovely! Choose another piece for your picture.');
    }
    function localPoint(event){const r=stage.getBoundingClientRect();return app.classList.contains('rotated')?{x:(event.clientY-r.top)/r.height*stage.clientWidth,y:(r.right-event.clientX)/r.width*stage.clientHeight}:{x:(event.clientX-r.left)/r.width*stage.clientWidth,y:(event.clientY-r.top)/r.height*stage.clientHeight};}
    function centre(node){const r=node.getBoundingClientRect();return localPoint({clientX:r.left+r.width/2,clientY:r.top+r.height/2});}
    function cancelDrag(resetSelection=true){if(drag){drag=null;ignoreClick=true;}ghost?.remove();ghost=null;boardNode.querySelector('.is-dragging')?.classList.remove('is-dragging');if(resetSelection)selected=null;}
    function pieceGhost(node,container=stage){const copy=node.cloneNode(true);copy.removeAttribute('data-puzzle-tile');copy.removeAttribute('id');copy.className='puzzle-drag-piece';copy.setAttribute('aria-hidden','true');copy.tabIndex=-1;copy.inert=true;container.append(copy);return copy;}
    boardNode.addEventListener('click',event=>{const node=event.target.closest('[data-puzzle-tile]'),skip=ignoreClick&&event.detail>0;ignoreClick=false;if(node&&!skip)select(Number(node.dataset.puzzleTile),event.detail===0);});
    targetNode.addEventListener('click',()=>{if(selected!==null)put(selected);});
    boardNode.addEventListener('keydown',event=>{const node=event.target.closest('[data-puzzle-tile]'),directions={ArrowLeft:-1,ArrowRight:1,ArrowUp:-age,ArrowDown:age};if(!node||!(event.key in directions))return;event.preventDefault();const nodes=[...boardNode.children],index=nodes.indexOf(node);let next=index+directions[event.key];while(next>=0&&next<nodes.length&&nodes[next].hidden)next+=directions[event.key];nodes[next]?.focus({preventScroll:true});});
    boardNode.addEventListener('pointerdown',event=>{ignoreClick=false;const node=event.target.closest('[data-puzzle-tile]');if(!node||event.button>0||event.isPrimary===false||!canPlay())return;const value=Number(node.dataset.puzzleTile);select(value);drag={id:event.pointerId,node,value,start:localPoint(event),moving:false};try{node.setPointerCapture(event.pointerId);}catch{}event.preventDefault();});
    boardNode.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const point=localPoint(event);if(!drag.moving&&Math.hypot(point.x-drag.start.x,point.y-drag.start.y)<5)return;event.preventDefault();if(!ghost){ghost=pieceGhost(drag.node);drag.node.classList.add('is-dragging');}drag.moving=true;ghost.style.left=point.x+'px';ghost.style.top=(point.y-10)+'px';});
    boardNode.addEventListener('pointerup',event=>{if(!drag||drag.id!==event.pointerId)return;const current=drag;drag=null;if(!current.moving)return;ignoreClick=true;const r=targetNode.getBoundingClientRect(),inside=event.clientX>=r.left-6&&event.clientX<=r.right+6&&event.clientY>=r.top-6&&event.clientY<=r.bottom+6;cancelDrag(false);if(inside)put(current.value);else{render();say('Bring the piece onto the picture grid.');}});
    boardNode.addEventListener('pointercancel',()=>{cancelDrag();render();});
    function pause(ms,token){return new Promise(resolve=>{demoResolve=resolve;demoTimer=setTimeout(()=>{demoResolve=null;resolve(token===demoToken&&active);},ms);});}
    function stopDemo(){
      cancelDrag(false);const running=panel.hasAttribute('data-puzzle-demo');demoToken++;clearTimeout(demoTimer);const resolve=demoResolve;demoResolve=null;resolve?.(false);panel.removeAttribute('data-puzzle-demo');hand.hidden=true;stage.querySelector('.puzzle-demo-pair')?.remove();halves.forEach(node=>node.style.visibility='');document.getElementById('show-me').setAttribute('aria-pressed','false');
      if(running&&active){if(demoSaved){selected=demoSaved.selected;preview=demoSaved.preview;}demoSaved=null;render();say('Your turn! Move a piece onto the picture grid.');}
    }
    async function demo(){
      if(panel.hasAttribute('data-puzzle-demo')){stopDemo();return;}if(!board||busy||solved(board))return;
      cancelDrag(false);demoSaved={selected,preview};preview=false;render();
      const token=++demoToken,overlay=document.createElement('div');overlay.className='puzzle-demo-pair';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
      halves.forEach(node=>{const copy=node.cloneNode(true);copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));overlay.append(copy);node.style.visibility='hidden';});stage.append(overlay);
      const value=board.tiles.find(value=>!board.placed[value-1]),source=overlay.querySelector(`[data-puzzle-tile="${value}"]`),target=overlay.querySelector(`[data-puzzle-target="${value}"]`),from=centre(source),to=centre(target);
      target.dataset.highlight='true';panel.dataset.puzzleDemo='holding';document.getElementById('show-me').setAttribute('aria-pressed','true');hand.style.transition='none';hand.style.left=from.x+'px';hand.style.top=from.y+'px';hand.hidden=false;say('Demo: Touch this piece.');
      if(!await pause(1000,token))return;
      const copy=pieceGhost(source,overlay);copy.style.left=from.x+'px';copy.style.top=from.y+'px';source.style.visibility='hidden';copy.getBoundingClientRect();const duration=matchMedia('(prefers-reduced-motion:reduce)').matches?0:850;copy.style.transition=hand.style.transition=`left ${duration}ms ease-in-out,top ${duration}ms ease-in-out`;copy.style.left=hand.style.left=to.x+'px';copy.style.top=hand.style.top=to.y+'px';panel.dataset.puzzleDemo='moving';say('Demo: Bring it to the picture grid.');
      if(!await pause(duration,token))return;
      copy.remove();target.dataset.filled='true';target.dataset.highlight='false';hand.hidden=true;panel.dataset.puzzleDemo='success';strip.querySelector('#puzzle-placed span').textContent=`${placedCount()+1} / ${age*age}`;status(`${age} × ${age} · ${placedCount()+1} / ${age*age} placed`);if(placedCount()+1===age*age){overlay.querySelector('img').hidden=false;strip.querySelector('#puzzle-preview').classList.add('is-done');}say('Demo: The piece fits!');if(!await pause(1000,token))return;stopDemo();
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDemo();});
    return {start,leave,demo,stopDemo,syncStrip,ready:()=>!busy,active:()=>active};
  }
  root.SaNaPicturePuzzle={core,mount};
})(typeof window==='undefined'?globalThis:window);
