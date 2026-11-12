import { config } from './config.js';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { migrar } from './db.js';
import { verificarToken, obtenerOperadorVigente } from './auth.js';
import { crearApi } from './api.js';
import { ejecutarProgramadosVencidos } from './viajes.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cabeceras de endurecimiento HTTP (Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self' ws: wss:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  if (config.enProduccion) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e5, // 100 KB máximo por mensaje WebSocket
});

// Solo usuarios logueados y activos en base de datos reciben eventos en tiempo real.
io.use(async (socket, next) => {
  try {
    const payload = verificarToken(socket.handshake.auth?.token);
    const vigente = await obtenerOperadorVigente(payload.id);
    if (!vigente) {
      return next(new Error('No autenticado'));
    }
    socket.data.operador = vigente;
    next();
  } catch {
    next(new Error('No autenticado'));
  }
});

const notificar = (evento, datos = {}) => io.emit(evento, datos);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', crearApi({ notificar }));

// Frontend compilado (client/dist)
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
app.use(express.static(dist));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    const indexPath = path.join(dist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Tareas periódicas: ejecutar viajes programados vencidos
async function tick() {
  try {
    const ejecutados = await ejecutarProgramadosVencidos();
    if (ejecutados.length) notificar('viajes', { ejecutados });
  } catch (err) {
    console.error('Error en tarea periódica:', err.message);
  }
}

await migrar();
await tick();
setInterval(tick, config.intervaloProgramadosMs);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${config.port} (TZ=${process.env.TZ})`);
});
