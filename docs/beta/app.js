(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const app=$('app'),scene=$('scene');
  const ageProfiles=window.SaNaProfiles;
  const profile=()=>ageProfiles.preset(state.level);
  if(!window.sanaTouchGuardReady){for(const type of ['contextmenu','selectstart','dragstart'])document.addEventListener(type,event=>event.preventDefault(),{capture:true});window.sanaTouchGuardReady=true;}
  const colors=['#df7f68','#edbf42','#629fca','#8d83c2','#65a58a','#405f76'];
  const colorNames=['Coral','Yellow','Blue','Purple','Green','Ink'];
  const puppyTail='M650 253Q744 198 705 173L723 159Q779 204 660 273Z';
  const shapes=[
    {id:'circle',color:'#de927b'}, {id:'triangle',color:'#ebc34e'},
    {id:'square',color:'#71abc6'}, {id:'star',color:'#a295c4'},
    {id:'heart',color:'#df8fa9'}, {id:'hexagon',color:'#7cab89'}
  ];
  const activities={
    drag:{title:'Shape picnic',label:'Drag shapes',word:'Drag',caption:'match a little shape',note:'A place for every little shape',hint:'Drag a shape to its shadow. Or tap a shape, then its shadow.'},
    bubbles:{title:'Bubble garden',label:'Pop bubbles',word:'Tap',caption:'pop a happy bubble',note:'A pop of color. A little smile.',hint:'Tap a bubble. Pop, pop, pop! You can brush across them too.'},
    slide:{title:'Peek-a-boo friends',label:'Slide to reveal',word:'Slide',caption:'find a little friend',note:'Who is hiding behind the curtains?',hint:'Slide the sunny handles along the paths. Who will you find?'},
    brush:{title:'Little art studio',label:'Brush and paint',word:'Brush & paint',caption:'wash and make colors',note:'',hint:'Brush the muddy puppy. Give him a gentle wash.'},
    abacus:{title:'Rainbow abacus',label:'Abacus colors',word:'Count',caption:'make a rainbow',note:'',hint:'Slide beads in any row, either way. See the number and its word change!' }
  };
  let saved={};try{const stored=JSON.parse(localStorage.getItem('sanaLittleHandsV1')||'{}');saved=stored&&typeof stored==='object'?stored:{};}catch{/* Settings are optional. */}
  const hasAgeSettings=saved.ageSettings&&typeof saved.ageSettings==='object'&&!Array.isArray(saved.ageSettings);
  const ageSettings=hasAgeSettings?saved.ageSettings:{};
  if(!hasAgeSettings)ageSettings.common={level:saved.level,bubbleSpeed:saved.bubbleSpeed,bubbleSize:saved.bubbleSize,bubbleSet:'full'};
  const preferences=()=>ageSettings[ageProfiles.getAge()??'common']??{};
  const initial=preferences();
  const state={age:ageProfiles.getAge(),level:[1,2,3].includes(initial.level)?initial.level:ageProfiles.getAge()===null?2:1,activity:null,done:false,pointer:null,selected:null,paintMode:false,paintColor:colors[0],strokes:[],shapes:[],bubbles:[],sliders:[],dirt:[],sound:saved.sound===true};
  Object.assign(state,{brushSize:profile().brushSize,erase:false,coverage:[],bubbleMode:profile().bubbleMode,bubbleSet:initial.bubbleSet==='full'||state.age===null?'full':'starter',bubbleHits:new Map(),bubblePops:0,bubbleRecent:[],bubbleEffects:[],bubbleSerial:0,bubbleWidth:1000});
  const bubbleModes={plain:{label:'Plain',items:[]},numbers:{label:'1–20',items:Array.from({length:20},(_,i)=>String(i+1))},letters:{label:'A–Z',items:Array.from({length:26},(_,i)=>String.fromCharCode(65+i))},shapes:{label:'Shapes',items:shapes.map(shape=>shape.id)}};
  const bubbleColors=['#a6d1d3','#e6a6a4','#cfbfdf','#f0d47a','#afd1a2','#f1bd91'];
  const bubbleSpeeds={slow:18,medium:34,fast:58},bubbleDiameters={small:44,medium:60,large:80};
  state.bubbleSpeed=Object.hasOwn(bubbleSpeeds,initial.bubbleSpeed)?initial.bubbleSpeed:null;
  state.bubbleSize=Object.hasOwn(bubbleDiameters,initial.bubbleSize)?initial.bubbleSize:null;
  const selectedBubbleSpeed=()=>state.bubbleSpeed??profile().bubbleSpeed;
  const selectedBubbleSize=()=>state.bubbleSize??profile().bubbleSize;
  function bubbleItems(kind=state.bubbleMode){const items=bubbleModes[kind].items;if(state.bubbleSet==='full')return items;return items.slice(0,({numbers:profile().numberCount,letters:profile().letterCount,shapes:profile().shapeTokens})[kind]??0);}
  const brushWidths={small:18,medium:38,large:72};
  let audio=null,lastTone=0,rewardTimer=null,guideTimer=null,bubbleFrame=null,lastBubbleTime=0;
  const save=()=>{
    const key=state.age??'common',current={level:state.level,bubbleSpeed:state.bubbleSpeed,bubbleSize:state.bubbleSize,bubbleSet:state.bubbleSet};ageSettings[key]=current;
    try{
      const latest=JSON.parse(localStorage.getItem('sanaLittleHandsV1')||'null'),other=latest?.ageSettings;
      const merged={...ageSettings,...(other&&typeof other==='object'&&!Array.isArray(other)?other:{}),[key]:current};Object.assign(ageSettings,merged);
      localStorage.setItem('sanaLittleHandsV1',JSON.stringify({level:state.level,sound:state.sound,bubbleSpeed:state.bubbleSpeed,bubbleSize:state.bubbleSize,ageSettings}));
    }catch{/* Play and per-age preferences also work in memory when storage is unavailable. */}
  };
  const hint=text=>{$('hint').textContent=text;};
  function tone(frequency=590,win=false){
    if(!state.sound||document.hidden)return;
    if(!win&&performance.now()-lastTone<90)return;lastTone=performance.now();
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      audio??=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});
      for(let i=0;i<(win?3:1);i++){
        const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+i*.12;
        oscillator.type='sine';oscillator.frequency.value=frequency*(win?[1,1.25,1.5][i]:1);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.045,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.18);
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
        source.buffer=buffer;gain.gain.setValueAtTime(.08,start);gain.gain.exponentialRampToValueAtTime(.001,start+.12);
        source.connect(gain);gain.connect(audio.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(start);
      }
    }catch{/* Applause is optional when sound is unavailable. */}
  }
  function primitive(id,fill,stroke='#34534a'){
    const common=`fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"`;
    if(id==='circle')return `<circle r="55" ${common}/>`;
    if(id==='square')return `<rect x="-53" y="-53" width="106" height="106" rx="20" ${common}/>`;
    if(id==='triangle')return `<path d="M0-60L62 46Q64 54 53 54H-53Q-64 54-58 43Z" ${common}/>`;
    if(id==='heart')return `<path d="M0 54C-15 37-62 9-58-25C-55-62-13-65 0-34C18-66 58-60 59-26C62 11 17 39 0 54Z" ${common}/>`;
    const points=Array.from({length:id==='star'?10:6},(_,i)=>{
      const a=(i*(id==='star'?36:60)-90)*Math.PI/180,r=id==='star'&&i%2?28:59;
      return `${Math.cos(a)*r},${Math.sin(a)*r}`;
    }).join(' ');
    return `<polygon points="${points}" ${common}/>`;
  }
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
  const artPicture=()=>({...artPictures[profile().picture],target:profile().paintTarget});
  function pictureArt(outline=false){
    const picture=artPicture();if(picture.name==='puppy')return puppy(outline);
    return `<g stroke="#5c6555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><g fill="${outline?'none':picture.color}">${picture.region}</g><g fill="${outline?'none':'#f6d789'}">${picture.details}</g></g>`;
  }
  function preview(id){
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
  function clearEffects(){clearTimeout(rewardTimer);clearTimeout(guideTimer);$('celebrate').hidden=true;$('art-reward').hidden=true;scene.querySelector('[data-guide]')?.remove();}
  function cancelGesture(){
    const pointer=state.pointer;state.pointer=null;
    if(pointer&&scene.hasPointerCapture?.(pointer.id)){try{scene.releasePointerCapture(pointer.id);}catch{/* Gesture may already have ended. */}}
    if(pointer?.kind==='drag')renderDrag();
    if(pointer?.kind==='abacus'&&state.activity==='abacus'){restoreAbacusRow(pointer.row);updateAbacusFeedback(pointer.row);}
    scene.querySelector('#brush-cursor')?.remove();
  }
  const ageChoice=$('age-choice'),ageMenu=$('age-menu'),ageOptions=[...ageMenu.querySelectorAll('[data-age-option]')];
  function closeAgeMenu(restoreFocus=false){ageMenu.hidden=true;ageChoice.setAttribute('aria-expanded','false');if(restoreFocus)ageChoice.focus({preventScroll:true});}
  function openAgeMenu(){if(app.classList.contains('immersive'))return;ageMenu.hidden=false;ageChoice.setAttribute('aria-expanded','true');ageOptions.find(option=>option.dataset.ageOption===String(state.age??''))?.focus({preventScroll:true});}
  function parentAgeControls(){ageChoice.textContent=state.age===null?'Family play':`Age ${state.age}`;ageChoice.value=String(state.age??'');ageOptions.forEach(option=>option.setAttribute('aria-selected',String(option.dataset.ageOption===String(state.age??''))));app.classList.toggle('age-profile',state.age!==null);const welcome=app.querySelector('a.brand');if(welcome)welcome.href=ageProfiles.navigation('index.html');}
  function chooseParentAge(value){
    if(app.classList.contains('immersive'))return;
    if(String(state.age??'')===String(value))return;
    const activity=state.activity,paintMode=state.paintMode;
    save();ageProfiles.select(value);state.age=ageProfiles.getAge();const selected=preferences();
    state.level=[1,2,3].includes(selected.level)?selected.level:state.age===null?2:1;
    state.bubbleSpeed=Object.hasOwn(bubbleSpeeds,selected.bubbleSpeed)?selected.bubbleSpeed:null;state.bubbleSize=Object.hasOwn(bubbleDiameters,selected.bubbleSize)?selected.bubbleSize:null;
    state.bubbleSet=selected.bubbleSet==='full'||state.age===null?'full':'starter';state.bubbleMode=profile().bubbleMode;state.brushSize=profile().brushSize;
    try{history.replaceState(null,'',ageProfiles.navigation(location.pathname+location.search));}catch{/* The current page choice still works without history access. */}
    save();levelControls();parentAgeControls();document.querySelector('[data-activity="brush"] .card-art').innerHTML=preview('brush');if(activity)startActivity(activity,paintMode);else hint('Choose any picture and play together. Every game is open.');
  }
  ageChoice.addEventListener('click',()=>ageMenu.hidden?openAgeMenu():closeAgeMenu(true));
  ageChoice.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openAgeMenu();}});
  ageOptions.forEach(option=>option.addEventListener('click',()=>{chooseParentAge(option.dataset.ageOption);closeAgeMenu(true);}));
  ageMenu.addEventListener('keydown',event=>{
    if(event.key==='Tab'){closeAgeMenu(true);return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const current=ageOptions.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?ageOptions.length-1:(current+(event.key==='ArrowDown'?1:-1)+ageOptions.length)%ageOptions.length;ageOptions[next].focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.parent-age'))closeAgeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!ageMenu.hidden){event.preventDefault();closeAgeMenu(true);}});
  function home(){stopBubbles();cancelGesture();clearEffects();state.activity=null;state.selected=null;const header=app.querySelector('.topbar');header.append($('sound'),$('fullscreen'));app.dataset.view='home';parentAgeControls();$('home-view').hidden=false;$('activity-view').hidden=true;$('again').hidden=true;$('show-me').hidden=true;$('bubble-tracker').hidden=true;progress(0,0);hint('Choose a picture. I’ll play with you!');}
  function levelControls(){document.querySelectorAll('[data-level]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.level)===state.level)));}
  function setLevel(level,reset=true){cancelGesture();const changed=state.level!==level;state.level=level;if(changed)state.brushSize=profile().brushSize;levelControls();save();document.querySelector('[data-activity="brush"] .card-art').innerHTML=preview('brush');if(reset&&state.activity)resetRound();else if(reset)hint(level===2?'Medium level: choose a picture and play together!':level===1?'Easy level: fewer, bigger things to try.':'Challenge level: a few more things to discover.');}
  function startActivity(id,paintMode=false){closeAgeMenu();$('game-mid-controls').append($('sound'),$('fullscreen'));state.activity=id;state.paintMode=paintMode;app.dataset.view=id;$('home-view').hidden=true;$('activity-view').hidden=false;$('again').hidden=false;$('show-me').hidden=false;$('activity-name').textContent=activities[id].title;$('step-note').textContent=activities[id].note;resetRound();}
  function resetRound(){
    stopBubbles();cancelGesture();clearEffects();state.done=false;state.selected=null;state.strokes=[];
    $('play-levels').hidden=state.activity==='abacus'&&state.age===null;$('abacus-stage').hidden=state.activity!=='abacus';
    $('bubble-score').hidden=state.activity!=='bubbles';
    $('bubble-modes').hidden=state.activity!=='bubbles';$('bubble-tracker').hidden=state.activity!=='bubbles';$('step-note').hidden=true;
    $('bubble-settings').hidden=state.activity!=='bubbles';updateBubbleSettings();
    scene.parentElement.classList.toggle('bubble-mat',state.activity==='bubbles');scene.setAttribute('viewBox','0 0 1000 440');
    $('brush-modes').hidden=state.activity!=='brush';$('paint-tools').hidden=state.activity!=='brush'||!state.paintMode;
    $('art-tools').hidden=state.activity!=='brush';
    state.erase=false;updateArtTools();
    scene.setAttribute('aria-label','Play area');
    if(state.activity==='brush')$('activity-name').textContent=`Little art studio · ${artPicture().name[0].toUpperCase()+artPicture().name.slice(1)}`;
    $('clean-mode').setAttribute('aria-pressed',String(!state.paintMode));$('paint-mode').setAttribute('aria-pressed',String(state.paintMode));
    scene.style.background='#D8B98E';
    if(state.activity==='abacus'){state.abacusRows=abacusColors.map(()=>Array(10).fill(false));state.abacusSelectedRow=0;renderAbacus();}
    else if(state.activity==='drag'){
      const count=profile().shapeCount,ys=count===2?[140,310]:count===4?[120,310]:[85,220,355];
      state.shapes=shapes.slice(0,count).map((shape,i)=>({...shape,placed:false,x:count===2?250:150+(i%2)*190,y:ys[count===2?i:Math.floor(i/2)],tx:count===2?750:660+(i%2)*190,ty:ys[count===2?i:Math.floor(i/2)]}));renderDrag();
    }else if(state.activity==='bubbles'){
      renderBubbles();
    }else if(state.activity==='slide'){
      const count=profile().sliderCount,w=count===1?400:count===2?278:232,gap=count===1?0:count===2?55:35,total=count*w+(count-1)*gap,left=(1000-total)/2;
      state.sliders=Array.from({length:count},(_,i)=>({id:i,x:left+i*(w+gap),y:42,w,h:270,value:0,friend:['fox','owl','frog'][i]}));renderSlide();
    }else if(state.paintMode){renderPaint();}else{
      const points=artPicture().dirt;
      state.dirt=points.map(([x,y],i)=>({id:i,x,y,r:state.level===3?22:29,health:profile().dirtHealth,max:profile().dirtHealth}));renderClean();
    }
    hint(state.activity==='brush'?(state.paintMode?`Pick a color and paint inside the ${artPicture().name}. SaNa will cheer you on!`:`Brush the muddy ${artPicture().name}. Give it a gentle wash.`):activities[state.activity].hint);
    updateGameNavigation();
    if(state.activity==='abacus')abacusHint();
    if(state.activity==='bubbles')hint(state.bubbleMode==='plain'?'Tap the rising bubbles. Splash, pop! They keep coming.':'Pop a bubble to color its matching item above. Find them all!');
  }
  const abacusColors=[['Red','#ff3b30'],['Orange','#ff9500'],['Yellow','#ffe500'],['Green','#35d44b'],['Blue','#2395ff'],['Indigo','#6454d9'],['Violet','#bb52ed'],['Pink','#ff8fc7'],['Brown','#b5794a'],['White','#ffffff']];
  const abacusWords=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
  const abacusCount=row=>state.abacusRows[row].filter(Boolean).length;
  const activeAbacusRow=()=>state.abacusSelectedRow??0;
  function abacusHint(){const row=activeAbacusRow(),count=abacusCount(row),suggestion=state.age===null||state.level===1?'':state.level===2?` Together, try ${profile().abacusGoal} beads in any color.`:` Together, try ${profile().abacusGoal} beads, then another color. All amounts are welcome.`;hint(`${abacusColors[row][0]}: ${count} ${abacusWords[count]} on the right. Slide beads in any row, either way!${suggestion}`);}
  function abacusGeometry(){const width=Math.max(1000,600*scene.clientWidth/Math.max(1,scene.clientHeight)),left=width*.5,start=54,end=left-35,pitch=(end-start)*.043;return {width,left,start,end,pitch,r:Math.min(21,pitch*.44)};}
  function abacusBeadPoint(row,index,g=abacusGeometry()){const count=abacusCount(row);return {x:index>=10-count?g.end-(9-index)*g.pitch:g.start+index*g.pitch,y:34+row*56};}
  function abacusLabel(row,count){return `${count} ${abacusWords[count]} ${abacusColors[row][0]}`;}
  /** Build the scene only on entry, reset or resize. Ordinary slides retain every bead node. */
  function renderAbacus(){
    if(state.activity!=='abacus'||!state.abacusRows)return;
    const g=abacusGeometry(),active=activeAbacusRow(),scale=600/Math.max(1,scene.clientHeight),font=Math.min(42,Math.max(20,14*scale));
    state.abacusSize=`${scene.clientWidth}/${scene.clientHeight}`;scene.setAttribute('viewBox',`0 0 ${g.width} 600`);scene.setAttribute('aria-label','Freely count abacus beads, rainbow and circle');
    const right=g.left+16,rw=g.width-right-12,radius=Math.min(260,rw*.32),cx=right+radius+6,base=286,circleR=Math.min(130,rw*.16),circleX=g.width-circleR-18,circleY=150,band=radius/10;
    const rainbow=abacusColors.slice(0,7).map(([name,color],i)=>{const outer=radius-i*band,inner=outer-band;return `<path data-rainbow-band="${i}" data-color-region="${i}" d="M${cx-outer} ${base}A${outer} ${outer} 0 0 1 ${cx+outer} ${base}L${cx+inner} ${base}A${inner} ${inner} 0 0 0 ${cx-inner} ${base}Z" fill="${abacusCount(i)?color:'#000'}" stroke="#90969e" stroke-width="3"/>`;}).join('');
    const circles=[[7,'outer',circleR],[9,'middle',circleR*.68],[8,'inner',circleR*.35]].map(([row,region,r])=>`<circle data-circle-region="${region}" data-color-region="${row}" cx="${circleX}" cy="${circleY}" r="${r}" fill="${abacusCount(row)?abacusColors[row][1]:'#000'}" stroke="#90969e" stroke-width="3"/>`).join('');
    scene.innerHTML=`<g id="abacus-frame"><rect x="10" y="5" width="${g.left-24}" height="586" rx="18" fill="#101010" stroke="#9b7e60" stroke-width="7"/>${abacusColors.map(([name,color],row)=>{const y=34+row*56,count=abacusCount(row);return `<g data-abacus-row="${row}"><rect data-row-highlight="${row}" x="20" y="${y-25}" width="${g.left-44}" height="50" rx="12" fill="none" stroke="${row===active?'#ffe17a':'transparent'}" stroke-width="3"/><text data-row-count="${row}" x="28" y="${y+8}" text-anchor="middle" font-size="23" fill="#fff" font-weight="900">${count}</text><path d="M${g.start-g.r} ${y}H${g.end+g.r}" stroke="#90969e" stroke-width="4"/><circle data-abacus-start="${row}" cx="${g.start}" cy="${y}" r="${g.r+2}" fill="none" stroke="#555" stroke-width="3" stroke-dasharray="5 5"/><circle data-abacus-destination="${row}" cx="${g.end}" cy="${y}" r="${g.r+2}" fill="none" stroke="#777" stroke-width="3" stroke-dasharray="5 5"/>${state.abacusRows[row].map((moved,index)=>{const p=abacusBeadPoint(row,index,g);return `<g data-bead-row="${row}" data-bead-index="${index}" data-moved="${moved}" transform="translate(${p.x} ${p.y})" role="button" aria-label="${name} bead ${index+1}" aria-disabled="false" tabindex="${index===9-count||index===10-count?'0':'-1'}"><circle r="${g.r}" fill="${color}" stroke="#ffffffb0" stroke-width="1.5"/><path d="M${-g.r*.45} ${-g.r*.48}L${g.r*.05} ${-g.r*.7}" stroke="white" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/></g>`;}).join('')}</g>`;}).join('')}</g><path d="M${g.left} 12V588" stroke="#555" stroke-width="2"/><g id="rainbow-picture" role="img" aria-label="Rainbow bands fill with the colors counted">${rainbow}</g><g id="circle-picture" role="img" aria-label="Pink outer circle, white middle circle, brown center">${circles}</g><g id="abacus-labels"><rect data-abacus-label-panel x="${right+4}" y="311" width="${rw-8}" height="276" rx="17" fill="#30343b" stroke="#a8adb4" stroke-width="4"/>${abacusColors.map(([name,color],row)=>`<text data-color-label="${row}" x="${right+16+(row<5?0:rw*.52)}" y="${348+(row%5)*51}" fill="${color}" stroke="#111820" stroke-width="${Math.max(1.2,font*.065)}" paint-order="stroke fill" stroke-linejoin="round" font-size="${font}" font-weight="900" font-family="inherit">${abacusLabel(row,abacusCount(row))}</text>`).join('')}</g>`;
    state.abacusElements=abacusColors.map((_,row)=>({beads:[...scene.querySelectorAll(`[data-bead-row="${row}"]`)],region:scene.querySelector(`[data-color-region="${row}"]`),label:scene.querySelector(`[data-color-label="${row}"]`),count:scene.querySelector(`[data-row-count="${row}"]`),highlight:scene.querySelector(`[data-row-highlight="${row}"]`)}));
    updateAbacusProgress();updateAbacusFeedback(active);
  }
  function updateAbacusFeedback(row,count=abacusCount(row),reveal=false){
    const nodes=state.abacusElements[row];if(!nodes)return;
    nodes.region.setAttribute('fill',count?abacusColors[row][1]:'#000');nodes.count.textContent=String(count);nodes.label.textContent=abacusLabel(row,count);
    nodes.label.classList.toggle('abacus-pop',reveal);
    $('result-score').textContent=`${abacusColors[row][0]}: ${count} ${abacusWords[count]}`;
    state.abacusElements.forEach((item,i)=>item.highlight.setAttribute('stroke',i===row?'#ffe17a':'transparent'));
  }
  function restoreAbacusRow(row){const g=abacusGeometry(),count=abacusCount(row);state.abacusElements[row].beads.forEach((node,index)=>{const p=abacusBeadPoint(row,index,g);node.setAttribute('transform',`translate(${p.x} ${p.y})`);node.dataset.moved=String(index>=10-count);node.setAttribute('tabindex',index===9-count||index===10-count?'0':'-1');});}
  function updateAbacusProgress(){progress(state.abacusRows.filter((_,row)=>abacusCount(row)>0).length,10);}
  function setAbacusCount(row,count){
    const previous=abacusCount(row);state.abacusSelectedRow=row;
    if(previous===count){restoreAbacusRow(row);updateAbacusFeedback(row);return;}
    state.abacusRows[row]=Array.from({length:10},(_,index)=>index>=10-count);
    restoreAbacusRow(row);updateAbacusProgress();updateAbacusFeedback(row,count,!previous&&!!count);tone(520+count*20);
    const complete=state.abacusRows.every((_,index)=>abacusCount(index)>0);
    if(complete&&!state.done){celebrate('Wonderful counting! SaNa loves your rainbow and circle!');$('art-reward').hidden=false;applause();}
    else{if(!complete&&state.done){state.done=false;clearEffects();}abacusHint();}
  }
  function finishAbacusBead(row,index,toRight=true){const count=abacusCount(row);setAbacusCount(row,toRight?Math.max(count,10-index):Math.min(count,9-index));}
  function beginAbacusSlide(point,id){
    const g=abacusGeometry(),row=Math.round((point.y-34)/56);if(row<0||row>9||Math.abs(point.y-(34+row*56))>27)return null;
    const positions=Array.from({length:10},(_,index)=>abacusBeadPoint(row,index,g).x);
    let index=0;for(let i=1;i<10;i++)if(Math.abs(positions[i]-point.x)<Math.abs(positions[index]-point.x))index=i;
    if(Math.abs(positions[index]-point.x)>Math.max(24,g.pitch*.8))return null;
    state.abacusSelectedRow=row;updateAbacusFeedback(row);
    return {id,kind:'abacus',row,index,g,matrix:scene.getScreenCTM().inverse(),x:positions[index],y:34+row*56,dx:point.x-positions[index],positions,drawn:[...positions],original:abacusCount(row),preview:abacusCount(row),right:!state.abacusRows[row][index],elements:state.abacusElements[row].beads};
  }
  /** Push neighbouring beads without passing them; cache geometry and nodes for the whole gesture. */
  function moveAbacusSlide(pointer,point){
    const {g,index}=pointer,left=g.start+index*g.pitch,right=g.end-(9-index)*g.pitch;
    pointer.x=Math.max(left,Math.min(right,point.x-pointer.dx));
    pointer.elements.forEach((node,i)=>{const x=i>index?Math.max(pointer.positions[i],pointer.x+(i-index)*g.pitch):i<index?Math.min(pointer.positions[i],pointer.x-(index-i)*g.pitch):pointer.x;if(x!==pointer.drawn[i]){node.setAttribute('transform',`translate(${x} ${pointer.y})`);pointer.drawn[i]=x;}});
    const across=pointer.right?pointer.x>=(left+right)/2:pointer.x<=(left+right)/2;
    const count=across?(pointer.right?10-index:9-index):pointer.original;
    if(count!==pointer.preview){pointer.preview=count;updateAbacusFeedback(pointer.row,count);}
  }
  new ResizeObserver(()=>{if(state.activity==='abacus'&&state.abacusSize!==`${scene.clientWidth}/${scene.clientHeight}`){cancelGesture();renderAbacus();}}).observe(scene);
  function renderDrag(){
    const done=state.shapes.filter(shape=>shape.placed).length;
    scene.innerHTML=`<path d="M500 36V404" stroke="#d3dfcd" stroke-width="3" stroke-dasharray="8 13"/><path d="M465 216H531M517 204L531 216L517 228" stroke="#bdcdb7" stroke-width="5" fill="none" stroke-linecap="round"/>`+state.shapes.map(shape=>`<g class="target" data-target="${shape.id}" transform="translate(${shape.tx} ${shape.ty})" role="button" tabindex="0" aria-label="${shape.id} shadow"><g opacity="${shape.placed?'.15':'.6'}">${primitive(shape.id,'#fbfcf2','#b3c6ae')}</g>${!shape.placed?`<text y="83" text-anchor="middle" fill="#7f9279" font-size="16" font-family="inherit">${shape.id}</text>`:''}</g>`).join('')+state.shapes.map(shape=>`<g ${shape.placed?`data-placed="${shape.id}"`:`data-piece="${shape.id}" role="button" tabindex="0" aria-label="${shape.id} shape"`} class="piece ${state.selected===shape.id?'selected':''}" transform="translate(${shape.placed?shape.tx:shape.x} ${shape.placed?shape.ty:shape.y})">${primitive(shape.id,shape.color)}${face(0,shape.id==='triangle'?12:0)}${shape.placed?'<path d="M35-53L44-43L62-64" fill="none" stroke="#2b7b59" stroke-width="6" stroke-linecap="round"/>':''}</g>`).join('');
    progress(done,state.shapes.length);
  }
  function matchShape(id){const shape=state.shapes.find(item=>item.id===id);if(!shape||shape.placed)return;shape.placed=true;state.selected=null;renderDrag();tone(640);if(state.shapes.every(item=>item.placed))celebrate('Lovely matching! Every shape found its little home.');else hint('A perfect fit! Find another little shape.');}
  const activeBubble=()=>state.bubbles.find(bubble=>bubble.element?.dataset.onstage==='true');
  function stopBubbles(){if(bubbleFrame!==null)cancelAnimationFrame(bubbleFrame);bubbleFrame=null;lastBubbleTime=0;}
  function bubbleTracker(){
    const mode={...bubbleModes[state.bubbleMode],items:bubbleItems()};
    if(state.bubbleMode==='numbers')mode.label=`1–${mode.items.length}`;else if(state.bubbleMode==='letters')mode.label=`A–${mode.items.at(-1)}`;
    $('bubble-score').textContent=state.bubbleMode==='plain'?`Popped ${state.bubblePops}`:`${mode.label} · ${state.bubbleHits.size}/${mode.items.length}`;
    $('bubble-targets').innerHTML=mode.items.length?mode.items.map(token=>{
      const color=state.bubbleHits.get(token);
      const content=state.bubbleMode==='shapes'?`<svg viewBox="-68 -68 136 136" aria-hidden="true">${primitive(token,'none')}</svg>`:token;
      return `<span class="bubble-target" role="listitem" data-bubble-target="${token}" data-collected="${!!color}" style="${color?`background-color:${color}`:''}" aria-label="${token}${color?' popped':' not popped'}">${content}</span>`;
    }).join(''):state.bubbleRecent.map(color=>`<i class="pop-dot" style="background:${color}" aria-hidden="true"></i>`).join('');
    document.querySelectorAll('[data-bubble-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleMode===state.bubbleMode)));
    const numbers=bubbleItems('numbers'),letters=bubbleItems('letters');document.querySelector('[data-bubble-mode="numbers"]').textContent=`1–${numbers.length}`;document.querySelector('[data-bubble-mode="letters"]').textContent=`A–${letters.at(-1)}`;
    $('bubble-full-set').hidden=state.age===null;$('bubble-full-set').setAttribute('aria-pressed',String(state.bubbleSet==='full'));
  }
  function fitBubbleField(){
    const width=Math.max(600,440*scene.clientWidth/Math.max(1,scene.clientHeight));
    if(Math.abs(width-state.bubbleWidth)>.5){
      const ratio=width/state.bubbleWidth;state.bubbles.forEach(bubble=>{bubble.x*=ratio;});state.bubbleWidth=width;
    }
    if(Math.abs(scene.viewBox.baseVal.width-width)>.5)scene.setAttribute('viewBox',`0 0 ${width.toFixed(1)} 440`);
    const radius=bubbleRadius();
    state.bubbles.forEach(bubble=>{if(bubble.element&&Math.abs(bubble.r-radius)>.1){bubble.r=radius;drawBubble(bubble);positionBubble(bubble);}});
  }
  function updateBubbleSettings(){
    document.querySelectorAll('[data-bubble-speed]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleSpeed===selectedBubbleSpeed())));
    document.querySelectorAll('[data-bubble-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bubbleSize===selectedBubbleSize())));
  }
  // Keep touch sizes useful across phone/tablet layouts and fit short play fields.
  function bubbleRadius(){return Math.max(14,Math.min(196,bubbleDiameters[selectedBubbleSize()]*220/Math.max(1,scene.clientHeight)));}
  function positionBubble(bubble){
    if(!bubble.element)return;
    bubble.x=Math.max(bubble.r+4,Math.min(state.bubbleWidth-bubble.r-4,bubble.x));
    bubble.element.setAttribute('transform',`translate(${bubble.x.toFixed(1)} ${bubble.y.toFixed(1)})`);
    const onstage=bubble.y>=bubble.r&&bubble.y<=440-bubble.r;
    if(bubble.element.dataset.onstage!==String(onstage)){
      bubble.element.dataset.onstage=String(onstage);bubble.element.setAttribute('tabindex',onstage?'0':'-1');bubble.element.setAttribute('aria-hidden',String(!onstage));
    }
  }
  function spawnBubble(bubble,initial=false){
    const items=bubbleItems();
    const missing=items.filter(token=>!state.bubbleHits.has(token));
    const available=(missing.length?missing:items).filter(token=>!state.bubbles.some(other=>other!==bubble&&other.element&&other.token===token));
    const pool=available.length?available:missing.length?missing:items;
    bubble.token=pool.length?pool[Math.floor(Math.random()*pool.length)]:'';
    bubble.id=++state.bubbleSerial;bubble.color=bubbleColors[Math.floor(Math.random()*bubbleColors.length)];bubble.r=bubbleRadius();
    const lane=state.bubbleWidth/state.bubbles.length;
    bubble.x=Math.max(bubble.r+4,Math.min(state.bubbleWidth-bubble.r-4,(bubble.slot+.5+(Math.random()-.5)*.3)*lane));
    bubble.y=initial?Math.max(bubble.r+5,Math.min(435-bubble.r,135+(bubble.slot%3)*100+Math.random()*12)):440+bubble.r+8;bubble.wait=0;
    const element=document.createElementNS('http://www.w3.org/2000/svg','g');bubble.element=element;
    element.classList.add('bubble');element.dataset.bubble=String(bubble.id);element.dataset.token=bubble.token;element.dataset.color=bubble.color;
    element.setAttribute('role','button');element.setAttribute('aria-label',`Pop ${bubble.token||'plain'} bubble`);
    drawBubble(bubble);
    $('bubble-layer').appendChild(element);positionBubble(bubble);
  }
  function drawBubble(bubble){
    const content=state.bubbleMode==='plain'?`<g transform="scale(${bubble.r/68})">${face(0,8)}</g>`:state.bubbleMode==='shapes'?`<g transform="scale(${bubble.r/95})">${primitive(bubble.token,'none','#29463e')}</g>`:`<text text-anchor="middle" dominant-baseline="central" font-family="inherit" font-size="${bubble.r*(bubble.token.length===2?.9:1.1)}" font-weight="900" fill="#29463e">${bubble.token}</text>`;
    bubble.element.innerHTML=`<circle r="${bubble.r}" fill="${bubble.color}" stroke="#fffdf3" stroke-width="${bubble.r*.07}"/><circle r="${bubble.r*.83}" fill="none" stroke="white" stroke-opacity=".35" stroke-width="${bubble.r*.04}"/><path d="M${-bubble.r*.56} ${-bubble.r*.38}Q${-bubble.r*.45} ${-bubble.r*.72} ${-bubble.r*.1} ${-bubble.r*.74}" fill="none" stroke="white" stroke-width="${bubble.r*.1}" stroke-linecap="round" opacity=".8"/>${content}`;
  }
  function renderBubbles(){
    state.bubbleHits=new Map();state.bubblePops=0;state.bubbleRecent=[];state.bubbleEffects=[];
    state.bubbles=[];bubbleTracker();fitBubbleField();
    scene.innerHTML='<g id="bubble-layer"></g><g id="splash-layer" pointer-events="none"></g>';scene.setAttribute('aria-label','Rising bubbles');
    state.bubbles=Array.from({length:profile().bubbleCount},(_,slot)=>({slot,element:null}));
    state.bubbles.forEach(bubble=>spawnBubble(bubble,true));progress(0,0);bubbleFrame=requestAnimationFrame(bubbleTick);
  }
  function bubbleTick(now){
    if(state.activity!=='bubbles'||document.hidden){bubbleFrame=null;return;}
    bubbleFrame=requestAnimationFrame(bubbleTick);
    const elapsed=lastBubbleTime?Math.min(.05,(now-lastBubbleTime)/1000):0;lastBubbleTime=now;
    fitBubbleField();
    for(const bubble of state.bubbles){
      if(!bubble.element){bubble.wait-=elapsed;if(bubble.wait<=0)spawnBubble(bubble);continue;}
      bubble.y-=elapsed*bubbleSpeeds[selectedBubbleSpeed()];
      if(bubble.y < -bubble.r){bubble.element.remove();bubble.element=null;spawnBubble(bubble);}
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
    if(!bubble?.element)return;
    const focused=document.activeElement===bubble.element;
    const splash=document.createElementNS('http://www.w3.org/2000/svg','g');splash.dataset.splash='';splash.setAttribute('transform',`translate(${bubble.x} ${bubble.y})`);splash.setAttribute('fill',bubble.color);
    splash.innerHTML=Array.from({length:8},()=>'<circle r="9"/>').join('');$('splash-layer').appendChild(splash);
    state.bubbleEffects.push({element:splash,drops:[...splash.children],age:0,radius:bubble.r*.85});
    bubble.element.remove();bubble.element=null;bubble.wait=.6;state.bubblePops++;state.bubbleRecent=[...state.bubbleRecent.slice(-7),bubble.color];
    if(bubble.token)state.bubbleHits.set(bubble.token,bubble.color);bubbleTracker();tone(450+(bubble.id%8)*55);
    if(focused)activeBubble()?.element.focus();
    if(state.bubbleMode==='plain'){
      if(state.bubblePops%10===0)celebrate('Pop, pop, hooray! SaNa says well done. Keep popping!');
      else hint(`Splash, pop! ${state.bubblePops} ${state.bubblePops===1?'bubble':'bubbles'} popped. Keep going!`);
    }else if(state.bubbleHits.size===bubbleItems().length&&!state.done){
      celebrate(`SaNa says hooray! You found all the ${state.bubbleMode==='numbers'?'numbers':state.bubbleMode==='letters'?'letters':'shapes'}. Keep popping!`);
    }else if(!state.done)hint(`Splash! ${bubble.token} is now the same color above. Keep looking!`);
  }

  function renderSlide(){
    scene.innerHTML=`<defs>${state.sliders.map(s=>`<clipPath id="window${s.id}"><rect x="${s.x+6}" y="${s.y+6}" width="${s.w-12}" height="${s.h-12}" rx="20"/></clipPath>`).join('')}</defs>`+state.sliders.map(s=>`<g><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="25" fill="#fffaf0" stroke="#b5cbb9" stroke-width="5"/><g clip-path="url(#window${s.id})"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${['#f2e7c9','#e0e5ef','#d9ead8'][s.id]}"/>${friend(s.friend,s.x+s.w/2,s.y+s.h*.54,Math.min(1.25,s.w/220))}<rect data-curtain="${s.id}" x="${s.x+s.value*s.w}" y="${s.y}" width="${(1-s.value)*s.w}" height="${s.h}" fill="#8cb8be"/><path data-curtain-pattern="${s.id}" d="M${s.x+s.value*s.w+20} ${s.y+10}V${s.y+s.h-10}" stroke="#b5d2d2" stroke-width="10" opacity=".5"/></g><line data-slider-track="${s.id}" x1="${s.x+25}" y1="${s.y+s.h+53}" x2="${s.x+s.w-25}" y2="${s.y+s.h+53}" stroke="#c6d3c1" stroke-width="14" stroke-linecap="round"/><g class="slider-handle" data-slider-handle="${s.id}" transform="translate(${s.x+25+s.value*(s.w-50)} ${s.y+s.h+53})" role="slider" tabindex="0" aria-label="Reveal ${s.friend}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s.value*100)}"><circle r="29" fill="#f3ce67" stroke="#bc9d49" stroke-width="3"/>${face(0,-1)}<path d="M-12 17H12" stroke="#bd9d43" stroke-width="2"/></g></g>`).join('');
    progress(state.sliders.filter(s=>s.value===1).length,state.sliders.length);
  }
  function slideTo(slider,x){
    const value=Math.max(0,Math.min(1,(x-slider.x-25)/(slider.w-50)));
    slider.value=value>.92?1:value;
    const curtain=scene.querySelector(`[data-curtain="${slider.id}"]`),pattern=scene.querySelector(`[data-curtain-pattern="${slider.id}"]`),handle=scene.querySelector(`[data-slider-handle="${slider.id}"]`);
    curtain.setAttribute('x',slider.x+slider.value*slider.w);curtain.setAttribute('width',(1-slider.value)*slider.w);pattern.style.opacity=slider.value===1?'0':'.5';
    pattern.setAttribute('d',`M${slider.x+slider.value*slider.w+20} ${slider.y+10}V${slider.y+slider.h-10}`);
    handle.setAttribute('transform',`translate(${slider.x+25+slider.value*(slider.w-50)} ${slider.y+slider.h+53})`);handle.setAttribute('aria-valuenow',Math.round(slider.value*100));
    progress(state.sliders.filter(s=>s.value===1).length,state.sliders.length);
    if(state.sliders.every(s=>s.value===1)&&!state.done)celebrate('You found our friends! Peek-a-boo, little one.');
    else if(state.sliders.some(s=>s.value<1)&&state.done){state.done=false;hint('Peek-a-boo! Slide the sunny handles to find our friends again.');}
  }
  function renderClean(){
    scene.setAttribute('aria-label',`Clean the ${artPicture().name}`);
    scene.innerHTML=`<ellipse cx="511" cy="395" rx="229" ry="15" fill="#e2d5bc"/>${pictureArt()}<g id="dirt-layer">${state.dirt.filter(d=>d.health>0).map(d=>`<g data-dirt="${d.id}" opacity="${.68*d.health/d.max}"><path d="M${d.x-d.r} ${d.y}q-5 ${-d.r} ${d.r} ${-d.r*.8}q${d.r} ${-d.r*.4} ${d.r} ${d.r*.8}q8 ${d.r} ${-d.r} ${d.r*.8}q${-d.r} ${d.r*.5} ${-d.r} ${-d.r*.8}" fill="#92785d"/><circle cx="${d.x-6}" cy="${d.y-4}" r="4" fill="#77654f"/></g>`).join('')}</g>`;
    progress(state.dirt.filter(d=>d.health<=0).length,state.dirt.length);
  }
  function renderPaint(){
    scene.setAttribute('aria-label',`Paint the ${artPicture().name}`);
    scene.innerHTML=`<defs><clipPath id="picture-clip">${artPicture().region}</clipPath></defs><rect id="paint-paper" x="126" y="20" width="748" height="400" rx="26" fill="#fffdf5" stroke="#d8c8a6" stroke-width="4"/><g id="strokes" clip-path="url(#picture-clip)"></g><g opacity=".55" pointer-events="none">${pictureArt(true)}</g><path d="M147 46L160 33M837 405L852 391" stroke="#debb7c" stroke-width="5" stroke-linecap="round"/>`;
    state.coverage=[];
    for(let y=70;y<390;y+=14)for(let x=260;x<745;x+=14)if(insidePicture({x,y}))state.coverage.push({x,y,painted:false});
    progress(0,5);
  }
  function insidePicture(point){return [...scene.querySelectorAll('#picture-clip > *')].some(shape=>shape.isPointInFill(new DOMPoint(point.x,point.y)));}
  function updateArtTools(){
    document.querySelectorAll('[data-brush-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.brushSize===state.brushSize)));
    $('erase-paint').setAttribute('aria-pressed',String(state.erase));
    document.querySelectorAll('[data-paint]').forEach(button=>button.setAttribute('aria-pressed',String(!state.erase&&button.dataset.paint===state.paintColor)));
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
    if(fraction>=artPicture().target&&!state.done){celebrate(`Congratulations from SaNa! You painted a beautiful ${artPicture().name}!`);$('art-reward').hidden=false;applause();}
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
    if(state.dirt.every(d=>d.health<=0))celebrate(`All clean! What a happy, shiny ${artPicture().name}.`);
    else if(distance>3)tone(520);
  }
  function brushCursor(point){
    let cursor=scene.querySelector('#brush-cursor');
    if(!cursor){cursor=document.createElementNS('http://www.w3.org/2000/svg','g');cursor.id='brush-cursor';cursor.style.pointerEvents='none';cursor.innerHTML='<circle r="39" fill="#d7edf1" opacity=".25"/><g transform="translate(28 10) rotate(25)"><rect x="-8" y="-50" width="16" height="58" rx="8" fill="#6a9a83"/><rect x="-23" y="0" width="46" height="34" rx="7" fill="#f2ddb4" stroke="#c9aa7d" stroke-width="3"/><path d="M-12 23V34M0 23V34M12 23V34" stroke="#bb996f" stroke-width="3"/></g>';scene.appendChild(cursor);}
    cursor.setAttribute('transform',`translate(${point.x} ${point.y}) scale(${{small:.6,medium:1,large:1.4}[state.brushSize]})`);
  }
  function localPoint(event){const matrix=scene.getScreenCTM();if(!matrix)return null;return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());}
  function hitBubble(point,id){const candidates=state.bubbles.filter(b=>b.element&&Math.hypot(point.x-b.x,point.y-b.y)<b.r+8);const bubble=candidates.find(b=>String(b.id)===id)||candidates.toSorted((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];if(bubble)popBubble(bubble);}
  function pointerDown(event){
    if(state.pointer||event.button>0||!state.activity)return;
    const point=localPoint(event);if(!point)return;
    scene.querySelector('[data-guide]')?.remove();
    if(state.activity==='abacus'){
      state.pointer=beginAbacusSlide(point,event.pointerId);if(!state.pointer)return;
    }else if(state.activity==='drag'){
      if(state.done)return;
      const target=event.target.closest('[data-target]');
      if(target&&state.selected===target.dataset.target){matchShape(state.selected);event.preventDefault();return;}
      const item=event.target.closest('[data-piece]');if(!item)return;
      const shape=state.shapes.find(s=>s.id===item.dataset.piece);state.selected=shape.id;
      state.pointer={id:event.pointerId,kind:'drag',shape,dx:point.x-shape.x,dy:point.y-shape.y,x:shape.x,y:shape.y};
      item.classList.add('selected');
    }else if(state.activity==='bubbles'){
      state.pointer={id:event.pointerId,kind:'bubble'};hitBubble(point,event.target.closest('[data-bubble]')?.dataset.bubble);
    }else if(state.activity==='slide'){
      const handle=event.target.closest('[data-slider-handle]');if(!handle)return;
      const slider=state.sliders.find(s=>s.id===Number(handle.dataset.sliderHandle));state.pointer={id:event.pointerId,kind:'slide',slider};slideTo(slider,point.x);
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
    if(pointer.kind==='abacus')moveAbacusSlide(pointer,point);
    else if(pointer.kind==='drag'){
      pointer.x=Math.max(60,Math.min(940,point.x-pointer.dx));pointer.y=Math.max(60,Math.min(380,point.y-pointer.dy));
      scene.querySelector(`[data-piece="${pointer.shape.id}"]`)?.setAttribute('transform',`translate(${pointer.x} ${pointer.y})`);
    }else if(pointer.kind==='bubble')hitBubble(point);
    else if(pointer.kind==='slide')slideTo(pointer.slider,point.x);
    else if(pointer.kind==='paint'){
      pointer.d+=` L${point.x.toFixed(1)} ${point.y.toFixed(1)}`;pointer.paths.forEach(path=>path.setAttribute('d',pointer.d));paintCoverage(pointer,point);pointer.last=point;
    }else{
      const distance=Math.hypot(point.x-pointer.last.x,point.y-pointer.last.y);if(distance>.5){brushAt(point,distance);pointer.last=point;}brushCursor(point);
    }
  }
  function pointerUp(event){
    const pointer=state.pointer;if(!pointer||pointer.id!==event.pointerId)return;
    state.pointer=null;
    try{if(scene.hasPointerCapture(event.pointerId))scene.releasePointerCapture(event.pointerId);}catch{/* Already released. */}
    if(pointer.kind==='abacus'){moveAbacusSlide(pointer,new DOMPoint(event.clientX,event.clientY).matrixTransform(pointer.matrix));setAbacusCount(pointer.row,pointer.preview);}
    else if(pointer.kind==='drag'){
      const distance=Math.hypot(pointer.x-pointer.shape.tx,pointer.y-pointer.shape.ty);
      if(distance<profile().snapDistance)matchShape(pointer.shape.id);
      else{renderDrag();hint('This shape has a little home. Try its matching shadow.');}
    }else if(pointer.kind==='paint'&&!state.done)hint(pointer.erase?'All tidy! Choose a color to paint again.':`Lovely colors! Keep coloring the ${artPicture().name}. SaNa is watching!`);
    scene.querySelector('#brush-cursor')?.remove();
  }
  scene.addEventListener('pointerdown',pointerDown);scene.addEventListener('pointermove',pointerMove);scene.addEventListener('pointerup',pointerUp);scene.addEventListener('pointercancel',cancelGesture);scene.addEventListener('lostpointercapture',()=>{if(state.pointer)cancelGesture();});scene.addEventListener('contextmenu',e=>e.preventDefault());
  scene.addEventListener('keydown',event=>{
    const piece=event.target.closest('[data-piece]'),target=event.target.closest('[data-target]'),bubble=event.target.closest('[data-bubble]'),handle=event.target.closest('[data-slider-handle]');
    const bead=event.target.closest('[data-bead-row]');
    if(bead&&['ArrowRight','ArrowLeft','End','Home','Enter',' '].includes(event.key)){
      event.preventDefault();const row=Number(bead.dataset.beadRow),index=Number(bead.dataset.beadIndex),right=['ArrowRight','End'].includes(event.key)||(['Enter',' '].includes(event.key)&&!state.abacusRows[row][index]);
      finishAbacusBead(row,index,right);const count=abacusCount(row),focus=right?Math.max(0,9-count):Math.min(9,10-count);state.abacusElements[row].beads[focus]?.focus();
    }
    else if(handle&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
      event.preventDefault();const slider=state.sliders[Number(handle.dataset.sliderHandle)];const value=event.key==='End'?1:event.key==='Home'?0:slider.value+(event.key==='ArrowRight' ? .15 : -.15);slideTo(slider,slider.x+25+value*(slider.w-50));
    }else if(event.key==='Enter'||event.key===' '){
      event.preventDefault();if(piece){state.selected=piece.dataset.piece;renderDrag();hint('Now choose the matching shadow.');scene.querySelector(`[data-target="${state.selected}"]`)?.focus();}
      else if(target&&target.dataset.target===state.selected)matchShape(state.selected);
      else if(bubble)popBubble(state.bubbles.find(item=>item.id===Number(bubble.dataset.bubble)));
    }
  });
  function showMe(){
    clearTimeout(guideTimer);scene.querySelector('[data-guide]')?.remove();let x=460,y=190;
    if(state.activity==='abacus'){const row=activeAbacusRow();if(row>=0){const count=abacusCount(row),p=abacusBeadPoint(row,count===10?0:9-count);x=p.x;y=p.y;}abacusHint();}
    else if(state.activity==='drag'){const shape=state.shapes.find(s=>!s.placed);if(shape){x=shape.x+10;y=shape.y+20;}hint('Touch a shape, hold it, and move it to the same shadow.');}
    else if(state.activity==='bubbles'){const bubble=activeBubble();if(bubble){x=bubble.x+5;y=bubble.y+10;}hint(state.bubbleMode==='plain'?'Touch a rising bubble with one finger. Splash, pop!':'Touch a rising bubble. Its matching item above will turn the same color!');}
    else if(state.activity==='slide'){const s=state.sliders.find(s=>s.value<1)||state.sliders[0];x=s.x+30+s.value*(s.w-50);y=s.y+s.h+45;hint('Hold a sunny handle. Slide it along its path.');}
    else hint(state.paintMode?`Hold one finger inside the ${artPicture().name} and move it. Choose a size or erase to tidy up!`:`Rub a muddy spot back and forth. Watch the ${artPicture().name} get clean!`);
    const hand=document.createElementNS('http://www.w3.org/2000/svg','g');hand.dataset.guide='';hand.setAttribute('transform',`translate(${x} ${y})`);hand.innerHTML='<g class="guide-hand"><circle r="26" fill="white" opacity=".8"/><use href="#hand-icon" x="-13" y="-14" width="49" height="49" fill="#4b7d68"/></g>';hand.style.pointerEvents='none';scene.appendChild(hand);guideTimer=setTimeout(()=>hand.remove(),4200);
  }
  $('home').addEventListener('click',home);$('again').addEventListener('click',resetRound);$('show-me').addEventListener('click',showMe);
  document.querySelectorAll('[data-activity]').forEach(button=>button.addEventListener('click',()=>{tone(500);startActivity(button.dataset.activity);}));
  document.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>setLevel(Number(button.dataset.level))));
  document.querySelectorAll('[data-bubble-mode]').forEach(button=>button.addEventListener('click',()=>{state.bubbleMode=button.dataset.bubbleMode;resetRound();}));
  $('bubble-full-set').addEventListener('click',()=>{state.bubbleSet=state.bubbleSet==='full'?'starter':'full';save();resetRound();});
  document.querySelectorAll('[data-bubble-speed]').forEach(button=>button.addEventListener('click',()=>{state.bubbleSpeed=button.dataset.bubbleSpeed;updateBubbleSettings();save();}));
  document.querySelectorAll('[data-bubble-size]').forEach(button=>button.addEventListener('click',()=>{state.bubbleSize=button.dataset.bubbleSize;updateBubbleSettings();fitBubbleField();save();}));
  $('paint-mode').addEventListener('click',()=>{state.paintMode=true;resetRound();});$('clean-mode').addEventListener('click',()=>{state.paintMode=false;resetRound();});
  document.querySelectorAll('[data-paint]').forEach(button=>button.addEventListener('click',()=>{cancelGesture();state.erase=false;state.paintColor=button.dataset.paint;updateArtTools();tone(620);}));
  document.querySelectorAll('[data-brush-size]').forEach(button=>button.addEventListener('click',()=>{cancelGesture();state.brushSize=button.dataset.brushSize;updateArtTools();}));
  $('erase-paint').addEventListener('click',()=>{cancelGesture();state.erase=!state.erase;updateArtTools();hint(state.erase?'Rub over the paint to erase. The picture stays safe.':`Choose a color and paint inside the ${artPicture().name}.`);});
  function soundButton(){$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'Sound on':'Sound off');$('sound').style.opacity='1';}
  $('sound').addEventListener('click',()=>{state.sound=!state.sound;save();soundButton();if(state.sound)tone(600);else if(audio?.state==='running')audio.suspend().catch(()=>{});});
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
  function immersiveMode(active){
    cancelGesture();app.classList.toggle('immersive',active);
    const button=$('fullscreen'),label=active?'Exit fullscreen':'Fullscreen';
    button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(active));button.title=label;
    button.querySelector('use').setAttribute('href',active?'#exit-fullscreen-icon':'#fullscreen-icon');
    if(!active)button.focus({preventScroll:true});
    fitFrame();
  }
  const gameSteps=()=>Object.keys(activities).flatMap(activity=>(activity==='abacus'&&state.age===null?[1]:[1,2,3]).flatMap(level=>(activity==='bubbles'?['plain','numbers','letters','shapes']:activity==='brush'?['clean','paint']:['']).map(mode=>({activity,level,mode}))));
  function currentStep(){return gameSteps().findIndex(step=>step.activity===state.activity&&((state.activity==='abacus'&&state.age===null)||step.level===state.level)&&step.mode===(state.activity==='bubbles'?state.bubbleMode:state.activity==='brush'?(state.paintMode?'paint':'clean'):''));}
  function stepLabel(step){return step?`${activities[step.activity].title} · ${['','Easy','Medium','Challenge'][step.level]}${step.mode?' · '+(bubbleModes[step.mode]?.label||step.mode):''}`:'Games';}
  function updateGameNavigation(){const index=currentStep(),steps=gameSteps();for(const [id,direction] of [['game-back',-1],['game-front',1]]){$(id).title=stepLabel(steps[index+direction]);$(id).setAttribute('aria-description',$(id).title);}}
  function gameMenu(){immersiveMode(false);home();$('home').focus({preventScroll:true});}
  function stepGame(direction){const next=gameSteps()[currentStep()+direction];if(!next){void gameMenu();return;}setLevel(next.level,false);if(next.activity==='bubbles')state.bubbleMode=next.mode;startActivity(next.activity,next.mode==='paint');}
  $('game-back').addEventListener('click',()=>stepGame(-1));$('game-front').addEventListener('click',()=>stepGame(1));$('game-home').addEventListener('click',gameMenu);
  // Expand inside the page to keep browser-owned fullscreen notices out of play.
  $('fullscreen').addEventListener('click',()=>immersiveMode(!app.classList.contains('immersive')));
  document.addEventListener('fullscreenchange',fitFrame);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&app.classList.contains('immersive'))immersiveMode(false);});
  window.addEventListener('resize',fitFrame);window.visualViewport?.addEventListener('resize',fitFrame);window.addEventListener('orientationchange',fitFrame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBubbles();cancelGesture();if(audio?.state==='running')audio.suspend().catch(()=>{});}else if(state.activity==='bubbles'&&bubbleFrame===null)bubbleFrame=requestAnimationFrame(bubbleTick);});
  window.addEventListener('pagehide',()=>{stopBubbles();cancelGesture();clearEffects();if(audio?.state==='running')audio.suspend().catch(()=>{});});
  levelControls();soundButton();home();fitFrame();
  // Installed phones may support orientation preferences without native fullscreen.
  if((navigator.userAgentData?.mobile===true||/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<600))&&(navigator.standalone||matchMedia('(display-mode:standalone)').matches)){
    try{Promise.resolve(screen.orientation?.lock?.('landscape')).catch(()=>{});}catch{/* The existing landscape frame is the fallback. */}
  }
})();
