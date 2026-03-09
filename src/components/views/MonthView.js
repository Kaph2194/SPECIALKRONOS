import { MONTHS_ES, DAYS_ES, typeColor, dateToStr } from '../../utils/dateUtils';

export default function MonthView({ viewDate, selectedDate, events, onSelectDate, onEventClick, onCellClick }) {
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const today = new Date();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  let cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, month: m - 1, year: y, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: m, year: y, other: false });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, month: m + 1, year: y, other: true });

  return (
    <div className="month-view">
      <div className="month-grid-header">
        {DAYS_ES.map(d => <div key={d} className="month-day-name">{d}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((cell, i) => {
          const ds = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const isToday = cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
          const isSel = cell.day === selectedDate.getDate() && cell.month === selectedDate.getMonth() && cell.year === selectedDate.getFullYear();
          const dayEv = events.filter(e => e.date === ds);

          return (
            <div
              key={i}
              className={`month-cell${cell.other ? ' other-month' : ''}${isToday ? ' today' : ''}${isSel ? ' selected' : ''}`}
              onClick={() => {
                onSelectDate(new Date(cell.year, cell.month, cell.day));
                onCellClick(ds, null);
              }}
            >
              <div className="month-cell-day">{cell.day}</div>
              {dayEv.slice(0, 3).map(ev => {
                const c = typeColor(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="month-event"
                    style={{ background: c + '22', color: c, borderLeft: `2px solid ${c}` }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    title={ev.title}
                  >
                    {ev.start?.slice(0, 5)} {ev.title}
                  </div>
                );
              })}
              {dayEv.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--text2)', padding: '1px 4px' }}>
                  +{dayEv.length - 3} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
