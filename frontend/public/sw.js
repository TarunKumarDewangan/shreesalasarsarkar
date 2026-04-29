// ── SSS Finance Service Worker ──────────────────────────────────────────────
const APP_VERSION   = 'v3';
const CACHE_SHELL   = `sss-shell-${APP_VERSION}`;
const CACHE_DYNAMIC = `sss-dynamic-${APP_VERSION}`;

// App shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.png',
];

// ── INSTALL: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

// ── ACTIVATE: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_DYNAMIC)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API requests → Pass through directly. Do NOT intercept with event.respondWith()
  //    Intercepting causes every API call to be made TWICE (original + SW fetch).
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('api.shreesalasarsarkarfin.com') ||
    request.method !== 'GET'
  ) {
    return; // Let browser handle it natively — no double-fetch
  }

  // 2. HTML navigation requests → Network first, fallback to cached /index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts) → Cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => cache.put(request, cloned));
        }
        return response;
      });
    })
  );
});
