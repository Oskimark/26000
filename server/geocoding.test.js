import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geocodificarDireccion, CENTRO_SAN_JOSE } from './geocoding.js';

test('geocodificación de puntos de referencia de San José de Mayo', () => {
  const hospital = geocodificarDireccion('Hospital San José');
  assert.ok(hospital.lat < -34.32 && hospital.lat > -34.34, 'Latitud del hospital debe estar en zona norte');
  assert.ok(hospital.lng < -56.70 && hospital.lng > -56.72, 'Longitud del hospital debe ser correcta');

  const amsj = geocodificarDireccion('Sanatorio AMSJ');
  assert.ok(amsj.lat < -34.33 && amsj.lat > -34.35, 'Latitud de AMSJ debe estar cerca del centro');
  assert.ok(amsj.lng < -56.71 && amsj.lng > -56.72, 'Longitud de AMSJ debe ser correcta');

  const plaza33 = geocodificarDireccion('Plaza 33');
  assert.ok(Math.abs(plaza33.lat - CENTRO_SAN_JOSE.lat) < 0.005);
  assert.ok(Math.abs(plaza33.lng - CENTRO_SAN_JOSE.lng) < 0.005);
});

test('geocodificación de intersecciones de calles', () => {
  const esquina = geocodificarDireccion('Artigas y Asamblea');
  assert.equal(esquina.lat, -34.3405);
  assert.equal(esquina.lng, -56.717);
});

test('geocodificación de calle con número de puerta', () => {
  const p1 = geocodificarDireccion('18 de Julio 100');
  const p2 = geocodificarDireccion('18 de Julio 800');
  // En calles Norte-Sur, mayor número va más al sur (latitud más negativa)
  assert.ok(p2.lat < p1.lat, 'El número 800 debe estar más al sur que el número 100');
});

test('todas las coordenadas quedan en el área urbana de San José de Mayo', () => {
  const ejemplos = [
    'Terminal',
    'Asamblea 520',
    'Artigas 1200',
    'Camino Carretón',
    'Batlle y Payán',
    'Av. Brasil 300',
  ];

  for (const ej of ejemplos) {
    const coords = geocodificarDireccion(ej);
    assert.ok(coords.lat >= -34.37 && coords.lat <= -34.31, `Latitud de ${ej} (${coords.lat}) fuera de rango`);
    assert.ok(coords.lng >= -56.75 && coords.lng <= -56.68, `Longitud de ${ej} (${coords.lng}) fuera de rango`);
  }
});
