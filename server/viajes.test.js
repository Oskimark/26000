import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000/api';

async function req(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

test('Flujo completo del sistema de recepción de viajes', async () => {
  // 1. Login inicial con admin
  const login = await req('/login', {
    method: 'POST',
    body: { usuario: 'admin', password: 'admin' },
  });
  assert.ok(login.token, 'Debe devolver un token JWT');
  assert.equal(login.operador.usuario, 'admin');
  const token = login.token;

  // 2. Obtener turno actual
  const turnos = await req('/turnos/actual', { token });
  assert.ok(turnos.actual, 'Debe identificar el turno actual');
  const t = turnos.actual;
  assert.match(t.tipo, /^[AB]$/);

  // 3. Crear chofer de prueba
  const chofer = await req('/choferes', {
    token,
    method: 'POST',
    body: { nombre: 'Carlos Gomez (Móvil 14)' },
  });
  assert.ok(chofer.id);
  assert.equal(chofer.nombre, 'Carlos Gomez (Móvil 14)');

  // 4. Asignar chofer al turno actual
  await req(`/turnos/${t.fecha}/${t.tipo}/choferes`, {
    token,
    method: 'PUT',
    body: { choferIds: [chofer.id] },
  });

  const choferesTurno = await req(`/turnos/${t.fecha}/${t.tipo}/choferes`, { token });
  assert.ok(choferesTurno.some((c) => c.id === chofer.id), 'El chofer debe estar asignado al turno');

  // 5. Crear viaje inmediato
  const viaje1 = await req('/viajes', {
    token,
    method: 'POST',
    body: {
      telefono: '3415551234',
      direccion: 'San Martin 1250',
      choferId: chofer.id,
      horaProgramada: '',
    },
  });
  assert.ok(viaje1.numero > 0, 'Debe tener número autonumérico de turno');
  assert.equal(viaje1.direccion, 'San Martin 1250');
  assert.equal(viaje1.chofer, 'Carlos Gomez (Móvil 14)');
  assert.equal(viaje1.programado, false);

  // 6. Probar autocompletado de dirección: por teléfono y por texto
  const sugerencias = await req('/direcciones?q=San&telefono=3415551234', { token });
  assert.ok(sugerencias.length > 0, 'Debe sugerir la dirección previamente cargada');
  assert.equal(sugerencias[0].texto, 'San Martin 1250');
  assert.ok(sugerencias[0].usos_telefono >= 1, 'Debe registrar uso con este teléfono');

  // 7. Crear viaje programado (hacia adelante)
  const ahora = new Date();
  const proximaH = (ahora.getHours() + 2) % 24;
  const viajeProg = await req('/viajes', {
    token,
    method: 'POST',
    body: {
      telefono: '3415559999',
      direccion: 'Corrientes 500',
      horaProgramada: `${proximaH}:30`,
    },
  });
  assert.equal(viajeProg.programado, true);
  assert.equal(viajeProg.numero, null, 'Un viaje programado futuro no debe tener N° asignado todavía');
  assert.ok(viajeProg.hora_programada);

  // 8. Listar turno y verificar orden
  const listado = await req(`/turnos/${t.fecha}/${t.tipo}/viajes`, { token });
  assert.ok(listado.viajes.some((v) => v.id === viaje1.id));

  // 9. Registrar fin de viaje
  const viajeFinalizado = await req(`/viajes/${viaje1.id}/fin`, {
    token,
    method: 'PUT',
    body: {},
  });
  assert.ok(viajeFinalizado.hora_fin, 'Debe registrar la hora de fin');
});
