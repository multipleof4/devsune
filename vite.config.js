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
  function r(f){if(document.readyState!=='loading')f();else document.addEventListener('DOMContentLoaded',f)}
  function overlay(){
    var o=document.getElementById('sw-overlay'); if(o) return o
    o=document.createElement('div'); o.id='sw-overlay'
    Object.assign(o.style,{position:'fixed',top:'0',left:'0',right:'0',padding:'20px 24px',zIndex:'2147483647',background:'linear-gradient(90deg,#ff9800,#ffc107)',color:'#fff',textAlign:'center',font:'700 22px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif'})
    var s=document.createElement('span'); s.id='sw-overlay-text'
    o.appendChild(s); document.body.appendChild(o); return o
  }
  function setStatus(k,msg){
    var o=overlay(), t=o.querySelector('#sw-overlay-text')
    if(k==='ok'){o.style.background='linear-gradient(90deg,#00c853,#00e5ff)'; t.textContent=msg||'SERVICE WORKER: ACTIVE'}
    else if(k==='fail'){o.style.background='linear-gradient(90deg,#c62828,#ad1457)'; t.textContent=msg||'SERVICE WORKER: NOT RUNNING'}
    else {o.style.background='linear-gradient(90deg,#ff9800,#ffc107)'; t.textContent=msg||'SERVICE WORKER: WAITING'}
  }
  r(function(){
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
