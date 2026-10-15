import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

export default function ChoferesTurno({ turnos, socket }) {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('actual');
  const [todosChoferes, setTodosChoferes] = useState([]);
  const [asignadosIds, setAsignadosIds] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const turno = turnoSeleccionado === 'actual' ? turnos.actual : turnos.siguiente;

  const cargarChoferesYTurno = useCallback(async () => {
    if (!turno) return;
    setCargando(true);
    try {
      const [listaTodos, listaTurno] = await Promise.all([
        api('/choferes'),
        api(`/turnos/${turno.fecha}/${turno.tipo}/choferes`),
      ]);
      setTodosChoferes(listaTodos.filter((c) => c.activo));
      setAsignadosIds(new Set(listaTurno.map((c) => c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [turno]);

  useEffect(() => {
    cargarChoferesYTurno();
  }, [cargarChoferesYTurno]);

  useEffect(() => {
    if (!socket) return;
    const alCambiar = () => cargarChoferesYTurno();
    socket.on('choferes', alCambiar);
    return () => socket.off('choferes', alCambiar);
  }, [socket, cargarChoferesYTurno]);

  function toggle(id) {
    setAsignadosIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMensaje('');
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    try {
      await api(`/turnos/${turno.fecha}/${turno.tipo}/choferes`, {
        method: 'PUT',
        body: { choferIds: Array.from(asignadosIds) },
      });
      setMensaje('Choferes guardados exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiarAnterior() {
    if (!turnos.anterior) return;
    try {
      const listaAnt = await api(`/turnos/${turnos.anterior.fecha}/${turnos.anterior.tipo}/choferes`);
      setAsignadosIds(new Set(listaAnt.map((c) => c.id)));
      setMensaje('Copiados choferes del turno anterior. Recordá dar click en Guardar.');
    } catch (err) {
      alert('Error al copiar del turno anterior: ' + err.message);
    }
  }

  return (
    <div className="choferes-turno-wrap">
      <div className="selector-turnos-pestanias">
        <button
          className={turnoSeleccionado === 'actual' ? 'btn primario' : 'btn'}
          onClick={() => setTurnoSeleccionado('actual')}
        >
          Turno actual: {turnos.actual?.etiqueta}
        </button>
        <button
          className={turnoSeleccionado === 'siguiente' ? 'btn primario' : 'btn'}
          onClick={() => setTurnoSeleccionado('siguiente')}
        >
          Próximo turno: {turnos.siguiente?.etiqueta}
        </button>
      </div>

      <div className="tarjeta seccion-choferes-asignacion">
        <div className="cabecera-panel">
          <div>
            <h2>Choferes para el {turno?.etiqueta}</h2>
            <p className="descripcion">
              Marcá los choferes que prestarán servicio durante este turno. Aparecerán en la lista desplegable de recepción.
            </p>
          </div>
          <div className="acciones-rapidas">
            <button className="btn" onClick={copiarAnterior} title="Copia la lista del turno previo">
              Copiar del turno anterior
            </button>
            <button className="btn primario" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : `Guardar asignación (${asignadosIds.size})`}
            </button>
          </div>
        </div>

        {mensaje && (
          <div className={mensaje.startsWith('Error') ? 'alerta error' : 'alerta exito'}>
            {mensaje}
          </div>
        )}

        {cargando ? (
          <p className="cargando">Cargando lista de choferes…</p>
        ) : todosChoferes.length === 0 ? (
          <p className="vacio">
            No hay choferes cargados en el sistema. Creá choferes en la pestaña de <i>Administración</i>.
          </p>
        ) : (
          <div className="grilla-choferes">
            {todosChoferes.map((c) => {
              const activo = asignadosIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className={`tarjeta-chofer ${activo ? 'seleccionado' : ''}`}
                  onClick={() => toggle(c.id)}
                >
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={() => {}} // Manejado por el click en la tarjeta
                  />
                  <span className="nombre-chofer">{c.nombre}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
