(function(root){
  'use strict';
  const neighbours=(gap,size)=>[gap-size,gap+size,gap-1,gap+1].filter(p=>p>=0&&p<size*size&&Math.abs(Math.floor(p/size)-Math.floor(gap/size))+Math.abs(p%size-gap%size)===1);
  const solved=board=>board.tiles.every((value,i)=>value===(i===board.tiles.length-1?0:i+1));
  function slide(board,position){
    const gap=board.tiles.indexOf(0);
    if(!Number.isInteger(position)||!neighbours(gap,board.size).includes(position))return false;
    [board.tiles[gap],board.tiles[position]]=[board.tiles[position],0];
    if(board.trail.at(-1)===position)board.trail.pop();else board.trail.push(gap);
    board.moves++;return true;
  }
  function create(size,steps,random=Math.random){
    if(![2,3,4,5].includes(size))throw new RangeError('Grid must be 2 to 5');
    const board={size,tiles:Array.from({length:size*size},(_,i)=>(i+1)%(size*size)),trail:[],moves:0};let previous=-1;
    for(let i=0;i<Math.max(1,steps||size*2);i++){
      const gap=board.tiles.indexOf(0),choices=neighbours(gap,size).filter(p=>p!==previous),position=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
      slide(board,position);previous=gap;
    }
    if(solved(board))slide(board,neighbours(board.tiles.indexOf(0),size)[0]);
    board.moves=0;return board;
  }
  const core={neighbours,solved,slide,create};
  if(typeof module==='object'&&module.exports){module.exports={core};return;}

  function mount({app,scene,strip,hint,complete,status,readyChanged,onReset}){
    const panel=document.createElement('section');panel.id='picture-puzzle';panel.hidden=true;panel.setAttribute('aria-label','Picture Puzzle');
    panel.innerHTML='<div class="puzzle-stage"><div id="puzzle-board" role="group" aria-label="Sliding picture puzzle" data-ready="false"></div><img id="puzzle-reference" alt="Complete picture to help solve the puzzle" hidden><div id="puzzle-demo-hand" hidden aria-hidden="true">☝️</div></div><span id="puzzle-message" class="visually-hidden" role="status" aria-live="polite"></span>';
    scene.after(panel);
    const $=id=>panel.querySelector('#'+id),boardNode=$('puzzle-board'),stage=panel.querySelector('.puzzle-stage'),reference=$('puzzle-reference'),hand=$('puzzle-demo-hand'),message=$('puzzle-message');
    const file=document.createElement('input');file.type='file';file.accept='image/*';file.id='puzzle-file';file.hidden=true;panel.append(file);
    let active=false,age=2,board=null,picture=null,numbers=true,preview=false,busy=true,generation=0,demoToken=0,demoTimer=null,demoResolve=null,winTimer=null,won=false,swipe=null,ignoreClick=false;
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
    function fit(){
      if(!active||!picture)return;
      const width=Math.max(1,Math.min(stage.clientWidth-12,(stage.clientHeight-8)*picture.ratio)),height=width/picture.ratio;
      panel.style.setProperty('--puzzle-width',width+'px');panel.style.setProperty('--puzzle-height',height+'px');
    }
    new ResizeObserver(()=>{if(panel.hasAttribute('data-puzzle-demo'))stopDemo();if(swipe){swipe=null;ignoreClick=true;}fit();}).observe(stage);
    function syncStrip(){
      if(!active)return;
      strip.hidden=false;strip.setAttribute('aria-label','Picture Puzzle controls');
      if(!strip.querySelector('#puzzle-upload')){
        strip.innerHTML='<button class="item-chip" type="button" id="puzzle-upload" aria-label="Choose your picture">📷 <span>Choose picture</span></button><button class="item-chip" type="button" id="puzzle-preview" aria-label="Show complete picture" aria-pressed="false"><img alt=""><span>Look</span></button><button class="item-chip" type="button" id="puzzle-numbers" aria-label="Show tile numbers" aria-pressed="true">1 2 3</button><button class="item-chip" type="button" id="puzzle-default" aria-label="Use SaNa picture" title="Use SaNa picture">🐵</button><button class="item-chip" type="button" id="puzzle-again" aria-label="Shuffle picture" title="Shuffle picture">↻</button><span class="puzzle-grid-label" id="puzzle-grid-label"></span><span class="puzzle-moves" id="puzzle-moves" aria-live="polite"></span>';
        strip.querySelector('#puzzle-upload').addEventListener('click',()=>{stopDemo();file.click();});
        strip.querySelector('#puzzle-preview').addEventListener('click',()=>{if(!picture||busy)return;stopDemo();preview=!preview;render();});
        strip.querySelector('#puzzle-numbers').addEventListener('click',()=>{stopDemo();numbers=!numbers;render();});
        strip.querySelector('#puzzle-again').addEventListener('click',()=>{if(!busy&&picture){stopDemo();shuffle();}});
        strip.querySelector('#puzzle-default').addEventListener('click',()=>{void useDefault();});
      }
      strip.querySelector('#puzzle-grid-label').textContent=`${age} × ${age}`;
      strip.querySelector('#puzzle-moves').textContent=`Moves: ${board?.moves||0}`;
      const thumbnail=strip.querySelector('#puzzle-preview');thumbnail.setAttribute('aria-pressed',String(preview||!!board&&solved(board)));thumbnail.setAttribute('aria-label',preview?'Return to puzzle':'Show complete picture');thumbnail.dataset.completed=String(won);thumbnail.classList.toggle('is-done',won);
      if(picture)thumbnail.querySelector('img').src=picture.src;
      strip.querySelector('#puzzle-numbers').setAttribute('aria-pressed',String(numbers));
      strip.querySelector('#puzzle-default').disabled=busy||!picture?.custom;
      status(`${age} × ${age} · ${board?.moves||0} moves`);
    }
    function render(){
      if(!active||!board||!picture)return;
      const done=solved(board);Object.assign(boardNode.dataset,{size:String(age),order:JSON.stringify(board.tiles),moves:String(board.moves),done:String(done),source:picture.custom?'custom':'default',ready:String(!busy),numbers:String(numbers)});
      boardNode.style.setProperty('--grid',age);boardNode.style.setProperty('--puzzle-image',`url("${picture.src}")`);
      if(boardNode.children.length!==age*age-1){
        boardNode.innerHTML=Array.from({length:age*age-1},(_,i)=>`<button type="button" class="puzzle-tile" data-puzzle-tile="${i+1}" aria-label="Tile ${i+1}"><span>${i+1}</span></button>`).join('');
      }
      for(const node of boardNode.children){
        const value=Number(node.dataset.puzzleTile),position=board.tiles.indexOf(value),source=value-1;
        node.style.setProperty('--tile-x',position%age);node.style.setProperty('--tile-y',Math.floor(position/age));node.style.backgroundPosition=`${source%age/(age-1)*100}% ${Math.floor(source/age)/(age-1)*100}%`;node.dataset.position=String(position);
        const movable=neighbours(board.tiles.indexOf(0),age).includes(position)&&!done&&!busy;node.dataset.movable=String(movable);node.tabIndex=movable?0:-1;node.setAttribute('aria-disabled',String(!movable));node.setAttribute('aria-label',`Tile ${value}, row ${Math.floor(position/age)+1}, column ${position%age+1}${movable?', slide into the empty space':''}`);
      }
      reference.src=picture.src;reference.hidden=!(preview||won);boardNode.inert=preview||done||busy;
      syncStrip();fit();readyChanged();
    }
    function shuffle(){
      clearTimeout(winTimer);onReset();won=false;preview=false;board=create(age,{2:1,3:5,4:8,5:12}[age]);boardNode.replaceChildren();render();say('Picture ready. Slide a tile next to the empty space.');
    }
    async function start(value){
      active=true;age=[2,3,4,5].includes(value)?value:2;panel.hidden=false;busy=true;const token=++generation;stopDemo();syncStrip();boardNode.dataset.ready='false';
      try{picture ||= await initial;if(!active||token!==generation)return;busy=false;shuffle();}
      catch{if(active&&token===generation){busy=false;say('The SaNa picture could not load. Choose a picture from your device.');syncStrip();readyChanged();}}
    }
    function leave(){active=false;generation++;stopDemo();clearTimeout(winTimer);panel.hidden=true;swipe=null;}
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
    function play(value){
      if(!active||busy||preview||!board||solved(board)||panel.hasAttribute('data-puzzle-demo'))return;
      if(!slide(board,board.tiles.indexOf(value))){say('Choose a tile next to the empty space.');return;}
      render();
      if(solved(board)){const token=generation;winTimer=setTimeout(()=>{if(!active||token!==generation)return;won=true;render();complete('You made the whole picture! Well done!');},matchMedia('(prefers-reduced-motion:reduce)').matches?0:220);}
      else say('Good slide! Find the next tile beside the empty space.');
    }
    boardNode.addEventListener('click',event=>{const tile=event.target.closest('[data-puzzle-tile]'),skip=ignoreClick&&event.detail>0;ignoreClick=false;if(tile&&!skip)play(Number(tile.dataset.puzzleTile));});
    boardNode.addEventListener('keydown',event=>{
      const tile=event.target.closest('[data-puzzle-tile]');if(!tile||!board)return;
      const directions={ArrowLeft:-1,ArrowRight:1,ArrowUp:-age,ArrowDown:age};if(!(event.key in directions))return;event.preventDefault();
      const position=board.tiles.indexOf(Number(tile.dataset.puzzleTile));if(position+directions[event.key]===board.tiles.indexOf(0))play(Number(tile.dataset.puzzleTile));
    });
    boardNode.addEventListener('pointerdown',event=>{
      ignoreClick=false;
      const tile=event.target.closest('[data-puzzle-tile]');if(!tile||event.button>0||event.isPrimary===false||busy||preview||panel.hasAttribute('data-puzzle-demo'))return;
      swipe={id:event.pointerId,tile,x:event.clientX,y:event.clientY};try{tile.setPointerCapture(event.pointerId);}catch{}
    });
    boardNode.addEventListener('pointerup',event=>{
      if(!swipe||swipe.id!==event.pointerId)return;const start=swipe;swipe=null;
      const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)<10)return;ignoreClick=true;
      // Compare screen-space vectors so a portrait phone's rotated frame works too.
      const bounds=boardNode.getBoundingClientRect(),tileBounds=start.tile.getBoundingClientRect(),gap=board.tiles.indexOf(0),rotated=app.classList.contains('rotated'),x=(gap%age+.5)/age,y=(Math.floor(gap/age)+.5)/age;
      const targetX=bounds.left+(rotated?1-y:x)*bounds.width,targetY=bounds.top+(rotated?x:y)*bounds.height;
      if(dx*(targetX-(tileBounds.left+tileBounds.width/2))+dy*(targetY-(tileBounds.top+tileBounds.height/2))>0)play(Number(start.tile.dataset.puzzleTile));
    });
    boardNode.addEventListener('pointercancel',()=>{swipe=null;});
    function pause(ms,token){return new Promise(resolve=>{demoResolve=resolve;demoTimer=setTimeout(()=>{demoResolve=null;resolve(token===demoToken&&active);},ms);});}
    function stopDemo(){
      if(swipe){swipe=null;ignoreClick=true;}
      const running=panel.hasAttribute('data-puzzle-demo');demoToken++;clearTimeout(demoTimer);const resolve=demoResolve;demoResolve=null;resolve?.(false);panel.removeAttribute('data-puzzle-demo');hand.hidden=true;panel.querySelector('.puzzle-demo-board')?.remove();
      boardNode.style.visibility='';document.getElementById('show-me').setAttribute('aria-pressed','false');if(running&&active){render();say('Your turn! Slide a tile beside the empty space.');}
    }
    async function demo(){
      if(panel.hasAttribute('data-puzzle-demo')){stopDemo();return;}
      if(!board||busy||solved(board))return;preview=false;render();
      const token=++demoToken,copy=boardNode.cloneNode(true),model={size:age,tiles:board.tiles.slice(),trail:board.trail.slice(),moves:board.moves};copy.removeAttribute('id');copy.classList.add('puzzle-demo-board');copy.setAttribute('aria-hidden','true');copy.inert=true;stage.append(copy);boardNode.style.visibility='hidden';
      const position=model.trail.at(-1)??neighbours(model.tiles.indexOf(0),age)[0],tile=copy.querySelector(`[data-puzzle-tile="${model.tiles[position]}"]`),gap=model.tiles.indexOf(0);
      const pointHand=position=>{const width=parseFloat(panel.style.getPropertyValue('--puzzle-width')),height=parseFloat(panel.style.getPropertyValue('--puzzle-height'));hand.style.left=((stage.clientWidth-width)/2+(position%age+.5)/age*width)+'px';hand.style.top=((stage.clientHeight-height)/2+(Math.floor(position/age)+.5)/age*height)+'px';};
      panel.dataset.puzzleDemo='holding';document.getElementById('show-me').setAttribute('aria-pressed','true');hand.hidden=false;pointHand(position);say('Demo: Touch this tile.');
      if(!await pause(1000,token))return;
      panel.dataset.puzzleDemo='moving';tile.style.setProperty('--tile-x',gap%age);tile.style.setProperty('--tile-y',Math.floor(gap/age));pointHand(gap);slide(model,position);
      if(!await pause(matchMedia('(prefers-reduced-motion:reduce)').matches?0:220,token))return;
      hand.hidden=true;panel.dataset.puzzleDemo='success';if(solved(model)){copy.dataset.done='true';const thumb=strip.querySelector('#puzzle-preview');thumb.classList.add('is-done');}say('Demo: The tile slides into the empty space.');if(!await pause(1000,token))return;stopDemo();
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDemo();});
    return {start,leave,demo,stopDemo,syncStrip,ready:()=>!busy,active:()=>active};
  }
  root.SaNaPicturePuzzle={core,mount};
})(typeof window==='undefined'?globalThis:window);
