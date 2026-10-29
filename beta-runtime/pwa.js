(() => {
  const button=document.getElementById('install');
  const status=document.getElementById('offline-status');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let nativePrompt=null,installed=standalone.matches||navigator.standalone===true;
  function renderInstall(){
    if(!button)return;
    const label=button.querySelector('[data-install-label]');
    if(label)label.textContent=installed?'Installed':'Install app';
    button.setAttribute('aria-label',installed?'Installed':'Install app');
  }
  const guide=()=>window.sanaInstallDialog?.(installed?'Your SaNa app is installed':'Install SaNa Beta',installed
    ?'<p>Open <strong>SaNa Beta</strong> from your home screen or app list.</p><p>You can also keep playing here.</p>'
    :'<p><strong>iPhone or iPad:</strong> open this page in Safari, tap Share, then <strong>Add to Home Screen</strong> and Add.</p><p><strong>Android:</strong> open in Chrome, then choose <strong>Install app</strong> or <strong>Add to Home Screen</strong> from the browser menu.</p><p><strong>Laptop:</strong> open in Chrome or Edge and use the install icon beside the address bar.</p>');
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();nativePrompt=event;renderInstall();});
  window.addEventListener('appinstalled',()=>{installed=true;nativePrompt=null;renderInstall();});
  standalone.addEventListener('change',event=>{installed=event.matches||navigator.standalone===true;renderInstall();});
  button?.addEventListener('click',async()=>{
    if(installed||!nativePrompt){guide();return;}
    const prompt=nativePrompt;nativePrompt=null;
    try{await prompt.prompt();await prompt.userChoice;}catch{guide();}
    renderInstall();
  });
  renderInstall();
  function setOfflineStatus(text){if(status)status.textContent=text;}
  /** Ask the active worker whether every launch asset is cached before promising offline play. */
  function offlineReady(worker){
    return new Promise(resolve=>{
      const channel=new MessageChannel();
      const timer=setTimeout(()=>{channel.port1.close();resolve(false);},5000);
      channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data?.ready===true);};
      worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);
    });
  }
  async function prepareOffline(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){setOfflineStatus('Open the HTTPS app link for offline play.');return;}
    try{
      await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
      const registration=await navigator.serviceWorker.ready;
      const ready=registration.active&&await offlineReady(registration.active);
      setOfflineStatus(ready?'Ready for offline play':'Open online once to prepare offline play.');
    }catch{setOfflineStatus('Open online once to prepare offline play.');}
  }
  if(document.readyState==='complete')prepareOffline();else window.addEventListener('load',prepareOffline,{once:true});
  window.addEventListener('online',prepareOffline);
})();
