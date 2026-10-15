// Configuración leída de variables de entorno. Debe importarse primero.
process.env.TZ = process.env.TZ || 'America/Argentina/Buenos_Aires';

const enProduccion = process.env.NODE_ENV === 'production';

if (enProduccion && !process.env.JWT_SECRET) {
  console.warn('⚠️ [SEGURIDAD] Falta la variable de entorno JWT_SECRET. Usando clave por defecto. Recordá configurar JWT_SECRET en las variables de entorno del hosting.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable de entorno DATABASE_URL (ver .env.example)');
}

export const config = {
  enProduccion,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
  jwtExpira: process.env.JWT_EXPIRA || '14h',
  adminUsuario: process.env.ADMIN_USUARIO || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  // Intervalo con que se revisan los viajes programados cuya hora llegó
  intervaloProgramadosMs: Number(process.env.INTERVALO_PROGRAMADOS_MS) || 10_000,
};
