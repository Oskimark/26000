import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { tienePermiso, normalizarPermisos } from '../shared/permisos.js';

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
    { expiresIn: config.jwtExpira },
  );
}

export function verificarToken(token) {
  const op = jwt.verify(token, config.jwtSecret);
  op.permisos = normalizarPermisos(op.permisos, op.rol);
  return op;
}

export function requiereAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.operador = verificarToken(token);
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
