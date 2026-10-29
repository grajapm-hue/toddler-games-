(() => {
  const button=document.getElementById('install');
  const status=document.getElementById('offline-status');
  const updateButton=document.getElementById('update-app');
  const release=document.querySelector('meta[name="sana-release"]')?.content;
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
  function workerStatus(worker){
    return new Promise(resolve=>{
      const channel=new MessageChannel();
      const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};
      const timer=setTimeout(()=>finish(null),5000);
      channel.port1.onmessage=event=>finish(event.data);
      try{worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);}catch{finish(null);}
    });
  }
  /** Wait for complete caching and activation; never reload into a half-downloaded release. */
  function activated(worker){
    return new Promise((resolve,reject)=>{
      const finish=error=>{clearTimeout(timer);worker.removeEventListener('statechange',check);error?reject(error):resolve();};
      const check=()=>{if(worker.state==='activated')finish();else if(worker.state==='redundant')finish(new Error('Update did not install'));};
      const timer=setTimeout(()=>finish(new Error('Update is still downloading')),20000);
      worker.addEventListener('statechange',check);check();
    });
  }
  const updateDialog=(title,copy)=>window.sanaAppDialog?.(title,copy,updateButton);
  updateButton?.addEventListener('click',async()=>{
    updateButton.disabled=true;updateButton.setAttribute('aria-busy','true');
    updateButton.querySelector('[data-update-label]').textContent='Checking…';
    try{
      if(!navigator.onLine||!('serviceWorker'in navigator)||!window.isSecureContext)throw new Error('An online secure connection is needed');
      const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
      await registration.update();
      const worker=registration.installing||registration.waiting||registration.active;
      if(!worker)throw new Error('No app update available');
      if(worker.state!=='activated')updateButton.querySelector('[data-update-label]').textContent='Updating…';
      await activated(worker);
      const ready=await workerStatus(worker);
      if(!ready?.ready||!ready.version||!release)throw new Error('Update files are not ready');
      if(ready.version!==release){
        try{sessionStorage.setItem('sana-update-complete',ready.version);}catch{/* Updating also works without optional session storage. */}
        location.reload();return;
      }
      updateDialog('App is up to date','<p>You already have the latest SaNa app. Your downloaded games are ready to play.</p>');
    }catch{
      updateDialog('Update unavailable','<p>Connect to the internet and try again. Your downloaded games and saved settings are still available.</p>');
    }finally{
      updateButton.disabled=false;updateButton.setAttribute('aria-busy','false');
      updateButton.querySelector('[data-update-label]').textContent='Update app';
    }
  });
  if(updateButton){
    try{
      const completed=sessionStorage.getItem('sana-update-complete');sessionStorage.removeItem('sana-update-complete');
      if(completed&&completed===release)updateDialog('App updated','<p>The latest SaNa app is ready. Your saved settings have been kept.</p>');
    }catch{/* This optional notice must not prevent the app opening. */}
  }
  async function prepareOffline(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){setOfflineStatus('Open the HTTPS app link for offline play.');return;}
    try{
      const registered=await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
      try{await registered.update();}catch{/* The previous cached release remains playable while offline. */}
      const registration=await navigator.serviceWorker.ready;
      const ready=registration.active&&await workerStatus(registration.active);
      setOfflineStatus(ready?.ready?'Ready for offline play':'Open online once to prepare offline play.');
    }catch{setOfflineStatus('Open online once to prepare offline play.');}
  }
  if(document.readyState==='complete')prepareOffline();else window.addEventListener('load',prepareOffline,{once:true});
  window.addEventListener('online',prepareOffline);
})();
