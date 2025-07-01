const CACHE_NAME = 'telemed-v1.0.0';
const STATIC_CACHE_NAME = 'telemed-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'telemed-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/call-sound.mp3',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/users\/profile$/,
  /^\/api\/appointments$/,
  /^\/api\/notifications/,
  /^\/api\/users\/doctors/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('Service Worker: Static caching failed', err))
  );
});

// Activate event - remove old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          if (![CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(key)) {
            console.log('Service Worker: Deleting old cache', key);
            return caches.delete(key);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle http(s) GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// API cache strategy: Network-first
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);

    // Skip caching partial responses (206)
    if (response.status === 206) return response;

    if (response.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('Service Worker: Network error, trying cache', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    if (shouldReturnOfflineResponse(url.pathname)) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'You are currently offline. Some features may be limited.',
          cached: false
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response('Network error occurred', { status: 500 });
  }
}

// Static asset strategy: Cache-first
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);

    // Skip caching partial responses (206)
    if (response.status === 206) return response;

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('Service Worker: Static fetch failed', request.url);

    if (request.mode === 'navigate') {
      const offlineFallback = await caches.match('/');
      return offlineFallback || new Response('Offline', { status: 503 });
    }

    return new Response('Static resource error', { status: 500 });
  }
}

// Determine if API should be cached
function shouldCacheApiResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Offline fallback for key API endpoints
function shouldReturnOfflineResponse(pathname) {
  const offlineEndpoints = [
    '/api/users/profile',
    '/api/appointments',
    '/api/notifications'
  ];
  return offlineEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

// Background Sync Handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Executing background sync...');
  // Implement queued sync logic here
}

// Push Notification Handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'You have a new notification from TeleMed',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { primaryKey: 1, dateOfArrival: Date.now() },
    actions: [
      { action: 'explore', title: 'View', icon: '/icons/checkmark.png' },
      { action: 'close', title: 'Dismiss', icon: '/icons/xmark.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TeleMed', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/notifications'));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message Listener (for SKIP_WAITING and GET_VERSION)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
