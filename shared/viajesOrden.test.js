import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenarViajesVisuales, calcularPrioridadViaje, minutosHasta } from './viajesOrden.js';

test('viajes sin asignar se posicionan siempre primeros independientemente de su número', () => {
  const ahora = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajes = [
    { id: 1, numero: 5, chofer_id: 2, hora_avisado: '2026-10-30T15:50:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' },
    { id: 2, numero: 1, chofer_id: null, hora_toma: '2026-10-30T15:20:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' }, // Sin asignar viejo
    { id: 3, numero: 4, chofer_id: 3, hora_avisado: '2026-10-30T15:45:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' },
    { id: 4, numero: 6, chofer_id: null, hora_toma: '2026-10-30T15:55:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' }, // Sin asignar nuevo
  ];

  const ordenados = ordenarViajesVisuales(viajes, 15, ahora);
  // Los dos sin asignar deben estar al principio (id 2 e id 4)
  assert.equal(ordenados[0].id, 2, 'El viaje sin asignar que lleva más esperando debe ser primero');
  assert.equal(ordenados[1].id, 4, 'El viaje sin asignar más reciente debe ser segundo');
  // Luego los asignados por número DESC (id 1 con número 5, luego id 3 con número 4)
  assert.equal(ordenados[2].id, 1);
  assert.equal(ordenados[3].id, 3);
});

test('viaje programado fuera de ventana de aviso se mantiene al final de la lista', () => {
  const ahora = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajes = [
    { id: 1, numero: 1, chofer_id: 2, hora_toma: '2026-10-30T15:30:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' },
    { id: 2, programado: true, hora_programada: '2026-10-30T19:00:00-03:00', numero: null, chofer_id: null, fecha_turno: '2026-10-30', tipo_turno: 'B' }, // falta 3hs
  ];

  const ordenados = ordenarViajesVisuales(viajes, 15, ahora);
  assert.equal(ordenados[0].id, 1, 'Viaje asignado debe ir antes que el programado futuro');
  assert.equal(ordenados[1].id, 2, 'El programado futuro lejano va al final');
});

test('viaje programado que entra en periodo de notificacion salta automaticamente al principio del listado', () => {
  const t16_00 = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajeProg = {
    id: 99,
    programado: true,
    hora_programada: '2026-10-30T16:15:00-03:00',
    numero: null,
    chofer_id: null,
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };
  const viajeNormal = {
    id: 1,
    numero: 2,
    chofer_id: 5,
    hora_avisado: '2026-10-30T15:50:00-03:00',
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };

  // Con ventana de aviso de 10 min: a las 16:00 faltan 15 min (fuera de aviso)
  const ordenLejos = ordenarViajesVisuales([viajeNormal, viajeProg], 10, t16_00);
  assert.equal(ordenLejos[0].id, 1);
  assert.equal(ordenLejos[1].id, 99, 'Aún falta para el aviso, queda al final');

  // Con ventana de aviso de 15 min: a las 16:00 faltan exactamente 15 min (entra en aviso!)
  const ordenEnAviso = ordenarViajesVisuales([viajeNormal, viajeProg], 15, t16_00);
  assert.equal(ordenEnAviso[0].id, 99, 'Entró en aviso previo: salta automáticamente al principio!');
  assert.equal(ordenEnAviso[1].id, 1);
});

test('viajes anulados quedan siempre al final de la lista', () => {
  const ahora = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajes = [
    { id: 1, cancelado: true, numero: 5, fecha_turno: '2026-10-30', tipo_turno: 'B' },
    { id: 2, cancelado: false, numero: 1, chofer_id: 3, fecha_turno: '2026-10-30', tipo_turno: 'B' },
  ];

  const ordenados = ordenarViajesVisuales(viajes, 15, ahora);
  assert.equal(ordenados[0].id, 2);
  assert.equal(ordenados[1].id, 1, 'Anulado queda al final');
});

test('viaje programado que es cancelado pierde prioridad de aviso y se ubica al final', () => {
  const ahora = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajes = [
    { id: 1, numero: 1, chofer_id: 2, hora_toma: '2026-10-30T15:30:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' },
    {
      id: 2,
      programado: true,
      hora_programada: '2026-10-30T16:05:00-03:00', // en ventana de aviso (5m)
      numero: null,
      chofer_id: null,
      cancelado: true, // anulado
      fecha_turno: '2026-10-30',
      tipo_turno: 'B',
    },
  ];

  assert.equal(calcularPrioridadViaje(viajes[1], 15, ahora), 4);
  const ordenados = ordenarViajesVisuales(viajes, 15, ahora);
  assert.equal(ordenados[0].id, 1, 'El viaje activo queda primero');
  assert.equal(ordenados[1].id, 2, 'El programado anulado no salta al inicio y queda al final');
});

test('combinación completa: sin asignar y programados en aviso al principio, completados al medio, futuros al final', () => {
  const ahora = new Date('2026-10-30T16:00:00-03:00').getTime();
  const viajes = [
    { id: 10, numero: 5, chofer_id: 1, hora_toma: '2026-10-30T15:50:00-03:00', hora_avisado: '2026-10-30T15:50:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' }, // asignado
    { id: 20, numero: 1, chofer_id: null, hora_toma: '2026-10-30T15:20:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' }, // sin asignar urgente
    { id: 30, programado: true, hora_programada: '2026-10-30T16:10:00-03:00', chofer_id: null, fecha_turno: '2026-10-30', tipo_turno: 'B' }, // programado en aviso (en 10m)
    { id: 40, programado: true, hora_programada: '2026-10-30T18:00:00-03:00', chofer_id: null, fecha_turno: '2026-10-30', tipo_turno: 'B' }, // programado futuro (en 2h)
    { id: 50, numero: 6, chofer_id: 2, hora_toma: '2026-10-30T15:55:00-03:00', hora_avisado: '2026-10-30T15:55:00-03:00', fecha_turno: '2026-10-30', tipo_turno: 'B' }, // asignado más nuevo
  ];

  const orden = ordenarViajesVisuales(viajes, 15, ahora);
  const ids = orden.map((v) => v.id);

  // Primeros dos: el sin asignar (20) y el programado en aviso (30)
  assert.ok(ids.indexOf(20) < 2);
  assert.ok(ids.indexOf(30) < 2);
  // Medios: asignados (50 y 10)
  assert.ok(ids.indexOf(50) === 2);
  assert.ok(ids.indexOf(10) === 3);
  // Último: programado futuro lejano (40)
  assert.equal(ids[4], 40);
});

test('un viaje programado una vez asignado queda en su lugar, y un nuevo viaje manual queda por encima de él', () => {
  const ahora = new Date('2026-10-30T16:30:00-03:00').getTime();
  const viajeManualViejo = {
    id: 1,
    numero: 1,
    chofer_id: 2,
    hora_toma: '2026-10-30T16:00:00-03:00',
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };
  const viajeProgAsignado = {
    id: 2,
    programado: true,
    hora_programada: '2026-10-30T16:15:00-03:00',
    hora_asignacion: '2026-10-30T16:15:00-03:00',
    numero: null,
    chofer_id: 4, // YA ASIGNADO
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };
  const viajeManualNuevo = {
    id: 3,
    numero: 2,
    chofer_id: 5,
    hora_toma: '2026-10-30T16:20:00-03:00', // ingresado DESPUÉS
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };

  // viajeProgAsignado ya tiene chofer, por lo que NO debe ser Prioridad 1
  assert.equal(calcularPrioridadViaje(viajeProgAsignado, 15, ahora), 2);

  const orden = ordenarViajesVisuales([viajeManualViejo, viajeProgAsignado, viajeManualNuevo], 15, ahora);
  assert.equal(orden[0].id, 3, 'El viaje manual nuevo (16:20) debe quedar por encima del programado asignado');
  assert.equal(orden[1].id, 2, 'El viaje programado asignado (16:15) queda en su lugar intermedio');
  assert.equal(orden[2].id, 1, 'El viaje manual viejo (16:00) queda por debajo');
});

test('los viajes sin asignar se mantienen siempre arriba de los viajes nuevos asignados y no quedan enterrados', () => {
  const ahora = new Date('2026-10-30T16:30:00-03:00').getTime();
  const sinAsignarViejo = {
    id: 10,
    numero: 1,
    chofer_id: null, // SIN CHOFER
    hora_toma: '2026-10-30T16:00:00-03:00',
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };
  const nuevoAsignado1 = {
    id: 20,
    numero: 2,
    chofer_id: 3,
    hora_toma: '2026-10-30T16:10:00-03:00',
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };
  const nuevoAsignado2 = {
    id: 30,
    numero: 3,
    chofer_id: 4,
    hora_toma: '2026-10-30T16:20:00-03:00',
    fecha_turno: '2026-10-30',
    tipo_turno: 'B',
  };

  const orden = ordenarViajesVisuales([nuevoAsignado2, sinAsignarViejo, nuevoAsignado1], 15, ahora);
  assert.equal(orden[0].id, 10, 'El viaje sin asignar debe mantenerse en la cima (Prioridad 1) sin ser enterrado por los nuevos asignados');
  assert.equal(orden[1].id, 30, 'El viaje nuevo asignado queda abajo del sin asignar');
  assert.equal(orden[2].id, 20, 'El viaje asignado más viejo queda debajo');
});
