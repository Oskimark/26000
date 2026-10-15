import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { api } from './api.js';
import { CampoChofer } from './Campos.jsx';
import { hora } from './formato.js';

/**
 * Llegó la hora de un viaje programado: se muestran sus datos y se pide el chofer.
 * Enter asigna · Esc pospone (para atender otro llamado).
 */
const Despacho = forwardRef(function Despacho({ viaje, choferes, pendientes, onPosponer, onAsignado }, ref) {
  const [choferId, setChoferId] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const choferRef = useRef(null);
  // Chofer elegido en un render anterior (el primer Enter elige, el segundo asigna)
  const choferIdPrevio = useRef(null);
  choferIdPrevio.current = choferId;

  useImperativeHandle(ref, () => ({ focus: () => choferRef.current?.focus() }));

  useEffect(() => {
    setChoferId(null);
    setError('');
    const t = setTimeout(() => choferRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [viaje.id]);

  async function asignar(id = choferId) {
    if (!id) { setError('Elegí un chofer'); choferRef.current?.focus(); return; }
    setGuardando(true);
    try {
      await api(`/viajes/${viaje.id}/chofer`, { method: 'PUT', body: { choferId: id } });
      onAsignado?.(viaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="despacho"
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); onPosponer(viaje); }
      }}
    >
      <div className="despacho-titulo">
        <span className="alerta-pulso">⏰</span>
        <b>VIAJE PROGRAMADO · N° {viaje.numero}</b>
        <span>para las {hora(viaje.hora_programada)}</span>
        {pendientes > 1 && <span className="chip">{pendientes - 1} más en espera</span>}
      </div>

      <div className="campos">
        <div className="campo">
          <span>Teléfono</span>
          <div className="dato">{viaje.telefono || '—'}</div>
        </div>
        <div className="campo campo-dir">
          <span>Dirección</span>
          <div className="dato dato-grande">{viaje.direccion}</div>
        </div>
        <label className="campo campo-chofer">
          <span>Chofer</span>
          <CampoChofer
            ref={choferRef}
            choferes={choferes}
            choferId={choferId}
            onCambio={setChoferId}
            onListo={() => { if (choferIdPrevio.current) asignar(choferIdPrevio.current); }}
          />
        </label>
        <div className="despacho-acciones">
          <button className="btn primario" disabled={guardando} onClick={() => asignar()}>
            Asignar <kbd>Enter</kbd>
          </button>
          <button className="btn" onClick={() => onPosponer(viaje)}>
            Posponer <kbd>Esc</kbd>
          </button>
        </div>
      </div>

      <div className="form-pie">
        {error ? <span className="error">{error}</span> : (
          <span className="ayuda">
            Tomado por {viaje.operador || '—'} a las {hora(viaje.hora_toma)}.
            Elegí el chofer y <kbd>Enter</kbd> para asignar (un segundo <kbd>Enter</kbd> confirma).
          </span>
        )}
      </div>
    </div>
  );
});

export default Despacho;
