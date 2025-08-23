self.addEventListener("install",()=>{})
self.addEventListener("activate",()=>{})

const DB="sw-streams",STORE="sessions"
let dbp=null
function db(){if(dbp)return dbp;dbp=new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(STORE,{keyPath:"sid"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbp}
function idbGet(sid){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(STORE,"readonly").objectStore(STORE).get(sid);t.onsuccess=()=>res(t.result||null);t.onerror=()=>rej(t.error)}))}
function idbPut(rec){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite").objectStore(STORE).put(rec);t.onsuccess=()=>res();t.onerror=()=>rej(t.error)}))}
function idbMerge(sid,patch){return idbGet(sid).then(cur=>{const rec=Object.assign({sid,text:"",done:false,updatedAt:Date.now()},cur||{},patch||{});rec.updatedAt=Date.now();return idbPut(rec)})}
function idbAppend(sid,add){return idbGet(sid).then(cur=>{const rec=Object.assign({sid,text:"",done:false,updatedAt:Date.now()},cur||{});rec.text+=add;rec.updatedAt=Date.now();return idbPut(rec)})}
function idbDelete(sid){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite").objectStore(STORE).delete(sid);t.onsuccess=()=>res();t.onerror=()=>rej(t.error)}))}
function idbAll(){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(STORE,"readonly").objectStore(STORE).getAll();t.onsuccess=()=>res(t.result||[]);t.onerror=()=>rej(t.error)}))}

const ctrls=new Map()

self.addEventListener("fetch",event=>{
  const u=new URL(event.request.url)
  const isOR=u.origin==="https://openrouter.ai"&&u.pathname==="/api/v1/chat/completions"&&event.request.method==="POST"
  if(isOR){event.respondWith(proxyOpenRouter(event));return}
  if(u.pathname==="/swproxy/history"&&event.request.method==="GET"){event.respondWith(handleHistory(u));return}
  if(u.pathname==="/swproxy/clear"&&event.request.method==="POST"){event.respondWith(handleClear(event.request));return}
  if(u.pathname==="/swproxy/abort"&&event.request.method==="POST"){event.respondWith(handleAbort(event.request));return}
  if(u.pathname==="/swproxy/sessions"&&event.request.method==="GET"){event.respondWith(handleSessions());return}
})

async function proxyOpenRouter(event){
  const req=event.request
  let bodyText=""
  try{bodyText=await req.clone().text()}catch(_){}
  const isStream=/\"stream\"\s*:\s*true/.test(bodyText)
  const sid="s_"+Math.random().toString(36).slice(2)+Date.now().toString(36)
  await idbMerge(sid,{sid,text:"",done:false})
  console.log("[SW] intercept",sid,"stream=",isStream)
  const init={method:"POST",headers:new Headers(req.headers),body:bodyText||req.body,mode:"cors",cache:"no-store",credentials:"omit",signal:req.signal}
  try{
    const upstream=await fetch("https://openrouter.ai/api/v1/chat/completions",init)
    const hs=new Headers(upstream.headers)
    hs.set("Cache-Control","no-store")
    hs.set("X-SW-Proxied","1")
    hs.set("X-SW-Stream-Sid",sid)
    if(!isStream||!upstream.body){await idbMerge(sid,{done:true});console.log("[SW]",sid,"non-stream or no body");return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:hs})}
    const [branchClient,branchStore]=upstream.body.tee()
    pumpToStore(branchStore,sid)
    return new Response(branchClient,{status:upstream.status,statusText:upstream.statusText,headers:hs})
  }catch(e){
    await idbMerge(sid,{done:true})
    console.log("[SW]",sid,"error",String(e&&e.message||e))
    return new Response("upstream_error",{status:502})
  }
}

function pumpToStore(stream,sid){
  const reader=stream.getReader()
  const dec=new TextDecoder()
  let buf="",acc=0,last=0
  function parsePush(txt){
    buf+=txt
    let i
    while((i=buf.indexOf("\n\n"))!==-1){
      const chunk=buf.slice(0,i).trim()
      buf=buf.slice(i+2)
      if(!chunk)continue
      if(chunk.startsWith("data:")){
        const data=chunk.slice(5).trim()
        if(data==="[DONE]"){idbMerge(sid,{done:true});ctrls.delete(sid);console.log("[SW]",sid,"done totalChars=",acc);continue}
        try{
          const j=JSON.parse(data)
          const d=j&&j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content||""
          if(d){acc+=d.length;idbAppend(sid,d);if(acc-last>=500){last=acc;console.log("[SW]",sid,"bufferedChars=",acc)}}
        }catch(_){}
      }
    }
  }
  function step(){return reader.read().then(({value,done})=>{
    if(done){idbMerge(sid,{done:true});ctrls.delete(sid);console.log("[SW]",sid,"eof totalChars=",acc);return}
    parsePush(dec.decode(value,{stream:true}))
    return step()
  }).catch(()=>{idbMerge(sid,{done:true});ctrls.delete(sid);console.log("[SW]",sid,"pump error")})}
  step()
}

async function handleHistory(u){
  const sid=u.searchParams.get("sid")||""
  const rec=await idbGet(sid)
  const body=JSON.stringify({sid,text:rec?.text||"",done:!!rec?.done,updatedAt:rec?.updatedAt||0})
  return new Response(body,{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})
}

async function handleSessions(){
  const all=await idbAll()
  const list=all.map(x=>({sid:x.sid,textLen:(x.text||"").length,done:!!x.done,updatedAt:x.updatedAt||0}))
  return new Response(JSON.stringify(list),{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})
}

async function handleClear(req){
  const {sid}=await req.json()
  await idbDelete(sid)
  ctrls.delete(sid)
  console.log("[SW]",sid,"cleared")
  return new Response("ok",{status:200})
}

async function handleAbort(req){
  const {sid}=await req.json()
  const c=ctrls.get(sid)
  if(c)c.abort()
  ctrls.delete(sid)
  await idbMerge(sid,{done:true})
  console.log("[SW]",sid,"aborted")
  return new Response("ok",{status:200})
}
