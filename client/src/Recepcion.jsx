import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, leerSesion } from './api.js';
import { tienePermiso } from '../../shared/permisos.js';
import FormViaje from './FormViaje.jsx';
import Despacho from './Despacho.jsx';
import ListaViajes from './ListaViajes.jsx';
import TelefonoWhatsApp from './TelefonoWhatsApp.jsx';
import FichaViajeModal from './FichaViajeModal.jsx';
import { hora, horaConDia } from './formato.js';

function minutosHasta(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

export default function Recepcion({ turnos, socket, activa }) {
  const [choferes, setChoferes] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [futuros, setFuturos] = useState([]);
  const [anteriores, setAnteriores] = useState([]);
  const [mostrarAnteriores, setMostrarAnteriores] = useState(true);
  const [minutosAviso, setMinutosAviso] = useState(5);
  const [mostrarNombre, setMostrarNombre] = useState(true);
  const [pospuestos, setPospuestos] = useState(new Set());
  const [atendiendoManual, setAtendiendoManual] = useState(null);
  const [formVacio, setFormVacio] = useState(true);
  const [mostrarAnulados, setMostrarAnulados] = useState(false);
  const [viajeFuturoFichaId, setViajeFuturoFichaId] = useState(null);

  const formRef = useRef(null);
  const despachoRef = useRef(null);

  const sesionOperador = leerSesion()?.operador;
  const puedeTomar = tienePermiso(sesionOperador, 'recepcion_toma');
  const puedeAsignarChofer = tienePermiso(sesionOperador, 'recepcion_chofer');
  const puedeAvisar = tienePermiso(sesionOperador, 'recepcion_avisar');
  const puedeAbrirFicha = tienePermiso(sesionOperador, 'recepcion_ficha');

  const tActual = turnos?.actual;

  const cargarDatos = useCallback(async () => {
    if (!tActual) return;
    try {
      const [listaChoferes, datosViajes] = await Promise.all([
        api(`/turnos/${tActual.fecha}/${tActual.tipo}/choferes`),
        api(`/turnos/${tActual.fecha}/${tActual.tipo}/viajes`),
      ]);
      setChoferes(listaChoferes);
      setViajes(datosViajes.viajes || []);
      setFuturos(datosViajes.futuros || []);
      setAnteriores(datosViajes.anteriores || []);
      if (datosViajes.configuracion?.minutosAvisoProgramado != null) {
        setMinutosAviso(datosViajes.configuracion.minutosAvisoProgramado);
      }
      if (datosViajes.configuracion?.mostrarNombreRecepcion != null) {
        setMostrarNombre(datosViajes.configuracion.mostrarNombreRecepcion);
      }
    } catch (err) {
      console.error('Error al cargar datos del turno:', err);
    }
  }, [tActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!socket) return undefined;
    const alRecibirViajes = () => cargarDatos();
    const alRecibirChoferes = () => cargarDatos();
    const alRecibirConfig = (cfg) => {
      if (cfg?.minutosAvisoProgramado != null) setMinutosAviso(cfg.minutosAvisoProgramado);
      if (cfg?.mostrarNombreRecepcion != null) setMostrarNombre(cfg.mostrarNombreRecepcion);
      cargarDatos();
    };

    socket.on('viajes', alRecibirViajes);
    socket.on('choferes', alRecibirChoferes);
    socket.on('configuracion', alRecibirConfig);
    return () => {
      socket.off('viajes', alRecibirViajes);
      socket.off('choferes', alRecibirChoferes);
      socket.off('configuracion', alRecibirConfig);
    };
  }, [socket, cargarDatos]);

  // Todos los viajes del turno (y futuros) sin chofer y no cancelados
  const todosSinChofer = useMemo(() => {
    return [...viajes, ...futuros].filter((v) => !v.chofer_id && !v.cancelado);
  }, [viajes, futuros]);

  // Programados que entraron en la ventana de aviso previo (o cuya hora ya llegó) y aún no tienen chofer
  const programadosEnAvisoSinChofer = useMemo(() => {
    return [...viajes, ...futuros].filter((v) => {
      if (!v.programado || v.cancelado || v.chofer_id) return false;
      const mins = minutosHasta(v.hora_programada);
      return v.numero != null || (mins != null && mins <= minutosAviso);
    });
  }, [viajes, futuros, minutosAviso]);

  // Programados que entraron en ventana de aviso previo pero aún no fueron avisados al chofer
  const programadosEnAvisoSinAvisar = useMemo(() => {
    return [...viajes, ...futuros].filter((v) => {
      if (!v.programado || v.cancelado || v.hora_avisado) return false;
      const mins = minutosHasta(v.hora_programada);
      return v.numero != null || (mins != null && mins <= minutosAviso);
    });
  }, [viajes, futuros, minutosAviso]);

  // El viaje a despachar automáticamente:
  // - O el seleccionado manualmente (con click en F2),
  // - O el primer programado en ventana de aviso sin chofer que no esté pospuesto
  const viajeADespachar = useMemo(() => {
    if (atendiendoManual) {
      const sigue = todosSinChofer.find((v) => v.id === atendiendoManual.id);
      if (sigue) return sigue;
    }
    if (!formVacio) return null; // No interrumpir al operador si está tipeando un viaje nuevo
    return programadosEnAvisoSinChofer.find((v) => !pospuestos.has(v.id)) || null;
  }, [atendiendoManual, todosSinChofer, programadosEnAvisoSinChofer, formVacio, pospuestos]);

  function handlePosponer(v) {
    setPospuestos((prev) => new Set([...prev, v.id]));
    setAtendiendoManual(null);
    setTimeout(() => formRef.current?.focus(), 50);
  }

  function handleAsignado(v) {
    setPospuestos((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
    setAtendiendoManual(null);
    setTimeout(() => formRef.current?.focus(), 50);
  }

  function handleAtenderManual(v) {
    setAtendiendoManual(v);
    setPospuestos((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
  }

  // Atajos de teclado globales en Recepción:
  // F2: atender el primer viaje en aviso o sin chofer
  // F1: volver el foco al formulario
  useEffect(() => {
    if (!activa) return undefined;
    function onKeyDown(e) {
      if (e.key === 'F2') {
        e.preventDefault();
        const objetivo = programadosEnAvisoSinChofer[0] || todosSinChofer[0];
        if (objetivo) handleAtenderManual(objetivo);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setAtendiendoManual(null);
        formRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activa, programadosEnAvisoSinChofer, todosSinChofer]);

  const totalViajes = viajes.filter((v) => v.numero != null && !v.cancelado).length;
  const sinAvisarCount = viajes.filter((v) => !v.cancelado && v.chofer_id && !v.hora_avisado).length;
  const anuladosCount = viajes.filter((v) => v.cancelado).length;

  async function cambiarChoferFuturo(viajeId, nuevoChoferId) {
    try {
      await api(`/viajes/${viajeId}/chofer`, {
        method: 'PUT',
        body: { choferId: nuevoChoferId ? Number(nuevoChoferId) : null },
      });
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function toggleAvisadoFuturo(e, f) {
    e.stopPropagation();
    if (!f.hora_avisado && !f.chofer_id) {
      window.alert('⚠️ Primero tenés que asignar un chofer antes de marcar como asignado.');
      return;
    }
    try {
      await api(`/viajes/${f.id}/avisado`, {
        method: 'PUT',
        body: { avisado: !f.hora_avisado },
      });
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="recepcion-contenedor">
      {/* Barra superior de alertas de viajes programados dentro del aviso previo */}
      {programadosEnAvisoSinAvisar.length > 0 && !viajeADespachar && (
        <div className="barra-aviso-despacho">
          <span>
            ⏰ <b>Aviso previo ({minutosAviso} min):</b> Hay <b>{programadosEnAvisoSinAvisar.length}</b> viaje(s) programado(s) próximo(s) a su hora
            {programadosEnAvisoSinChofer.length > 0
              ? ` (${programadosEnAvisoSinChofer.length} sin chofer asignado).`
              : ' pendientes de avisar al chofer.'}
          </span>
          {programadosEnAvisoSinChofer.length > 0 && (
            <button className="btn chico alerta" onClick={() => handleAtenderManual(programadosEnAvisoSinChofer[0])}>
              Asignar chofer <kbd>F2</kbd>
            </button>
          )}
        </div>
      )}

      {/* Panel dinámico flotante: Despacho O Formulario de nuevo viaje */}
      <div className="bloque-ingreso-flotante">
        <section className="tarjeta seccion-panel-ingreso">
          {viajeADespachar ? (
            <Despacho
              ref={despachoRef}
              viaje={viajeADespachar}
              choferes={choferes}
              mostrarNombre={mostrarNombre}
              pendientes={todosSinChofer.length}
              onPosponer={handlePosponer}
              onAsignado={handleAsignado}
            />
          ) : puedeTomar ? (
            <FormViaje
              ref={formRef}
              choferes={choferes}
              minutosAviso={minutosAviso}
              mostrarNombre={mostrarNombre}
              onGuardado={() => {
                cargarDatos();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onVacioCambio={setFormVacio}
            />
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
              🔒 No tenés permisos para ingresar nuevos viajes (Tomar viajes).
            </div>
          )}
        </section>
      </div>

      {/* Listado de viajes del turno */}
      <section className="seccion-listado">
        <div className="listado-cabecera">
          <div className="titulos-listado">
            <h2>Viajes del turno actual</h2>
            <span className="resumen-viajes">
              <b>{totalViajes}</b> activos · <b>{choferes.length}</b> choferes en turno
              {sinAvisarCount > 0 && (
                <> · <b style={{ color: '#dc2626' }}>{sinAvisarCount}</b> por asignar</>
              )}
              {anuladosCount > 0 && (
                <>
                  {' · '}
                  <button
                    type="button"
                    className="btn-link chico"
                    style={{ color: '#94a3b8', textDecoration: 'underline', padding: '0 4px', fontSize: '0.82rem' }}
                    onClick={() => setMostrarAnulados(!mostrarAnulados)}
                    title={mostrarAnulados ? 'Ocultar viajes anulados de la lista' : 'Ver viajes anulados para consultar o restaurar'}
                  >
                    {mostrarAnulados ? 'Ocultar anulados' : `${anuladosCount} anulado(s)`}
                  </button>
                </>
              )}
            </span>
          </div>
          {choferes.length === 0 && (
            <div className="alerta-sin-choferes">
              Atención: No hay choferes asignados a este turno. Podés agregarlos en la pestaña <i>Choferes del turno</i>.
            </div>
          )}
        </div>

        {viajes.length === 0 && anteriores.length > 0 && (
          <div className="alerta info aviso-cambio-suave" style={{ marginBottom: '12px', fontSize: '0.88rem' }}>
            💡 <b>Turno nuevo en curso ({turnos?.actual?.etiqueta}):</b> El nuevo conteo iniciará con el <b>N° 1</b>.
            Más abajo tenés la lista del turno anterior disponible como referencia.
          </div>
        )}

        <div className="tarjeta listado-tarjeta">
          <ListaViajes
            viajes={viajes}
            choferes={choferes}
            minutosAviso={minutosAviso}
            mostrarNombre={mostrarNombre}
            editable={true}
            ocultarAnulados={!mostrarAnulados}
            onAtender={handleAtenderManual}
            onActualizado={cargarDatos}
          />
        </div>
      </section>

      {/* Viajes del turno anterior como referencia */}
      {anteriores.length > 0 && (
        <section className="seccion-turno-anterior">
          <div className="cabecera-seccion-referencia">
            <div className="titulos-referencia">
              <h3>📋 Viajes del turno anterior ({turnos?.anterior?.etiqueta}) — Referencia</h3>
              <span className="tenue" style={{ fontSize: '0.83rem' }}>
                {anteriores.filter((v) => v.numero != null && !v.cancelado).length} viaje(s) del turno previo conservados como referencia.
              </span>
            </div>
            <button
              type="button"
              className="btn-link chico"
              style={{ fontSize: '0.82rem' }}
              onClick={() => setMostrarAnteriores(!mostrarAnteriores)}
            >
              {mostrarAnteriores ? 'Ocultar referencia ▲' : 'Ver referencia ▼'}
            </button>
          </div>

          {mostrarAnteriores && (
            <div className="tarjeta listado-tarjeta tarjeta-referencia-anterior">
              <ListaViajes
                viajes={anteriores}
                choferes={choferes}
                minutosAviso={minutosAviso}
                mostrarNombre={mostrarNombre}
                editable={false}
                esReferencia={true}
                ocultarAnulados={false}
                onActualizado={cargarDatos}
              />
            </div>
          )}
        </section>
      )}

      {/* Programados de turnos posteriores */}
      {futuros.length > 0 && (
        <section className="seccion-futuros">
          <h3>📅 Programados para próximos turnos ({futuros.length})</h3>
          <div className="tarjeta tabla-futuros-wrap">
            <table className="tabla-viajes tabla-filas-clickeables">
              <thead>
                <tr>
                  <th>Dirección</th>
                  <th className="col-hora">Hora Inicio</th>
                  <th className="col-fin">Asignado</th>
                  <th>Chofer</th>
                  <th className="col-avisado">Estado</th>
                  <th>Teléfono</th>
                  <th>Hora Programada / Turno</th>
                </tr>
              </thead>
              <tbody>
                {futuros.map((f) => {
                  const horaAsig = f.hora_asignacion || f.hora_fin;
                  const fueAvisado = Boolean(f.hora_avisado);
                  return (
                    <tr
                      key={f.id}
                      className={['fila-pendiente', puedeAbrirFicha && 'fila-clickeable'].filter(Boolean).join(' ')}
                      onClick={() => { if (puedeAbrirFicha) setViajeFuturoFichaId(f.id); }}
                      title={puedeAbrirFicha ? 'Click para abrir la Ficha de Viaje' : undefined}
                    >
                      <td className="col-dir">
                        <span className="texto-direccion">{f.direccion}</span>
                        {Boolean(f.repetir_activo) && (
                          <span className="badge-repetir-mini" title="Repetición programática activa">
                            🔁
                          </span>
                        )}
                      </td>
                      <td className="col-hora" title={`Creado por ${f.operador || '—'}`}>
                        <b>{hora(f.hora_toma)}</b>
                        <div className="subtexto-op">{f.operador}</div>
                      </td>
                      <td className="col-fin">{horaAsig ? <b>{hora(horaAsig)}</b> : <span className="tenue">—</span>}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className={f.chofer_id ? 'select-chofer-tabla asignado' : 'select-chofer-tabla sin-asignar'}
                          value={f.chofer_id ?? ''}
                          disabled={!puedeAsignarChofer}
                          onChange={(e) => cambiarChoferFuturo(f.id, e.target.value)}
                        >
                          <option value="">Sin asignar</option>
                          {choferes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="col-avisado" onClick={(e) => e.stopPropagation()}>
                        <div className="celda-avisado-wrap">
                          <button
                            type="button"
                            className={fueAvisado ? 'btn-avisado' : 'btn-avisar'}
                            disabled={!puedeAvisar}
                            onClick={(e) => toggleAvisadoFuturo(e, f)}
                          >
                            {fueAvisado ? 'Asignado' : 'Asignar'}
                          </button>
                          {fueAvisado && <b className="hora-avisado-texto">{hora(f.hora_avisado)}</b>}
                        </div>
                      </td>
                      <td>
                        <TelefonoWhatsApp
                          telefono={f.telefono}
                          nombre={mostrarNombre ? f.nombre_cliente : ''}
                        />
                      </td>
                      <td>
                        <span className="badge-prog">
                          {horaConDia(f.hora_programada)} · Turno {f.fecha_turno} ({f.tipo_turno})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viajeFuturoFichaId != null && (
        <FichaViajeModal
          viajeId={viajeFuturoFichaId}
          choferes={choferes}
          editable={true}
          onClose={() => setViajeFuturoFichaId(null)}
          onGuardado={cargarDatos}
        />
      )}
    </div>
  );
}

