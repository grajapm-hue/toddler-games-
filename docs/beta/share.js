(() => {
  const button=document.getElementById('share-app');
  if(!button)return;
  // The play page needs the same dialog inside its rotated landscape frame.
  if(!window.sanaAppDialog){
    const shade=document.createElement('div');
    shade.className='play-share-shade';shade.hidden=true;
    shade.innerHTML='<section class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" tabindex="-1"><h2 id="share-dialog-title"></h2><div id="share-dialog-copy"></div><button type="button" id="close-dialog">Got it</button></section>';
    document.getElementById('app').appendChild(shade);
    const panel=shade.querySelector('.dialog-panel');let opener;
    window.sanaAppDialog=(heading,copy,source)=>{
      opener=source;document.getElementById('share-dialog-title').textContent=heading;
      document.getElementById('share-dialog-copy').innerHTML=copy;shade.hidden=false;panel.focus();
    };
    const close=()=>{shade.hidden=true;opener?.focus();};
    document.getElementById('close-dialog').addEventListener('click',close);
    shade.addEventListener('click',event=>{if(event.target===shade)close();});
    document.addEventListener('keydown',event=>{
      if(shade.hidden)return;
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key==='Tab'){
        const controls=[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel)){event.preventDefault();first?.focus();}
      }
    });
  }
  const url='https://grajapm-hue.github.io/toddler-games-/beta/index.html';
  const title='SaNa Little Hands Beta';
  const text='Please try this play app, mainly for ages 2–4, on your phone or tablet. Check installation, dragging, tapping, sliding, brushing and painting. Please send your feedback to the person who shared this link.';
  const whatsapp=new URL('https://wa.me/');
  whatsapp.searchParams.set('text',`${title}\n\n${text}\n\n${url}`);
  button.addEventListener('click',()=>{
    const native=typeof navigator.share==='function';
    window.sanaAppDialog?.('Share SaNa Beta',`<div class="share-options"><a class="share-option whatsapp" href="${whatsapp.href}" target="_blank" rel="noopener noreferrer">WhatsApp</a><button class="share-option" type="button" id="copy-share-link">Copy link</button>${native?'<button class="share-option more" type="button" id="native-share">More apps</button>':''}</div><label class="share-link">Beta test link<input type="text" value="${url}" readonly></label><p class="share-result" id="share-result" role="status">Choose where to invite your group to try the Beta.</p>`,button);
    const result=document.getElementById('share-result');
    const link=document.querySelector('.share-link input');
    document.getElementById('copy-share-link')?.addEventListener('click',async()=>{
      try{
        if(typeof navigator.clipboard?.writeText!=='function')throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        result.textContent='Link copied. Paste it into your group.';
      }catch{
        link.focus();link.select();link.setSelectionRange(0,url.length);
        result.textContent='Select and copy the test link.';
      }
    });
    document.getElementById('native-share')?.addEventListener('click',async event=>{
      const more=event.currentTarget;more.disabled=true;
      try{
        await navigator.share({title,text,url});
        result.textContent='You can also copy the link for your group.';
      }catch(error){
        result.textContent=error?.name==='AbortError'?'Sharing cancelled. You can still copy the link.':'Use WhatsApp or copy the link to share it.';
      }finally{more.disabled=false;}
    });
  });
})();
