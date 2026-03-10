// Service Worker - Special CAR

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Special CAR", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: "/SPECIALKRONOS/logo.jpg",
    badge: "/SPECIALKRONOS/logo.jpg",
    vibrate: [300, 100, 300, 100, 300],
    sound: "/SPECIALKRONOS/notif.mp3", // sonido en Android
    data: data.data || {},
    tag: data.tag || "specialcar-notif", // agrupa notificaciones del mismo evento
    renotify: true, // suena aunque ya exista una con el mismo tag
    requireInteraction: false,
    actions: [
      { action: "open", title: "📅 Ver evento" },
      { action: "close", title: "Cerrar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Special CAR", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const url =
    event.notification.data?.url || "https://kaph2194.github.io/SPECIALKRONOS";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
