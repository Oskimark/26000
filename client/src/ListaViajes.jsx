import { useState } from 'react';
import { api } from './api.js';
import { hora, horaConDia } from './formato.js';

function minutosHasta(iso) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function CeldaFin({ viaje, editable }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  async function guardar(body) {
    try {
      await api(`/viajes/${viaje.id}/fin`, { method: 'PUT', body });
      setEditando(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (viaje.numero == null || viaje.cancelado) return <td className="col-fin" />;

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

  if (viaje.hora_fin) {
    return (
      <td className="col-fin">
        <button
          className="btn-hora"
          disabled={!editable}
          title="Click para corregir"
          onClick={() => { setTexto(hora(viaje.hora_fin)); setEditando(true); }}
        >
          {hora(viaje.hora_fin)}
        </button>
      </td>
    );
  }

  return (
    <td className="col-fin">
      {editable && (
        <span className="fin-acciones">
          <button className="btn chico" onClick={() => guardar({})} title="Finalizar ahora">Fin</button>
          <button className="btn-link chico" onClick={() => { setTexto(''); setEditando(true); }} title="Escribir otra hora">✎</button>
        </span>
      )}
    </td>
  );
}

/**
 * Listado del turno: ejecutados por N°, luego los programados pendientes por hora.
 */
export default function ListaViajes({ viajes, editable = true, onAtender }) {
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
          <th className="col-fin">Hora Fin</th>
          <th>Chofer</th>
          <th>Teléfono</th>
          <th className="col-prog">Programado</th>
          {editable && <th className="col-acc" />}
        </tr>
      </thead>
      <tbody>
        {viajes.map((v) => {
          const pendiente = v.numero == null;
          const sinChofer = !pendiente && !v.chofer_id && !v.cancelado;
          const clases = [
            pendiente && 'fila-pendiente',
            sinChofer && 'fila-sin-chofer',
            v.cancelado && 'fila-anulada',
            !pendiente && !v.hora_fin && !v.cancelado && v.chofer_id && 'fila-en-curso',
          ].filter(Boolean).join(' ');
          const mins = pendiente ? minutosHasta(v.hora_programada) : null;
          return (
            <tr key={v.id} className={clases}>
              <td className="col-num">{pendiente ? '—' : v.numero}</td>
              <td className="col-dir">
                <span className="texto-direccion">{v.direccion}</span>
              </td>
              <td className="col-hora" title={`Tomado ${horaConDia(v.hora_toma)} por ${v.operador || '—'}`}>
                <b>{pendiente ? '—' : hora(v.hora_ejecucion || v.hora_toma)}</b>
                <div className="subtexto-op">{v.operador}</div>
              </td>
              <CeldaFin viaje={v} editable={editable} />
              <td>
                {v.chofer || (sinChofer ? (
                  editable && onAtender
                    ? <button className="btn chico alerta" onClick={() => onAtender(v)}>Asignar <kbd>F2</kbd></button>
                    : <span className="chip alerta">Sin chofer</span>
                ) : pendiente ? <span className="tenue">al llegar la hora</span> : '')}
              </td>
              <td>{v.telefono || '—'}</td>
              <td className="col-prog">
                {v.programado ? (
                  <span className="badge-prog" title={`Tomado por ${v.operador || '—'} a las ${horaConDia(v.hora_toma)}`}>
                    {hora(v.hora_programada)}
                    {pendiente && mins != null && (
                      <small> · {mins <= 0 ? 'ya' : mins < 60 ? `en ${mins}m` : `en ${Math.floor(mins / 60)}h ${mins % 60}m`}</small>
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
