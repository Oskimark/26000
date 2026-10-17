import express from 'express';
import bcrypt from 'bcryptjs';
import { query, transaccion } from './db.js';
import { firmarToken, requiereAuth, requiereAdmin } from './auth.js';
import {
  ErrorNegocio, crearViaje, listarTurno, listarProgramadosFuturos, asignarChofer,
  registrarFin, registrarAvisado, cambiarCancelacion, sugerirDirecciones, obtenerViaje,
  buscarViajesClientes, obtenerConfiguracion, actualizarConfiguracion, ejecutarProgramadosVencidos,
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
    const operador = { id: op.id, usuario: op.usuario, nombre: op.nombre, rol: op.rol };
    res.json({ token: firmarToken(operador), operador });
  }));

  api.use(requiereAuth);

  api.get('/yo', (req, res) => res.json(req.operador));

  // ---------- Configuración ----------
  api.get('/configuracion', a(async (req, res) => {
    res.json(await obtenerConfiguracion());
  }));

  api.put('/configuracion', requiereAdmin, a(async (req, res) => {
    const cfg = await actualizarConfiguracion(req.body || {});
    await ejecutarProgramadosVencidos();
    notificar('configuracion', cfg);
    notificar('viajes');
    res.json(cfg);
  }));

  // ---------- Turnos ----------
  api.get('/turnos/actual', (req, res) => {
    const actual = turnoDe(new Date());
    res.json({
      ahora: new Date().toISOString(),
      actual: describirTurno(actual),
      siguiente: describirTurno(turnoSiguiente(actual)),
      anterior: describirTurno(turnoAnterior(actual)),
    });
  });

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

  api.put('/turnos/:fecha/:tipo/choferes', a(async (req, res) => {
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
    const [viajes, futuros, cfg] = await Promise.all([
      listarTurno(t),
      listarProgramadosFuturos(t),
      obtenerConfiguracion(),
    ]);
    res.json({ turno: describirTurno(t), viajes, futuros, configuracion: cfg });
  }));

  // ---------- Viajes ----------
  api.post('/viajes', a(async (req, res) => {
    const viaje = await crearViaje(req.body || {}, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.status(201).json(viaje);
  }));

  api.get('/viajes/:id', a(async (req, res) => res.json(await obtenerViaje(Number(req.params.id)))));

  api.put('/viajes/:id/chofer', a(async (req, res) => {
    const viaje = await asignarChofer(Number(req.params.id), req.body?.choferId, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/fin', a(async (req, res) => {
    const viaje = await registrarFin(Number(req.params.id), req.body || {});
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/avisado', a(async (req, res) => {
    const viaje = await registrarAvisado(Number(req.params.id), req.body || {}, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.put('/viajes/:id/cancelado', a(async (req, res) => {
    const viaje = await cambiarCancelacion(Number(req.params.id), req.body?.cancelado, req.operador.id);
    notificar('viajes', { id: viaje.id });
    res.json(viaje);
  }));

  api.get('/direcciones', a(async (req, res) => {
    res.json(await sugerirDirecciones({ q: req.query.q, telefono: req.query.telefono }));
  }));

  // ---------- Clientes y Estadísticas ----------
  api.get('/clientes', a(async (req, res) => {
    res.json(await buscarViajesClientes(req.query));
  }));

  // ---------- Choferes ----------
  api.get('/choferes', a(async (req, res) => {
    const { rows } = await query('SELECT id, nombre, activo FROM choferes ORDER BY activo DESC, nombre');
    res.json(rows);
  }));

  api.post('/choferes', requiereAdmin, a(async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) throw new ErrorNegocio('Falta el nombre');
    const { rows } = await query('INSERT INTO choferes (nombre) VALUES ($1) RETURNING id, nombre, activo', [nombre]);
    notificar('choferes');
    res.status(201).json(rows[0]);
  }));

  api.put('/choferes/:id', requiereAdmin, a(async (req, res) => {
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

  api.delete('/choferes/:id', requiereAdmin, a(async (req, res) => {
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
  api.get('/operadores', requiereAdmin, a(async (req, res) => {
    const { rows } = await query('SELECT id, usuario, nombre, rol, activo FROM operadores ORDER BY activo DESC, nombre');
    res.json(rows);
  }));

  api.post('/operadores', requiereAdmin, a(async (req, res) => {
    const { usuario, nombre, password, rol } = req.body || {};
    if (!usuario?.trim() || !nombre?.trim() || !password) throw new ErrorNegocio('Completá usuario, nombre y contraseña');
    const hash = await bcrypt.hash(String(password), 10);
    try {
      const { rows } = await query(
        `INSERT INTO operadores (usuario, nombre, password_hash, rol) VALUES ($1, $2, $3, $4)
         RETURNING id, usuario, nombre, rol, activo`,
        [usuario.trim(), nombre.trim(), hash, rol === 'admin' ? 'admin' : 'operador'],
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') throw new ErrorNegocio('Ese usuario ya existe');
      throw err;
    }
  }));

  api.put('/operadores/:id', requiereAdmin, a(async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, password, rol, activo } = req.body || {};
    if (!nombre?.trim()) throw new ErrorNegocio('Falta el nombre');
    if (id === req.operador.id && (activo === false || rol !== 'admin')) {
      throw new ErrorNegocio('No podés quitarte el rol de administrador ni desactivarte');
    }
    const hash = password ? await bcrypt.hash(String(password), 10) : null;
    const { rows } = await query(
      `UPDATE operadores SET nombre = $1, rol = $2, activo = $3, password_hash = COALESCE($4, password_hash)
       WHERE id = $5 RETURNING id, usuario, nombre, rol, activo`,
      [nombre.trim(), rol === 'admin' ? 'admin' : 'operador', activo !== false, hash, id],
    );
    if (!rows[0]) throw new ErrorNegocio('Operador inexistente', 404);
    res.json(rows[0]);
  }));

  // ---------- Errores ----------
  api.use((err, req, res, _next) => {
    if (err instanceof ErrorNegocio) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return api;
}
