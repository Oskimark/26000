import express from 'express';
import bcrypt from 'bcryptjs';
import { query, transaccion } from './db.js';
import { firmarToken, requiereAuth, requiereAdmin, requiereSuperAdmin, requierePermiso } from './auth.js';
import { normalizarPermisos, tienePermiso } from '../shared/permisos.js';
import {
  ErrorNegocio, crearViaje, listarTurno, listarProgramadosFuturos, asignarChofer,
  registrarFin, registrarAvisado, cambiarCancelacion, sugerirDirecciones, obtenerViaje,
  obtenerFichaViaje, editarFichaViaje, obtenerNombrePorTelefono,
  buscarViajesClientes, obtenerConfiguracion, actualizarConfiguracion, ejecutarProgramadosVencidos,
  listarCalles, crearCalle, actualizarCalle, eliminarCalle, restaurarCatalogoCalles,
  obtenerTurnoActual, obtenerInfoCambioTurno, avanzarTurnoManual, obtenerEstadisticas,
} from './viajes.js';
import { turnoDe, turnoSiguiente, turnoAnterior, describirTurno, validarTurno } from '../shared/turnos.js';

const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function crearApi({ notificar }) {
  const api = express.Router();
  api.use(express.json());

  // ---------- Sesión ----------
  api.post('/login', a(async (req, res) => {
    const { usuario, password } = req.body || {};
    const { rows } = await query('SELECT * FROM operadores WHERE usuario = $1 AND activo', [String(usuario || '').trim()]);
    const op = rows[0];
    if (!op || !(await bcrypt.compare(String(password || ''), op.password_hash))) {
      throw new ErrorNegocio('Usuario o contraseña incorrectos', 401);
    }
    const operador = {
      id: op.id,
      usuario: op.usuario,
      nombre: op.nombre,
      rol: op.rol,
      permisos: normalizarPermisos(op.permisos, op.rol),
    };
    res.json({ token: firmarToken(operador), operador });
  }));

  api.use(requiereAuth);

  api.get('/yo', a(async (req, res) => {
    const { rows } = await query('SELECT id, usuario, nombre, rol, activo, permisos FROM operadores WHERE id = $1', [req.operador.id]);
    const op = rows[0];
    if (!op || !op.activo) throw new ErrorNegocio('Operador inactivo o no encontrado', 401);
    res.json({
      id: op.id,
      usuario: op.usuario,
      nombre: op.nombre,
      rol: op.rol,
      permisos: normalizarPermisos(op.permisos, op.rol),
    });
  }));

  // ---------- Configuración ----------
  api.get('/configuracion', a(async (req, res) => {
    res.json(await obtenerConfiguracion());
  }));

  api.put('/configuracion', requierePermiso('admin_configuracion'), a(async (req, res) => {
    const cfg = await actualizarConfiguracion(req.body || {});
    await ejecutarProgramadosVencidos();
    notificar('configuracion', cfg);
    notificar('viajes');
    res.json(cfg);
  }));

  // ---------- Turnos ----------
  api.get('/turnos/actual', a(async (req, res) => {
    const actual = await obtenerTurnoActual();
    res.json({
      ahora: new Date().toISOString(),
      actual: describirTurno(actual),
      siguiente: describirTurno(turnoSiguiente(actual)),
      anterior: describirTurno(turnoAnterior(actual)),
    });
  }));

  api.get('/turnos/cambio-info', a(async (req, res) => {
    res.json(await obtenerInfoCambioTurno());
  }));

  api.post('/turnos/cambiar', a(async (req, res) => {
    const { actual, nuevo } = await avanzarTurnoManual(req.operador.id);
    notificar('turno', describirTurno(nuevo));
    res.json({ ok: true, nuevo: describirTurno(nuevo), anterior: describirTurno(actual) });
  }));

  const turnoDeParams = (req) => {
    const { fecha, tipo } = req.params;
    if (!validarTurno(fecha, tipo)) throw new ErrorNegocio('Turno inválido');
    return { fecha, tipo };
  };

  api.get('/turnos/:fecha/:tipo/choferes', a(async (req, res) => {
    const t = turnoDeParams(req);
    const { rows } = await query(
      `SELECT c.id, c.nombre FROM turno_choferes tc JOIN choferes c ON c.id = tc.chofer_id
       WHERE tc.fecha_turno = $1 AND tc.tipo_turno = $2 AND c.activo ORDER BY c.nombre`,
      [t.fecha, t.tipo],
    );
    res.json(rows);
  }));

  api.put('/turnos/:fecha/:tipo/choferes', requierePermiso('choferes_asignar'), a(async (req, res) => {
    const t = turnoDeParams(req);
    const ids = [...new Set((req.body?.choferIds || []).map(Number).filter(Boolean))];
    await query('DELETE FROM turno_choferes WHERE fecha_turno = $1 AND tipo_turno = $2', [t.fecha, t.tipo]);
    if (ids.length) {
      await query(
        `INSERT INTO turno_choferes (fecha_turno, tipo_turno, chofer_id)
         SELECT $1, $2, id FROM choferes WHERE id = ANY($3::int[]) AND activo`,
        [t.fecha, t.tipo, ids],
      );
    }
    notificar('choferes', t);
    res.json({ ok: true });
  }));

  api.get('/turnos/:fecha/:tipo/viajes', a(async (req, res) => {
    const t = turnoDeParams(req);
    const actual = await obtenerTurnoActual();
    const esTurnoActual = t.fecha === actual.fecha && t.tipo === actual.tipo;
    if (esTurnoActual) {
      if (!tienePermiso(req.operador, 'recepcion') && !tienePermiso(req.operador, 'historial')) {
        throw new ErrorNegocio('Sin permisos para ver el turno', 403);
      }
    } else {
      if (!tienePermiso(req.operador, 'historial')) {
        throw new ErrorNegocio('Sin permiso para ver historial de turnos', 403);
      }
    }
    const tAnterior = turnoAnterior(t);
    const [viajes, futuros, anteriores, cfg] = await Promise.all([
      listarTurno(t),
      listarProgramadosFuturos(t),
      listarTurno(tAnterior),
      obtenerConfiguracion(),
    ]);
    res.json({
      turno: describirTurno(t),
      viajes,
      futuros,
      anteriores,
      configuracion: cfg,
    });
  }));

  // ---------- Viajes ----------
  api.post('/viajes', requierePermiso('recepcion_toma'), a(async (req, res) => {
    const viaje = await crearViaje(req.body || {}, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.status(201).json(viaje);
  }));

  api.get('/viajes/:id', a(async (req, res) => res.json(await obtenerViaje(Number(req.params.id)))));

  api.get('/viajes/:id/ficha', a(async (req, res) => {
    res.json(await obtenerFichaViaje(Number(req.params.id)));
  }));

  api.put('/viajes/:id', requierePermiso('recepcion_ficha'), a(async (req, res) => {
    const resultado = await editarFichaViaje(Number(req.params.id), req.body || {}, req.operador.id);
    notificar('viajes', { id: Number(req.params.id) });
    res.json(resultado);
  }));

  api.put('/viajes/:id/chofer', requierePermiso('recepcion_chofer'), a(async (req, res) => {
    const viaje = await asignarChofer(Number(req.params.id), req.body?.choferId, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/fin', a(async (req, res) => {
    const viaje = await registrarFin(Number(req.params.id), req.body || {});
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/avisado', requierePermiso('recepcion_avisar'), a(async (req, res) => {
    const viaje = await registrarAvisado(Number(req.params.id), req.body || {}, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/cancelado', requierePermiso('recepcion_cancelar'), a(async (req, res) => {
    const viaje = await cambiarCancelacion(Number(req.params.id), req.body?.cancelado, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.get('/direcciones', a(async (req, res) => {
    res.json(await sugerirDirecciones({ q: req.query.q, telefono: req.query.telefono }));
  }));

  // ---------- Clientes y Estadísticas ----------
  api.get('/clientes/nombre', a(async (req, res) => {
    const nombre = await obtenerNombrePorTelefono(req.query.telefono);
    res.json({ nombre });
  }));

  api.get('/clientes', requierePermiso('clientes'), a(async (req, res) => {
    res.json(await buscarViajesClientes(req.query));
  }));

  // ---------- Choferes ----------
  api.get('/choferes', a(async (req, res) => {
    const { rows } = await query('SELECT id, nombre, activo FROM choferes ORDER BY activo DESC, nombre');
    res.json(rows);
  }));

  api.post('/choferes', requierePermiso('admin_choferes'), a(async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) throw new ErrorNegocio('Falta el nombre');
    const { rows } = await query('INSERT INTO choferes (nombre) VALUES ($1) RETURNING id, nombre, activo', [nombre]);
    notificar('choferes');
    res.status(201).json(rows[0]);
  }));

  api.put('/choferes/:id', requierePermiso('admin_choferes'), a(async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) throw new ErrorNegocio('Falta el nombre');
    const { rows } = await query(
      'UPDATE choferes SET nombre = $1, activo = $2 WHERE id = $3 RETURNING id, nombre, activo',
      [nombre, req.body?.activo !== false, Number(req.params.id)],
    );
    if (!rows[0]) throw new ErrorNegocio('Chofer inexistente', 404);
    notificar('choferes');
    res.json(rows[0]);
  }));

  api.delete('/choferes/:id', requierePermiso('admin_choferes'), a(async (req, res) => {
    const id = Number(req.params.id);
    if (!id) throw new ErrorNegocio('ID de chofer inválido');
    const eliminado = await transaccion(async (client) => {
      await client.query('DELETE FROM turno_choferes WHERE chofer_id = $1', [id]);
      await client.query('UPDATE viajes SET chofer_id = NULL WHERE chofer_id = $1', [id]);
      const { rows } = await client.query('DELETE FROM choferes WHERE id = $1 RETURNING id, nombre', [id]);
      if (!rows[0]) throw new ErrorNegocio('Chofer inexistente', 404);
      return rows[0];
    });
    notificar('choferes');
    notificar('viajes');
    res.json(eliminado);
  }));

  // ---------- Operadores ----------
  api.get('/operadores', requiereSuperAdmin, a(async (req, res) => {
    const { rows } = await query('SELECT id, usuario, nombre, rol, activo, permisos FROM operadores ORDER BY activo DESC, nombre');
    res.json(rows.map((r) => ({ ...r, permisos: normalizarPermisos(r.permisos, r.rol) })));
  }));

  api.post('/operadores', requiereSuperAdmin, a(async (req, res) => {
    const { usuario, nombre, password, rol, permisos } = req.body || {};
    if (!usuario?.trim() || !nombre?.trim() || !password) throw new ErrorNegocio('Completá usuario, nombre y contraseña');
    const rolEfectivo = rol === 'admin' ? 'admin' : 'operador';
    const perms = JSON.stringify(normalizarPermisos(permisos, rolEfectivo));
    const hash = await bcrypt.hash(String(password), 10);
    try {
      const { rows } = await query(
        `INSERT INTO operadores (usuario, nombre, password_hash, rol, permisos) VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING id, usuario, nombre, rol, activo, permisos`,
        [usuario.trim(), nombre.trim(), hash, rolEfectivo, perms],
      );
      const creado = rows[0];
      res.status(201).json({ ...creado, permisos: normalizarPermisos(creado.permisos, creado.rol) });
    } catch (err) {
      if (err.code === '23505') throw new ErrorNegocio('Ese usuario ya existe');
      throw err;
    }
  }));

  api.put('/operadores/:id', requiereSuperAdmin, a(async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, password, rol, activo, permisos } = req.body || {};
    if (!nombre?.trim()) throw new ErrorNegocio('Falta el nombre');
    if (id === req.operador.id && (activo === false || rol !== 'admin')) {
      throw new ErrorNegocio('No podés quitarte el rol de administrador ni desactivarte');
    }
    const rolEfectivo = rol === 'admin' ? 'admin' : 'operador';
    const perms = permisos !== undefined ? JSON.stringify(normalizarPermisos(permisos, rolEfectivo)) : null;
    const hash = password ? await bcrypt.hash(String(password), 10) : null;
    const { rows } = await query(
      `UPDATE operadores SET nombre = $1, rol = $2, activo = $3, password_hash = COALESCE($4, password_hash), permisos = COALESCE($5::jsonb, permisos)
       WHERE id = $6 RETURNING id, usuario, nombre, rol, activo, permisos`,
      [nombre.trim(), rolEfectivo, activo !== false, hash, perms, id],
    );
    if (!rows[0]) throw new ErrorNegocio('Operador inexistente', 404);
    const modificado = rows[0];
    res.json({ ...modificado, permisos: normalizarPermisos(modificado.permisos, modificado.rol) });
  }));

  // ---------- Catálogo de Calles (San José de Mayo) ----------
  api.get('/calles', a(async (req, res) => {
    res.json(await listarCalles({ q: req.query.q }));
  }));

  api.post('/calles', requierePermiso('admin_calles'), a(async (req, res) => {
    const calle = await crearCalle(req.body || {});
    res.status(201).json(calle);
  }));

  api.post('/calles/restaurar', requierePermiso('admin_calles'), a(async (req, res) => {
    res.json(await restaurarCatalogoCalles());
  }));

  api.put('/calles/:id', requierePermiso('admin_calles'), a(async (req, res) => {
    const calle = await actualizarCalle(Number(req.params.id), req.body || {});
    notificar('viajes');
    res.json(calle);
  }));

  api.delete('/calles/:id', requierePermiso('admin_calles'), a(async (req, res) => {
    const eliminada = await eliminarCalle(Number(req.params.id));
    res.json(eliminada);
  }));

  // ---------- Estadísticas y Analítica ----------
  api.get('/admin/estadisticas', requierePermiso('admin_estadisticas'), a(async (req, res) => {
    res.json(await obtenerEstadisticas(req.query));
  }));

  // ---------- Errores ----------
  api.use((err, req, res, _next) => {
    if (err instanceof ErrorNegocio) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return api;
}
