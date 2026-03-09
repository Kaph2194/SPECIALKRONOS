import { useState, useEffect, useCallback } from 'react';
import { typeColor, typeLabel, typeEmoji, dateToStr } from '../utils/dateUtils';
import { useToast } from './Toast';

const TYPES = ['reunion', 'tarea', 'evento', 'cita'];
const COLORS = ['#7c6ef0', '#4ecdc4', '#c8a96e', '#ff6b6b'];
const ATT_COLORS = ['#7c6ef0', '#4ecdc4', '#c8a96e', '#ff6b6b', '#e87070', '#70c5e8'];

export default function EventModal({
  isOpen, onClose, initialData, selectedDate,
  onSave, onDelete, hasConflict, checkFreebusy, editMode
}) {
  const toast = useToast();
  const [type, setType] = useState('reunion');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notif, setNotif] = useState('both');
  const [attendees, setAttendees] = useState([]);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendeeMsg, setAttendeeMsg] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [avail, setAvail] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editMode && initialData) {
      setType(initialData.type || 'reunion');
      setTitle(initialData.title || '');
      setDesc(initialData.desc || '');
      setDate(initialData.date || dateToStr(selectedDate));
      setStart(initialData.start || '09:00');
      setEnd(initialData.end || '10:00');
      setLocation(initialData.location || '');
      setNotif(initialData.notif || 'both');
      setAttendees(initialData.attendees || []);
    } else {
      setType('reunion'); setTitle(''); setDesc('');
      setDate(dateToStr(selectedDate));
      setStart('09:00'); setEnd('10:00');
      setLocation(''); setNotif('both');
      setAttendees([]);
    }
    setAttendeeInput(''); setAttendeeMsg(null); setConflict(null); setAvail(null);
  }, [isOpen, editMode, initialData, selectedDate]);

  const checkAvailability = useCallback(() => {
    if (!date || !start || !end || start >= end) { setAvail(null); return; }
    const c = hasConflict(date, start, end, editMode ? initialData?.id : null);
    setConflict(c || null);
    setAvail(c ? 'busy' : 'free');
  }, [date, start, end, hasConflict, editMode, initialData]);

  useEffect(() => { checkAvailability(); }, [date, start, end, checkAvailability]);

  async function handleAddAttendee() {
    const email = attendeeInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return toast('Ingresa un correo válido', 'error');
    if (attendees.find(a => a.email === email)) return toast('Ya está en la lista', 'warning');
    if (!date || !start || !end) return toast('Define fecha y hora primero', 'warning');

    const timeMin = new Date(`${date}T${start}:00`).toISOString();
    const timeMax = new Date(`${date}T${end}:00`).toISOString();
    const fb = await checkFreebusy([email], timeMin, timeMax);
    const busy = fb[email]?.busy?.length > 0;

    const newAtt = { email, status: 'pending', busy };
    setAttendees(prev => [...prev, newAtt]);
    setAttendeeInput('');
    if (busy) {
      setAttendeeMsg({ email, msg: `⚠️ ${email} tiene otro evento en ese horario`, type: 'warn' });
      toast(`⚠️ ${email} está ocupado en ese horario`, 'warning');
    } else {
      setAttendeeMsg({ email, msg: `✓ ${email} está disponible`, type: 'ok' });
      toast(`✓ ${email} está disponible`, 'success');
    }
  }

  async function handleSave() {
    if (!title.trim()) return toast('El título es requerido', 'error');
    if (!date) return toast('La fecha es requerida', 'error');
    if (!start || !end) return toast('Define hora inicio y fin', 'error');
    if (start >= end) return toast('La hora fin debe ser mayor al inicio', 'error');
    if (conflict) {
      toast(`⚠️ Conflicto con "${conflict.title}"`, 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({ type, title, desc, date, start, end, location, notif, attendees,
        ...(editMode ? { id: initialData.id, googleId: initialData.googleId } : {}) });
      onClose();
    } catch (err) {
      toast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este evento de Google Calendar?')) return;
    setSaving(true);
    try { await onDelete(initialData.googleId); onClose(); }
    catch (err) { toast('Error al eliminar: ' + err.message, 'error'); }
    finally { setSaving(false); }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editMode ? '✎ Editar Evento' : '✦ Nuevo Evento'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Conflict alert */}
          {conflict && (
            <div className="conflict-alert">
              <div className="conflict-alert-title">⚠️ Conflicto de Horario</div>
              <div>Ya tienes <strong>"{conflict.title}"</strong> de {conflict.start} a {conflict.end} en este horario.</div>
            </div>
          )}

          {/* Type selector */}
          <div className="type-selector">
            {TYPES.map((t, i) => (
              <div
                key={t}
                className={`type-option ${type === t ? 'active' : ''}`}
                style={type === t ? { background: COLORS[i], borderColor: 'transparent' } : {}}
                onClick={() => setType(t)}
              >
                <span className="type-emoji">{typeEmoji(t)}</span>
                {typeLabel(t)}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del evento..." />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalles adicionales..." />
          </div>

          <div className="form-group">
            <label>Fecha *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="time-row">
            <div className="form-group">
              <label>Inicio *</label>
              <input type="time" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fin *</label>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>

          {avail && (
            <div className={`avail-indicator ${avail === 'free' ? 'avail-free' : 'avail-busy'}`}>
              {avail === 'free' ? '✓ Horario disponible' : `⚠️ Ocupado: "${conflict?.title}"`}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Ubicación</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Sala, dirección, Google Meet..." />
          </div>

          {/* Attendees */}
          <div className="form-group">
            <label>Invitados / Participantes</label>
            <div className="attendee-list">
              {attendees.map((a, i) => (
                <div key={a.email} className="attendee-item">
                  <div className="attendee-avatar" style={{ background: ATT_COLORS[i % ATT_COLORS.length] }}>
                    {a.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="attendee-info">
                    <div className="attendee-email">{a.email}</div>
                    <div className="attendee-status">
                      {a.busy ? '⚠️ Conflicto' : a.status === 'accepted' ? '✓ Aceptado' : '○ Pendiente'}
                    </div>
                  </div>
                  <button className="attendee-remove" onClick={() => setAttendees(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <div className="add-row">
              <input
                type="email" value={attendeeInput}
                onChange={e => setAttendeeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAttendee()}
                placeholder="correo@ejemplo.com"
              />
              <button className="btn btn-secondary" onClick={handleAddAttendee}>+ Agregar</button>
            </div>
            {attendeeMsg && (
              <div style={{ marginTop: 7, fontSize: 12, color: attendeeMsg.type === 'ok' ? 'var(--accent3)' : 'var(--danger)' }}>
                {attendeeMsg.msg}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Notificaciones (Google Calendar)</label>
            <select value={notif} onChange={e => setNotif(e.target.value)}>
              <option value="both">1 día antes + 4 horas antes</option>
              <option value="day">Solo 1 día antes</option>
              <option value="hours">Solo 4 horas antes</option>
              <option value="none">Sin notificaciones</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          {editMode && <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>🗑 Eliminar</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !!conflict}>
            {saving ? '...' : editMode ? 'Actualizar ✓' : 'Guardar ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
