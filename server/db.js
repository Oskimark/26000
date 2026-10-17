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

  // Normalizar nombres cortos habituales si aún figuraban con el nombre largo inicial
  const reemplazosCortos = [
    {
      viejoNorm: 'camino del carreton',
      nombre: 'Camino Carretón',
      nombreNorm: 'camino carreton',
      alias: 'Camino del Carretón, Carretón, Carreton, Camaino Carreton',
    },
    {
      viejoNorm: 'hospital san jose',
      nombre: 'Hospital',
      nombreNorm: 'hospital',
      alias: 'Hospital San José, ASSE San José, Hospital Departamental',
    },
    {
      viejoNorm: 'sanatorio amsj',
      nombre: 'AMSJ',
      nombreNorm: 'amsj',
      alias: 'Sanatorio AMSJ, Asociación Médica, Mutualista, Sanatorio, AMJS',
    },
    {
      viejoNorm: 'terminal de omnibus',
      nombre: 'Terminal',
      nombreNorm: 'terminal',
      alias: 'Terminal de Ómnibus, Terminal San José',
    },
    {
      viejoNorm: 'plaza de los treinta y tres',
      nombre: 'Plaza 33',
      nombreNorm: 'plaza 33',
      alias: 'Plaza de los Treinta y Tres, Plaza Treinta y Tres, Plaza Principal',
    },
  ];

  for (const r of reemplazosCortos) {
    await clientOrPool.query(
      `UPDATE calles
       SET nombre = $1, nombre_normalizado = $2, alias = $3, alias_normalizado = $4
       WHERE nombre_normalizado = $5
         AND NOT EXISTS (SELECT 1 FROM calles WHERE nombre_normalizado = $2)`,
      [r.nombre, r.nombreNorm, r.alias, normTexto(r.alias), r.viejoNorm],
    );
  }

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

  // Sembrar o actualizar sitios frecuentes del catálogo de San José de Mayo.
  const n = await sembrarCallesIniciales(pool);
  if (n > 0) {
    console.log(`Catálogo de calles de San José de Mayo actualizado (+${n} entradas).`);
  }
}

