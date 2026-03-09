/**
 * googleCalendar.js
 * Wrapper sobre la Google Calendar API REST v3
 * Usa el access_token obtenido por Google OAuth
 */

const BASE = 'https://www.googleapis.com/calendar/v3';

// ── Obtiene todos los calendarios del usuario ──
export async function listCalendars(accessToken) {
  const res = await fetch(`${BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.items || [];
}

// ── Lista eventos de un rango de fechas ──
export async function listEvents(accessToken, calendarId = 'primary', timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: timeMin || new Date(new Date().setDate(1)).toISOString(),
    timeMax: timeMax || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return (data.items || []).map(normalizeEvent);
}

// ── Crea un evento ──
export async function createEvent(accessToken, event, calendarId = 'primary') {
  const body = buildEventBody(event);
  const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return normalizeEvent(await res.json());
}

// ── Actualiza un evento ──
export async function updateEvent(accessToken, event, calendarId = 'primary') {
  const body = buildEventBody(event);
  const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${event.googleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return normalizeEvent(await res.json());
}

// ── Elimina un evento ──
export async function deleteEvent(accessToken, googleId, calendarId = 'primary') {
  const res = await fetch(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
  return true;
}

// ── Comprueba disponibilidad (freebusy) ──
export async function checkFreebusy(accessToken, emails, timeMin, timeMax) {
  const res = await fetch(`${BASE}/freeBusy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: emails.map(id => ({ id })),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).calendars || {};
}

// ────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────

function buildEventBody(event) {
  const dateTime = (date, time) => {
    return { dateTime: `${date}T${time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  };

  const reminders = [];
  if (event.notif === 'both' || event.notif === 'day') {
    reminders.push({ method: 'email', minutes: 24 * 60 });
    reminders.push({ method: 'popup', minutes: 24 * 60 });
  }
  if (event.notif === 'both' || event.notif === 'hours') {
    reminders.push({ method: 'email', minutes: 4 * 60 });
    reminders.push({ method: 'popup', minutes: 4 * 60 });
  }

  return {
    summary: event.title,
    description: event.desc || '',
    location: event.location || '',
    start: dateTime(event.date, event.start),
    end: dateTime(event.date, event.end),
    attendees: (event.attendees || []).map(a => ({ email: a.email })),
    reminders: { useDefault: false, overrides: reminders },
    colorId: TYPE_COLOR_ID[event.type] || '1',
    extendedProperties: {
      private: { kronosType: event.type },
    },
  };
}

function normalizeEvent(raw) {
  const isAllDay = !raw.start?.dateTime;
  const start = raw.start?.dateTime || raw.start?.date || '';
  const end = raw.end?.dateTime || raw.end?.date || '';

  return {
    id: raw.id,
    googleId: raw.id,
    title: raw.summary || '(Sin título)',
    desc: raw.description || '',
    location: raw.location || '',
    date: start.slice(0, 10),
    start: isAllDay ? '00:00' : start.slice(11, 16),
    end: isAllDay ? '23:59' : end.slice(11, 16),
    type: raw.extendedProperties?.private?.kronosType || 'evento',
    attendees: (raw.attendees || []).map(a => ({
      email: a.email,
      status: a.responseStatus,
      self: a.self,
    })),
    notif: 'both',
    owner: raw.organizer?.email || '',
    htmlLink: raw.htmlLink,
    colorId: raw.colorId,
    isAllDay,
  };
}

// Google Calendar color IDs por tipo Kronos
const TYPE_COLOR_ID = {
  reunion: '9',   // Grape / purple
  tarea: '7',     // Sage / teal
  evento: '5',    // Banana / gold
  cita: '11',     // Tomato / red
};
