import { useState } from 'react';
import { api } from './api.js';
import { hora, horaConDia } from './formato.js';
import TelefonoWhatsApp from './TelefonoWhatsApp.jsx';

function minutosHasta(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function CeldaAsignado({ viaje, editable }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  const horaAsig = viaje.hora_asignacion || viaje.hora_fin;

  async function guardar(body) {
    try {
      await api(`/viajes/${viaje.id}/fin`, { method: 'PUT', body });
      setEditando(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (viaje.cancelado) return <td className="col-fin" />;

  if (editando) {
    return (
      <td className="col-fin">
        <input
          className="input-fin"
          autoFocus
          value={texto}
          placeholder="hh:mm"
          title={error || 'Enter guarda · vacío = ahora · Esc cancela'}
          onChange={(e) => setTexto(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') guardar({ hora: texto });
            if (e.key === 'Escape') { e.stopPropagation(); setEditando(false); }
          }}
          onBlur={() => setEditando(false)}
        />
      </td>
    );
  }

  if (horaAsig) {
    return (
      <td className="col-fin">
        <button
          className="btn-hora"
          disabled={!editable}
          title={editable ? 'Hora de asignación de chofer (click para corregir)' : 'Hora de asignación'}
          onClick={() => { setTexto(hora(horaAsig)); setEditando(true); }}
        >
          {hora(horaAsig)}
        </button>
      </td>
    );
  }

  return (
    <td className="col-fin">
      <span className="tenue">—</span>
    </td>
  );
}

function CeldaAvisado({ viaje, editable }) {
  const [guardando, setGuardando] = useState(false);
  const [editandoHora, setEditandoHora] = useState(false);
  const [texto, setTexto] = useState('');

  if (viaje.cancelado) return <td className="col-avisado" />;

  const fueAvisado = Boolean(viaje.hora_avisado);

  async function marcarAvisado() {
    if (!editable || guardando) return;
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

  async function guardarHoraManual() {
    try {
      await api(`/viajes/${viaje.id}/avisado`, {
        method: 'PUT',
        body: { avisado: true, hora: texto },
      });
      setEditandoHora(false);
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (!editable) {
    return (
      <td className="col-avisado">
        {fueAvisado ? (
          <div className="celda-avisado-wrap">
            <span className="btn-estado-avisado">Avisado</span>
            <b className="hora-avisado-texto">{hora(viaje.hora_avisado)}</b>
          </div>
        ) : (
          <span className="tenue">—</span>
        )}
      </td>
    );
  }

  return (
    <td className="col-avisado">
      <div className="celda-avisado-wrap">
        <button
          type="button"
          className={fueAvisado ? 'btn-avisado' : 'btn-avisar'}
          disabled={guardando}
          onClick={marcarAvisado}
          title={
            fueAvisado
              ? `Avisado a las ${hora(viaje.hora_avisado)} (click para desmarcar)`
              : 'Click para marcar como avisado al chofer'
          }
        >
          {fueAvisado ? 'Avisado' : 'Avisar'}
        </button>

        {fueAvisado && (
          editandoHora ? (
            <input
              className="input-fin"
              autoFocus
              value={texto}
              placeholder="hh:mm"
              onChange={(e) => setTexto(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarHoraManual();
                if (e.key === 'Escape') { e.stopPropagation(); setEditandoHora(false); }
              }}
              onBlur={() => setEditandoHora(false)}
            />
          ) : (
            <button
              type="button"
              className="btn-hora"
              title="Hora en que fue avisado (click para corregir)"
              onClick={() => {
                setTexto(hora(viaje.hora_avisado));
                setEditandoHora(true);
              }}
            >
              {hora(viaje.hora_avisado)}
            </button>
          )
        )}
      </div>
    </td>
  );
}

function CeldaChofer({ viaje, choferes = [], editable, onAtender }) {
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

  if (!editable || viaje.cancelado) {
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
    <td className="col-chofer-celda">
      <div className="chofer-celda-acciones">
        <select
          className={viaje.chofer_id ? 'select-chofer-tabla asignado' : 'select-chofer-tabla sin-asignar'}
          value={viaje.chofer_id ?? ''}
          disabled={guardando}
          onChange={(e) => cambiarChofer(e.target.value)}
          title="Asignar o cambiar chofer en cualquier momento"
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
            onClick={() => onAtender(viaje)}
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
 * Listado del turno: ejecutados por N°, luego los programados pendientes por hora.
 */
export default function ListaViajes({
  viajes,
  choferes = [],
  minutosAviso = 5,
  editable = true,
  onAtender,
}) {
  async function cambiarCancelado(v) {
    const accion = v.cancelado ? 'restaurar' : 'anular';
    const desc = v.numero ? `N° ${v.numero}` : `programado de las ${hora(v.hora_programada)}`;
    if (!window.confirm(`¿Seguro que querés ${accion} el viaje ${desc} (${v.direccion})?`)) return;
    try {
      await api(`/viajes/${v.id}/cancelado`, { method: 'PUT', body: { cancelado: !v.cancelado } });
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (!viajes.length) return <p className="vacio">Todavía no hay viajes en este turno.</p>;

  return (
    <table className="tabla-viajes">
      <thead>
        <tr>
          <th className="col-num">N°</th>
          <th className="col-dir">Dirección</th>
          <th className="col-hora">Hora Inicio</th>
          <th className="col-fin">Asignado</th>
          <th className="col-avisado">Avisado</th>
          <th>Chofer</th>
          <th>Teléfono</th>
          <th className="col-prog">Programado</th>
          {editable && <th className="col-acc" />}
        </tr>
      </thead>
      <tbody>
        {viajes.map((v) => {
          const pendiente = v.numero == null;
          const mins = v.programado ? minutosHasta(v.hora_programada) : null;
          const enAvisoPrevio =
            v.programado && !v.cancelado && mins != null && mins <= minutosAviso && (!v.chofer_id || !v.hora_avisado);
          const sinChofer = !v.chofer_id && !v.cancelado && (!v.programado || !pendiente || enAvisoPrevio);
          const clases = [
            pendiente && 'fila-pendiente',
            sinChofer && 'fila-sin-chofer',
            enAvisoPrevio && 'fila-aviso-programado',
            v.cancelado && 'fila-anulada',
            !pendiente && !v.cancelado && v.chofer_id && !v.hora_avisado && 'fila-en-curso',
          ].filter(Boolean).join(' ');

          return (
            <tr key={v.id} className={clases}>
              <td className="col-num">{pendiente ? '—' : v.numero}</td>
              <td className="col-dir">
                <span className="texto-direccion">{v.direccion}</span>
              </td>
              <td className="col-hora" title={`Creado ${horaConDia(v.hora_toma)} por ${v.operador || '—'}`}>
                <b>{hora(v.hora_toma)}</b>
                <div className="subtexto-op">{v.operador}</div>
              </td>
              <CeldaAsignado viaje={v} editable={editable} />
              <CeldaAvisado viaje={v} editable={editable} />
              <CeldaChofer viaje={v} choferes={choferes} editable={editable} onAtender={onAtender} />
              <td>
                <TelefonoWhatsApp telefono={v.telefono} />
              </td>
              <td className="col-prog">
                {v.programado ? (
                  <span
                    className={enAvisoPrevio ? 'badge-prog aviso-previo' : 'badge-prog'}
                    title={`Creado por ${v.operador || '—'} a las ${horaConDia(v.hora_toma)}`}
                  >
                    {enAvisoPrevio && '⚠️ '}
                    {hora(v.hora_programada)}
                    {mins != null && !v.hora_avisado && (
                      <small>
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
              {editable && (
                <td className="col-acc">
                  <button className="btn-link chico" onClick={() => cambiarCancelado(v)}>
                    {v.cancelado ? 'Restaurar' : 'Anular'}
                  </button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
