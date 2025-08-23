import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'

const pwa = VitePWA({
  strategies: 'injectManifest',
  registerType: 'autoUpdate',
  injectManifest: { injectionPoint: undefined },
  devOptions: { enabled: true },
  manifest: {
    id: 'https://sune.planetrenox.com/',
    name: 'Sune',
    short_name: 'Sune',
    description: 'OpenRouter GUI Frontend',
    start_url: 'https://sune.planetrenox.com/',
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
      { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/tiny-ripple@0.2.0' }, injectTo: 'head' },
      { tag: 'style', children: ':root{--safe-bottom:env(safe-area-inset-bottom)}::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:999px}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}', injectTo: 'head' },
      {
        tag: 'script',
        children: `(function(){function n(t){let e=document.getElementById("sw-banner");if(!e){e=document.createElement("div");e.id="sw-banner";Object.assign(e.style,{position:"fixed",zIndex:"99999",top:"12px",right:"12px",maxWidth:"90vw",background:"#111",color:"#fff",padding:"10px 12px",borderRadius:"12px",boxShadow:"0 6px 18px rgba(0,0,0,.3)",font:"14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif"});document.body.appendChild(e)}e.textContent=String(t);clearTimeout(e.__to);e.__to=setTimeout(()=>{e&&e.parentNode&&e.parentNode.removeChild(e)},3000)}if(!("serviceWorker"in navigator)){n("Service Worker not supported");return}navigator.serviceWorker.addEventListener("message",e=>{let d=e.data;try{d=typeof d==="object"?JSON.stringify(d):String(d)}catch{}n(d)});navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:"PING",ts:Date.now()})});})();`,
        injectTo: 'head'
      }
    ]
  }
})

export default defineConfig({
  build: { outDir: 'docs', minify: false },
  plugins: [pwa, html]
})
