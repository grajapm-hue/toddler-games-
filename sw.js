const CACHE='sana-little-hands-prototype-v21';
const ASSETS=['./index.html','./age-profiles.js','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})))));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('sana-little-hands-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // A versioned, self-contained playroom can start directly from its local cache.
    const cached=await cache.match(event.request,{ignoreSearch:event.request.mode==='navigate'});
    if(cached)return cached;
    if(event.request.mode==='navigate'){
      const home=await cache.match('./index.html');
      if(home)return home;
    }
    return fetch(event.request);
  })());
});
