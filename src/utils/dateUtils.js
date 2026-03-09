export const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

export function typeColor(type) {
  return { reunion: '#7c6ef0', tarea: '#4ecdc4', evento: '#c8a96e', cita: '#ff6b6b' }[type] || '#7c6ef0';
}

export function typeLabel(type) {
  return { reunion: 'Reunión', tarea: 'Tarea', evento: 'Evento', cita: 'Cita' }[type] || type;
}

export function typeEmoji(type) {
  return { reunion: '🤝', tarea: '✅', evento: '🎉', cita: '🩺' }[type] || '📅';
}
