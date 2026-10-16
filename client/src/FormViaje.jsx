import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { api } from './api.js';
import { CampoDireccion, CampoChofer } from './Campos.jsx';
import { parsearHora, proximaOcurrencia } from '../../shared/turnos.js';
import { horaConDia } from './formato.js';
import { urlWhatsApp, IconoWhatsApp } from './TelefonoWhatsApp.jsx';

/** Formulario de nuevo viaje: Teléfono → Dirección → Chofer → Programado → Enter guarda. */
const FormViaje = forwardRef(function FormViaje({ choferes, onGuardado, onVacioCambio }, ref) {
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [choferId, setChoferId] = useState(null);
  const [hora, setHora] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const telRef = useRef(null);
  const dirRef = useRef(null);
  const choferRef = useRef(null);
  const horaRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => telRef.current?.focus() }));

  const vacio = !telefono && !direccion && !choferId && !hora;
  useEffect(() => { onVacioCambio?.(vacio); }, [vacio, onVacioCambio]);

  // Si el chofer elegido deja de estar en el turno, se limpia.
  useEffect(() => {
    if (choferId && !choferes.some((c) => c.id === choferId)) setChoferId(null);
  }, [choferes, choferId]);

  const programado = hora.trim() !== '';
  const hm = programado ? parsearHora(hora) : null;
  const programadaPara = hm ? proximaOcurrencia(hm, new Date()) : null;

  function limpiar() {
    setTelefono(''); setDireccion(''); setChoferId(null); setHora(''); setError('');
    telRef.current?.focus();
  }

  async function guardar() {
    if (guardando) return;
    setError('');
    if (!direccion.trim()) { setError('Falta la dirección'); dirRef.current?.focus(); return; }
    if (programado && !hm) { setError('Hora programada inválida (ej: 1830)'); horaRef.current?.focus(); return; }
    if (!programado && !choferId) { setError('Elegí un chofer'); choferRef.current?.focus(); return; }
    setGuardando(true);
    try {
      const viaje = await api('/viajes', {
        method: 'POST',
        body: { telefono, direccion, choferId: programado ? null : choferId, horaProgramada: hora },
      });
      onGuardado?.(viaje);
      limpiar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Ctrl+Enter guarda desde cualquier campo
  function onKeyDownForm(e) {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); guardar(); }
  }

  const linkWA = urlWhatsApp(telefono);

  return (
    <div className="form-viaje" onKeyDown={onKeyDownForm}>
      <div className="campos">
        <label className="campo campo-tel">
          <span>Teléfono</span>
          <div className="input-con-whatsapp">
            <input
              ref={telRef}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s+-]/g, ''))}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' && !e.ctrlKey) || (e.key === 'Tab' && !e.shiftKey)) {
                  e.preventDefault();
                  dirRef.current?.focus();
                }
              }}
              placeholder="Número"
              inputMode="tel"
              autoComplete="off"
              autoFocus
            />
            {linkWA && (
              <a
                href={linkWA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-input"
                title="Enviar WhatsApp a este número"
                tabIndex={-1}
              >
                <IconoWhatsApp size={18} />
              </a>
            )}
          </div>
        </label>

        <label className="campo campo-dir">
          <span>Dirección</span>
          <CampoDireccion
            ref={dirRef}
            valor={direccion}
            onCambio={setDireccion}
            telefono={telefono.replace(/\D/g, '')}
            onListo={() => choferRef.current?.focus()}
          />
        </label>

        <label className="campo campo-chofer">
          <span>Chofer</span>
          <CampoChofer
            ref={choferRef}
            choferes={choferes}
            choferId={choferId}
            onCambio={setChoferId}
            deshabilitado={programado}
            onListo={() => horaRef.current?.focus()}
          />
        </label>

        <label className="campo campo-prog">
          <span>Programado</span>
          <div className={`prog ${programado ? 'si' : 'no'}`}>
            <b>{programado ? 'SÍ' : 'NO'}</b>
            <input
              ref={horaRef}
              value={hora}
              onChange={(e) => setHora(e.target.value.replace(/[^\d:.]/g, '').slice(0, 5))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); guardar(); }
                if (e.key === 'Escape' && hora) { e.stopPropagation(); setHora(''); }
              }}
              placeholder="hora"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </label>

        <button className="btn primario btn-guardar" onClick={guardar} disabled={guardando}>
          Guardar <kbd>Enter</kbd>
        </button>
      </div>

      <div className="form-pie">
        {error ? (
          <span className="error">{error}</span>
        ) : programado ? (
          programadaPara ? (
            <span className="info">⏰ Programado para las <b>{horaConDia(programadaPara)}</b>. El chofer se asigna al llegar la hora.</span>
          ) : (
            <span className="error">Hora inválida (ej: 1830, 9, 0130)</span>
          )
        ) : (
          <span className="ayuda">
            <kbd>Tab</kbd> usar sugerencia · <kbd>↑</kbd><kbd>↓</kbd> elegir · <kbd>Enter</kbd> siguiente / guardar ·
            escribí una hora en <i>Programado</i> para agendar
          </span>
        )}
        {!vacio && <button className="btn-link" onClick={limpiar}>Limpiar</button>}
      </div>
    </div>
  );
});

export default FormViaje;
