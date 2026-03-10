import {
  MONTHS_ES,
  DAYS_ES,
  typeColor,
  typeLabel,
  typeEmoji,
} from "../../utils/dateUtils";

function getEventStatus(date, start, end) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 5);

  if (date < today) return "past";
  if (date > today) return "upcoming";
  // Es hoy
  if (currentTime >= end) return "past";
  if (currentTime >= start && currentTime < end) return "now";
  return "today";
}

const STATUS_CONFIG = {
  past: {
    label: "Finalizado",
    bg: "rgba(120,120,140,0.15)",
    color: "#888899",
    icon: "✓",
  },
  now: {
    label: "En curso",
    bg: "rgba(78,205,100,0.15)",
    color: "#4ecd64",
    icon: "●",
  },
  today: {
    label: "Hoy",
    bg: "rgba(74,111,202,0.15)",
    color: "#6b8fd4",
    icon: "◈",
  },
  upcoming: {
    label: "Próximo",
    bg: "rgba(200,169,110,0.12)",
    color: "#c8a96e",
    icon: "◷",
  },
};

export default function ListView({ events, onEventClick }) {
  if (!events.length) {
    return (
      <div className="list-view">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Sin eventos</div>
          <div className="empty-sub">
            Crea tu primer evento usando el botón "Nuevo Evento"
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) =>
    (a.date + a.start).localeCompare(b.date + b.start),
  );
  const grouped = {};
  sorted.forEach((ev) => {
    if (!grouped[ev.date]) grouped[ev.date] = [];
    grouped[ev.date].push(ev);
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="list-view">
      {Object.keys(grouped)
        .sort()
        .map((date) => {
          const d = new Date(date + "T00:00:00");
          const isToday = date === today;
          const isPast = date < today;

          return (
            <div key={date}>
              {/* Header de fecha */}
              <div
                className="list-group-hdr"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ opacity: isPast ? 0.5 : 1 }}>
                  {DAYS_ES[d.getDay()]}, {d.getDate()} {MONTHS_ES[d.getMonth()]}{" "}
                  {d.getFullYear()}
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      padding: "2px 10px",
                      borderRadius: 20,
                      background: "rgba(74,111,202,0.2)",
                      color: "#6b8fd4",
                      textTransform: "uppercase",
                    }}
                  >
                    HOY
                  </span>
                )}
              </div>

              {grouped[date].map((ev) => {
                const c = typeColor(ev.type);
                const status = getEventStatus(date, ev.start, ev.end);
                const st = STATUS_CONFIG[status];
                const dimmed = status === "past";

                return (
                  <div
                    key={ev.id}
                    className="list-item"
                    onClick={() => onEventClick(ev)}
                    style={{ opacity: dimmed ? 0.55 : 1 }}
                  >
                    <div className="list-item-bar" style={{ background: c }} />
                    <div className="list-item-time">
                      {ev.start}
                      <br />
                      <span style={{ color: "var(--text2)" }}>{ev.end}</span>
                    </div>
                    <div className="list-item-info">
                      <div
                        className="list-item-title"
                        style={{
                          textDecoration: dimmed ? "line-through" : "none",
                          textDecorationColor: "rgba(255,255,255,0.3)",
                        }}
                      >
                        {ev.title}
                      </div>
                      <div className="list-item-meta">
                        {ev.location || typeLabel(ev.type)}
                        {ev.attendees?.length
                          ? ` · ${ev.attendees.length} participante(s)`
                          : ""}
                      </div>
                    </div>

                    {/* Badge tipo */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 5,
                      }}
                    >
                      <div
                        className="list-item-badge"
                        style={{ background: c + "22", color: c }}
                      >
                        {typeEmoji(ev.type)} {typeLabel(ev.type)}
                      </div>
                      {/* Badge estado */}
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                          background: st.bg,
                          color: st.color,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: status === "now" ? 8 : 10 }}>
                          {st.icon}
                        </span>
                        {st.label}
                      </div>
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
