const CACHE='sana-little-hands-beta-v160-gallery-icon';
const PREFIX='sana-little-hands-beta-';
const ASSETS=['./sese-enhanced-v89.png','./index.html','./play.html','./age-profiles.js','./app.js','./app.js?v160','./bgm-sana-v86.mp3','./pwa.js','./share.js','./share.css','./parent-guide.js','./parent-guide.css','./picture-puzzle.js','./picture-puzzle.css','./puzzle-garden.svg','./puzzle-sana-banana.webp','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./count-art/apple-tree.webp','./count-art/basket.webp','./count-art/carrot-garden.webp','./count-art/rabbit.webp','./count-art/apple.webp','./count-art/carrot.webp','./train-art/locomotive-colour-v126.webp','./train-art/carriage-turquoise-v126.webp','./train-art/carriage-yellow-v126.webp','./train-art/carriage-coral-v126.webp','./train-art/carriage-violet-v126.webp','./train-art/farm-sky-v126.webp'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{
      await cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})));
    }catch(error){
      await caches.delete(CACHE);
      throw error;
    }
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
