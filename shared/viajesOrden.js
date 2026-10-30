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

  // Viaje programado que está dentro del período de aviso previo y aún no fue avisado/asignado
  const programadoEnAviso = Boolean(
    v.programado && mins != null && mins <= minutosAviso && (!v.chofer_id || !v.hora_avisado)
  );

  // Viaje inmediato sin chofer asignado (cliente esperando que le asignen chofer)
  const inmediatoSinAsignar = !v.programado && !v.chofer_id;

  // Prioridad 1: Viajes sin asignar inmediatos O programados en período de notificación
  if (inmediatoSinAsignar || programadoEnAviso) {
    return 1;
  }

  // Prioridad 3: Programados futuros que todavía no entraron al período de aviso
  if (v.programado && mins != null && mins > minutosAviso && (!v.chofer_id || !v.hora_avisado)) {
    return 3;
  }

  // Prioridad 2: Viajes regulares asignados / en curso / completados
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

    // Dentro de Prioridad 1 (Sin asignar inmediatos / Programados en aviso previo):
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

    // Dentro de Prioridad 3 (Programados futuros que aún no llegaron a aviso previo):
    if (prioA === 3) {
      const progA = a.hora_programada ? new Date(a.hora_programada).getTime() : 0;
      const progB = b.hora_programada ? new Date(b.hora_programada).getTime() : 0;
      if (progA !== progB) return progA - progB;
      return (b.id || 0) - (a.id || 0);
    }

    // Dentro de Prioridad 2 (Viajes normales asignados / completados):
    // El turno más nuevo primero, luego por número descendente (el más nuevo arriba)
    const turnoA = `${a.fecha_turno || ''}_${a.tipo_turno || ''}`;
    const turnoB = `${b.fecha_turno || ''}_${b.tipo_turno || ''}`;
    if (turnoA !== turnoB) {
      return turnoB.localeCompare(turnoA);
    }

    const numA = a.numero != null ? Number(a.numero) : -1;
    const numB = b.numero != null ? Number(b.numero) : -1;
    if (numA !== numB) {
      return numB - numA;
    }

    const tomaA = a.hora_toma ? new Date(a.hora_toma).getTime() : 0;
    const tomaB = b.hora_toma ? new Date(b.hora_toma).getTime() : 0;
    if (tomaA !== tomaB) {
      return tomaB - tomaA;
    }

    return (b.id || 0) - (a.id || 0);
  });
}
