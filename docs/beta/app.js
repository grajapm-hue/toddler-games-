(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const app=$('app'),scene=$('scene');
  const captionTints={
    cream:['#f5efdf','#ad9e83'],sky:['#dfedf6','#7e9fb7'],sage:['#dcebdd','#8aa67a'],
    lilac:['#e9e1f2','#a591b5'],peach:['#f3dfd3','#b5927e']
  };
  const colourTints=[['#f6e0dd','#b9877f'],['#f5e5d3','#b99a75'],['#f6f0d5','#baad72'],['#dfebd9','#8aa67a'],['#dcebf5','#7e9fb7'],['#e3e3f3','#9396b9'],['#ebe1f2','#a591b5'],['#f4e1eb','#b78fa3'],['#e9e0d7','#a58e79'],['#f8f5ed','#aaa699']];
  const normalSceneSizes=new Map();
  function placeArtTools(root=app,immersive=root.classList.contains('immersive')){
    const tools=root.querySelector('#art-tools'),mat=root.querySelector('.play-mat');
    if(immersive)mat.insertBefore(tools,root.querySelector('#scene'));
    else root.querySelector('#activity-view').insertBefore(tools,mat);
  }
  function normalSceneSize(){
    const key=[app.style.getPropertyValue('--frame-w'),app.style.getPropertyValue('--frame-h'),app.dataset.view,app.dataset.age,state.paintMode,state.bubbleMode].join('/');
    if(!app.classList.contains('immersive')){const size={width:scene.clientWidth,height:scene.clientHeight};normalSceneSizes.set(key,size);return size;}
    if(normalSceneSizes.has(key))return normalSceneSizes.get(key);
    // Measure the existing normal CSS layout without changing the live game or its state.
    const copy=app.cloneNode(true);copy.classList.remove('immersive','rotated');copy.setAttribute('aria-hidden','true');copy.inert=true;
    copy.querySelector('#game-mid-controls').append(copy.querySelector('#vibration-toggle'));
    placeArtTools(copy,false);
    Object.assign(copy.style,{left:'-20000px',top:'0',transform:'none',visibility:'hidden',pointerEvents:'none'});document.body.appendChild(copy);
    const board=copy.querySelector('#scene'),size={width:board.clientWidth,height:board.clientHeight};copy.remove();normalSceneSizes.set(key,size);return size;
  }
  function fullscreenCaptionFont(node,base,size){
    let width=scene.viewBox.baseVal.width,height=scene.viewBox.baseVal.height,font=base;
    if(state.activity==='abacus'&&state.age===4){
      width=1000;height=Math.max(140,Math.min(440,width*size.height/Math.max(1,size.width)));
      const compact=height<280,unit=1000/Math.max(1,size.width),key=node.dataset.labelFor||'';
      font=key==='train-title'||key==='train-target'?Math.max(compact?23:32,14*unit):key.startsWith('train-number-')?Math.max(24,15*unit):node.hasAttribute('data-train-engine')?Math.max(compact?17:24,12*unit):Math.max(compact?24:36,14*unit);
    }else if(state.activity==='abacus'&&state.age===5){
      width=Math.max(1000,600*size.width/Math.max(1,size.height));height=600;
      const scale=600/Math.max(1,size.height);
      if(node.matches('[data-color-label],[data-abacus-left],[data-abacus-right]'))font=Math.min(42,Math.max(20,14*scale));
      if(node.hasAttribute('data-abacus-equation'))font=Math.min(34,Math.max(26,14*scale));
    }
    const normalScale=Math.min(size.width/width,size.height/height),m=scene.getScreenCTM(),currentScale=Math.hypot(m.a,m.b);
    return font*normalScale*1.12/Math.max(.001,currentScale);
  }
  function captionTint(node){
    if(node.hasAttribute('data-color-label')){const row=Number(node.dataset.colorLabel);return row===5?['#f8f5ed',colourTints[row][1]]:['#09120d',colourTints[row][1]];}
    const key=node.dataset.labelFor||'';
    if(key==='slide-peek')return ['#164c4a','#84c6b7'];
    if(key.startsWith('train-number-'))return [captionTints.sky,captionTints.cream,captionTints.peach,captionTints.lilac][(Number(key.slice(13))-1)%4];
    if(key.includes('total')||key==='train-target'||key==='harvest-counter'||key==='harvest-ledger-collected')return captionTints.sage;
    if(key==='train-title'||key.includes('sum')||(key==='harvest-prompt'&&node.getAttribute('font-size')==='31'))return captionTints.sky;
    if(key==='harvest-ledger-source')return captionTints.peach;
    if(node.closest('[data-count-praise]'))return captionTints.sage;
    if(node.closest('.target'))return captionTints.lilac;
    return captionTints.cream;
  }
  // Measure the actual glyphs so short captions never inherit an oversized panel.
  // Keep the original SVG nodes and hit areas intact, including during bead updates.
  function fitSceneTextTabs(nodes=null){
    const captions=nodes||scene.querySelectorAll('.scene-caption,[data-color-label],[data-abacus-left],[data-abacus-right],[data-train-engine],[data-train-instruction],[data-slide-door-action],.target>text,[data-cave-object] text:last-child');
    const immersive=app.classList.contains('immersive'),normalSize=normalSceneSize();
    const glyphBox=node=>{
      const glyphs=Array.from({length:node.getNumberOfChars()},(_,i)=>node.getExtentOfChar(i));
      if(!glyphs.length)return null;
      const x=Math.min(...glyphs.map(g=>g.x)),y=Math.min(...glyphs.map(g=>g.y));
      return {x,y,width:Math.max(...glyphs.map(g=>g.x+g.width))-x,height:Math.max(...glyphs.map(g=>g.y+g.height))-y};
    };
    captions.forEach(node=>{
      if(!node.hasAttribute('data-abacus-equation')){
        node.dataset.captionFont ||= node.getAttribute('font-size');
        if(node.getAttribute('font-size')!==node.dataset.captionFont)node.setAttribute('font-size',node.dataset.captionFont);
      }
      const base=parseFloat(node.getAttribute('font-size'));
      node.querySelectorAll('tspan[font-size]').forEach(span=>{span.dataset.captionFont ||= span.getAttribute('font-size');span.setAttribute('font-size',span.dataset.captionFont);});
      if(immersive){const font=fullscreenCaptionFont(node,base,normalSize);node.setAttribute('font-size',font);node.querySelectorAll('tspan[data-caption-font]').forEach(span=>span.setAttribute('font-size',Number(span.dataset.captionFont)*font/base));}
      let box=glyphBox(node);if(!box)return;
      const panel=[...scene.querySelectorAll('[data-text-panel]')].find(rect=>node.dataset.labelFor===rect.dataset.textPanel||node.dataset.labelFor?.startsWith(rect.dataset.textPanel+'-'));
      const maxWidth=node.hasAttribute('data-color-label')?Number(scene.querySelector('[data-abacus-label-panel]').getAttribute('width'))/2-20:panel&&!panel.dataset.textPanel.startsWith('train-number-')?Number(panel.getAttribute('width'))-16:Infinity;
      if(box.width>maxWidth){node.setAttribute('font-size',parseFloat(getComputedStyle(node).fontSize)*maxWidth/box.width);box=glyphBox(node);}
      const font=parseFloat(getComputedStyle(node).fontSize),edgeCount=node.matches('[data-abacus-left],[data-abacus-right]'),px=edgeCount?2:Math.max(3,font*.22),py=Math.max(1.5,font*.1);
      const [fill,stroke]=captionTint(node);
      let tab=node.previousElementSibling;
      if(!tab?.hasAttribute('data-caption-tab')){tab=document.createElementNS(scene.namespaceURI,'rect');tab.setAttribute('data-caption-tab','');tab.setAttribute('aria-hidden','true');tab.setAttribute('pointer-events','none');node.before(tab);}
      if(node.closest('[data-slide-peek]')){tab.setAttribute('pointer-events','all');tab.style.cursor='pointer';const m=scene.getScreenCTM(),target=32/Math.hypot(m.a,m.b);let hit=node.parentElement.querySelector('[data-peek-hit]');if(!hit){hit=document.createElementNS(scene.namespaceURI,'rect');hit.setAttribute('data-peek-hit','');hit.setAttribute('fill','transparent');hit.setAttribute('pointer-events','all');hit.setAttribute('aria-hidden','true');tab.before(hit);}const width=Math.max(box.width+px*2,target),height=Math.max(box.height+py*2,target);Object.entries({x:box.x+box.width/2-width/2,y:box.y+box.height/2-height/2,width,height}).forEach(([key,value])=>hit.setAttribute(key,value));}
      Object.entries({x:box.x-px,y:box.y-py,width:box.width+px*2,height:box.height+py*2,rx:Math.min(8,font*.22),fill,stroke,'stroke-width':1,'vector-effect':'non-scaling-stroke'}).forEach(([key,value])=>tab.setAttribute(key,value));
    });
    if(state.activity==='abacus'&&state.age===4)for(const title of scene.querySelectorAll('[data-label-for="train-title"]')){
      const target=[...title.parentElement.children].find(node=>node.dataset.labelFor==='train-target'),reference=title.previousElementSibling,tab=target?.previousElementSibling;
      if(!reference?.hasAttribute('data-caption-tab')||!tab?.hasAttribute('data-caption-tab'))continue;
      // The title is the size reference for the pair, including after font fitting.
      target.setAttribute('font-size',title.getAttribute('font-size'));
      const box=glyphBox(target);if(!box)continue;
      const width=Number(reference.getAttribute('width'));
      Object.entries({x:box.x+box.width/2-width/2,y:reference.getAttribute('y'),width,height:reference.getAttribute('height'),rx:reference.getAttribute('rx')}).forEach(([key,value])=>tab.setAttribute(key,value));
    }
  }
  let captionFrame=0;
  function refreshSceneTextTabs(nodes=null){
    fitSceneTextTabs(nodes);cancelAnimationFrame(captionFrame);
    // WebKit settles glyph metrics after a changed SVG viewBox reaches a frame.
    captionFrame=requestAnimationFrame(()=>{captionFrame=0;fitSceneTextTabs(nodes);});
  }
  const decodedArt=new Map();let artGeneration=0;
  const gameReady=()=>scene.dataset.artState==='ready'&&(state.activity!=='puzzle'||picturePuzzle.ready());
  function artState(value){
    scene.dataset.artState=value;scene.parentElement.setAttribute('aria-busy',String(value==='loading'));
    const status=$('game-art-status');status.hidden=value==='ready';
    status.querySelector('span').textContent=value==='error'?'The pictures could not load. Try again.':'Getting your game ready…';
    $('game-art-retry').hidden=value!=='error';$('show-me').disabled=value!=='ready'||countHolding||!!objectFeedback||(state.activity==='puzzle'&&!picturePuzzle.ready())||(state.activity==='bubbles'&&state.bubbles.some(b=>b.popping));
  }
  function decodeArt(url){
    if(decodedArt.has(url))return decodedArt.get(url);
    const image=new Image(),entry={image,ready:false};image.decoding='async';
    entry.promise=(async()=>{
      if(image.decode){image.src=url;await image.decode();}
      else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
      if(!image.naturalWidth)throw new Error('Picture unavailable');entry.ready=true;
    })().catch(error=>{decodedArt.delete(url);throw error;});
    decodedArt.set(url,entry);return entry;
  }
  function prepareSceneArt(){
    refreshSceneTextTabs();
    restoreObjectFeedback();
    const generation=++artGeneration,serial=roundSerial,activity=state.activity;
    const urls=new Set([...scene.querySelectorAll('image')].map(el=>new URL(el.getAttribute('href'),document.baseURI).href));
    const background=getComputedStyle(scene.parentElement).backgroundImage;
    for(const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g))urls.add(new URL(match[1],document.baseURI).href);
    const pictures=[...urls].map(decodeArt);
    if(pictures.every(entry=>entry.ready)){artState('ready');return;}
    artState('loading');
    Promise.all(pictures.map(entry=>entry.promise)).then(()=>{
      if(generation===artGeneration&&serial===roundSerial&&activity===state.activity)artState('ready');
    }).catch(()=>{if(generation===artGeneration&&serial===roundSerial&&activity===state.activity)artState('error');});
  }
  $('game-art-retry').addEventListener('click',prepareSceneArt);
  const ageProfiles=window.SaNaProfiles;
  const profile=()=>ageProfiles.preset(state.level);
  if(!window.sanaTouchGuardReady){for(const type of ['contextmenu','selectstart','dragstart'])document.addEventListener(type,event=>event.preventDefault(),{capture:true});window.sanaTouchGuardReady=true;}
  const colors=['#df7f68','#edbf42','#629fca','#8d83c2','#65a58a','#405f76'];
  const colorNames=['Coral','Yellow','Blue','Purple','Green','Ink'];
  const puppyTail='M650 253Q744 198 705 173L723 159Q779 204 660 273Z';
  const shapes=[
    {id:'circle',color:'#fa6b6b'},
    {id:'square',color:'#72bdf1'},
    {id:'triangle',color:'#ffca52'},
    {id:'rectangle',color:'#a5d67b'},
    {id:'heart',color:'#f28fbc'},
    {id:'oval',color:'#bd86f3'},
    {id:'diamond',color:'#f4a35d'},
    {id:'star',color:'#ffd05d'},
    {id:'pentagon',color:'#f9ad61'},
    {id:'hexagon',color:'#b89bea'},
    {id:'octagon',color:'#69cbd1'},
    {id:'trapezoid',color:'#f07d85'},
    {id:'parallelogram',color:'#a0ce77'},
    {id:'crescent',color:'#71b7f4'},
    {id:'cross',color:'#ffd04d'},
    {id:'semicircle',color:'#d18cf3'},
    {id:'cone',color:'#f48cad'},
    {id:'cylinder',color:'#ac7be7'},
    {id:'cube',color:'#72b9f0'},
    {id:'arrow',color:'#8dd083'}
  ];
  const shapeLevelLimits={2:4,3:12,4:16,5:20};
  let shapeRound=0, shapeAge=null, shapeCompleted=0;
  // Age is a parent-selected starting level, never a locked progression.
  const shapeBatchSize=4;
  const activities={
    drag:{title:'Shape picnic',label:'Drag shapes',word:'Drag',caption:'match a little shape',note:'A place for every little shape',hint:'Drag a shape to its shadow. Or tap a shape, then its shadow.'},
    bubbles:{title:'Bubble garden',label:'Pop bubbles',word:'Tap',caption:'pop a happy bubble',note:'A pop of color. A little smile.',hint:'Tap a bubble. Pop, pop, pop! You can brush across them too.'},
    slide:{title:'Peek-a-boo friends',label:'Slide to reveal',word:'Slide',caption:'find a little friend',note:'Who is hiding behind the curtains?',hint:'Slide the sunny handles along the paths. Who will you find?'},
    brush:{title:'Little art studio',label:'Brush and paint',word:'Brush & paint',caption:'wash and make colors',note:'',hint:'Brush the muddy puppy. Give him a gentle wash.'},
    abacus:{title:'Counting adventures',label:'Counting games',word:'Count',caption:'count and play',note:'',hint:'Slide beads in any row, either way. See the number and its word change!' },
    puzzle:{title:'Picture Puzzle',label:'Picture Puzzle',word:'Puzzle',caption:'make your own picture',note:'',hint:'Move the pieces on the left onto the picture grid.'}
  };
  let saved={};try{const stored=JSON.parse(localStorage.getItem('sanaLittleHandsV1')||'{}');saved=stored&&typeof stored==='object'?stored:{};}catch{/* Settings are optional. */}
  const hasAgeSettings=saved.ageSettings&&typeof saved.ageSettings==='object'&&!Array.isArray(saved.ageSettings);
  const ageSettings=hasAgeSettings?saved.ageSettings:{};
  if(!hasAgeSettings)ageSettings.common={level:saved.level,bubbleSpeed:saved.bubbleSpeed,bubbleSize:saved.bubbleSize,bubbleSet:'full'};
  // Four-button age selector: new sessions default to Age 2; retain saved ages.
  if(ageProfiles.getAge()===null)ageProfiles.select(2);
  const preferences=()=>ageSettings[ageProfiles.getAge()??'common']??{};
  const initial=preferences();
  const state={age:ageProfiles.getAge(),level:1,activity:null,done:false,pointer:null,selected:null,paintMode:false,paintColor:colors[0],brushColor:colors[4],strokes:[],shapes:[],bubbles:[],sliders:[],slideIndex:0,slideRevealed:false,dirt:[],sound:saved.sound===true,haptics:saved.haptics!==false};
  Object.assign(state,{brushSize:profile().brushSize,erase:false,coverage:[],bubbleMode:profile().bubbleMode,bubbleSet:initial.bubbleSet==='full'||state.age===null?'full':'starter',bubbleHits:new Map(),bubblePops:0,bubbleRecent:[],bubbleEffects:[],bubbleSerial:0,bubbleWidth:1000});
  const picturePuzzle=window.SaNaPicturePuzzle.mount({app,scene,strip:$('item-progress-strip'),hint:words=>hint(words),complete:words=>{celebrate(words);applause();clearTimeout(rewardTimer);rewardTimer=setTimeout(()=>{$('celebrate').hidden=true;$('art-reward').hidden=true;},1500);},onReset:()=>{clearEffects();state.done=false;},status:words=>{$('game-results').hidden=false;$('result-score').hidden=false;$('result-score').textContent=words;$('progress').hidden=true;},readyChanged:()=>{if(state.activity==='puzzle')$('show-me').disabled=!gameReady();}});
  const bubbleModes={plain:{label:'Plain',items:[]},numbers:{label:'1–20',items:Array.from({length:20},(_,i)=>String(i+1))},letters:{label:'A–Z',items:Array.from({length:26},(_,i)=>String.fromCharCode(65+i))},shapes:{label:'Shapes',items:shapes.map(shape=>shape.id)}};
  const bubbleColors=['#46b8cf','#ee6c88','#a890e5','#f5ce51','#76bc74','#f49d60'];
  const bubbleSpeeds={slow:72,medium:136,fast:464},bubbleDiameters={small:88,medium:120,large:384};
  state.bubbleSpeed=Object.hasOwn(bubbleSpeeds,initial.bubbleSpeed)?initial.bubbleSpeed:null;
  state.bubbleSize=Object.hasOwn(bubbleDiameters,initial.bubbleSize)?initial.bubbleSize:null;
  const selectedBubbleSpeed=()=>state.bubbleSpeed??'medium';
  const selectedBubbleSize=()=>state.bubbleSize??'medium';
  function bubbleItems(kind=state.bubbleMode){const items=bubbleModes[kind].items;if(state.bubbleSet==='full')return items;return items.slice(0,({numbers:profile().numberCount,letters:profile().letterCount,shapes:profile().shapeTokens})[kind]??0);}
  // Plain bubbles have a finite, age-appropriate collection, just like the other modes.
  const plainGoal=()=>Math.max(1,Number(profile().bubbleCount)||4);
  const brushWidths={small:18,medium:38,large:72};
  let audio=null,lastTone=0,rewardTimer=null,guideTimer=null,bubbleFrame=null,lastBubbleTime=0,roundSerial=0,nextRoundTimer=null;
  // One cancellable transition for every completed round or picture batch.
  // Again, navigation and age/mode changes invalidate the previous board's work.
  const PLAY_PAUSE_MS=1500;
  const OBJECT_FEEDBACK_MS=300;
  let objectFeedback=null,feedbackActionAt=null,heldObject=null;
  function releaseHeldObject(){
    if(!heldObject)return;
    heldObject.visual.removeAttribute('transform');delete heldObject.node.dataset.objectHeld;heldObject=null;
  }
  function holdObject(node,kind){
    releaseHeldObject();if(!node)return;
    let visual=[...node.children].find(child=>child.hasAttribute('data-held-visual'));
    if(!visual){visual=document.createElementNS(node.namespaceURI,'g');visual.dataset.heldVisual='';visual.append(...node.childNodes);node.appendChild(visual);}
    visual.setAttribute('transform',kind==='bead'?'scale(1.08)':'scale(1.22)');node.dataset.objectHeld=kind;heldObject={node,visual};
  }
  function clearObjectFeedback(){
    if(!objectFeedback)return;
    clearTimeout(objectFeedback.timer);objectFeedback.layer?.remove();objectFeedback.node?.classList.remove('object-selection-pop');objectFeedback.node?.removeAttribute('data-object-feedback');objectFeedback=null;
  }
  function restoreObjectFeedback(){
    const entry=objectFeedback;if(!entry?.layer||entry.layer.isConnected)return;
    if(entry.kind==='train'){
      const target=scene.querySelector(`[data-count-choice="${entry.node.textContent.trim()}"] text`);
      if(target){const b=target.getBBox(),m=scene.getScreenCTM().inverse().multiply(target.getScreenCTM()),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(m),scale=b.height/entry.height;
        const placement=new DOMMatrix().translate(p.x,p.y).scale(scale).translate(-entry.centre.x,-entry.centre.y).multiply(entry.matrix);entry.layer.setAttribute('transform',`matrix(${placement.a} ${placement.b} ${placement.c} ${placement.d} ${placement.e} ${placement.f})`);}
      if(target){const b=target.getBBox(),coach=target.closest('[data-count-choice]')?.querySelector('image')?.getBBox();if(coach)entry.layer.querySelector('.object-feedback-scale').style.setProperty('--pop-scale',String(Math.min(coach.width/Math.max(1,b.width),coach.height/Math.max(1,b.height))*.9));}
    }
    entry.layer.querySelector('.object-feedback-scale').style.animationDelay=`${-Math.min(OBJECT_FEEDBACK_MS,performance.now()-entry.started)}ms`;scene.appendChild(entry.layer);
  }
  /** Reuse the chosen object for one short pop, then release its thumbnail update. */
  function popObject(node,kind,after=null){
    clearObjectFeedback();if(!node){after?.();return;}
    const entry={node,kind,after,serial:roundSerial,activity:state.activity,started:performance.now()};objectFeedback=entry;
    if(node.namespaceURI==='http://www.w3.org/2000/svg'){
      const ns=node.namespaceURI,b=node.getBBox(),matrix=scene.getScreenCTM().inverse().multiply(node.getScreenCTM()),cx=b.x+b.width/2,cy=b.y+b.height/2,span=Math.max(1,b.width,b.height);
      Object.assign(entry,{matrix,centre:new DOMPoint(cx,cy).matrixTransform(matrix),height:Math.max(1,b.height)});
      const clone=node.cloneNode(true);clone.removeAttribute('transform');
      for(const el of [clone,...clone.querySelectorAll('*')])for(const attr of [...el.attributes])if(attr.name==='id'||attr.name==='tabindex'||attr.name==='role'||attr.name.startsWith('data-'))el.removeAttribute(attr.name);
      const layer=document.createElementNS(ns,'g');layer.dataset.objectFeedback=kind;layer.setAttribute('aria-hidden','true');layer.setAttribute('pointer-events','none');layer.setAttribute('transform',`matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`);
      const centre=document.createElementNS(ns,'g');centre.setAttribute('transform',`translate(${cx} ${cy})`);
      const pop=document.createElementNS(ns,'g');pop.classList.add('object-feedback-scale');
      const coach=kind==='train'?node.closest('[data-count-choice]')?.querySelector('image')?.getBBox():null;
      const zoom=coach?Math.min(coach.width/Math.max(1,b.width),coach.height/Math.max(1,b.height))*.9:Math.min(1.55,1+75/span);
      pop.style.setProperty('--pop-scale',String(zoom));
      const copy=document.createElementNS(ns,'g');copy.dataset.feedbackCopy='';copy.setAttribute('transform',`translate(${-cx} ${-cy})`);copy.appendChild(clone);pop.appendChild(copy);
      const radius=Math.min(75,Math.max(18,span*.6));
      if(!['shape','fruit','train','bead'].includes(kind))for(let i=0;i<8;i++){const a=i*Math.PI/4,ray=document.createElementNS(ns,'path');ray.setAttribute('d',`M${Math.cos(a)*radius} ${Math.sin(a)*radius}L${Math.cos(a)*(radius+12)} ${Math.sin(a)*(radius+12)}`);ray.setAttribute('stroke','#f6b83d');ray.setAttribute('stroke-width','4');ray.setAttribute('stroke-linecap','round');pop.appendChild(ray);}
      centre.appendChild(pop);layer.appendChild(centre);entry.layer=layer;queueMicrotask(()=>{if(objectFeedback===entry)restoreObjectFeedback();});
    }else{node.classList.add('object-selection-pop');node.dataset.objectFeedback=kind;}
    $('show-me').disabled=true;
    entry.timer=setTimeout(()=>{
      if(objectFeedback!==entry)return;
      clearObjectFeedback();
      if(entry.serial!==roundSerial||entry.activity!==state.activity)return;
      feedbackActionAt=entry.started;try{after?.();}finally{feedbackActionAt=null;}
      if(state.activity==='bubbles')bubbleTracker();else updateGameItemStrip();
      $('show-me').disabled=countHolding||!gameReady();
    },OBJECT_FEEDBACK_MS);
  }
  function scheduleNextRound(prepare=null){
    clearTimeout(nextRoundTimer);
    const serial=roundSerial,activity=state.activity,age=state.age;
    nextRoundTimer=setTimeout(()=>{
      nextRoundTimer=null;
      if(serial!==roundSerial||activity!==state.activity||age!==state.age)return;
      prepare?.();resetRound();
    },feedbackActionAt===null?PLAY_PAUSE_MS:Math.max(0,PLAY_PAUSE_MS-(performance.now()-feedbackActionAt)));
  }
  const save=()=>{
    const key=state.age??'common',current={level:state.level,bubbleSpeed:state.bubbleSpeed,bubbleSize:state.bubbleSize,bubbleSet:state.bubbleSet};ageSettings[key]=current;
    try{
      const latest=JSON.parse(localStorage.getItem('sanaLittleHandsV1')||'null'),other=latest?.ageSettings;
      const merged={...ageSettings,...(other&&typeof other==='object'&&!Array.isArray(other)?other:{}),[key]:current};Object.assign(ageSettings,merged);
      localStorage.setItem('sanaLittleHandsV1',JSON.stringify({level:state.level,sound:state.sound,bubbleSpeed:state.bubbleSpeed,bubbleSize:state.bubbleSize,ageSettings}));
    }catch{/* Play and per-age preferences also work in memory when storage is unavailable. */}
  };
  const hint=text=>{$('hint-copy').textContent=text;};
  function tone(frequency=590,win=false){
    if(!state.sound||document.hidden)return;
    if(!win&&performance.now()-lastTone<90)return;lastTone=performance.now();
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      audio??=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});
      for(let i=0;i<(win?3:1);i++){
        const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+i*.12;
        oscillator.type='sine';oscillator.frequency.value=frequency*(win?[1,1.25,1.5][i]:1);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.20,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.18);
        oscillator.connect(gain);gain.connect(audio.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+.2);
      }
    }catch{/* Unsupported audio never blocks play. */}
  }
  function progress(done,total){
    $('game-results').hidden=!state.activity;
    $('result-score').hidden=state.activity==='bubbles';
    $('result-score').textContent=total?`${({drag:'Matched',slide:'Friends',brush:state.paintMode?'Painted':'Cleaned'})[state.activity]||'Done'} ${done} / ${total}`:'';
    $('progress').hidden=!total;
    $('progress').setAttribute('aria-label',`${done} of ${total} complete`);
    $('progress').innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<done?'done':''}"></i>`).join('');
  }
  function celebrate(text){
    state.done=true;hint(text);tone(523,true);clearTimeout(rewardTimer);
    $('celebrate').hidden=false;$('art-reward').hidden=false;
    rewardTimer=setTimeout(()=>{$('celebrate').hidden=true;},1400);
  }
  function applause(){
    if(!state.sound||!audio||document.hidden)return;
    try{
      const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.12),audio.sampleRate),samples=buffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
      for(let i=0;i<8;i++){
        const source=audio.createBufferSource(),gain=audio.createGain(),start=audio.currentTime+i*.16;
        source.buffer=buffer;gain.gain.setValueAtTime(.18,start);gain.gain.exponentialRampToValueAtTime(.001,start+.12);
        source.connect(gain);gain.connect(audio.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(start);
      }
    }catch{/* Applause is optional when sound is unavailable. */}
  }
  function primitive(id,fill,stroke='#34534a'){
    const common=`fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"`;
    const polygon=(n,r=58,rotation=-90)=>`<polygon points="${Array.from({length:n},(_,i)=>{const a=(rotation+i*360/n)*Math.PI/180;return `${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')}" ${common}/>`;
    const path=d=>`<path d="${d}" ${common}/>`;
    switch(id){
      case 'circle':return `<circle r="55" ${common}/>`;
      case 'oval':return `<ellipse rx="60" ry="43" ${common}/>`;
      case 'square':return `<rect x="-53" y="-53" width="106" height="106" rx="13" ${common}/>`;
      case 'rectangle':return `<rect x="-61" y="-43" width="122" height="86" rx="9" ${common}/>`;
      case 'triangle':return polygon(3);
      case 'diamond':return polygon(4);
      case 'pentagon':return polygon(5);
      case 'hexagon':return polygon(6);
      case 'octagon':return polygon(8);
      case 'trapezoid':return path('M-35-48H35L63 49H-63Z');
      case 'parallelogram':return path('M-32-48H61L32 48H-61Z');
      case 'heart':return path('M0 54C-15 37-62 9-58-25C-55-62-13-65 0-34C18-66 58-60 59-26C62 11 17 39 0 54Z');
      case 'crescent':return path('M27-59A61 61 0 1 0 27 59A48 48 0 0 1 27-59Z');
      case 'cross':return path('M-19-59H19V-19H59V19H19V59H-19V19H-59V-19H-19Z');
      case 'semicircle':return path('M-59 45A59 59 0 0 1 59 45Z');
      case 'cone':return path('M0-60L56 49Q0 70-56 49Z');
      case 'cylinder':return `<rect x="-48" y="-45" width="96" height="93" ${common}/><ellipse cy="-45" rx="48" ry="16" ${common}/><path d="M-48 48A48 16 0 0 0 48 48" fill="none" stroke="${stroke}" stroke-width="4"/>`;
      case 'cube':return `<path d="M0-60L54-33V33L0 61L-54 33V-33Z" ${common}/><path d="M-54-33L0-4L54-33M0-4V61" fill="none" stroke="${stroke}" stroke-width="4"/>`;
      case 'arrow':return path('M-60-22H8V-55L62 0L8 55V22H-60Z');
      case 'star':return `<polygon points="${Array.from({length:10},(_,i)=>{const a=(i*36-90)*Math.PI/180,r=i%2?27:59;return `${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')}" ${common}/>`;
      default:return polygon(6);
    }
  }
  // Shared glossy finish: used by every shape illustration (Drag and Bubble Garden).
  // The geometry stays in primitive(), so hit testing and matching are unchanged.
  const shapeById=id=>shapes.find(item=>item.id===id);
  const glossyShape=(id,fill,scale=1)=>`<g transform="scale(${scale})" filter="url(#sanaShapeShadow)">${primitive(id,fill,'#274b44')}<g opacity=".52">${primitive(id,'url(#sanaShapeSheen)','none')}</g></g>`;
  const shapeEffects=`<defs><linearGradient id="sanaShapeSheen" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".67"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#152a24" stop-opacity=".2"/></linearGradient><filter id="sanaShapeShadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#38261b" flood-opacity=".3"/></filter></defs>`;
  const face=(x=0,y=0)=>`<g transform="translate(${x} ${y})" fill="#29463e"><ellipse cx="-16" cy="-4" rx="3.5" ry="5"/><ellipse cx="16" cy="-4" rx="3.5" ry="5"/><path d="M-9 12Q0 22 10 12" fill="none" stroke="#29463e" stroke-width="3.5" stroke-linecap="round"/></g>`;
  function friend(kind,x,y,scale=1){
    let art;
    if(kind==='fox')art=`<path d="M-75-34L-64-93L-20-52M75-34L64-93L20-52" fill="#cd7959" stroke="#945e49" stroke-width="4"/><path d="M-78-20Q-72-72 0-65Q71-72 78-20L52 51Q0 90-52 51Z" fill="#e79b6c"/><path d="M-74-5Q-31-15 0 48Q33-14 74-5L49 49Q0 85-49 49Z" fill="#fff4dc"/><circle cx="-32" cy="-10" r="6" fill="#29463e"/><circle cx="32" cy="-10" r="6" fill="#29463e"/><path d="M-10 28Q0 22 10 28L0 40Z" fill="#29463e"/><path d="M-14 49Q0 62 14 49" fill="none" stroke="#29463e" stroke-width="4" stroke-linecap="round"/>`;
    else if(kind==='owl')art=`<path d="M-70-43L-72-83L-35-59Q0-75 35-59L72-83L70-43Q104 44 50 72Q0 98-50 72Q-102 42-70-43Z" fill="#9d9db7"/><ellipse cx="-34" cy="0" rx="37" ry="43" fill="#fff4dc"/><ellipse cx="34" cy="0" rx="37" ry="43" fill="#fff4dc"/><circle cx="-31" cy="-2" r="10" fill="#29463e"/><circle cx="31" cy="-2" r="10" fill="#29463e"/><circle cx="-34" cy="-5" r="3" fill="white"/><circle cx="28" cy="-5" r="3" fill="white"/><path d="M-11 27H11L0 44Z" fill="#edbd48"/><path d="M-35 55L-23 66L-12 55M10 55L23 66L35 55" fill="none" stroke="#747b98" stroke-width="5"/>`;
    else art=`<ellipse cy="22" rx="73" ry="63" fill="#a9c9a0"/><circle cx="-38" cy="-30" r="30" fill="#a9c9a0"/><circle cx="38" cy="-30" r="30" fill="#a9c9a0"/><circle cx="-38" cy="-32" r="19" fill="#fff9e8"/><circle cx="38" cy="-32" r="19" fill="#fff9e8"/><circle cx="-35" cy="-32" r="7" fill="#29463e"/><circle cx="35" cy="-32" r="7" fill="#29463e"/><path d="M-31 25Q0 61 33 25" stroke="#34604d" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="-53" cy="14" rx="12" ry="6" fill="#e8b6a0"/><ellipse cx="53" cy="14" rx="12" ry="6" fill="#e8b6a0"/>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})">${art}</g>`;
  }
  function puppy(outline=false){
    const fill=outline?'none':'#e6bd86',faceFill=outline?'none':'#f2d6ad',ear=outline?'none':'#bd9275';
    return `<g stroke="#5c6555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="${puppyTail}" fill="${outline?'none':'#bd9275'}"/>
      <ellipse cx="509" cy="270" rx="165" ry="93" fill="${fill}"/>
      <rect x="391" y="308" width="63" height="53" rx="26" fill="${faceFill}"/><rect x="562" y="308" width="63" height="53" rx="26" fill="${faceFill}"/>
      <path d="M408 145Q337 85 350 192Q369 245 410 199M603 145Q674 85 662 192Q641 245 600 199" fill="${ear}"/>
      <ellipse cx="506" cy="165" rx="110" ry="99" fill="${faceFill}"/>
      <ellipse cx="465" cy="159" rx="8" ry="12" fill="#30473b" stroke="none"/><ellipse cx="550" cy="159" rx="8" ry="12" fill="#30473b" stroke="none"/>
      <circle cx="462" cy="154" r="2.5" fill="white" stroke="none"/><circle cx="547" cy="154" r="2.5" fill="white" stroke="none"/>
      <ellipse cx="506" cy="196" rx="18" ry="12" fill="#5b564b" stroke="none"/>
      <path d="M476 217Q506 246 539 217" fill="none"/><path d="M499 233Q501 260 519 254Q527 249 521 231" fill="#e8a59d" stroke-width="3"/>
      <path d="M446 337V347M426 337V348M582 337V347M602 337V348" stroke-width="3"/>
    </g>`;
  }
  const artPictures={
    1:{name:'fish',color:'#efbc6e',target:.5,
      region:'<path d="M355 220L270 150Q250 220 270 290Z"/><ellipse cx="500" cy="220" rx="180" ry="112"/>',
      details:'<path d="M555 130Q515 220 555 310M460 175L515 220L460 260" fill="none"/><circle cx="610" cy="185" r="10" fill="#30473b" stroke="none"/><circle cx="607" cy="182" r="3" fill="white" stroke="none"/><path d="M620 235Q638 252 653 233" fill="none"/>',
      dirt:[[420,185],[540,180],[430,260],[565,270]]},
    2:{name:'puppy',color:'#f2d6ad',target:.65,
      region:`<path d="${puppyTail}"/><ellipse cx="509" cy="270" rx="165" ry="93"/><rect x="391" y="308" width="63" height="53" rx="26"/><rect x="562" y="308" width="63" height="53" rx="26"/><path d="M408 145Q337 85 350 192Q369 245 410 199M603 145Q674 85 662 192Q641 245 600 199"/><ellipse cx="506" cy="165" rx="110" ry="99"/>`,
      dirt:[[451,129],[554,135],[423,246],[524,243],[609,259],[476,300],[582,307],[495,94]]},
    3:{name:'butterfly',color:'#bca9d5',target:.8,
      region:'<path d="M490 210C455 100 335 50 310 125C270 225 360 260 490 245Z"/><path d="M510 210C545 100 665 50 690 125C730 225 640 260 510 245Z"/><path d="M490 230C405 220 310 270 350 345C390 415 475 355 495 275Z"/><path d="M510 230C595 220 690 270 650 345C610 415 525 355 505 275Z"/><ellipse cx="500" cy="232" rx="24" ry="112"/><circle cx="500" cy="116" r="26"/>',
      details:'<path d="M488 98Q455 55 443 79M512 98Q545 55 557 79" fill="none"/><circle cx="375" cy="165" r="30"/><circle cx="625" cy="165" r="30"/><circle cx="400" cy="315" r="23"/><circle cx="600" cy="315" r="23"/><path d="M425 188L452 214M575 188L548 214M435 290L459 269M565 290L541 269" fill="none"/><circle cx="491" cy="112" r="4" fill="#30473b" stroke="none"/><circle cx="509" cy="112" r="4" fill="#30473b" stroke="none"/><path d="M490 125Q500 135 510 125M486 175H514M479 222H521M484 270H516" fill="none"/>',
      dirt:[[355,145],[405,165],[445,205],[645,145],[595,165],[555,205],[380,300],[420,330],[460,285],[620,300],[580,330],[540,285],[500,155],[500,245]]}
  };

  // Cumulative picture rooms for parental age selection.
  const brushLimits={2:4,3:8,4:12,5:16};
  const brushPictures=[
    ['apple','<path d="M500 130C400 60 310 125 340 260C360 360 440 390 500 345C565 390 645 350 660 260C685 125 590 60 500 130Z"/>'],
    ['sun','<circle cx="500" cy="225" r="125"/>'],
    ['fish','<path d="M350 220L270 130V310Z"/><ellipse cx="520" cy="220" rx="180" ry="112"/>'],
    ['heart','<path d="M500 366C420 300 330 245 343 162C357 78 454 82 500 155C548 78 644 83 658 162C672 245 580 307 500 366Z"/>'],
    ['star','<polygon points="500,70 553,174 671,190 585,276 606,389 500,336 394,389 415,276 329,190 447,174"/>'],
    ['flower','<circle cx="500" cy="222" r="52"/><circle cx="500" cy="124" r="58"/><circle cx="590" cy="188" r="58"/><circle cx="557" cy="298" r="58"/><circle cx="443" cy="298" r="58"/><circle cx="410" cy="188" r="58"/>'],
    ['butterfly','<path d="M488 220C401 78 298 92 325 208C340 270 418 260 488 245Z"/><path d="M512 220C599 78 702 92 675 208C660 270 582 260 512 245Z"/><path d="M489 246C401 230 344 286 380 351C424 398 477 335 493 273Z"/><path d="M511 246C599 230 656 286 620 351C576 398 523 335 507 273Z"/><ellipse cx="500" cy="232" rx="21" ry="106"/>'],
    ['house','<path d="M325 213L500 70L675 213V380H325Z"/><rect x="462" y="265" width="76" height="115"/>'],
    ['car','<path d="M318 251L375 168H620L681 251V322H318Z"/><circle cx="400" cy="326" r="40"/><circle cx="600" cy="326" r="40"/>'],
    ['tree','<rect x="471" y="250" width="58" height="140"/><circle cx="436" cy="215" r="82"/><circle cx="562" cy="215" r="82"/><circle cx="500" cy="140" r="85"/>'],
    ['moon','<path d="M565 78A156 156 0 1 0 565 370A130 130 0 0 1 565 78Z"/>'],
    ['boat','<path d="M305 282H695L622 369H382Z"/><path d="M491 94V280H365Z"/><path d="M513 110L643 280H513Z"/>'],
    ['rocket','<path d="M500 70C430 143 432 258 458 332H542C568 258 570 143 500 70Z"/><path d="M458 259L401 339L462 320M542 259L599 339L538 320"/><circle cx="500" cy="198" r="34"/>'],
    ['balloon','<ellipse cx="500" cy="180" rx="118" ry="125"/><path d="M481 300H519L500 329Z"/><path d="M500 329Q445 359 500 393"/>'],
    ['cat','<path d="M366 179L378 76L453 132Q500 105 547 132L622 76L634 179Q688 305 598 349Q500 395 402 349Q312 305 366 179Z"/>'],
    ['crown','<path d="M322 150L397 239L500 98L603 239L678 150L647 350H353Z"/>']
  ];
  let brushIndex=0,brushAge=null;const brushFinished=new Set();
  const brushCount=()=>brushLimits[state.age]||16;
  const brushPicture=()=>{const [name,region]=brushPictures[brushIndex%brushCount()];return {name,region,target:.97,dirt:[[420,155],[520,155],[600,185],[390,245],[500,240],[600,275],[450,320],[560,330]]};};
  const brushThumbColors={apple:'#ee5651',flower:'#55bdf4',star:'#ffcd43',car:'#6ad765',butterfly:'#bd83ef',fish:'#ffac54',sun:'#ffc94e',tree:'#60b66c',house:'#f09c6b',heart:'#f06e90',balloon:'#8e9ff2',bird:'#71b9e4',cat:'#d9aa77',dog:'#d8aa79',rainbow:'#e8a2d9',boat:'#75b4ee'};
  function brushThumbColor(name){return brushThumbColors[name]||'#75b9e7';}
  function updateBrushThumbnails(){
    const strip=$('brush-thumbnails');
    if(!strip)return;
    strip.hidden=state.activity!=='brush';
    if(strip.hidden)return;
    strip.innerHTML=brushPictures.slice(0,brushCount()).map(([name,region],i)=>
      `<button type="button" class="brush-thumb ${i===brushIndex?'current':brushFinished.has(i)?'past':''}" role="listitem" data-brush-index="${i}" aria-label="Select ${name}" aria-pressed="${i===brushIndex}" ${i===brushIndex?'aria-current="step"':''} title="Select ${name}"><svg viewBox="250 55 500 345" aria-hidden="true"><g fill="${brushThumbColor(name)}" stroke="#45675d" stroke-width="10" stroke-linejoin="round">${region}</g></svg><span>${name[0].toUpperCase()+name.slice(1)}</span></button>`).join('');
    updateGameItemStrip();
    const current=strip.querySelector('.current');
    if(current){const x=current.offsetLeft-strip.offsetLeft; if(x<strip.scrollLeft||x+current.offsetWidth>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=Math.max(0,x-strip.clientWidth/3);}
  }
  $('brush-thumbnails').addEventListener('click',event=>{const button=event.target.closest('[data-brush-index]');if(!button||state.activity!=='brush')return;const index=Number(button.dataset.brushIndex);if(!Number.isInteger(index)||index<0||index>=brushCount())return;brushIndex=index;resetRound();});
  function brushComplete(message){if(state.done)return;popObject(scene.querySelector('[data-art-picture]'),'art');brushFinished.add(brushIndex);updateBrushThumbnails();celebrate(message);applause();scheduleNextRound(()=>{brushIndex=(brushIndex+1)%brushCount();if(brushIndex===0)brushFinished.clear();});}
  const artPicture=()=>state.activity==='brush'?brushPicture():({...artPictures[profile().picture],target:profile().paintTarget});
  function pictureArt(outline=false){
    const picture=artPicture();if(state.activity==='brush')return `<g data-art-picture="" stroke="#536b5b" stroke-width="5" stroke-linejoin="round" fill="${outline?'none':brushThumbColor(picture.name)}">${picture.region}</g>`;if(picture.name==='puppy')return puppy(outline);
    return `<g stroke="#5c6555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><g fill="${outline?'none':picture.color}">${picture.region}</g><g fill="${outline?'none':'#f6d789'}">${picture.details}</g></g>`;
  }
  function preview(id){
    if(id==='puzzle')return '<rect x="13" y="35" width="78" height="104" rx="9" fill="#b4deec" stroke="#6e8e76" stroke-width="3"/><path d="M15 90H89V137H15Z" fill="#8cbb79"/><path d="M52 36V138M14 87H90" stroke="#fffaf0" stroke-width="4"/><path d="M23 76L40 55L57 76Z" fill="#e78e76"/><circle cx="72" cy="57" r="11" fill="#ffe17a"/><rect x="130" y="35" width="78" height="104" rx="9" fill="#f3f5e9" stroke="#8aa67a" stroke-width="3"/><path d="M169 37V137M132 87H206" stroke="#9bb18e" stroke-width="2" stroke-dasharray="4 3"/><path d="M98 87H122M113 78L123 87L113 96" fill="none" stroke="#287c60" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
    if(id==='abacus')return `<g stroke="#9b7e60" stroke-width="5"><path d="M15 22V152M113 22V152M15 30H113M15 76H113M15 122H113"/>${[0,1,2].map((row)=>[0,1,2].map(i=>`<circle cx="${31+i*23}" cy="${30+row*46}" r="10" fill="${['#ff3b30','#ff9500','#ffe500'][row]}" stroke-width="1"/>`).join('')).join('')}</g><path d="M132 110A36 36 0 0 1 204 110M143 110A25 25 0 0 1 193 110M154 110A14 14 0 0 1 182 110" fill="none" stroke="#ff3b30" stroke-width="10"/><circle cx="168" cy="140" r="17" fill="#ff8fc7"/><circle cx="168" cy="140" r="11" fill="white"/><circle cx="168" cy="140" r="6" fill="#b5794a"/>`;
    if(id==='drag')return `<g transform="translate(63 76) scale(.67)">${primitive('triangle','#ebc34e')}${face(0,12)}</g><g transform="translate(150 90) scale(.67) rotate(12)">${primitive('square','#71abc6')}${face()}</g><path d="M110 27L114 17M184 49L195 43" stroke="#76a181" stroke-width="5" stroke-linecap="round"/>`;
    if(id==='bubbles')return `<circle cx="69" cy="84" r="38" fill="#e59b9d"/><circle cx="145" cy="65" r="45" fill="#8fc7d5"/><circle cx="144" cy="65" r="36" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><path d="M121 46Q125 35 140 34M49 66Q56 56 67 56" stroke="white" stroke-width="7" stroke-linecap="round" opacity=".7"/><g transform="translate(145 65) scale(.6)">${face()}</g><path d="M56 25L53 15M188 111L197 116" stroke="#cfa834" stroke-width="5" stroke-linecap="round"/>`;
    if(id==='slide')return `<rect x="35" y="13" width="145" height="119" rx="20" fill="#fffaf0" stroke="#9cbfc9" stroke-width="4"/>${friend('fox',107,79,.56)}<path d="M38 109H177V130H38Z" fill="#bbd6d9"/><path d="M49 152H166" stroke="#9bbec9" stroke-width="11" stroke-linecap="round"/><circle cx="119" cy="152" r="17" fill="#f2cf65" stroke="#bc9d45" stroke-width="3"/>`;
    return `<g transform="translate(-90 -19) scale(.42)">${pictureArt()}</g><g transform="translate(145 82) rotate(24)"><rect x="-10" y="-65" width="20" height="78" rx="10" fill="#74a390"/><rect x="-24" y="3" width="48" height="39" rx="9" fill="#f7e1b1" stroke="#d7bb8d" stroke-width="3"/><path d="M-12 27V40M0 27V41M12 27V40" stroke="#c8a87d" stroke-width="3"/></g>`;
  }
  $('activity-grid').innerHTML=Object.entries(activities).map(([id,a])=>`<button class="activity-card" type="button" data-activity="${id}" aria-label="${a.label}"><span class="card-arrow" aria-hidden="true">↗</span><svg class="card-art" viewBox="0 0 220 180" aria-hidden="true">${preview(id)}</svg><b>${a.word}</b><small>${a.caption}</small></button>`).join('');
  const cardGrid=$('activity-grid');
  cardGrid.insertAdjacentHTML('beforeend','<div class="activity-card upcoming-card" role="group" aria-label="More games coming"><svg class="card-art" viewBox="0 0 220 180" aria-hidden="true"><circle cx="110" cy="85" r="52" fill="#fff6d6" stroke="currentColor" stroke-width="4"/><path d="M110 60V110M85 85H135" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="M40 42L44 52L54 56L44 60L40 70L36 60L26 56L36 52ZM177 115L180 122L188 125L180 128L177 136L174 128L166 125L174 122Z" fill="#e0b83b"/></svg><b>More games</b><small>Coming soon</small></div>');
  let cardSwipe=null,ignoreCardClick=false;
  const cardStep=()=>Math.max(1,(cardGrid.firstElementChild?.offsetWidth||0)+(parseFloat(getComputedStyle(cardGrid).columnGap)||0));
  function updateCardNavigation(){
    const max=Math.max(0,cardGrid.scrollWidth-cardGrid.clientWidth);
    $('previous-games').disabled=cardGrid.scrollLeft<2;$('next-games').disabled=cardGrid.scrollLeft>=max-2;
    const first=Math.round(cardGrid.scrollLeft/cardStep())+1,total=cardGrid.children.length;
    $('card-page').textContent=`Games ${first} to ${Math.min(total,first+4)} of ${total}`;
  }
  function scrollCards(left){cardGrid.scrollTo({left:Math.max(0,Math.min(left,cardGrid.scrollWidth-cardGrid.clientWidth)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  $('previous-games').addEventListener('click',()=>scrollCards(cardGrid.scrollLeft-cardGrid.clientWidth));
  $('next-games').addEventListener('click',()=>scrollCards(cardGrid.scrollLeft+cardGrid.clientWidth));
  cardGrid.addEventListener('scroll',updateCardNavigation,{passive:true});
  new ResizeObserver(updateCardNavigation).observe(cardGrid);
  new MutationObserver(updateCardNavigation).observe(cardGrid,{childList:true});
  // Map the swipe into the play frame, including its portrait-device rotation.
  cardGrid.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    ignoreCardClick=false;cardSwipe={id:event.pointerId,start:app.classList.contains('rotated')?event.clientY:event.clientX,left:cardGrid.scrollLeft,dragging:false};
  });
  cardGrid.addEventListener('pointermove',event=>{
    if(cardSwipe?.id!==event.pointerId)return;
    const distance=(app.classList.contains('rotated')?event.clientY:event.clientX)-cardSwipe.start;
    if(!cardSwipe.dragging&&Math.abs(distance)>8){cardSwipe.dragging=true;cardGrid.dataset.dragging='true';cardGrid.setPointerCapture(event.pointerId);}
    if(cardSwipe.dragging){event.preventDefault();cardGrid.scrollLeft=cardSwipe.left-distance;}
  });
  function finishCardSwipe(event){
    if(cardSwipe?.id!==event.pointerId)return;
    const dragged=cardSwipe.dragging;cardSwipe=null;delete cardGrid.dataset.dragging;
    if(cardGrid.hasPointerCapture(event.pointerId))cardGrid.releasePointerCapture(event.pointerId);
    if(dragged){ignoreCardClick=true;scrollCards(Math.round(cardGrid.scrollLeft/cardStep())*cardStep());}
  }
  cardGrid.addEventListener('pointerup',finishCardSwipe);cardGrid.addEventListener('pointercancel',finishCardSwipe);
  cardGrid.addEventListener('lostpointercapture',event=>{if(event.target===cardGrid)finishCardSwipe(event);});
  cardGrid.addEventListener('click',event=>{if(ignoreCardClick&&event.detail!==0){ignoreCardClick=false;event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  cardGrid.addEventListener('keydown',event=>{
    if(event.target!==cardGrid||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();scrollCards(event.key==='Home'?0:event.key==='End'?cardGrid.scrollWidth:cardGrid.scrollLeft+(event.key==='ArrowRight'?cardStep():-cardStep()));
  });
  $('paint-tools').insertAdjacentHTML('beforeend',colors.map((color,i)=>`<button class="paint-color" type="button" data-paint="${color}" style="--paint:${color}" aria-label="${colorNames[i]} paint" aria-pressed="${i===0}"></button>`).join(''));
  function clearEffects(){clearObjectFeedback();stopDemo();clearTimeout(nextRoundTimer);nextRoundTimer=null;clearTimeout(rewardTimer);clearTimeout(guideTimer);$('celebrate').hidden=true;$('art-reward').hidden=true;scene.querySelector('[data-guide]')?.remove();}
  function cancelGesture(){
    releaseHeldObject();
    const pointer=state.pointer;state.pointer=null;
    if(pointer?.kind==='abacus')cancelAnimationFrame(pointer.feedbackFrame);
    if(pointer&&scene.hasPointerCapture?.(pointer.id)){try{scene.releasePointerCapture(pointer.id);}catch{/* Gesture may already have ended. */}}
    if(pointer?.kind==='drag')renderDrag();
    if(pointer?.kind==='count-fruit')pointer.node.setAttribute('transform',pointer.origin);
    if(pointer?.kind==='abacus'&&state.activity==='abacus'){restoreAbacusRow(pointer.row);updateAbacusFeedback(pointer.row);}
    scene.querySelector('#brush-cursor')?.remove();
  }
  const ageOptions=[...document.querySelectorAll('.age-radio')];
  function closeAgeMenu(){} // Legacy call sites retained without altering game transitions.
  function parentAgeControls(){
    app.dataset.age=String(state.age??'family');
    ageOptions.forEach(option=>{const active=Number(option.dataset.ageOption)===(state.age??2);option.setAttribute('aria-checked',String(active));option.tabIndex=active?0:-1;});
    app.classList.toggle('age-profile',state.age!==null);
    const welcome=app.querySelector('a.brand');if(welcome)welcome.href=ageProfiles.navigation('index.html');
  }
  function chooseParentAge(value){
    if(app.classList.contains('immersive'))return;
    if(String(state.age??'')===String(value))return;
    const activity=state.activity,paintMode=state.paintMode;
    save();ageProfiles.select(value);state.age=ageProfiles.getAge();const selected=preferences();
    state.level=1;
    state.bubbleSpeed=Object.hasOwn(bubbleSpeeds,selected.bubbleSpeed)?selected.bubbleSpeed:null;state.bubbleSize=Object.hasOwn(bubbleDiameters,selected.bubbleSize)?selected.bubbleSize:null;
    state.bubbleSet=selected.bubbleSet==='full'||state.age===null?'full':'starter';state.bubbleMode=profile().bubbleMode;state.brushSize=profile().brushSize;
    try{history.replaceState(null,'',ageProfiles.navigation(location.pathname+location.search));}catch{/* The current page choice still works without history access. */}
    save();levelControls();parentAgeControls();document.querySelector('[data-activity="brush"] .card-art').innerHTML=preview('brush');if(activity)startActivity(activity,paintMode);else hint('Choose any picture and play together. Every game is open.');
  }
  ageOptions.forEach((option,index)=>{
    option.addEventListener('click',()=>chooseParentAge(option.dataset.ageOption));
    option.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?ageOptions.length-1:(index+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1)+ageOptions.length)%ageOptions.length;
      chooseParentAge(ageOptions[next].dataset.ageOption);ageOptions[next].focus({preventScroll:true});
    });
  });
  function home(){picturePuzzle.leave();cancelCountAdvance();stopBubbles();cancelGesture();clearEffects();artGeneration++;artState('ready');state.activity=null;state.selected=null;const header=app.querySelector('.topbar');header.append($('sound'),$('music-toggle'),$('vibration-toggle'));app.dataset.view='home';parentAgeControls();$('home-view').hidden=false;$('activity-view').hidden=true;$('again').hidden=true;$('show-me').hidden=true;$('bubble-tracker').hidden=true;$('item-progress-strip').hidden=true;progress(0,0);hint('Choose a picture. I’ll play with you!');}
  function levelControls(){document.querySelectorAll('[data-level]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.level)===state.level)));}
  function setLevel(level,reset=true){cancelGesture();const changed=state.level!==level;state.level=level;if(changed)state.brushSize=profile().brushSize;levelControls();save();document.querySelector('[data-activity="brush"] .card-art').innerHTML=preview('brush');if(reset&&state.activity)resetRound();else if(reset)hint(level===2?'Medium level: choose a picture and play together!':level===1?'Easy level: fewer, bigger things to try.':'Challenge level: a few more things to discover.');}
  function startActivity(id,paintMode=false){closeAgeMenu();$('game-mid-controls').append($('sound'),$('music-toggle'),$('fullscreen'),$('vibration-toggle'));state.activity=id;state.paintMode=paintMode;app.dataset.view=id;$('home-view').hidden=true;$('activity-view').hidden=false;$('again').hidden=false;$('show-me').hidden=false;$('activity-name').textContent=activities[id].title;$('step-note').textContent=activities[id].note;resetRound();}
  function resetRound(){
    roundSerial++;
    clearTimeout(slideAdvanceTimer);slideDoorAnimating=false;cancelCountAdvance();$('art-reward').hidden=true;stopBubbles();cancelGesture();clearEffects();state.done=false;state.selected=null;state.strokes=[];
    $('play-levels').hidden=true;$('abacus-stage').hidden=state.activity!=='abacus';
    $('bubble-score').hidden=state.activity!=='bubbles';
    $('bubble-modes').hidden=state.activity!=='bubbles';$('bubble-tracker').hidden=state.activity!=='bubbles';$('step-note').hidden=true;
    $('bubble-settings').hidden=state.activity!=='bubbles';updateBubbleSettings();
    scene.parentElement.classList.toggle('bubble-mat',state.activity==='bubbles');scene.setAttribute('viewBox','0 0 1000 440');
    $('brush-modes').hidden=state.activity!=='brush';$('paint-tools').hidden=state.activity!=='brush';
    $('art-tools').hidden=state.activity!=='brush';
    if(state.activity==='puzzle')picturePuzzle.start(state.age);else picturePuzzle.leave();
    state.erase=false;updateArtTools();
    scene.setAttribute('aria-label','Play area');
    if(state.activity==='brush'){if(brushAge!==state.age){brushAge=state.age;brushIndex=0;brushFinished.clear();}$('activity-name').textContent=`Little art studio · ${artPicture().name[0].toUpperCase()+artPicture().name.slice(1)} · ${brushIndex+1}/${brushCount()}`;}
    updateBrushThumbnails();
    $('clean-mode').setAttribute('aria-pressed',String(!state.paintMode));$('paint-mode').setAttribute('aria-pressed',String(state.paintMode));
    scene.style.background='transparent';
    if(state.activity==='abacus'){if(state.age===5){state.abacusRows=abacusColors.map(()=>Array(10).fill(false));state.abacusSelectedRow=0;renderAbacus();}else resetCountAdventure();}
    else if(state.activity==='drag'){
      if(shapeAge!==state.age){shapeAge=state.age;shapeRound=0;shapeCompleted=0;}
      const pool=shapes.slice(0,shapeLevelLimits[state.age]||4);
      const batches=Math.ceil(pool.length/shapeBatchSize);
      const batch=shapeRound%batches;
      const selected=pool.slice(batch*shapeBatchSize,(batch+1)*shapeBatchSize);
      state.shapes=selected.map((shape,i)=>({...shape,placed:false,
        x:195+(i%2)*210,y:186+Math.floor(i/2)*155,
        tx:655+(i%2)*210,ty:186+Math.floor(i/2)*155}));
      renderDrag();
    }else if(state.activity==='bubbles'){
      renderBubbles();
    }else if(state.activity==='puzzle'){
      scene.replaceChildren();
    }else if(state.activity==='slide'){
      clearTimeout(slideAdvanceTimer);state.slideIndex=0;state.slideRevealed=false;state.sliders=[];renderSlide();
    }else if(state.paintMode){renderPaint();}else{
      const points=artPicture().dirt;
      state.dirt=points.map(([x,y],i)=>({id:i,x,y,r:state.level===3?22:29,health:profile().dirtHealth,max:profile().dirtHealth}));renderClean();
    }
    if(state.activity!=='abacus')hint(state.activity==='brush'?(state.paintMode?`Pick a color and paint inside the ${artPicture().name}. SaNa will cheer you on!`:`Brush the muddy ${artPicture().name}. Give it a gentle wash.`):activities[state.activity].hint);
    updateGameNavigation();
    if(state.activity==='abacus'&&state.age===5)abacusHint();
    if(state.activity==='bubbles')hint(state.bubbleMode==='plain'?'Tap the rising bubbles. Splash, pop! They keep coming.':'Pop a bubble to color its matching item above. Find them all!');
    prepareSceneArt();
  }
  // Ages 2/3 keep the completed collection visible before marking its thumbnail.
  let countStage=0,countPlaced=0,countTimer=null,countHolding=false;
  const countCollected=new Set();
  const countStockSize=age=>age===2?5:age===3?10:0;
  const countMax=()=>countStockSize(state.age)||20;
  const countTitle=()=>state.age===2?'Apple Basket':state.age===3?'Feed the Hungry Rabbit':'Number Train Adventure';
  function harvestInstruction(target,age=state.age,collected=countCollected.size){
    const apple=age===2,noun=apple?'apple':'carrot',remaining=Math.max(0,target-collected);
    if(!remaining)return `${collected} ${noun}${collected===1?'':'s'} ${apple?'in the basket':'with the rabbit'}.`;
    const quantity=`${remaining}${collected?' more':''} ${noun}${remaining===1?'':'s'}`;
    return collected?`${apple?'Add':'Give'} ${quantity} to make ${target}.`:`${apple?'Put':'Give'} ${quantity} ${apple?'in the basket':'to the rabbit'}.`;
  }
  function cancelCountAdvance(){
    clearTimeout(countTimer);countTimer=null;countHolding=false;
    $('show-me').disabled=false;
  }
  function resetCountAdventure(){
    cancelCountAdvance();countStage=0;countPlaced=0;countCollected.clear();renderCountAdventure();
  }
  function countImage(name,x,y,width,height,extra=''){
    return `<image href="count-art/${name}.webp" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
  }
  function countIcon(x,y,kind,scale=1){
    const carrot=kind==='carrot';
    return `<g transform="translate(${x} ${y}) scale(${scale})">${countImage(carrot?'carrot':'apple',carrot?-28:-32,carrot?-48:-37,carrot?56:64,carrot?88:74,'pointer-events="none"')}</g>`;
  }
  const collectedCarrotScale=.84;
  function countSourcePoint(index,age=state.age){
    // Stagger the two carrot rows on the dark soil, clear of the orange boards.
    return age===2?[[110,99],[225,77],[310,117],[150,187],[260,192]][index]:[155+(index%5)*70-(index>=5?35:0),index<5?223:261];
  }
  function countCollectedPoint(index,age=state.age){
    return age===2?[[715,229],[780,229],[845,229],[747,186],[812,186]][index]:[[784,354],[862,354],[940,354],[706,354],[628,354],[550,354],[956,300],[716,300],[638,300],[560,300]][index];
  }
  function countDestination(age=state.age){return age===2?{x:800,y:240,rx:175,ry:110}:{x:810,y:285,rx:300,ry:160};}
  function countPraise(final=false){
    const message=countHolding&&!final?'Wait for the next count.':'Let’s count again!';
    return `<g data-count-praise="" role="status" aria-live="polite"><rect data-text-panel="harvest-prompt" x="395" y="20" width="330" height="98" rx="26" fill="none" stroke="#75a460" stroke-width="4"/><circle cx="425" cy="56" r="22" fill="#ffe385"/><text x="425" y="66" text-anchor="middle" font-size="28" aria-hidden="true">🐒</text><text class="scene-caption" data-label-for="harvest-prompt" x="560" y="53" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="900" fill="#216144">Well done!</text><text class="scene-caption" data-label-for="harvest-prompt" x="560" y="91" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="800" fill="#30564d">${message}</text></g>`;
  }
  function countLedger(age){
    const apple=age===2,total=countStockSize(age),collected=countCollected.size,left=total-collected,baseline=apple?396:411;
    return `<g data-count-ledger="" role="group" aria-label="${total} total; ${left} left; ${collected} collected">`+
      [[apple?'Apples in tree':'Carrots in farm',left,'source',30,apple?330:510],[apple?'Apples in basket':'Carrots with rabbit',collected,'collected',apple?640:600,apple?330:370]].map(([title,n,key,x,w])=>`<g data-count-ledger-item="${key}"><rect data-text-panel="harvest-ledger-${key}" x="${x}" y="${baseline-27}" width="${w}" height="54" rx="13" fill="none" stroke="#71935c" stroke-width="2"/><text class="scene-caption" data-label-for="harvest-ledger-${key}" x="${x+w/2}" y="${baseline}" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="800" fill="#33533b">${title}: <tspan data-count-ledger-value="${key}" dominant-baseline="central" font-size="32" font-weight="900" fill="#174d36">${n}</tspan></text></g>`).join('')+'</g>';
  }
  function renderHarvestCount(target,age){
    const apple=age===2,kind=apple?'apple':'carrot',max=countStockSize(age);
    const done=state.done&&countStage>=max;
    let html=`<defs><clipPath id="count-basket-front"><rect x="635" y="267" width="330" height="93"/></clipPath></defs><rect x="10" y="12" width="980" height="${apple?415:425}" rx="30" fill="none" stroke="#b6cea1" stroke-width="6"/>`;
    if(apple){
      html+=countImage('apple-tree',20,12,360,350,'aria-label="Apple tree"');
      html+=`<g data-count-drop="basket" role="img" aria-label="Basket for the apples">${countImage('basket',635,140,330,220)}<rect x="635" y="140" width="330" height="220" fill="transparent" pointer-events="none"/></g>`;
    }else{
      // Match the apple room's ground line; shadows sit beneath the feet and bed.
      html+='<g data-count-ground="" fill="#354c24" pointer-events="none"><ellipse cx="290" cy="360" rx="230" ry="9" fill-opacity=".16"/><ellipse cx="825" cy="359" rx="76" ry="10" fill-opacity=".2"/></g>';
      html+=countImage('carrot-garden',20,151,540,235,'aria-label="Carrot garden"');
      html+=`<g data-count-drop="rabbit" role="img" aria-label="Rabbit waiting for carrots">${countImage('rabbit',695,100,260,260)}<rect x="590" y="135" width="400" height="260" fill="transparent" pointer-events="none"/></g>`;
    }
    for(let i=0;i<max;i++){
      if(countCollected.has(i))continue;
      const [x,y]=countSourcePoint(i,age);
      const hitWidth=apple?68:52;
      html+=`<g data-count-fruit="${i}" role="button" tabindex="${countHolding||done?-1:0}" aria-disabled="${countHolding||done}" aria-label="Drag ${kind} ${i+1} to ${apple?'basket':'rabbit'}" transform="translate(${x} ${y})" style="cursor:${countHolding||done?'default':'grab'};touch-action:none"><rect x="${-hitWidth/2}" y="-48" width="${hitWidth}" height="92" fill="transparent"/>${countIcon(0,0,kind)}</g>`;
    }
    const slots=Array.from({length:max},(_,index)=>countCollectedPoint(index,age));
    [...countCollected].map((id,index)=>({id,index})).sort((a,b)=>slots[a.index][1]-slots[b.index][1]).forEach(({id,index})=>{
      const [x,y]=slots[index];if(!apple)html+=`<ellipse cx="${x-2}" cy="${y+18}" rx="33" ry="4.5" fill="#354c24" fill-opacity=".18" pointer-events="none"/>`;
      html+=`<g data-count-collected="${id}" role="img" aria-label="${kind} ${index+1} ${apple?'in the basket':'on the ground beside the rabbit'}"${apple?'':` transform="translate(${x} ${y}) rotate(-90)"`}>${countIcon(apple?x:0,apple?y:0,kind,apple?1:collectedCarrotScale)}</g>`;
    });
    if(apple)html+=countImage('basket',635,140,330,220,'clip-path="url(#count-basket-front)" pointer-events="none"');
    if(countHolding||done)html+=countPraise(done);
    else html+=`<rect data-text-panel="harvest-prompt" x="395" y="20" width="330" height="98" rx="26" fill="none" stroke="#b6cea1" stroke-width="3"/><text class="scene-caption" data-label-for="harvest-prompt" x="560" y="53" text-anchor="middle" dominant-baseline="central" font-size="31" font-weight="900" fill="#285d4c">Count to ${target}</text><text class="scene-caption" data-label-for="harvest-prompt" data-count-instruction="" x="560" y="91" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="800" fill="#30564d">${harvestInstruction(target,age)}</text>`;
    // Keep the physical collection and its numeral visible during the praise.
    html+=`<rect data-text-panel="harvest-counter" x="760" y="12" width="200" height="45" rx="20" fill="none" stroke="#79ab61" stroke-width="3"/><text class="scene-caption" data-label-for="harvest-counter" data-count-counter="" x="860" y="34.5" text-anchor="middle" dominant-baseline="central" font-size="32" font-weight="900" fill="#215a3e">${countPlaced} / ${target}</text>`;
    html+=countLedger(age);
    return html;
  }
  function numberTrainLayout(){
    const width=1000,height=Math.max(140,Math.min(440,width*scene.clientHeight/Math.max(1,scene.clientWidth)));
    return{width,height,compact:height<280,baseline:height<280?height-38:height*.70,unit:width/Math.max(1,scene.clientWidth)};
  }
  function renderNumberTrain(target){
    const g=numberTrainLayout(),h=g.height,base=g.baseline,compact=g.compact;
    scene.setAttribute('viewBox',`0 0 1000 ${h}`);
    state.trainSize=`${scene.clientWidth}/${scene.clientHeight}`;
    const titleFont=Math.max(compact?23:32,14*g.unit),targetFont=titleFont,numberFont=Math.max(24,15*g.unit),plateW=Math.max(54,numberFont*1.4),plateH=Math.max(36,numberFont*1.1);
    const headingH=Math.max(titleFont,targetFont)*1.4+12;
    let html=`<rect data-train-panel="" x="6" y="4" width="988" height="${h-8}" rx="18" fill="none" stroke="#7aaa4b" stroke-width="5"/><rect data-text-panel="train-title" x="16" y="4" width="470" height="${headingH}" rx="12" fill="none"/><rect data-text-panel="train-target" x="514" y="4" width="470" height="${headingH}" rx="12" fill="none"/><text class="scene-caption" data-label-for="train-title" x="251" y="${4+headingH/2}" text-anchor="middle" dominant-baseline="central" font-size="${titleFont}" font-weight="900" fill="#30564d">${countTitle()}</text><text class="scene-caption" data-label-for="train-target" x="749" y="${4+headingH/2}" text-anchor="middle" dominant-baseline="central" font-size="${targetFont}" font-weight="900" fill="#30564d">Find number: ${target}</text>`;
    for(let x=0;x<=1000;x+=24)html+=`<path d="M${x} ${base-4}v10" stroke="#9a795a" stroke-width="7"/>`;
    html+=`<path data-train-track="" d="M0 ${base-5}H1000M0 ${base+2}H1000" stroke="#64747a" stroke-width="3"/><image data-train-art="engine" href="train-art/locomotive-colour-v126.webp" x="20" y="${base-100}" width="190" height="100" preserveAspectRatio="xMidYMax meet"/><text data-train-engine="" x="115" y="${base+24}" text-anchor="middle" font-size="${Math.max(compact?17:24,12*g.unit)}" font-weight="900" fill="#30564d" stroke="#fffce8" stroke-width="3" paint-order="stroke fill">SaNa Express</text>`;
    const [first,last]=[[1,4],[5,9],[10,13],[14,16],[17,20]].find(([,end])=>target<=end);
    const coachCount=last-first+1,step=760/Math.max(4,coachCount),coachWidth=step-5,coachScale=coachWidth/185;
    const coachColours=['turquoise','yellow','coral','violet'];
    for(let i=0;i<coachCount;i++){
      const n=first+i,x=210+i*step,cx=x+coachWidth/2,cy=base-27*coachScale;
      html+=`<g data-count-choice="${n}" role="button" tabindex="0" aria-label="Choose carriage ${n}" style="cursor:pointer"><rect x="${x+2}" y="${base-78*coachScale}" width="${coachWidth-4}" height="${85*coachScale}" rx="10" fill="transparent"/><image data-train-art="carriage" href="train-art/carriage-${coachColours[i%coachColours.length]}-v126.webp" x="${x}" y="${base-100*coachScale}" width="${coachWidth}" height="${100*coachScale}" preserveAspectRatio="xMidYMax meet"/><rect data-text-panel="train-number-${n}" x="${cx-plateW/2}" y="${cy-plateH/2}" width="${plateW}" height="${plateH}" rx="7" fill="none" stroke="#42616d" stroke-width="2"/><text class="scene-caption" data-label-for="train-number-${n}" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${numberFont}" font-weight="900" fill="#173e49">${n}</text></g>`;
    }
    scene.innerHTML=html;
  }
  function renderCountAdventure(){
    if(state.activity!=='abacus'||state.age===5)return;
    const age=state.age,target=Math.min(countStage+1,countMax());
    $('activity-name').textContent=countTitle();scene.setAttribute('viewBox','0 0 1000 440');
    if(age===2||age===3){
      scene.innerHTML=renderHarvestCount(target,age);
      hint(countHolding?'Well done! Wait for the next count.':state.done?'Wonderful counting! A new round starts soon.':harvestInstruction(target,age));
    }else{
      renderNumberTrain(target);
      hint(`Find number ${target} and tap its train carriage!`);
    }
    progress(countStage,countMax());updateGameItemStrip();prepareSceneArt();
  }
  function countTap(event,point){
    if(state.done||countHolding||state.activity!=='abacus'||state.age===5)return;
    if(state.age===2||state.age===3){
      const fruit=event.target.closest('[data-count-fruit]');
      const id=Number(fruit?.dataset.countFruit);
      if(!event.countDragSuccess||!fruit||!Number.isInteger(id)||id<0||id>=countMax()||countCollected.has(id))return;
      countCollected.add(id);countPlaced=countCollected.size;haptic(38,0);tone(560);
      if(countPlaced===countStage+1){
        countHolding=true;$('show-me').disabled=true;
        const serial=roundSerial,age=state.age,stage=countStage;
        renderCountAdventure();sanaSay('Well done! Wait for the next count.');
        countTimer=setTimeout(()=>{
          countTimer=null;
          if(!countHolding||serial!==roundSerial||state.activity!=='abacus'||state.age!==age||countStage!==stage)return;
          countHolding=false;$('show-me').disabled=false;countStage++;
          if(countStage===countMax()){
            celebrate(`Wonderful counting! You completed ${countTitle()}!`);renderCountAdventure();applause();scheduleNextRound();
          }else renderCountAdventure();
        },PLAY_PAUSE_MS);
      }else renderCountAdventure();
      popObject(scene.querySelector(`[data-count-collected="${id}"]`),'fruit');
      return;
    }
    const choice=event.target.closest('[data-count-choice]');
    if(!choice||objectFeedback?.after)return;
    if(Number(choice.dataset.countChoice)!==countStage+1){popObject(choice.querySelector('text'),'train');hint(`Try number ${countStage+1}!`);return;}
    haptic(45,0);tone(700);popObject(choice.querySelector('text'),'train',()=>{countStage++;countPlaced=0;
    if(countStage>=countMax()){
      progress(countStage,countMax());updateGameItemStrip();celebrate(`Wonderful counting! You completed ${countTitle()}!`);applause();
      scheduleNextRound();
    }else renderCountAdventure();});
  }

  scene.addEventListener('keydown',event=>{
    if(!gameReady()||demoActive){event.preventDefault();return;}
    if(state.activity!=='abacus'||state.age===5||!['Enter',' '].includes(event.key))return;
    if(event.target.closest('[data-count-action],[data-count-choice]')){event.preventDefault();countTap(event,{x:0,y:0});}
  });
  const abacusColors=[['Red','#ff3b30'],['Orange','#ff9500'],['Yellow','#ffe500'],['Green','#35d44b'],['Blue','#2395ff'],['Indigo','#6454d9'],['Violet','#bb52ed'],['Pink','#ff8fc7'],['Brown','#b5794a'],['White','#ffffff']];
  const abacusWords=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
  const abacusCount=row=>state.abacusRows[row].filter(Boolean).length;
  const activeAbacusRow=()=>state.abacusSelectedRow??0;
  const abacusTotal=()=>state.abacusRows.reduce((sum,_,row)=>sum+abacusCount(row),0);
  function updateAbacusAddition(previewRow=-1,previewCount=0,live=false,root=scene){
    if(state.activity!=='abacus'||!state.abacusRows)return;
    const read=row=>row===previewRow?previewCount:abacusCount(row),total=state.abacusRows.reduce((sum,_,row)=>sum+read(row),0);
    root.querySelectorAll('[data-abacus-left]').forEach(node=>{const row=Number(node.dataset.abacusLeft),value=String(10-read(row));if(node.textContent!==value)node.textContent=value;});
    root.querySelectorAll('[data-abacus-right]').forEach(node=>{const row=Number(node.dataset.abacusRight),value=String(read(row));if(node.textContent!==value)node.textContent=value;});
    const box=root.querySelector('[data-abacus-total]');if(box)box.textContent=String(total);
    const equation=root.querySelector('[data-abacus-equation]');
    if(equation){
      const counts=state.abacusRows.map((_,row)=>read(row)).filter(n=>n>0),lines=equation.querySelectorAll('tspan');
      lines[0].textContent=counts.slice(0,5).join(' + ')||'0';lines[1].textContent=counts.length>5?'+ '+counts.slice(5).join(' + '):'';
      lines[0].setAttribute('y',counts.length>5?276:299);lines[1].setAttribute('y',320);
      equation.setAttribute('aria-label',counts.join(' + ')||'0');
      const font=Number(equation.dataset.fontSize);equation.setAttribute('font-size',font);
      const width=Math.max(...[...lines].map(line=>line.getComputedTextLength())),available=Number(equation.dataset.maxWidth);
      if(width>available)equation.setAttribute('font-size',font*available/width);
    }
    if(live)refreshSceneTextTabs([...scene.querySelectorAll(`[data-abacus-left="${previewRow}"],[data-abacus-right="${previewRow}"],[data-color-label="${previewRow}"],[data-abacus-equation],[data-abacus-total]`)]);
    else refreshSceneTextTabs();
  }
  function abacusHint(){const row=activeAbacusRow(),count=abacusCount(row),suggestion=state.age===null||state.level===1?'':state.level===2?` Together, try ${profile().abacusGoal} beads in any color.`:` Together, try ${profile().abacusGoal} beads, then another color. All amounts are welcome.`;hint(`${abacusColors[row][0]}: ${count} ${abacusWords[count]} on the right. Slide beads in any row, either way!${suggestion}`);}
  function abacusGeometry(){const width=Math.max(1000,600*scene.clientWidth/Math.max(1,scene.clientHeight)),left=width*.5,start=96,end=left-96,pitch=(end-start)*.048,r=Math.min(20,pitch*.46);return {width,left,start,end,pitch,r,ry:r*1.3};}
  const abacusY=row=>40+row*56;
  function abacusBeadPoint(row,index,g=abacusGeometry()){const count=abacusCount(row);return {x:index>=10-count?g.end-(9-index)*g.pitch:g.start+index*g.pitch,y:abacusY(row)};}
  function abacusLabel(row,count){return `${count} ${abacusWords[count]} ${abacusColors[row][0]}`;}
  /** Build the scene only on entry, reset or resize. Ordinary slides retain every bead node. */
  function renderAbacus(){
    if(state.activity!=='abacus'||!state.abacusRows)return;
    const g=abacusGeometry(),active=activeAbacusRow(),scale=600/Math.max(1,scene.clientHeight),font=Math.min(42,Math.max(20,14*scale));
    state.abacusSize=`${scene.clientWidth}/${scene.clientHeight}`;scene.setAttribute('viewBox',`0 0 ${g.width} 600`);scene.setAttribute('aria-label','Freely count abacus beads, rainbow and circle');
    const right=g.left+16,rw=g.width-right-12,radius=Math.min(204,rw*.32),cx=right+radius+6,base=214,circleR=Math.min(96,rw*.16),circleX=g.width-circleR-18,circleY=108,band=radius/10;
    const sumWidth=(rw-16)*.73,totalX=right+sumWidth+12,totalWidth=rw-sumWidth-16,sumFont=Math.min(34,Math.max(26,14*scale));
    const rainbow=abacusColors.slice(0,7).map(([name,color],i)=>{const outer=radius-i*band,inner=outer-band;return `<path data-rainbow-band="${i}" data-color-region="${i}" d="M${cx-outer} ${base}A${outer} ${outer} 0 0 1 ${cx+outer} ${base}L${cx+inner} ${base}A${inner} ${inner} 0 0 0 ${cx-inner} ${base}Z" fill="${abacusCount(i)?color:'none'}" stroke="#90969e" stroke-width="3"/>`;}).join('');
    const circles=[[7,'outer',circleR],[9,'middle',circleR*.68],[8,'inner',circleR*.35]].map(([row,region,r])=>`<circle data-circle-region="${region}" data-color-region="${row}" ${row===7?'mask="url(#abacus-pink-ring)"':row===9?'mask="url(#abacus-white-ring)"':''} cx="${circleX}" cy="${circleY}" r="${r}" fill="${abacusCount(row)?abacusColors[row][1]:'none'}" stroke="#90969e" stroke-width="3"/>`).join('');
    scene.innerHTML=`<defs><mask id="abacus-pink-ring"><rect width="${g.width}" height="600" fill="white"/><circle cx="${circleX}" cy="${circleY}" r="${circleR*.68}" fill="black"/></mask><mask id="abacus-white-ring"><rect width="${g.width}" height="600" fill="white"/><circle cx="${circleX}" cy="${circleY}" r="${circleR*.35}" fill="black"/></mask></defs><g id="abacus-frame"><rect data-abacus-board="" x="10" y="5" width="${g.left-24}" height="586" rx="18" fill="none" stroke="#bd9666" stroke-width="14"/>${abacusColors.map(([name,color],row)=>{const y=abacusY(row),count=abacusCount(row);return `<g data-abacus-row="${row}"><rect data-row-highlight="${row}" x="20" y="${y-25}" width="${g.left-44}" height="50" rx="12" fill="none" stroke="${row===active?'#ffe17a':'transparent'}" stroke-width="3"/><text data-abacus-left="${row}" x="42" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${font}" fill="#fff" font-weight="900">${10-count}</text><text data-abacus-right="${row}" x="${g.left-42}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${font}" fill="#fff" font-weight="900">${count}</text><path d="M${g.start-g.r} ${y}H${g.end+g.r}" stroke="#8f795d" stroke-width="5"/><ellipse data-abacus-start="${row}" cx="${g.start}" cy="${y}" rx="${g.r+2}" ry="${g.ry+2}" fill="none" stroke="#555" stroke-width="3" stroke-dasharray="5 5"/><ellipse data-abacus-destination="${row}" cx="${g.end}" cy="${y}" rx="${g.r+2}" ry="${g.ry+2}" fill="none" stroke="#777" stroke-width="3" stroke-dasharray="5 5"/>${state.abacusRows[row].map((moved,index)=>{const p=abacusBeadPoint(row,index,g);return `<g data-bead-row="${row}" data-bead-index="${index}" data-moved="${moved}" transform="translate(${p.x} ${p.y})" role="button" aria-label="${name} bead ${index+1}" aria-disabled="false" tabindex="${index===9-count||index===10-count?'0':'-1'}"><circle data-bead-body="" r="${g.r}" transform="scale(1 ${g.ry/g.r})" fill="${color}" stroke="#ffffffb0" stroke-width="1.5"/><path d="M${-g.r*.45} ${-g.ry*.48}L${g.r*.05} ${-g.ry*.7}" stroke="white" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/></g>`;}).join('')}</g>`;}).join('')}</g><path d="M${g.left} 12V588" stroke="#555" stroke-width="2"/><g id="rainbow-picture" role="img" aria-label="Rainbow bands fill with the colors counted">${rainbow}</g><g id="circle-picture" role="img" aria-label="Pink outer circle, white middle circle, brown center">${circles}</g><g id="abacus-addition"><g data-abacus-sum-cell=""><rect data-text-panel="abacus-sum" x="${right+4}" y="226" width="${sumWidth}" height="116" rx="13" fill="none" stroke="#a97e37" stroke-width="3"/><text class="scene-caption" data-label-for="abacus-sum-heading" x="${right+4+sumWidth/2}" y="240" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="800" fill="#213b38">SUM</text><text class="scene-caption" data-label-for="abacus-sum-value" data-abacus-equation x="${right+4+sumWidth/2}" y="299" text-anchor="middle" dominant-baseline="central" font-size="${sumFont}" data-font-size="${sumFont}" data-max-width="${sumWidth-28}" font-weight="900" fill="#334d47"><tspan x="${right+4+sumWidth/2}" y="299" dominant-baseline="central">0</tspan><tspan x="${right+4+sumWidth/2}" y="320" dominant-baseline="central"></tspan></text></g><g data-abacus-total-cell=""><rect data-text-panel="abacus-total" x="${totalX}" y="226" width="${totalWidth}" height="116" rx="13" fill="none" stroke="#71935c" stroke-width="3"/><text class="scene-caption" data-label-for="abacus-total-heading" x="${totalX+totalWidth/2}" y="240" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="800" fill="#213b38" data-abacus-total-caption="">TOTAL</text><text class="scene-caption" data-label-for="abacus-total-value" data-abacus-total x="${totalX+totalWidth/2}" y="299" text-anchor="middle" dominant-baseline="central" font-size="66" font-weight="900" fill="#155c4a">${abacusTotal()}</text></g></g><g id="abacus-labels"><rect data-text-panel="abacus-colours" data-abacus-label-panel x="${right+4}" y="346" width="${rw-8}" height="241" rx="17" fill="none" stroke="#a8adb4" stroke-width="4"/>${abacusColors.map(([name,color],row)=>`<text data-color-label="${row}" x="${right+20+(rw-8)*(row<5?0:.5)}" y="${346+241*((row%5)+.5)/5}" text-anchor="start" dominant-baseline="central" fill="${color}" stroke="#111820" stroke-width="${Math.max(1.2,font*.065)}" paint-order="stroke fill" stroke-linejoin="round" font-size="${font}" font-weight="900" font-family="inherit" style="--bead-ink:${color}">${abacusLabel(row,abacusCount(row))}</text>`).join('')}</g>`;
    state.abacusElements=abacusColors.map((_,row)=>({beads:[...scene.querySelectorAll(`[data-bead-row="${row}"]`)],region:scene.querySelector(`[data-color-region="${row}"]`),label:scene.querySelector(`[data-color-label="${row}"]`),count:scene.querySelector(`[data-row-count="${row}"]`),highlight:scene.querySelector(`[data-row-highlight="${row}"]`)}));
    updateAbacusProgress();updateAbacusFeedback(active);updateAbacusAddition();restoreObjectFeedback();
  }
  function updateAbacusFeedback(row,count=abacusCount(row),reveal=false){
    const nodes=state.abacusElements[row];if(!nodes)return;
    nodes.region.setAttribute('fill',count?abacusColors[row][1]:'none');if(nodes.count)nodes.count.textContent=String(count);nodes.label.textContent=abacusLabel(row,count);
    const live=state.pointer?.kind==='abacus'&&state.pointer.row===row;
    nodes.label.classList.toggle('abacus-pop',reveal);
    if(live){const chips=[...$('item-progress-strip').children];chips.forEach((chip,i)=>chip.classList.toggle('is-current',i===row));const chip=chips[row];if(chip){chip.querySelector('[data-abacus-chip-count]').textContent=String(count);chip.classList.toggle('is-done',count>0);}}
    else updateGameItemStrip();
    $('result-score').textContent=`${abacusColors[row][0]}: ${count} ${abacusWords[count]}`;
    state.abacusElements.forEach((item,i)=>item.highlight.setAttribute('stroke',i===row?'#ffe17a':'transparent'));updateAbacusAddition(row,count,live);
  }
  function restoreAbacusRow(row){const g=abacusGeometry(),count=abacusCount(row);state.abacusElements[row].beads.forEach((node,index)=>{const p=abacusBeadPoint(row,index,g);node.setAttribute('transform',`translate(${p.x} ${p.y})`);node.dataset.moved=String(index>=10-count);node.setAttribute('tabindex',index===9-count||index===10-count?'0':'-1');});}
  function updateAbacusProgress(){progress(state.abacusRows.filter((_,row)=>abacusCount(row)>0).length,10);updateGameItemStrip();}
  function setAbacusCount(row,count){
    const previous=abacusCount(row);state.abacusSelectedRow=row;
    if(previous===count){restoreAbacusRow(row);updateAbacusFeedback(row);return;}
    state.abacusRows[row]=Array.from({length:10},(_,index)=>index>=10-count);
    restoreAbacusRow(row);popObject(state.abacusElements[row].beads[Math.min(9,Math.max(0,10-count))],'bead');updateAbacusProgress();updateAbacusFeedback(row,count,!previous&&!!count);tone(520+count*20);
    // The rainbow and circle monitor the freely movable beads; they do not end a game.
    abacusHint();
  }
  function finishAbacusBead(row,index,toRight=true){const count=abacusCount(row);setAbacusCount(row,toRight?Math.max(count,10-index):Math.min(count,9-index));}
  function beginAbacusSlide(point,id){
    if(objectFeedback?.kind==='bead'){clearObjectFeedback();updateGameItemStrip();$('show-me').disabled=countHolding||!gameReady();}
    const g=abacusGeometry(),row=Math.round((point.y-40)/56);if(row<0||row>9||Math.abs(point.y-abacusY(row))>27)return null;
    const positions=Array.from({length:10},(_,index)=>abacusBeadPoint(row,index,g).x);
    let index=0;for(let i=1;i<10;i++)if(Math.abs(positions[i]-point.x)<Math.abs(positions[index]-point.x))index=i;
    if(Math.abs(positions[index]-point.x)>Math.max(24,g.pitch*.8))return null;
    state.abacusSelectedRow=row;updateAbacusFeedback(row);
    return {id,kind:'abacus',row,index,g,matrix:scene.getScreenCTM().inverse(),x:positions[index],y:abacusY(row),dx:point.x-positions[index],positions,drawn:[...positions],original:abacusCount(row),preview:abacusCount(row),right:!state.abacusRows[row][index],elements:state.abacusElements[row].beads,feedbackFrame:0};
  }
  /** Push neighbouring beads without passing them; cache geometry and nodes for the whole gesture. */
  function moveAbacusSlide(pointer,point){
    const {g,index}=pointer,left=g.start+index*g.pitch,right=g.end-(9-index)*g.pitch;
    pointer.x=Math.max(left,Math.min(right,point.x-pointer.dx));
    pointer.elements.forEach((node,i)=>{const x=i>index?Math.max(pointer.positions[i],pointer.x+(i-index)*g.pitch):i<index?Math.min(pointer.positions[i],pointer.x-(index-i)*g.pitch):pointer.x;if(x!==pointer.drawn[i]){node.setAttribute('transform',`translate(${x} ${pointer.y})`);pointer.drawn[i]=x;}});
    const across=pointer.right?pointer.x>=(left+right)/2:pointer.x<=(left+right)/2;
    const count=across?(pointer.right?10-index:9-index):pointer.original;
    if(count!==pointer.preview){pointer.preview=count;if(state.pointer===pointer&&!pointer.feedbackFrame)pointer.feedbackFrame=requestAnimationFrame(()=>{pointer.feedbackFrame=0;if(state.pointer===pointer)updateAbacusFeedback(pointer.row,pointer.preview);});}
  }
  new ResizeObserver(()=>refreshSceneTextTabs()).observe(scene);
  new ResizeObserver(()=>{if(state.activity==='abacus'&&state.age===5&&state.abacusSize!==`${scene.clientWidth}/${scene.clientHeight}`){cancelGesture();renderAbacus();}}).observe(scene);
  new ResizeObserver(()=>{if(state.activity==='abacus'&&state.age===4&&state.trainSize!==`${scene.clientWidth}/${scene.clientHeight}`){stopDemo();cancelGesture();renderCountAdventure();}}).observe(scene);
  function shadeColor(hex,amount){
    return '#'+[1,3,5].map(i=>{const value=parseInt(hex.slice(i,i+2),16);return Math.round(amount>0?value+(255-value)*amount:value*(1+amount)).toString(16).padStart(2,'0');}).join('');
  }
  let thumbGlossSerial=0;
  function glossThumbnails(root,force=false){
    for(const svg of root.querySelectorAll('svg')){
      if(svg.dataset.glossyThumb&&!force)continue;
      svg.querySelector('[data-thumb-gloss]')?.remove();
      const defs=document.createElementNS(scene.namespaceURI,'defs'),gradients=new Map();defs.dataset.thumbGloss='';
      for(const node of svg.querySelectorAll('[fill]')){
        if(node.closest('defs')||node.tagName.toLowerCase()==='text'||node.querySelector('text'))continue;
        const color=node.dataset.thumbFill||node.getAttribute('fill');if(!/^#[0-9a-f]{6}$/i.test(color))continue;
        const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),average=channels.reduce((a,b)=>a+b,0)/3;if(average<50||average>245)continue;
        if(!gradients.has(color)){
          const id='thumb-gloss-'+(++thumbGlossSerial),gradient=document.createElementNS(scene.namespaceURI,'linearGradient');gradient.id=id;gradient.setAttribute('x2','.25');gradient.setAttribute('y2','1');
          gradient.innerHTML=`<stop stop-color="${shadeColor(color,.48)}"/><stop offset=".38" stop-color="${shadeColor(color,.18)}"/><stop offset=".44" stop-color="${color}"/><stop offset="1" stop-color="${shadeColor(color,-.15)}"/>`;defs.appendChild(gradient);gradients.set(color,id);
        }
        node.dataset.thumbFill=color;node.setAttribute('fill',`url(#${gradients.get(color)})`);
      }
      if(gradients.size)svg.prepend(defs);svg.dataset.glossyThumb='true';
    }
  }
  // Shared, game-specific progress strip. Never moves to a side in immersive mode.
  function showItemStrip(items){
    const strip=$('item-progress-strip');if(!strip)return;
    strip.setAttribute('aria-label','Available items and completion status');
    strip.hidden=!state.activity||!items.length;
    if(strip.hidden){strip.innerHTML='';return;}

    // Every item gets a column in the fitted row, including the Demo copy.
    strip.style.setProperty('--thumb-count',String(items.length));
    strip.innerHTML=items.map(({label,icon='',current=false,done=false,later=false},i)=>{
      const safe=String(label).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
      if(state.activity==='brush')return `<button type="button" class="item-chip brush-choice ${current?'is-current':''} ${done?'is-done':''}" data-brush-choice="${i}" aria-label="Select ${safe} drawing${done?', completed':''}" aria-pressed="${current}" title="Tap to draw ${safe}">${icon||safe}</button>`;
      return `<span class="item-chip ${current?'is-current':''} ${done?'is-done':''} ${later?'is-later':''}" role="listitem" aria-label="${safe} ${done?'completed':current?'current':later?'later level':'available'}" title="${safe}">${icon||safe}</span>`;
    }).join('');
    glossThumbnails(strip);
    strip.scrollLeft=0;

  }
  // The shared visible strip replaces the hidden legacy brush thumbnail row.
  // Handle manual choice in both Brush Clean and Finger Paint modes.
  $('item-progress-strip').addEventListener('click',event=>{
    const button=event.target.closest('[data-brush-choice]');
    if(!button||state.activity!=='brush')return;
    const index=Number(button.dataset.brushChoice);
    if(!Number.isInteger(index)||index<0||index>=brushCount())return;
    brushIndex=index;
    resetRound();
    hint(`Selected ${artPicture().name}. ${state.paintMode?'Choose a color and paint inside the lines!':'Brush away the dirt to reveal the colors!'}`);
    popObject($('item-progress-strip').querySelector(`[data-brush-choice="${index}"]`),'drawing');
  });
  function updateGameItemStrip(){
    if(state.activity==='puzzle'){picturePuzzle.syncStrip();return;}
    if(objectFeedback)return;
    if(state.activity==='drag'){
      const limit=shapeLevelLimits[state.age]||4;
      showItemStrip(shapes.slice(0,limit).map((shape,i)=>({label:shape.id,icon:`<svg viewBox="-68 -68 136 136" aria-hidden="true">${primitive(shape.id,shape.color,'#274b44')}</svg>`,later:i>=limit,done:!!state.shapes?.find(x=>x.id===shape.id&&x.placed),current:state.selected===shape.id})));
    }else if(state.activity==='bubbles'){
      if(state.bubbleMode==='plain'){
        showItemStrip(Array.from({length:plainGoal()},(_,i)=>({label:`Pop ${i+1}`,icon:String(i+1),done:i<state.bubblePops,current:i===state.bubblePops&&!state.done})));
      }else{
        const tokens=bubbleItems();showItemStrip(tokens.map(token=>({label:String(token),done:state.bubbleHits.has(token),current:!state.bubbleHits.has(token)&&token===tokens.find(t=>!state.bubbleHits.has(t)),icon:state.bubbleMode==='shapes'?`<svg viewBox="-68 -68 136 136" aria-hidden="true">${primitive(token,shapeById(token)?.color||'#ffcf64','#274b44')}</svg>`:''})));
      }
    }else if(state.activity==='brush'){
      showItemStrip(brushPictures.slice(0,brushCount()).map(([name,region],i)=>({label:name,icon:`<svg viewBox="250 55 500 345" aria-hidden="true"><g fill="${brushThumbColor(name)}" stroke="#45675d" stroke-width="10">${region}</g></svg>`,current:i===brushIndex,done:brushFinished.has(i)})));
    }else if(state.activity==='slide'){
      showItemStrip(slideObjects.slice(0,slideTotal()).map(([name,emoji],i)=>({label:`Room ${i+1}: ${name}`,icon:`<span class="item-emoji">${emoji}</span><small class="item-index">${i+1}</small>`,current:i===state.slideIndex,done:i<state.slideIndex||(i===state.slideIndex&&state.slideRevealed)})));
    }else if(state.activity==='abacus'&&state.age!==5){
      showItemStrip(Array.from({length:countMax()},(_,i)=>({label:`Count ${i+1}`,icon:String(i+1),done:i<countStage,current:i===countStage,later:state.age<4&&i>countStage})));
    }else if(state.activity==='abacus'){
      showItemStrip(abacusColors.map(([name,color],i)=>({label:name,icon:`<span class="abacus-chip-label">${name}</span><span class="abacus-chip-value"><i class="abacus-thumb-bead" style="--bead:${color};color:${color}" aria-hidden="true">●</i> <b data-abacus-chip-count="">${abacusCount(i)}</b></span>`,current:i===state.abacusSelectedRow,done:abacusCount(i)>0})));
    }else showItemStrip([]);
  }
  function renderDrag(){
    scene.setAttribute('viewBox','0 77 1000 363');
    const pool=shapes.slice(0,shapeLevelLimits[state.age]||4);
    const done=state.shapes.filter(shape=>shape.placed).length;
    // Show only shapes available for this age. The shared progress strip is the visible chart.
    const thumbnails=shapes.slice(0,pool.length).map((shape,i)=>{
      const x=28+i*49.6,active=i<pool.length;
      const inBatch=state.shapes.some(item=>item.id===shape.id);
      return `<g transform="translate(${x} 37)" opacity="${active?1:.34}" aria-label="${shape.id}">
        ${inBatch?'<rect x="-23" y="-27" width="46" height="51" rx="8" fill="#fff5da" stroke="#93784f" stroke-width="2"/>':''}
        <g transform="scale(.28)">${glossyShape(shape.id,shape.color)}</g>
        <title>${shape.id}</title></g>`;
    }).join('');
    const board=`${shapeEffects}
      <defs><linearGradient id="sanaWood" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c9863e"/><stop offset=".55" stop-color="#aa642d"/><stop offset="1" stop-color="#8f4d22"/></linearGradient></defs>
      <rect x="4" y="77" width="992" height="360" rx="18" fill="#6c3c1f" stroke="#f3d49b" stroke-width="5"/>
      <rect x="12" y="85" width="976" height="344" rx="13" fill="url(#sanaWood)"/>
      <path d="M12 253H988" stroke="#71401f" stroke-width="7" opacity=".65"/>
      <path d="M500 105V419" stroke="#ffe2aa" stroke-width="3" stroke-dasharray="8 13" opacity=".75"/>
      <path d="M466 260H530M516 248L530 260L516 272" stroke="#fff0c8" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    scene.innerHTML=`<rect x="0" y="0" width="1000" height="76" fill="#f7e9d2"/>${board}`+
      state.shapes.map(shape=>`<g class="target" ${shape.placed?`data-pocket-filled="${shape.id}" role="img" aria-label="${shape.id} fitted into its pocket"`:`data-target="${shape.id}" role="button" tabindex="0" aria-label="${shape.id} shadow"`} transform="translate(${shape.tx} ${shape.ty})">
      <g>${shape.placed?glossyShape(shape.id,shape.color):primitive(shape.id,'#271d19',shape.color)}</g>
      <text y="86" text-anchor="middle" fill="#163d33" font-size="28" font-weight="900" paint-order="stroke" stroke="#fff9e8" stroke-width="4" font-family="inherit">${shape.id.toUpperCase()}</text></g>`).join('')+
      state.shapes.filter(shape=>!shape.placed).map(shape=>`<g data-piece="${shape.id}" role="button" tabindex="0" aria-label="${shape.id} shape" class="piece ${state.selected===shape.id?'selected':''}" transform="translate(${shape.x} ${shape.y})">
      ${glossyShape(shape.id,shape.color)}</g>`).join('');
    progress(shapeCompleted+done,pool.length);updateGameItemStrip();prepareSceneArt();
  }
  function matchShape(id){
    const shape=state.shapes.find(item=>item.id===id);if(!shape||shape.placed)return;
    releaseHeldObject();
    scene.querySelector(`[data-piece="${id}"]`)?.setAttribute('transform',`translate(${shape.tx} ${shape.ty})`);
    popObject(scene.querySelector(`[data-piece="${id}"]`),'shape');
    shape.placed=true;state.selected=null;renderDrag();tone(640);
    if(state.shapes.every(item=>item.placed)){
      const total=shapeLevelLimits[state.age]||4;
      shapeCompleted+=state.shapes.length;
      if(shapeCompleted>=total){
        celebrate(`Wonderful! You matched all ${total} shapes. Let's play again!`);scheduleNextRound();
        shapeRound=0;shapeCompleted=0;
      }else{
        hint('Great matching! Here come four new shapes.');
        scheduleNextRound(()=>{shapeRound++;});
      }
    }else hint('A perfect fit! Find another little shape.');
  }
  const activeBubble=()=>state.bubbles.find(bubble=>!bubble.popping&&bubble.element?.dataset.onstage==='true');
  function stopBubbles(){
    if(bubbleFrame!==null)cancelAnimationFrame(bubbleFrame);bubbleFrame=null;lastBubbleTime=0;
    for(const bubble of state.bubbles){clearTimeout(bubble.popTimer);bubble.popTimer=null;bubble.popping=false;const visual=bubble.element?.querySelector('[data-balloon-visual]');visual?.classList.remove('balloon-growing');visual?.removeAttribute('data-object-feedback');bubble.element?.removeAttribute('aria-disabled');}
    $('show-me').disabled=countHolding||!!objectFeedback||!gameReady();
  }
  function bubbleTracker(){
    if(objectFeedback)return;
    const mode={...bubbleModes[state.bubbleMode],items:bubbleItems()};
    if(state.bubbleMode==='numbers')mode.label=`1–${mode.items.length}`;else if(state.bubbleMode==='letters')mode.label=`A–${mode.items.at(-1)}`;
    $('bubble-score').textContent=state.bubbleMode==='plain'?`Popped ${Math.min(state.bubblePops,plainGoal())}/${plainGoal()}`:`${mode.label} · ${state.bubbleHits.size}/${mode.items.length}`;
    $('bubble-targets').innerHTML=mode.items.length?mode.items.map(token=>{
      const color=state.bubbleHits.get(token);
      // These flat thumbnails need no filters. Hidden duplicate filter IDs here
      // took precedence over Drag's visible definitions and made its pieces blank.
      const content=state.bubbleMode==='shapes'?`<svg viewBox="-68 -68 136 136" aria-hidden="true">${primitive(token,shapeById(token)?.color||'#ffcf64','#274b44')}</svg>`:token;
      return `<span class="bubble-target" role="listitem" data-bubble-target="${token}" data-collected="${!!color}" style="${color?`background-color:${color}`:''}" aria-label="${token}${color?' popped':' not popped'}">${content}</span>`;
    }).join(''):state.bubbleRecent.map(color=>`<i class="pop-dot" style="background:${color}" aria-hidden="true"></i>`).join('');
    updateGameItemStrip();
    if(state.bubbleMode==='plain')progress(Math.min(state.bubblePops,plainGoal()),plainGoal());
    document.querySelectorAll('[data-bubble-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleMode===state.bubbleMode)));
    const numbers=bubbleItems('numbers'),letters=bubbleItems('letters');document.querySelector('[data-bubble-mode="numbers"]').textContent=`1–${numbers.length}`;document.querySelector('[data-bubble-mode="letters"]').textContent=`A–${letters.at(-1)}`;
    $('bubble-full-set').hidden=state.age===null;$('bubble-full-set').setAttribute('aria-pressed',String(state.bubbleSet==='full'));
  }
  function fitBubbleField(){
    if(!app.classList.contains('immersive'))state.bubbleNormalHeight=Math.max(1,scene.clientHeight);
    const width=Math.max(1,440*scene.clientWidth/Math.max(1,scene.clientHeight));
    if(Math.abs(width-state.bubbleWidth)>.5){
      state.bubbleWidth=width;
    }
    if(Math.abs(scene.viewBox.baseVal.width-width)>.5)scene.setAttribute('viewBox',`0 0 ${width.toFixed(1)} 440`);
    const radius=bubbleRadius();
    state.bubbles.forEach(bubble=>{if(bubble.element&&Math.abs(bubble.r-radius)>.1){bubble.r=radius;drawBubble(bubble);positionBubble(bubble);}});
    syncBubbleSlots();
  }
  function updateBubbleSettings(){
    document.querySelectorAll('[data-bubble-speed]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleSpeed===selectedBubbleSpeed())));
    document.querySelectorAll('[data-bubble-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleSize===selectedBubbleSize())));
  }
  // Fit several travelling rows into the field, including each balloon's string.
  // Keep the three size choices distinct even in the short, normal phone layout.
  function bubbleRadius(){
    const height=Math.max(1,scene.clientHeight),scale=(state.bubbleNormalHeight||height)/height;
    const desired=bubbleDiameters[selectedBubbleSize()]*220/height;
    // SVG units grow on expansion. Scale the cap back so the visible diameter
    // stays the same; extra fullscreen space supplies more rows, not larger bodies.
    return Math.max(2,Math.min(({small:50,medium:66,large:84})[selectedBubbleSize()]*scale*1.2,desired*1.2,state.bubbleWidth*.44));
  }
  function bubbleLayout(){
    const radius=bubbleRadius(),scale=(state.bubbleNormalHeight||scene.clientHeight)/Math.max(1,scene.clientHeight),gap=Math.max(16*scale,radius*.2);
    const columns=Math.max(1,Math.min(8,Math.floor((state.bubbleWidth-8+gap)/(radius*2+gap))));
    // The string ends 1.49 radii below its centre; leave clearance before the next body.
    const pitch=radius*2.5+gap,rows=Math.ceil(440/pitch)+1;
    return {radius,columns,pitch,rows};
  }
  function bubbleWaveOffset(column,layout){
    // Two gentle troughs form a W across the available lanes. Every lane keeps
    // its existing horizontal clearance, row pitch and upward speed.
    return layout.pitch*.3*(1-Math.cos(4*Math.PI*column/Math.max(4,layout.columns-1)))/2;
  }
  function syncBubbleSlots(){
    const layer=$('bubble-layer');if(!layer||!state.bubbles)return;
    const layout=bubbleLayout(),key=`${state.bubbleWidth.toFixed(1)}/${layout.radius.toFixed(1)}/${layout.columns}`;
    if(state.bubbleLayoutKey===key)return;
    state.bubbleLayoutKey=key;state.bubbleLayout=layout;
    const count=layout.columns*layout.rows;
    while(state.bubbles.length>count){const bubble=state.bubbles.pop();bubble.element?.remove();}
    while(state.bubbles.length<count)state.bubbles.push({slot:state.bubbles.length,element:null});
    state.bubbles.forEach((bubble,index)=>{
      bubble.slot=index;
      // Reflow only when geometry changes. Collection progress and retained nodes survive.
      bubble.x=(index%layout.columns+.5)*state.bubbleWidth/layout.columns;
      bubble.y=layout.radius+8+Math.floor(index/layout.columns)*layout.pitch+bubbleWaveOffset(index%layout.columns,layout);
      if(bubble.element)positionBubble(bubble);else spawnBubble(bubble,true);
    });
  }
  function positionBubble(bubble){
    if(!bubble.element)return;
    bubble.x=Math.max(bubble.r+4,Math.min(state.bubbleWidth-bubble.r-4,bubble.x));
    bubble.element.setAttribute('transform',`translate(${bubble.x.toFixed(1)} ${bubble.y.toFixed(1)})`);
    const onstage=!bubble.popping&&bubble.y>=bubble.r&&bubble.y<=440-bubble.r;
    if(bubble.element.dataset.onstage!==String(onstage)){
      bubble.element.dataset.onstage=String(onstage);bubble.element.setAttribute('tabindex',onstage?'0':'-1');bubble.element.setAttribute('aria-hidden',String(!onstage));
    }
  }
  function spawnBubble(bubble,initial=false){
    const layout=state.bubbleLayout,column=bubble.slot%layout.columns;
    const wave=bubbleWaveOffset(column,layout),entry=440-layout.radius*.6+wave;
    // A new row follows the lowest balloon in its lane, rather than waiting for
    // that lane's only balloon to leave the top. Popping cannot stack replacements.
    const lowest=Math.max(-Infinity,...state.bubbles.filter(other=>other!==bubble&&other.element&&other.slot%layout.columns===column).map(other=>other.y));
    if(!initial&&lowest>entry){bubble.wait=0;return;}
    const items=bubbleItems();
    const missing=items.filter(token=>!state.bubbleHits.has(token));
    const available=(missing.length?missing:items).filter(token=>!state.bubbles.some(other=>other!==bubble&&other.element&&other.token===token));
    const pool=available.length?available:missing.length?missing:items;
    bubble.token=pool.length?pool[Math.floor(Math.random()*pool.length)]:'';
    bubble.id=++state.bubbleSerial;bubble.color=bubbleColors[Math.floor(Math.random()*bubbleColors.length)];bubble.r=bubbleRadius();
    bubble.x=(column+.5)*state.bubbleWidth/layout.columns;
    bubble.y=initial?layout.radius+8+Math.floor(bubble.slot/layout.columns)*layout.pitch+wave:Math.max(entry,lowest+layout.pitch);bubble.wait=0;
    const element=document.createElementNS('http://www.w3.org/2000/svg','g');bubble.element=element;
    element.classList.add('bubble');element.dataset.bubble=String(bubble.id);element.dataset.token=bubble.token;element.dataset.color=bubble.color;
    element.setAttribute('role','button');element.setAttribute('aria-label',`Pop ${bubble.token||'plain'} bubble`);
    drawBubble(bubble);
    $('bubble-layer').appendChild(element);positionBubble(bubble);
  }
  function drawBubble(bubble){
    const content=state.bubbleMode==='plain'?`<g transform="scale(${bubble.r/68})">${face(0,8)}</g>`:state.bubbleMode==='shapes'?`<g transform="scale(${bubble.r/95})">${primitive(bubble.token,shapeById(bubble.token)?.color||'#ffcf64','#274b44')}</g>`:`<text text-anchor="middle" dominant-baseline="central" font-family="inherit" font-size="${bubble.r*(bubble.token.length===2?.9:1.1)}" font-weight="900" fill="#29463e">${bubble.token}</text>`;
    bubble.element.innerHTML=`<circle data-balloon-body="" r="${bubble.r}" fill="${bubble.color}" stroke="#fffdf3" stroke-width="${bubble.r*.025}"/><circle r="${bubble.r}" fill="url(#balloon-shade)" pointer-events="none"/><ellipse data-balloon-shine="" cx="${-bubble.r*.3}" cy="${-bubble.r*.35}" rx="${bubble.r*.2}" ry="${bubble.r*.32}" transform="rotate(32)" fill="white" opacity=".55" pointer-events="none"/><path data-balloon-knot="" d="M0 ${bubble.r-2}l${-bubble.r*.1} ${bubble.r*.16}q${bubble.r*.1} ${-bubble.r*.05} ${bubble.r*.2} 0Z" fill="${bubble.color}" stroke="#52676e" stroke-width="1.5"/><path d="M0 ${bubble.r*1.13}q${-bubble.r*.13} ${bubble.r*.1} 0 ${bubble.r*.2}t0 ${bubble.r*.16}" fill="none" stroke="#fff8df" stroke-width="${Math.max(1.5,bubble.r*.016)}" pointer-events="none"/>${content}`;
    const visual=document.createElementNS(bubble.element.namespaceURI,'g');visual.dataset.balloonVisual='';visual.append(...bubble.element.childNodes);bubble.element.appendChild(visual);
    if(bubble.popping){visual.classList.add('balloon-growing');visual.dataset.objectFeedback='balloon';}
  }
  function renderBubbles(){
    state.bubbleHits=new Map();state.bubblePops=0;state.bubbleRecent=[];state.bubbleEffects=[];
    state.bubbles=[];state.bubbleLayoutKey=null;bubbleTracker();
    scene.innerHTML='<defs><radialGradient id="balloon-shade" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="white" stop-opacity=".35"/><stop offset=".5" stop-color="white" stop-opacity="0"/><stop offset=".8" stop-color="#25334b" stop-opacity=".14"/><stop offset="1" stop-color="#192339" stop-opacity=".4"/></radialGradient></defs><g id="bubble-layer"></g><g id="splash-layer" pointer-events="none"></g>';scene.setAttribute('aria-label','Rising balloons');
    fitBubbleField();progress(0,0);bubbleFrame=requestAnimationFrame(bubbleTick);
  }
  function bubbleTick(now){
    if(state.activity!=='bubbles'||document.hidden){bubbleFrame=null;return;}
    bubbleFrame=requestAnimationFrame(bubbleTick);
    if(demoActive){lastBubbleTime=now;return;}
    const elapsed=lastBubbleTime?Math.min(.05,(now-lastBubbleTime)/1000):0;lastBubbleTime=now;
    fitBubbleField();
    for(const bubble of state.bubbles){
      if(bubble.popping)continue;
      if(!bubble.element){bubble.wait-=elapsed;if(bubble.wait<=0)spawnBubble(bubble);continue;}
      bubble.y-=elapsed*bubbleSpeeds[selectedBubbleSpeed()];
      if(bubble.y < -bubble.r*1.5){bubble.element.remove();bubble.element=null;bubble.wait=0;spawnBubble(bubble);}
      positionBubble(bubble);
    }
    for(const splash of state.bubbleEffects){
      splash.age+=elapsed;const t=Math.min(1,splash.age/.48);splash.element.setAttribute('opacity',1-t);
      splash.drops.forEach((drop,i)=>{const angle=i*Math.PI/4;drop.setAttribute('cx',Math.cos(angle)*splash.radius*t);drop.setAttribute('cy',Math.sin(angle)*splash.radius*t+12*t*t);drop.setAttribute('r',9*(1-t)+1);});
      if(t===1)splash.element.remove();
    }
    state.bubbleEffects=state.bubbleEffects.filter(splash=>splash.age<.48);
  }
  function popBubble(bubble){
    if(!bubble?.element||bubble.popping||state.done)return;
    bubble.popping=true;const element=bubble.element,serial=roundSerial;
    const visual=element.querySelector('[data-balloon-visual]');visual.classList.add('balloon-growing');visual.dataset.objectFeedback='balloon';element.setAttribute('aria-disabled','true');positionBubble(bubble);$('show-me').disabled=true;
    bubble.popTimer=setTimeout(()=>{
      bubble.popTimer=null;
      if(serial!==roundSerial||state.activity!=='bubbles'||bubble.element!==element)return;
      bubble.popping=false;
      if(state.done){visual.classList.remove('balloon-growing');visual.removeAttribute('data-object-feedback');element.removeAttribute('aria-disabled');positionBubble(bubble);$('show-me').disabled=state.bubbles.some(b=>b.popping)||!gameReady();return;}
      finishBubblePop(bubble);
      $('show-me').disabled=state.bubbles.some(b=>b.popping)||!gameReady();
    },OBJECT_FEEDBACK_MS);
  }
  function finishBubblePop(bubble){
    const focused=document.activeElement===bubble.element;
    const splash=document.createElementNS('http://www.w3.org/2000/svg','g');splash.dataset.splash='';splash.setAttribute('transform',`translate(${bubble.x} ${bubble.y})`);splash.setAttribute('fill',bubble.color);
    splash.innerHTML=Array.from({length:8},()=>'<circle r="9"/>').join('');$('splash-layer').appendChild(splash);
    state.bubbleEffects.push({element:splash,drops:[...splash.children],age:0,radius:bubble.r*.85});
    bubble.element.remove();bubble.element=null;bubble.wait=.05;state.bubblePops++;state.bubbleRecent=[...state.bubbleRecent.slice(-7),bubble.color];
    if(bubble.token)state.bubbleHits.set(bubble.token,bubble.color);bubbleTracker();tone(450+(bubble.id%8)*55);
    if(focused)activeBubble()?.element.focus();
    if(state.bubbleMode==='plain'){
      if(state.bubblePops>=plainGoal()&&!state.done){
        celebrate(`SaNa says hooray! You popped all ${plainGoal()} bubbles!`);
        scheduleNextRound();
      }else if(!state.done)hint(`Splash, pop! ${state.bubblePops} of ${plainGoal()} bubbles popped. Keep going!`);
    }else if(state.bubbleHits.size===bubbleItems().length&&!state.done){
      celebrate(`SaNa says hooray! You found all the ${state.bubbleMode==='numbers'?'numbers':state.bubbleMode==='letters'?'letters':'shapes'}. Keep popping!`);scheduleNextRound();
    }else if(!state.done)hint(`Splash! ${bubble.token} is now the same color above. Keep looking!`);
  }

  // Slide Cave: one full-size door at a time; the age is a parent-selected level, not a restriction.
  const slideObjects=[
    ['Apple','🍎'],['Star','⭐'],['Car','🚙'],['Puppy','🐶'],
    ['Fox','🦊'],['Sun','☀️'],['Heart','❤️'],['Tree','🌳'],
    ['Butterfly','🦋'],['Moon','🌙'],['Strawberry','🍓'],['Elephant','🐘'],
    ['Panda','🐼'],['Pizza','🍕'],['Rocket','🚀'],['Flower','🌸']
  ];
  const slideLimits={2:4,3:8,4:12,5:16};
  let slideAdvanceTimer=0;
  const slideTotal=()=>slideLimits[state.age]||16;
  let slideDoorAnimating=false;
  const slideActionText=open=>open?'SLIDE TO CLOSE':'SLIDE TO OPEN';
  const slidePeekText=open=>open?'🐵 SaNa':'🙈 SaNa';
  function setSlideCue(root,open){
    const action=root.querySelector('[data-slide-door-action]');if(action){const font=open?23:38;action.textContent=slideActionText(open);action.setAttribute('x',open?890:500);action.setAttribute('font-size',font);action.dataset.captionFont=String(font);}
    const peek=root.querySelector('[data-slide-peek]');if(peek){peek.setAttribute('aria-pressed',String(open));peek.setAttribute('aria-label',open?'SaNa peek-a-boo: close the door':'SaNa peek-a-boo: open the door');peek.querySelector('text').textContent=slidePeekText(open);}
  }
  function renderSlide(){
    if(state.activity!=='slide')return;
    const item=slideObjects[state.slideIndex],opened=state.slideRevealed;
    scene.setAttribute('viewBox','0 0 1000 480');
    scene.setAttribute('aria-label',`Cave door ${state.slideIndex+1} of ${slideTotal()}: ${item[0]}`);
    scene.innerHTML=`<defs><linearGradient id="caveDoor" x2="1" y2="1"><stop stop-color="#e7a94c"/><stop offset=".5" stop-color="#a85a24"/><stop offset="1" stop-color="#75421f"/></linearGradient><radialGradient id="glassKnob" cx=".25" cy=".2" r=".8"><stop stop-color="#fff"/><stop offset=".3" stop-color="#9de9ff"/><stop offset=".7" stop-color="#478cda"/><stop offset="1" stop-color="#284777"/></radialGradient></defs>
      <rect x="205" y="22" width="590" height="386" rx="165" fill="#35203c" stroke="#f4cf77" stroke-width="14"/>
      <rect x="232" y="42" width="536" height="344" rx="145" fill="#050505" stroke="#d7a657" stroke-width="7"/>
      <g data-cave-object="" aria-label="${item[0]}" role="img"><text x="500" y="238" font-size="145" text-anchor="middle">${item[1]}</text><text x="500" y="330" font-size="46" font-weight="900" text-anchor="middle" fill="#ffffff" stroke="#101010" stroke-width="1">${item[0]}</text></g>
      <g data-cave-door="1" transform="translate(${opened?720:0} 0) scale(${opened?.34:1} 1)" >
        <rect x="205" y="22" width="590" height="386" rx="165" fill="url(#caveDoor)" stroke="#f8d38c" stroke-width="13"/>
        ${Array.from({length:6},(_,i)=>`<path d="M${250+i*90} 75V375" stroke="#7a401d" stroke-width="9" opacity=".55"/>`).join('')}
        <circle cx="715" cy="345" r="24" fill="url(#glassKnob)" stroke="#f5d992" stroke-width="6"/>
      </g>
      <text class="scene-caption" data-slide-door-action="" data-label-for="slide-door-action" x="${opened?890:500}" y="162" font-size="${opened?23:38}" font-weight="900" text-anchor="middle" fill="#173e35" pointer-events="none">${slideActionText(opened)}</text>
      <rect data-slide-swipe="1" x="150" y="16" width="840" height="395" fill="transparent" role="button" tabindex="0" aria-label="${opened?'Slide door closed to continue':'Slide door open to reveal '+item[0]}"/>
      <rect data-text-panel="slide-caption" x="250" y="365" width="500" height="62" rx="26" fill="none" stroke="#9c7140" stroke-width="3" pointer-events="none"/>
      <text class="scene-caption" data-label-for="slide-caption" data-slide-caption="" x="500" y="382" text-anchor="middle" dominant-baseline="central" font-size="27" font-weight="900" fill="#214b3e" pointer-events="none">${opened?'Door OPEN · Slide left to close ←':'Door CLOSED · Slide right to open →'}</text>
      <g data-slide-peek="" role="button" tabindex="0" aria-pressed="${opened}" aria-label="SaNa peek-a-boo: ${opened?'close':'open'} the door" style="cursor:pointer"><text class="scene-caption" data-label-for="slide-peek" x="500" y="444" text-anchor="middle" dominant-baseline="central" font-size="48" fill="#173e35">${slidePeekText(opened)}</text></g>`;
    progress(state.slideIndex+(opened?1:0),slideTotal());updateGameItemStrip();
    $('activity-name').textContent=`Cave Maze · Room ${state.slideIndex+1}/${slideTotal()}`;
    if(opened)hint(`SaNa says: ${item[0].toUpperCase()}! Slide the door closed for the next picture.`);
    else hint(`Room ${state.slideIndex+1} of ${slideTotal()}. Slide the big door to discover a picture!`);
    prepareSceneArt();
  }
  function moveCaveDoor(open){
    if(state.activity!=='slide'||slideDoorAnimating||state.slideRevealed===open)return;
    const door=scene.querySelector('[data-cave-door]');
    if(!door)return;
    slideDoorAnimating=true;
    // Animate in place; do not rebuild the image or door during the gesture.
    door.style.transition='transform 360ms ease-in-out';
    door.setAttribute('transform',open?'translate(720 0) scale(.34 1)':'translate(0 0) scale(1 1)');
    const serial=roundSerial;
    slideAdvanceTimer=window.setTimeout(()=>{
      slideDoorAnimating=false;
      if(state.activity!=='slide'||serial!==roundSerial)return;
      state.slideRevealed=open;
      if(!open)state.slideIndex=(state.slideIndex+1)%slideTotal();
      if(open)popObject(scene.querySelector('[data-cave-object]'),'cave');
      renderSlide();tone(open?660:480,true);
    },380);
  }
  function revealSlide(){moveCaveDoor(true);}
  function closeSlide(){moveCaveDoor(false);}
  function toggleSlide(){if(state.slideRevealed)closeSlide();else revealSlide();}
  function slideTo(slider,x){toggleSlide();}
  function renderClean(){
    scene.setAttribute('aria-label',`Clean the ${artPicture().name}`);
    scene.innerHTML=`<ellipse cx="511" cy="395" rx="229" ry="15" fill="#e2d5bc"/>${pictureArt()}<g id="dirt-layer">${state.dirt.filter(d=>d.health>0).map(d=>`<g data-dirt="${d.id}" opacity="${.68*d.health/d.max}"><path d="M${d.x-d.r} ${d.y}q-5 ${-d.r} ${d.r} ${-d.r*.8}q${d.r} ${-d.r*.4} ${d.r} ${d.r*.8}q8 ${d.r} ${-d.r} ${d.r*.8}q${-d.r} ${d.r*.5} ${-d.r} ${-d.r*.8}" fill="#92785d"/><circle cx="${d.x-6}" cy="${d.y-4}" r="4" fill="#77654f"/></g>`).join('')}</g>`;
    progress(state.dirt.filter(d=>d.health<=0).length,state.dirt.length);
  }
  function renderPaint(){
    scene.setAttribute('aria-label',`Paint the ${artPicture().name}`);
    scene.innerHTML=`<defs><clipPath id="picture-clip">${artPicture().region}</clipPath></defs><g data-art-picture=""><g fill="#fffaf0">${artPicture().region}</g><g id="strokes" clip-path="url(#picture-clip)"></g><g pointer-events="none">${pictureArt(true)}</g></g>`;
    state.coverage=[];
    for(let y=65;y<397;y+=9)for(let x=255;x<750;x+=9)if(insidePicture({x,y}))state.coverage.push({x,y,painted:false});
    progress(0,5);
  }
  function insidePicture(point){return [...scene.querySelectorAll('#picture-clip > *')].some(shape=>shape.isPointInFill(new DOMPoint(point.x,point.y)));}
  function updateArtTools(){
    document.querySelectorAll('[data-brush-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.brushSize===state.brushSize)));
    $('erase-paint').hidden=!state.paintMode;$('erase-paint').disabled=!state.paintMode;$('erase-paint').setAttribute('aria-pressed',String(state.paintMode&&state.erase));
    $('paint-tools').setAttribute('aria-label',state.paintMode?'Paint colour':'Brush colour');$('paint-tools').querySelector('.paint-label').textContent=state.paintMode?'Paint colour':'Brush colour';
    document.querySelectorAll('[data-paint]').forEach((button,i)=>{button.setAttribute('aria-label',`${colorNames[i]} ${state.paintMode?'paint':'brush'}`);button.setAttribute('aria-pressed',String((!state.paintMode||!state.erase)&&button.dataset.paint===(state.paintMode?state.paintColor:state.brushColor)));});
  }
  function strokePath(color,width){
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    for(const [key,value] of Object.entries({stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}))path.setAttribute(key,value);
    return path;
  }
  function beginPaint(point,id){
    if(!insidePicture(point))return null;
    const width=brushWidths[state.brushSize],paths=[];
    if(state.erase){
      for(const stroke of state.strokes){const path=strokePath('black',width);$(stroke.dataset.mask).appendChild(path);paths.push(path);}
    }else{
      const mask=document.createElementNS('http://www.w3.org/2000/svg','mask'),maskId=`paint-mask-${state.strokes.length}`;
      mask.id=maskId;mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1000');mask.setAttribute('height','440');
      mask.innerHTML='<rect width="1000" height="440" fill="white"/>';scene.querySelector('defs').appendChild(mask);
      // Give WebKit a full picture bounding box so masks retain round stroke caps.
      const layer=document.createElementNS('http://www.w3.org/2000/svg','g');layer.setAttribute('mask',`url(#${maskId})`);layer.innerHTML='<rect width="1000" height="440" fill="none"/>';
      const path=strokePath(state.paintColor,width);path.dataset.stroke='';path.dataset.mask=maskId;layer.appendChild(path);$('strokes').appendChild(layer);state.strokes.push(path);paths.push(path);
    }
    const pointer={id,kind:'paint',paths,d:`M${point.x.toFixed(1)} ${point.y.toFixed(1)}l.1 .1`,last:point,width,erase:state.erase};
    paths.forEach(path=>path.setAttribute('d',pointer.d));paintCoverage(pointer,point);return pointer;
  }
  // Sample the picture area rather than counting strokes; erasing removes coverage too.
  function paintCoverage(pointer,point){
    const from=pointer.last,dx=point.x-from.x,dy=point.y-from.y,length=dx*dx+dy*dy;
    for(const sample of state.coverage){
      const t=length?Math.max(0,Math.min(1,((sample.x-from.x)*dx+(sample.y-from.y)*dy)/length)):0;
      if(Math.hypot(sample.x-from.x-t*dx,sample.y-from.y-t*dy)<=pointer.width/2)sample.painted=!pointer.erase;
    }
    const fraction=state.coverage.filter(sample=>sample.painted).length/state.coverage.length;
    progress(Math.min(5,Math.floor(fraction/artPicture().target*5)),5);
    if(state.coverage.length&&fraction>=artPicture().target&&!state.done)brushComplete(`SaNa says: Wonderful! You finished coloring the ${artPicture().name}!`);
  }
  function brushAt(point,distance){
    if(state.done)return;
    const radius={small:20,medium:43,large:64}[state.brushSize];
    for(const dirt of state.dirt){
      if(dirt.health<=0||Math.hypot(point.x-dirt.x,point.y-dirt.y)>dirt.r+radius)continue;
      dirt.health=Math.max(0,dirt.health-(distance===0?.2:.3+Math.min(distance,20)/28));
      const element=scene.querySelector(`[data-dirt="${dirt.id}"]`);
      if(dirt.health<=0)element?.remove();else element?.setAttribute('opacity',.68*dirt.health/dirt.max);
    }
    progress(state.dirt.filter(d=>d.health<=0).length,state.dirt.length);
    if(state.dirt.every(d=>d.health<=0))brushComplete(`SaNa says: All clean! Your ${artPicture().name} looks beautiful!`);
    else if(distance>3)tone(520);
  }
  function brushCursor(point){
    let cursor=scene.querySelector('#brush-cursor');
    if(!cursor){cursor=document.createElementNS('http://www.w3.org/2000/svg','g');cursor.id='brush-cursor';cursor.style.pointerEvents='none';cursor.innerHTML=`<circle r="39" fill="${state.brushColor}" opacity=".22"/><g transform="translate(28 10) rotate(25)"><rect data-brush-handle="" x="-8" y="-50" width="16" height="58" rx="8" fill="${state.brushColor}"/><rect x="-23" y="0" width="46" height="34" rx="7" fill="${shadeColor(state.brushColor,.55)}" stroke="${shadeColor(state.brushColor,-.2)}" stroke-width="3"/><path d="M-12 23V34M0 23V34M12 23V34" stroke="${shadeColor(state.brushColor,-.3)}" stroke-width="3"/></g>`;scene.appendChild(cursor);}
    cursor.setAttribute('transform',`translate(${point.x} ${point.y}) scale(${{small:.6,medium:1,large:1.4}[state.brushSize]})`);
  }
  function localPoint(event){const matrix=scene.getScreenCTM();if(!matrix)return null;return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());}
  function hitBubble(point,id){const candidates=state.bubbles.filter(b=>b.element&&!b.popping&&Math.hypot(point.x-b.x,point.y-b.y)<b.r+8);const bubble=candidates.find(b=>String(b.id)===id)||candidates.toSorted((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];if(bubble)popBubble(bubble);}
  function pointerDown(event){
    if(!gameReady()||demoActive||state.pointer||event.button>0||!state.activity)return;
    const point=localPoint(event);if(!point)return;
    scene.querySelector('[data-guide]')?.remove();
    if(state.activity==='abacus'&&state.age!==5){
      if(state.age===2||state.age===3){
        const fruit=event.target.closest('[data-count-fruit]');
        if(demoActive||countHolding||state.done||!fruit||countCollected.has(Number(fruit.dataset.countFruit)))return;
        state.pointer={id:event.pointerId,kind:'count-fruit',node:fruit,start:point,origin:fruit.getAttribute('transform')};
        holdObject(fruit,'fruit');
        event.preventDefault();try{scene.setPointerCapture(event.pointerId);}catch{}return;
      }
      countTap(event,point);event.preventDefault();return;
    }
    if(state.activity==='abacus'){
      state.pointer=beginAbacusSlide(point,event.pointerId);if(!state.pointer)return;
      holdObject(state.pointer.elements[state.pointer.index],'bead');
    }else if(state.activity==='drag'){
      if(state.done)return;
      const target=event.target.closest('[data-target]');
      if(target&&state.selected===target.dataset.target){matchShape(state.selected);event.preventDefault();return;}
      const item=event.target.closest('[data-piece]');if(!item)return;
      const shape=state.shapes.find(s=>s.id===item.dataset.piece);state.selected=shape.id;
      holdObject(item,'shape');
      state.pointer={id:event.pointerId,kind:'drag',shape,dx:point.x-shape.x,dy:point.y-shape.y,x:shape.x,y:shape.y};
      item.classList.add('selected');
    }else if(state.activity==='bubbles'){
      state.pointer={id:event.pointerId,kind:'bubble'};hitBubble(point,event.target.closest('[data-bubble]')?.dataset.bubble);
    }else if(state.activity==='slide'){
      if(event.target.closest('[data-slide-peek]')){toggleSlide();event.preventDefault();return;}
      const door=event.target.closest('[data-slide-swipe]');if(!door)return;state.pointer={id:event.pointerId,kind:'slide',startX:point.x};
    }else if(state.paintMode){
      state.pointer=beginPaint(point,event.pointerId);if(!state.pointer)return;
    }else{
      if(state.done)return;state.pointer={id:event.pointerId,kind:'brush',last:point};brushAt(point,0);brushCursor(point);
    }
    event.preventDefault();try{scene.setPointerCapture(event.pointerId);}catch{/* Pointer capture is optional on older browsers. */}
  }
  function pointerMove(event){
    const pointer=state.pointer;if(!pointer||event.pointerId!==pointer.id)return;
    const point=pointer.kind==='abacus'?new DOMPoint(event.clientX,event.clientY).matrixTransform(pointer.matrix):localPoint(event);if(!point)return;event.preventDefault();
    if(pointer.kind==='count-fruit'){
      pointer.node.setAttribute('transform',`${pointer.origin} translate(${point.x-pointer.start.x} ${point.y-pointer.start.y})`);
    }else if(pointer.kind==='abacus')moveAbacusSlide(pointer,point);
    else if(pointer.kind==='drag'){
      pointer.x=Math.max(60,Math.min(940,point.x-pointer.dx));pointer.y=Math.max(60,Math.min(380,point.y-pointer.dy));
      scene.querySelector(`[data-piece="${pointer.shape.id}"]`)?.setAttribute('transform',`translate(${pointer.x} ${pointer.y})`);
    }else if(pointer.kind==='bubble')hitBubble(point);
    else if(pointer.kind==='slide'){pointer.lastX=point.x;}
    else if(pointer.kind==='paint'){
      pointer.d+=` L${point.x.toFixed(1)} ${point.y.toFixed(1)}`;pointer.paths.forEach(path=>path.setAttribute('d',pointer.d));paintCoverage(pointer,point);pointer.last=point;
    }else{
      const distance=Math.hypot(point.x-pointer.last.x,point.y-pointer.last.y);if(distance>.5){brushAt(point,distance);pointer.last=point;}brushCursor(point);
    }
  }
  function pointerUp(event){
    const pointer=state.pointer;if(!pointer||pointer.id!==event.pointerId)return;
    if(pointer.kind==='abacus')cancelAnimationFrame(pointer.feedbackFrame);
    releaseHeldObject();
    state.pointer=null;
    try{if(scene.hasPointerCapture(event.pointerId))scene.releasePointerCapture(event.pointerId);}catch{/* Already released. */}
    if(pointer.kind==='count-fruit'){
      const pt=localPoint(event),dest=countDestination();
      if(pt&&((pt.x-dest.x)/dest.rx)**2+((pt.y-dest.y)/dest.ry)**2<1){countTap({target:pointer.node,countDragSuccess:true},pt);}
      else {pointer.node.setAttribute('transform',pointer.origin);hint('Drag the fruit all the way to its destination.');}
      return;
    }
    if(pointer.kind==='slide'){const pt=localPoint(event);const dx=(pt?pt.x:pointer.lastX??pointer.startX)-pointer.startX;if(!slideDoorAnimating&&((!state.slideRevealed&&dx>55)||(state.slideRevealed&&dx< -55)))toggleSlide();}
    if(pointer.kind==='abacus'){moveAbacusSlide(pointer,new DOMPoint(event.clientX,event.clientY).matrixTransform(pointer.matrix));setAbacusCount(pointer.row,pointer.preview);}
    else if(pointer.kind==='drag'){
      const distance=Math.hypot(pointer.x-pointer.shape.tx,pointer.y-pointer.shape.ty);
      if(distance<profile().snapDistance)matchShape(pointer.shape.id);
      else{renderDrag();hint('This shape has a little home. Try its matching shadow.');}
    }else if(pointer.kind==='paint'&&!state.done)hint(pointer.erase?'All tidy! Choose a color to paint again.':`Lovely colors! Keep coloring the ${artPicture().name}. SaNa is watching!`);
    scene.querySelector('#brush-cursor')?.remove();
  }
  // v0.99: haptics are independent of sound, bounded, and rate-limited.
  let lastHaptic=0,lastSlideHaptic=0,lastHapticPoint=null;
  const hapticAvailable=typeof navigator.vibrate==='function';
  function haptic(duration=30,spacing=95){
    if(!state.haptics||!hapticAvailable||document.hidden)return;
    const now=performance.now();if(now-lastHaptic<spacing)return;
    lastHaptic=now;
    try{navigator.vibrate(Math.min(55,Math.max(12,duration)));}catch{/* Device/browser may block haptics. */}
  }
  function updateHapticButton(){
    const button=$('vibration-toggle');
    button.setAttribute('aria-pressed',String(state.haptics));
    button.setAttribute('aria-label',state.haptics?'Vibration on. Tap to turn off':'Vibration off. Tap to turn on');
    button.title=state.haptics?'Vibration ON':'Vibration OFF';
    button.textContent=state.haptics?'▥':'▤';
  }
  $('vibration-toggle').addEventListener('click',()=>{
    state.haptics=!state.haptics;
    try{localStorage.setItem('sanaHapticsV1',String(state.haptics));}catch{}
    updateHapticButton();
    if(state.haptics)haptic(45,0);else try{navigator.vibrate?.(0);}catch{}
  });
  try{const setting=localStorage.getItem('sanaHapticsV1');if(setting!==null)state.haptics=setting==='true';}catch{}
  updateHapticButton();
  scene.addEventListener('pointerdown',event=>{
    if(!event.isPrimary)return;
    lastHapticPoint={x:event.clientX,y:event.clientY};
    haptic(38,90);
    if(state.sound)tone(520);
  },{passive:true});
  scene.addEventListener('pointermove',event=>{
    if(!event.isPrimary||!(event.buttons&1)&&event.pointerType==='mouse'||!state.pointer)return;
    const pt={x:event.clientX,y:event.clientY};
    if(!lastHapticPoint){lastHapticPoint=pt;return;}
    const moved=Math.hypot(pt.x-lastHapticPoint.x,pt.y-lastHapticPoint.y);
    if(moved>=15){lastHapticPoint=pt;haptic(25,105);}
  },{passive:true});
  scene.addEventListener('pointerup',()=>{lastHapticPoint=null;},{passive:true});
  scene.addEventListener('pointercancel',()=>{lastHapticPoint=null;},{passive:true});
  scene.addEventListener('pointerdown',pointerDown);scene.addEventListener('pointermove',pointerMove);scene.addEventListener('pointerup',pointerUp);scene.addEventListener('pointercancel',cancelGesture);scene.addEventListener('lostpointercapture',()=>{if(state.pointer)cancelGesture();});scene.addEventListener('contextmenu',e=>e.preventDefault());
  scene.addEventListener('keydown',event=>{
    if(!gameReady()||demoActive){event.preventDefault();return;}
    const piece=event.target.closest('[data-piece]'),target=event.target.closest('[data-target]'),bubble=event.target.closest('[data-bubble]'),handle=event.target.closest('[data-slider-handle]');
    const bead=event.target.closest('[data-bead-row]');
    if(bead&&['ArrowRight','ArrowLeft','End','Home','Enter',' '].includes(event.key)){
      event.preventDefault();const row=Number(bead.dataset.beadRow),index=Number(bead.dataset.beadIndex),right=['ArrowRight','End'].includes(event.key)||(['Enter',' '].includes(event.key)&&!state.abacusRows[row][index]);
      finishAbacusBead(row,index,right);const count=abacusCount(row),focus=right?Math.max(0,9-count):Math.min(9,10-count);state.abacusElements[row].beads[focus]?.focus();
    }
    else if(state.activity==='slide'&&event.target.closest('[data-slide-swipe],[data-slide-peek]')&&['Enter',' ','ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();toggleSlide();}
    else if(handle&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
      event.preventDefault();const slider=state.sliders[Number(handle.dataset.sliderHandle)];const value=event.key==='End'?1:event.key==='Home'?0:slider.value+(event.key==='ArrowRight' ? .15 : -.15);slideTo(slider,slider.x+25+value*(slider.w-50));
    }else if(event.key==='Enter'||event.key===' '){
      event.preventDefault();if(piece){state.selected=piece.dataset.piece;renderDrag();holdObject(scene.querySelector(`[data-piece="${state.selected}"]`),'shape');hint('Now choose the matching shadow.');scene.querySelector(`[data-target="${state.selected}"]`)?.focus();}
      else if(target&&target.dataset.target===state.selected)matchShape(state.selected);
      else if(bubble)popBubble(state.bubbles.find(item=>item.id===Number(bubble.dataset.bubble)));
    }
  });
  // Demonstrate one success on copies; keep the child's real round untouched.
  let demoGeneration=0,demoActive=false,demoResume=null,demoSceneNodes=[],demoProgress=null,demoStatus=null,demoVoiceCancel=null;
  const demoPause=(ms,token)=>new Promise(resolve=>{
    demoResume=resolve;
    guideTimer=setTimeout(()=>{demoResume=null;resolve(token===demoGeneration);},ms);
  });
  function stopDemo(){
    picturePuzzle.stopDemo();
    const restoreCountHint=demoActive&&state.activity==='abacus'&&(state.age===2||state.age===3);
    demoGeneration++;demoActive=false;clearTimeout(guideTimer);
    const resume=demoResume;demoResume=null;resume?.(false);
    demoVoiceCancel?.();
    scene.querySelector('[data-demo-layer]')?.remove();
    demoSceneNodes.forEach(({node,style})=>{if(style===null)node.removeAttribute('style');else node.setAttribute('style',style);});
    demoSceneNodes=[];
    if(demoProgress){const {strip,copy,hidden,scroll}=demoProgress;copy.remove();strip.hidden=hidden;strip.scrollLeft=scroll;demoProgress=null;}
    if(demoStatus){demoStatus.forEach(({node,text})=>{node.textContent=text;});demoStatus=null;}
    if(restoreCountHint)hint(harvestInstruction(Math.min(countStage+1,countMax())));
    $('show-me').setAttribute('aria-pressed','false');
    try{speechSynthesis.cancel();}catch{}
  }
  function sanaSay(words){
    if(!state.sound||!('speechSynthesis' in window))return;
    try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(words);utterance.lang='en-US';utterance.rate=.82;utterance.pitch=1.1;utterance.volume=.85;speechSynthesis.speak(utterance);}catch{}
  }
  function demoSpeak(words,token){
    return new Promise(resolve=>{
      if(!state.sound||!window.speechSynthesis||!window.SpeechSynthesisUtterance){resolve(false);return;}
      let finished=false,timer,utterance;
      const complete=spoken=>{
        if(finished)return;finished=true;clearTimeout(timer);
        if(utterance)utterance.onend=utterance.onerror=null;
        if(demoVoiceCancel===cancel)demoVoiceCancel=null;
        resolve(spoken&&token===demoGeneration);
      };
      const cancel=()=>{complete(false);try{speechSynthesis.cancel();}catch{}};
      demoVoiceCancel=cancel;
      try{
        utterance=new SpeechSynthesisUtterance(words);
        const voices=speechSynthesis.getVoices();
        const voice=voices.find(v=>/^en-IN$/i.test(v.lang))||voices.find(v=>/^en[-_]/i.test(v.lang));
        if(voice)utterance.voice=voice;
        utterance.lang=voice?.lang||'en-US';utterance.rate=.74;utterance.pitch=1.1;utterance.volume=.85;
        utterance.onend=()=>complete(true);utterance.onerror=()=>complete(false);
        // A missing engine completion event must not trap the child in Demo.
        timer=setTimeout(cancel,Math.max(15000,words.trim().split(/\s+/).length*2000));
        speechSynthesis.speak(utterance);
      }catch{complete(false);}
    });
  }
  function demoBounds(node){
    const b=node.getBBox(),inverse=scene.getScreenCTM().inverse(),matrix=node.getScreenCTM();
    const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix).matrixTransform(inverse));
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
    return{x:left+width/2,y:top+height/2,width,height};
  }
  async function showMe(){
    if(state.activity==='puzzle'){void picturePuzzle.demo();return;}
    if(!gameReady()||objectFeedback)return;
    if(state.activity==='abacus'&&countHolding)return;
    if(demoActive){stopDemo();return;}
    cancelGesture();stopDemo();demoActive=true;$('show-me').setAttribute('aria-pressed','true');
    demoStatus=[$('result-score'),$('bubble-score')].map(node=>({node,text:node.textContent}));
    const token=demoGeneration,serial=roundSerial,activity=state.activity,age=state.age;
    const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'g'),backing=document.createElementNS(ns,'g');
    overlay.dataset.demoLayer='';overlay.dataset.demoPhase='action';overlay.style.pointerEvents='all';
    backing.innerHTML=scene.innerHTML;overlay.appendChild(backing);
    demoSceneNodes=[...scene.children].filter(node=>node.tagName.toLowerCase()!=='defs').map(node=>({node,style:node.getAttribute('style')}));
    demoSceneNodes.forEach(({node})=>{node.style.visibility='hidden';});
    const strip=$('item-progress-strip');
    if(!strip.hidden){
      const copy=strip.cloneNode(true),scroll=strip.scrollLeft;
      copy.removeAttribute('id');copy.dataset.demoProgress='';copy.setAttribute('aria-label','Demo progress preview only');copy.style.pointerEvents='none';
      glossThumbnails(copy,true);
      copy.querySelectorAll('button').forEach(button=>{button.tabIndex=-1;});strip.after(copy);
      demoProgress={strip,copy,hidden:strip.hidden,scroll};strip.hidden=true;copy.scrollLeft=scroll;
    }
    const hand=document.createElementNS(ns,'g');hand.dataset.demoHand='';hand.style.pointerEvents='none';hand.setAttribute('visibility','hidden');
    // The fingertip is exactly (0,0); the rest of the hand extends below it.
    const fingerPath='M-5 27V6Q-5 0 0 0Q5 0 5 6V23L9 19Q12 17 16 20L25 27Q29 30 27 36L22 48H5L-10 34Q-14 29-10 25Q-7 23-5 27Z';
    hand.innerHTML=`<g data-demo-hand-shape=""><path d="${fingerPath}" fill="none" stroke="#ffffff" stroke-width="8" stroke-linejoin="round"/><path d="${fingerPath}" fill="${activity==='abacus'&&age===4?'#2563eb':'#ffd0a1'}" stroke="${activity==='abacus'&&age===4?'#17305f':'#514632'}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    overlay.appendChild(hand);scene.appendChild(overlay);
    const shape=hand.firstElementChild,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const valid=()=>token===demoGeneration&&serial===roundSerial&&activity===state.activity&&age===state.age&&overlay.isConnected;
    const announce=words=>{
      if(!valid()||!words)return;
      hint('Demo: '+words);
      // Speech accompanies the finger; it never gates contact, motion or handoff.
      demoVoiceCancel?.();void demoSpeak(words,token);
    };
    let positioned=false;
    const pointHand=(x,y,span,node,ms=0)=>{
      hand.removeAttribute('visibility');
      backing.querySelectorAll('[data-demo-target]').forEach(el=>el.removeAttribute('data-demo-target'));
      if(node)node.setAttribute('data-demo-target','');
      const fingerHeight=activity==='bubbles'?span/3:activity==='abacus'&&age===4?Math.min(78,Math.max(52,span*1.5)):Math.min(36.4,span*.62);
      shape.setAttribute('transform',`scale(${Math.max(.04,fingerHeight/(activity==='bubbles'?48:56))})`);
      hand.style.transition=reduced||!positioned||!ms?'none':`transform ${ms}ms ease-in-out`;
      hand.setAttribute('transform',`translate(${x} ${y})`);positioned=true;
    };
    const move=async(x,y,words,ms=450,span=60,node=null,action=null)=>{
      if(!valid())return false;
      action?.();pointHand(x,y,span,node,ms);
      announce(words);
      return !ms?valid():await demoPause(ms,token)&&valid();
    };
    const pointAt=async(node,words,ms=400,action=null)=>{const p=demoBounds(node);return move(p.x,p.y,words,ms,Math.min(p.width,p.height),node,action);};
    const touch=async(node,words)=>{
      if(!await pointAt(node,words,0))return false;
      overlay.dataset.demoContact='holding';
      const held=await demoPause(1000,token)&&valid();
      delete overlay.dataset.demoContact;
      return held;
    };
    const success=async index=>{
      if(!valid())return;
      hand.setAttribute('visibility','hidden');demoVoiceCancel?.();
      const copy=demoProgress?.copy,chip=copy?.children[index];
      if(chip){chip.classList.remove('is-current','is-later');chip.classList.add('is-done','is-demo-done');chip.setAttribute('aria-label','Demo completed: '+chip.title);copy.dataset.successIndex=String(index);copy.scrollLeft=Math.max(0,chip.offsetLeft-copy.clientWidth/2+chip.offsetWidth/2);}
      if(copy&&!(activity==='abacus'&&age===5)){const score=$(activity==='bubbles'?'bubble-score':'result-score');score.textContent=score.textContent.replace(/\d+(?=\s*\/)/,String(copy.querySelectorAll('.is-done').length));}
      overlay.dataset.demoPhase='success';hint('Demo: Well done! Look at the result.');
      // Keep the completed picture and tick on screen, with the finger cleared.
      // Immediate teardown would remove them before the browser could paint.
      await demoPause(1000,token);
    };
    try{
      if(activity==='drag'){
        const item=state.shapes.find(v=>!v.placed);
        if(item){const piece=backing.querySelector(`[data-piece="${item.id}"]`),target=backing.querySelector(`[data-target="${item.id}"] > g`);
          if(await touch(piece,`Touch the ${item.id}.`)){
            if(await pointAt(target,'Slide it into its shadow.',850,()=>{piece.style.transition=reduced?'none':'transform 850ms ease-in-out';piece.setAttribute('transform',`translate(${item.tx} ${item.ty})`);})){piece.setAttribute('opacity','1');await success(shapes.findIndex(s=>s.id===item.id));}
          }
        }
      }else if(activity==='abacus'&&age<5){
        const target=Math.min(countStage+1,countMax());
        if(age===4){
          const choice=backing.querySelector(`[data-count-choice="${target}"]`),number=choice?.querySelector('text');
          if(number&&await touch(number,`Tap the carriage showing ${target}.`)){const b=number.getBBox(),coach=choice.querySelector('image').getBBox(),s=Math.min(coach.width/b.width,coach.height/b.height)*.9,cx=b.x+b.width/2,cy=b.y+b.height/2;number.style.transition=reduced?'none':'transform 180ms ease-out';number.setAttribute('transform',`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`);if(!await demoPause(reduced?0:180,token)||!valid())return;await success(countStage);}
        }else{
          const source=backing.querySelector('[data-count-fruit]');
          if(source){const [x,y]=countSourcePoint(Number(source.dataset.countFruit),age),[destX,destY]=countCollectedPoint(countPlaced,age),scale=age===2?1:collectedCarrotScale;
            if(await touch(source,age===2?'Pick an apple.':'Pick a carrot.')){
              source.setAttribute('visibility','hidden');const moving=document.createElementNS(ns,'g');moving.dataset.demoMoving='';moving.innerHTML=countIcon(0,0,age===2?'apple':'carrot',scale);moving.setAttribute('transform',`translate(${x} ${y})`);backing.appendChild(moving);
              moving.getBoundingClientRect();
              const image=moving.querySelector('image');
              if(await move(destX,destY+(age===2?0:-4*scale),age===2?'Put it in the basket.':'Give it to the rabbit.',850,Math.min(age===2?64:56*scale,age===2?74:88*scale),image,()=>{moving.style.transition=reduced?'none':'transform 850ms ease-in-out';moving.setAttribute('transform',`translate(${destX} ${destY})`);})){
                if(age===3){moving.firstElementChild.setAttribute('transform',`rotate(-90) scale(${scale})`);const p=demoBounds(image);pointHand(p.x,p.y,Math.min(p.width,p.height),image);}
                const counter=backing.querySelector('[data-count-counter]');if(counter)counter.textContent=`${countPlaced+1} / ${target}`;
                const left=backing.querySelector('[data-count-ledger-value="source"]'),right=backing.querySelector('[data-count-ledger-value="collected"]');if(left)left.textContent=String(countMax()-countPlaced-1);if(right)right.textContent=String(countPlaced+1);
                const instruction=backing.querySelector('[data-count-instruction]');if(instruction)instruction.textContent=harvestInstruction(target,age,countPlaced+1);
                refreshSceneTextTabs();
                await success(countStage);
              }
            }
          }else{const last=backing.querySelector('[data-count-collected] image');if(last&&await touch(last,'You completed this collection.'))await success(countMax()-1);}
        }
      }else if(activity==='slide'){
        const door=backing.querySelector('[data-cave-door]');
        if(door){door.setAttribute('transform','translate(0 0) scale(1 1)');const knob=door.querySelector('circle');
          if(await touch(knob,'Touch the door handle.')){
            if(await move(720+715*.34,345,'Slide to open.',850,48*.34,knob,()=>{door.style.transition=reduced?'none':'transform 850ms ease-in-out';door.setAttribute('transform','translate(720 0) scale(.34 1)');})){
              const caption=backing.querySelector('[data-slide-caption]');if(caption)caption.textContent='Door OPEN · You found '+slideObjects[state.slideIndex][0]+'!';
              setSlideCue(backing,true);
              refreshSceneTextTabs();
              overlay.dataset.demoDoorState='open';
              if(!await touch(knob,'Now slide the door closed.'))return;
              overlay.dataset.demoDoorState='closing';
              if(!await move(715,345,null,850,48,knob,()=>door.setAttribute('transform','translate(0 0) scale(1 1)')))return;
              if(caption)caption.textContent='Door CLOSED · Well done!';
              setSlideCue(backing,false);
              refreshSceneTextTabs();
              overlay.dataset.demoDoorState='closed';
              await success(state.slideIndex);
            }
          }
        }
      }else if(activity==='bubbles'){
        const nodes=[...backing.querySelectorAll('[data-bubble]')].filter(n=>state.bubbleMode==='plain'||!state.bubbleHits.has(n.dataset.token)),bubble=nodes.find(n=>n.getAttribute('aria-hidden')!=='true')||nodes[0];
        // A large bubble may never fit wholly onstage. Bring only the preview
        // copy into view, so Demo works while preserving the real floating field.
        if(bubble&&bubble.getAttribute('aria-hidden')==='true'){
          const bounds=demoBounds(bubble),diameter=Math.min(bounds.width,bounds.height);
          bubble.setAttribute('transform',`translate(${scene.viewBox.baseVal.width/2} ${Math.max(30,Math.min(220,440-diameter*.4))})`);
        }
        if(bubble&&await touch(bubble,'Touch the bubble.')){
          const index=state.bubbleMode==='plain'?state.bubblePops:bubbleItems().indexOf(bubble.dataset.token);
          bubble.style.transition=reduced?'none':'transform 180ms ease-out';
          bubble.setAttribute('transform',bubble.getAttribute('transform')+' scale(1.15)');
          if(!await demoPause(reduced?0:180,token)||!valid())return;
          const p=demoBounds(bubble.querySelector('[data-balloon-body]')||bubble),radius=Math.min(p.width,p.height)*.42,color=state.bubbles.find(b=>b.id===Number(bubble.dataset.bubble))?.color||'#46baf2';
          const splash=document.createElementNS(ns,'g');splash.dataset.demoSplash='';splash.setAttribute('transform',`translate(${p.x} ${p.y})`);splash.setAttribute('fill',color);splash.setAttribute('pointer-events','none');
          splash.innerHTML=`<g class="demo-balloon-splash">${Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4;return `<circle cx="${Math.cos(angle)*radius}" cy="${Math.sin(angle)*radius}" r="${Math.max(2.5,Math.min(10,radius*.12))}" stroke="#fff" stroke-width="1.5"/>`;}).join('')}</g>`;
          backing.appendChild(splash);bubble.setAttribute('opacity','0');await success(Math.max(0,index));
        }
      }else if(activity==='brush'){
        const picture=backing.querySelector('g[stroke="#536b5b"]'),dirt=[...backing.querySelectorAll('[data-dirt]')];
        const trail=document.createElementNS(ns,'polyline');trail.setAttribute('fill','none');trail.setAttribute('stroke',state.paintMode?state.paintColor:'#c7eeee');trail.setAttribute('stroke-width','30');trail.setAttribute('stroke-linecap','round');trail.setAttribute('stroke-linejoin','round');if(state.paintMode)trail.setAttribute('clip-path','url(#picture-clip)');backing.appendChild(trail);
        if(!state.paintMode&&dirt.length){
          if(await touch(dirt[0],'Brush over the muddy marks.')){dirt[0].setAttribute('opacity','0');for(const patch of dirt.slice(1)){if(!valid())break;const p=demoBounds(patch);if(!await move(p.x,p.y,null,230,Math.min(p.width,p.height),patch))break;patch.setAttribute('opacity','0');}}
        }else if(picture){
          const b=demoBounds(picture),coords=[];
          for(const fy of [.3,.5,.7])for(const fx of [.3,.5,.7]){const point={x:b.x-b.width/2+b.width*fx,y:b.y-b.height/2+b.height*fy};if(insidePicture(point))coords.push(point);}
          if(await touch(picture,'Paint inside the picture.'))for(const [i,p] of coords.slice(0,6).entries()){if(!await move(p.x,p.y,null,230,50,picture,()=>trail.setAttribute('points',coords.slice(0,i+1).map(p=>p.x+','+p.y).join(' '))))break;}
        }
        if(valid()&&picture){trail.remove();dirt.forEach(n=>n.setAttribute('opacity','0'));picture.setAttribute('fill',state.paintMode?state.paintColor:brushThumbColor(artPicture().name));await success(brushIndex);}
      }else if(activity==='abacus'){
        const row=activeAbacusRow(),count=abacusCount(row),g=abacusGeometry(),right=count<10,index=right?9-count:0,bead=backing.querySelector(`[data-bead-row="${row}"][data-bead-index="${index}"]`);
        if(bead&&await touch(bead,'Touch one bead.')){
          const dest=right?g.end-count*g.pitch:g.start,y=abacusY(row),next=count+(right?1:-1);
          if(await move(dest,y,'Slide the bead.',850,g.r*2,bead.querySelector('circle'),()=>{bead.style.transition=reduced?'none':'transform 850ms ease-in-out';bead.setAttribute('transform',`translate(${dest} ${y})`);})){
            const label=backing.querySelector(`[data-color-label="${row}"]`);if(label)label.textContent=abacusLabel(row,next);
            $('result-score').textContent=`${abacusColors[row][0]}: ${next} ${abacusWords[next]}`;
            bead.dataset.moved=String(right);
            const region=backing.querySelector(`[data-color-region="${row}"]`);if(region)region.setAttribute('fill',next?abacusColors[row][1]:'none');
            updateAbacusAddition(row,next,false,backing);
            const chip=demoProgress?.copy.children[row];if(chip){chip.title=abacusColors[row][0]+' '+next;const value=chip.querySelector('[data-abacus-chip-count]');if(value)value.textContent=String(next);}
            await success(row);
          }
        }
      }
    }catch(error){console.warn('Demo preview error',error);}
    finally{if(valid()){stopDemo();if(!(activity==='abacus'&&(age===2||age===3)))hint('Your turn! Play the game.');}}
  }

  $('home').addEventListener('click',home);$('again').addEventListener('click',resetRound);$('show-me').addEventListener('click',showMe);
  document.querySelectorAll('[data-activity]').forEach(button=>button.addEventListener('click',()=>{tone(500);startActivity(button.dataset.activity);}));
  document.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>setLevel(Number(button.dataset.level))));
  // Share one settings area so normal phone play has height for several readable rows.
  $('bubble-settings').prepend($('bubble-modes'));
  document.querySelectorAll('[data-bubble-mode]').forEach(button=>button.addEventListener('click',()=>{state.bubbleMode=button.dataset.bubbleMode;resetRound();}));
  $('bubble-full-set').addEventListener('click',()=>{state.bubbleSet=state.bubbleSet==='full'?'starter':'full';save();resetRound();});
  document.querySelectorAll('[data-bubble-speed]').forEach(button=>button.addEventListener('click',()=>{state.bubbleSpeed=button.dataset.bubbleSpeed;updateBubbleSettings();save();}));
  document.querySelectorAll('[data-bubble-size]').forEach(button=>button.addEventListener('click',()=>{state.bubbleSize=button.dataset.bubbleSize;updateBubbleSettings();fitBubbleField();save();}));
  $('paint-mode').addEventListener('click',()=>{state.paintMode=true;resetRound();});$('clean-mode').addEventListener('click',()=>{state.paintMode=false;resetRound();});
  document.querySelectorAll('[data-paint]').forEach(button=>button.addEventListener('click',()=>{if(demoActive)stopDemo();cancelGesture();if(state.paintMode){state.erase=false;state.paintColor=button.dataset.paint;}else state.brushColor=button.dataset.paint;updateArtTools();tone(620);popObject(button,'paint-color');}));
  document.querySelectorAll('[data-brush-size]').forEach(button=>button.addEventListener('click',()=>{if(demoActive)stopDemo();cancelGesture();state.brushSize=button.dataset.brushSize;updateArtTools();}));
  $('erase-paint').addEventListener('click',()=>{cancelGesture();state.erase=!state.erase;updateArtTools();hint(state.erase?'Rub over the paint to erase. The picture stays safe.':`Choose a color and paint inside the ${artPicture().name}.`);});
  function soundButton(){$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'All sound on':'All sound off');$('sound').style.opacity='1';window.dispatchEvent(new CustomEvent('sana-sound-change',{detail:{enabled:state.sound}}));}
  $('sound').addEventListener('click',()=>{state.sound=!state.sound;save();soundButton();if(state.sound)tone(600);else{demoVoiceCancel?.();if(audio?.state==='running')audio.suspend().catch(()=>{});}});
  function fitFrame(){
    const visual=window.visualViewport,w=visual?.width||innerWidth,h=visual?.height||innerHeight,rotated=w<h;
    if(visual&&Math.abs(visual.scale-1)>.01)return;
    closeAgeMenu();
    // Read physical screen insets before rotating the landscape play frame.
    const padding=getComputedStyle($('viewport')),left=parseFloat(padding.paddingLeft)||0,right=parseFloat(padding.paddingRight)||0,top=parseFloat(padding.paddingTop)||0,bottom=parseFloat(padding.paddingBottom)||0;
    const availableW=Math.max(1,w-left-right),availableH=Math.max(1,h-top-bottom),width=rotated?availableH:availableW,height=rotated?availableW:availableH;
    app.style.left=`${(visual?.offsetLeft||0)+left+availableW/2}px`;app.style.top=`${(visual?.offsetTop||0)+top+availableH/2}px`;
    cancelGesture();app.style.setProperty('--frame-w',`${width}px`);app.style.setProperty('--frame-h',`${height}px`);app.classList.toggle('rotated',rotated);app.classList.toggle('compact',height<530);app.classList.toggle('narrow',width<740);app.classList.toggle('short-play',height<350);
  }
  // Use SaNa's in-page immersive layout without requesting browser fullscreen.
  // Android/Chrome owns the origin-labelled fullscreen security banner; web apps
  // cannot customize or suppress it. Installed PWAs already hide browser chrome.
  let immersiveNoticeTimer=null;
  function immersiveNotice(){
    let notice=document.getElementById('sana-immersive-notice');
    if(!notice){
      notice=document.createElement('div');notice.id='sana-immersive-notice';
      notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
      Object.assign(notice.style,{position:'absolute',bottom:'12px',left:'50%',transform:'translateX(-50%)',padding:'6px 12px',borderRadius:'12px',background:'rgba(255,250,220,.93)',color:'#18453c',font:'600 13px system-ui,sans-serif',zIndex:'30',pointerEvents:'none',whiteSpace:'nowrap',maxWidth:'90%',textAlign:'center'});
      app.appendChild(notice);
    }
    notice.textContent='SaNa play mode · Tap × to exit';notice.hidden=false;
    clearTimeout(immersiveNoticeTimer);
    immersiveNoticeTimer=setTimeout(()=>{notice.hidden=true;},2200);
  }
  async function immersiveMode(active){
    picturePuzzle.stopDemo();
    if(demoActive){stopDemo();hint('Your turn! Play the game.');}
    if(active&&!app.classList.contains('immersive'))normalSceneSize();
    cancelGesture();app.classList.toggle('immersive',active);
    placeArtTools(app,active);
    if(active)app.querySelector('.play-mat').append($('vibration-toggle'));
    else if(state.activity)$('game-mid-controls').append($('vibration-toggle'));
    const button=$('fullscreen'),label=active?'Exit fullscreen':'Fullscreen';
    button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(active));button.title=label;
    button.querySelector('use').setAttribute('href',active?'#exit-fullscreen-icon':'#fullscreen-icon');
    // Do not call requestFullscreen: it exposes the hosting origin in a browser-owned banner.
    if(active)immersiveNotice();
    else{
      clearTimeout(immersiveNoticeTimer);
      const notice=document.getElementById('sana-immersive-notice');if(notice)notice.hidden=true;
      button.focus({preventScroll:true});
    }
    fitFrame();
    refreshSceneTextTabs();
  }
  const gameSteps=()=>Object.keys(activities).flatMap(activity=>[1].flatMap(level=>(activity==='bubbles'?['plain','numbers','letters','shapes']:activity==='brush'?['clean','paint']:['']).map(mode=>({activity,level,mode}))));
  function currentStep(){return gameSteps().findIndex(step=>step.activity===state.activity&&((state.activity==='abacus'&&state.age===null)||step.level===state.level)&&step.mode===(state.activity==='bubbles'?state.bubbleMode:state.activity==='brush'?(state.paintMode?'paint':'clean'):''));}
  function stepLabel(step){return step?`${activities[step.activity].title} · ${['','Easy','Medium','Challenge'][step.level]}${step.mode?' · '+(bubbleModes[step.mode]?.label||step.mode):''}`:'Games';}
  function updateGameNavigation(){const index=currentStep(),steps=gameSteps();for(const [id,direction] of [['game-back',-1],['game-front',1]]){$(id).title=stepLabel(steps[index+direction]);$(id).setAttribute('aria-description',$(id).title);}}
  function gameMenu(){immersiveMode(false);home();$('home').focus({preventScroll:true});}
  function stepGame(direction){const next=gameSteps()[currentStep()+direction];if(!next){void gameMenu();return;}setLevel(next.level,false);if(next.activity==='bubbles')state.bubbleMode=next.mode;startActivity(next.activity,next.mode==='paint');}
  $('game-back').addEventListener('click',()=>stepGame(-1));$('game-front').addEventListener('click',()=>stepGame(1));$('game-home').addEventListener('click',gameMenu);
  // Expand inside the page to keep browser-owned fullscreen notices out of play.
  $('fullscreen').addEventListener('click',()=>{void immersiveMode(!app.classList.contains('immersive'));});
  $('exit-play').addEventListener('click',()=>{void immersiveMode(false);});
  // v1.14: position exit at the actual progress strip's bottom edge,
  // including after age/game changes, viewport rotation and layout reflow.
  const exitPlayMat=app.querySelector('.play-mat');
  const exitStrip=$('item-progress-strip');
  function alignExitToThumbnails(){
    if(!exitPlayMat||!exitStrip)return;
    // offsetTop/offsetHeight are in the UNROTATED playroom coordinate system.
    // getBoundingClientRect() measures the already-rotated portrait screen,
    // so subtracting its rectangles placed this button in the wrong corner.
    const visible=!exitStrip.hidden&&exitStrip.offsetHeight>0;
    const top=visible?exitStrip.offsetTop+exitStrip.offsetHeight:0;
    exitPlayMat.style.setProperty('--sana-exit-top',`${Math.max(0,Math.round(top))}px`);
  }
  new ResizeObserver(alignExitToThumbnails).observe(exitStrip);
  new ResizeObserver(alignExitToThumbnails).observe(exitPlayMat);
  new MutationObserver(alignExitToThumbnails).observe(exitStrip,{attributes:true,attributeFilter:['hidden','class','style']});
  window.addEventListener('resize',alignExitToThumbnails,{passive:true});
  requestAnimationFrame(alignExitToThumbnails);

  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&app.classList.contains('immersive')){app.classList.remove('immersive');$('fullscreen').setAttribute('aria-pressed','false');fitFrame();}});
  document.addEventListener('fullscreenchange',fitFrame);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&app.classList.contains('immersive'))immersiveMode(false);});
  window.addEventListener('resize',fitFrame);window.visualViewport?.addEventListener('resize',fitFrame);window.addEventListener('orientationchange',fitFrame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBubbles();cancelGesture();if(audio?.state==='running')audio.suspend().catch(()=>{});}else if(state.activity==='bubbles'&&bubbleFrame===null)bubbleFrame=requestAnimationFrame(bubbleTick);});
  window.addEventListener('pagehide',()=>{stopBubbles();cancelGesture();clearEffects();if(audio?.state==='running')audio.suspend().catch(()=>{});});
  app.addEventListener('sana-guide-open',()=>{picturePuzzle.stopDemo();if(demoActive)stopDemo();cancelGesture();});
  levelControls();soundButton();home();fitFrame();
  // Installed phones may support orientation preferences without native fullscreen.
  if((navigator.userAgentData?.mobile===true||/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<600))&&(navigator.standalone||matchMedia('(display-mode:standalone)').matches)){
    try{Promise.resolve(screen.orientation?.lock?.('landscape')).catch(()=>{});}catch{/* The existing landscape frame is the fallback. */}
  }
})();
