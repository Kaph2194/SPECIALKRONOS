import { useState } from 'react';
import { MONTHS_ES, DAYS_ES, dateToStr, typeColor } from '../utils/dateUtils';

const VIEWS = [
  { id: 'month', icon: '📅', label: 'Mes' },
  { id: 'week', icon: '📆', label: 'Semana' },
  { id: 'day', icon: '📋', label: 'Día' },
  { id: 'list', icon: '📝', label: 'Lista' },
];

const LEGEND = [
  { type: 'reunion', color: '#7c6ef0', label: 'Reuniones' },
  { type: 'tarea', color: '#4ecdc4', label: 'Tareas' },
  { type: 'evento', color: '#c8a96e', label: 'Eventos' },
  { type: 'cita', color: '#ff6b6b', label: 'Citas' },
];

export default function Sidebar({ currentView, onViewChange, onNewEvent, events, selectedDate, onSelectDate, viewDate }) {
  const [miniDate, setMiniDate] = useState(new Date(viewDate));

  const y = miniDate.getFullYear(), m = miniDate.getMonth();
  const today = new Date();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const eventDates = new Set(events.map(e => e.date));

  let cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, other: false });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, other: true });

  return (
    <div className="sidebar">
      <button className="new-event-btn" onClick={onNewEvent}>
        <span style={{ fontSize: 18 }}>+</span> Nuevo Evento
      </button>

      <div className="sidebar-section">
        <span className="sidebar-label">Vista</span>
        {VIEWS.map(v => (
          <div
            key={v.id}
            className={`nav-item ${currentView === v.id ? 'active' : ''}`}
            onClick={() => onViewChange(v.id)}
          >
            <span className="nav-icon">{v.icon}</span>
            {v.label}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">Mini Calendario</span>
        <div className="mini-cal-header">
          <button className="mini-cal-nav" onClick={() => setMiniDate(new Date(y, m - 1, 1))}>‹</button>
          <span className="mini-cal-title">{MONTHS_ES[m].slice(0, 3)} {y}</span>
          <button className="mini-cal-nav" onClick={() => setMiniDate(new Date(y, m + 1, 1))}>›</button>
        </div>
        <div className="mini-cal-grid">
          {DAYS_ES.map(d => <div key={d} className="mini-day-hdr">{d.charAt(0)}</div>)}
          {cells.map((cell, i) => {
            const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const isToday = cell.day === today.getDate() && m === today.getMonth() && y === today.getFullYear() && !cell.other;
            const isSel = cell.day === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear() && !cell.other;
            const hasEv = eventDates.has(ds) && !cell.other;
            return (
              <div
                key={i}
                className={`mini-day${cell.other ? ' other-month' : ''}${isToday ? ' today' : ''}${isSel ? ' selected' : ''}${hasEv ? ' has-event' : ''}`}
                onClick={() => !cell.other && onSelectDate(new Date(y, m, cell.day))}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">Tipos</span>
        {LEGEND.map(l => (
          <div key={l.type} className="legend-item">
            <div className="legend-dot" style={{ background: l.color }}></div>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
