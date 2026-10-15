import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';

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

  useEffect(() => {
    if (subtab === 'choferes') cargarChoferes();
    else cargarOperadores();
  }, [subtab, cargarChoferes, cargarOperadores]);

  function mostrarExito(txt) {
    setMensaje(txt);
    setError('');
    setTimeout(() => setMensaje(''), 3000);
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
                  <th style={{ width: 140 }}>Acción</th>
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
                        <button className="btn chico" onClick={() => setEditChofer(c)}>Editar</button>
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
    </div>
  );
}
