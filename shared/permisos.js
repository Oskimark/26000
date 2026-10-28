export const MODULOS_PERMISOS = [
  {
    id: 'recepcion',
    nombre: 'Recepción',
    descripcion: 'Toma de llamadas, despacho y viajes en curso del turno actual',
    icono: '📞',
    subpermisos: [
      { id: 'recepcion_toma', nombre: 'Toma de viajes', descripcion: 'Ingresar viajes inmediatos y programados' },
      { id: 'recepcion_chofer', nombre: 'Asignar chofer', descripcion: 'Asignar y cambiar chofer en la tabla de viajes' },
      { id: 'recepcion_avisar', nombre: 'Estado de asignación', descripcion: 'Marcar y desmarcar estado asignado del viaje' },
      { id: 'recepcion_cancelar', nombre: 'Anular / Restaurar', descripcion: 'Cancelar viajes o reactivar viajes anulados' },
      { id: 'recepcion_ficha', nombre: 'Editar ficha de viaje', descripcion: 'Modificar datos de viajes ya guardados' },
    ],
  },
  {
    id: 'choferes',
    nombre: 'Choferes del turno',
    descripcion: 'Gestión de choferes que trabajan en el turno actual',
    icono: '🚖',
    subpermisos: [
      { id: 'choferes_ver', nombre: 'Ver choferes del turno', descripcion: 'Consultar la lista de choferes del turno' },
      { id: 'choferes_asignar', nombre: 'Modificar choferes del turno', descripcion: 'Agregar o quitar choferes del turno de trabajo' },
    ],
  },
  {
    id: 'historial',
    nombre: 'Historial',
    descripcion: 'Consulta de viajes y registros de turnos pasados',
    icono: '📜',
    subpermisos: [
      { id: 'historial_ver', nombre: 'Ver viajes históricos', descripcion: 'Buscar y consultar turnos anteriores' },
      { id: 'historial_exportar', nombre: 'Exportar CSV', descripcion: 'Descargar planilla de viajes históricos en formato CSV' },
    ],
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    descripcion: 'Base de clientes, teléfonos y destinos frecuentes',
    icono: '👥',
    subpermisos: [
      { id: 'clientes_ver', nombre: 'Consultar clientes', descripcion: 'Búsqueda por teléfono y viajes por cliente' },
      { id: 'clientes_exportar', nombre: 'Exportar CSV', descripcion: 'Descargar listado de clientes en formato CSV' },
    ],
  },
  {
    id: 'admin',
    nombre: 'Administración',
    descripcion: 'Acceso y configuración del módulo administrativo general',
    icono: '⚙️',
    subpermisos: [
      { id: 'admin_choferes', nombre: 'Choferes', descripcion: 'Alta, edición y baja de choferes de la empresa' },
      { id: 'admin_operadores', nombre: 'Operadores', descripcion: 'Gestión de usuarios operadores y asignación de permisos' },
      { id: 'admin_calles', nombre: 'Calles y sitios', descripcion: 'Catálogo de calles de San José, alias y referencias' },
      { id: 'admin_configuracion', nombre: 'Configuración', descripcion: 'Aviso previo programado y visualización de campos' },
      { id: 'admin_identidad', nombre: 'Identidad corporativa', descripcion: 'Colores corporativos 26000 y estilos' },
    ],
  },
];

// Lista plana para compatibilidad y búsquedas directas
export const PERMISOS_DISPONIBLES = MODULOS_PERMISOS.flatMap((m) => [
  { id: m.id, nombre: m.nombre, descripcion: m.descripcion, esModulo: true },
  ...m.subpermisos.map((s) => ({ ...s, esModulo: false, moduloPadre: m.id })),
]);

export const PERMISOS_DEFAULT_OPERADOR = {
  // Módulos
  recepcion: true,
  choferes: true,
  historial: true,
  clientes: true,
  admin: false,
  // Subpermisos Recepción
  recepcion_toma: true,
  recepcion_chofer: true,
  recepcion_avisar: true,
  recepcion_cancelar: true,
  recepcion_ficha: true,
  // Subpermisos Choferes del turno
  choferes_ver: true,
  choferes_asignar: true,
  // Subpermisos Historial
  historial_ver: true,
  historial_exportar: true,
  // Subpermisos Clientes
  clientes_ver: true,
  clientes_exportar: true,
  // Subpermisos Administración
  admin_choferes: false,
  admin_operadores: false,
  admin_calles: false,
  admin_configuracion: false,
  admin_identidad: false,
  // Claves legacy para compatibilidad
  cancelar_viajes: true,
  editar_viajes: true,
  exportar_csv: true,
};

export const PERMISOS_DEFAULT_ADMIN = {
  recepcion: true,
  choferes: true,
  historial: true,
  clientes: true,
  admin: true,
  recepcion_toma: true,
  recepcion_chofer: true,
  recepcion_avisar: true,
  recepcion_cancelar: true,
  recepcion_ficha: true,
  choferes_ver: true,
  choferes_asignar: true,
  historial_ver: true,
  historial_exportar: true,
  clientes_ver: true,
  clientes_exportar: true,
  admin_choferes: true,
  admin_operadores: true,
  admin_calles: true,
  admin_configuracion: true,
  admin_identidad: true,
  cancelar_viajes: true,
  editar_viajes: true,
  exportar_csv: true,
};

/**
 * Determina si un operador cuenta con un permiso específico.
 * Los usuarios con rol 'admin' siempre tienen todos los permisos concedidos.
 */
export function tienePermiso(operador, permisoId) {
  if (!operador) return false;
  if (operador.rol === 'admin') return true;

  const permisos = {
    ...PERMISOS_DEFAULT_OPERADOR,
    ...(operador.permisos || {}),
  };

  // Mapeos de compatibilidad con claves anteriores
  if (permisoId === 'cancelar_viajes') {
    return Boolean(permisos.recepcion_cancelar ?? permisos.cancelar_viajes ?? permisos.recepcion);
  }
  if (permisoId === 'editar_viajes') {
    return Boolean(permisos.recepcion_ficha ?? permisos.editar_viajes ?? permisos.recepcion);
  }
  if (permisoId === 'exportar_csv') {
    return Boolean(permisos.historial_exportar ?? permisos.clientes_exportar ?? permisos.exportar_csv);
  }

  // Si se consulta un módulo principal (ej: 'admin', 'recepcion')
  const modulo = MODULOS_PERMISOS.find((m) => m.id === permisoId);
  if (modulo) {
    if (permisos[modulo.id] === false) return false;
    // Si tiene subpermisos definidos, verificar si al menos uno está activo
    const algunSubActivo = modulo.subpermisos.some((sub) => permisos[sub.id]);
    return Boolean(permisos[modulo.id] || algunSubActivo);
  }

  // Si se consulta un subpermiso específico (ej: 'admin_calles', 'recepcion_toma')
  if (permisos[permisoId] !== undefined) {
    return Boolean(permisos[permisoId]);
  }

  // Fallback al módulo padre si no estaba definido explícitamente el subpermiso
  const moduloPadre = MODULOS_PERMISOS.find((m) => m.subpermisos.some((s) => s.id === permisoId));
  if (moduloPadre) {
    return Boolean(permisos[moduloPadre.id]);
  }

  return Boolean(permisos[permisoId]);
}

/**
 * Normaliza y completa el objeto de permisos de un operador según su rol.
 */
export function normalizarPermisos(permisos, rol = 'operador') {
  const base = rol === 'admin' ? PERMISOS_DEFAULT_ADMIN : PERMISOS_DEFAULT_OPERADOR;
  if (!permisos || typeof permisos !== 'object') return { ...base };
  const resultado = { ...base };

  for (const m of MODULOS_PERMISOS) {
    const moduloDefinido = typeof permisos[m.id] === 'boolean';
    if (moduloDefinido) {
      resultado[m.id] = permisos[m.id];
    }

    for (const sub of m.subpermisos) {
      if (typeof permisos[sub.id] === 'boolean') {
        resultado[sub.id] = permisos[sub.id];
      } else if (moduloDefinido) {
        resultado[sub.id] = permisos[m.id];
      }
    }

    // El módulo está activo si al menos un subpermiso está activo
    const algunSub = m.subpermisos.some((sub) => resultado[sub.id]);
    resultado[m.id] = algunSub;
  }

  // Sincronizar alias de compatibilidad
  resultado.cancelar_viajes = Boolean(resultado.recepcion_cancelar);
  resultado.editar_viajes = Boolean(resultado.recepcion_ficha);
  resultado.exportar_csv = Boolean(resultado.historial_exportar || resultado.clientes_exportar);

  if (rol === 'admin') {
    Object.keys(resultado).forEach((k) => {
      resultado[k] = true;
    });
  }

  return resultado;
}
