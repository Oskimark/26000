import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geocodificarDireccion, CENTRO_SAN_JOSE, LIMITES_URBANOS } from './geocoding.js';

test('geocodificación de puntos de referencia de San José de Mayo', () => {
  const hospital = geocodificarDireccion('Hospital San José');
  assert.ok(hospital.lat <= -34.335 && hospital.lat >= -34.345, 'Latitud del hospital debe ser precisa');
  assert.ok(hospital.lng <= -56.700 && hospital.lng >= -56.712, 'Longitud del hospital debe ser precisa');

  const amsj = geocodificarDireccion('Sanatorio AMSJ');
  assert.ok(Math.abs(amsj.lat - CENTRO_SAN_JOSE.lat) < 0.003, 'AMSJ debe estar cerca de Plaza 33');
  assert.ok(Math.abs(amsj.lng - CENTRO_SAN_JOSE.lng) < 0.003, 'AMSJ debe estar cerca de Plaza 33');

  const terminal = geocodificarDireccion('Terminal');
  assert.ok(terminal.lat <= -34.330 && terminal.lat >= -34.340, 'Terminal debe estar en zona norte');
  assert.ok(terminal.lng <= -56.710 && terminal.lng >= -56.720, 'Terminal debe estar sobre eje Artigas');

  const plaza33 = geocodificarDireccion('Plaza 33');
  assert.ok(Math.abs(plaza33.lat - CENTRO_SAN_JOSE.lat) < 0.001);
  assert.ok(Math.abs(plaza33.lng - CENTRO_SAN_JOSE.lng) < 0.001);
});

test('geocodificación de intersecciones de calles', () => {
  const esquina = geocodificarDireccion('Artigas y 18 de Julio');
  assert.ok(Math.abs(esquina.lat - (-34.3390)) < 0.002, 'Latitud debe coincidir con eje de 18 de Julio');
  assert.ok(Math.abs(esquina.lng - (-56.7164)) < 0.002, 'Longitud debe coincidir con eje de Artigas');

  const esquina2 = geocodificarDireccion('Asamblea esquina 25 de Mayo');
  assert.ok(Math.abs(esquina2.lat - (-34.3400)) < 0.002, 'Latitud debe coincidir con eje de Asamblea');
  assert.ok(Math.abs(esquina2.lng - (-56.7135)) < 0.002, 'Longitud debe coincidir con eje de 25 de Mayo');
});

test('geocodificación de calle con número de puerta en calles Este-Oeste y Norte-Sur', () => {
  // En calles Este-Oeste (18 de Julio), los números aumentan de Oeste a Este (longitud menos negativa)
  const p1 = geocodificarDireccion('18 de Julio 100');
  const p2 = geocodificarDireccion('18 de Julio 800');
  assert.ok(p2.lng > p1.lng, 'El número 800 debe estar más al este que el 100');

  // En calles Norte-Sur (Artigas, 25 de Mayo), los números aumentan de Norte a Sur (latitud más negativa)
  const a1 = geocodificarDireccion('Artigas 200');
  const a2 = geocodificarDireccion('Artigas 1000');
  assert.ok(a2.lat < a1.lat, 'El número 1000 debe estar más al sur que el 200');
});

test('todas las coordenadas quedan estrictamente dentro de la planta urbana de San José de Mayo (nunca en el campo)', () => {
  const ejemplos = [
    'Terminal',
    'Asamblea 520',
    'Artigas 1200',
    '18 de Julio 100',
    '18 de Julio 540',
    '18 de Julio 1500',
    'Camino Carretón',
    'Av. Brasil 300',
    'Manuel D. Rodríguez y Artigas',
    'Parque Rodó',
    'Hospital San José',
    'Larrañaga 850',
    'Espínola 420',
    'Batlle Berres 120',
    'Ciganda 350',
    'Zorrilla 700',
    'Dirección desconocida aleatoria 1234',
  ];

  for (const ej of ejemplos) {
    const coords = geocodificarDireccion(ej);
    assert.ok(
      coords.lat >= LIMITES_URBANOS.minLat && coords.lat <= LIMITES_URBANOS.maxLat,
      `Latitud de "${ej}" (${coords.lat}) fuera del casco urbano [${LIMITES_URBANOS.minLat}, ${LIMITES_URBANOS.maxLat}]`
    );
    assert.ok(
      coords.lng >= LIMITES_URBANOS.minLng && coords.lng <= LIMITES_URBANOS.maxLng,
      `Longitud de "${ej}" (${coords.lng}) fuera del casco urbano [${LIMITES_URBANOS.minLng}, ${LIMITES_URBANOS.maxLng}]`
    );
  }
});
