self.importScripts("https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js");
localforage.config({ name: "localforage", storeName: "keyvaluepairs" });
const TKEY = "threads_v1";
const now = () => Date.now();
const gid = () => Math.random().toString(36).slice(2, 9);
const titleFrom = (t) => String(t || "").replace(/\s+/g, " ").trim().slice(0, 60) || "Untitled";
async function loadThreads() {
  const v = await localforage.getItem(TKEY);
  return Array.isArray(v) ? v : [];
}
async function saveThreads(v) {
  await localforage.setItem(TKEY, v);
}
async function pickLatestThread(threads) {
  if (!threads.length) return null;
  let best = threads[0], bu = +best.updatedAt || 0;
  for (const t of threads) {
    const u = +t.updatedAt || 0;
    if (u > bu) {
      best = t;
      bu = u;
    }
  }
  return best;
}
async function ensureThreadForWrite(reqMeta) {
  let threads = await loadThreads();
  let th = await pickLatestThread(threads);
  if (!th) {
    const id = gid();
    const firstUser = (reqMeta.messages || []).find((m) => m && m.role === "user")?.content || "";
    th = { id, title: titleFrom(firstUser), pinned: false, updatedAt: now(), messages: [] };
    threads.unshift(th);
    await saveThreads(threads);
  }
  return th.id;
}
async function appendAssistantPlaceholder(threadId, meta) {
  let threads = await loadThreads();
  let th = threads.find((t) => t.id === threadId);
  if (!th) {
    th = { id: threadId, title: "Untitled", pinned: false, updatedAt: now(), messages: [] };
    threads.unshift(th);
  }
  const mid = "sw_" + gid();
  const msg = { id: mid, role: "assistant", content: "", sune_name: "", model: meta?.model || "", avatar: "", sw: true };
  th.messages = [...Array.isArray(th.messages) ? th.messages : [], msg];
  th.updatedAt = now();
  await saveThreads(threads);
  return mid;
}
async function updateAssistantContent(threadId, mid, content) {
  let threads = await loadThreads();
  const th = threads.find((t) => t.id === threadId);
  if (!th) return;
  const i = (th.messages || []).findIndex((m) => m && m.id === mid);
  if (i < 0) return;
  th.messages[i].content = content;
  th.updatedAt = now();
  await saveThreads(threads);
}
async function parseAndPersist(stream, threadId, mid) {
  const reader = stream.getReader();
  const dec = new TextDecoder("utf-8");
  let buf = "", full = "", lastWrite = 0;
  const flush = async (force = false) => {
    const t = Date.now();
    if (force || t - lastWrite > 250) {
      await updateAssistantContent(threadId, mid, full);
      lastWrite = t;
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!chunk) continue;
      if (chunk.startsWith("data:")) {
        const data = chunk.slice(5).trim();
        if (data === "[DONE]") {
          await flush(true);
          return;
        }
        try {
          const json = JSON.parse(data);
          const d = json && json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content || "";
          if (d) {
            full += d;
            await flush(false);
          }
        } catch (_) {
        }
      }
    }
  }
  await flush(true);
}
async function handleOpenRouterEvent(event) {
  const req = event.request;
  const url = new URL(req.url);
  const isTarget = url.hostname === "openrouter.ai" && /\/api\/v1\/chat\/completions$/.test(url.pathname);
  if (!isTarget) return fetch(req);
  let reqMeta = {};
  try {
    const t = await req.clone().text();
    reqMeta = JSON.parse(t || "{}");
  } catch (_) {
  }
  if (!reqMeta || !reqMeta.stream) {
    return fetch(req);
  }
  const res = await fetch(req);
  if (!res.body) return res;
  const [toClient, toTap] = res.body.tee();
  event.waitUntil((async () => {
    try {
      const msgs = Array.isArray(reqMeta.messages) ? reqMeta.messages : [];
      const meta = { sune_name: "", model: reqMeta.model || "", avatar: "" };
      const threadId = await ensureThreadForWrite({ messages: msgs });
      const mid = await appendAssistantPlaceholder(threadId, meta);
      await parseAndPersist(toTap, threadId, mid);
    } catch (_) {
    }
  })());
  const headers = new Headers(res.headers);
  return new Response(toClient, { status: res.status, statusText: res.statusText, headers });
}
self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (e) => {
  e.respondWith(handleOpenRouterEvent(e));
});
