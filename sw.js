// Service Worker para notificaciones push - Special CAR

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Recibir notificación push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Special CAR', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.jpg',
    badge: data.badge || '/logo.jpg',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: '📅 Ver evento' },
      { action: 'close', title: 'Cerrar' },
    ],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Special CAR', options)
  );
});

// Click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || 'https://kaph2194.github.io/SPECIALKRONOS';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
