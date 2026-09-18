/* Keeps the site usable on a tablet that loses Wi-Fi. Bump VERSION when you upload a new index.html. */
const VERSION = "ospe-v5";
const SDK = ["firebase-app.js", "firebase-auth.js", "firebase-firestore.js"].map(f => `https://www.gstatic.com/firebasejs/10.12.2/${f}`);
self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(VERSION);
  await c.addAll(["./", "./index.html"]).catch(() => {});
  await Promise.all(SDK.map(u => fetch(u, { mode: "cors" }).then(r => r.ok && c.put(u, r)).catch(() => {})));
  await self.skipWaiting();
})()));
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (SDK.includes(req.url)) { e.respondWith(caches.match(req.url).then(r => r || fetch(req))); return; }
  const url = new URL(req.url);
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if (r.ok && (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/"))) {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy));
    }
    return r;
  }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match("./index.html"))));
});
