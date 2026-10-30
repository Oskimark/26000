// Lógica de turnos y horas. Todas las fechas se interpretan en la zona horaria
// del proceso (TZ=America/Argentina/Buenos_Aires, se fija en config.js).
//
// Turnos:
//   'A' = 03:00 a 15:00
//   'B' = 15:00 a 03:00 del día siguiente
// Un turno se identifica por la fecha en que COMIENZA + su tipo.

export const INICIO_A = 3;
export const INICIO_B = 15;

const pad = (n) => String(n).padStart(2, '0');

export function fechaISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fechaDesdeISO(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Turno al que pertenece un instante. */
export function turnoDe(instante = new Date()) {
  const d = new Date(instante);
  const h = d.getHours();
  if (h >= INICIO_A && h < INICIO_B) return { fecha: fechaISO(d), tipo: 'A' };
  if (h >= INICIO_B) return { fecha: fechaISO(d), tipo: 'B' };
  // Entre 00:00 y 03:00 pertenece al turno B que empezó el día anterior.
  const ayer = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return { fecha: fechaISO(ayer), tipo: 'B' };
}

/** Inicio y fin (exclusivo) de un turno. */
export function rangoTurno({ fecha, tipo }) {
  const base = fechaDesdeISO(fecha);
  const y = base.getFullYear(), m = base.getMonth(), d = base.getDate();
  if (tipo === 'A') return { inicio: new Date(y, m, d, INICIO_A), fin: new Date(y, m, d, INICIO_B) };
  return { inicio: new Date(y, m, d, INICIO_B), fin: new Date(y, m, d + 1, INICIO_A) };
}

export function turnoSiguiente(turno) {
  return turnoDe(rangoTurno(turno).fin);
}

export function turnoAnterior(turno) {
  return turnoDe(new Date(rangoTurno(turno).inicio.getTime() - 1));
}

export function describirTurno(turno) {
  const { inicio, fin } = rangoTurno(turno);
  return {
    ...turno,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    etiqueta: `${turno.fecha.split('-').reverse().join('/')} ${turno.tipo === 'A' ? '03 a 15' : '15 a 03'}`,
  };
}

export function validarTurno(fecha, tipo) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') && (tipo === 'A' || tipo === 'B');
}

/**
 * Interpreta lo que tipea el operador como hora: "1830", "18:30", "930", "9", "9.30".
 * Devuelve { h, m } o null si no es válida.
 */
export function parsearHora(texto) {
  const s = String(texto ?? '').trim();
  if (!s) return null;
  let h, m;
  const sep = s.match(/^(\d{1,2})\s*[:.,\s]\s*(\d{1,2})$/);
  if (sep) {
    h = Number(sep[1]);
    m = Number(sep[2]);
  } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) { h = Number(s); m = 0; }
    else { h = Number(s.slice(0, s.length - 2)); m = Number(s.slice(-2)); }
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return { h, m };
}

/**
 * Próxima ocurrencia de esa hora, siempre hacia adelante:
 * si hoy ya pasó (o es ahora mismo), es la de mañana.
 */
export function proximaOcurrencia({ h, m }, ahora = new Date()) {
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), h, m, 0, 0);
  if (d.getTime() <= ahora.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Formatea el número de viaje con el prefijo de turno y 3 dígitos:
 * Ej: 0 del turno A -> "A000"
 *     1 del turno A -> "A001"
 *     0 del turno B -> "B000"
 *     45 del turno B -> "B045"
 */
export function formatearNumeroViaje(numero, tipoTurno = 'A') {
  if (numero == null) return '—';
  if (typeof numero === 'string' && /^[AB]\d+$/i.test(numero)) return numero.toUpperCase();
  const letra = String(tipoTurno || 'A').toUpperCase();
  const n = Number(numero);
  if (Number.isNaN(n)) return String(numero);
  return `${letra}${String(n).padStart(3, '0')}`;
}
