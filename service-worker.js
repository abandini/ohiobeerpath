/**
 * Ohio Beer Path - Service Worker
 * 
 * This service worker enables offline functionality and improves performance
 * by caching assets and API responses.
 */

// Cache names
const STATIC_CACHE_NAME = 'ohiobeerpath-static-v1';
const DYNAMIC_CACHE_NAME = 'ohiobeerpath-dynamic-v1';
const API_CACHE_NAME = 'ohiobeerpath-api-v1';
const IMAGE_CACHE_NAME = 'ohiobeerpath-images-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.php',
  '/breweries.php',
  '/itinerary.php',
  '/assets/css/styles.css',
  '/assets/css/mobile.css',
  '/assets/css/loading.css',
  '/assets/css/search.css',
  '/assets/css/itinerary.css',
  '/assets/js/core.js',
  '/assets/js/search.js',
  '/assets/js/itinerary.js',
  '/assets/images/logo.png',
  '/assets/images/og-image.jpg',
  '/assets/images/favicon/favicon.ico',
  '/assets/images/favicon/android-chrome-192x192.png',
  '/site.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the service worker controls all pages
  self.clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (
            key !== STATIC_CACHE_NAME && 
            key !== DYNAMIC_CACHE_NAME && 
            key !== API_CACHE_NAME && 
            key !== IMAGE_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );
  
  return self.clients.claim();
});

// Helper function to determine if a request is for an API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Helper function to determine if a request is for an image
function isImageRequest(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  return imageExtensions.some(ext => url.pathname.endsWith(ext)) || 
         url.pathname.includes('/assets/images/');
}

// Helper function to determine if a request should be cached
function shouldCache(url) {
  // Don't cache Google Maps requests
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('google.com')) {
    return false;
  }
  
  // Don't cache admin pages
  if (url.pathname.startsWith('/admin/')) {
    return false;
  }
  
  return true;
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin && 
      !url.hostname.includes('cdnjs.cloudflare.com') && 
      !url.hostname.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  // Don't cache POST requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Don't cache if we shouldn't
  if (!shouldCache(url)) {
    return;
  }
  
  // Strategy for API requests: Network first, then cache
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();
          
          caches.open(API_CACHE_NAME)
            .then(cache => {
              // Store the response in cache
              cache.put(event.request, clonedResponse);
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If API request fails and not in cache, return a default API response
              return new Response(
                JSON.stringify({ 
                  error: true, 
                  message: 'You are currently offline. Please check your connection.' 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            });
        })
    );
    return;
  }
  
  // Strategy for image requests: Cache first, then network
  if (isImageRequest(url)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Clone the response to store in cache
              const clonedResponse = response.clone();
              
              caches.open(IMAGE_CACHE_NAME)
                .then(cache => {
                  // Store the response in cache
                  cache.put(event.request, clonedResponse);
                });
              
              return response;
            })
            .catch(() => {
              // If image can't be fetched, return a placeholder
              if (url.pathname.includes('/breweries/')) {
                return caches.match('/assets/images/breweries/placeholder.jpg');
              }
              
              // For other images, return a generic placeholder
              return caches.match('/assets/images/placeholder.jpg');
            });
        })
    );
    return;
  }
  
  // Strategy for static assets: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Clone the response to store in cache
            const clonedResponse = response.clone();
            
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                // Store the response in cache
                cache.put(event.request, clonedResponse);
              });
            
            return response;
          })
          .catch(() => {
            // If static asset can't be fetched and it's an HTML page, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // For other resources, just fail
            return new Response('Not available offline', { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for saving itineraries when offline
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Syncing', event);
  
  if (event.tag === 'sync-itinerary') {
    event.waitUntil(
      // Get all itineraries waiting to be synced from IndexedDB
      // and send them to the server
      syncItineraries()
    );
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Notification received', event);
  
  let data = { title: 'New Notification', content: 'Something new happened!' };
  
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  
  const options = {
    body: data.content,
    icon: '/assets/images/favicon/android-chrome-192x192.png',
    badge: '/assets/images/favicon/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.openUrl || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;
  const url = notification.data.url;
  
  console.log('[Service Worker] Notification click', action);
  
  notification.close();
  
  // Open the app and navigate to the URL
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window open
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Helper function to sync itineraries
async function syncItineraries() {
  // This would be implemented with IndexedDB
  // For now, just log that we would sync
  console.log('[Service Worker] Syncing itineraries...');
  
  // In a real implementation, we would:
  // 1. Open IndexedDB
  // 2. Get all unsynchronized itineraries
  // 3. Send them to the server one by one
  // 4. Mark them as synchronized in IndexedDB
  
  return Promise.resolve();
}
