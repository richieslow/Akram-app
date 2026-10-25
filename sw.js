const CACHE='akram-v237-20261024a';
const LIBS='akram-libs-v1';
const SHELL=['./'];
const CDN_HOSTS=['unpkg.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==LIBS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
// Librerías y fuentes externas: se sirven de caché al instante y se actualizan en segundo plano.
// Solo se guardan respuestas CORS/same-origin con estado 200 (nunca una respuesta opaca o un error).
function libFetch(e){
  const req=e.request;
  return caches.open(LIBS).then(c=>c.match(req).then(hit=>{
    const net=fetch(req).then(r=>{
      if(r&&r.ok&&(r.type==='cors'||r.type==='basic'))c.put(req,r.clone());
      return r;
    });
    if(hit){e.waitUntil(net.catch(()=>{}));return hit;}
    return net;
  }));
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin){
    if(CDN_HOSTS.indexOf(url.hostname)>-1)e.respondWith(libFetch(e));
    return;
  }
  // Mismo origen (la app): red primero y sin caché del navegador, como antes, para no servir versiones viejas.
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return r;}).catch(()=>caches.match(e.request)));
});
