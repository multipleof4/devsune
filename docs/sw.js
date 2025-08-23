const V = "1";
const send = (m) => self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => cs.forEach((c) => c.postMessage(m)));
self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    await self.clients.claim();
    await send({ type: "SW_ACTIVE", v: V, ts: Date.now() });
  })());
});
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "PING") {
    (e.source || null)?.postMessage({ type: "PONG", v: V, ts: Date.now() }) || send({ type: "PONG", v: V, ts: Date.now() });
  }
});
