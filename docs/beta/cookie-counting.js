(() => {
  'use strict';

  const shapes={
    Round:'M3 32a29 29 0 1 0 58 0a29 29 0 1 0-58 0Z',
    Star:'M32 3 42 17 60 18 50 33 53 58 32 53 11 58 14 33 4 18 22 17Z',
    Heart:'M32 61C25 58 3 36 3 19C3 5 22 1 32 15C42 1 61 5 61 19C61 36 39 58 32 61Z',
    Bear:'M13 19C2 8 16-2 25 11Q32 8 39 11C48-2 62 8 51 19C66 39 54 60 32 60C10 60-2 39 13 19Z',
    Bunny:'M12 34C8 26 7 4 14 3C21 2 23 18 25 23Q32 20 39 23C41 18 43 2 50 3C57 4 56 26 52 34C62 49 52 61 32 61C12 61 2 49 12 34Z',
    Moon:'M49 8C28 -5 6 9 3 30C0 50 17 64 38 60Q55 58 61 44C43 51 35 40 36 29Q36 14 49 8Z',
    Fish:'M44 20L59 12V52L44 44C27 58 9 52 3 33C9 14 27 7 44 20Z',
    Butterfly:'M30 21C17 0 1 4 3 21C4 29 9 33 16 34C1 39 6 57 19 57C25 57 30 49 32 44C34 49 39 57 45 57C58 57 63 39 48 34C55 33 60 29 61 21C63 4 47 0 34 21Z',
    Leaf:'M58 5C34 3 10 13 7 34C5 48 14 55 26 54L17 61L22 63L34 52C51 48 59 29 58 5Z',
    Dinosaur:'M3 37C11 39 13 30 22 24Q31 17 41 23L43 13C45 3 58 4 61 13L61 22L49 25L48 43L52 56H41L36 48H28L24 56H13L16 44Q7 47 3 37Z',
    Turtle:'M6 32Q10 30 16 32C17 6 50 6 52 32C62 27 66 39 58 43L53 43L54 52Q49 59 43 51H25Q20 59 14 52L15 44Q3 43 6 32Z',
    Owl:'M12 5L22 14Q32 9 42 14L52 5L52 24C63 42 52 60 32 60C12 60 1 42 12 24Z',
    Elephant:'M14 16C6 10 0 19 4 30Q6 39 14 37L14 54H24L26 46H35L38 54H48V36C53 45 63 39 62 31L56 28Q55 33 52 29L51 18Q45 6 29 9Q19 8 14 16Z',
    Duck:'M11 28Q4 24 4 18L17 19C19 4 41 2 44 18Q46 23 40 28C47 31 56 32 61 26C62 45 52 57 34 57C17 57 5 47 7 34Z',
    Rocket:'M32 2C44 10 49 25 47 38L58 53L43 51L39 61H25L21 51L6 53L17 38C15 25 20 10 32 2Z',
    Train:'M7 27H13V14H23V26H33V9H54V36H60V49H55Q55 59 47 59Q40 59 38 53H25Q22 59 16 59Q8 59 8 50H4V37Z',
    Boat:'M8 33H17L28 7H38V28H54L50 33H61L52 54H15Z',
    Car:'M5 33L13 30L19 17H43L53 29L59 32L61 48H54Q52 57 46 57Q39 57 37 50H25Q23 57 16 57Q10 57 8 50H3Z'
  };
  const holeCenters={
    Bunny:[32,42,.95,.84],Moon:[22,34,0.85,1],Fish:[27,32,0.9,0.8],
    Butterfly:[28,33,0.95,0.75],Leaf:[30,32,0.95,0.85],Dinosaur:[35,35,0.75,0.65],
    Turtle:[34,34,0.85,0.85],Owl:[32,35,1,.95],Elephant:[32,29,.93,.84],
    Duck:[30,34,0.8,1],Rocket:[32,34,0.8,0.9],Train:[31,38,1,0.7],
    Boat:[34,41,1,0.65],Car:[32,36,1,.71]
  };
  const batches=[[1,2,3,4],[5,6,7,8],[9,10,11,12]];
  // The countable holes use stable, spaced rows inside every silhouette.
  const holeRows=[20,29,38,47];
  const smallPatterns=[
    [],[[32,32]],[[22,22],[42,42]],[[20,20],[32,32],[44,44]],
    [[21,21],[43,21],[21,43],[43,43]],[[21,21],[43,21],[32,32],[21,43],[43,43]],
    [[21,18],[43,18],[21,32],[43,32],[21,46],[43,46]]
  ];

  function cookiePicture(quantity,shape){
    const holes=quantity<=6?smallPatterns[quantity]:holeRows.flatMap(y=>[22,32,42].map(x=>[x,y])).slice(0,quantity);
    const [anchorX,anchorY,scaleX,scaleY]=holeCenters[shape]||(shape==='Round'?[32,32,1,1]:[32,34,.78,.9]);
    const radius=(quantity<=6?4.6:3.3)*Math.min(scaleX,scaleY);
    const cutouts=holes.map(([x,y])=>{
      x=anchorX+(x-32)*scaleX;
      y=anchorY+(y-32)*scaleY;
      return `M${x-radius} ${y}a${radius} ${radius} 0 1 0 ${2*radius} 0a${radius} ${radius} 0 1 0 ${-2*radius} 0Z`;
    }).join(' ');
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${shapes[shape]} ${cutouts}" fill="url(#cookie-baked-texture) #e7a458" fill-rule="evenodd" stroke="#743c23" stroke-width="1.1" stroke-linejoin="round"/><path d="${shapes[shape]}" fill="none" stroke="#743c23" stroke-width="2.3" stroke-linejoin="round"/></svg>`;
  }

  function trayPicture(quantity,shape){
    const placeholder='<svg class="cookie-placeholder" viewBox="0 0 64 64" aria-hidden="true"><path d="'+shapes[shape]+'" fill="#fff" stroke="#008bc4" stroke-width="1.25" stroke-linejoin="round"/></svg>';
    return placeholder+cookiePicture(quantity,shape);
  }

  function shuffled(values){
    const result=[...values];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }

  function mount(root,shapeStrip,{progress,feedback}){
    const tray=root.querySelector('[data-cookie-tray]');
    const spots=root.querySelector('[data-cookie-spots]');
    const message=root.querySelector('[data-cookie-status]');
    const next=root.querySelector('[data-cookie-next]');
    let batch=0,selected=null,drag=null,muteClick=null,advanceTimer=null,shape='Round';
    const lastOrder=new Map();
    const placed=new Set();

    function report(text){
      message.textContent=text;
      progress(batch*batches[0].length+placed.size,text);
    }

    function showShapes(){
      shapeStrip.hidden=false;
      shapeStrip.setAttribute('aria-label','Choose cookie shape');
      shapeStrip.innerHTML=Object.keys(shapes).map((name,index)=>{
        const atlas=Math.floor(index/9)+1,tile=index%9;
        const column=tile%3,row=Math.floor(tile/3);
        return '<button type="button" class="item-chip cookie-shape" data-cookie-shape="'+name+'" aria-pressed="'+(shape===name)+'">'
          +'<span class="cookie-shape-image" data-atlas="'+atlas+'" style="background-position:'+column*50+'% '+row*50+'%" aria-hidden="true"></span>'
          +'<span>'+name+'</span></button>';
      }).join('');
    }

    function setShape(name){
      cancelDrag();
      shape=name;
      for(const button of shapeStrip.querySelectorAll('[data-cookie-shape]')){
        button.setAttribute('aria-pressed',String(button.dataset.cookieShape===shape));
      }
      for(const button of tray.querySelectorAll('[data-cookie-value]'))button.innerHTML=trayPicture(Number(button.dataset.cookieValue),shape);
      for(const spot of spots.querySelectorAll(':disabled')){
        const value=Number(spot.dataset.cookieSpot);
        spot.innerHTML=cookiePicture(value,shape)+'<span>'+value+'</span>';
      }
    }

    function queueNext(){
      clearTimeout(advanceTimer);
      advanceTimer=setTimeout(advance,2100);
    }

    function clearHint(){
      root.querySelectorAll('.cookie-demo').forEach(button=>button.classList.remove('cookie-demo'));
    }

    function choose(value){
      clearHint();
      selected=value;
      for(const cookie of tray.querySelectorAll('[data-cookie-value]')){
        cookie.setAttribute('aria-pressed',String(Number(cookie.dataset.cookieValue)===selected));
      }
      if(selected!==null)report('Now choose the matching number.');
    }

    function match(cookieValue,spot){
      const number=Number(spot.dataset.cookieSpot);
      if(placed.has(number)||placed.has(cookieValue))return;
      if(cookieValue!==number){
        report('Count the holes again and try another number.');
        return;
      }
      placed.add(number);
      const cookie=tray.querySelector('[data-cookie-value="'+number+'"]');
      const focused=document.activeElement===cookie||document.activeElement===spot;
      choose(null);
      cookie.disabled=true;
      spot.innerHTML=cookiePicture(number,shape)+'<span>'+number+'</span>';
      spot.setAttribute('aria-label',number+' matched');
      spot.disabled=true;
      feedback();
      const done=placed.size===batches[batch].length;
      if(done){
        next.hidden=false;
        const last=batch===batches.length-1;
        next.textContent=last?'Play again':'Next batch';
        report(last?'You matched all twelve cookies!':'All four matched! Here comes the next board.');
        queueNext();
      }else{
        report(number+' matched! Pick another cookie.');
      }
      if(focused)(done?next:tray.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
    }

    function cancelDrag(){
      if(!drag)return;
      const {button}=drag;
      drag=null;
      button.classList.remove('cookie-dragging');
      button.style.removeProperty('--cookie-dx');
      button.style.removeProperty('--cookie-dy');
    }

    function build(){
      clearTimeout(advanceTimer);
      cancelDrag();
      placed.clear();
      selected=null;
      muteClick=null;
      next.hidden=true;
      const values=batches[batch],order=shuffled(values);
      if(order.join(',')===lastOrder.get(batch))order.push(order.shift());
      lastOrder.set(batch,order.join(','));
      spots.innerHTML=order.map(value=>'<button type="button" class="cookie-spot" data-cookie-spot="'+value+'" aria-label="Number '+value+'"><span>'+value+'</span></button>').join('');
      tray.innerHTML=shuffled(values).map(value=>'<button type="button" class="cookie-piece" data-cookie-value="'+value+'" aria-label="Cookie with '+value+' '+(value===1?'hole':'holes')+'" aria-pressed="false">'+trayPicture(value,shape)+'</button>').join('');
      report('Count the holes. Tap a cookie and its number, or drag it to the number.');
    }

    root.addEventListener('click',event=>{
      const cookie=event.target.closest('[data-cookie-value]');
      if(cookie){
        if(muteClick===cookie&&event.detail!==0){muteClick=null;return;}
        choose(Number(cookie.dataset.cookieValue));
        if(event.detail===0)spots.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
        return;
      }
      const spot=event.target.closest('[data-cookie-spot]');
      if(!spot)return;
      if(selected===null)report('Choose a cookie first.');
      else match(selected,spot);
    });

    tray.addEventListener('pointerdown',event=>{
      const button=event.target.closest('[data-cookie-value]');
      if(!button||button.disabled||!event.isPrimary||event.button!==0)return;
      muteClick=null;
      drag={button,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    });
    window.addEventListener('pointermove',event=>{
      if(drag?.id!==event.pointerId)return;
      const x=event.clientX-drag.x,y=event.clientY-drag.y;
      if(!drag.moved&&Math.hypot(x,y)<9)return;
      drag.moved=true;
      drag.button.classList.add('cookie-dragging');
      drag.button.style.setProperty('--cookie-dx',x+'px');
      drag.button.style.setProperty('--cookie-dy',y+'px');
    });
    window.addEventListener('pointerup',event=>{
      if(drag?.id!==event.pointerId)return;
      const {button,moved}=drag;
      cancelDrag();
      if(!moved)return;
      muteClick=button;
      const spot=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cookie-spot]:not(:disabled)');
      choose(Number(button.dataset.cookieValue));
      if(spot&&spots.contains(spot))match(Number(button.dataset.cookieValue),spot);
    });
    window.addEventListener('pointercancel',event=>{if(drag?.id===event.pointerId)cancelDrag();});
    function advance(){
      const focus=document.activeElement===next;
      batch=(batch+1)%batches.length;
      build();
      if(focus)tray.querySelector('button')?.focus({preventScroll:true});
    }
    next.addEventListener('click',advance);
    shapeStrip.addEventListener('click',event=>{
      const button=event.target.closest('[data-cookie-shape]');
      if(button&&!root.hidden)setShape(button.dataset.cookieShape);
    });

    return {
      cancelDrag,
      reset(){batch=0;build();showShapes();},
      show(){
        if(!spots.childElementCount)build();
        else report(message.textContent);
        showShapes();
        if(!next.hidden)queueNext();
      },
      leave(){clearTimeout(advanceTimer);cancelDrag();clearHint();},
      demo(){
        clearHint();
        const cookie=tray.querySelector('button:not(:disabled)');
        if(!cookie)return;
        const value=Number(cookie.dataset.cookieValue);
        cookie.classList.add('cookie-demo');
        spots.querySelector('[data-cookie-spot="'+value+'"]').classList.add('cookie-demo');
        report('This cookie has '+value+' '+(value===1?'hole':'holes')+'. Match it to '+value+'.');
      }
    };
  }

  window.SaNaCookieCounting={mount};
})();
