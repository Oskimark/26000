import { config } from './config.js';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { migrar } from './db.js';
import { verificarToken } from './auth.js';
import { crearApi } from './api.js';
import { ejecutarProgramadosVencidos } from './viajes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Solo usuarios logueados reciben eventos en tiempo real.
io.use((socket, next) => {
  try {
    socket.data.operador = verificarToken(socket.handshake.auth?.token);
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
