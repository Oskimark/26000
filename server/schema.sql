-- Esquema de la base de datos. Idempotente: se ejecuta en cada arranque.

CREATE TABLE IF NOT EXISTS operadores (
  id            SERIAL PRIMARY KEY,
  usuario       TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('operador', 'admin')),
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS choferes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  activo    BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Choferes que trabajan en cada turno. Un turno se identifica por
-- fecha de inicio + tipo ('A' = 03 a 15, 'B' = 15 a 03 del día siguiente).
CREATE TABLE IF NOT EXISTS turno_choferes (
  fecha_turno DATE NOT NULL,
  tipo_turno  CHAR(1) NOT NULL CHECK (tipo_turno IN ('A', 'B')),
  chofer_id   INTEGER NOT NULL REFERENCES choferes(id),
  PRIMARY KEY (fecha_turno, tipo_turno, chofer_id)
);

CREATE TABLE IF NOT EXISTS direcciones (
  id                SERIAL PRIMARY KEY,
  texto             TEXT NOT NULL,
  texto_normalizado TEXT NOT NULL UNIQUE,
  veces_usada       INTEGER NOT NULL DEFAULT 0,
  ultimo_uso        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_direcciones_frecuencia ON direcciones (veces_usada DESC);

CREATE TABLE IF NOT EXISTS viajes (
  id              SERIAL PRIMARY KEY,
  telefono        TEXT NOT NULL DEFAULT '',
  nombre_cliente  TEXT NOT NULL DEFAULT '',
  direccion_id    INTEGER NOT NULL REFERENCES direcciones(id),
  chofer_id       INTEGER REFERENCES choferes(id),
  operador_id     INTEGER REFERENCES operadores(id),      -- quién tomó el llamado
  hora_toma       TIMESTAMPTZ NOT NULL DEFAULT now(),     -- cuándo se tomó el llamado
  programado      BOOLEAN NOT NULL DEFAULT FALSE,
  hora_programada TIMESTAMPTZ,
  -- Turno al que pertenece (el de ejecución: hora_toma o hora_programada)
  fecha_turno     DATE NOT NULL,
  tipo_turno      CHAR(1) NOT NULL CHECK (tipo_turno IN ('A', 'B')),
  -- Se completan al ejecutarse (inmediato: al guardar; programado: al llegar la hora)
  numero          INTEGER,
  hora_ejecucion  TIMESTAMPTZ,
  -- Despacho: cuándo y quién asignó el chofer
  hora_asignacion TIMESTAMPTZ,
  asignado_por    INTEGER REFERENCES operadores(id),
  hora_avisado    TIMESTAMPTZ,
  avisado_por     INTEGER REFERENCES operadores(id),
  hora_fin        TIMESTAMPTZ,
  cancelado       BOOLEAN NOT NULL DEFAULT FALSE,
  cancelado_por   INTEGER REFERENCES operadores(id),
  repetir_activo  BOOLEAN NOT NULL DEFAULT FALSE,
  repetir_modo    TEXT NOT NULL DEFAULT 'diario',
  repetir_dias    TEXT NOT NULL DEFAULT '',
  repetir_hora    TEXT NOT NULL DEFAULT '',
  viaje_origen_id INTEGER REFERENCES viajes(id) ON DELETE SET NULL,
  CONSTRAINT chk_programado CHECK (NOT programado OR hora_programada IS NOT NULL)
);
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS nombre_cliente TEXT NOT NULL DEFAULT '';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS hora_avisado TIMESTAMPTZ;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS avisado_por INTEGER REFERENCES operadores(id);
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS repetir_activo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS repetir_modo TEXT NOT NULL DEFAULT 'diario';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS repetir_dias TEXT NOT NULL DEFAULT '';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS repetir_hora TEXT NOT NULL DEFAULT '';
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS viaje_origen_id INTEGER REFERENCES viajes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_viajes_turno ON viajes (fecha_turno, tipo_turno);
CREATE INDEX IF NOT EXISTS idx_viajes_telefono ON viajes (telefono);
CREATE INDEX IF NOT EXISTS idx_viajes_pendientes ON viajes (hora_programada) WHERE numero IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_viajes_numero ON viajes (fecha_turno, tipo_turno, numero);

CREATE TABLE IF NOT EXISTS viaje_historial (
  id          SERIAL PRIMARY KEY,
  viaje_id    INTEGER NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
  operador_id INTEGER REFERENCES operadores(id),
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  accion      TEXT NOT NULL,
  detalle     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_viaje_historial_viaje ON viaje_historial (viaje_id, fecha DESC);

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
INSERT INTO configuracion (clave, valor)
VALUES
  ('minutos_aviso_programado', '5'),
  ('mostrar_nombre_recepcion', 'true')
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE IF NOT EXISTS calles (
  id                SERIAL PRIMARY KEY,
  nombre            TEXT NOT NULL,
  nombre_normalizado TEXT NOT NULL UNIQUE,
  alias             TEXT NOT NULL DEFAULT '',
  alias_normalizado TEXT NOT NULL DEFAULT '',
  activa            BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calles_nombre_norm ON calles (nombre_normalizado);
