export const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

export const fechaCorta = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '';

/** "18:30" o "18:30 (16/10)" si no es hoy. */
export function horaConDia(iso, referencia = new Date()) {
  if (!iso) return '';
  const d = new Date(iso);
  const mismoDia = d.toDateString() === new Date(referencia).toDateString();
  return mismoDia ? hora(iso) : `${hora(iso)} (${fechaCorta(iso)})`;
}

export function formatearTelefono(t) {
  return t || '';
}

export function formatearNumeroViaje(numero, tipoTurno = 'A') {
  if (numero == null) return '—';
  if (typeof numero === 'string' && /^[AB]\d+$/i.test(numero)) return numero.toUpperCase();
  const letra = String(tipoTurno || 'A').toUpperCase();
  const n = Number(numero);
  if (Number.isNaN(n)) return String(numero);
  return `${letra}${String(n).padStart(3, '0')}`;
}

export const turnoKey = (t) => (t ? `${t.fecha}/${t.tipo}` : '');
