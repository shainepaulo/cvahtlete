const CACHE_NAME = 'athlete-cv-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer absolument toutes les requêtes POST, PUT, DELETE (les Server Actions Next.js)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer Next.js internal, API, admin, Supabase
  const url = event.request.url;
  if (
    !url.startsWith(self.location.origin) ||
    url.includes('/_next/') ||
    url.includes('/api/') ||
    url.includes('/admin') ||
    url.includes('supabase')
  ) {
    return;
  }
});
