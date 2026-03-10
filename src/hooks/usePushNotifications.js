import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const VAPID_PUBLIC_KEY = 'BNONYbggccoFONVbm1WN1btXzsLNPli5L8Aw015RZG_PuFL75g5gXu-WISJgjWLl8eCX2kbHhdpOiKuGpfgzc5g';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(userEmail) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  // Registrar service worker al cargar
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`)
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.error('SW error:', err));
    }
  }, []);

  // Verificar si ya está suscrito
  useEffect(() => {
    if (!userEmail) return;
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_email', userEmail)
      .then(({ data }) => setSubscribed(data && data.length > 0));
  }, [userEmail]);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from('push_subscriptions').upsert({
        user_email: userEmail,
        subscription: sub.toJSON(),
      }, { onConflict: 'user_email' });

      setSubscribed(true);
    } catch (err) {
      console.error('Error al suscribirse:', err);
    }
  }, [userEmail]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_email', userEmail);

      setSubscribed(false);
    } catch (err) {
      console.error('Error al desuscribirse:', err);
    }
  }, [userEmail]);

  return { permission, subscribed, subscribe, unsubscribe };
}
