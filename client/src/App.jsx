import { useCallback, useEffect, useState } from 'react';
import { api, leerSesion, guardarSesion, onSesionExpirada, conectarSocket } from './api.js';
import Login from './Login.jsx';
import Recepcion from './Recepcion.jsx';
import ChoferesTurno from './ChoferesTurno.jsx';
import Historial from './Historial.jsx';
import Admin from './Admin.jsx';
import Reloj from './Reloj.jsx';

const SECCIONES = [
  { id: 'recepcion', nombre: 'Recepción' },
  { id: 'choferes', nombre: 'Choferes del turno' },
  { id: 'historial', nombre: 'Historial' },
  { id: 'admin', nombre: 'Administración', soloAdmin: true },
];

export default function App() {
  const [sesion, setSesion] = useState(leerSesion);
  const [seccion, setSeccion] = useState('recepcion');
  const [turnos, setTurnos] = useState(null);
  const [socket, setSocket] = useState(null);

  const salir = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
  }, []);

  useEffect(() => onSesionExpirada(salir), [salir]);

  const cargarTurnos = useCallback(() => {
    api('/turnos/actual').then(setTurnos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sesion) return undefined;
    const s = conectarSocket(sesion.token);
    setSocket(s);
    cargarTurnos();
    s.on('turno', cargarTurnos);
    s.on('connect', cargarTurnos);
    const intervalo = setInterval(cargarTurnos, 60_000);
    return () => {
      clearInterval(intervalo);
      s.disconnect();
      setSocket(null);
    };
  }, [sesion, cargarTurnos]);

  if (!sesion) {
    return <Login onIngreso={(s) => { guardarSesion(s); setSesion(s); }} />;
  }

  const esAdmin = sesion.operador.rol === 'admin';

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">🚕 Recepción</div>
        <nav>
          {SECCIONES.filter((s) => !s.soloAdmin || esAdmin).map((s) => (
            <button
              key={s.id}
              className={seccion === s.id ? 'tab activa' : 'tab'}
              onClick={() => setSeccion(s.id)}
            >
              {s.nombre}
            </button>
          ))}
        </nav>
        <div className="barra-derecha">
          {turnos && <span className="turno-actual">Turno {turnos.actual.etiqueta}</span>}
          <Reloj />
          <span className="operador">{sesion.operador.nombre}</span>
          <button className="btn-link" onClick={salir}>Salir</button>
        </div>
      </header>

      <main className="contenido">
        {!turnos || !socket ? (
          <p className="cargando">Cargando…</p>
        ) : (
          <>
            {/* Recepción queda montada para no perder lo que se estaba escribiendo */}
            <div hidden={seccion !== 'recepcion'}>
              <Recepcion turnos={turnos} socket={socket} activa={seccion === 'recepcion'} />
            </div>
            {seccion === 'choferes' && <ChoferesTurno turnos={turnos} socket={socket} esAdmin={esAdmin} />}
            {seccion === 'historial' && <Historial turnos={turnos} />}
            {seccion === 'admin' && esAdmin && <Admin operadorId={sesion.operador.id} />}
          </>
        )}
      </main>
    </div>
  );
}
