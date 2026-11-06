import { useState, useMemo, useEffect } from 'react';
import { api, leerSesion, obtenerChoferEnVuelo, esperarChoferEnVuelo } from './api.js';
import { hora, horaConDia, formatearNumeroViaje } from './formato.js';
import TelefonoWhatsApp from './TelefonoWhatsApp.jsx';
import FichaViajeModal from './FichaViajeModal.jsx';
import { tienePermiso } from '../../shared/permisos.js';
import { minutosHasta, ordenarViajesVisuales } from '../../shared/viajesOrden.js';

function CeldaAsignado({ viaje }) {
  const horaAsig = viaje.hora_asignacion || viaje.hora_fin;
  const opAsig = viaje.asignado_por_nombre || '';

  if (viaje.cancelado) return <td className="col-fin" />;

  if (horaAsig) {
    return (
      <td className="col-fin" title={opAsig ? `Asignado por ${opAsig}` : 'Hora de asignación'}>
        <b>{hora(horaAsig)}</b>
        {opAsig && <div className="subtexto-op">{opAsig}</div>}
      </td>
    );
  }

  return (
    <td className="col-fin">
      <span className="tenue">—</span>
    </td>
  );
}

export function CeldaAvisado({ viaje, editable, puedeAvisar = true }) {
  const [guardando, setGuardando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  if (viaje.cancelado) {
    return (
      <td className="col-avisado">
        <span className="tenue">Anulado</span>
      </td>
    );
  }

  const enVuelo = obtenerChoferEnVuelo(viaje.id);
  // Si en vuelo se cambió el chofer respecto al que tenía el viaje,
  // el estado vuelve de inmediato al color no asignado
  const choferCambio = enVuelo && enVuelo.choferId !== viaje.chofer_id;
  const fueAvisado = choferCambio ? false : Boolean(viaje.hora_avisado);
  const opAvisado = viaje.avisado_por_nombre || '';

  async function marcarAvisado(e) {
    e.stopPropagation();
    if (!editable || guardando || verificando) return;

    if (fueAvisado) {
      setGuardando(true);
      try {
        await api(`/viajes/${viaje.id}/avisado`, {
          method: 'PUT',
          body: { avisado: false },
        });
      } catch (err) {
        console.warn('Error al desmarcar asignación:', err.message);
      } finally {
        setGuardando(false);
      }
      return;
    }

    // No estaba avisado: se pulsó el botón "Asignar"
    setVerificando(true);
    try {
      // Dar unos milisegundos suficientes para que se detecte la asignación
      // o se complete cualquier guardado en curso del chofer
      await esperarChoferEnVuelo(viaje.id, 350);

      const enVueloActual = obtenerChoferEnVuelo(viaje.id);
      const choferEfectivo = enVueloActual ? enVueloActual.choferId : viaje.chofer_id;

      if (!choferEfectivo) {
        // No hay chofer asignado (o se cambió a sin chofer):
        // El botón regresa al color anterior (rojo/btn-avisar) indicando la noasignación (sin cartel de alerta)
        return;
      }

      setGuardando(true);
      await api(`/viajes/${viaje.id}/avisado`, {
        method: 'PUT',
        body: { avisado: true },
      });
    } catch (err) {
      // Si el backend no confirma o falla, simplemente regresa al estado previo sin cartel
      console.warn('No se pudo marcar como asignado:', err.message);
    } finally {
      setVerificando(false);
      setGuardando(false);
    }
  }

  if (!editable || !puedeAvisar) {
    return (
      <td className="col-avisado">
        {fueAvisado ? (
          <div className="celda-avisado-wrap">
            <span className="btn-estado-avisado">Asignado</span>
            <b className="hora-avisado-texto">{hora(viaje.hora_avisado)}</b>
          </div>
        ) : (
          <span className="tenue">—</span>
        )}
      </td>
    );
  }

  const claseBoton = fueAvisado
    ? 'btn-avisado'
    : verificando
      ? 'btn-avisar verificando'
      : 'btn-avisar';

  return (
    <td className="col-avisado" onClick={(e) => e.stopPropagation()}>
      <div className="celda-avisado-wrap">
        <button
          type="button"
          className={claseBoton}
          disabled={guardando}
          onClick={marcarAvisado}
          title={
            fueAvisado
              ? `Asignado a las ${hora(viaje.hora_avisado)}${opAvisado ? ` por ${opAvisado}` : ''} (click para desmarcar)`
              : viaje.chofer_id
                ? 'Click para marcar como asignado al chofer'
                : 'Primero elegí un chofer para poder marcar como asignado'
          }
        >
          {fueAvisado ? 'Asignado' : verificando ? 'Asignando...' : 'Asignar'}
        </button>

        {fueAvisado && (
          <b
            className="hora-avisado-texto"
            title={opAvisado ? `Asignado por ${opAvisado}` : 'Hora en que fue asignado'}
          >
            {hora(viaje.hora_avisado)}
          </b>
        )}
      </div>
    </td>
  );
}

export function CeldaChofer({ viaje, choferes = [], editable, puedeAsignarChofer = true, onAtender }) {
  const [guardando, setGuardando] = useState(false);
  const [choferLocalId, setChoferLocalId] = useState(viaje.chofer_id);

  useEffect(() => {
    setChoferLocalId(viaje.chofer_id);
  }, [viaje.chofer_id]);

  async function cambiarChofer(nuevoId) {
    const idNum = nuevoId ? Number(nuevoId) : null;
    setChoferLocalId(idNum);
    setGuardando(true);
    try {
      await api(`/viajes/${viaje.id}/chofer`, {
        method: 'PUT',
        body: { choferId: idNum },
      });
    } catch (err) {
      console.warn('Error al cambiar chofer:', err.message);
      setChoferLocalId(viaje.chofer_id);
    } finally {
      setGuardando(false);
    }
  }

  if (!editable || !puedeAsignarChofer || viaje.cancelado) {
    return (
      <td>
        {viaje.chofer || <span className="tenue">Sin asignar</span>}
      </td>
    );
  }

  // Asegurar que si el viaje tiene un chofer que no está en el listado del turno actual, igual figure en el select
  const opciones = [...choferes];
  const idActual = choferLocalId ?? viaje.chofer_id;
  if (idActual && !opciones.some((c) => c.id === idActual)) {
    opciones.unshift({ id: idActual, nombre: viaje.chofer || `Chofer #${idActual}` });
  }

  return (
    <td className="col-chofer-celda" onClick={(e) => e.stopPropagation()}>
      <div className="chofer-celda-acciones">
        <select
          className={idActual ? 'select-chofer-tabla asignado' : 'select-chofer-tabla sin-asignar'}
          value={idActual ?? ''}
          disabled={guardando}
          onChange={(e) => cambiarChofer(e.target.value)}
          title="Asignar o cambiar chofer en cualquier momento (reinicia el estado de Avisar)"
        >
          <option value="">Sin asignar</option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {!idActual && onAtender && (
          <button
            type="button"
            className="btn chico alerta"
            onClick={(e) => {
              e.stopPropagation();
              onAtender(viaje);
            }}
            title="Abrir en panel de despacho (F2)"
          >
            <kbd>F2</kbd>
          </button>
        )}
      </div>
    </td>
  );
}

/**
 * Listado del turno: orden invertido (el más nuevo primero en la parte superior,
 * el más viejo al final de la lista). Luego los programados pendientes por hora.
 * Al clickear una fila se abre el modal "Ficha de viaje".
 */
export default function ListaViajes({
  viajes,
  choferes = [],
  minutosAviso = 5,
  mostrarNombre = true,
  editable = true,
  ocultarAnulados = false,
  esReferencia = false,
  esFiltro = false,
  nuevoViajeId = null,
  animandoFase = null,
  onAtender,
  onActualizado,
}) {
  const [viajeFichaId, setViajeFichaId] = useState(null);
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    // Ticker para actualizar minutos y reordenar automáticamente cuando un programado entra en período de aviso
    const t = setInterval(() => setAhoraMs(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const viajesVisibles = useMemo(() => {
    let lista = viajes;
    if (ocultarAnulados) {
      lista = lista.filter((v) => !v.cancelado);
    }
    return ordenarViajesVisuales(lista, minutosAviso, ahoraMs);
  }, [viajes, ocultarAnulados, minutosAviso, ahoraMs]);

  async function cambiarCancelado(e, v) {
    e.stopPropagation();
    const nuevoCancelado = !v.cancelado;
    try {
      await api(`/viajes/${v.id}/cancelado`, {
        method: 'PUT',
        body: { cancelado: nuevoCancelado },
      });
      onActualizado?.();
    } catch (err) {
      window.alert(err.message || 'Error al actualizar estado del viaje');
    }
  }

  const sesionOp = leerSesion()?.operador;
  const puedeCancelar = editable && tienePermiso(sesionOp, 'recepcion_cancelar');
  const puedeAsignarChofer = editable && tienePermiso(sesionOp, 'recepcion_chofer');
  const puedeAvisar = editable && tienePermiso(sesionOp, 'recepcion_avisar');
  const puedeAbrirFicha = tienePermiso(sesionOp, 'recepcion_ficha');

  if (!viajesVisibles.length) {
    return (
      <p className="vacio">
        {esFiltro
          ? 'No se encontraron viajes que coincidan con los términos del filtro.'
          : esReferencia
            ? 'No hay viajes registrados en el turno anterior.'
            : 'Todavía no hay viajes en este turno.'}
      </p>
    );
  }

  return (
    <>
      <table className={`tabla-viajes tabla-filas-clickeables ${esReferencia ? "tabla-referencia-anterior" : ""}`.trim()}>
        <thead>
          <tr>
            <th className="col-num">N°</th>
            <th className="col-dir">Dirección</th>
            <th className="col-hora">Hora Inicio</th>
            <th className="col-fin">Asignado</th>
            <th>Chofer</th>
            <th className="col-avisado">Estado</th>
            <th>{mostrarNombre ? 'Teléfono / Cliente' : 'Teléfono'}</th>
            <th className="col-prog">Programado</th>
            <th className="col-cancel">Cancel</th>
          </tr>
        </thead>
        <tbody>
          {viajesVisibles.map((v) => {
            const pendiente = v.numero == null && !v.chofer_id;
            const mins = v.programado ? minutosHasta(v.hora_programada, ahoraMs) : null;
            const enAvisoPrevio =
              v.programado && !v.cancelado && !v.chofer_id && mins != null && mins <= minutosAviso;
            const sinChofer = !v.chofer_id && !v.cancelado;
            const asignado = Boolean(v.chofer_id && !v.cancelado);
            const esProgPendiente = v.programado && !v.cancelado && !v.chofer_id;
            const esRecienCreado = v.id === nuevoViajeId;
            const clases = [
              puedeAbrirFicha && 'fila-clickeable',
              pendiente && 'fila-pendiente',
              sinChofer && 'fila-sin-chofer',
              enAvisoPrevio && 'fila-aviso-programado',
              v.cancelado && 'fila-anulada',
              asignado && !v.hora_avisado && 'fila-en-curso',
              esRecienCreado && 'fila-recien-creada',
            ].filter(Boolean).join(' ');

            return (
              <tr
                key={v.id}
                className={clases}
                onClick={() => { if (puedeAbrirFicha) setViajeFichaId(v.id); }}
                title={puedeAbrirFicha ? 'Click para abrir la Ficha de Viaje y ver su historial' : undefined}
              >
                <td className="col-num">
                  {pendiente ? '—' : (v.numero_formateado || formatearNumeroViaje(v.numero, v.tipo_turno))}
                  {esRecienCreado && animandoFase === 'fila' && (
                    <div className="taxi-pista-fila" aria-hidden="true">
                      <img src="/taxi.svg" className="taxi-fase-fila" alt="" />
                    </div>
                  )}
                </td>
                <td className="col-dir">
                  <span className="texto-direccion">{v.direccion}</span>
                  {Boolean(v.repetir_activo) && (
                    <span className="badge-repetir-mini" title="Repetición programática activa">
                      🔁
                    </span>
                  )}
                </td>
                <td className="col-hora" title={`Creado ${horaConDia(v.hora_toma)} por ${v.operador || '—'}`}>
                  <b>{hora(v.hora_toma)}</b>
                  <div className="subtexto-op">{v.operador}</div>
                </td>
                <CeldaAsignado viaje={v} />
                <CeldaChofer viaje={v} choferes={choferes} editable={editable} puedeAsignarChofer={puedeAsignarChofer} onAtender={onAtender} />
                <CeldaAvisado viaje={v} editable={editable} puedeAvisar={puedeAvisar} />
                <td>
                  <TelefonoWhatsApp telefono={v.telefono} nombre={mostrarNombre ? v.nombre_cliente : ''} />
                </td>
                <td className={`col-prog ${esProgPendiente ? 'col-prog-activo' : ''}`}>
                  {v.programado ? (
                    esProgPendiente ? (
                      <span
                        className={enAvisoPrevio ? 'badge-prog aviso-previo' : 'badge-prog'}
                        title={`Creado por ${v.operador || '—'} a las ${horaConDia(v.hora_toma)}`}
                      >
                        {enAvisoPrevio && '⚠️ '}
                        {horaConDia(v.hora_programada)}
                        {mins != null && (
                          <small className="badge-prog-tiempo">
                            {' · '}
                            {mins <= 0
                              ? 'ya'
                              : mins < 60
                                ? `en ${mins}m`
                                : `en ${Math.floor(mins / 60)}h ${mins % 60}m`}
                          </small>
                        )}
                      </span>
                    ) : (
                      <span
                        className="badge-prog-asignado"
                        title={v.cancelado ? 'Viaje programado anulado' : `Viaje programado asignado a ${v.chofer || 'chofer'}`}
                      >
                        {horaConDia(v.hora_programada)}
                      </span>
                    )
                  ) : (
                    <span className="tenue">—</span>
                  )}
                </td>
                <td className="col-cancel" onClick={(e) => e.stopPropagation()}>
                  <label
                    className="label-cancel"
                    title={v.cancelado ? 'Viaje anulado (click para restaurar)' : 'Marcar viaje como anulado'}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-cancel"
                      checked={Boolean(v.cancelado)}
                      disabled={!editable || !puedeCancelar}
                      onChange={(e) => cambiarCancelado(e, v)}
                    />
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {viajeFichaId != null && (
        <FichaViajeModal
          viajeId={viajeFichaId}
          choferes={choferes}
          editable={editable}
          onClose={() => setViajeFichaId(null)}
          onGuardado={() => onActualizado?.()}
        />
      )}
    </>
  );
}

