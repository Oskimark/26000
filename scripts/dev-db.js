// Levanta un PostgreSQL local SOLO para desarrollo (no se usa en Railway).
// Usa los binarios que trae el paquete embedded-postgres, lanzados con pg_ctl
// (pg_ctl permite arrancar aunque la terminal tenga permisos de administrador).
//
// Uso: npm run db:dev   (dejarlo corriendo en una terminal aparte; Ctrl+C lo detiene)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const PUERTO = 5433;
const BASE = 'taxis';
const dataDir = path.resolve('.pgdata');

const plataforma = { win32: 'windows', darwin: 'darwin', linux: 'linux' }[process.platform];
const { initdb, pg_ctl } = await import(`@embedded-postgres/${plataforma}-${process.arch}`);

const run = (bin, args) => execFileSync(bin, args, { stdio: 'inherit' });

if (!fs.existsSync(dataDir)) {
  run(initdb, ['-D', dataDir, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--locale=C']);
}

run(pg_ctl, ['-D', dataDir, '-o', `-p ${PUERTO}`, '-l', path.join(dataDir, 'server.log'), '-w', 'start']);

const cliente = new pg.Client({ host: 'localhost', port: PUERTO, user: 'postgres', database: 'postgres' });
await cliente.connect();
const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [BASE]);
if (!rowCount) await cliente.query(`CREATE DATABASE ${BASE}`);
await cliente.end();

console.log(`\nPostgreSQL de desarrollo listo: postgres://postgres:postgres@localhost:${PUERTO}/${BASE}`);
console.log('Ctrl+C para detenerlo.');

const detener = () => {
  try { run(pg_ctl, ['-D', dataDir, '-m', 'fast', 'stop']); } finally { process.exit(0); }
};
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
setInterval(() => {}, 1 << 30);
