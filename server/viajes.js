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
         v.hora_fin, v.cancelado, v.fecha_turno, v.tipo_turno
  FROM viajes v
  JOIN direcciones d ON d.id = v.direccion_id
  LEFT JOIN choferes c ON c.id = v.chofer_id
  LEFT JOIN operadores o ON o.id = v.operador_id
  LEFT JOIN operadores oa ON oa.id = v.asignado_por`;

// Ejecutados primero (por N°), luego los programados pendientes por hora.
const ORDEN_LISTADO = `ORDER BY v.numero IS NULL, v.numero, v.hora_programada, v.id`;

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
 *  - Sin hora programada: es inmediato, requiere chofer y recibe N° al instante.
 *  - Con hora programada: queda pendiente (sin N°) en el turno de esa hora.
 *    El chofer es opcional; se pide cuando llega la hora.
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
  // Los choferes se asignan siempre en el momento: en un programado, al llegar la hora.
  const chofer = !programada && choferId ? Number(choferId) : null;
  if (!programada && !chofer) throw new ErrorNegocio('Elegí un chofer');

  const id = await transaccion(async (client) => {
    const direccionId = await registrarDireccion(client, direccion);
    if (chofer) await validarChofer(client, chofer);

    const turno = turnoDe(programada ?? ahora);
    const numero = programada ? null : await siguienteNumero(client, turno);
    const { rows } = await client.query(
      `INSERT INTO viajes (telefono, direccion_id, chofer_id, operador_id, hora_toma,
                           programado, hora_programada, fecha_turno, tipo_turno,
                           numero, hora_ejecucion, hora_asignacion, asignado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        tel, direccionId, chofer, operadorId, ahora,
        !!programada, programada, turno.fecha, turno.tipo,
        numero, programada ? null : ahora,
        chofer ? ahora : null, chofer ? operadorId : null,
      ],
    );
    return rows[0].id;
  });
  return obtenerViaje(id);
}

/**
 * Los programados cuya hora llegó pasan a la cola: reciben el siguiente N° del turno.
 * Devuelve los viajes ejecutados.
 */
export async function ejecutarProgramadosVencidos(ahora = new Date()) {
  const ids = await transaccion(async (client) => {
    const { rows } = await client.query(
      `SELECT id, fecha_turno, tipo_turno FROM viajes
       WHERE numero IS NULL AND NOT cancelado AND hora_programada <= $1
       ORDER BY hora_programada, id
       FOR UPDATE SKIP LOCKED`,
      [ahora],
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
    await validarChofer(client, Number(choferId));
    const { rowCount } = await client.query(
      `UPDATE viajes SET chofer_id = $1, hora_asignacion = now(), asignado_por = $2
       WHERE id = $3 AND NOT cancelado`,
      [Number(choferId), operadorId, viajeId],
    );
    if (!rowCount) throw new ErrorNegocio('Viaje inexistente o anulado', 404);
    return obtenerViaje(viajeId, client);
  });
}

/**
 * Hora de fin. Sin texto = ahora. Con texto "HH:MM" = la última vez que fue esa hora
 * (se admite hasta 10 minutos hacia adelante por diferencias de reloj).
 */
export function calcularHoraFin(texto, ahora = new Date()) {
  const s = String(texto ?? '').trim();
  if (!s) return ahora;
  const hm = parsearHora(s);
  if (!hm) throw new ErrorNegocio('Hora de fin inválida');
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hm.h, hm.m);
  if (d.getTime() > ahora.getTime() + 10 * 60_000) d.setDate(d.getDate() - 1);
  return d;
}

export async function registrarFin(viajeId, { hora, borrar }) {
  const valor = borrar ? null : calcularHoraFin(hora);
  const { rowCount } = await query('UPDATE viajes SET hora_fin = $1 WHERE id = $2 AND numero IS NOT NULL', [valor, viajeId]);
  if (!rowCount) throw new ErrorNegocio('Solo se puede finalizar un viaje ya ejecutado');
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
