/* sw.js */
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()))
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()))

const ch=new BroadcastChannel('llm-stream')
const streams=new Map()
const send=m=>ch.postMessage(m)
const parseSSE=async(res,emit,signal)=>{
  const r=res.body.getReader(),d=new TextDecoder('utf-8');let buf=''
  const doneOnce=()=>emit('',true)
  for(;;){const {value,done}=await r.read();if(done)break;buf+=d.decode(value,{stream:true});let i
    while((i=buf.indexOf('\n\n'))!==-1){const chunk=buf.slice(0,i).trim();buf=buf.slice(i+2)
      if(!chunk)continue
      if(chunk.startsWith('data:')){const data=chunk.slice(5).trim();if(data==='[DONE]'){doneOnce();continue}
        try{const j=JSON.parse(data);emit(j.choices?.[0]?.delta?.content??'',!!j.choices?.[0]?.finish_reason)}catch{}}
    }}
  doneOnce()
}

const openStream=(id,req)=>{
  const ac=new AbortController();let off=0,buf='',done=false
  const record={ctrl:ac,get off(){return off},get buf(){return buf},get done(){return done}}
  streams.set(id,record)
  const run=(async()=>{try{
    const res=await fetch(req.url,{method:req.method||'POST',headers:req.headers||{},body:JSON.stringify(req.body||{}),signal:ac.signal})
    if(!res.ok)throw new Error((await res.text().catch(()=>''))||('HTTP '+res.status))
    await parseSSE(res,(delta,isDone)=>{if(delta){buf+=delta;off=buf.length;send({id,delta,off})}if(isDone&&!done){done=true;send({id,done:true,off})}},ac.signal)
  }catch(e){send({id,error:String(e?.message||e)})}
  finally{if(!done){done=true;send({id,done:true,off})}streams.delete(id)}})()
  return run
}

const cancelStream=id=>{const r=streams.get(id);if(r)try{r.ctrl.abort()}catch{}}
const replayStream=(id,from=0)=>{const r=streams.get(id);if(!r)return;const s=r.buf||'',start=Math.max(0,from),CH=16384;for(let i=start;i<s.length;i+=CH){const b=s.slice(i,Math.min(s.length,i+CH));send({id,delta:b,off:i+b.length})}}

self.addEventListener('message',e=>{
  const msg=e.data||{},port=e.ports?.[0];const ok=d=>port&&port.postMessage(Object.assign({ok:true},d||{}));const err=m=>port&&port.postMessage({error:String(m||'error')})
  if(!msg.type)return
  if(msg.type==='hello')return ok({stream:true})
  if(msg.type==='stream-openrouter'){const {id,req}=msg.data||{};if(!id||!req)return err('bad args');const p=openStream(id,req);e.waitUntil(p);return ok({})}
  if(msg.type==='stream-cancel'){const {id}=msg.data||{};if(!id)return err('bad args');cancelStream(id);return ok({})}
  if(msg.type==='stream-replay'){const {id,from}=msg.data||{};if(!id)return err('bad args');replayStream(id,from|0);return ok({})}
})
