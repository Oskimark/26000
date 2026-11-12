import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';
import { tienePermiso, normalizarPermisos } from '../shared/permisos.js';

const CACHE_OPERADOR_TTL_MS = 5_000;
const cacheOperadores = new Map();

export function invalidarCacheOperador(id) {
  if (id == null) {
    cacheOperadores.clear();
  } else {
    cacheOperadores.delete(Number(id));
  }
}

export async function obtenerOperadorVigente(id) {
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) return null;

  const ahora = Date.now();
  const enCache = cacheOperadores.get(idNum);
  if (enCache && enCache.expira > ahora) {
    return enCache.operador;
  }

  const { rows } = await query(
    'SELECT id, usuario, nombre, rol, activo, permisos FROM operadores WHERE id = $1',
    [idNum],
  );
  const op = rows[0];
  if (!op || !op.activo) {
    cacheOperadores.delete(idNum);
    return null;
  }

  const normalizado = {
    id: op.id,
    usuario: op.usuario,
    nombre: op.nombre,
    rol: op.rol,
    permisos: normalizarPermisos(op.permisos, op.rol),
  };
  cacheOperadores.set(idNum, { operador: normalizado, expira: ahora + CACHE_OPERADOR_TTL_MS });
  return normalizado;
}

export function firmarToken(operador) {
  return jwt.sign(
    {
      id: operador.id,
      usuario: operador.usuario,
      nombre: operador.nombre,
      rol: operador.rol,
      permisos: normalizarPermisos(operador.permisos, operador.rol),
    },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: config.jwtExpira },
  );
}

export function verificarToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Token vacío o inválido');
  }
  const op = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  op.permisos = normalizarPermisos(op.permisos, op.rol);
  return op;
}

export async function requiereAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = verificarToken(token);
    const vigente = await obtenerOperadorVigente(payload.id);
    if (!vigente) {
      return res.status(401).json({ error: 'Operador inactivo o sesión revocada' });
    }
    req.operador = vigente;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión vencida, volvé a ingresar' });
  }
}

export function requiereAdmin(req, res, next) {
  if (req.operador?.rol === 'admin' || tienePermiso(req.operador, 'admin')) return next();
  return res.status(403).json({ error: 'Solo administradores' });
}

export function requiereSuperAdmin(req, res, next) {
  if (req.operador?.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  next();
}

export function requierePermiso(permisoId) {
  return (req, res, next) => {
    if (tienePermiso(req.operador, permisoId)) return next();
    return res.status(403).json({ error: `No tenés permiso para esta acción (${permisoId})` });
  };
}
