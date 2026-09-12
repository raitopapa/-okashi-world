// Change VERSION whenever a shipped asset changes; an install is all-or-nothing.
const VERSION='v2.1.0';
const ROOT=new URL('./',self.location.href);
const PREFIX=`okashi-world-${ROOT.pathname}-`;
const CACHE=PREFIX+VERSION;
const FILES=[
  './','index.html','style.css','manifest.webmanifest',
  'js/app.js','js/model.js','js/art.js','js/atlas-map.js','js/audio.js','js/celebrations.js','js/storage.js','js/minigames.js',
  'assets/garden.webp','assets/seaside.webp','assets/snow.webp','assets/parts.png','assets/workshop.png','assets/icon-192.png','assets/icon-512.png',
];
const URLS=FILES.map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(URLS);await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  // A failed offline navigation must not replace cached artwork or script responses.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate')return (await cache.match(new URL('index.html',ROOT).href))||fetch(request);
    const cached=await cache.match(request,{ignoreSearch:true});
    return cached||fetch(request);
  })());
});
