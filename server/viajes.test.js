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
  assert.ok(viaje1.numero >= 0, 'Debe tener número autonumérico de turno');
  assert.match(viaje1.numero_formateado, /^[AB]\d{3}$/, 'Debe tener número formateado con serie de turno');
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

  // 9. Registrar hora de asignación y estado de avisado
  const viajeFinalizado = await req(`/viajes/${viaje1.id}/fin`, {
    token,
    method: 'PUT',
    body: {},
  });
  assert.ok(viajeFinalizado.hora_asignacion, 'Debe registrar la hora de asignación');

  const viajeAvisado = await req(`/viajes/${viaje1.id}/avisado`, {
    token,
    method: 'PUT',
    body: { avisado: true },
  });
  assert.ok(viajeAvisado.hora_avisado, 'Debe registrar la hora en que fue avisado al chofer');

  // 9b. Crear viaje "Sin asignar" por defecto y verificar que NO permite avisar sin chofer
  const viajeSinChofer = await req('/viajes', {
    token,
    method: 'POST',
    body: {
      telefono: '3415550000',
      direccion: 'Belgrano 800',
      choferId: null,
      horaProgramada: '',
    },
  });
  assert.equal(viajeSinChofer.chofer_id, null, 'Permite crear viaje inmediato Sin asignar');

  await assert.rejects(
    () =>
      req(`/viajes/${viajeSinChofer.id}/avisado`, {
        token,
        method: 'PUT',
        body: { avisado: true },
      }),
    /Primero tenés que asignar un chofer/,
    'No debe permitir avisar si no hay chofer asignado'
  );

  // 9c. Cambiar asignación de chofer reinicia el estado de "Avisar"
  const chofer2 = await req('/choferes', {
    token,
    method: 'POST',
    body: { nombre: 'Lucia Perez (Móvil 22)' },
  });
  const reasignado = await req(`/viajes/${viaje1.id}/chofer`, {
    token,
    method: 'PUT',
    body: { choferId: chofer2.id },
  });
  assert.equal(reasignado.chofer_id, chofer2.id, 'Debe cambiar al nuevo chofer');
  assert.equal(reasignado.hora_avisado, null, 'Cambiar el chofer debe resetear el botón de avisar');

  const progAsignado = await req(`/viajes/${viajeProg.id}/chofer`, {
    token,
    method: 'PUT',
    body: { choferId: chofer.id },
  });
  assert.equal(progAsignado.chofer_id, chofer.id, 'Permite asignar chofer a un programado en cualquier momento');
  assert.ok(progAsignado.hora_asignacion, 'Registra hora de asignación en viaje programado');

  // 9d. Ficha de viaje: editar dirección, teléfono, chofer, reprogramar y activar repetición programática
  const fichaEditada = await req(`/viajes/${viajeProg.id}`, {
    token,
    method: 'PUT',
    body: {
      direccion: 'Corrientes 550 Piso 2',
      telefono: '3415558888',
      choferId: chofer2.id,
      reprogramar: true,
      horaProgramada: `${proximaH}:45`,
      repetirActivo: true,
      repetirModo: 'dias',
      repetirDias: [1, 3, 5],
      repetirHora: '08:15',
    },
  });
  assert.equal(fichaEditada.viaje.direccion, 'Corrientes 550 Piso 2');
  assert.equal(fichaEditada.viaje.telefono, '3415558888');
  assert.equal(fichaEditada.viaje.chofer_id, chofer2.id);
  assert.equal(Boolean(fichaEditada.viaje.repetir_activo), true);
  assert.equal(fichaEditada.viaje.repetir_modo, 'dias');
  assert.equal(fichaEditada.viaje.repetir_dias, '1,3,5');
  assert.ok(Array.isArray(fichaEditada.historial) && fichaEditada.historial.length >= 3, 'Debe registrar el historial del viaje');

  // 9e. Configuración de minutos de aviso previo
  const cfg = await req('/configuracion', {
    token,
    method: 'PUT',
    body: { minutosAvisoProgramado: 5 },
  });
  assert.equal(cfg.minutosAvisoProgramado, 5, 'Permite configurar los minutos de aviso previo');

  // 10. Consultar módulo Clientes con filtros y estadísticas por día, mes y año
  const clientesRes = await req('/clientes?telefono=3415551234&destino=San%20Martin', { token });
  assert.ok(clientesRes.viajes.some((v) => v.id === viaje1.id), 'Debe encontrar el viaje filtrado');
  assert.ok(clientesRes.resumen.realizados >= 1, 'Debe calcular el resumen de viajes realizados');
  assert.ok(Array.isArray(clientesRes.estadisticas.porDia) && clientesRes.estadisticas.porDia.length >= 1, 'Estadísticas por día');
  assert.ok(Array.isArray(clientesRes.estadisticas.porMes) && clientesRes.estadisticas.porMes.length >= 1, 'Estadísticas por mes');
  assert.ok(Array.isArray(clientesRes.estadisticas.porAnio) && clientesRes.estadisticas.porAnio.length >= 1, 'Estadísticas por año');

  // 11. Crear y eliminar un chofer desde administración
  const choferTemp = await req('/choferes', {
    token,
    method: 'POST',
    body: { nombre: 'Chofer Temporal Borrar' },
  });
  const eliminado = await req(`/choferes/${choferTemp.id}`, {
    token,
    method: 'DELETE',
  });
  assert.equal(eliminado.id, choferTemp.id, 'Debe eliminar el chofer correctamente');

  // 12. Catálogo curado de calles de San José de Mayo y autocompletado <número> <calle>
  const callesBatlle = await req('/calles?q=batlle', { token });
  assert.ok(callesBatlle.some((c) => c.nombre === 'Batlle y Ordóñez'), 'Debe incluir Batlle y Ordóñez en el catálogo curado');

  const sugCatalogo = await req('/direcciones?q=450%20arti', { token });
  assert.ok(
    sugCatalogo.some((s) => s.texto === '450 Artigas'),
    'Al ingresar <número> <calle> ("450 arti") debe sugerir "450 Artigas" desde el catálogo de San José',
  );

  const sugAlias = await req('/direcciones?q=820%20bvr%20aparicio', { token });
  assert.ok(
    sugAlias.some((s) => s.texto === '820 Aparicio Saravia'),
    'Debe sugerir el nombre curado ("820 Aparicio Saravia") al buscar por su alias',
  );

  // 13. Sitios sin número con referencia del punto del pasajero ("Camaino carreton km 28", "amsj artigas", "amsj emergencia", "plaza 33 asamblea")
  const sugCarreton = await req('/direcciones?q=Camaino%20carreton%20km%2028', { token });
  assert.ok(
    sugCarreton.some((s) => s.texto === 'Camino Carretón km 28'),
    'Debe corregir "Camaino carreton km 28" a "Camino Carretón km 28"',
  );

  const sugAmsjArtigas = await req('/direcciones?q=amsj%20artigas', { token });
  assert.ok(
    sugAmsjArtigas.some((s) => s.texto === 'AMSJ Artigas'),
    'Debe sugerir "AMSJ Artigas" para "amsj artigas"',
  );

  const sugAmsjEmergencia = await req('/direcciones?q=amsj%20emergencia', { token });
  assert.ok(
    sugAmsjEmergencia.some((s) => s.texto === 'AMSJ Emergencia'),
    'Debe sugerir "AMSJ Emergencia" para "amsj emergencia"',
  );

  const sugPlazaAsamblea = await req('/direcciones?q=plaza%2033%20asamblea', { token });
  assert.ok(
    sugPlazaAsamblea.some((s) => s.texto === 'Plaza 33 Asamblea'),
    'Debe sugerir "Plaza 33 Asamblea" para "plaza 33 asamblea"',
  );
});


