import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Convierte base64url a Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

// Genera JWT para VAPID
async function generateVapidJWT(audience: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  const keyData = base64urlToUint8Array(VAPID_PRIVATE_KEY);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken),
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${unsignedToken}.${sigBase64}`;
}

// Envía notificación push a una suscripción
async function sendPushNotification(subscription: any, payload: string) {
  const endpoint = subscription.endpoint;
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await generateVapidJWT(audience);

  const headers: Record<string, string> = {
    Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
    "Content-Type": "application/octet-stream",
    TTL: "86400",
  };

  // Cifrar payload
  const encoder = new TextEncoder();
  const body = encoder.encode(payload);

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
  });

  return response.status;
}

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener todos los eventos de Google Calendar de los próximos 25 horas
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        status: 200,
      });
    }

    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Obtener eventos próximos desde la tabla de eventos
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("event_start", now.toISOString())
      .lte("event_start", in24h.toISOString());

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming events" }), {
        status: 200,
      });
    }

    let sent = 0;

    for (const event of events) {
      const eventStart = new Date(event.event_start);
      const diffMs = eventStart.getTime() - now.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      // Notificar si faltan ~30 min, ~4h o ~24h (con margen de 5 min)
      const shouldNotify =
        (diffMin >= 25 && diffMin <= 35) ||
        (diffMin >= 235 && diffMin <= 245) ||
        (diffMin >= 1435 && diffMin <= 1445);

      if (!shouldNotify) continue;

      const timeLabel =
        diffMin <= 35 ? "30 minutos" : diffMin <= 245 ? "4 horas" : "1 día";

      const payload = JSON.stringify({
        title: `⏰ ${event.title}`,
        body: `Comienza en ${timeLabel} · ${event.start_time}`,
        icon: "/logo.jpg",
        badge: "/logo.jpg",
        data: { url: "https://kaph2194.github.io/SPECIALKRONOS" },
      });

      // Enviar a todas las suscripciones del usuario
      const userSubs = subscriptions.filter(
        (s) => s.user_email === event.user_email,
      );
      for (const sub of userSubs) {
        await sendPushNotification(sub.subscription, payload);
        sent++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sent} notifications` }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
