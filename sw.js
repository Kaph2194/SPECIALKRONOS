// Service Worker - Special CAR Kronos

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Special CAR", body: "Tienes un evento próximo" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const notifPromise = self.registration.showNotification(
    data.title || "Special CAR",
    {
      body: data.body || "",
      icon: "/SPECIALKRONOS/logo.jpg",
      badge: "/SPECIALKRONOS/logo.jpg",
      vibrate: [300, 100, 300, 100, 300],
      tag: data.tag || "specialcar",
      renotify: true,
      data: data.data || { url: "https://kaph2194.github.io/SPECIALKRONOS" },
      actions: [
        { action: "open", title: "📅 Ver evento" },
        { action: "close", title: "Cerrar" },
      ],
    },
  );

  // Reproducir sonido enviando mensaje a la ventana abierta
  const soundPromise = clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((list) => {
      for (const client of list) {
        client.postMessage({ type: "PLAY_NOTIF_SOUND" });
      }
    });

  event.waitUntil(Promise.all([notifPromise, soundPromise]));
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
          if (client.url.includes("SPECIALKRONOS") && "focus" in client)
            return client.focus();
        }
        return clients.openWindow(url);
      }),
  );
});
