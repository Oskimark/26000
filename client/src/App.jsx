import { useCallback, useEffect, useState } from 'react';
import { api, leerSesion, guardarSesion, onSesionExpirada, conectarSocket } from './api.js';
import Login from './Login.jsx';
import Recepcion from './Recepcion.jsx';
import ChoferesTurno from './ChoferesTurno.jsx';
import Historial from './Historial.jsx';
import Clientes from './Clientes.jsx';
import Admin from './Admin.jsx';
import Reloj from './Reloj.jsx';
import ModalCambioTurno from './ModalCambioTurno.jsx';
import { leerTema, guardarTema } from './tema.js';
import { tienePermiso } from '../../shared/permisos.js';

const SECCIONES = [
  { id: 'recepcion', nombre: 'Recepción', permiso: 'recepcion' },
  { id: 'choferes', nombre: 'Choferes del turno', permiso: 'choferes' },
  { id: 'historial', nombre: 'Historial', permiso: 'historial' },
  { id: 'clientes', nombre: 'Clientes', permiso: 'clientes' },
  { id: 'admin', nombre: 'Administración', permiso: 'admin' },
];

export default function App() {
  const [sesion, setSesion] = useState(leerSesion);
  const [seccion, setSeccion] = useState('recepcion');
  const [turnos, setTurnos] = useState(null);
  const [socket, setSocket] = useState(null);
  const [modalCambioTurnoAbierto, setModalCambioTurnoAbierto] = useState(false);

  const salir = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
  }, []);

  useEffect(() => onSesionExpirada(salir), [salir]);

  // Actualizar datos del operador (incluyendo permisos actualizados)
  useEffect(() => {
    if (!sesion) return;
    api('/yo')
      .then((op) => {
        if (op) {
          setSesion((prev) => {
            if (!prev) return null;
            const nuevo = { ...prev, operador: op };
            guardarSesion(nuevo);
            return nuevo;
          });
        }
      })
      .catch(() => {});
  }, []);

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

  const [tema, setTema] = useState(leerTema);

  useEffect(() => {
    const alCambiarTema = (e) => setTema(e.detail);
    window.addEventListener('cambio-tema', alCambiarTema);
    return () => window.removeEventListener('cambio-tema', alCambiarTema);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('tema-oscuro', Boolean(tema.modoOscuro));
  }, [tema.modoOscuro]);

  function alternarModoOscuro() {
    guardarTema({ ...tema, modoOscuro: !tema.modoOscuro });
  }

  if (!sesion) {
    return <Login onIngreso={(s) => { guardarSesion(s); setSesion(s); }} />;
  }

  const esAdmin = sesion.operador.rol === 'admin';
  const seccionesVisibles = SECCIONES.filter((s) => tienePermiso(sesion.operador, s.permiso));

  // Si la sección actual no está permitida, redirigir a la primera permitida
  if (seccionesVisibles.length > 0 && !seccionesVisibles.some((s) => s.id === seccion)) {
    setSeccion(seccionesVisibles[0].id);
  }

  const clasesApp = [
    'app',
    tema.modoOscuro && 'tema-oscuro',
    tema.usarIdentidad && tema.elementos.marcosTarjetas && 'tema-marcos-naranja',
    tema.usarIdentidad && tema.elementos.bordeEtiquetas && 'tema-etiquetas-naranja',
    tema.usarIdentidad && tema.elementos.botonesNaranja && 'tema-botones-naranja',
  ].filter(Boolean).join(' ');

  return (
    <div className={clasesApp}>
      <header className="barra">
        <nav>
          {seccionesVisibles.map((s) => (
            <button
              key={s.id}
              className={seccion === s.id ? 'tab activa' : 'tab'}
              onClick={() => setSeccion(s.id)}
            >
              {s.nombre}
            </button>
          ))}
        </nav>

        {(!tema.usarIdentidad || tema.elementos.mostrarTitulo) && (
          <div className="marca-corporativa">
            TAXI 26000 VEINTISEISMIL
          </div>
        )}

        <div className="barra-derecha">
          <button
            type="button"
            className="btn-modo-oscuro"
            onClick={alternarModoOscuro}
            title={tema.modoOscuro ? 'Cambiar a modo claro' : 'Activar modo oscuro'}
          >
            {tema.modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          {turnos && (
            <button
              type="button"
              className="turno-actual btn-turno-header"
              onClick={() => setModalCambioTurnoAbierto(true)}
              title="Hacé clic para ver estado del turno o realizar Cambio de Turno"
            >
              Turno {turnos.actual.etiqueta}
              <span className="flecha-cambio-turno"> ▾</span>
            </button>
          )}
          <Reloj />
          <span className="operador">{sesion.operador.nombre}</span>
          <button className="btn-link" onClick={salir}>Salir</button>
        </div>
      </header>

      <main className="contenido">
        {!turnos || !socket ? (
          <p className="cargando">Cargando…</p>
        ) : seccionesVisibles.length === 0 ? (
          <div className="alerta error" style={{ margin: '2rem' }}>
            ⚠️ Tu usuario no tiene permisos habilitados para acceder a ninguna sección del sistema. Por favor contactá al administrador.
          </div>
        ) : (
          <>
            {/* Recepción queda montada para no perder lo que se estaba escribiendo */}
            {tienePermiso(sesion.operador, 'recepcion') && (
              <div hidden={seccion !== 'recepcion'}>
                <Recepcion turnos={turnos} socket={socket} activa={seccion === 'recepcion'} />
              </div>
            )}
            {seccion === 'choferes' && tienePermiso(sesion.operador, 'choferes') && (
              <ChoferesTurno turnos={turnos} socket={socket} esAdmin={esAdmin} />
            )}
            {seccion === 'historial' && tienePermiso(sesion.operador, 'historial') && (
              <Historial turnos={turnos} />
            )}
            {seccion === 'clientes' && tienePermiso(sesion.operador, 'clientes') && (
              <Clientes socket={socket} />
            )}
            {seccion === 'admin' && tienePermiso(sesion.operador, 'admin') && (
              <Admin operadorId={sesion.operador.id} esSuperAdmin={esAdmin} />
            )}
          </>
        )}
      </main>

      {modalCambioTurnoAbierto && turnos && (
        <ModalCambioTurno
          turnos={turnos}
          onCerrar={() => setModalCambioTurnoAbierto(false)}
          onSalir={salir}
        />
      )}
    </div>
  );
}
