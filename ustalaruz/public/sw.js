const CACHE_VERSION = 'usta-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const VERSION_URL = '/api/version';

// Where the last seen deploy version is kept, so a deploy can be detected by
// comparing consecutive readings. Never wiped along with the content caches -
// losing it would make the next check look like a fresh install.
const VERSION_CACHE = 'usta-deploy-version';
const VERSION_KEY = '/__deploy_version';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

// Install — precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== VERSION_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Periodic version check — force update if the deployed version changed.
//
// This used to compare /api/version against CACHE_VERSION ('usta-v4'). That
// endpoint returns the backend's git SHA, so the two were never equal: every
// check reported a version change, wiped all caches and called skipWaiting,
// which meant the caches were permanently useless AND a real deploy was never
// actually detected. Compare consecutive readings of the endpoint instead.
async function checkVersionAndUpdate() {
  try {
    const response = await fetch(VERSION_URL, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) return;
    const { version } = await response.json();
    if (!version) return;

    const store = await caches.open(VERSION_CACHE);
    const previous = await store.match(VERSION_KEY);
    const previousVersion = previous ? await previous.text() : null;
    await store.put(VERSION_KEY, new Response(version));

    // First run has nothing to compare against, and an unchanged version is
    // the normal case - neither is a reason to throw the caches away.
    if (previousVersion === null || previousVersion === version) return;

    console.log(`[SW] Deploy detected: ${previousVersion} -> ${version}, clearing caches`);
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key !== VERSION_CACHE).map((key) => caches.delete(key))
    );
    await self.registration.update();
    self.skipWaiting();
  } catch (err) {
    console.log('[SW] Version check failed:', err);
  }
}

// Check version every 30 minutes
setInterval(checkVersionAndUpdate, 30 * 60 * 1000);

// Also check on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(checkVersionAndUpdate());
});

// Fetch — cache-first for static, network-first for API/navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests — network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // API requests — network only, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Django builds the manifest from SiteSettings, so an admin-uploaded logo or
  // a renamed app only shows up if this is fetched fresh. It is precached and
  // would otherwise be served by the cache-first branch below forever. Network
  // first, with the cached copy as the offline fallback.
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'BACKGROUND_SYNC', tag: 'sync-orders' });
    });
  } catch (err) {
    console.log('Background sync failed:', err);
  }
}

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'PERIODIC_SYNC' });
    });
  } catch (err) {
    console.log('Periodic sync failed:', err);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Usta';
  const options = {
    body: data.body || 'Yangi xabar bor',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Ochish' },
      { action: 'dismiss', title: 'Bekor qilish' },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'PUSH_RECEIVED' }));
      }),
    ])
  );
});

// Browser invalidated/rotated our subscription (expired token, push
// service reset, etc). Re-subscribe and re-register without waiting for
// the user to reopen the app.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keyRes = await fetch('/api/push/public-key/');
        const { publicKey } = await keyRes.json();
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const subJSON = newSub.toJSON();
        await fetch('/api/push/register/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJSON.endpoint,
            p256dh: subJSON.keys.p256dh,
            auth: subJSON.keys.auth,
          }),
        });
      } catch (err) {
        console.log('[SW] pushsubscriptionchange re-subscribe failed:', err);
      }
    })()
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});