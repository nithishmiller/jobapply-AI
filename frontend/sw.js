/* JobApply AI service worker — app-shell caching for offline install.
   - HTML/API: network-first with cache fallback (fresh when online)
   - static assets: cache-first with versioned URLs (?v=N)
   - never caches POST/PUT/DELETE or /sync traffic
*/
const VERSION = 'jobapply-v19';
const ASSET_CACHE = `${VERSION}-assets`;
const PAGE_CACHE = `${VERSION}-pages`;

const PRECACHE = [
    '/',
    '/static/css/style.css?v=18',
    '/static/js/main.js?v=19',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/static/assets/bg-silk.jpg',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(PAGE_CACHE)
            .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // Never serve cached sync/API mutations or live status
    if (url.pathname.startsWith('/sync')) return;

    // Static assets & icons: cache-first (URLs are version-busted)
    if (url.pathname.startsWith('/static/') || url.pathname === '/manifest.webmanifest') {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(ASSET_CACHE).then((c) => c.put(req, copy));
                return res;
            }))
        );
        return;
    }

    // Pages & API GETs: network-first, fall back to cache when offline
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
});
