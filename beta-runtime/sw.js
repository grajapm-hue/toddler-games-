const CACHE='sana-little-hands-beta-v29';
const PREFIX='sana-little-hands-beta-';
const ASSETS=['./index.html','./play.html','./app.js','./pwa.js','./share.js','./share.css','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='OFFLINE_STATUS'||!event.ports[0])return;
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(CACHE);
      const ready=(await Promise.all(ASSETS.map(path=>cache.match(path)))).every(Boolean);
      event.ports[0].postMessage({ready,version:CACHE});
    }catch{event.ports[0].postMessage({ready:false});}
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate'&&url.pathname===scope.pathname){
      const welcome=await cache.match('./index.html');if(welcome)return welcome;
    }
    const cached=await cache.match(event.request,{ignoreSearch:event.request.mode==='navigate'});
    return cached||fetch(event.request);
  })());
});
