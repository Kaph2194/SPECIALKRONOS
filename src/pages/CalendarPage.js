import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalendar } from '../hooks/useCalendar';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import EventModal from '../components/EventModal';
import EventDetailModal from '../components/EventDetailModal';
import MonthView from '../components/views/MonthView';
import WeekView from '../components/views/WeekView';
import DayView from '../components/views/DayView';
import ListView from '../components/views/ListView';
import { MONTHS_ES, DAYS_ES, getMondayOfWeek, dateToStr } from '../utils/dateUtils';

const NOTIF_KEY = 'kronos_notifs_v2';

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { events, syncing, error, loadEvents, createEvent, updateEvent, deleteEvent, checkFreebusy, hasConflict } = useCalendar();

  const [view, setView] = useState('month');
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [prefillDate, setPrefillDate] = useState(null);
  const [prefillHour, setPrefillHour] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  // Load events when month changes
  useEffect(() => {
    loadEvents(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate.getFullYear(), viewDate.getMonth(), loadEvents]);

  // Show API errors
  useEffect(() => {
    if (error) toast(error, 'error');
  }, [error, toast]);

  // Add notification helper
  const pushNotif = useCallback((msg) => {
    const n = { id: Date.now(), msg, time: new Date().toISOString(), unread: true };
    setNotifications(prev => {
      const updated = [n, ...prev].slice(0, 50);
      localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── NAVIGATION ──
  function navigate(dir) {
    setViewDate(prev => {
      if (view === 'month') return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      if (view === 'week') return new Date(prev.getTime() + dir * 7 * 86400000);
      return new Date(prev.getTime() + dir * 86400000);
    });
  }

  function getViewTitle() {
    const y = viewDate.getFullYear(), m = viewDate.getMonth();
    if (view === 'month') return `${MONTHS_ES[m]} ${y}`;
    if (view === 'week') {
      const mon = getMondayOfWeek(viewDate);
      const sun = new Date(mon.getTime() + 6 * 86400000);
      return `${mon.getDate()} ${MONTHS_ES[mon.getMonth()].slice(0, 3)} — ${sun.getDate()} ${MONTHS_ES[sun.getMonth()].slice(0, 3)} ${sun.getFullYear()}`;
    }
    if (view === 'day') return `${DAYS_ES[viewDate.getDay()]}, ${viewDate.getDate()} ${MONTHS_ES[m]} ${y}`;
    return 'Todos los Eventos';
  }

  // ── OPEN MODAL ──
  function openNew(ds = null, hour = null) {
    setEditMode(false); setEditEvent(null);
    setPrefillDate(ds ? new Date(ds + 'T00:00:00') : selectedDate);
    setPrefillHour(hour);
    setModalOpen(true);
  }

  function openEdit(ev) {
    setEditMode(true); setEditEvent(ev);
    setPrefillDate(null); setPrefillHour(null);
    setModalOpen(true);
  }

  // ── SAVE ──
  async function handleSave(data) {
    if (editMode) {
      const updated = await updateEvent(data);
      pushNotif(`✏️ Evento actualizado: "${updated.title}"`);
      toast('✓ Evento actualizado en Google Calendar', 'success');
    } else {
      const created = await createEvent(data);
      pushNotif(`📅 Nuevo evento: "${created.title}" el ${created.date} a las ${created.start}`);
      toast('✓ Evento creado en Google Calendar', 'success');
    }
  }

  // ── DELETE ──
  async function handleDelete(googleId) {
    await deleteEvent(googleId);
    pushNotif('🗑 Evento eliminado');
    toast('Evento eliminado de Google Calendar', 'warning');
  }

  // ── SELECT DATE ──
  function handleSelectDate(d) {
    setSelectedDate(d);
    setViewDate(d);
    if (view === 'month') setView('day');
  }

  // ── NOTIFS ──
  function markRead(id) {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, unread: false } : n);
      localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearNotifs() {
    setNotifications([]);
    localStorage.setItem(NOTIF_KEY, '[]');
  }

  // Close notif panel on outside click
  useEffect(() => {
    const handler = e => {
      if (!e.target.closest('.notif-panel') && !e.target.closest('.notif-btn'))
        setNotifPanelOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const initDate = prefillDate || selectedDate;
  const initData = editMode && editEvent ? editEvent : {
    date: dateToStr(initDate),
    start: prefillHour !== null ? String(prefillHour).padStart(2, '0') + ':00' : '09:00',
    end: prefillHour !== null ? String(Math.min(prefillHour + 1, 23)).padStart(2, '0') + ':00' : '10:00',
  };

  return (
    <div className="app-shell">
      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-brand-icon">⏰</div>
          Kronos
        </div>
        <div className="topbar-right">
          {syncing && (
            <div className="sync-badge syncing">
              <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              Sincronizando...
            </div>
          )}
          {!syncing && (
            <div className="sync-badge">
              ✓ Google Calendar
            </div>
          )}

          {/* Notif button */}
          <div className="notif-btn" onClick={() => setNotifPanelOpen(p => !p)}>
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </div>

          {/* User chip */}
          <div className="user-chip" title="Cerrar sesión" onClick={logout}>
            {user?.picture
              ? <img src={user.picture} alt="avatar" className="user-avatar" />
              : <div className="user-avatar-placeholder">{user?.name?.charAt(0) || '?'}</div>
            }
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.email}
            </span>
            <span style={{ color: 'var(--text2)', fontSize: 12 }}>↗</span>
          </div>
        </div>
      </div>

      {/* ── NOTIF PANEL ── */}
      {notifPanelOpen && (
        <div className="notif-panel">
          <div className="notif-panel-hdr">
            <span>🔔 Notificaciones</span>
            <span className="notif-clear" onClick={clearNotifs}>Limpiar</span>
          </div>
          <div className="notif-list">
            {notifications.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>Sin notificaciones</div>
              : notifications.map(n => (
                <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`} onClick={() => markRead(n.id)}>
                  {n.unread && <div className="notif-dot" />}
                  {!n.unread && <div style={{ width: 7, marginTop: 5 }} />}
                  <div className="notif-content">
                    <div className="notif-msg">{n.msg}</div>
                    <div className="notif-time">{new Date(n.time).toLocaleString('es-CO')}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── LAYOUT ── */}
      <div className="app-layout">
        <Sidebar
          currentView={view}
          onViewChange={setView}
          onNewEvent={() => openNew()}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          viewDate={viewDate}
        />

        <div className="main-content">
          {/* View tabs */}
          <div className="view-tabs">
            {['month','week','day','list'].map(v => (
              <button key={v} className={`view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : v === 'day' ? 'Día' : 'Lista'}
              </button>
            ))}
          </div>

          {/* View header */}
          <div className="view-header">
            <div className="view-title">{getViewTitle()}</div>
            <div className="view-nav">
              <button className="view-nav-btn" onClick={() => navigate(-1)}>‹</button>
              <button className="today-btn" onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }}>Hoy</button>
              <button className="view-nav-btn" onClick={() => navigate(1)}>›</button>
            </div>
          </div>

          {/* Views */}
          {view === 'month' && (
            <MonthView
              viewDate={viewDate} selectedDate={selectedDate} events={events}
              onSelectDate={handleSelectDate}
              onEventClick={ev => setDetailEvent(ev)}
              onCellClick={(ds, h) => openNew(ds, h)}
            />
          )}
          {view === 'week' && (
            <WeekView
              viewDate={viewDate} events={events}
              onEventClick={ev => setDetailEvent(ev)}
              onCellClick={(ds, h) => openNew(ds, h)}
            />
          )}
          {view === 'day' && (
            <DayView
              viewDate={viewDate} events={events}
              onEventClick={ev => setDetailEvent(ev)}
              onCellClick={(ds, h) => openNew(ds, h)}
            />
          )}
          {view === 'list' && (
            <ListView events={events} onEventClick={ev => setDetailEvent(ev)} />
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={editMode ? editEvent : initData}
          selectedDate={initDate}
          onSave={handleSave}
          onDelete={handleDelete}
          hasConflict={hasConflict}
          checkFreebusy={checkFreebusy}
          editMode={editMode}
        />
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={ev => { setDetailEvent(null); openEdit(ev); }}
          onDelete={async (gid) => { await handleDelete(gid); setDetailEvent(null); }}
        />
      )}
    </div>
  );
}
