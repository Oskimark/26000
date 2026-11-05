/**
 * Reglas de ordenamiento visual de viajes en la Recepción:
 * 1. Viajes sin asignar (inmediatos sin chofer) siempre se posicionan primeros,
 *    independientemente del número de viaje que tengan.
 * 2. Viajes programados que entren en el período de aviso (hora_programada <= ahora + minutosAviso)
 *    saltan automáticamente al principio del listado (Prioridad 1).
 * 3. Viajes regulares asignados / en curso / completados se ordenan por turno y número DESC (más nuevo primero).
 * 4. Viajes programados futuros que aún no entraron en el período de aviso se mantienen a partir del 10° lugar
 *    (índice 9) en orden por hora programada ASC, evitando que queden enterrados al final de la pantalla.
 *    A su debido momento subirán automáticamente a la cima.
 * 5. Viajes anulados (si se muestran) se posicionan al final de todo.
 */

export const POSICION_PROGRAMADOS_FUTUROS = 10;

export function minutosHasta(iso, ahoraMs = Date.now()) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - ahoraMs) / 60_000);
}

export function calcularPrioridadViaje(v, minutosAviso = 5, ahoraMs = Date.now()) {
  if (v.cancelado) return 4;

  const mins = v.programado && v.hora_programada
    ? minutosHasta(v.hora_programada, ahoraMs)
    : null;

  // Un viaje programado solo salta al inicio si está en período de aviso (o vencido) y NO tiene chofer asignado
  const programadoEnAviso = Boolean(
    v.programado && !v.chofer_id && (mins == null || mins <= minutosAviso)
  );

  // Un viaje inmediato sin chofer asignado (cliente esperando que le asignen chofer)
  const inmediatoSinAsignar = !v.programado && !v.chofer_id;

  // Prioridad 1: Viajes sin asignar inmediatos O programados en período de notificación (sin chofer)
  if (inmediatoSinAsignar || programadoEnAviso) {
    return 1;
  }

  // Prioridad 3: Programados futuros que todavía no entraron al período de aviso (sin chofer)
  if (v.programado && !v.chofer_id && mins != null && mins > minutosAviso) {
    return 3;
  }

  // Prioridad 2: Viajes asignados (inmediatos o programados que ya tienen chofer asignado)
  return 2;
}

export function ordenarViajesVisuales(
  lista,
  minutosAviso = 5,
  ahoraMs = Date.now(),
  posicionProgramados = POSICION_PROGRAMADOS_FUTUROS,
) {
  if (!Array.isArray(lista) || lista.length <= 1) return lista || [];

  const urgentes = [];
  const asignados = [];
  const programadosFuturos = [];
  const anulados = [];

  for (const v of lista) {
    const prio = calcularPrioridadViaje(v, minutosAviso, ahoraMs);
    if (prio === 1) urgentes.push(v);
    else if (prio === 2) asignados.push(v);
    else if (prio === 3) programadosFuturos.push(v);
    else anulados.push(v);
  }

  // 1. Prioridad 1: Urgentes (sin asignar inmediatos y programados en aviso/vencidos sin chofer)
  // El tiempo más antiguo primero (tiempo de toma o tiempo programado ASC)
  urgentes.sort((a, b) => {
    const tiempoA = a.programado && a.hora_programada
      ? new Date(a.hora_programada).getTime()
      : new Date(a.hora_toma || 0).getTime();
    const tiempoB = b.programado && b.hora_programada
      ? new Date(b.hora_programada).getTime()
      : new Date(b.hora_toma || 0).getTime();

    if (tiempoA !== tiempoB) return tiempoA - tiempoB;
    return (b.id || 0) - (a.id || 0);
  });

  // 2. Prioridad 2: Asignados (viajes en curso o completados)
  // Turno más nuevo primero, luego momento efectivo DESC (más reciente arriba)
  asignados.sort((a, b) => {
    const turnoA = `${a.fecha_turno || ''}_${a.tipo_turno || ''}`;
    const turnoB = `${b.fecha_turno || ''}_${b.tipo_turno || ''}`;
    if (turnoA !== turnoB) {
      return turnoB.localeCompare(turnoA);
    }

    const tiempoEfectivoA = a.hora_asignacion || a.hora_programada || a.hora_toma;
    const tiempoEfectivoB = b.hora_asignacion || b.hora_programada || b.hora_toma;
    const msA = tiempoEfectivoA ? new Date(tiempoEfectivoA).getTime() : 0;
    const msB = tiempoEfectivoB ? new Date(tiempoEfectivoB).getTime() : 0;
    if (msA !== msB) {
      return msB - msA;
    }

    if (a.numero != null && b.numero != null && a.numero !== b.numero) {
      return Number(b.numero) - Number(a.numero);
    }
    return (b.id || 0) - (a.id || 0);
  });

  // 3. Prioridad 3: Programados futuros que aún no entraron en período de aviso
  // Por hora programada ASC (el más próximo primero)
  programadosFuturos.sort((a, b) => {
    const progA = a.hora_programada ? new Date(a.hora_programada).getTime() : 0;
    const progB = b.hora_programada ? new Date(b.hora_programada).getTime() : 0;
    if (progA !== progB) return progA - progB;
    return (b.id || 0) - (a.id || 0);
  });

  // 4. Prioridad 4: Anulados
  // Hora de toma DESC
  anulados.sort((a, b) => {
    const tomaA = a.hora_toma ? new Date(a.hora_toma).getTime() : 0;
    const tomaB = b.hora_toma ? new Date(b.hora_toma).getTime() : 0;
    if (tomaA !== tomaB) return tomaB - tomaA;
    return (b.id || 0) - (a.id || 0);
  });

  // Ubicación de programados futuros:
  // Se ubican a partir del 10° lugar (índice 9 en base 0).
  // En las primeras posiciones van los urgentes seguidos de los asignados más recientes.
  const targetIndex = Math.max(0, posicionProgramados - 1);
  const cupoAntesDeTarget = Math.max(0, targetIndex - urgentes.length);
  const asignadosArriba = asignados.slice(0, cupoAntesDeTarget);
  const asignadosAbajo = asignados.slice(cupoAntesDeTarget);

  return [
    ...urgentes,
    ...asignadosArriba,
    ...programadosFuturos,
    ...asignadosAbajo,
    ...anulados,
  ];
}

export function normalizarTexto(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function coincideViajeConFiltro(v, filtro) {
  if (!filtro || typeof filtro !== 'object') return true;

  // 1. Teléfono
  if (filtro.telefono && filtro.telefono.trim()) {
    const digitosFiltro = filtro.telefono.replace(/\D/g, '');
    const digitosViaje = String(v.telefono ?? '').replace(/\D/g, '');
    const textoFiltro = filtro.telefono.trim().toLowerCase();
    const textoViaje = String(v.telefono ?? '').toLowerCase();

    const coincideTel =
      (digitosFiltro && digitosViaje.includes(digitosFiltro)) ||
      textoViaje.includes(textoFiltro);

    if (!coincideTel) return false;
  }

  // 2. Nombre
  if (filtro.nombre && filtro.nombre.trim()) {
    const nomFiltro = normalizarTexto(filtro.nombre);
    const nomViaje = normalizarTexto(v.nombre_cliente || v.nombre || '');
    if (!nomViaje.includes(nomFiltro)) return false;
  }

  // 3. Dirección
  if (filtro.direccion && filtro.direccion.trim()) {
    const dirFiltro = normalizarTexto(filtro.direccion);
    const dirViaje = normalizarTexto(v.direccion || '');
    const palabras = dirFiltro.split(' ').filter(Boolean);
    const coincideTodas = palabras.every((palabra) => dirViaje.includes(palabra));
    if (!coincideTodas) return false;
  }

  // 4. Chofer
  if (filtro.choferTocado) {
    if (filtro.choferId !== null && filtro.choferId !== undefined) {
      if (Number(v.chofer_id) !== Number(filtro.choferId)) return false;
    } else if (filtro.choferTexto && filtro.choferTexto.trim()) {
      const chTexto = normalizarTexto(filtro.choferTexto);
      if (chTexto === 'sin asignar') {
        if (v.chofer_id != null) return false;
      } else {
        const chViaje = normalizarTexto(v.chofer || '');
        if (!chViaje.includes(chTexto)) return false;
      }
    } else {
      if (v.chofer_id != null) return false;
    }
  }

  // 5. Hora / Programado
  if (filtro.hora && filtro.hora.trim()) {
    const hDigitos = filtro.hora.replace(/\D/g, '');
    const hTexto = filtro.hora.trim().toLowerCase();

    const valoresHora = [
      v.hora_programada,
      v.hora_toma,
      v.hora_asignacion,
      v.hora_avisado,
    ]
      .filter(Boolean)
      .map((h) => String(h).toLowerCase());

    const coincideHora = valoresHora.some((h) => {
      const hLimpia = h.replace(/\D/g, '');
      return h.includes(hTexto) || (hDigitos && hLimpia.includes(hDigitos));
    });

    if (!coincideHora) return false;
  }

  return true;
}

export function filtrarViajes(viajes, filtro) {
  if (!Array.isArray(viajes)) return [];
  if (!filtro) return viajes;

  const tieneTerminos = Boolean(
    (filtro.telefono && filtro.telefono.trim()) ||
    (filtro.nombre && filtro.nombre.trim()) ||
    (filtro.direccion && filtro.direccion.trim()) ||
    filtro.choferTocado ||
    (filtro.hora && filtro.hora.trim())
  );

  if (!tieneTerminos) return viajes;

  return viajes.filter((v) => coincideViajeConFiltro(v, filtro));
}
