import { DAYS_ES, MONTHS_ES, typeColor, dateToStr } from '../../utils/dateUtils';

export default function DayView({ viewDate, events, onEventClick, onCellClick }) {
  const ds = dateToStr(viewDate);
  const dayEvents = events.filter(e => e.date === ds);

  return (
    <div className="day-view">
      <div className="day-grid">
        {Array.from({ length: 24 }, (_, h) => {
          const hourEvs = dayEvents.filter(e => parseInt(e.start) === h);
          return (
            <div key={h} style={{ display: 'contents' }}>
              <div className="day-time">{h === 0 ? '' : String(h).padStart(2, '0') + ':00'}</div>
              <div className="day-slot" onClick={() => onCellClick(ds, h)}>
                {hourEvs.map(ev => {
                  const c = typeColor(ev.type);
                  return (
                    <div
                      key={ev.id}
                      className="day-event"
                      style={{ background: c + '18', borderLeftColor: c }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    >
                      <div className="day-event-title" style={{ color: c }}>{ev.title}</div>
                      <div className="day-event-time">{ev.start} — {ev.end}{ev.location ? ` · ${ev.location}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
