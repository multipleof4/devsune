import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'

const pwa = VitePWA({
  base: '/devsune/',
  strategies: 'injectManifest',
  registerType: 'autoUpdate',
  injectManifest: { injectionPoint: undefined },
  devOptions: { enabled: true },
  manifest: {
    id: '/devsune/',
    name: 'Sune',
    short_name: 'Sune',
    description: 'OpenRouter GUI Frontend',
    start_url: '/devsune/',
    scope: '/devsune/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#FFFFFF',
    background_color: '#000000',
    categories: ['productivity','utilities'],
    icons: [{ src: 'https://sune.planetrenox.com/appstore_content/✺.png', sizes: '1024x1024', type: 'image/png' }],
    screenshots: [
      { src: 'https://sune.planetrenox.com/appstore_content/screenshot1.jpg', sizes: '1344x2693', type: 'image/jpeg' },
      { src: 'https://sune.planetrenox.com/appstore_content/screenshot2.jpg', sizes: '1344x2699', type: 'image/jpeg' }
    ]
  }
})

const html = createHtmlPlugin({
  minify: false,
  inject: {
    tags: [
      {
        tag: 'script',
        children: `(function(){
  function h(v){try{return JSON.parse(v)}catch{return null}}
  function isOR(url){try{var u=new URL(url,location.href);return /(^|\\.)openrouter\\.ai$/i.test(u.hostname)&&/\\/api\\/v1\\/chat\\/completions$/.test(u.pathname)}catch{return false}}
  function hasStream(body){if(body==null)return false;try{if(typeof body==='string')return /"stream"\\s*:\\s*true/i.test(body);if(body instanceof Blob)return false;return false}catch{return false}}
  function ensureHeaders(hdrs){if(hdrs instanceof Headers){return hdrs}var out=new Headers();if(Array.isArray(hdrs)){hdrs.forEach(function(p){out.append(p[0],p[1])});return out}if(hdrs&&typeof hdrs==='object'){Object.keys(hdrs).forEach(function(k){out.append(k,hdrs[k])});return out}return out}
  function uid(){return 'swr-'+Math.random().toString(36).slice(2,10)}
  var ofetch=window.fetch
  window.fetch=function(input,init){
    try{
      var url=typeof input==='string'?input:(input&&input.url)||''
      var m=((init&&init.method)||(input&&input.method)||'GET').toUpperCase()
      if(m==='POST'&&isOR(url)){
        var body=(init&&init.body)||null
        if(hasStream(body)){
          var id=uid()
          var hdrs=ensureHeaders(init&&init.headers)
          hdrs.set('x-swr-id',id)
          init=Object.assign({},init,{headers:hdrs})
          sessionStorage.setItem('swr:current',id)
          sessionStorage.setItem('swr:seq:'+id,'0')
        }
      }
    }catch{}
    return ofetch.apply(this,arguments)
  }
  function applyDelta(id,seq,delta){
    try{
      var list=document.querySelectorAll('.msg-bubble'); if(!list.length)return
      var el=list[list.length-1]
      var cur=el.__swr_text||''
      el.__swr_text=cur+String(delta||'')
      if(window.markdownit){var md=window.markdownit({html:false,linkify:true,typographer:true,breaks:true});el.innerHTML=md.render(el.__swr_text)}
      else{el.textContent=el.__swr_text}
      sessionStorage.setItem('swr:seq:'+id,String(seq))
    }catch{}
  }
  function onMsg(e){
    var m=e&&e.data||{}
    if(!m||!m.type)return
    if(m.type==='SW_DELTA'){var id=m.id,seq=m.seq,delta=m.delta;if(id&&delta!=null)applyDelta(id,seq,delta)}
    else if(m.type==='SW_DONE'){var id=m.id;if(id){sessionStorage.removeItem('swr:current')}}
  }
  if(navigator.serviceWorker){
    navigator.serviceWorker.addEventListener('message',onMsg)
    function replay(){
      try{
        var id=sessionStorage.getItem('swr:current')
        if(!id)return
        var seq=sessionStorage.getItem('swr:seq:'+id)||'0'
        var ctrl=navigator.serviceWorker.controller
        if(ctrl) ctrl.postMessage({type:'SW_REPLAY',id,fromSeq:+seq})
      }catch{}
    }
    if(document.visibilityState==='visible'){
      navigator.serviceWorker.ready.then(function(){setTimeout(replay,0)})
    }
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible') replay()},{passive:true})
  }
})();`,
        injectTo: 'head'
      }
    ]
  }
})

export default defineConfig({
  base: '/devsune/',
  build: { outDir: 'docs', minify: false },
  plugins: [pwa, html]
})
