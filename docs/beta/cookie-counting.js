(() => {
  'use strict';

  const shapes={
    Round:'M3 32a29 29 0 1 0 58 0a29 29 0 1 0-58 0Z',
    Star:'M32 3 42 17 60 18 50 33 53 58 32 53 11 58 14 33 4 18 22 17Z',
    Heart:'M32 61C25 58 3 36 3 19C3 5 22 1 32 15C42 1 61 5 61 19C61 36 39 58 32 61Z',
    Flower:'M32 10C41-3 57 6 54 21C67 27 64 44 52 45C51 60 38 65 32 54C24 65 10 60 12 45C-1 44-3 27 10 21C7 6 23-3 32 10Z',
    Bear:'M13 19C2 8 16-2 25 11Q32 8 39 11C48-2 62 8 51 19C66 39 54 60 32 60C10 60-2 39 13 19Z'
  };
  const batches=[[1,2,3,4,5,6],[7,8,9,10,11,12]];
  // The countable holes use stable, spaced rows inside every silhouette.
  const holeRows=[20,29,38,47];
  const smallPatterns=[
    [],[[32,32]],[[22,22],[42,42]],[[20,20],[32,32],[44,44]],
    [[21,21],[43,21],[21,43],[43,43]],[[21,21],[43,21],[32,32],[21,43],[43,43]],
    [[21,18],[43,18],[21,32],[43,32],[21,46],[43,46]]
  ];

  function cookiePicture(quantity,shape){
    const holes=quantity<=6?smallPatterns[quantity]:holeRows.flatMap(y=>[22,32,42].map(x=>[x,y])).slice(0,quantity);
    const radius=quantity<=6?4.6:3.3;
    const cutouts=holes.map(([x,y])=>{
      if(shape!=='Round'){
        x=32+(x-32)*.78;
        y=34+(y-32)*.9;
      }
      return `M${x-radius} ${y}a${radius} ${radius} 0 1 0 ${2*radius} 0a${radius} ${radius} 0 1 0 ${-2*radius} 0Z`;
    }).join(' ');
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${shapes[shape]} ${cutouts}" fill="#e7a458" fill-rule="evenodd" stroke="#743c23" stroke-width="1.1" stroke-linejoin="round"/><path d="${shapes[shape]}" fill="none" stroke="#743c23" stroke-width="2.3" stroke-linejoin="round"/></svg>`;
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
      progress(batch*6+placed.size,text);
    }

    function showShapes(){
      shapeStrip.hidden=false;
      shapeStrip.setAttribute('aria-label','Choose cookie shape');
      shapeStrip.innerHTML=Object.keys(shapes).map(name=>'<button type="button" class="item-chip cookie-shape" data-cookie-shape="'+name+'" aria-pressed="'+(shape===name)+'">'+cookiePicture(3,name)+'<span>'+name+'</span></button>').join('');
    }

    function setShape(name){
      cancelDrag();
      shape=name;
      for(const button of shapeStrip.querySelectorAll('[data-cookie-shape]')){
        button.setAttribute('aria-pressed',String(button.dataset.cookieShape===shape));
      }
      for(const button of tray.querySelectorAll('[data-cookie-value]'))button.innerHTML=cookiePicture(Number(button.dataset.cookieValue),shape);
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
      // Leave its empty tray slot in place, so the other cookies stay under the same coordinates.
      cookie.style.visibility='hidden';
      spot.innerHTML=cookiePicture(number,shape)+'<span>'+number+'</span>';
      spot.setAttribute('aria-label',number+' matched');
      spot.disabled=true;
      feedback();
      const done=placed.size===batches[batch].length;
      if(done){
        next.hidden=false;
        next.textContent=batch===0?'Next batch':'Play again';
        report(batch===0?'All six matched! Cookies 7 to 12 are next.':'You matched all twelve cookies! A new board is coming.');
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
      tray.innerHTML=shuffled(values).map(value=>'<button type="button" class="cookie-piece" data-cookie-value="'+value+'" aria-label="Cookie with '+value+' '+(value===1?'hole':'holes')+'" aria-pressed="false">'+cookiePicture(value,shape)+'</button>').join('');
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
