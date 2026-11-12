import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  turnoDe,
  rangoTurno,
  turnoSiguiente,
  calcularFechaParaTipoTurno,
  proximoTurnoSegunReloj,
  parsearHora,
  proximaOcurrencia,
  formatearNumeroViaje,
} from './turnos.js';

process.env.TZ = 'America/Argentina/Buenos_Aires';

const d = (s) => new Date(s); // fechas con offset explícito -03:00

test('turno A entre 06:00 y 17:59', () => {
  assert.deepEqual(turnoDe(d('2026-10-15T06:00:00-03:00')), { fecha: '2026-10-15', tipo: 'A' });
  assert.deepEqual(turnoDe(d('2026-10-15T17:59:59-03:00')), { fecha: '2026-10-15', tipo: 'A' });
});

test('turno B desde 18:00 y hasta las 05:59 del día siguiente', () => {
  assert.deepEqual(turnoDe(d('2026-10-15T18:00:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-10-15T23:59:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-10-16T05:59:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-11-01T01:00:00-03:00')), { fecha: '2026-10-31', tipo: 'B' });
});

test('rango y turno siguiente', () => {
  const { inicio, fin } = rangoTurno({ fecha: '2026-10-15', tipo: 'B' });
  assert.equal(inicio.toISOString(), '2026-10-15T21:00:00.000Z');
  assert.equal(fin.toISOString(), '2026-10-16T09:00:00.000Z');
  assert.deepEqual(turnoSiguiente({ fecha: '2026-10-15', tipo: 'B' }), { fecha: '2026-10-16', tipo: 'A' });
  assert.deepEqual(turnoSiguiente({ fecha: '2026-10-15', tipo: 'A' }), { fecha: '2026-10-15', tipo: 'B' });
});

test('parsearHora acepta formatos comunes', () => {
  assert.deepEqual(parsearHora('1830'), { h: 18, m: 30 });
  assert.deepEqual(parsearHora('18:30'), { h: 18, m: 30 });
  assert.deepEqual(parsearHora('930'), { h: 9, m: 30 });
  assert.deepEqual(parsearHora('9'), { h: 9, m: 0 });
  assert.deepEqual(parsearHora('0130'), { h: 1, m: 30 });
  assert.equal(parsearHora('2460'), null);
  assert.equal(parsearHora('abc'), null);
  assert.equal(parsearHora(''), null);
});

test('la hora programada siempre es hacia adelante', () => {
  const ahora = d('2026-10-15T23:00:00-03:00');
  assert.equal(proximaOcurrencia({ h: 1, m: 30 }, ahora).toISOString(), '2026-10-16T04:30:00.000Z');
  assert.equal(proximaOcurrencia({ h: 22, m: 0 }, ahora).toISOString(), '2026-10-17T01:00:00.000Z');
  assert.equal(proximaOcurrencia({ h: 23, m: 30 }, ahora).toISOString(), '2026-10-16T02:30:00.000Z');
  assert.equal(proximaOcurrencia({ h: 23, m: 0 }, ahora).toISOString(), '2026-10-17T02:00:00.000Z');
});

test('formatearNumeroViaje formatea con letra de turno y 3 digitos iniciando en 000', () => {
  assert.equal(formatearNumeroViaje(0, 'A'), 'A000');
  assert.equal(formatearNumeroViaje(1, 'A'), 'A001');
  assert.equal(formatearNumeroViaje(12, 'A'), 'A012');
  assert.equal(formatearNumeroViaje(123, 'A'), 'A123');
  assert.equal(formatearNumeroViaje(0, 'B'), 'B000');
  assert.equal(formatearNumeroViaje(1, 'B'), 'B001');
  assert.equal(formatearNumeroViaje(45, 'B'), 'B045');
  assert.equal(formatearNumeroViaje(null, 'A'), '—');
  assert.equal(formatearNumeroViaje(undefined, 'B'), '—');
});

test('proximoTurnoSegunReloj trabaja los 7 días de corrido y nunca salta días si se alterna el turno varias veces', () => {
  // Sábado 07/11/2026 a las 06:16 AM
  const sab06 = d('2026-11-07T06:16:00-03:00');
  const tActual = { fecha: '2026-11-07', tipo: 'A' };

  // De A pasa a B del mismo día 07/11
  const sig1 = proximoTurnoSegunReloj(tActual, sab06);
  assert.deepEqual(sig1, { fecha: '2026-11-07', tipo: 'B' });

  // Si se vuelve a cambiar el mismo día 07/11 de B a A, mantiene el 07/11 (NUNCA salta al 08/11 ni al 10/11)
  const sig2 = proximoTurnoSegunReloj(sig1, sab06);
  assert.deepEqual(sig2, { fecha: '2026-11-07', tipo: 'A' });

  // Domingo 08/11/2026 a las 06:00 AM: al cerrar el turno B del sábado pasa al turno A del domingo 08/11
  const dom06 = d('2026-11-08T06:00:00-03:00');
  assert.deepEqual(
    proximoTurnoSegunReloj({ fecha: '2026-11-07', tipo: 'B' }, dom06),
    { fecha: '2026-11-08', tipo: 'A' }
  );

  // Domingo 08/11/2026 a las 18:00: pasa al turno B del domingo 08/11
  const dom18 = d('2026-11-08T18:00:00-03:00');
  assert.deepEqual(
    proximoTurnoSegunReloj({ fecha: '2026-11-08', tipo: 'A' }, dom18),
    { fecha: '2026-11-08', tipo: 'B' }
  );

  // Lunes 09/11/2026 a las 06:00 AM: pasa al turno A del lunes 09/11
  const lun06 = d('2026-11-09T06:00:00-03:00');
  assert.deepEqual(
    proximoTurnoSegunReloj({ fecha: '2026-11-08', tipo: 'B' }, lun06),
    { fecha: '2026-11-09', tipo: 'A' }
  );
  assert.equal(calcularFechaParaTipoTurno('A', sab06), '2026-11-07');
});
