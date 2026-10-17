// Circuit Studio service worker.
// The app needs the internet: nothing is cached or served offline.
// It exists only so the browser can offer "Install app".
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:600 18px system-ui;text-align:center;padding:40px">📡 Internet connection required<br><span style="font-weight:400;font-size:15px">Circuit Studio works only online. Reconnect and try again.</span>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));
  }
});
