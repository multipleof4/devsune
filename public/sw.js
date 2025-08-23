const log = (...a) => console.log('[SW]', ...a)

self.addEventListener('install', e => {
  log('install')
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  log('activate')
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') log('navigate', e.request.url)
})

self.addEventListener('message', e => {
  log('message', e.data)
})
