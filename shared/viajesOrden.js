/**
 * Reglas de ordenamiento visual de viajes en la Recepción:
 * 1. Viajes sin asignar (inmediatos sin chofer) siempre se posicionan primeros,
 *    independientemente del número de viaje que tengan.
 * 2. Viajes programados que entren en el período de aviso (hora_programada <= ahora + minutosAviso)
 *    saltan automáticamente al principio del listado.
 * 3. Viajes regulares asignados / en curso / completados se ordenan por turno y número DESC (más nuevo primero).
 * 4. Viajes programados futuros que aún no entraron en el período de aviso se mantienen al final,
 *    ordenados por hora programada ASC.
 * 5. Viajes anulados (si se muestran) se posicionan al final.
 */

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

export function ordenarViajesVisuales(lista, minutosAviso = 5, ahoraMs = Date.now()) {
  if (!Array.isArray(lista) || lista.length <= 1) return lista || [];

  return [...lista].sort((a, b) => {
    const prioA = calcularPrioridadViaje(a, minutosAviso, ahoraMs);
    const prioB = calcularPrioridadViaje(b, minutosAviso, ahoraMs);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Dentro de Prioridad 1 (Sin asignar inmediatos / Programados en aviso previo sin chofer):
    if (prioA === 1) {
      const tiempoA = a.programado && a.hora_programada
        ? new Date(a.hora_programada).getTime()
        : new Date(a.hora_toma || 0).getTime();
      const tiempoB = b.programado && b.hora_programada
        ? new Date(b.hora_programada).getTime()
        : new Date(b.hora_toma || 0).getTime();

      if (tiempoA !== tiempoB) return tiempoA - tiempoB;
      return (b.id || 0) - (a.id || 0);
    }

    // Dentro de Prioridad 3 (Programados futuros que aún no llegaron a aviso previo y no tienen chofer):
    if (prioA === 3) {
      const progA = a.hora_programada ? new Date(a.hora_programada).getTime() : 0;
      const progB = b.hora_programada ? new Date(b.hora_programada).getTime() : 0;
      if (progA !== progB) return progA - progB;
      return (b.id || 0) - (a.id || 0);
    }

    // Dentro de Prioridad 4 (Anulados):
    if (prioA === 4) {
      const tomaA = a.hora_toma ? new Date(a.hora_toma).getTime() : 0;
      const tomaB = b.hora_toma ? new Date(b.hora_toma).getTime() : 0;
      if (tomaA !== tomaB) return tomaB - tomaA;
      return (b.id || 0) - (a.id || 0);
    }

    // Dentro de Prioridad 2 (Viajes normales asignados / completados):
    // El turno más nuevo primero (si hay de varios turnos en la ventana de 12h)
    const turnoA = `${a.fecha_turno || ''}_${a.tipo_turno || ''}`;
    const turnoB = `${b.fecha_turno || ''}_${b.tipo_turno || ''}`;
    if (turnoA !== turnoB) {
      return turnoB.localeCompare(turnoA);
    }

    // Momento efectivo del viaje asignado en el turno:
    // Para un programado ya asignado: su hora de asignación (o su hora programada de ejecución)
    // Para un viaje manual: su hora de toma
    // El más reciente queda arriba (DESC). Si luego entra un viaje manual, este queda por encima del programado ya asignado.
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
}
