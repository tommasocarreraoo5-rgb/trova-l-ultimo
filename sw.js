// Trova l'Ultimo - Enhanced Service Worker with Notifications & PWA
const CACHE_NAME = 'trova-ultimo-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Let network handle dynamic API requests directly
  if (e.request.url.includes('/api/')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// System / Web Push Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_OPENED',
            data: clickAction
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Listener for messages from client to trigger system notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data, icon, tag } = event.data;
    self.registration.showNotification(title || "Trova l'Ultimo ⚽", {
      body: body || "",
      icon: icon || "/static/icons/icon-192x192.png",
      badge: "/static/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: tag || "trova_alert",
      renotify: true,
      data: data || {}
    });
  }
});
