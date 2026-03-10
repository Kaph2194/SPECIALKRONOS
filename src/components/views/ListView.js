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
  if (currentTime >= end) return "past";
  if (currentTime >= start && currentTime < end) return "now";
  return "today";
}

const STATUS_CONFIG = {
  past: {
    label: "Finalizado",
    bg: "#2a2a3a",
    color: "#7a7a9a",
    border: "#3a3a5a",
    icon: "✓",
  },
  now: {
    label: "En curso",
    bg: "#0d3320",
    color: "#4ecd64",
    border: "#1a6640",
    icon: "●",
  },
  today: {
    label: "Hoy",
    bg: "#0d1f45",
    color: "#6b8fd4",
    border: "#1a3a80",
    icon: "◈",
  },
  upcoming: {
    label: "Próximo",
    bg: "#2a1f0a",
    color: "#e8c06a",
    border: "#5a4010",
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
              <div
                className="list-group-hdr"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ opacity: isPast ? 0.45 : 1 }}>
                  {DAYS_ES[d.getDay()]}, {d.getDate()} {MONTHS_ES[d.getMonth()]}{" "}
                  {d.getFullYear()}
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 2,
                      padding: "3px 12px",
                      borderRadius: 20,
                      background: "#1a3a80",
                      color: "#6b8fd4",
                      border: "1px solid #2a5aaa",
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
                    style={{
                      opacity: dimmed ? 0.5 : 1,
                      borderLeft:
                        status === "now" ? "2px solid #4ecd64" : undefined,
                    }}
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
                          textDecorationColor: "rgba(255,255,255,0.25)",
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

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                        minWidth: 100,
                      }}
                    >
                      {/* Badge tipo */}
                      <div
                        className="list-item-badge"
                        style={{ background: c + "22", color: c }}
                      >
                        {typeEmoji(ev.type)} {typeLabel(ev.type)}
                      </div>
                      {/* Badge estado — más grande y visible */}
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 12px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          minWidth: 90,
                          justifyContent: "center",
                          boxShadow:
                            status === "now"
                              ? "0 0 10px rgba(78,205,100,0.3)"
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: status === "now" ? 7 : 11,
                            animation:
                              status === "now" ? "pulse 1.5s infinite" : "none",
                          }}
                        >
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
