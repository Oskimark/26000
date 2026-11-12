// Configuración leída de variables de entorno. Debe importarse primero.
import crypto from 'node:crypto';

process.env.TZ = process.env.TZ || 'America/Argentina/Buenos_Aires';

const enProduccion = process.env.NODE_ENV === 'production';

if (enProduccion && !process.env.JWT_SECRET) {
  console.warn(
    '⚠️ [SEGURIDAD] Falta la variable de entorno JWT_SECRET en producción. Se generó una clave aleatoria segura para esta instancia; configurá JWT_SECRET en el entorno para mantener las sesiones tras reinicios.'
  );
}
if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable de entorno DATABASE_URL (ver .env.example)');
}

const jwtSecretEfectivo =
  process.env.JWT_SECRET ||
  (enProduccion ? crypto.randomBytes(32).toString('hex') : 'dev-secret-no-usar-en-produccion');

export const config = {
  enProduccion,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: jwtSecretEfectivo,
  jwtExpira: process.env.JWT_EXPIRA || '14h',
  adminUsuario: process.env.ADMIN_USUARIO || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  // Intervalo con que se revisan los viajes programados cuya hora llegó
  intervaloProgramadosMs: Number(process.env.INTERVALO_PROGRAMADOS_MS) || 10_000,
};
