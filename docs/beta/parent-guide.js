(() => {
  'use strict';
  const app=document.getElementById('app');
  if(!app)return;
  const trigger=document.createElement('button');
  trigger.id='how-to-play';trigger.type='button';trigger.className='guide-trigger';
  trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','guide-panel');trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML='<span>How to Play</span><span aria-hidden="true">▾</span>';
  document.getElementById('update-app').after(trigger);
  const fullTrigger=trigger.cloneNode(true);fullTrigger.id='how-to-play-full';app.querySelector('.play-mat').append(fullTrigger);
  const range=document.createElement('span');range.id='age-range';range.textContent='Age 2 to 5';range.setAttribute('aria-label','Games for ages 2 to 5');
  trigger.after(range);
  const shade=document.createElement('div');shade.id='parent-guide';shade.hidden=true;
  shade.innerHTML='<section id="guide-panel" role="dialog" aria-modal="true" aria-labelledby="guide-title" tabindex="-1"><header class="guide-header"><div><small>For parents</small><h2 id="guide-title">How to Play</h2></div><button type="button" id="guide-close" aria-label="Close How to Play">Close <span aria-hidden="true">×</span></button></header><div id="guide-body" tabindex="0" aria-label="Instructions, scroll for more"></div></section>';
  app.append(shade);
  const panel=shade.querySelector('#guide-panel'),body=shade.querySelector('#guide-body'),closeButton=shade.querySelector('#guide-close');
  let opener=trigger,held=[];

  // Render the live control as an inert visual, including its current colors and icon.
  // No listeners, IDs or game data attributes are carried into the guide.
  function copyVisual(source){
    const copy=source.cloneNode(true);
    const originals=[source,...source.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
    originals.forEach((node,i)=>{
      const target=copies[i],style=getComputedStyle(node);
      for(const attr of [...target.attributes])if(attr.name==='id'||attr.name==='class'||attr.name==='name'||attr.name.startsWith('data-')||attr.name.startsWith('aria-')||attr.name==='tabindex'||attr.name.startsWith('on'))target.removeAttribute(attr.name);
      for(const key of style)target.style.setProperty(key,style.getPropertyValue(key),'important');
      target.style.setProperty('animation','none','important');target.style.setProperty('transition','none','important');target.style.setProperty('pointer-events','none','important');
      if(target instanceof HTMLElement){target.tabIndex=-1;if(target.tagName==='A')target.removeAttribute('href');}
      if(node instanceof HTMLElement)for(const pseudo of ['::before','::after']){
        const computed=getComputedStyle(node,pseudo),content=computed.content;
        if(!content||content==='none'||content==='normal')continue;
        const decoration=document.createElement('span');decoration.textContent=content.replace(/^['"]|['"]$/g,'');
        for(const key of computed)decoration.style.setProperty(key,computed.getPropertyValue(key),'important');
        decoration.style.setProperty('pointer-events','none','important');
        if(pseudo==='::before')target.prepend(decoration);else target.append(decoration);
      }
    });
    return copy;
  }
  function preview(selector){
    const source=app.querySelector(selector);if(!source)return null;
    const holder=document.createElement('div');holder.className='guide-preview';holder.dataset.guideSource=selector;holder.setAttribute('role','img');holder.setAttribute('aria-label',source.getAttribute('aria-label')||source.textContent.trim()||'Game control');holder.inert=true;
    let visual=copyVisual(source),width,height;
    if(source instanceof SVGGraphicsElement&&source.tagName.toLowerCase()!=='svg'){
      const box=source.getBBox(),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      width=Math.max(1,box.width+8);height=Math.max(1,box.height+8);svg.setAttribute('viewBox',`${box.x-4} ${box.y-4} ${width} ${height}`);
      visual.removeAttribute('transform');visual.style.setProperty('transform','none','important');svg.append(visual);visual=svg;
    }else{
      const style=getComputedStyle(source);width=source.offsetWidth||parseFloat(style.width)||84;height=source.offsetHeight||parseFloat(style.height)||36;
    }
    const scale=Math.min(1,118/width,58/height);
    Object.entries({position:'relative',inset:'auto',margin:'0',flex:'none',width:width+'px',height:height+'px','min-width':width+'px','min-height':height+'px','max-width':'none','max-height':'none',transform:`scale(${scale})`,'transform-origin':'center center'}).forEach(([key,value])=>visual.style.setProperty(key,value,'important'));
    holder.style.width=Math.ceil(width*scale+4)+'px';holder.style.height=Math.ceil(height*scale+4)+'px';
    visual.setAttribute('aria-hidden','true');holder.append(visual);return holder;
  }
  function step(parent,sources,title,text){
    const item=document.createElement('li');item.className='guide-step';
    const pictures=document.createElement('div');pictures.className='guide-pictures';
    for(const selector of Array.isArray(sources)?sources:[sources]){const image=preview(selector);if(image)pictures.append(image);}
    const words=document.createElement('div'),heading=document.createElement('h3'),copy=document.createElement('p');heading.textContent=title;copy.textContent=text;words.append(heading,copy);item.append(pictures,words);parent.append(item);
  }
  const list=parent=>{const ol=document.createElement('ol');ol.className='guide-steps';parent.append(ol);return ol;};
  function common(parent,home=false){
    const notes=list(parent);
    if(home){
      step(notes,'[data-activity="drag"]','1. Choose a game','Tap any game picture. The first six games appear together; Glossy Blocks is on the More games page.');
      step(notes,['#first-games','#more-games'],'2. Browse the games','Tap More games to open Glossy Blocks. Back to first game returns to the six original games. The Games control returns to the page that contains your current game.');
      step(notes,'#age-range','3. Choose an age inside a game','Age 2 to 5 is the shared age range. Open a game, then choose 2, 3, 4 or 5 in its header.');
    }else{
      if(app.classList.contains('immersive'))step(notes,'#exit-play','Return to all controls','Tap the square to leave fullscreen and reach age, Demo, Again, Back, Front and Games. Your current play stays.');
      step(notes,'.parent-age','Age buttons','Choose a starting age from 2 to 5. Changing age begins a fresh round. Exit fullscreen first to see these buttons.');
      step(notes,'#show-me','Demo','Tap once to watch SaNa show one action. The finger holds the object for one second, then acts. Tap Demo again to stop. Your real progress stays.');
      step(notes,'#again','Again','Begin the current activity again. This resets its round.');
      step(notes,['#game-back','#game-front'],'Back and Front','Visit the previous or next game or mode. This begins that activity.');
      step(notes,'#game-home','Games','Return to the game-choice page.');
      step(notes,app.classList.contains('immersive')?'#exit-play':'#fullscreen','Fullscreen square','Expand the play area. Tap the square again to return. Switching screen size keeps the current play.');
    }
    step(notes,'#sound','Sound','Tap to turn game sounds and Demo voice on or off. Green is on; the red crossed icon is off.');
    step(notes,'#music-toggle','Music','Tap the music note to turn background music on or off. It is separate from game sounds.');
    step(notes,'#vibration-toggle','Vibration','Tap the striped square to turn touch vibration on or off, on devices that support it.');
    step(notes,'#update-app','Update','Check for the latest version. The number shows the version currently running. Updates finish without restarting an open game; return to Games to apply them.');
    if(home)step(notes,'.brand','SaNa','Return to the welcome page for About, sharing and installation.');
  }
  function content(){
    body.replaceChildren();const game=app.dataset.view,age=Number(app.dataset.age),paint=document.getElementById('paint-mode').getAttribute('aria-pressed')==='true';
    const titles={home:'Choose a game',drag:'Drag shapes',bubbles:'Pop bubbles',slide:'Slide to reveal',brush:paint?'Finger paint':'Brush clean',abacus:age===2?'Count apples':age===3?'Count carrots':age===4?'Number train':'Count with the abacus',puzzle:'Picture Puzzle',glossy:'Glossy Blocks'};
    shade.dataset.guideFor=game==='abacus'?({2:'count-apples',3:'count-carrots',4:'count-train',5:'count-beads'}[age]||'count-beads'):game;shade.dataset.guideMode=game==='brush'?(paint?'paint':'clean'):'';
    document.getElementById('guide-title').textContent='How to Play · '+titles[game];
    const lead=document.createElement('p');lead.className='guide-lead';lead.textContent=game==='home'?'Play together at your child’s pace. These notes match the controls on this page.':'Follow these steps together. The pictures below show the controls in this game.';body.append(lead);
    if(game==='home'){common(body,true);return;}
    const notes=list(body);
    if(game==='drag'){
      step(notes,'[data-piece]','1. Pick a shape','Touch and drag a shape toward the matching shadow.');
      step(notes,'[data-target]','2. Fit it into its pocket','Release near the matching shadow and the shape fits. You can also tap a shape, then its shadow.');
      step(notes,'#item-progress-strip .item-chip','3. Follow the picture row','The matching picture ticks when it is fitted. More shapes appear as the set is finished.');
    }else if(game==='bubbles'){
      step(notes,['[data-bubble-mode="plain"]','[data-bubble-mode="numbers"]','[data-bubble-mode="letters"]','[data-bubble-mode="shapes"]'],'1. Choose what to pop','Plain gives free popping. 1–20, A–Z and Shapes collect the matching items. Choosing a mode starts a fresh collection.');
      step(notes,'[data-bubble]','2. Tap or sweep across a balloon','It grows briefly, splashes and disappears. Missed items come round again.');
      step(notes,'#item-progress-strip .item-chip','3. Watch the collection','The matching thumbnail changes as an item is popped. Plain shows recent pops.');
      step(notes,['[data-bubble-speed="slow"]','[data-bubble-speed="medium"]','[data-bubble-speed="fast"]'],'Speed','Slow, Medium and High change how quickly the balloons travel. Yellow marks the selected choice.');
      step(notes,['[data-bubble-size="small"]','[data-bubble-size="medium"]','[data-bubble-size="large"]'],'Size','Small, Medium and Large change balloon size and how many fit safely. Yellow marks the selected choice.');
    }else if(game==='slide'){
      step(notes,'[data-cave-door]','1. Open the door','Slide the door to the right to reveal the hidden friend.');
      step(notes,'[data-slide-peek]','2. Try SaNa peek-a-boo','Tap the SaNa eye tab to open or close the door without dragging.');
      step(notes,'[data-slide-door-action]','3. Close and continue','Slide left to close the open door. After the short pause, the next hidden friend is ready.');
      step(notes,'#item-progress-strip .item-chip','Picture row','Shows the friends in this set and the ones already discovered.');
    }else if(game==='brush'){
      step(notes,['#clean-mode','#paint-mode'],'1. Choose Brush clean or Finger paint','Brush clean washes the muddy picture. Finger paint colors inside the picture. Changing mode begins that picture again.');
      step(notes,'#item-progress-strip [data-brush-choice]','2. Choose a picture','Tap a picture thumbnail to choose what to clean or paint. A completed picture receives a tick.');
      step(notes,['[data-brush-size="small"]','[data-brush-size="medium"]','[data-brush-size="large"]'],'3. Choose brush size','Small, Medium or Large changes the width of your finger’s brush.');
      step(notes,'[data-paint]','4. Choose a color','Tap a color, then move your finger over the object. In Brush clean it colors the cleaning brush; in Finger paint it colors the picture.');
      if(paint)step(notes,'#erase-paint','Eraser','Tap Eraser and rub over paint to remove it. Tap a color to paint again.');
    }else if(game==='abacus'&&(age===2||age===3)){
      const apple=age===2;
      step(notes,'[data-count-fruit]','1. Move one '+(apple?'apple':'carrot'),apple?'Drag one apple from the tree into the basket.':'Drag one carrot from the garden to the rabbit.');
      step(notes,apple?'[data-count-drop="basket"]':'[data-count-drop="rabbit"]','2. Keep counting together','Each successful move adds one to the running collection. The next target keeps the objects already collected.');
      step(notes,'#item-progress-strip .item-chip','3. Wait for the next count','The number shows the total to reach, not how many extra objects to add. Watch the collected objects during the short pause, then continue.');
    }else if(game==='abacus'&&age===4){
      step(notes,'[data-count-choice]','1. Find the requested number','Read the number in the top instruction, then tap the carriage showing that number.');
      step(notes,'#item-progress-strip .item-chip','2. Watch the number grow and tick','The selected number enlarges, then the completed thumbnail ticks. After the short pause, the next number is ready.');
      step(notes,'[data-train-engine]','3. Continue with SaNa Express','Carriage groups change as you finish them. Their numbers stay fixed.');
    }else if(game==='abacus'){
      step(notes,'[data-bead-row]','1. Slide a bead or a group','Move beads along any row in either direction. Beads push their neighbors and settle at an end when released.');
      step(notes,['[data-abacus-left]','[data-abacus-right]'],'2. Count both sides','The two ends show how many beads are on each side. Every row has ten beads in total.');
      step(notes,['[data-color-label]','[data-abacus-total]'],'3. Watch the monitor','The matching color, number word, sums and total update as beads move to the counted side. Move them back to subtract.');
      step(notes,'#item-progress-strip .item-chip','4. Enjoy the rainbow','A color lights up when that row has counted beads. The rainbow is a monitor; you can keep sliding after it is full.');
    }else if(game==='glossy'){
      step(notes,'#glossy-category','1. Choose blocks','Choose a category. Ages 2, 3, 4 and 5 use 2×2, 3×3, 4×4 and 6×6 grids, with 4, 9, 16 and 36 blocks in Stores. Mixed, after Plain, adds solid shapes: 4 at age 2, 12 at age 3, and all 20 at ages 4 and 5. The arrows browse more choices. Colours and pictures can repeat, like real building blocks.');
      step(notes,'[data-glossy-item]','2. Build together','The Stores blocks and Assemble grid use the same visible size. Drag a block across, or tap a block and then any place, including over another block. Free placement starts with Grid off: the whole Assemble window is available, including the space beside the grid. Shapes can touch, overlap and interlock at the position you choose. Grid fits new and moved pieces inside cells; toggling it keeps your existing arrangement. With a keyboard, Enter on a shelf block adds it to an empty spot; arrow keys move a focused board block.');
      step(notes,['#glossy-colour','#glossy-remove'],'3. Change your idea','Select a placed block to recolour or remove it. Rotate turns the selected piece 45° clockwise each time; keyboard R does the same. Grid mode fits the rotated piece inside its cell. Open Colour for named swatches or a custom colour. Colour-word blocks update their name to match the chosen colour. Clear and Again start a fresh board. Categories, settings and rotation keep your construction.');
      step(notes,['#glossy-pattern','#glossy-finish'],'4. Try a pattern or finish','Choose a faint pattern to copy, or build freely. Grid changes the guide and future placement without clearing your construction. Landscape fits the complete grid without scrolling. In short portrait windows, swipe an empty part of Assemble to reach more rows. Tap ↕ in Stores to see its next row. Finished celebrates and starts a fresh round after the same short pause as other games. Demo shows a separate example without changing your work.');
    }else if(game==='puzzle'){
      step(notes,'#puzzle-upload','1. Add your pictures','Tap Picture and choose one or several images from the device. They stay in this browser; they are not uploaded.');
      step(notes,'#puzzle-gallery [data-puzzle-choice]','2. Choose a thumbnail','Tap any picture in the top row. Swipe the row for more. Switching pictures keeps their placed pieces during this play session.');
      step(notes,['[data-puzzle-tile]:not([hidden])','[data-puzzle-target]'],'3. Build the picture','Drag a piece from Pieces onto Your picture. It snaps into its correct pocket. Or tap a piece, then the right grid. Every piece is included.');
      step(notes,'#puzzle-preview','Look','Preview the whole picture. Tap Play to return to your pieces without losing progress.');
      step(notes,'#puzzle-numbers','Numbers','Show or hide the numbers on the pieces and their pockets.');
      step(notes,'#puzzle-default','SaNa','Choose the built-in picture of SaNa eating a banana. Your added pictures stay in the thumbnail row.');
      step(notes,'#puzzle-again','Again','Reshuffle the selected picture and put all its pieces back on the left.');
      step(notes,['#puzzle-grid-label','#puzzle-placed'],'Grid and Placed','Ages 2, 3, 4 and 5 use 2×2, 3×3, 4×4 and 5×5 grids. Placed shows pieces already fitted out of the total. These two tabs report progress.');
      step(notes,'#puzzle-remove','Remove','Remove the selected added picture. With SaNa open, tap Remove, then tap a photo marked ×. Cancel returns to normal choices. Remove also lets you stop a photo that is still loading. The locked Built-in label protects SaNa when no added photos remain. Original device images stay.');
    }
    const shared=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Shared controls: age, Demo, sound and navigation';shared.append(summary);common(shared);body.append(shared);
  }
  function close(){
    if(shade.hidden)return;shade.hidden=true;held.forEach(([node,inert])=>node.inert=inert);held=[];
    trigger.setAttribute('aria-expanded','false');fullTrigger.setAttribute('aria-expanded','false');opener.focus({preventScroll:true});
  }
  function open(event){
    if(!shade.hidden){close();return;}opener=event.currentTarget;app.dispatchEvent(new Event('sana-guide-open'));content();
    const header=app.querySelector('.topbar'),top=app.classList.contains('immersive')?8:header.offsetHeight+4;
    shade.style.setProperty('--guide-top',top+'px');held=[...app.children].filter(node=>node!==shade).map(node=>[node,node.inert]);held.forEach(([node])=>node.inert=true);
    shade.hidden=false;opener.setAttribute('aria-expanded','true');body.scrollTop=0;panel.focus({preventScroll:true});
  }
  trigger.addEventListener('click',open);fullTrigger.addEventListener('click',open);closeButton.addEventListener('click',close);
  shade.addEventListener('click',event=>{if(event.target===shade){event.stopPropagation();close();}});
  document.addEventListener('keydown',event=>{
    if(shade.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
    else if(event.key==='Tab'){
      const focusable=[...panel.querySelectorAll('button,summary,[tabindex="0"]')].filter(node=>!node.closest('.guide-preview')&&node.getClientRects().length&& !node.closest('details:not([open]) :not(summary)'));
      const index=focusable.indexOf(document.activeElement),next=event.shiftKey?(index<=0?focusable.length-1:index-1):(index+1)%focusable.length;
      event.preventDefault();event.stopImmediatePropagation();focusable[next]?.focus({preventScroll:true});
    }
  },true);
  new MutationObserver(()=>{if(!shade.hidden)close();}).observe(app,{attributes:true,attributeFilter:['data-view','data-age']});
})();
