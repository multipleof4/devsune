const V='2'
const send=m=>self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>cs.forEach(c=>c.postMessage(m)))

self.addEventListener('install',e=>{self.skipWaiting()})
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim().then(()=>send({type:'SW_ACTIVE',v:V,ts:Date.now()})))})

const ORIGINS=['openrouter.ai']
const isTarget=req=>{const u=new URL(req.url);return ORIGINS.some(h=>u.hostname.endsWith(h))&&req.method==='POST'}
const wantsStream=async req=>{try{return /"stream"\s*:\s*true/i.test(await req.clone().text())}catch{return false}}

self.addEventListener('fetch',e=>{
  const req=e.request
  const nav=req.mode==='navigate'
  if(nav) return
  if(!isTarget(req)) return
  e.respondWith((async()=>{
    if(!(await wantsStream(req))) return fetch(req)
    const netRes=await fetch(req)
    const reader=netRes.body?.getReader()
    if(!reader) return netRes
    send({type:'SW_STREAM_START',url:req.url,ts:Date.now()})
    let done=false,bytes=0,buf=[],bufBytes=0,waiter=null,notify=null
    const MAX=2*1024*1024,LOW=1*1024*1024
    const pump=(async()=>{for(;;){const r=await reader.read();if(r.done){done=true;break}const chunk=r.value;buf.push(chunk);bufBytes+=chunk.byteLength||chunk.length;bytes+=chunk.byteLength||chunk.length;send({type:'SW_STREAM_BYTES',n:bytes})
      if(bufBytes>MAX) await new Promise(r=>{notify=r;waiter=r})}})()
    e.waitUntil(pump)
    const stream=new ReadableStream({
      start(c){const loop=async()=>{for(;;){if(buf.length){const x=buf.shift();bufBytes-=x.byteLength||x.length;c.enqueue(x);if(notify&&bufBytes<=LOW){const n=notify;notify=null;n()}}
        else if(done){c.close();send({type:'SW_STREAM_END',bytes});break}
        else await new Promise(r=>setTimeout(r,30))}}
        loop()},
      cancel(){try{reader.cancel()}catch{}}
    })
    const h=new Headers(netRes.headers);h.delete('content-length')
    return new Response(stream,{status:netRes.status,statusText:netRes.statusText,headers:h})
  })())
})

self.addEventListener('message',e=>{
  const m=e.data||{}
  if(m&&m.type==='PING'){(e.source||null)?.postMessage({type:'PONG',v:V,ts:Date.now()})||send({type:'PONG',v:V,ts:Date.now()})}
})
