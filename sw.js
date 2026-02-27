/* ULTRA RUMBLE Guide — Service Worker (cache assets for faster repeat visits)
   Note: caches cross-origin image requests as opaque responses. */

const CACHE = 'urm-guide-v6';
const CORE = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/data/roster.json',
  './assets/data/site.json',
  './assets/data/urm-character-map.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

const isImage = (req) => req.destination === 'image' || /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(req.url);
const isDBAsset = (url) => {
  try {
    const u = new URL(url);
    return (
      (u.hostname === 'ultrarumble.com' || u.hostname === 'fr.ultrarumble.com') &&
      u.pathname.startsWith('/assets/')
    );
  } catch { return false; }
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Cache-first for DB images/assets (cross-origin hotlinks)
  if (isImage(req) && isDBAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Network-first for same-origin navigations
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Default: pass-through
});
