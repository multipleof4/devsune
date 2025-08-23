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
      { tag: 'meta', attrs: { charset: 'utf-8' }, injectTo: 'head' },
      { tag: 'title', children: 'Sune', injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'icon', type: 'image/avif', href: 'https://sune.planetrenox.com/✺.avif' }, injectTo: 'head' },
      { tag: 'style', children: ':root{--safe-bottom:env(safe-area-inset-bottom)}::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:999px}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}', injectTo: 'head' },
      {
        tag: 'script',
        children: `(function(){
  function ready(f){if(document.readyState!=='loading')f();else document.addEventListener('DOMContentLoaded',f)}
  function overlay(){
    var o=document.getElementById('sw-overlay'); if(o) return o
    o=document.createElement('div'); o.id='sw-overlay'
    Object.assign(o.style,{position:'fixed',top:'0',left:'0',right:'0',padding:'18px 56px 18px 20px',zIndex:'2147483647',background:'linear-gradient(90deg,#ff9800,#ffc107)',color:'#fff',textAlign:'center',font:'700 18px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',letterSpacing:'0.4px',boxShadow:'0 8px 24px rgba(0,0,0,.25)'})
    var text=document.createElement('span'); text.id='sw-overlay-text'
    var x=document.createElement('button'); x.type='button'; x.textContent='×'
    Object.assign(x.style,{position:'absolute',top:'8px',right:'12px',width:'36px',height:'36px',border:'0',borderRadius:'10px',background:'rgba(255,255,255,.18)',color:'#fff',fontSize:'24px',cursor:'pointer'})
    x.addEventListener('click',function(){o.remove();sessionStorage.setItem('swOverlayClosed','1')})
    o.appendChild(text); o.appendChild(x); document.body.appendChild(o); return o
  }
  function setStatus(kind,msg){
    var o=overlay(), t=o.querySelector('#sw-overlay-text')
    if(kind==='ok'){o.style.background='linear-gradient(90deg,#00c853,#00e5ff)'; t.textContent=msg||'SERVICE WORKER: ACTIVE'}
    else if(kind==='fail'){o.style.background='linear-gradient(90deg,#c62828,#ad1457)'; t.textContent=msg||'SERVICE WORKER: NOT RUNNING'}
    else {o.style.background='linear-gradient(90deg,#ff9800,#ffc107)'; t.textContent=msg||'SERVICE WORKER: WAITING'}
  }
  ready(function(){
    if(sessionStorage.getItem('swOverlayClosed')==='1') return
    setStatus('wait','SERVICE WORKER: WAITING')
    if(!('serviceWorker' in navigator)){setStatus('fail','NO SERVICE WORKER SUPPORT'); alert('NO SERVICE WORKER SUPPORT'); return}
    var ok=false
    navigator.serviceWorker.addEventListener('message',function(){ok=true; setStatus('ok','SERVICE WORKER: ACTIVE')})
    navigator.serviceWorker.ready.then(function(reg){if(reg&&reg.active) reg.active.postMessage({type:'PING',ts:Date.now()})})
    setTimeout(function(){if(!ok){setStatus('fail','SERVICE WORKER: NOT RUNNING'); alert('SERVICE WORKER NOT RUNNING')}},3000)
  })
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
