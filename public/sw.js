// Service Worker - Special CAR Kronos

self.addEventListener("install", () => {
  console.log("[SW] Instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("[SW] Activado");
  e.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push recibido:", event.data?.text());

  let data = { title: "Special CAR", body: "Tienes un evento próximo" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Special CAR", {
      body: data.body || "",
      icon: "/SPECIALKRONOS/logo.jpg",
      badge: "/SPECIALKRONOS/logo.jpg",
      vibrate: [300, 100, 300],
      tag: data.tag || "specialcar",
      renotify: true,
      data: data.data || { url: "https://kaph2194.github.io/SPECIALKRONOS" },
      actions: [
        { action: "open", title: "📅 Ver evento" },
        { action: "close", title: "Cerrar" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notificación clickeada:", event.action);
  event.notification.close();

  if (event.action === "close") return;

  const url =
    event.notification.data?.url || "https://kaph2194.github.io/SPECIALKRONOS";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes("SPECIALKRONOS") && "focus" in client)
            return client.focus();
        }
        return clients.openWindow(url);
      }),
  );
});

// Sin listener de message para evitar el error de channel closed
