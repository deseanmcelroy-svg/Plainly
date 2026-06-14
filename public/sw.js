// ===========================================================================
// Minimal service worker for Plainly's PWA support.
//
// Goals:
//   - Make the app installable (a service worker is required for the
//     "Add to Home Screen" / install prompt on most browsers)
//   - Cache the app shell (static assets, icons) so the app opens instantly
//     and shows something even with a flaky connection
//   - NEVER cache API routes (/api/*) — ballot data, auth, and profile
//     info must always be fresh
//
// This is intentionally simple. For more advanced caching strategies
// (stale-while-revalidate, background sync, etc.), consider the next-pwa
// package — but that adds a build dependency, so this hand-written version
// avoids that for now.
// ===========================================================================

const CACHE_NAME = 'plainly-shell-v1';

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API routes — always go to the network.
  if (url.pathname.startsWith('/api/')) return;

  // Never cache Supabase auth requests or other cross-origin requests.
  if (url.origin !== self.location.origin) return;

  // For navigations and static assets: try the network first, fall back to
  // cache if offline. This keeps content fresh while still working offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache a copy of successful responses for offline fallback.
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
