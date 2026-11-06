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

/**
 * Un viaje programado (con o sin chofer preseleccionado) sigue siendo un
 * "programado pendiente de asignar" mientras no haya sido asignado mediante el
 * botón correspondiente (no tiene número de viaje ni hora_avisado).
 */
export function esProgramadoPendiente(v) {
  if (!v || v.cancelado) return false;
  return Boolean(v.programado && v.numero == null && !v.hora_avisado);
}

export function calcularPrioridadViaje(v, minutosAviso = 5, ahoraMs = Date.now()) {
  if (v.cancelado) return 4;

  if (esProgramadoPendiente(v)) {
    const mins = v.hora_programada
      ? minutosHasta(v.hora_programada, ahoraMs)
      : null;

    // Cuando el viaje programado (con o sin chofer) entra en la ventana de tiempo predefinida,
    // se mueve al primer lugar esperando ser asignado mediante el botón correspondiente.
    if (mins == null || mins <= minutosAviso) {
      return 1;
    }

    // Antes de entrar en la ventana de tiempo, espera en la sección de viajes programados
    // (a partir de la fila 10 desde arriba por defecto, con o sin chofer).
    return 3;
  }

  // Un viaje inmediato (o ya numerado) sin chofer asignado se mantiene arriba (Prioridad 1)
  if (!v.chofer_id) {
    return 1;
  }

  // Prioridad 2: Viajes normales asignados y viajes programados que ya fueron asignados
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

  // 1. Prioridad 1: Urgentes (sin asignar inmediatos y programados en ventana de aviso con o sin chofer)
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

  // 2. Prioridad 2: Asignados (viajes normales en curso o completados, incluyendo programados ya asignados)
  // Ordenados estrictamente por momento efectivo DESC (más reciente arriba).
  // Nunca se relega un viaje reciente al final por diferencias de etiqueta de turno.
  asignados.sort((a, b) => {
    const tiempoEfectivoA =
      a.hora_avisado || a.hora_asignacion || a.hora_ejecucion || a.hora_toma || a.hora_programada;
    const tiempoEfectivoB =
      b.hora_avisado || b.hora_asignacion || b.hora_ejecucion || b.hora_toma || b.hora_programada;
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
