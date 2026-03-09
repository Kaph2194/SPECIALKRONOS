import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import * as GCal from '../services/googleCalendar';

export function useCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const notifTimers = useRef([]);

  // ── Load events for a given month ──
  const loadEvents = useCallback(async (year, month) => {
    if (!user?.accessToken) return;
    setSyncing(true);
    setError(null);
    try {
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const fetched = await GCal.listEvents(user.accessToken, 'primary', timeMin, timeMax);
      setEvents(fetched);
      setLastSync(new Date());
    } catch (err) {
      setError('Error al cargar eventos: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // ── Create event ──
  const createEvent = useCallback(async (eventData) => {
    if (!user?.accessToken) return null;
    setSyncing(true);
    try {
      const created = await GCal.createEvent(user.accessToken, eventData);
      setEvents(prev => [...prev, created]);
      scheduleNotifications(created);
      return created;
    } catch (err) {
      setError('Error al crear evento: ' + err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // ── Update event ──
  const updateEvent = useCallback(async (eventData) => {
    if (!user?.accessToken) return null;
    setSyncing(true);
    try {
      const updated = await GCal.updateEvent(user.accessToken, eventData);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      return updated;
    } catch (err) {
      setError('Error al actualizar: ' + err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // ── Delete event ──
  const deleteEvent = useCallback(async (googleId) => {
    if (!user?.accessToken) return;
    setSyncing(true);
    try {
      await GCal.deleteEvent(user.accessToken, googleId);
      setEvents(prev => prev.filter(e => e.googleId !== googleId));
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // ── Check freebusy for attendees ──
  const checkFreebusy = useCallback(async (emails, start, end) => {
    if (!user?.accessToken || !emails.length) return {};
    try {
      return await GCal.checkFreebusy(user.accessToken, emails, start, end);
    } catch (_) {
      return {};
    }
  }, [user]);

  // ── Check conflict in local events ──
  const hasConflict = useCallback((date, start, end, excludeId = null) => {
    return events.find(e =>
      e.id !== excludeId &&
      e.date === date &&
      timeToMin(e.start) < timeToMin(end) &&
      timeToMin(e.end) > timeToMin(start)
    ) || null;
  }, [events]);

  // ── Schedule browser notifications ──
  function scheduleNotifications(ev) {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') return;
      const evDT = new Date(`${ev.date}T${ev.start}:00`);
      const now = Date.now();

      const schedule = (ms, msg) => {
        if (ms > 0) {
          const t = setTimeout(() => new Notification('⏰ Kronos', { body: msg, icon: '/favicon.ico' }), ms);
          notifTimers.current.push(t);
        }
      };

      if (ev.notif === 'both' || ev.notif === 'day') {
        schedule(evDT.getTime() - 24 * 3600 * 1000 - now, `Mañana: ${ev.title} a las ${ev.start}`);
      }
      if (ev.notif === 'both' || ev.notif === 'hours') {
        schedule(evDT.getTime() - 4 * 3600 * 1000 - now, `En 4 horas: ${ev.title} a las ${ev.start}`);
      }
    });
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => notifTimers.current.forEach(clearTimeout);
  }, []);

  return {
    events,
    syncing,
    error,
    lastSync,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    checkFreebusy,
    hasConflict,
  };
}

function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
