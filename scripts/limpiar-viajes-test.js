/**
 * Script para eliminar viajes de prueba por número de teléfono
 * Uso:
 *   node scripts/limpiar-viajes-test.js 098155082
 *   node scripts/limpiar-viajes-test.js 098155082 --solo-listar
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  try {
    process.loadEnvFile?.('.env');
  } catch {
    // Si no está disponible loadEnvFile, parsear manualmente
    const contenido = fs.readFileSync('.env', 'utf-8');
    for (const linea of contenido.split('\n')) {
      const match = linea.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

const args = process.argv.slice(2);
const soloListar = args.includes('--solo-listar');
const telefonoArg = args.find((a) => !a.startsWith('--')) || '098155082';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Falta la variable de entorno DATABASE_URL en .env o en el entorno.');
  process.exit(1);
}

const telLimpio = telefonoArg.replace(/\D/g, '');
const patron1 = `%${telLimpio}%`;
const patron2 = telLimpio.startsWith('0') ? `%${telLimpio.slice(1)}%` : `%${telLimpio}%`;

const esLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
const usaRedPrivada = /\.railway\.internal/.test(databaseUrl);
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: esLocal || usaRedPrivada ? false : { rejectUnauthorized: false },
});

async function main() {
  console.log(`\n🔍 Buscando viajes de prueba asociados al teléfono: "${telefonoArg}"...`);
  
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error(`❌ No se pudo conectar a la base de datos (${databaseUrl}):\n   ${err.message}`);
    console.error('💡 Si estás en entorno local, asegurate de tener la base levantada con: npm run db:dev');
    process.exit(1);
  }

  try {
    const { rows: viajes } = await client.query(
      `SELECT v.id, v.numero, v.fecha_turno, v.tipo_turno, v.telefono, v.nombre_cliente, d.texto AS direccion, v.hora_toma
       FROM viajes v
       JOIN direcciones d ON d.id = v.direccion_id
       WHERE v.telefono LIKE $1 OR v.telefono LIKE $2
       ORDER BY v.id DESC`,
      [patron1, patron2],
    );

    if (viajes.length === 0) {
      console.log('ℹ️ No se encontraron viajes registrados con ese teléfono.');
      return;
    }

    console.log(`\n📋 Se encontraron ${viajes.length} viaje(s):`);
    console.table(
      viajes.map((v) => ({
        ID: v.id,
        Turno: `${v.fecha_turno} (${v.tipo_turno})`,
        'N°': v.numero ?? 'Prog.',
        Teléfono: v.telefono,
        Cliente: v.nombre_cliente || '-',
        Dirección: v.direccion,
        Fecha: v.hora_toma,
      })),
    );

    if (soloListar) {
      console.log('\nℹ️ Modo solo listar. Para eliminarlos ejecutá sin la bandera --solo-listar.');
      return;
    }

    const ids = viajes.map((v) => v.id);
    const res = await client.query(
      `DELETE FROM viajes WHERE id = ANY($1::int[])`,
      [ids],
    );
    console.log(`\n✅ Se eliminaron con éxito ${res.rowCount} viaje(s) de prueba.`);
    console.log('ℹ️ El historial de auditoría de cada viaje se eliminó automáticamente (CASCADE).');
    console.log('ℹ️ Las estadísticas, clientes únicos y rankings del panel ya no reflejarán estos viajes.\n');
  } catch (err) {
    console.error('❌ Error al interactuar con la base de datos:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
