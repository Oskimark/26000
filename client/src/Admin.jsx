import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import { leerTema, guardarTema } from './tema.js';

export default function Admin({ operadorId }) {
  const [subtab, setSubtab] = useState('choferes');

  // Choferes
  const [choferes, setChoferes] = useState([]);
  const [nuevoChofer, setNuevoChofer] = useState('');
  const [editChofer, setEditChofer] = useState(null);

  // Operadores
  const [operadores, setOperadores] = useState([]);
  const [nuevoOp, setNuevoOp] = useState({ usuario: '', nombre: '', password: '', rol: 'operador' });
  const [editOp, setEditOp] = useState(null);

  // Identidad corporativa
  const [tema, setTema] = useState(leerTema);

  // Configuración general (aviso previo de viajes programados en minutos)
  const [minutosAviso, setMinutosAviso] = useState(5);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  function actualizarTema(modificaciones) {
    const nuevo = { ...tema, ...modificaciones };
    setTema(nuevo);
    guardarTema(nuevo);
  }

  function toggleElemento(clave) {
    const nuevo = {
      ...tema,
      elementos: {
        ...tema.elementos,
        [clave]: !tema.elementos[clave],
      },
    };
    setTema(nuevo);
    guardarTema(nuevo);
  }

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarChoferes = useCallback(async () => {
    try {
      const data = await api('/choferes');
      setChoferes(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const cargarOperadores = useCallback(async () => {
    try {
      const data = await api('/operadores');
      setOperadores(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const cargarConfiguracion = useCallback(async () => {
    try {
      const cfg = await api('/configuracion');
      if (cfg?.minutosAvisoProgramado != null) {
        setMinutosAviso(cfg.minutosAvisoProgramado);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    if (subtab === 'choferes') cargarChoferes();
    else if (subtab === 'operadores') cargarOperadores();
    else if (subtab === 'configuracion') cargarConfiguracion();
  }, [subtab, cargarChoferes, cargarOperadores, cargarConfiguracion]);

  function mostrarExito(txt) {
    setMensaje(txt);
    setError('');
    setTimeout(() => setMensaje(''), 3000);
  }

  async function guardarConfiguracion(e) {
    e.preventDefault();
    setGuardandoConfig(true);
    try {
      const cfg = await api('/configuracion', {
        method: 'PUT',
        body: { minutosAvisoProgramado: Number(minutosAviso) },
      });
      setMinutosAviso(cfg.minutosAvisoProgramado);
      mostrarExito(`Aviso previo actualizado a ${cfg.minutosAvisoProgramado} minutos antes de la hora programada`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoConfig(false);
    }
  }

  // --- Choferes Handlers ---
  async function agregarChofer(e) {
    e.preventDefault();
    if (!nuevoChofer.trim()) return;
    try {
      await api('/choferes', { method: 'POST', body: { nombre: nuevoChofer } });
      setNuevoChofer('');
      mostrarExito('Chofer agregado correctamente');
      cargarChoferes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarEdicionChofer(e) {
    e.preventDefault();
    if (!editChofer.nombre.trim()) return;
    try {
      await api(`/choferes/${editChofer.id}`, {
        method: 'PUT',
        body: { nombre: editChofer.nombre, activo: editChofer.activo },
      });
      setEditChofer(null);
      mostrarExito('Chofer actualizado');
      cargarChoferes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarChofer(chofer) {
    if (!window.confirm(`¿Seguro que querés ELIMINAR al chofer "${chofer.nombre}"?`)) return;
    try {
      await api(`/choferes/${chofer.id}`, { method: 'DELETE' });
      if (editChofer?.id === chofer.id) setEditChofer(null);
      mostrarExito(`Chofer "${chofer.nombre}" eliminado correctamente`);
      cargarChoferes();
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Operadores Handlers ---
  async function agregarOperador(e) {
    e.preventDefault();
    try {
      await api('/operadores', { method: 'POST', body: nuevoOp });
      setNuevoOp({ usuario: '', nombre: '', password: '', rol: 'operador' });
      mostrarExito('Operador creado correctamente');
      cargarOperadores();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarEdicionOp(e) {
    e.preventDefault();
    try {
      await api(`/operadores/${editOp.id}`, {
        method: 'PUT',
        body: {
          nombre: editOp.nombre,
          rol: editOp.rol,
          activo: editOp.activo,
          password: editOp.password || undefined,
        },
      });
      setEditOp(null);
      mostrarExito('Operador actualizado');
      cargarOperadores();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-wrap">
      <div className="subtabs">
        <button
          className={subtab === 'choferes' ? 'tab activa' : 'tab'}
          onClick={() => { setSubtab('choferes'); setError(''); }}
        >
          Choferes ({choferes.length})
        </button>
        <button
          className={subtab === 'operadores' ? 'tab activa' : 'tab'}
          onClick={() => { setSubtab('operadores'); setError(''); }}
        >
          Operadores ({operadores.length})
        </button>
        <button
          className={subtab === 'configuracion' ? 'tab activa' : 'tab'}
          onClick={() => { setSubtab('configuracion'); setError(''); }}
        >
          ⚙️ Configuración
        </button>
        <button
          className={subtab === 'identidad' ? 'tab activa' : 'tab'}
          onClick={() => { setSubtab('identidad'); setError(''); }}
        >
          🎨 Identidad Corporativa
        </button>
      </div>

      {mensaje && <div className="alerta exito">{mensaje}</div>}
      {error && <div className="alerta error">{error}</div>}

      {subtab === 'choferes' && (
        <div className="seccion-admin">
          <div className="tarjeta admin-form-tarjeta">
            <h3>Nuevo Chofer</h3>
            <form onSubmit={agregarChofer} className="form-horizontal">
              <input
                placeholder="Nombre completo o identificador"
                value={nuevoChofer}
                onChange={(e) => setNuevoChofer(e.target.value)}
              />
              <button className="btn primario" type="submit">Agregar Chofer</button>
            </form>
          </div>

          <div className="tarjeta tabla-admin-tarjeta">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th style={{ width: 180 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {choferes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {editChofer?.id === c.id ? (
                        <input
                          value={editChofer.nombre}
                          onChange={(e) => setEditChofer({ ...editChofer, nombre: e.target.value })}
                        />
                      ) : (
                        <b>{c.nombre}</b>
                      )}
                    </td>
                    <td>
                      {editChofer?.id === c.id ? (
                        <label className="label-checkbox">
                          <input
                            type="checkbox"
                            checked={editChofer.activo}
                            onChange={(e) => setEditChofer({ ...editChofer, activo: e.target.checked })}
                          />
                          Activo
                        </label>
                      ) : (
                        <span className={c.activo ? 'chip exito' : 'chip'}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editChofer?.id === c.id ? (
                        <div className="botones-accion-fila">
                          <button className="btn chico primario" onClick={guardarEdicionChofer}>Guardar</button>
                          <button className="btn chico" onClick={() => setEditChofer(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="botones-accion-fila">
                          <button className="btn chico" onClick={() => setEditChofer(c)}>Editar</button>
                          <button className="btn chico peligro" onClick={() => eliminarChofer(c)}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subtab === 'operadores' && (
        <div className="seccion-admin">
          <div className="tarjeta admin-form-tarjeta">
            <h3>Nuevo Operador</h3>
            <form onSubmit={agregarOperador} className="form-horizontal-wrap">
              <input
                placeholder="Usuario (ej: juan)"
                value={nuevoOp.usuario}
                onChange={(e) => setNuevoOp({ ...nuevoOp, usuario: e.target.value })}
                required
              />
              <input
                placeholder="Nombre completo"
                value={nuevoOp.nombre}
                onChange={(e) => setNuevoOp({ ...nuevoOp, nombre: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={nuevoOp.password}
                onChange={(e) => setNuevoOp({ ...nuevoOp, password: e.target.value })}
                required
              />
              <select
                value={nuevoOp.rol}
                onChange={(e) => setNuevoOp({ ...nuevoOp, rol: e.target.value })}
              >
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
              <button className="btn primario" type="submit">Crear Operador</button>
            </form>
          </div>

          <div className="tarjeta tabla-admin-tarjeta">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{ width: 140 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {operadores.map((o) => (
                  <tr key={o.id}>
                    <td><code>{o.usuario}</code></td>
                    <td>
                      {editOp?.id === o.id ? (
                        <input
                          value={editOp.nombre}
                          onChange={(e) => setEditOp({ ...editOp, nombre: e.target.value })}
                        />
                      ) : (
                        o.nombre
                      )}
                    </td>
                    <td>
                      {editOp?.id === o.id ? (
                        <select
                          value={editOp.rol}
                          onChange={(e) => setEditOp({ ...editOp, rol: e.target.value })}
                          disabled={o.id === operadorId}
                        >
                          <option value="operador">Operador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span className="chip">{o.rol}</span>
                      )}
                    </td>
                    <td>
                      {editOp?.id === o.id ? (
                        <label className="label-checkbox">
                          <input
                            type="checkbox"
                            checked={editOp.activo}
                            onChange={(e) => setEditOp({ ...editOp, activo: e.target.checked })}
                            disabled={o.id === operadorId}
                          />
                          Activo
                        </label>
                      ) : (
                        <span className={o.activo ? 'chip exito' : 'chip'}>
                          {o.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editOp?.id === o.id ? (
                        <div className="botones-accion-fila">
                          <button className="btn chico primario" onClick={guardarEdicionOp}>Guardar</button>
                          <button className="btn chico" onClick={() => setEditOp(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <button className="btn chico" onClick={() => setEditOp({ ...o, password: '' })}>Editar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subtab === 'identidad' && (
        <div className="seccion-admin">
          <div className="tarjeta admin-form-tarjeta">
            <h3>🎨 Identidad y Colores Corporativos (26000)</h3>
            <p className="descripcion" style={{ marginTop: 4, marginBottom: 16 }}>
              Ajustá la apariencia del sistema para usar la identidad corporativa naranja o volver al estilo normal.
            </p>

            <div className="control-identidad-principal">
              <label className="switch-identidad-label">
                <input
                  type="checkbox"
                  checked={tema.usarIdentidad}
                  onChange={(e) => actualizarTema({ usarIdentidad: e.target.checked })}
                />
                <span className="switch-identidad-texto">
                  <b>Usar colores de identidad</b>
                </span>
              </label>
            </div>

            {tema.usarIdentidad ? (
              <div className="desglose-elementos-identidad">
                <h4 style={{ margin: '16px 0 10px', fontSize: '0.95rem' }}>
                  Elegí a qué elementos aplicar el estilo naranja corporativo:
                </h4>
                <div className="lista-opciones-identidad">
                  <label className="opcion-identidad-item">
                    <input
                      type="checkbox"
                      checked={tema.elementos.marcosTarjetas}
                      onChange={() => toggleElemento('marcosTarjetas')}
                    />
                    <div>
                      <b>Marcos de tarjetas y paneles</b>
                      <p className="descripcion">Aplica marco con borde naranja institucional en los bloques, formularios y tablas (desmarcar para marco normal neutro).</p>
                    </div>
                  </label>

                  <label className="opcion-identidad-item">
                    <input
                      type="checkbox"
                      checked={tema.elementos.bordeEtiquetas}
                      onChange={() => toggleElemento('bordeEtiquetas')}
                    />
                    <div>
                      <b>Bordes en etiquetas y pestañas</b>
                      <p className="descripcion">Borde naranja en etiquetas, chips informativos y botones de navegación.</p>
                    </div>
                  </label>

                  <label className="opcion-identidad-item">
                    <input
                      type="checkbox"
                      checked={tema.elementos.botonesNaranja}
                      onChange={() => toggleElemento('botonesNaranja')}
                    />
                    <div>
                      <b>Botones principales en naranja corporativo</b>
                      <p className="descripcion">Los botones principales (Guardar, Asignar, etc.) adoptan el color naranja corporativo en lugar de azul.</p>
                    </div>
                  </label>

                  <label className="opcion-identidad-item">
                    <input
                      type="checkbox"
                      checked={tema.elementos.mostrarTitulo}
                      onChange={() => toggleElemento('mostrarTitulo')}
                    />
                    <div>
                      <b>Título corporativo "26000 VEINTISEISMIL"</b>
                      <p className="descripcion">Muestra el texto institucional en naranja en la barra superior.</p>
                    </div>
                  </label>
                </div>

                <div className="vista-previa-identidad" style={{ marginTop: 20 }}>
                  <h4 style={{ marginBottom: 10, fontSize: '0.95rem' }}>Vista previa en tiempo real:</h4>
                  <div
                    className="tarjeta muestra-tarjeta"
                    style={!tema.elementos.marcosTarjetas ? { border: '1px solid var(--borde)', boxShadow: 'var(--sombra)' } : {}}
                  >
                    <b>Tarjeta de prueba</b>
                    <p style={{ marginTop: 4, color: 'var(--texto-secundario)' }}>
                      Este cuadro refleja al instante cómo se verán las tarjetas, botones y etiquetas según las opciones elegidas.
                    </p>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        className="btn primario"
                        type="button"
                        style={!tema.elementos.botonesNaranja ? { backgroundColor: '#0d6efd', borderColor: '#0b5ed7', boxShadow: 'none' } : {}}
                      >
                        Botón de acción
                      </button>
                      <span
                        className="chip prog"
                        style={!tema.elementos.bordeEtiquetas ? { border: 'none', backgroundColor: '#e2f0fd', color: '#0a58ca' } : {}}
                      >
                        Etiqueta activa
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alerta" style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                ℹ️ <b>Modo normal:</b> El sistema utilizará marcos neutros estándar y paleta de colores habitual.
              </div>
            )}
          </div>
        </div>
      )}

      {subtab === 'configuracion' && (
        <div className="seccion-admin">
          <div className="tarjeta admin-form-tarjeta">
            <h3>⏰ Configuración de Viajes Programados</h3>
            <p className="descripcion" style={{ marginTop: 4, marginBottom: 14 }}>
              Definí con cuántos minutos de anticipación a la hora programada el sistema debe emitir el aviso previo y activar el viaje en la cola de despacho.
            </p>
            <form onSubmit={guardarConfiguracion} className="form-horizontal" style={{ alignItems: 'flex-end' }}>
              <label className="campo" style={{ maxWidth: 260 }}>
                <span>Minutos de aviso previo</span>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={minutosAviso}
                  onChange={(e) => setMinutosAviso(e.target.value)}
                  required
                />
              </label>
              <button className="btn primario" type="submit" disabled={guardandoConfig}>
                {guardandoConfig ? 'Guardando…' : 'Guardar configuración'}
              </button>
            </form>
            <p className="descripcion" style={{ marginTop: 10 }}>
              Valor actual: <b>{minutosAviso} minutos</b> antes de la hora programada (por ejemplo, un viaje programado para las 15:00 avisará a las 14:{String(Math.max(0, 60 - (Number(minutosAviso) || 0)) % 60).padStart(2, '0')}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
