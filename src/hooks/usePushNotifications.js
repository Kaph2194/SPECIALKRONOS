import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";

const VAPID_PUBLIC_KEY =
  "BNONYbggccoFONVbm1WN1btXzsLNPli5L8Aw015RZG_PuFL75g5gXu-WISJgjWLl8eCX2kbHhdpOiKuGpfgzc5g";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userEmail) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const autoTriggered = useRef(false);

  // 1. Registrar service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/sw.js`)
      .then((reg) => console.log("SW registrado:", reg.scope))
      .catch((err) => console.error("SW error:", err));
  }, []);

  // 2. Verificar suscripción existente en Supabase
  useEffect(() => {
    if (!userEmail) return;
    supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_email", userEmail)
      .then(({ data }) => setSubscribed(data && data.length > 0));
  }, [userEmail]);

  const doSubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!userEmail) return;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;

      // Cancelar suscripción vieja si existe
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from("push_subscriptions").upsert(
        {
          user_email: userEmail,
          subscription: sub.toJSON(),
        },
        { onConflict: "user_email" },
      );

      setSubscribed(true);
    } catch (err) {
      console.error("Error al suscribirse a push:", err);
    }
  }, [userEmail]);

  // 3. Auto-suscribir al cargar si el permiso ya fue concedido
  //    o pedir permiso después de 3 segundos si aún no se ha pedido
  useEffect(() => {
    if (!userEmail || autoTriggered.current || subscribed) return;

    autoTriggered.current = true;

    if (Notification.permission === "granted") {
      // Ya tiene permiso → suscribir silenciosamente
      doSubscribe();
    } else if (Notification.permission === "default") {
      // Pedir permiso después de 3s para no asustar al usuario
      const timer = setTimeout(() => {
        doSubscribe();
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Si es 'denied', no hacer nada
  }, [userEmail, subscribed, doSubscribe]);

  const subscribe = useCallback(() => doSubscribe(), [doSubscribe]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_email", userEmail);

      setSubscribed(false);
      autoTriggered.current = false;
    } catch (err) {
      console.error("Error al desuscribirse:", err);
    }
  }, [userEmail]);

  return { permission, subscribed, subscribe, unsubscribe };
}
