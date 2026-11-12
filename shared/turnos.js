// Lógica de turnos y horas. Todas las fechas se interpretan en la zona horaria
// del proceso (TZ=America/Argentina/Buenos_Aires, se fija en config.js).
//
// Turnos:
//   'A' = 06:00 a 18:00
//   'B' = 18:00 a 06:00 del día siguiente
// Un turno se identifica por la fecha en que COMIENZA + su tipo.

export const INICIO_A = 6;
export const INICIO_B = 18;

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
  // Entre 00:00 y 06:00 pertenece al turno B que empezó el día anterior.
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

/**
 * Determina la fecha calendario real (YYYY-MM-DD) correspondiente a un tipo de turno ('A' o 'B')
 * en función del instante actual, trabajando los 7 días de la semana de corrido y evitando
 * que cambios manuales repetidos adelanten la fecha hacia días futuros.
 */
export function calcularFechaParaTipoTurno(tipo, ahora = new Date()) {
  const d = new Date(ahora);
  const h = d.getHours();
  if (tipo === 'A') {
    // Si se pasa al turno A (06 a 18) tarde en la noche (21:00 a 23:59), corresponde al día siguiente.
    // En cualquier otro horario (00:00 a 20:59), corresponde al día calendario actual.
    if (h >= 21) {
      const manana = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      return fechaISO(manana);
    }
    return fechaISO(d);
  }
  // Tipo 'B' (18 a 06):
  // Entre las 00:00 y las 05:59 de la madrugada corresponde al turno B iniciado el día anterior.
  // Desde las 06:00 hasta las 23:59 corresponde al día calendario actual.
  if (h < INICIO_A) {
    const ayer = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return fechaISO(ayer);
  }
  return fechaISO(d);
}

/**
 * Calcula el próximo turno al realizar un Cambio de Turno manual:
 * alterna entre 'A' (06 a 18) y 'B' (18 a 06) anclando siempre la fecha al calendario real.
 */
export function proximoTurnoSegunReloj(actual, ahora = new Date()) {
  const nuevoTipo = actual?.tipo === 'A' ? 'B' : 'A';
  const nuevaFecha = calcularFechaParaTipoTurno(nuevoTipo, ahora);
  return { fecha: nuevaFecha, tipo: nuevoTipo };
}

export function describirTurno(turno) {
  const { inicio, fin } = rangoTurno(turno);
  return {
    ...turno,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    etiqueta: `${turno.fecha.split('-').reverse().join('/')} ${turno.tipo === 'A' ? '06 a 18' : '18 a 06'}`,
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
