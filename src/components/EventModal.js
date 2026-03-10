import { useState, useEffect, useCallback, useRef } from "react";
import { typeColor, typeLabel, typeEmoji, dateToStr } from "../utils/dateUtils";
import { useToast } from "./Toast";

const TYPES = ["reunion", "tarea", "evento", "cita"];
const COLORS = ["#7c6ef0", "#4ecdc4", "#c8a96e", "#ff6b6b"];
const ATT_COLORS = [
  "#7c6ef0",
  "#4ecdc4",
  "#c8a96e",
  "#ff6b6b",
  "#e87070",
  "#70c5e8",
];
const MAPS_API_KEY = "AIzaSyD384LajhnTFS4KSIioj_ASgeFTY1Tr2PU";

const DURATIONS = [
  { label: "15 minutos", minutes: 15 },
  { label: "30 minutos", minutes: 30 },
  { label: "45 minutos", minutes: 45 },
  { label: "1 hora", minutes: 60 },
  { label: "1 hora 30 min", minutes: 90 },
  { label: "2 horas", minutes: 120 },
  { label: "3 horas", minutes: 180 },
  { label: "4 horas", minutes: 240 },
  { label: "Día completo", minutes: 480 },
];

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function generateMeetLink() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

// Carga el script de Google Maps
function loadGoogleMaps() {
  return new Promise((resolve) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    if (document.getElementById("google-maps-script")) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&language=es`;
    script.async = true;
    script.onload = () => setTimeout(resolve, 200);
    document.head.appendChild(script);
  });
}

export default function EventModal({
  isOpen,
  onClose,
  initialData,
  selectedDate,
  onSave,
  onDelete,
  hasConflict,
  checkFreebusy,
  editMode,
}) {
  const toast = useToast();
  const [type, setType] = useState("reunion");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("none");
  const [notif, setNotif] = useState("both");
  const [attendees, setAttendees] = useState([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendeeMsg, setAttendeeMsg] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [avail, setAvail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);

  const placeInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const end = addMinutes(start, duration);

  // Inicializar Google Places Autocomplete
  useEffect(() => {
    if (locationType !== "physical" || !isOpen) return;
    autocompleteRef.current = null;
    loadGoogleMaps().then(() => {
      if (!placeInputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(
        placeInputRef.current,
        {
          fields: ["formatted_address", "name"],
          componentRestrictions: { country: "co" },
        },
      );
      autocompleteRef.current = ac;
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const addr = place.formatted_address || place.name || "";
        setLocation(addr);
        if (placeInputRef.current) placeInputRef.current.value = addr;
      });
    });
    return () => {
      autocompleteRef.current = null;
    };
  }, [locationType, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editMode && initialData) {
      setType(initialData.type || "reunion");
      setTitle(initialData.title || "");
      setDesc(initialData.desc || "");
      setDate(initialData.date || dateToStr(selectedDate));
      setStart(initialData.start || "09:00");
      if (initialData.start && initialData.end) {
        const [sh, sm] = initialData.start.split(":").map(Number);
        const [eh, em] = initialData.end.split(":").map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        setDuration(diff > 0 ? diff : 60);
      } else {
        setDuration(60);
      }
      setLocation(initialData.location || "");
      setLocationType(initialData.locationType || "none");
      setNotif(initialData.notif || "both");
      setAttendees(initialData.attendees || []);
    } else {
      setType("reunion");
      setTitle("");
      setDesc("");
      setDate(dateToStr(selectedDate));
      setStart("09:00");
      setDuration(60);
      setLocation("");
      setLocationType("none");
      setNotif("both");
      setAttendees([]);
    }
    setAttendeeInput("");
    setAttendeeMsg(null);
    setConflict(null);
    setAvail(null);
    autocompleteRef.current = null;
  }, [isOpen, editMode, initialData, selectedDate]);

  const checkAvailability = useCallback(() => {
    if (!date || !start || !end || start >= end) {
      setAvail(null);
      return;
    }
    const c = hasConflict(date, start, end, editMode ? initialData?.id : null);
    setConflict(c || null);
    setAvail(c ? "busy" : "free");
  }, [date, start, end, hasConflict, editMode, initialData]);

  useEffect(() => {
    checkAvailability();
  }, [date, start, end, checkAvailability]);

  function handleGenerateMeet() {
    setGeneratingMeet(true);
    setTimeout(() => {
      setLocation(generateMeetLink());
      setGeneratingMeet(false);
      toast("✓ Link de Google Meet generado", "success");
    }, 800);
  }

  async function handleAddAttendee() {
    const email = attendeeInput.trim().toLowerCase();
    if (!email || !email.includes("@"))
      return toast("Ingresa un correo válido", "error");
    if (attendees.find((a) => a.email === email))
      return toast("Ya está en la lista", "warning");
    if (!date || !start) return toast("Define fecha y hora primero", "warning");
    const timeMin = new Date(`${date}T${start}:00`).toISOString();
    const timeMax = new Date(`${date}T${end}:00`).toISOString();
    const fb = await checkFreebusy([email], timeMin, timeMax);
    const busy = fb[email]?.busy?.length > 0;
    setAttendees((prev) => [...prev, { email, status: "pending", busy }]);
    setAttendeeInput("");
    if (busy) {
      setAttendeeMsg({
        email,
        msg: `⚠️ ${email} tiene otro evento en ese horario`,
        type: "warn",
      });
      toast(`⚠️ ${email} está ocupado en ese horario`, "warning");
    } else {
      setAttendeeMsg({ email, msg: `✓ ${email} está disponible`, type: "ok" });
      toast(`✓ ${email} está disponible`, "success");
    }
  }

  async function handleSave() {
    if (!title.trim()) return toast("El título es requerido", "error");
    if (!date) return toast("La fecha es requerida", "error");
    if (!start) return toast("Define la hora de inicio", "error");
    if (conflict) {
      toast(`⚠️ Conflicto con "${conflict.title}"`, "error");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        type,
        title,
        desc,
        date,
        start,
        end,
        location,
        locationType,
        notif,
        attendees,
        ...(editMode
          ? { id: initialData.id, googleId: initialData.googleId }
          : {}),
      });
      onClose();
    } catch (err) {
      toast("Error al guardar: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este evento de Google Calendar?")) return;
    setSaving(true);
    try {
      await onDelete(initialData.googleId);
      onClose();
    } catch (err) {
      toast("Error al eliminar: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {editMode ? "✎ Editar Evento" : "✦ Nuevo Evento"}
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {conflict && (
            <div className="conflict-alert">
              <div className="conflict-alert-title">
                ⚠️ Conflicto de Horario
              </div>
              <div>
                Ya tienes <strong>"{conflict.title}"</strong> de{" "}
                {conflict.start} a {conflict.end} en este horario.
              </div>
            </div>
          )}

          <div className="type-selector">
            {TYPES.map((t, i) => (
              <div
                key={t}
                className={`type-option ${type === t ? "active" : ""}`}
                style={
                  type === t
                    ? { background: COLORS[i], borderColor: "transparent" }
                    : {}
                }
                onClick={() => setType(t)}
              >
                <span className="type-emoji">{typeEmoji(t)}</span>
                {typeLabel(t)}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del evento..."
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="form-group">
            <label>Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="time-row">
            <div className="form-group">
              <label>Hora de inicio *</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Duración</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d.minutes} value={d.minutes}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--text2)",
              marginTop: -8,
              marginBottom: 14,
              paddingLeft: 2,
            }}
          >
            🕐 Finaliza a las{" "}
            <strong style={{ color: "var(--accent3)" }}>{end}</strong>
          </div>

          {avail && (
            <div
              className={`avail-indicator ${avail === "free" ? "avail-free" : "avail-busy"}`}
            >
              {avail === "free"
                ? "✓ Horario disponible"
                : `⚠️ Ocupado: "${conflict?.title}"`}
            </div>
          )}

          {/* ── UBICACIÓN ── */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Ubicación (opcional)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[
                { id: "none", icon: "—", label: "Sin ubicación" },
                { id: "physical", icon: "📍", label: "Presencial" },
                { id: "virtual", icon: "💻", label: "Virtual" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    setLocationType(opt.id);
                    setLocation("");
                    autocompleteRef.current = null;
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${locationType === opt.id ? "var(--accent)" : "var(--border)"}`,
                    background:
                      locationType === opt.id
                        ? "rgba(74,111,202,0.15)"
                        : "var(--surface2)",
                    color:
                      locationType === opt.id
                        ? "var(--accent3)"
                        : "var(--text2)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>
                    {opt.icon}
                  </div>
                  {opt.label}
                </div>
              ))}
            </div>

            {/* PRESENCIAL — Google Places Autocomplete */}
            {locationType === "physical" && (
              <div>
                <input
                  ref={placeInputRef}
                  defaultValue={location}
                  placeholder="🔍 Buscar lugar o dirección..."
                  style={{ width: "100%" }}
                  onChange={(e) => {
                    if (!e.target.value) setLocation("");
                  }}
                />
                {location && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(74,111,202,0.1)",
                      border: "1px solid rgba(74,111,202,0.3)",
                      fontSize: 12,
                      color: "var(--accent3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>📍 {location}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--accent3)",
                        fontSize: 11,
                        textDecoration: "none",
                      }}
                    >
                      Ver en Maps ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* VIRTUAL — generador de Meet */}
            {locationType === "virtual" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!location ? (
                  <>
                    <button
                      onClick={handleGenerateMeet}
                      disabled={generatingMeet}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {generatingMeet ? (
                        <>
                          <div
                            className="spinner"
                            style={{ width: 16, height: 16, borderWidth: 2 }}
                          />{" "}
                          Generando...
                        </>
                      ) : (
                        <>📹 Generar link de Google Meet</>
                      )}
                    </button>
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--text2)",
                        fontSize: 11,
                      }}
                    >
                      — o pega tu propio link —
                    </div>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                  </>
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: 8,
                      background: "rgba(26,115,232,0.1)",
                      border: "1px solid rgba(26,115,232,0.3)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b8fd4",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      📹 GOOGLE MEET
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text)",
                        wordBreak: "break-all",
                        marginBottom: 8,
                      }}
                    >
                      {location}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(location);
                          toast("Link copiado", "success");
                        }}
                        style={{
                          flex: 1,
                          padding: "7px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "var(--surface2)",
                          color: "var(--text2)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        📋 Copiar link
                      </button>
                      <button
                        onClick={() => setLocation("")}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "var(--surface2)",
                          color: "var(--danger)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── INVITADOS ── */}
          <div className="form-group">
            <label>Invitados / Participantes</label>
            <div className="attendee-list">
              {attendees.map((a, i) => (
                <div key={a.email} className="attendee-item">
                  <div
                    className="attendee-avatar"
                    style={{ background: ATT_COLORS[i % ATT_COLORS.length] }}
                  >
                    {a.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="attendee-info">
                    <div className="attendee-email">{a.email}</div>
                    <div className="attendee-status">
                      {a.busy
                        ? "⚠️ Conflicto"
                        : a.status === "accepted"
                          ? "✓ Aceptado"
                          : "○ Pendiente"}
                    </div>
                  </div>
                  <button
                    className="attendee-remove"
                    onClick={() =>
                      setAttendees((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="add-row">
              <input
                type="email"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAttendee()}
                placeholder="correo@ejemplo.com"
              />
              <button className="btn btn-secondary" onClick={handleAddAttendee}>
                + Agregar
              </button>
            </div>
            {attendeeMsg && (
              <div
                style={{
                  marginTop: 7,
                  fontSize: 12,
                  color:
                    attendeeMsg.type === "ok"
                      ? "var(--accent3)"
                      : "var(--danger)",
                }}
              >
                {attendeeMsg.msg}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Notificaciones (Google Calendar)</label>
            <select value={notif} onChange={(e) => setNotif(e.target.value)}>
              <option value="all">1 día + 4 horas + 30 min antes</option>
              <option value="both">1 día antes + 4 horas antes</option>
              <option value="day">Solo 1 día antes</option>
              <option value="hours">Solo 4 horas antes</option>
              <option value="30min">Solo 30 minutos antes</option>
              <option value="none">Sin notificaciones</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          {editMode && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={saving}
            >
              🗑 Eliminar
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !!conflict}
          >
            {saving ? "..." : editMode ? "Actualizar ✓" : "Guardar ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
