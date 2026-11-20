(() => {
  const button=document.getElementById('install');
  const status=document.getElementById('offline-status');
  const updateButton=document.getElementById('update-app');
  const updateLabel=updateButton?.querySelector('[data-update-label]');
  const normalUpdateLabel=updateLabel?.textContent;
  const app=document.getElementById('app');
  const release=document.querySelector('meta[name="sana-release"]')?.content;
  // Report the page currently running, even while a newer worker downloads.
  const versionNumber=value=>Number(value?.match(/-v(\d+)(?:-|$)/)?.[1]||0);
  const releaseNumber=release?.match(/-v(\d+)(?:-|$)/)?.[1];
  const reloadGuardKey='sana-update-reload-target';
  try{if(sessionStorage.getItem(reloadGuardKey)===release)sessionStorage.removeItem(reloadGuardKey);}catch{/* Optional loop guard. */}
  if(releaseNumber){
    const number=Number(releaseNumber),version=`v${Math.floor(number/100)}.${String(number%100).padStart(2,'0')}`;
    document.querySelectorAll('[data-release-version]').forEach(label=>{
      label.textContent=version;label.title=`Currently running ${version}`;
      label.setAttribute('aria-label',`App version ${version}`);
    });
  }
  const standalone=window.matchMedia('(display-mode: standalone)');
  let nativePrompt=null,installed=standalone.matches||navigator.standalone===true;
  function renderInstall(){
    if(!button)return;
    const label=button.querySelector('[data-install-label]');
    if(label)label.textContent=installed?'Installed':'Install app';
    button.setAttribute('aria-label',installed?'Installed':'Install app');
  }
  const guide=()=>window.sanaInstallDialog?.(installed?'SaNa Beta is installed':'Install SaNa Beta',installed
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
  const UPDATE_CHECK_TIMEOUT_MS=15000,INSTALL_TIMEOUT_MS=120000;
  function withTimeout(promise,ms=UPDATE_CHECK_TIMEOUT_MS,message='The connection took too long. Please try Update again.'){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error(message)),ms);
      Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
    });
  }
  async function checkedRegistration(){
    return withTimeout((async()=>{
      const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
      monitorRegistration(registration);
      if(registration.installing||registration.waiting)return registration;
      await new Promise((resolve,reject)=>{
        const found=()=>{registration.removeEventListener('updatefound',found);resolve();};
        registration.addEventListener('updatefound',found,{once:true});
        registration.update().then(()=>{registration.removeEventListener('updatefound',found);resolve();},error=>{registration.removeEventListener('updatefound',found);reject(error);});
      });
      return registration;
    })());
  }
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
      const timer=setTimeout(()=>finish(new Error('The download is still running. Keep the app open and try Update again.')),INSTALL_TIMEOUT_MS);
      worker.addEventListener('statechange',check);check();
    });
  }
  const canShowUpdate=()=>!app||!app.classList.contains('immersive');
  let pendingUpdate=null;
  function applyUpdate(version){
    const pageVersion=versionNumber(release),workerVersion=versionNumber(version);
    if(!version||(pageVersion&&workerVersion&&workerVersion<pageVersion)){setOfflineStatus('Offline update is still preparing');return false;}
    try{
      if(version!==release&&sessionStorage.getItem(reloadGuardKey)===version){setOfflineStatus('Update is still preparing. Keep using this page and try again soon.');return false;}
      if(version!==release)sessionStorage.setItem(reloadGuardKey,version);
      sessionStorage.setItem('sana-update-complete',version);
    }catch{/* Version ordering still prevents stale-worker reload loops. */}
    location.reload();return true;
  }
  if(app)new MutationObserver(()=>{if(pendingUpdate&&app.dataset.view==='home'&&canShowUpdate()){const version=pendingUpdate;pendingUpdate=null;applyUpdate(version);}}).observe(app,{attributes:true,attributeFilter:['data-view','class']});
  const watchedWorkers=new WeakSet();
  let automaticCheckRunning=false;
  function applyDetectedVersion(version){
    if(!version||version===release)return;
    const pageVersion=versionNumber(release),workerVersion=versionNumber(version);
    // Never replace a newer online page with an older cached worker. Keep the page usable while the new worker installs.
    if(!pageVersion||!workerVersion||workerVersion<=pageVersion){setOfflineStatus('Offline update is still preparing');return;}
    if(!app||(app.dataset.view==='home'&&canShowUpdate())){applyUpdate(version);return;}
    // Let a child finish the current game, then refresh as soon as the app returns home.
    pendingUpdate=version;
  }
  async function inspectActiveVersion(registration){
    const worker=registration.active||navigator.serviceWorker.controller;
    if(!worker||!release)return;
    const ready=await workerStatus(worker);
    if(ready?.ready&&ready.version===release)setOfflineStatus('Ready for offline play');
    if(ready?.ready&&ready.version)applyDetectedVersion(ready.version);
  }
  function watchWorker(worker,registration){
    if(!worker||watchedWorkers.has(worker))return;
    watchedWorkers.add(worker);
    const check=()=>{if(worker.state==='activated')void inspectActiveVersion(registration);};
    worker.addEventListener('statechange',check);
    check();
  }
  function monitorRegistration(registration){
    registration.addEventListener('updatefound',()=>watchWorker(registration.installing,registration));
    watchWorker(registration.installing,registration);
    watchWorker(registration.waiting,registration);
  }
  async function checkForAutomaticUpdate(){
    if(automaticCheckRunning||document.hidden||!navigator.onLine||!('serviceWorker'in navigator)||!window.isSecureContext)return;
    automaticCheckRunning=true;
    try{
      const registration=await checkedRegistration();
      watchWorker(registration.installing||registration.waiting,registration);
      await inspectActiveVersion(registration);
    }catch{/* Automatic checks retry on the next timer, focus, or connection event. */}
    finally{automaticCheckRunning=false;}
  }
  // Browsers normally check service workers on launch; poll while open as well so a
  // GitHub Pages deployment reaches an already-running app without requiring a relaunch.
  const UPDATE_CHECK_INTERVAL=2*60*1000;
  window.setInterval(checkForAutomaticUpdate,UPDATE_CHECK_INTERVAL);
  window.addEventListener('focus',checkForAutomaticUpdate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForAutomaticUpdate();});
  window.addEventListener('online',checkForAutomaticUpdate);
  function updateDialog(title,copy){
    if(!canShowUpdate())return;
    if(window.sanaAppDialog){window.sanaAppDialog(title,copy,updateButton);return;}
    let shade=document.getElementById('sana-update-shade');
    if(!shade){
      shade=document.createElement('div');shade.id='sana-update-shade';shade.className='sana-update-shade';shade.hidden=true;
      shade.innerHTML='<section class="sana-update-panel" role="dialog" aria-modal="true" aria-labelledby="sana-update-title" tabindex="-1"><h2 id="sana-update-title"></h2><div id="sana-update-copy"></div><button type="button">Got it</button></section>';
      app.append(shade);
      const close=()=>{shade.hidden=true;updateButton.focus({preventScroll:true});};
      shade.querySelector('button').addEventListener('click',close);
      shade.addEventListener('click',event=>{if(event.target===shade)close();});
      document.addEventListener('keydown',event=>{
        if(shade.hidden)return;
        if(event.key==='Escape'){event.preventDefault();close();}
        if(event.key==='Tab'){event.preventDefault();shade.querySelector('button').focus();}
      });
    }
    shade.querySelector('h2').textContent=title;shade.querySelector('#sana-update-copy').innerHTML=copy;
    shade.hidden=false;shade.querySelector('[role="dialog"]').focus({preventScroll:true});
  }
  updateButton?.addEventListener('click',async()=>{
    if(!canShowUpdate())return;
    const requestedInGame=app&&app.dataset.view!=='home';
    updateButton.disabled=true;updateButton.setAttribute('aria-busy','true');
    updateLabel.textContent='Checking…';
    try{
      if(!navigator.onLine||!('serviceWorker'in navigator)||!window.isSecureContext)throw new Error('An online secure connection is needed');
      const registration=await checkedRegistration();
      // The active worker may still be the previous release while the new one installs.
      let worker=registration.installing||registration.waiting;
      if(worker){
        updateLabel.textContent='Downloading…';
        await activated(worker);
      }
      worker=registration.active||navigator.serviceWorker.controller||worker;
      if(!worker)throw new Error('No active service worker');
      const ready=await workerStatus(worker);
      if(!ready?.ready||!ready.version||!release)throw new Error('Update files are not ready');
      if(ready.version!==release){
        const pageVersion=versionNumber(release),workerVersion=versionNumber(ready.version);
        if(!pageVersion||!workerVersion||workerVersion<=pageVersion){updateDialog('Update still preparing','<p>This page is newer than its saved offline copy. Keep using this page and try Update again later.</p>');return;}
        if(!canShowUpdate())return;
        if(app&&app.dataset.view!=='home'){
          if(requestedInGame){pendingUpdate=ready.version;updateDialog('Update ready','<p>The latest SaNa app has downloaded. Keep playing, then choose <strong>Games</strong> to apply it.</p>');}
          return;
        }
        applyUpdate(ready.version);return;
      }
      if(!app||app.dataset.view==='home'||requestedInGame)updateDialog('App is up to date','<p>You already have the latest SaNa app. Your downloaded games are ready to play.</p>');
    }catch(error){
      const reason=String(error?.message||'Unknown update error').replace(/[<>&"']/g,'');
      if(!app||app.dataset.view==='home'||requestedInGame)updateDialog('Update unavailable','<p>Connect to the internet and try Update again. Your downloaded games, saved pictures and settings are still available.</p><p style="font-size:.8em">'+reason+'</p>');
    }finally{
      updateButton.disabled=false;updateButton.setAttribute('aria-busy','false');
      updateLabel.textContent=normalUpdateLabel;
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
      const registered=await withTimeout(navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}));
      monitorRegistration(registered);
      if(!registered.installing&&!registered.waiting)try{await withTimeout(registered.update());}catch{/* The previous cached release remains playable while offline. */}
      const registration=registered.active?registered:await withTimeout(navigator.serviceWorker.ready,INSTALL_TIMEOUT_MS,'The download is still running.');
      monitorRegistration(registration);
      const ready=registration.active&&await workerStatus(registration.active);
      setOfflineStatus(ready?.ready?'Ready for offline play':'Open online once to prepare offline play.');
      if(ready?.ready&&ready.version)applyDetectedVersion(ready.version);
    }catch{setOfflineStatus('Open online once to prepare offline play.');}
  }
  if(document.readyState==='complete')prepareOffline();else window.addEventListener('load',prepareOffline,{once:true});
  window.addEventListener('online',prepareOffline);
})();
