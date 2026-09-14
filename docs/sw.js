/* JobApply AI (GitHub Pages) service worker.
   App-shell caching: HTML (network-first) + assets (cache-first).
   User data lives in localStorage — never cached here. */
const VERSION = 'jobapply-pages-v2';
const ASSETS = `${VERSION}-assets`;
const PAGES = `${VERSION}-pages`;

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './matcher.js',
  './parser.js',
  './app.js?v=2',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './bg-silk.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(ASSETS).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  /* CDN libs (pdf.js, mammoth): cache-first */
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(ASSETS).then((c) => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }

  /* HTML: network-first with cache fallback */
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((h) => h || caches.match('./index.html')))
    );
    return;
  }

  /* other same-origin assets: cache-first */
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(ASSETS).then((c) => c.put(e.request, copy));
      return res;
    }))
  );
});
