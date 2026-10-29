(() => {
  const button=document.getElementById('share-app');
  if(!button)return;
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
