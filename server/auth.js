import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function firmarToken(operador) {
  return jwt.sign(
    { id: operador.id, usuario: operador.usuario, nombre: operador.nombre, rol: operador.rol },
    config.jwtSecret,
    { expiresIn: config.jwtExpira },
  );
}

export function verificarToken(token) {
  return jwt.verify(token, config.jwtSecret);
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
  if (req.operador?.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  next();
}
