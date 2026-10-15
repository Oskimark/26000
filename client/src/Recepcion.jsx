import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import FormViaje from './FormViaje.jsx';
import Despacho from './Despacho.jsx';
import ListaViajes from './ListaViajes.jsx';
import { horaConDia } from './formato.js';

export default function Recepcion({ turnos, socket, activa }) {
  const [choferes, setChoferes] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [futuros, setFuturos] = useState([]);
  const [pospuestos, setPospuestos] = useState(new Set());
  const [atendiendoManual, setAtendiendoManual] = useState(null);
  const [formVacio, setFormVacio] = useState(true);

  const formRef = useRef(null);
  const despachoRef = useRef(null);

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
    } catch (err) {
      console.error('Error al cargar datos del turno:', err);
    }
  }, [tActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!socket) return;
    const alRecibirViajes = () => cargarDatos();
    const alRecibirChoferes = () => cargarDatos();

    socket.on('viajes', alRecibirViajes);
    socket.on('choferes', alRecibirChoferes);
    return () => {
      socket.off('viajes', alRecibirViajes);
      socket.off('choferes', alRecibirChoferes);
    };
  }, [socket, cargarDatos]);

  // Viajes ya ejecutados en este turno que aún no tienen chofer asignado y no están cancelados
  const sinChofer = useMemo(() => {
    return viajes.filter((v) => v.numero != null && !v.chofer_id && !v.cancelado);
  }, [viajes]);

  // El viaje a despachar: o el seleccionado manualmente, o el primer sinChofer que no esté pospuesto
  // SIEMPRE que el formulario no tenga texto a medio escribir por el operador (salvo que lo fuerce con click/F2)
  const viajeADespachar = useMemo(() => {
    if (atendiendoManual) {
      const sigue = sinChofer.find((v) => v.id === atendiendoManual.id);
      if (sigue) return sigue;
    }
    if (!formVacio) return null; // No interrumpir al operador si está tipeando un viaje nuevo
    return sinChofer.find((v) => !pospuestos.has(v.id)) || null;
  }, [atendiendoManual, sinChofer, formVacio, pospuestos]);

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
  // F2: atender el primer viaje sin chofer / pospuesto
  // F1 o Esc (cuando no está en despacho): foco al formulario
  useEffect(() => {
    if (!activa) return;
    function onKeyDown(e) {
      if (e.key === 'F2') {
        e.preventDefault();
        if (sinChofer.length > 0) {
          handleAtenderManual(sinChofer[0]);
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        setAtendiendoManual(null);
        formRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activa, sinChofer]);

  const pospuestosCount = sinChofer.filter((v) => pospuestos.has(v.id)).length;
  const totalViajes = viajes.filter((v) => v.numero != null && !v.cancelado).length;

  return (
    <div className="recepcion-contenedor">
      {/* Barra superior de alertas de despacho */}
      {sinChofer.length > 0 && !viajeADespachar && (
        <div className="barra-aviso-despacho">
          <span>
            ⚠️ Hay <b>{sinChofer.length}</b> viaje(s) programado(s) pendientes de asignar chofer.
          </span>
          <button className="btn chico alerta" onClick={() => handleAtenderManual(sinChofer[0])}>
            Atender despacho <kbd>F2</kbd>
          </button>
        </div>
      )}

      {/* Panel dinámico: Despacho O Formulario de nuevo viaje */}
      <section className="tarjeta seccion-panel-ingreso">
        {viajeADespachar ? (
          <Despacho
            ref={despachoRef}
            viaje={viajeADespachar}
            choferes={choferes}
            pendientes={sinChofer.length}
            onPosponer={handlePosponer}
            onAsignado={handleAsignado}
          />
        ) : (
          <FormViaje
            ref={formRef}
            choferes={choferes}
            onGuardado={() => {
              cargarDatos();
            }}
            onVacioCambio={setFormVacio}
          />
        )}
      </section>

      {/* Listado de viajes del turno */}
      <section className="seccion-listado">
        <div className="listado-cabecera">
          <div className="titulos-listado">
            <h2>Viajes del turno actual</h2>
            <span className="resumen-viajes">
              <b>{totalViajes}</b> realizados · <b>{choferes.length}</b> choferes en turno
            </span>
          </div>
          {choferes.length === 0 && (
            <div className="alerta-sin-choferes">
              Atención: No hay choferes asignados a este turno. Podés agregarlos en la pestaña <i>Choferes del turno</i>.
            </div>
          )}
        </div>

        <div className="tarjeta listado-tarjeta">
          <ListaViajes viajes={viajes} editable={true} onAtender={handleAtenderManual} />
        </div>
      </section>

      {/* Programados de turnos posteriores */}
      {futuros.length > 0 && (
        <section className="seccion-futuros">
          <h3>📅 Programados para próximos turnos ({futuros.length})</h3>
          <div className="tarjeta tabla-futuros-wrap">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Turno</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Tomado por</th>
                </tr>
              </thead>
              <tbody>
                {futuros.map((f) => (
                  <tr key={f.id} className="fila-pendiente">
                    <td>{horaConDia(f.hora_programada)}</td>
                    <td>{f.fecha_turno} ({f.tipo_turno === 'A' ? '03 a 15' : '15 a 03'})</td>
                    <td>{f.telefono}</td>
                    <td className="col-dir">{f.direccion}</td>
                    <td className="tenue">{f.operador || '—'} a las {horaConDia(f.hora_toma)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
