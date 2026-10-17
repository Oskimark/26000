// Reglas de negocio de los viajes.
import { query, transaccion } from './db.js';
import { turnoDe, parsearHora, proximaOcurrencia } from '../shared/turnos.js';

export class ErrorNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.status = status;
  }
}

export function normalizarDireccion(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function limpiarDireccion(texto) {
  return String(texto ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizarTelefono(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

const SELECT_VIAJE = `
  SELECT v.id, v.numero, v.telefono, v.direccion_id, d.texto AS direccion,
         v.chofer_id, c.nombre AS chofer,
         v.operador_id, o.nombre AS operador,
         v.hora_toma, v.programado, v.hora_programada, v.hora_ejecucion,
         v.hora_asignacion, v.asignado_por, oa.nombre AS asignado_por_nombre,
         v.hora_avisado, v.avisado_por, oav.nombre AS avisado_por_nombre,
         v.hora_fin, v.cancelado, v.fecha_turno, v.tipo_turno
  FROM viajes v
  JOIN direcciones d ON d.id = v.direccion_id
  LEFT JOIN choferes c ON c.id = v.chofer_id
  LEFT JOIN operadores o ON o.id = v.operador_id
  LEFT JOIN operadores oa ON oa.id = v.asignado_por
  LEFT JOIN operadores oav ON oav.id = v.avisado_por`;

// Ejecutados primero (por N°), luego los programados pendientes por hora.
const ORDEN_LISTADO = `ORDER BY v.numero IS NULL, v.numero, v.hora_programada, v.id`;

export async function obtenerConfiguracion(db = { query }) {
  try {
    const { rows } = await db.query(
      `SELECT valor FROM configuracion WHERE clave = 'minutos_aviso_programado'`,
    );
    const min = Number(rows[0]?.valor);
    return { minutosAvisoProgramado: Number.isFinite(min) && min >= 0 ? min : 5 };
  } catch {
    return { minutosAvisoProgramado: 5 };
  }
}

export async function actualizarConfiguracion({ minutosAvisoProgramado }) {
  const min = Number(minutosAvisoProgramado);
  if (!Number.isFinite(min) || min < 0 || min > 240) {
    throw new ErrorNegocio('Los minutos de aviso previo deben estar entre 0 y 240');
  }
  const valor = Math.round(min);
  await query(
    `INSERT INTO configuracion (clave, valor)
     VALUES ('minutos_aviso_programado', $1)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
    [String(valor)],
  );
  return { minutosAvisoProgramado: valor };
}

export async function obtenerViaje(id, db = { query }) {
  const { rows } = await db.query(`${SELECT_VIAJE} WHERE v.id = $1`, [id]);
  if (!rows[0]) throw new ErrorNegocio('Viaje inexistente', 404);
  return rows[0];
}

export async function listarTurno({ fecha, tipo }) {
  const { rows } = await query(
    `${SELECT_VIAJE} WHERE v.fecha_turno = $1 AND v.tipo_turno = $2 ${ORDEN_LISTADO}`,
    [fecha, tipo],
  );
  return rows;
}

/** Programados pendientes de turnos posteriores al indicado. */
export async function listarProgramadosFuturos({ fecha, tipo }) {
  const { rows } = await query(
    `${SELECT_VIAJE}
     WHERE v.numero IS NULL AND NOT v.cancelado AND (v.fecha_turno, v.tipo_turno) > ($1::date, $2::char(1))
     ORDER BY v.hora_programada, v.id`,
    [fecha, tipo],
  );
  return rows;
}

async function siguienteNumero(client, { fecha, tipo }) {
  // Serializa la numeración dentro de cada turno, aunque haya varios operadores.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`turno:${fecha}:${tipo}`]);
  const { rows } = await client.query(
    'SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM viajes WHERE fecha_turno = $1 AND tipo_turno = $2',
    [fecha, tipo],
  );
  return rows[0].n;
}

async function registrarDireccion(client, texto) {
  const limpia = limpiarDireccion(texto);
  const normalizada = normalizarDireccion(limpia);
  if (!normalizada) throw new ErrorNegocio('Falta la dirección');
  const { rows } = await client.query(
    `INSERT INTO direcciones (texto, texto_normalizado, veces_usada, ultimo_uso)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (texto_normalizado)
     DO UPDATE SET veces_usada = direcciones.veces_usada + 1, ultimo_uso = now()
     RETURNING id`,
    [limpia, normalizada],
  );
  return rows[0].id;
}

async function validarChofer(client, choferId) {
  const { rows } = await client.query('SELECT id FROM choferes WHERE id = $1 AND activo', [choferId]);
  if (!rows[0]) throw new ErrorNegocio('Chofer inválido');
}

/**
 * Crea un viaje.
 *  - El chofer es opcional en todos los viajes ("Sin asignar" por defecto).
 *  - Se puede asignar un chofer al crear el viaje o en cualquier momento posterior,
 *    tanto en viajes inmediatos como en viajes programados.
 */
export async function crearViaje({ telefono, direccion, choferId, horaProgramada }, operadorId, ahora = new Date()) {
  const tel = normalizarTelefono(telefono);
  const textoHora = String(horaProgramada ?? '').trim();
  let programada = null;
  if (textoHora) {
    const hm = parsearHora(textoHora);
    if (!hm) throw new ErrorNegocio('Hora programada inválida');
    programada = proximaOcurrencia(hm, ahora);
  }
  const chofer = choferId ? Number(choferId) : null;

  const id = await transaccion(async (client) => {
    const direccionId = await registrarDireccion(client, direccion);
    if (chofer) await validarChofer(client, chofer);

    const turno = turnoDe(programada ?? ahora);
    const numero = programada ? null : await siguienteNumero(client, turno);
    const horaAsig = chofer ? ahora : null;
    const { rows } = await client.query(
      `INSERT INTO viajes (telefono, direccion_id, chofer_id, operador_id, hora_toma,
                           programado, hora_programada, fecha_turno, tipo_turno,
                           numero, hora_ejecucion, hora_asignacion, asignado_por, hora_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        tel, direccionId, chofer, operadorId, ahora,
        !!programada, programada, turno.fecha, turno.tipo,
        numero, programada ? null : ahora,
        horaAsig, chofer ? operadorId : null, horaAsig,
      ],
    );
    return rows[0].id;
  });
  return obtenerViaje(id);
}

/**
 * Los programados cuya hora está dentro de la ventana de aviso previo (minutos_aviso_programado)
 * pasan a la cola activa: reciben el siguiente N° del turno.
 * Devuelve los viajes activados.
 */
export async function ejecutarProgramadosVencidos(ahora = new Date()) {
  const ids = await transaccion(async (client) => {
    const { minutosAvisoProgramado } = await obtenerConfiguracion(client);
    const limiteAviso = new Date(ahora.getTime() + minutosAvisoProgramado * 60_000);
    const { rows } = await client.query(
      `SELECT id, fecha_turno, tipo_turno FROM viajes
       WHERE numero IS NULL AND NOT cancelado AND hora_programada <= $1
       ORDER BY hora_programada, id
       FOR UPDATE SKIP LOCKED`,
      [limiteAviso],
    );
    for (const v of rows) {
      const numero = await siguienteNumero(client, { fecha: v.fecha_turno, tipo: v.tipo_turno });
      await client.query('UPDATE viajes SET numero = $1, hora_ejecucion = $2 WHERE id = $3', [numero, ahora, v.id]);
    }
    return rows.map((r) => r.id);
  });
  return ids;
}

export async function asignarChofer(viajeId, choferId, operadorId) {
  return transaccion(async (client) => {
    const limpioId = choferId ? Number(choferId) : null;
    if (limpioId) {
      await validarChofer(client, limpioId);
      const { rowCount } = await client.query(
        `UPDATE viajes
         SET hora_avisado = CASE WHEN chofer_id IS DISTINCT FROM $1 THEN NULL ELSE hora_avisado END,
             avisado_por = CASE WHEN chofer_id IS DISTINCT FROM $1 THEN NULL ELSE avisado_por END,
             chofer_id = $1,
             hora_asignacion = now(),
             hora_fin = now(),
             asignado_por = $2
         WHERE id = $3 AND NOT cancelado`,
        [limpioId, operadorId, viajeId],
      );
      if (!rowCount) throw new ErrorNegocio('Viaje inexistente o anulado', 404);
    } else {
      const { rowCount } = await client.query(
        `UPDATE viajes
         SET chofer_id = NULL,
             hora_asignacion = NULL,
             hora_fin = NULL,
             asignado_por = NULL,
             hora_avisado = NULL,
             avisado_por = NULL
         WHERE id = $1 AND NOT cancelado`,
        [viajeId],
      );
      if (!rowCount) throw new ErrorNegocio('Viaje inexistente o anulado', 404);
    }
    return obtenerViaje(viajeId, client);
  });
}

/**
 * Hora manual (para Asignado o Avisado). Sin texto = ahora. Con texto "HH:MM" = la última vez que fue esa hora
 * (se admite hasta 10 minutos hacia adelante por diferencias de reloj).
 */
export function calcularHoraFin(texto, ahora = new Date()) {
  const s = String(texto ?? '').trim();
  if (!s) return ahora;
  const hm = parsearHora(s);
  if (!hm) throw new ErrorNegocio('Hora inválida');
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hm.h, hm.m);
  if (d.getTime() > ahora.getTime() + 10 * 60_000) d.setDate(d.getDate() - 1);
  return d;
}

export async function registrarFin(viajeId, { hora, borrar }) {
  const valor = borrar ? null : calcularHoraFin(hora);
  const { rowCount } = await query(
    'UPDATE viajes SET hora_asignacion = $1, hora_fin = $1 WHERE id = $2 AND NOT cancelado',
    [valor, viajeId],
  );
  if (!rowCount) throw new ErrorNegocio('Viaje inexistente o anulado');
  return obtenerViaje(viajeId);
}

export async function registrarAvisado(viajeId, { avisado = true, hora, borrar }, operadorId) {
  const limpiar = borrar || avisado === false;
  const valor = limpiar ? null : calcularHoraFin(hora);
  const { rowCount } = await query(
    'UPDATE viajes SET hora_avisado = $1, avisado_por = $2 WHERE id = $3 AND NOT cancelado',
    [valor, limpiar ? null : operadorId, viajeId],
  );
  if (!rowCount) throw new ErrorNegocio('Viaje inexistente o anulado', 404);
  return obtenerViaje(viajeId);
}

export async function cambiarCancelacion(viajeId, cancelado, operadorId) {
  const { rowCount } = await query(
    'UPDATE viajes SET cancelado = $1, cancelado_por = $2 WHERE id = $3',
    [!!cancelado, cancelado ? operadorId : null, viajeId],
  );
  if (!rowCount) throw new ErrorNegocio('Viaje inexistente', 404);
  return obtenerViaje(viajeId);
}

/**
 * Sugerencias de direcciones mientras se escribe.
 * Primero las usadas por ese teléfono (por asiduidad), luego el resto por frecuencia.
 */
export async function sugerirDirecciones({ q, telefono, limite = 8 }) {
  const texto = normalizarDireccion(q);
  const tel = normalizarTelefono(telefono);
  const patron = `%${texto.replace(/[%_\\]/g, '\\$&')}%`;
  const prefijo = `${texto.replace(/[%_\\]/g, '\\$&')}%`;
  const { rows } = await query(
    `WITH del_telefono AS (
       SELECT v.direccion_id, count(*) AS usos, max(v.hora_toma) AS ultimo
       FROM viajes v
       WHERE $1 <> '' AND v.telefono = $1 AND NOT v.cancelado
       GROUP BY v.direccion_id
     )
     SELECT d.id, d.texto, d.veces_usada,
            COALESCE(t.usos, 0)::int AS usos_telefono
     FROM direcciones d
     LEFT JOIN del_telefono t ON t.direccion_id = d.id
     WHERE ($2 = '' AND t.direccion_id IS NOT NULL)
        OR ($2 <> '' AND d.texto_normalizado LIKE $3)
     ORDER BY COALESCE(t.usos, 0) DESC, t.ultimo DESC NULLS LAST,
              (d.texto_normalizado LIKE $4) DESC, d.veces_usada DESC, d.ultimo_uso DESC NULLS LAST
     LIMIT $5`,
    [tel, texto, patron, prefijo, limite],
  );
  return rows;
}

/**
 * Búsqueda avanzada de viajes para el módulo Clientes y estadísticas por día, mes y año.
 */
export async function buscarViajesClientes(filtros = {}) {
  const condiciones = [];
  const params = [];
  const addParam = (val) => {
    params.push(val);
    return `$${params.length}`;
  };

  const tel = normalizarTelefono(filtros.telefono);
  if (tel) {
    const p = addParam(`%${tel}%`);
    condiciones.push(`v.telefono LIKE ${p}`);
  }

  const dest = normalizarDireccion(filtros.destino);
  if (dest) {
    const p = addParam(`%${dest.replace(/[%_\\]/g, '\\$&')}%`);
    condiciones.push(`d.texto_normalizado LIKE ${p}`);
  }

  if (filtros.choferId) {
    const p = addParam(Number(filtros.choferId));
    condiciones.push(`v.chofer_id = ${p}`);
  } else if (filtros.chofer && String(filtros.chofer).trim()) {
    const p = addParam(`%${String(filtros.chofer).trim()}%`);
    condiciones.push(`c.nombre ILIKE ${p}`);
  }

  if (filtros.operador && String(filtros.operador).trim()) {
    const p = addParam(`%${String(filtros.operador).trim()}%`);
    condiciones.push(`o.nombre ILIKE ${p}`);
  }

  if (filtros.tipoTurno === 'A' || filtros.tipoTurno === 'B') {
    const p = addParam(filtros.tipoTurno);
    condiciones.push(`v.tipo_turno = ${p}`);
  }

  if (filtros.fechaDesde && /^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaDesde)) {
    const p = addParam(filtros.fechaDesde);
    condiciones.push(`v.fecha_turno >= ${p}::date`);
  }

  if (filtros.fechaHasta && /^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaHasta)) {
    const p = addParam(filtros.fechaHasta);
    condiciones.push(`v.fecha_turno <= ${p}::date`);
  }

  if (filtros.dia && /^\d{4}-\d{2}-\d{2}$/.test(filtros.dia)) {
    const p = addParam(filtros.dia);
    condiciones.push(`v.fecha_turno = ${p}::date`);
  }

  if (filtros.mes && /^\d{4}-\d{2}$/.test(filtros.mes)) {
    const p = addParam(filtros.mes);
    condiciones.push(`to_char(v.fecha_turno, 'YYYY-MM') = ${p}`);
  }

  if (filtros.anio && /^\d{4}$/.test(filtros.anio)) {
    const p = addParam(filtros.anio);
    condiciones.push(`to_char(v.fecha_turno, 'YYYY') = ${p}`);
  }

  // Condición base sin filtro de estado para calcular estadísticas de realizados vs anulados
  const whereBase = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const estado = filtros.estado || 'realizados';
  const condEstado = [...condiciones];
  if (estado === 'realizados') {
    condEstado.push('v.numero IS NOT NULL AND NOT v.cancelado');
  } else if (estado === 'anulados') {
    condEstado.push('v.cancelado = TRUE');
  } else if (estado === 'programados') {
    condEstado.push('v.programado = TRUE');
  }
  const whereListado = condEstado.length ? `WHERE ${condEstado.join(' AND ')}` : '';

  const limite = Math.min(Math.max(Number(filtros.limite) || 300, 1), 1000);
  const paramsListado = [...params, limite];

  const baseFrom = `
    FROM viajes v
    JOIN direcciones d ON d.id = v.direccion_id
    LEFT JOIN choferes c ON c.id = v.chofer_id
    LEFT JOIN operadores o ON o.id = v.operador_id
  `;

  const [
    resViajes,
    resResumen,
    resPorDia,
    resPorMes,
    resPorAnio,
    resTopClientes,
    resTopDestinos,
    resTopChoferes,
  ] = await Promise.all([
    query(
      `${SELECT_VIAJE}
       ${whereListado}
       ORDER BY COALESCE(v.hora_ejecucion, v.hora_programada, v.hora_toma) DESC, v.id DESC
       LIMIT $${paramsListado.length}`,
      paramsListado,
    ),
    query(
      `SELECT
         COUNT(*)::int AS total_filtrados,
         COUNT(*) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS realizados,
         COUNT(*) FILTER (WHERE v.cancelado)::int AS anulados,
         COUNT(*) FILTER (WHERE v.programado AND NOT v.cancelado)::int AS programados,
         COUNT(DISTINCT NULLIF(v.telefono, '')) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS clientes_unicos,
         COUNT(DISTINCT v.direccion_id) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS destinos_unicos,
         COUNT(DISTINCT v.chofer_id) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS choferes_unicos
       ${baseFrom}
       ${whereBase}`,
      params,
    ),
    query(
      `SELECT
         to_char(v.fecha_turno, 'YYYY-MM-DD') AS periodo,
         COUNT(*) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS realizados,
         COUNT(*) FILTER (WHERE v.cancelado)::int AS anulados,
         COUNT(*) FILTER (WHERE v.programado AND NOT v.cancelado)::int AS programados,
         COUNT(DISTINCT NULLIF(v.telefono, '')) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS clientes_unicos,
         COUNT(DISTINCT v.chofer_id) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS choferes_activos
       ${baseFrom}
       ${whereBase}
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 90`,
      params,
    ),
    query(
      `SELECT
         to_char(v.fecha_turno, 'YYYY-MM') AS periodo,
         COUNT(*) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS realizados,
         COUNT(*) FILTER (WHERE v.cancelado)::int AS anulados,
         COUNT(*) FILTER (WHERE v.programado AND NOT v.cancelado)::int AS programados,
         COUNT(DISTINCT NULLIF(v.telefono, '')) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS clientes_unicos,
         COUNT(DISTINCT v.fecha_turno) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS dias_activos
       ${baseFrom}
       ${whereBase}
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 36`,
      params,
    ),
    query(
      `SELECT
         to_char(v.fecha_turno, 'YYYY') AS periodo,
         COUNT(*) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS realizados,
         COUNT(*) FILTER (WHERE v.cancelado)::int AS anulados,
         COUNT(*) FILTER (WHERE v.programado AND NOT v.cancelado)::int AS programados,
         COUNT(DISTINCT NULLIF(v.telefono, '')) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS clientes_unicos,
         COUNT(DISTINCT to_char(v.fecha_turno, 'YYYY-MM')) FILTER (WHERE v.numero IS NOT NULL AND NOT v.cancelado)::int AS meses_activos
       ${baseFrom}
       ${whereBase}
       GROUP BY 1
       ORDER BY 1 DESC`,
      params,
    ),
    query(
      `SELECT
         v.telefono,
         COUNT(*)::int AS realizados,
         MAX(COALESCE(v.hora_ejecucion, v.hora_toma)) AS ultimo_viaje,
         (ARRAY_AGG(d.texto ORDER BY COALESCE(v.hora_ejecucion, v.hora_toma) DESC))[1] AS ultimo_destino,
         MODE() WITHIN GROUP (ORDER BY d.texto) AS destino_frecuente,
         MODE() WITHIN GROUP (ORDER BY c.nombre) AS chofer_frecuente
       ${baseFrom}
       ${whereBase ? `${whereBase} AND` : 'WHERE'} v.telefono <> '' AND v.numero IS NOT NULL AND NOT v.cancelado
       GROUP BY v.telefono
       ORDER BY realizados DESC, ultimo_viaje DESC
       LIMIT 20`,
      params,
    ),
    query(
      `SELECT
         d.texto AS direccion,
         COUNT(*)::int AS realizados,
         COUNT(DISTINCT NULLIF(v.telefono, ''))::int AS clientes_unicos
       ${baseFrom}
       ${whereBase ? `${whereBase} AND` : 'WHERE'} v.numero IS NOT NULL AND NOT v.cancelado
       GROUP BY d.id, d.texto
       ORDER BY realizados DESC
       LIMIT 20`,
      params,
    ),
    query(
      `SELECT
         v.chofer_id,
         COALESCE(c.nombre, 'Sin chofer') AS chofer,
         COUNT(*)::int AS realizados,
         COUNT(DISTINCT NULLIF(v.telefono, ''))::int AS clientes_unicos
       ${baseFrom}
       ${whereBase ? `${whereBase} AND` : 'WHERE'} v.numero IS NOT NULL AND NOT v.cancelado
       GROUP BY v.chofer_id, c.nombre
       ORDER BY realizados DESC
       LIMIT 20`,
      params,
    ),
  ]);

  return {
    viajes: resViajes.rows,
    resumen: resResumen.rows[0] || {
      total_filtrados: 0,
      realizados: 0,
      anulados: 0,
      programados: 0,
      clientes_unicos: 0,
      destinos_unicos: 0,
      choferes_unicos: 0,
    },
    estadisticas: {
      porDia: resPorDia.rows,
      porMes: resPorMes.rows,
      porAnio: resPorAnio.rows,
      topClientes: resTopClientes.rows,
      topDestinos: resTopDestinos.rows,
      topChoferes: resTopChoferes.rows,
    },
  };
}

