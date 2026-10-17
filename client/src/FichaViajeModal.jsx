import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import { hora } from './formato.js';
import TelefonoWhatsApp from './TelefonoWhatsApp.jsx';

const DIAS_SEMANA = [
  { id: 1, corto: 'Lun', largo: 'Lunes' },
  { id: 2, corto: 'Mar', largo: 'Martes' },
  { id: 3, corto: 'Mié', largo: 'Miércoles' },
  { id: 4, corto: 'Jue', largo: 'Jueves' },
  { id: 5, corto: 'Vie', largo: 'Viernes' },
  { id: 6, corto: 'Sáb', largo: 'Sábado' },
  { id: 0, corto: 'Dom', largo: 'Domingo' },
];

function formatearFechaHoraCompleta(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
}

export default function FichaViajeModal({
  viajeId,
  choferes = [],
  onCerrar,
  onClose,
  onActualizado,
  onGuardado,
}) {
  const cerrar = onCerrar || onClose;
  const notificarCambio = onActualizado || onGuardado;

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [viaje, setViaje] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [todosChoferes, setTodosChoferes] = useState(choferes);

  // Campos editables de la ficha
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [choferId, setChoferId] = useState('');
  const [programado, setProgramado] = useState(false);
  const [horaProgramada, setHoraProgramada] = useState('');

  // Repetición programática
  const [repetirActivo, setRepetirActivo] = useState(false);
  const [repetirModo, setRepetirModo] = useState('diario'); // 'diario' | 'dias'
  const [repetirDias, setRepetirDias] = useState([1, 2, 3, 4, 5]);
  const [repetirHora, setRepetirHora] = useState('');

  const cargarFicha = useCallback(async () => {
    if (!viajeId) return;
    setCargando(true);
    setError('');
    try {
      const [datosFicha, listaChoferes] = await Promise.all([
        api(`/viajes/${viajeId}/ficha`),
        api('/choferes').catch(() => choferes),
      ]);
      const v = datosFicha.viaje;
      setViaje(v);
      setHistorial(datosFicha.historial || []);
      setTodosChoferes(listaChoferes.filter((c) => c.activo || c.id === v.chofer_id));

      setDireccion(v.direccion || '');
      setTelefono(v.telefono || '');
      setChoferId(v.chofer_id ?? '');
      setProgramado(Boolean(v.programado));
      const hProg = v.hora_programada ? hora(v.hora_programada) : '';
      setHoraProgramada(hProg);

      setRepetirActivo(Boolean(v.repetir_activo));
      setRepetirModo(v.repetir_modo === 'dias' ? 'dias' : 'diario');
      const diasGuardados = String(v.repetir_dias || '')
        .split(',')
        .filter((x) => x.trim() !== '')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
      setRepetirDias(diasGuardados.length ? diasGuardados : [1, 2, 3, 4, 5]);
      setRepetirHora(v.repetir_hora || hProg || hora(v.hora_toma) || '08:00');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [viajeId, choferes]);

  useEffect(() => {
    cargarFicha();
  }, [cargarFicha]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') cerrar?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cerrar]);

  function toggleDia(diaId) {
    setRepetirDias((prev) =>
      prev.includes(diaId) ? prev.filter((d) => d !== diaId) : [...prev, diaId].sort(),
    );
  }

  async function guardarCambios(e) {
    e?.preventDefault();
    setError('');
    setMensaje('');
    if (!direccion.trim()) {
      setError('La dirección no puede estar vacía');
      return;
    }
    if (programado && !horaProgramada.trim()) {
      setError('Ingresá la hora para reprogramar el viaje (ej: 18:30)');
      return;
    }
    if (repetirActivo && repetirModo === 'dias' && repetirDias.length === 0) {
      setError('Seleccioná al menos un día de la semana para repetir el viaje');
      return;
    }

    setGuardando(true);
    try {
      const res = await api(`/viajes/${viajeId}`, {
        method: 'PUT',
        body: {
          direccion,
          telefono,
          choferId: choferId ? Number(choferId) : null,
          programado,
          horaProgramada: programado ? horaProgramada : '',
          repetirActivo,
          repetirModo,
          repetirDias,
          repetirHora: repetirHora || horaProgramada,
        },
      });
      setViaje(res.viaje);
      setHistorial(res.historial || []);
      setMensaje('Cambios guardados y registrados en el historial del viaje.');
      notificarCambio?.(res.viaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleAvisarDesdeFicha() {
    if (!viaje) return;
    if (!viaje.chofer_id) {
      window.alert('⚠️ Primero tenés que asignar un chofer antes de avisar.');
      setError('Primero tenés que asignar un chofer antes de avisar.');
      return;
    }
    try {
      await api(`/viajes/${viaje.id}/avisado`, {
        method: 'PUT',
        body: { avisado: !viaje.hora_avisado },
      });
      await cargarFicha();
      notificarCambio?.();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={cerrar}>
      <div className="modal-ficha tarjeta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-ficha-cabecera">
          <div className="modal-ficha-titulo-wrap">
            <h2>
              📋 Ficha de Viaje {viaje?.numero ? `· N° ${viaje.numero}` : '· Programado'}
              {viaje && <small className="tenue"> (ID #{viaje.id})</small>}
            </h2>
            {viaje && (
              <div className="modal-ficha-sub">
                <span>Turno {viaje.fecha_turno} ({viaje.tipo_turno})</span>
                {viaje.cancelado ? (
                  <span className="chip alerta">Anulado</span>
                ) : viaje.programado ? (
                  <span className="chip prog">Programado {hora(viaje.hora_programada)}</span>
                ) : (
                  <span className="chip exito">En turno</span>
                )}
                {viaje.repetir_activo && (
                  <span className="chip prog">🔁 Repetición activa ({viaje.repetir_hora})</span>
                )}
              </div>
            )}
          </div>
          <button type="button" className="btn-cerrar-modal" onClick={cerrar} title="Cerrar (Esc)">
            ✕
          </button>
        </div>

        {cargando ? (
          <div className="modal-ficha-cuerpo">
            <p className="cargando">Cargando ficha e historial del viaje…</p>
          </div>
        ) : !viaje ? (
          <div className="modal-ficha-cuerpo">
            <div className="alerta error">{error || 'No se pudo cargar el viaje'}</div>
          </div>
        ) : (
          <div className="modal-ficha-cuerpo">
            {error && <div className="alerta error">{error}</div>}
            {mensaje && <div className="alerta exito">{mensaje}</div>}

            {/* Bloque de Tiempos y Operadores (SOLO LECTURA) */}
            <section className="ficha-tiempos-readonly">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 className="ficha-seccion-titulo" style={{ marginBottom: 0 }}>
                  🔒 Registros de Tiempo y Operadores (Solo lectura)
                </h4>
                <button
                  type="button"
                  className={viaje.hora_avisado ? 'btn-avisado' : 'btn-avisar'}
                  onClick={handleAvisarDesdeFicha}
                >
                  {viaje.hora_avisado ? `Avisado (${hora(viaje.hora_avisado)})` : 'Avisar al chofer'}
                </button>
              </div>
              <div className="ficha-tiempos-grilla">
                <div className="ficha-tiempo-card">
                  <span className="ficha-tiempo-etiqueta">Hora de Inicio (Creación)</span>
                  <b className="ficha-tiempo-valor">{formatearFechaHoraCompleta(viaje.hora_toma)}</b>
                  <span className="ficha-tiempo-operador">Operador: <b>{viaje.operador || '—'}</b></span>
                </div>
                <div className="ficha-tiempo-card">
                  <span className="ficha-tiempo-etiqueta">Asignado (Chofer)</span>
                  <b className="ficha-tiempo-valor">
                    {viaje.hora_asignacion ? formatearFechaHoraCompleta(viaje.hora_asignacion) : 'Sin asignar'}
                  </b>
                  <span className="ficha-tiempo-operador">
                    Operador: <b>{viaje.asignado_por_nombre || '—'}</b>
                  </span>
                </div>
                <div className="ficha-tiempo-card">
                  <span className="ficha-tiempo-etiqueta">Avisado al Chofer</span>
                  <b className="ficha-tiempo-valor">
                    {viaje.hora_avisado ? formatearFechaHoraCompleta(viaje.hora_avisado) : 'Pendiente de aviso'}
                  </b>
                  <span className="ficha-tiempo-operador">
                    Operador: <b>{viaje.avisado_por_nombre || '—'}</b>
                  </span>
                </div>
              </div>
            </section>

            {/* Formulario de Edición */}
            <form onSubmit={guardarCambios} className="ficha-form">
              <div className="ficha-grilla-campos">
                <label className="campo">
                  <span>Dirección / Destino</span>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                  />
                </label>

                <div className="campo">
                  <span>Teléfono del Cliente</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s+-]/g, ''))}
                      placeholder="Sin teléfono"
                    />
                    {telefono && <TelefonoWhatsApp telefono={telefono} />}
                  </div>
                </div>

                <label className="campo">
                  <span>Chofer Asignado (cambiar resetea Avisar)</span>
                  <select
                    value={choferId}
                    onChange={(e) => setChoferId(e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {todosChoferes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="campo">
                  <span>Reprogramar Horario</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label className="ficha-check-header">
                      <input
                        type="checkbox"
                        checked={programado}
                        onChange={(e) => {
                          setProgramado(e.target.checked);
                          if (e.target.checked && !horaProgramada) {
                            setHoraProgramada(hora(viaje.hora_programada || viaje.hora_toma));
                          }
                        }}
                      />
                      <span>Programado</span>
                    </label>
                    {programado && (
                      <input
                        type="text"
                        value={horaProgramada}
                        onChange={(e) => setHoraProgramada(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5))}
                        placeholder="HH:MM (ej: 18:30)"
                        style={{ maxWidth: 140 }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Sección de Repetición Programática */}
              <div className="ficha-bloque">
                <label className="ficha-check-header">
                  <input
                    type="checkbox"
                    checked={repetirActivo}
                    onChange={(e) => {
                      setRepetirActivo(e.target.checked);
                      if (e.target.checked && !repetirHora) {
                        setRepetirHora(horaProgramada || hora(viaje.hora_programada || viaje.hora_toma));
                      }
                    }}
                  />
                  <b>🔁 Repetir este viaje programáticamente</b>
                </label>

                {repetirActivo && (
                  <div className="ficha-repeticion-panel">
                    <div className="ficha-repeticion-fila">
                      <div className="campo">
                        <span>Frecuencia de repetición</span>
                        <div className="ficha-modos-repetir">
                          <button
                            type="button"
                            className={repetirModo === 'diario' ? 'btn chico primario' : 'btn chico'}
                            onClick={() => setRepetirModo('diario')}
                          >
                            📅 Cada día
                          </button>
                          <button
                            type="button"
                            className={repetirModo === 'dias' ? 'btn chico primario' : 'btn chico'}
                            onClick={() => setRepetirModo('dias')}
                          >
                            🗓️ Seleccionar días
                          </button>
                        </div>
                      </div>

                      <label className="campo">
                        <span>Hora del viaje repetido (HH:MM)</span>
                        <input
                          type="text"
                          value={repetirHora}
                          onChange={(e) => setRepetirHora(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5))}
                          placeholder="HH:MM"
                          style={{ maxWidth: 130 }}
                        />
                      </label>
                    </div>

                    {repetirModo === 'dias' && (
                      <div className="ficha-dias-semana">
                        <span className="ficha-dias-etiqueta">
                          Días de la semana en que se repetirá (una vez por semana, X días, toda la semana, etc.):
                        </span>
                        <div className="ficha-dias-grilla">
                          {DIAS_SEMANA.map((d) => {
                            const activo = repetirDias.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                className={activo ? 'btn-dia-semana activo' : 'btn-dia-semana'}
                                onClick={() => toggleDia(d.id)}
                                title={d.largo}
                              >
                                {d.corto}
                              </button>
                            );
                          })}
                        </div>
                        <div className="ficha-dias-atajos">
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => setRepetirDias([1, 2, 3, 4, 5])}
                          >
                            Lunes a Viernes
                          </button>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => setRepetirDias([1, 3, 5])}
                          >
                            Lun, Mié y Vie
                          </button>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => setRepetirDias([2, 4])}
                          >
                            Mar y Jue
                          </button>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => setRepetirDias([6, 0])}
                          >
                            Fin de semana
                          </button>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => setRepetirDias([new Date().getDay()])}
                          >
                            1 vez por semana (hoy)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ficha-acciones-form">
                <button type="button" className="btn" onClick={cerrar}>
                  Cerrar
                </button>
                <button type="submit" className="btn primario" disabled={guardando}>
                  {guardando ? 'Guardando…' : '💾 Guardar cambios'}
                </button>
              </div>
            </form>

            {/* Historial de Auditoría del Viaje */}
            <section className="ficha-historial-seccion">
              <h4 className="ficha-seccion-titulo">
                📜 Historial del viaje ({historial.length})
              </h4>
              {historial.length === 0 ? (
                <p className="vacio">Sin eventos registrados.</p>
              ) : (
                <ul className="ficha-historial-lista">
                  {historial.map((h) => (
                    <li key={h.id} className="ficha-historial-item">
                      <div className="ficha-historial-cabecera">
                        <span className="ficha-historial-badge">{h.accion}</span>
                        <span className="ficha-historial-fecha">{formatearFechaHoraCompleta(h.fecha)}</span>
                        <span className="ficha-historial-op">Operador: <b>{h.operador || 'Sistema'}</b></span>
                      </div>
                      <div className="ficha-historial-detalle">{h.detalle}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

