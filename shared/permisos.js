export const PERMISOS_DISPONIBLES = [
  {
    id: 'recepcion',
    categoria: 'Secciones',
    nombre: 'Recepción',
    descripcion: 'Toma de llamadas, despacho y viajes en curso del turno actual',
  },
  {
    id: 'choferes',
    categoria: 'Secciones',
    nombre: 'Choferes del turno',
    descripcion: 'Asignar y desasignar choferes en el turno de trabajo',
  },
  {
    id: 'historial',
    categoria: 'Secciones',
    nombre: 'Historial',
    descripcion: 'Consultar viajes y registros de turnos pasados',
  },
  {
    id: 'clientes',
    categoria: 'Secciones',
    nombre: 'Clientes',
    descripcion: 'Base de clientes, teléfonos y destinos frecuentes',
  },
  {
    id: 'admin',
    categoria: 'Secciones',
    nombre: 'Administración',
    descripcion: 'Acceso al módulo de administración general',
  },
  {
    id: 'cancelar_viajes',
    categoria: 'Operaciones',
    nombre: 'Anular / Restaurar viajes',
    descripcion: 'Permite anular o reactivar viajes del sistema',
  },
  {
    id: 'editar_viajes',
    categoria: 'Operaciones',
    nombre: 'Editar ficha de viaje',
    descripcion: 'Modificar datos de un viaje (dirección, chofer, programado)',
  },
  {
    id: 'exportar_csv',
    categoria: 'Operaciones',
    nombre: 'Exportar CSV',
    descripcion: 'Descargar reportes y planillas de viajes en formato CSV',
  },
];

export const PERMISOS_DEFAULT_OPERADOR = {
  recepcion: true,
  choferes: true,
  historial: true,
  clientes: true,
  admin: false,
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
  return Boolean(permisos[permisoId]);
}

/**
 * Normaliza y completa el objeto de permisos de un operador según su rol.
 */
export function normalizarPermisos(permisos, rol = 'operador') {
  const base = rol === 'admin' ? PERMISOS_DEFAULT_ADMIN : PERMISOS_DEFAULT_OPERADOR;
  if (!permisos || typeof permisos !== 'object') return { ...base };
  const resultado = { ...base };
  for (const p of PERMISOS_DISPONIBLES) {
    if (typeof permisos[p.id] === 'boolean') {
      resultado[p.id] = permisos[p.id];
    }
  }
  if (rol === 'admin') {
    resultado.admin = true;
  }
  return resultado;
}
