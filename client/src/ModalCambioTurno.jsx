import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { hora, formatearNumeroViaje } from './formato.js';

export default function ModalCambioTurno({ turnos, onCerrar, onSalir }) {
  const [cargando, setCargando] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarInfo = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await api('/turnos/cambio-info');
      setInfo(datos);
    } catch (err) {
      setError(err.message || 'Error al comprobar el estado del turno');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarInfo();
  }, [cargarInfo]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !guardando) {
        onCerrar();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCerrar, guardando]);

  async function handleCambiarYSalir() {
    if (!info?.puedeCambiar || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api('/turnos/cambiar', { method: 'POST' });
      onCerrar();
      onSalir();
    } catch (err) {
      setError(err.message || 'Error al cambiar de turno');
      setGuardando(false);
    }
  }

  const actualEtiqueta = info?.actual?.etiqueta || turnos?.actual?.etiqueta;
  const siguienteEtiqueta = info?.siguiente?.etiqueta || turnos?.siguiente?.etiqueta;
  const hayPendientes = Boolean(info && !info.puedeCambiar);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar();
      }}
    >
      <div className="modal-ficha modal-cambio-turno" role="dialog" aria-modal="true">
        <div className="modal-ficha-cabecera">
          <div className="modal-ficha-titulo-wrap">
            <h2>🔄 Cambio de Turno</h2>
            <div className="modal-ficha-sub">
              <span>Turno actual: <b>{actualEtiqueta}</b></span>
            </div>
          </div>
          <button
            type="button"
            className="btn-cerrar-modal"
            disabled={guardando}
            onClick={onCerrar}
            title="Cerrar modal (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="modal-ficha-cuerpo">
          {cargando ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="cargando">Comprobando viajes pendientes del turno actual…</p>
            </div>
          ) : error ? (
            <div className="alerta error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          ) : hayPendientes ? (
            <div className="contenedor-cambio-turno">
              <div className="alerta-cambio-turno advertencia">
                <div className="icono-alerta">⚠️</div>
                <div className="texto-alerta">
                  <h3>Tienes viajes sin terminar en tu turno, asigna primero un chofer.</h3>
                  <p>
                    Hay <b>{info.pendientes.length}</b> viaje(s) activos sin chofer asignado.
                    Antes de cerrar el turno y salir, tenés que asignarle chofer a cada uno o anularlos.
                  </p>
                </div>
              </div>

              <div className="seccion-pendientes-cambio">
                <h4>Viajes sin chofer asignado ({info.pendientes.length})</h4>
                <div className="tabla-pendientes-cambio-wrap">
                  <table className="tabla-viajes">
                    <thead>
                      <tr>
                        <th className="col-num">N°</th>
                        <th>Hora</th>
                        <th>Dirección</th>
                        <th>Teléfono / Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {info.pendientes.map((p) => (
                        <tr key={p.id}>
                          <td className="col-num"><b>{p.numero != null ? (p.numero_formateado || formatearNumeroViaje(p.numero, p.tipo_turno)) : 'Prog.'}</b></td>
                          <td>{hora(p.hora_toma)}</td>
                          <td><span className="texto-direccion">{p.direccion}</span></td>
                          <td>{p.telefono ? `${p.telefono}${p.nombre_cliente ? ` · ${p.nombre_cliente}` : ''}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="nota-pie-pendiente">
                  👉 Cerrá esta ventana, asigná los choferes pendientes en Recepción y volvé a pulsar sobre el Turno para finalizar.
                </p>
              </div>
            </div>
          ) : (
            <div className="contenedor-cambio-turno">
              <div className="alerta-cambio-turno exito">
                <div className="icono-alerta">✅</div>
                <div className="texto-alerta">
                  <h3>No hay viajes pendientes de asignar.</h3>
                  <p>
                    Todos los viajes del turno tienen chofer asignado. El turno está en condiciones de ser cerrado.
                  </p>
                </div>
              </div>

              <div className="grilla-transicion-turnos">
                <div className="tarjeta-turno-cambio saliente">
                  <span className="subtitulo-cambio">Turno que finaliza</span>
                  <h4>Turno {actualEtiqueta}</h4>
                  <p className="stats-turno">
                    <b>{info.resumen.totalActivos}</b> viaje(s) registrados · <b>{info.resumen.totalChoferes}</b> chofer(es)
                  </p>
                </div>

                <div className="flecha-transicion">➔</div>

                <div className="tarjeta-turno-cambio entrante">
                  <span className="subtitulo-cambio">Próximo turno que comenzará</span>
                  <h4>Turno {siguienteEtiqueta}</h4>
                  <p className="stats-turno">
                    Nuevo conteo desde el N° 1 · Conservará el turno anterior como referencia
                  </p>
                </div>
              </div>

              <div className="aviso-salida-pantalla">
                Al presionar <b>Salir</b>, el sistema avanzará el turno y cerrará tu sesión, dejando la pantalla lista para que ingrese el siguiente operador.
              </div>
            </div>
          )}
        </div>

        <div className="modal-ficha-pie" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--borde)', background: 'var(--bg-destacado)' }}>
          <button
            type="button"
            className="btn"
            disabled={guardando}
            onClick={onCerrar}
          >
            {hayPendientes ? 'Cerrar y volver a Recepción' : 'Cancelar'}
          </button>

          {!cargando && !error && (
            <button
              type="button"
              className={hayPendientes ? 'btn btn-bloqueado' : 'btn primario btn-accion-cambio-turno'}
              disabled={hayPendientes || guardando}
              onClick={handleCambiarYSalir}
              title={hayPendientes ? 'Tienes viajes sin terminar en tu turno, asigna primero un chofer' : 'Finalizar turno y salir'}
            >
              {guardando ? 'Cambiando turno…' : 'Salir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
