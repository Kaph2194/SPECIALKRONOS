import { DAYS_ES, typeColor, getMondayOfWeek, dateToStr, timeToMin } from '../../utils/dateUtils';

export default function WeekView({ viewDate, events, onEventClick, onCellClick }) {
  const today = new Date();
  const monday = getMondayOfWeek(viewDate);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86400000));

  return (
    <div className="week-view">
      <div className="week-grid">
        {/* Corner */}
        <div className="week-corner" style={{ gridRow: 1, gridColumn: 1, borderBottom: '1px solid var(--border)', height: 56 }} />

        {/* Day headers */}
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div key={i} className="week-header-cell">
              <div className="wday">{DAYS_ES[d.getDay()]}</div>
              <div className={isToday ? 'wnum wnum-today' : 'wnum'}>{d.getDate()}</div>
            </div>
          );
        })}

        {/* Hour rows */}
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ display: 'contents' }}>
            <div className="week-time-cell">{h === 0 ? '' : String(h).padStart(2, '0') + ':00'}</div>
            {days.map((d, di) => {
              const ds = dateToStr(d);
              const isToday = d.toDateString() === today.toDateString();
              const hourEvs = events.filter(e => e.date === ds && parseInt(e.start) === h);
              return (
                <div
                  key={di}
                  className={`week-day-col${isToday ? ' today-col' : ''}`}
                  onClick={() => onCellClick(ds, h)}
                >
                  <div className="week-hour-slot" />
                  {hourEvs.map(ev => {
                    const c = typeColor(ev.type);
                    const sm = timeToMin(ev.start), em = timeToMin(ev.end);
                    const dur = Math.max(em - sm, 30);
                    const top = ((sm % 60) / 60) * 48;
                    const ht = (dur / 60) * 48;
                    return (
                      <div
                        key={ev.id}
                        className="week-event"
                        style={{ background: c + '33', borderLeft: `3px solid ${c}`, color: c, top, height: ht }}
                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
