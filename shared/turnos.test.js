import { test } from 'node:test';
import assert from 'node:assert/strict';
import { turnoDe, rangoTurno, turnoSiguiente, parsearHora, proximaOcurrencia } from './turnos.js';

process.env.TZ = 'America/Argentina/Buenos_Aires';

const d = (s) => new Date(s); // fechas con offset explícito -03:00

test('turno A entre 03:00 y 14:59', () => {
  assert.deepEqual(turnoDe(d('2026-10-15T03:00:00-03:00')), { fecha: '2026-10-15', tipo: 'A' });
  assert.deepEqual(turnoDe(d('2026-10-15T14:59:59-03:00')), { fecha: '2026-10-15', tipo: 'A' });
});

test('turno B desde 15:00 y hasta las 02:59 del día siguiente', () => {
  assert.deepEqual(turnoDe(d('2026-10-15T15:00:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-10-15T23:59:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-10-16T02:59:00-03:00')), { fecha: '2026-10-15', tipo: 'B' });
  assert.deepEqual(turnoDe(d('2026-11-01T01:00:00-03:00')), { fecha: '2026-10-31', tipo: 'B' });
});

test('rango y turno siguiente', () => {
  const { inicio, fin } = rangoTurno({ fecha: '2026-10-15', tipo: 'B' });
  assert.equal(inicio.toISOString(), '2026-10-15T18:00:00.000Z');
  assert.equal(fin.toISOString(), '2026-10-16T06:00:00.000Z');
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
