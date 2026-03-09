import { MONTHS_ES, DAYS_ES, typeColor, typeLabel, typeEmoji, formatDate } from '../../utils/dateUtils';

export default function ListView({ events, onEventClick }) {
  if (!events.length) {
    return (
      <div className="list-view">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Sin eventos</div>
          <div className="empty-sub">Crea tu primer evento usando el botón "Nuevo Evento"</div>
        </div>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const grouped = {};
  sorted.forEach(ev => {
    if (!grouped[ev.date]) grouped[ev.date] = [];
    grouped[ev.date].push(ev);
  });

  return (
    <div className="list-view">
      {Object.keys(grouped).sort().map(date => {
        const d = new Date(date + 'T00:00:00');
        return (
          <div key={date}>
            <div className="list-group-hdr">
              {DAYS_ES[d.getDay()]}, {d.getDate()} {MONTHS_ES[d.getMonth()]} {d.getFullYear()}
            </div>
            {grouped[date].map(ev => {
              const c = typeColor(ev.type);
              return (
                <div key={ev.id} className="list-item" onClick={() => onEventClick(ev)}>
                  <div className="list-item-bar" style={{ background: c }} />
                  <div className="list-item-time">
                    {ev.start}
                    <br />
                    <span style={{ color: 'var(--text2)' }}>{ev.end}</span>
                  </div>
                  <div className="list-item-info">
                    <div className="list-item-title">{ev.title}</div>
                    <div className="list-item-meta">
                      {ev.location || typeLabel(ev.type)}
                      {ev.attendees?.length ? ` · ${ev.attendees.length} participante(s)` : ''}
                    </div>
                  </div>
                  <div className="list-item-badge" style={{ background: c + '22', color: c }}>
                    {typeEmoji(ev.type)} {typeLabel(ev.type)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
