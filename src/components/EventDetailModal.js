import { typeColor, typeEmoji, typeLabel, formatDate } from '../utils/dateUtils';

export default function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;
  const c = typeColor(event.type);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="ev-detail-hdr">
          <div className="ev-detail-type" style={{ color: c }}>
            {typeEmoji(event.type)} {typeLabel(event.type).toUpperCase()}
          </div>
          <div className="ev-detail-title">{event.title}</div>
        </div>

        <div className="modal-body">
          <div className="ev-meta-row">📅 <span>{formatDate(event.date)}</span></div>
          <div className="ev-meta-row">🕐 <span>{event.start} — {event.end}</span></div>
          {event.location && <div className="ev-meta-row">📍 <span>{event.location}</span></div>}
          {event.desc && (
            <div className="ev-meta-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              📝 <span style={{ marginTop: 4, color: 'var(--text)' }}>{event.desc}</span>
            </div>
          )}

          {event.attendees?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 10 }}>
                Participantes ({event.attendees.length})
              </div>
              <div className="attendee-list">
                {event.attendees.map((a, i) => (
                  <div key={a.email || i} className="attendee-item">
                    <div className="attendee-avatar" style={{ background: 'var(--accent2)' }}>
                      {(a.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="attendee-info">
                      <div className="attendee-email">{a.email}</div>
                      <div className="attendee-status">
                        {a.status === 'accepted' ? '✓ Aceptado' :
                          a.status === 'declined' ? '✗ Rechazado' :
                            a.self ? '👤 Organizador' : '○ Pendiente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.htmlLink && (
            <div style={{ marginTop: 16 }}>
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                🔗 Ver en Google Calendar ↗
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => { onDelete(event.googleId); onClose(); }}>🗑 Eliminar</button>
          <button className="btn btn-secondary" onClick={() => { onEdit(event); onClose(); }}>✏️ Editar</button>
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
