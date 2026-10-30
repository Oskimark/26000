import { useState, useMemo, useEffect } from 'react';
import { api, leerSesion } from './api.js';
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

function CeldaAvisado({ viaje, editable, puedeAvisar = true }) {
  const [guardando, setGuardando] = useState(false);

  if (viaje.cancelado) return <td className="col-avisado" />;

  const fueAvisado = Boolean(viaje.hora_avisado);
  const opAvisado = viaje.avisado_por_nombre || '';

  async function marcarAvisado(e) {
    e.stopPropagation();
    if (!editable || guardando) return;
    if (!fueAvisado && !viaje.chofer_id) {
      window.alert('⚠️ Primero tenés que asignar un chofer antes de avisar.');
      return;
    }
    setGuardando(true);
    try {
      await api(`/viajes/${viaje.id}/avisado`, {
        method: 'PUT',
        body: { avisado: !fueAvisado },
      });
    } catch (err) {
      window.alert(err.message);
    } finally {
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

  return (
    <td className="col-avisado" onClick={(e) => e.stopPropagation()}>
      <div className="celda-avisado-wrap">
        <button
          type="button"
          className={fueAvisado ? 'btn-avisado' : 'btn-avisar'}
          disabled={guardando}
          onClick={marcarAvisado}
          title={
            fueAvisado
              ? `Asignado a las ${hora(viaje.hora_avisado)}${opAvisado ? ` por ${opAvisado}` : ''} (click para desmarcar)`
              : viaje.chofer_id
                ? 'Click para marcar como asignado al chofer'
                : 'Primero asigná un chofer para poder marcar como asignado'
          }
        >
          {fueAvisado ? 'Asignado' : 'Asignar'}
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

function CeldaChofer({ viaje, choferes = [], editable, puedeAsignarChofer = true, onAtender }) {
  const [guardando, setGuardando] = useState(false);

  async function cambiarChofer(nuevoId) {
    setGuardando(true);
    try {
      await api(`/viajes/${viaje.id}/chofer`, {
        method: 'PUT',
        body: { choferId: nuevoId ? Number(nuevoId) : null },
      });
    } catch (err) {
      window.alert(err.message);
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
  if (viaje.chofer_id && !opciones.some((c) => c.id === viaje.chofer_id)) {
    opciones.unshift({ id: viaje.chofer_id, nombre: viaje.chofer || `Chofer #${viaje.chofer_id}` });
  }

  return (
    <td className="col-chofer-celda" onClick={(e) => e.stopPropagation()}>
      <div className="chofer-celda-acciones">
        <select
          className={viaje.chofer_id ? 'select-chofer-tabla asignado' : 'select-chofer-tabla sin-asignar'}
          value={viaje.chofer_id ?? ''}
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
        {!viaje.chofer_id && onAtender && (
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
    const accion = v.cancelado ? 'restaurar' : 'anular';
    const desc = v.numero != null
      ? `N° ${v.numero_formateado || formatearNumeroViaje(v.numero, v.tipo_turno)}`
      : `programado de las ${hora(v.hora_programada)}`;
    if (!window.confirm(`¿Seguro que querés ${accion} el viaje ${desc} (${v.direccion})?`)) return;
    try {
      await api(`/viajes/${v.id}/cancelado`, { method: 'PUT', body: { cancelado: !v.cancelado } });
      onActualizado?.();
    } catch (err) {
      window.alert(err.message);
    }
  }

  const sesionOp = leerSesion()?.operador;
  const puedeCancelar = editable && tienePermiso(sesionOp, 'recepcion_cancelar');
  const puedeAsignarChofer = editable && tienePermiso(sesionOp, 'recepcion_chofer');
  const puedeAvisar = editable && tienePermiso(sesionOp, 'recepcion_avisar');
  const puedeAbrirFicha = tienePermiso(sesionOp, 'recepcion_ficha');

  if (!viajesVisibles.length) return <p className="vacio">{esReferencia ? "No hay viajes registrados en el turno anterior." : "Todavía no hay viajes en este turno."}</p>;

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
            {puedeCancelar && <th className="col-acc" />}
          </tr>
        </thead>
        <tbody>
          {viajesVisibles.map((v) => {
            const pendiente = v.numero == null;
            const mins = v.programado ? minutosHasta(v.hora_programada, ahoraMs) : null;
            const enAvisoPrevio =
              v.programado && !v.cancelado && mins != null && mins <= minutosAviso && (!v.chofer_id || !v.hora_avisado);
            const sinChofer = !v.chofer_id && !v.cancelado;
            const clases = [
              puedeAbrirFicha && 'fila-clickeable',
              pendiente && 'fila-pendiente',
              sinChofer && 'fila-sin-chofer',
              enAvisoPrevio && 'fila-aviso-programado',
              v.cancelado && 'fila-anulada',
              !pendiente && !v.cancelado && v.chofer_id && !v.hora_avisado && 'fila-en-curso',
            ].filter(Boolean).join(' ');

            return (
              <tr
                key={v.id}
                className={clases}
                onClick={() => { if (puedeAbrirFicha) setViajeFichaId(v.id); }}
                title={puedeAbrirFicha ? 'Click para abrir la Ficha de Viaje y ver su historial' : undefined}
              >
                <td className="col-num">{pendiente ? '—' : (v.numero_formateado || formatearNumeroViaje(v.numero, v.tipo_turno))}</td>
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
                <td className={`col-prog ${v.programado ? 'col-prog-activo' : ''}`}>
                  {v.programado ? (
                    <span
                      className={enAvisoPrevio ? 'badge-prog aviso-previo' : 'badge-prog'}
                      title={`Creado por ${v.operador || '—'} a las ${horaConDia(v.hora_toma)}`}
                    >
                      {enAvisoPrevio && '⚠️ '}
                      {hora(v.hora_programada)}
                      {mins != null && !v.hora_avisado && (
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
                    <span className="tenue">—</span>
                  )}
                </td>
                {puedeCancelar && (
                  <td className="col-acc" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-link chico" onClick={(e) => cambiarCancelado(e, v)}>
                      {v.cancelado ? 'Restaurar' : 'Anular'}
                    </button>
                  </td>
                )}
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

