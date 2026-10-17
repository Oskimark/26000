import fs from 'node:fs/promises';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

// DATE (oid 1082) como string 'YYYY-MM-DD' para evitar corrimientos de zona horaria.
pg.types.setTypeParser(1082, (v) => v);

const esLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl);
const usaRedPrivada = /\.railway\.internal/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: esLocal || usaRedPrivada ? false : { rejectUnauthorized: false },
  max: 10,
});

export const query = (text, params) => pool.query(text, params);

/** Ejecuta fn dentro de una transacción. */
export async function transaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

import { CALLES_SAN_JOSE_INICIALES } from './calles_sanjose.js';

function normTexto(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sembrarCallesIniciales(clientOrPool = pool) {
  let insertadas = 0;
  for (const item of CALLES_SAN_JOSE_INICIALES) {
    const nombre = String(item.nombre || '').trim();
    if (!nombre) continue;
    const nombreNorm = normTexto(nombre);
    const alias = String(item.alias || '').trim();
    const aliasNorm = normTexto(alias);
    const { rowCount } = await clientOrPool.query(
      `INSERT INTO calles (nombre, nombre_normalizado, alias, alias_normalizado, activa)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (nombre_normalizado) DO NOTHING`,
      [nombre, nombreNorm, alias, aliasNorm],
    );
    insertadas += rowCount || 0;
  }
  return insertadas;
}

export async function migrar() {
  const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);

  // Si no hay operadores, crea el administrador inicial.
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM operadores');
  if (rows[0].n === 0) {
    const hash = await bcrypt.hash(config.adminUsuario === 'admin' ? config.adminPassword : config.adminPassword, 10);
    await pool.query(
      `INSERT INTO operadores (usuario, nombre, password_hash, rol) VALUES ($1, 'Administrador', $2, 'admin')`,
      [config.adminUsuario, hash],
    );
    console.log(`Usuario administrador inicial creado: "${config.adminUsuario}"`);
  }

  // Si la tabla de calles curadas está vacía, precarga el nomenclátor de San José de Mayo.
  const { rows: rCalles } = await pool.query('SELECT count(*)::int AS n FROM calles');
  if (rCalles[0].n === 0) {
    const n = await sembrarCallesIniciales(pool);
    console.log(`Catálogo de calles de San José de Mayo inicializado (${n} entradas).`);
  }
}

