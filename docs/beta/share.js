(() => {
  const button=document.getElementById('share-app');
  if(!button)return;
  const url='https://grajapm-hue.github.io/toddler-games-/beta/index.html';
  const title='SaNa Little Hands Beta';
  const text='Please try this play app, mainly for ages 2–4, on your phone or tablet. Check installation, dragging, tapping, sliding, brushing and painting. Please send your feedback to the person who shared this link.';
  const whatsapp=new URL('https://wa.me/');
  whatsapp.searchParams.set('text',`${title}\n\n${text}\n\n${url}`);
  function nativeShareData(){
    if(typeof navigator.share!=='function')return null;
    const data={title,text,url};
    if(typeof navigator.canShare!=='function')return data;
    try{
      if(navigator.canShare(data))return data;
      // Some embedded browsers accept a plain URL but reject additional text.
      if(navigator.canShare({url}))return {url};
    }catch{/* Unsupported or blocked native sharing uses the visible link options. */}
    return null;
  }
  button.addEventListener('click',()=>{
    const nativeData=nativeShareData();
    const message=nativeData?'Choose where to invite your group to try the Beta.':'Device sharing is unavailable here. Use WhatsApp or Copy link.';
    window.sanaAppDialog?.('Share SaNa Beta',`<div class="share-options"><a class="share-option whatsapp" href="${whatsapp.href}" target="_blank" rel="noopener noreferrer">WhatsApp</a><button class="share-option" type="button" id="copy-share-link">Copy link</button>${nativeData?'<button class="share-option more" type="button" id="native-share">More apps</button>':''}</div><label class="share-link">Beta test link<input type="text" value="${url}" readonly inputmode="none"></label><p class="share-result" id="share-result" role="status">${message}</p>`,button);
    const result=document.getElementById('share-result');
    const link=document.querySelector('.share-link input');
    document.getElementById('copy-share-link')?.addEventListener('click',async event=>{
      const copyButton=event.currentTarget;
      try{
        if(typeof navigator.clipboard?.writeText!=='function')throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        result.textContent='Link copied. Paste it into your group.';
      }catch{
        link.focus({preventScroll:true});link.select();link.setSelectionRange(0,url.length);
        // Compatibility fallback only: older/embedded browsers may block Async Clipboard.
        let copied=false;
        try{copied=document.execCommand?.('copy')===true;}catch{/* Keep the link selected for manual copying. */}
        result.textContent=copied?'Link copied. Paste it into your group.':'Select and copy the test link. Press and hold it to choose Copy.';
        if(copied)copyButton.focus({preventScroll:true});
      }
    });
    document.getElementById('native-share')?.addEventListener('click',async event=>{
      const more=event.currentTarget;more.disabled=true;
      try{
        await navigator.share(nativeData);
        result.textContent='You can also copy the link for your group.';
      }catch(error){
        result.textContent=error?.name==='AbortError'?'Sharing cancelled or no sharing app is available. Copy the link instead.':error?.name==='NotAllowedError'?'Device sharing is blocked here. Open this link in Chrome or Safari.':'Could not open device sharing. Use Copy link or WhatsApp.';
      }finally{more.disabled=false;}
    });
  });
})();
