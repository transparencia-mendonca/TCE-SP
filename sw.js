/* v0.9.17 — worker de transição: remove caches e se desregistra.
   O painel permanece temporariamente sem cache offline durante a fase de atualização frequente. */
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>/^tcesp-mendonca-/i.test(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
  try{await self.registration.unregister()}catch(_e){}
})())});
