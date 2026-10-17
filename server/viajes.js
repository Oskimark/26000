// Reglas de negocio de los viajes.
import { query, transaccion, sembrarCallesIniciales } from './db.js';
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

/**
 * Clave fonética rioplatense para tolerar errores de ortografía o tipeo en calles
 * (ej: b/v, s/c/z, ll/y, h muda, letras repetidas).
 */
export function claveFonetica(texto) {
  return normalizarDireccion(texto)
    .replace(/h/g, '')
    .replace(/v/g, 'b')
    .replace(/z/g, 's')
    .replace(/c([ei])/g, 's$1')
    .replace(/ll/g, 'y')
    .replace(/qu([ei])/g, 'k$1')
    .replace(/([a-z])\1+/g, '$1');
}

/**
 * Distancia de Levenshtein acotada para tolerar errores de tipeo (letras invertidas o faltantes).
 */
function distanciaEdicion(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + costo);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Desglosa el texto ingresado respetando el orden estándar de ingreso:
 * SIEMPRE <número> y luego <calle> (ej: "450 Artigas", "1250 Batlle y Ordóñez").
 * Contempla calles cuyo nombre empieza con número ("18 de Julio", "25 de Mayo", etc.).
 */
export function desglosarNumeroYCalle(texto) {
  const limpio = limpiarDireccion(texto);
  if (!limpio) return { numero: '', calle: '' };

  // Si empieza con un número de puerta seguido de la calle: ej "450 Artigas" o "450 bis Artigas"
  const m = limpio.match(/^(\d{1,5}[a-zA-Z]?(?:\s+bis)?)\s+(.+)$/i);
  if (m) {
    const posibleNum = m[1].trim();
    const resto = m[2].trim();
    // Excepción: el operador escribió solo el nombre de una calle con fecha patria sin número de puerta adelante
    // (ej: "18 de Julio", "25 de Mayo", "25 de Agosto", "19 de Abril", "12 de Octubre")
    if (/^(18|25|19|12|33)$/i.test(posibleNum) && /^de\s+/i.test(resto)) {
      return { numero: '', calle: limpio };
    }
    return { numero: posibleNum, calle: resto };
  }

  // Si solo escribió el número hasta ahora (ej: "450")
  if (/^\d{1,5}[a-zA-Z]?$/.test(limpio)) {
    return { numero: limpio, calle: '' };
  }

  return { numero: '', calle: limpio };
}

const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const SELECT_VIAJE = `
  SELECT v.id, v.numero, v.telefono, v.direccion_id, d.texto AS direccion,
         v.chofer_id, c.nombre AS chofer,
         v.operador_id, o.nombre AS operador,
         v.hora_toma, v.programado, v.hora_programada, v.hora_ejecucion,
         v.hora_asignacion, v.asignado_por, oa.nombre AS asignado_por_nombre,
         v.hora_avisado, v.avisado_por, oav.nombre AS avisado_por_nombre,
         v.hora_fin, v.cancelado, v.cancelado_por, oc.nombre AS cancelado_por_nombre,
         v.repetir_activo, v.repetir_modo, v.repetir_dias, v.repetir_hora, v.viaje_origen_id,
         v.fecha_turno, v.tipo_turno
  FROM viajes v
  JOIN direcciones d ON d.id = v.direccion_id
  LEFT JOIN choferes c ON c.id = v.chofer_id
  LEFT JOIN operadores o ON o.id = v.operador_id
  LEFT JOIN operadores oa ON oa.id = v.asignado_por
  LEFT JOIN operadores oav ON oav.id = v.avisado_por
  LEFT JOIN operadores oc ON oc.id = v.cancelado_por`;

// Ejecutados primero (por N°), luego los programados pendientes por hora.
const ORDEN_LISTADO = `ORDER BY v.numero IS NULL, v.numero, v.hora_programada, v.id`;

async function registrarHistorial(client, viajeId, operadorId, accion, detalle) {
  await client.query(
    `INSERT INTO viaje_historial (viaje_id, operador_id, accion, detalle)
     VALUES ($1, $2, $3, $4)`,
    [viajeId, operadorId || null, accion, detalle],
  );
}

export async function obtenerHistorialViaje(viajeId, db = { query }) {
  const { rows } = await db.query(
    `SELECT vh.id, vh.viaje_id, vh.operador_id, o.nombre AS operador,
            vh.fecha, vh.accion, vh.detalle
     FROM viaje_historial vh
     LEFT JOIN operadores o ON o.id = vh.operador_id
     WHERE vh.viaje_id = $1
     ORDER BY vh.fecha DESC, vh.id DESC`,
    [viajeId],
  );
  return rows;
}

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

export async function obtenerFichaViaje(id) {
  const [viaje, historial] = await Promise.all([
    obtenerViaje(id),
    obtenerHistorialViaje(id),
  ]);
  return { viaje, historial };
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

async function canonizarDireccionConCatalogo(client, texto) {
  const limpia = limpiarDireccion(texto);
  if (!limpia) return '';
  try {
    const { rows: calles } = await client.query(
      'SELECT id, nombre, nombre_normalizado, alias FROM calles WHERE activa = TRUE',
    );
    if (!calles.length) return limpia;

    const buscarCoincidenciaExacta = (frag) => {
      const fNorm = normalizarDireccion(frag);
      const fFon = claveFonetica(frag);
      if (!fNorm) return null;

      // 1. Nombre exacto normalizado
      for (const c of calles) {
        if (c.nombre_normalizado === fNorm) return c;
      }
      // 2. Alias exacto normalizado (ej: "jose batlle y ordoñez" -> "Batlle y Ordóñez")
      for (const c of calles) {
        const listaAlias = String(c.alias || '')
          .split(',')
          .map((a) => normalizarDireccion(a))
          .filter(Boolean);
        if (listaAlias.includes(fNorm)) return c;
      }
      // 3. Coincidencia fonética exacta del nombre (ej: "sorriya de san martin" o "itusango")
      for (const c of calles) {
        if (claveFonetica(c.nombre) === fFon) return c;
      }
      return null;
    };

    const { numero, calle } = desglosarNumeroYCalle(limpia);
    if (calle) {
      const match = buscarCoincidenciaExacta(calle);
      if (match) {
        return numero ? `${numero} ${match.nombre}` : match.nombre;
      }
    }
  } catch {
    // Si la tabla calles aún no existe o falla, conserva el texto limpio
  }
  return limpia;
}

async function registrarDireccion(client, texto) {
  const limpia = await canonizarDireccionConCatalogo(client, texto);
  const normalizada = normalizarDireccion(limpia);
  if (!normalizada) throw new ErrorNegocio('Falta la dirección');
  const { rows } = await client.query(
    `INSERT INTO direcciones (texto, texto_normalizado, veces_usada, ultimo_uso)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (texto_normalizado)
     DO UPDATE SET texto = EXCLUDED.texto, veces_usada = direcciones.veces_usada + 1, ultimo_uso = now()
     RETURNING id`,
    [limpia, normalizada],
  );
  return rows[0].id;
}

async function validarChofer(client, choferId) {
  const { rows } = await client.query('SELECT id, nombre FROM choferes WHERE id = $1 AND activo', [choferId]);
  if (!rows[0]) throw new ErrorNegocio('Chofer inválido');
  return rows[0];
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
    const infoChofer = chofer ? await validarChofer(client, chofer) : null;

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
    const viajeId = rows[0].id;
    const resumenCreacion = [
      `Dirección: "${limpiarDireccion(direccion)}"`,
      tel ? `Tel: ${tel}` : 'Sin teléfono',
      infoChofer ? `Chofer asignado: ${infoChofer.nombre}` : 'Chofer: Sin asignar',
      programada ? `Programado para ${textoHora}` : 'Viaje inmediato',
    ].join(' · ');
    await registrarHistorial(client, viajeId, operadorId, 'Creación de viaje', resumenCreacion);
    return viajeId;
  });
  return obtenerViaje(id);
}

/**
 * Genera instancias programadas para los viajes que tienen activada la repetición programática.
 */
export async function generarViajesRepetidos(ahora = new Date()) {
  return transaccion(async (client) => {
    const { rows: plantillas } = await client.query(
      `SELECT * FROM viajes WHERE repetir_activo = TRUE AND NOT cancelado`,
    );
    const creados = [];
    for (const p of plantillas) {
      const hm = parsearHora(p.repetir_hora);
      if (!hm) continue;
      const prox = proximaOcurrencia(hm, ahora);
      const diaSemana = prox.getDay(); // 0=Dom .. 6=Sáb
      const diasPermitidos =
        p.repetir_modo === 'diario'
          ? [0, 1, 2, 3, 4, 5, 6]
          : String(p.repetir_dias || '')
              .split(',')
              .map((x) => Number(x.trim()))
              .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

      if (!diasPermitidos.includes(diaSemana)) continue;

      // Verificar si ya existe el viaje para esta ocurrencia (o si el propio viaje origen ya apunta a esa hora)
      const ventanaIni = new Date(prox.getTime() - 30 * 60_000);
      const ventanaFin = new Date(prox.getTime() + 30 * 60_000);
      const { rows: existentes } = await client.query(
        `SELECT id FROM viajes
         WHERE (id = $1 OR viaje_origen_id = $1)
           AND NOT cancelado
           AND hora_programada BETWEEN $2 AND $3
         LIMIT 1`,
        [p.id, ventanaIni, ventanaFin],
      );
      if (existentes.length > 0) continue;

      const turno = turnoDe(prox);
      const { rows: nuevo } = await client.query(
        `INSERT INTO viajes (telefono, direccion_id, chofer_id, operador_id, hora_toma,
                             programado, hora_programada, fecha_turno, tipo_turno,
                             numero, hora_ejecucion, viaje_origen_id)
         VALUES ($1, $2, NULL, $3, $4, TRUE, $5, $6, $7, NULL, NULL, $8)
         RETURNING id`,
        [p.telefono, p.direccion_id, p.operador_id, ahora, prox, turno.fecha, turno.tipo, p.id],
      );
      await registrarHistorial(
        client,
        nuevo[0].id,
        p.operador_id,
        'Repetición automática',
        `Generado automáticamente a partir de la programación repetitiva del viaje #${p.id} (${p.repetir_hora}).`,
      );
      creados.push(nuevo[0].id);
    }
    return creados;
  });
}

/**
 * Los programados cuya hora está dentro de la ventana de aviso previo (minutos_aviso_programado)
 * pasan a la cola activa: reciben el siguiente N° del turno.
 * Devuelve los viajes activados.
 */
export async function ejecutarProgramadosVencidos(ahora = new Date()) {
  const repetidos = await generarViajesRepetidos(ahora).catch(() => []);
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
  return [...repetidos, ...ids];
}

export async function asignarChofer(viajeId, choferId, operadorId) {
  return transaccion(async (client) => {
    const previo = await obtenerViaje(viajeId, client);
    if (previo.cancelado) throw new ErrorNegocio('Viaje anulado', 400);

    const limpioId = choferId ? Number(choferId) : null;
    if (limpioId) {
      const infoChofer = await validarChofer(client, limpioId);
      await client.query(
        `UPDATE viajes
         SET chofer_id = $1,
             hora_asignacion = now(),
             hora_fin = now(),
             asignado_por = $2,
             hora_avisado = NULL,
             avisado_por = NULL
         WHERE id = $3 AND NOT cancelado`,
        [limpioId, operadorId, viajeId],
      );
      const detalle = previo.chofer
        ? `Cambió chofer de "${previo.chofer}" a "${infoChofer.nombre}" (se reinició el botón de Avisar).`
        : `Asignó chofer "${infoChofer.nombre}".`;
      await registrarHistorial(client, viajeId, operadorId, 'Asignación de chofer', detalle);
    } else {
      await client.query(
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
      if (previo.chofer) {
        await registrarHistorial(
          client,
          viajeId,
          operadorId,
          'Cambio de chofer',
          `Pasó chofer de "${previo.chofer}" a "Sin asignar" (se reinició el estado de aviso).`,
        );
      }
    }
    return obtenerViaje(viajeId, client);
  });
}

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

export async function registrarAvisado(viajeId, { avisado = true, borrar }, operadorId) {
  return transaccion(async (client) => {
    const actual = await obtenerViaje(viajeId, client);
    if (actual.cancelado) throw new ErrorNegocio('No se puede avisar un viaje anulado', 400);
    if (!actual.chofer_id) {
      throw new ErrorNegocio('Primero tenés que asignar un chofer antes de avisar');
    }
    const limpiar = borrar || avisado === false;
    const valor = limpiar ? null : new Date();
    await client.query(
      'UPDATE viajes SET hora_avisado = $1, avisado_por = $2 WHERE id = $3',
      [valor, limpiar ? null : operadorId, viajeId],
    );
    await registrarHistorial(
      client,
      viajeId,
      operadorId,
      limpiar ? 'Reinicio de aviso' : 'Chofer avisado',
      limpiar
        ? `Se desmarcó el aviso al chofer "${actual.chofer}".`
        : `Se avisó al chofer "${actual.chofer}".`,
    );
    return obtenerViaje(viajeId, client);
  });
}

/**
 * Edita los datos permitidos en la Ficha de Viaje:
 * dirección, teléfono, chofer, reprogramación y configuración de repetición.
 * No permite editar los registros de tiempos ni los operadores que actuaron.
 */
export async function editarFichaViaje(viajeId, datos, operadorId, ahora = new Date()) {
  const resultado = await transaccion(async (client) => {
    const actual = await obtenerViaje(viajeId, client);
    const cambios = [];

    // 1. Teléfono
    let nuevoTel = actual.telefono;
    if (datos.telefono !== undefined) {
      nuevoTel = normalizarTelefono(datos.telefono);
      if (nuevoTel !== actual.telefono) {
        cambios.push(`Teléfono: "${actual.telefono || '—'}" → "${nuevoTel || '—'}"`);
      }
    }

    // 2. Dirección
    let nuevaDirId = actual.direccion_id;
    if (datos.direccion !== undefined) {
      const limpia = limpiarDireccion(datos.direccion);
      if (!limpia) throw new ErrorNegocio('Falta la dirección');
      if (limpia !== actual.direccion) {
        nuevaDirId = await registrarDireccion(client, limpia);
        cambios.push(`Dirección: "${actual.direccion}" → "${limpia}"`);
      }
    }

    // 3. Chofer (si cambia, actualiza hora_asignacion y resetea hora_avisado)
    let nuevoChoferId = actual.chofer_id;
    let nuevaHoraAsig = actual.hora_asignacion;
    let nuevoAsigPor = actual.asignado_por;
    let nuevaHoraAvisado = actual.hora_avisado;
    let nuevoAvisadoPor = actual.avisado_por;

    if (datos.choferId !== undefined) {
      const limpioChofer = datos.choferId ? Number(datos.choferId) : null;
      if (limpioChofer !== actual.chofer_id) {
        if (limpioChofer) {
          const infoChofer = await validarChofer(client, limpioChofer);
          nuevoChoferId = limpioChofer;
          nuevaHoraAsig = ahora;
          nuevoAsigPor = operadorId;
          nuevaHoraAvisado = null;
          nuevoAvisadoPor = null;
          cambios.push(
            `Chofer: "${actual.chofer || 'Sin asignar'}" → "${infoChofer.nombre}" (se reinició el botón de Avisar)`,
          );
        } else {
          nuevoChoferId = null;
          nuevaHoraAsig = null;
          nuevoAsigPor = null;
          nuevaHoraAvisado = null;
          nuevoAvisadoPor = null;
          cambios.push(`Chofer: "${actual.chofer}" → "Sin asignar" (se reinició el estado de aviso)`);
        }
      }
    }

    // 4. Reprogramación
    let nuevoProgramado = actual.programado;
    let nuevaHoraProg = actual.hora_programada;
    let nuevaFechaTurno = actual.fecha_turno;
    let nuevoTipoTurno = actual.tipo_turno;
    let nuevoNumero = actual.numero;
    let nuevaHoraEjec = actual.hora_ejecucion;

    if (datos.horaProgramada !== undefined) {
      const textoHora = String(datos.horaProgramada ?? '').trim();
      if (textoHora) {
        const hm = parsearHora(textoHora);
        if (!hm) throw new ErrorNegocio('Hora programada inválida (ej: 18:30)');
        const horaAntStr = actual.hora_programada
          ? new Date(actual.hora_programada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '';
        if (!actual.programado || textoHora !== horaAntStr) {
          nuevaHoraProg = proximaOcurrencia(hm, ahora);
          nuevoProgramado = true;
          const t = turnoDe(nuevaHoraProg);
          nuevaFechaTurno = t.fecha;
          nuevoTipoTurno = t.tipo;
          const { minutosAvisoProgramado } = await obtenerConfiguracion(client);
          if (nuevaHoraProg.getTime() > ahora.getTime() + minutosAvisoProgramado * 60_000) {
            nuevoNumero = null;
            nuevaHoraEjec = null;
          }
          cambios.push(`Reprogramado para las ${ String(hm.h).padStart(2, '0') }:${ String(hm.m).padStart(2, '0') }`);
        }
      } else if (actual.programado && datos.programado === false) {
        nuevoProgramado = false;
        nuevaHoraProg = null;
        if (nuevoNumero == null) {
          const t = turnoDe(ahora);
          nuevaFechaTurno = t.fecha;
          nuevoTipoTurno = t.tipo;
          nuevoNumero = await siguienteNumero(client, t);
          nuevaHoraEjec = ahora;
        }
        cambios.push('Quitó la programación horaria (pasó a viaje inmediato)');
      }
    }

    // 5. Repetición programática ("cada día" o selección de días de la semana)
    let repActivo = actual.repetir_activo;
    let repModo = actual.repetir_modo || 'diario';
    let repDias = actual.repetir_dias || '';
    let repHora = actual.repetir_hora || '';

    if (datos.repetirActivo !== undefined) {
      repActivo = Boolean(datos.repetirActivo);
      if (repActivo) {
        repModo = datos.repetirModo === 'dias' ? 'dias' : 'diario';
        const listaDias = Array.isArray(datos.repetirDias)
          ? datos.repetirDias.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
          : String(datos.repetirDias || '')
              .split(',')
              .filter((x) => x.trim() !== '')
              .map(Number)
              .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

        if (repModo === 'dias' && listaDias.length === 0) {
          throw new ErrorNegocio('Seleccioná al menos un día de la semana para repetir el viaje');
        }
        repDias = repModo === 'diario' ? '0,1,2,3,4,5,6' : [...new Set(listaDias)].sort().join(',');

        const textoHoraRep = String(datos.repetirHora || datos.horaProgramada || '').trim();
        const hmRep = parsearHora(textoHoraRep);
        if (!hmRep && nuevaHoraProg) {
          const dProg = new Date(nuevaHoraProg);
          repHora = `${String(dProg.getHours()).padStart(2, '0')}:${String(dProg.getMinutes()).padStart(2, '0')}`;
        } else if (hmRep) {
          repHora = `${String(hmRep.h).padStart(2, '0')}:${String(hmRep.m).padStart(2, '0')}`;
        } else {
          const dToma = new Date(actual.hora_toma);
          repHora = `${String(dToma.getHours()).padStart(2, '0')}:${String(dToma.getMinutes()).padStart(2, '0')}`;
        }

        const descDias =
          repModo === 'diario'
            ? 'Cada día (todos los días)'
            : repDias
                .split(',')
                .map((d) => DIAS_NOMBRES[Number(d)])
                .join(', ');

        if (
          !actual.repetir_activo ||
          actual.repetir_modo !== repModo ||
          actual.repetir_dias !== repDias ||
          actual.repetir_hora !== repHora
        ) {
          cambios.push(`Repetición activada: ${descDias} a las ${repHora}`);
        }
      } else if (actual.repetir_activo) {
        repDias = '';
        cambios.push('Desactivó la repetición automática del viaje');
      }
    }

    await client.query(
      `UPDATE viajes
       SET telefono = $1,
           direccion_id = $2,
           chofer_id = $3,
           hora_asignacion = $4,
           hora_fin = $4,
           asignado_por = $5,
           hora_avisado = $6,
           avisado_por = $7,
           programado = $8,
           hora_programada = $9,
           fecha_turno = $10,
           tipo_turno = $11,
           numero = $12,
           hora_ejecucion = $13,
           repetir_activo = $14,
           repetir_modo = $15,
           repetir_dias = $16,
           repetir_hora = $17
       WHERE id = $18`,
      [
        nuevoTel,
        nuevaDirId,
        nuevoChoferId,
        nuevaHoraAsig,
        nuevoAsigPor,
        nuevaHoraAvisado,
        nuevoAvisadoPor,
        nuevoProgramado,
        nuevaHoraProg,
        nuevaFechaTurno,
        nuevoTipoTurno,
        nuevoNumero,
        nuevaHoraEjec,
        repActivo,
        repModo,
        repDias,
        repHora,
        viajeId,
      ],
    );

    if (cambios.length > 0) {
      await registrarHistorial(client, viajeId, operadorId, 'Edición en ficha de viaje', cambios.join(' · '));
    }

    return obtenerViaje(viajeId, client);
  });

  if (resultado.repetir_activo) {
    await generarViajesRepetidos(ahora).catch(() => {});
  }
  return obtenerFichaViaje(viajeId);
}

export async function cambiarCancelacion(viajeId, cancelado, operadorId) {
  return transaccion(async (client) => {
    const { rowCount } = await client.query(
      'UPDATE viajes SET cancelado = $1, cancelado_por = $2 WHERE id = $3',
      [!!cancelado, cancelado ? operadorId : null, viajeId],
    );
    if (!rowCount) throw new ErrorNegocio('Viaje inexistente', 404);
    await registrarHistorial(
      client,
      viajeId,
      operadorId,
      cancelado ? 'Viaje anulado' : 'Viaje restaurado',
      cancelado ? 'Se anuló el viaje.' : 'Se restauró el viaje anulado.',
    );
    return obtenerViaje(viajeId, client);
  });
}

/**
 * Puntúa qué tan bien coincide un fragmento escrito por el operador con una calle del catálogo curado.
 * Contempla prefijos, alias, palabras internas y errores de ortografía/tipeo.
 */
function puntuarCalleCatalogo(calleRow, fragNorm, fragFon) {
  const nomNorm = calleRow.nombre_normalizado;
  const nomFon = claveFonetica(calleRow.nombre);
  const listaAlias = String(calleRow.alias || '')
    .split(',')
    .map((a) => normalizarDireccion(a))
    .filter(Boolean);

  if (nomNorm === fragNorm) return 120;
  if (nomNorm.startsWith(fragNorm)) return 100;
  if (listaAlias.some((a) => a === fragNorm)) return 98;
  if (listaAlias.some((a) => a.startsWith(fragNorm))) return 92;

  const palabrasNom = nomNorm.split(' ').filter((p) => p.length > 1);
  if (palabrasNom.some((p) => p.startsWith(fragNorm))) return 88;

  const palabrasAlias = listaAlias.flatMap((a) => a.split(' ')).filter((p) => p.length > 1);
  if (palabrasAlias.some((p) => p.startsWith(fragNorm))) return 82;

  if (nomNorm.includes(fragNorm)) return 75;
  if (listaAlias.some((a) => a.includes(fragNorm))) return 70;

  // Coincidencia fonética (b/v, s/c/z, ll/y, h)
  if (fragFon.length >= 2) {
    if (nomFon.startsWith(fragFon)) return 68;
    if (nomFon.split(' ').some((p) => p.startsWith(fragFon))) return 64;
    if (listaAlias.some((a) => claveFonetica(a).startsWith(fragFon))) return 60;
    if (nomFon.includes(fragFon)) return 55;
  }

  // Tolerancia a errores de tipeo (Levenshtein <= 1 o 2 sobre prefijos o palabras)
  if (fragNorm.length >= 4) {
    for (const p of [...palabrasNom, ...palabrasAlias]) {
      const recorte = p.slice(0, fragNorm.length);
      const dist = distanciaEdicion(fragNorm, recorte);
      if (dist <= 1) return 50;
      if (fragNorm.length >= 6 && dist <= 2) return 42;
    }
  }

  return 0;
}

/**
 * Sugerencias de direcciones mientras se escribe.
 * 1) Primero las direcciones ya existentes en la BD usadas por ese teléfono (por asiduidad) y luego por frecuencia general.
 * 2) A continuación, completa con el catálogo curado de calles de San José de Mayo respetando SIEMPRE
 *    el orden de ingreso: <número> <calle> (ej: al escribir "450 art" o "450 batlle" sugiere "450 Artigas" o "450 Batlle y Ordóñez").
 */
export async function sugerirDirecciones({ q, telefono, limite = 8 }) {
  const texto = normalizarDireccion(q);
  const tel = normalizarTelefono(telefono);
  const patron = `%${texto.replace(/[%_\\]/g, '\\$&')}%`;
  const prefijo = `${texto.replace(/[%_\\]/g, '\\$&')}%`;

  const { rows: historicas } = await query(
    `WITH del_telefono AS (
       SELECT v.direccion_id, count(*) AS usos, max(v.hora_toma) AS ultimo
       FROM viajes v
       WHERE $1 <> '' AND v.telefono = $1 AND NOT v.cancelado
       GROUP BY v.direccion_id
     )
     SELECT d.id, d.texto, d.veces_usada,
            COALESCE(t.usos, 0)::int AS usos_telefono,
            FALSE AS es_catalogo
     FROM direcciones d
     LEFT JOIN del_telefono t ON t.direccion_id = d.id
     WHERE ($2 = '' AND t.direccion_id IS NOT NULL)
        OR ($2 <> '' AND d.texto_normalizado LIKE $3)
     ORDER BY COALESCE(t.usos, 0) DESC, t.ultimo DESC NULLS LAST,
              (d.texto_normalizado LIKE $4) DESC, d.veces_usada DESC, d.ultimo_uso DESC NULLS LAST
     LIMIT $5`,
    [tel, texto, patron, prefijo, limite],
  );

  if (!texto) return historicas;

  const { numero, calle } = desglosarNumeroYCalle(q);
  const fragNorm = normalizarDireccion(calle);
  const fragFon = claveFonetica(calle);

  if (!fragNorm) return historicas;

  const { rows: callesActivas } = await query(
    'SELECT id, nombre, nombre_normalizado, alias FROM calles WHERE activa = TRUE',
  );

  const candidatos = [];
  for (const c of callesActivas) {
    const puntaje = puntuarCalleCatalogo(c, fragNorm, fragFon);
    if (puntaje > 0) {
      const textoSugerido = numero ? `${numero} ${c.nombre}` : c.nombre;
      candidatos.push({
        id: `calle-${c.id}`,
        texto: textoSugerido,
        textoNorm: normalizarDireccion(textoSugerido),
        veces_usada: 0,
        usos_telefono: 0,
        es_catalogo: true,
        calle_nombre: c.nombre,
        puntaje,
      });
    }
  }

  candidatos.sort((a, b) => b.puntaje - a.puntaje || a.calle_nombre.localeCompare(b.calle_nombre, 'es'));

  const vistos = new Set(historicas.map((h) => normalizarDireccion(h.texto)));
  const combinadas = [...historicas];

  for (const cand of candidatos) {
    if (combinadas.length >= limite) break;
    if (vistos.has(cand.textoNorm)) continue;
    vistos.add(cand.textoNorm);
    combinadas.push({
      id: cand.id,
      texto: cand.texto,
      veces_usada: 0,
      usos_telefono: 0,
      es_catalogo: true,
    });
  }

  return combinadas;
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

/**
 * Catálogo curado de calles de San José de Mayo (Administración).
 */
export async function listarCalles({ q = '' } = {}) {
  const filtro = normalizarDireccion(q);
  if (!filtro) {
    const { rows } = await query(
      `SELECT id, nombre, alias, activa, creado_en
       FROM calles
       ORDER BY nombre ASC`,
    );
    return rows;
  }
  const patron = `%${filtro.replace(/[%_\\]/g, '\\$&')}%`;
  const { rows } = await query(
    `SELECT id, nombre, alias, activa, creado_en
     FROM calles
     WHERE nombre_normalizado LIKE $1 OR alias_normalizado LIKE $1
     ORDER BY (nombre_normalizado LIKE $2) DESC, nombre ASC`,
    [patron, `${filtro.replace(/[%_\\]/g, '\\$&')}%`],
  );
  return rows;
}

export async function crearCalle({ nombre, alias = '' }) {
  const limpioNombre = limpiarDireccion(nombre);
  const normNombre = normalizarDireccion(limpioNombre);
  if (!normNombre) throw new ErrorNegocio('El nombre de la calle es obligatorio');
  const limpioAlias = limpiarDireccion(alias);
  const normAlias = normalizarDireccion(limpioAlias);

  try {
    const { rows } = await query(
      `INSERT INTO calles (nombre, nombre_normalizado, alias, alias_normalizado, activa)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, nombre, alias, activa, creado_en`,
      [limpioNombre, normNombre, limpioAlias, normAlias],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new ErrorNegocio(`Ya existe una calle con el nombre "${limpioNombre}"`);
    }
    throw err;
  }
}

export async function actualizarCalle(id, { nombre, alias, activa }) {
  return transaccion(async (client) => {
    const { rows: actuales } = await client.query('SELECT * FROM calles WHERE id = $1 FOR UPDATE', [id]);
    const actual = actuales[0];
    if (!actual) throw new ErrorNegocio('Calle inexistente', 404);

    const nuevoNombre = nombre !== undefined ? limpiarDireccion(nombre) : actual.nombre;
    const normNombre = normalizarDireccion(nuevoNombre);
    if (!normNombre) throw new ErrorNegocio('El nombre de la calle no puede quedar vacío');

    let nuevoAlias = alias !== undefined ? limpiarDireccion(alias) : actual.alias;
    // Si el administrador renombró la calle (ej: "José Batlle y Ordóñez" -> "Batlle y Ordóñez"),
    // conservamos automáticamente el nombre anterior dentro de los alias para que siga reconociéndose.
    if (actual.nombre_normalizado !== normNombre) {
      const listaAlias = String(nuevoAlias || '')
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      const yaEstaEnAlias = listaAlias.some((a) => normalizarDireccion(a) === actual.nombre_normalizado);
      if (!yaEstaEnAlias && actual.nombre) {
        listaAlias.unshift(actual.nombre);
        nuevoAlias = listaAlias.join(', ');
      }
    }

    const normAlias = normalizarDireccion(nuevoAlias);
    const nuevaActiva = activa !== undefined ? Boolean(activa) : actual.activa;

    let actualizada;
    try {
      const { rows } = await client.query(
        `UPDATE calles
         SET nombre = $1,
             nombre_normalizado = $2,
             alias = $3,
             alias_normalizado = $4,
             activa = $5
         WHERE id = $6
         RETURNING id, nombre, alias, activa, creado_en`,
        [nuevoNombre, normNombre, nuevoAlias, normAlias, nuevaActiva, id],
      );
      actualizada = rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new ErrorNegocio(`Ya existe otra calle con el nombre "${nuevoNombre}"`);
      }
      throw err;
    }

    // Si cambió el nombre principal de la calle, actualizamos también las direcciones históricas
    // que usaban el nombre anterior (ej: "450 José Batlle y Ordóñez" -> "450 Batlle y Ordóñez")
    if (actual.nombre_normalizado !== normNombre) {
      const { rows: dirs } = await client.query(
        `SELECT id, texto, veces_usada FROM direcciones WHERE texto_normalizado LIKE $1`,
        [`%${actual.nombre_normalizado.replace(/[%_\\]/g, '\\$&')}%`],
      );
      for (const d of dirs) {
        const { numero, calle } = desglosarNumeroYCalle(d.texto);
        if (normalizarDireccion(calle) === actual.nombre_normalizado) {
          const nuevoTextoDir = numero ? `${numero} ${nuevoNombre}` : nuevoNombre;
          const nuevoNormDir = normalizarDireccion(nuevoTextoDir);
          if (nuevoNormDir === normalizarDireccion(d.texto)) continue;

          const { rows: existente } = await client.query(
            'SELECT id FROM direcciones WHERE texto_normalizado = $1 AND id <> $2',
            [nuevoNormDir, d.id],
          );
          if (existente[0]) {
            await client.query('UPDATE viajes SET direccion_id = $1 WHERE direccion_id = $2', [
              existente[0].id,
              d.id,
            ]);
            await client.query(
              'UPDATE direcciones SET veces_usada = veces_usada + $1 WHERE id = $2',
              [d.veces_usada, existente[0].id],
            );
            await client.query('DELETE FROM direcciones WHERE id = $1', [d.id]);
          } else {
            await client.query(
              'UPDATE direcciones SET texto = $1, texto_normalizado = $2 WHERE id = $3',
              [nuevoTextoDir, nuevoNormDir, d.id],
            );
          }
        }
      }
    }

    return actualizada;
  });
}

export async function eliminarCalle(id) {
  const { rows } = await query('DELETE FROM calles WHERE id = $1 RETURNING id, nombre', [id]);
  if (!rows[0]) throw new ErrorNegocio('Calle inexistente', 404);
  return rows[0];
}

export async function restaurarCatalogoCalles() {
  const agregadas = await sembrarCallesIniciales();
  const total = await listarCalles();
  return { agregadas, total: total.length };
}
