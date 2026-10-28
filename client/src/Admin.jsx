import { useState, useEffect, useCallback } from 'react';
import { api, leerSesion } from './api.js';
import { leerTema, guardarTema } from './tema.js';
import {
  MODULOS_PERMISOS,
  PERMISOS_DISPONIBLES,
  PERMISOS_DEFAULT_OPERADOR,
  normalizarPermisos,
  tienePermiso,
} from '../../shared/permisos.js';

function EditorPermisos({ permisos, rol, onChange, disabled }) {
  const esAdmin = rol === 'admin';
  const [desplegados, setDesplegados] = useState(() => ({
    admin: true,
  }));

  function toggleDesplegado(moduloId) {
    setDesplegados((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  }

  function expandirTodos(valor) {
    const nuevo = {};
    MODULOS_PERMISOS.forEach((m) => {
      nuevo[m.id] = valor;
    });
    setDesplegados(nuevo);
  }

  function toggleModuloCompleto(m, e) {
    e.stopPropagation();
    if (disabled || esAdmin) return;
    const subsActivos = m.subpermisos.filter((sub) => permisos[sub.id]).length;
    const todosActivos = subsActivos === m.subpermisos.length;
    const nuevoValor = !todosActivos;

    const actualizados = { ...permisos, [m.id]: nuevoValor };
    m.subpermisos.forEach((sub) => {
      actualizados[sub.id] = nuevoValor;
    });
    if (nuevoValor) {
      setDesplegados((prev) => ({ ...prev, [m.id]: true }));
    }
    onChange(normalizarPermisos(actualizados, rol));
  }

  function toggleSubpermiso(m, subId, e) {
    e.stopPropagation();
    if (disabled || esAdmin) return;
    const actualizados = {
      ...permisos,
      [subId]: !permisos[subId],
    };
    const algunActivo = m.subpermisos.some((s) => s.id === subId ? !permisos[subId] : Boolean(actualizados[s.id]));
    actualizados[m.id] = algunActivo;
    onChange(normalizarPermisos(actualizados, rol));
  }

  function marcarSubpermisosModulo(m, valor) {
    if (disabled || esAdmin) return;
    const actualizados = { ...permisos, [m.id]: valor };
    m.subpermisos.forEach((sub) => {
      actualizados[sub.id] = valor;
    });
    onChange(normalizarPermisos(actualizados, rol));
  }

  function marcarTodos(valor) {
    if (disabled || esAdmin) return;
    const actualizados = {};
    MODULOS_PERMISOS.forEach((m) => {
      actualizados[m.id] = valor;
      m.subpermisos.forEach((sub) => {
        actualizados[sub.id] = valor;
      });
    });
    onChange(normalizarPermisos(actualizados, rol));
  }

  function restablecer() {
    if (disabled || esAdmin) return;
    onChange({ ...PERMISOS_DEFAULT_OPERADOR });
  }

  return (
    <div className="contenedor-permisos">
      <div className="permisos-cabecera">
        <div>
          <h5>Permisos de acceso del operador</h5>
          <span className="tenue" style={{ fontSize: '0.82rem' }}>
            Hacé clic en cualquier tarjeta para desplegar sus sub-secciones y configurar accesos individuales.
          </span>
        </div>
        {!esAdmin && !disabled && (
          <div className="permisos-atajos">
            <button type="button" className="btn-link chico" onClick={() => expandirTodos(true)}>
              Expandir todos
            </button>
            <span>·</span>
            <button type="button" className="btn-link chico" onClick={() => expandirTodos(false)}>
              Colapsar todos
            </button>
            <span>·</span>
            <button type="button" className="btn-link chico" onClick={() => marcarTodos(true)}>
              Marcar todos
            </button>
            <span>·</span>
            <button type="button" className="btn-link chico" onClick={() => marcarTodos(false)}>
              Desmarcar todos
            </button>
            <span>·</span>
            <button type="button" className="btn-link chico" onClick={restablecer}>
              Por defecto
            </button>
          </div>
        )}
      </div>

      {esAdmin ? (
        <div className="alerta-admin-permisos">
          👑 <b>Rol Administrador:</b> Este operador cuenta con acceso completo a todos los módulos y sub-secciones del sistema.
        </div>
      ) : (
        <div className="lista-modulos-permisos">
          {MODULOS_PERMISOS.map((m) => {
            const subsActivos = m.subpermisos.filter((sub) => permisos[sub.id]).length;
            const todosActivos = subsActivos === m.subpermisos.length;
            const algunoActivo = subsActivos > 0;
            const desplegado = Boolean(desplegados[m.id]);

            return (
              <div
                key={m.id}
                className={`tarjeta-modulo-permiso ${algunoActivo ? 'activo' : 'inactivo'} ${desplegado ? 'desplegado' : ''}`}
              >
                <div
                  className="cabecera-modulo-permiso"
                  onClick={() => toggleDesplegado(m.id)}
                  title="Clic para desplegar o colapsar sub-secciones"
                >
                  <div className="cabecera-modulo-izq">
                    <input
                      type="checkbox"
                      checked={todosActivos}
                      ref={(el) => {
                        if (el) el.indeterminate = algunoActivo && !todosActivos;
                      }}
                      onChange={(e) => toggleModuloCompleto(m, e)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={disabled}
                      title={todosActivos ? 'Desmarcar todo el módulo' : 'Marcar todo el módulo'}
                    />
                    <div className="cabecera-modulo-titulos">
                      <div className="cabecera-modulo-nombre">
                        <span className="icono-modulo">{m.icono}</span>
                        <b>{m.nombre}</b>
                      </div>
                      <span className="cabecera-modulo-desc">{m.descripcion}</span>
                    </div>
                  </div>

                  <div className="cabecera-modulo-der">
                    <span className={`badge-contador-subs ${todosActivos ? 'completo' : algunoActivo ? 'parcial' : 'vacio'}`}>
                      {subsActivos} de {m.subpermisos.length} activas
                    </span>
                    <span className="indicador-despliegue">
                      {desplegado ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {desplegado && (
                  <div className="cuerpo-modulo-permisos">
                    <div className="subpermisos-barra-atajos">
                      <span className="subpermisos-subtitulo">
                        Sub-secciones y privilegios de {m.nombre}:
                      </span>
                      {!disabled && (
                        <div style={{ display: 'inline-flex', gap: 6, fontSize: '0.8rem' }}>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => marcarSubpermisosModulo(m, true)}
                          >
                            Marcar todas
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            className="btn-link chico"
                            onClick={() => marcarSubpermisosModulo(m, false)}
                          >
                            Desmarcar todas
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="subpermisos-grilla">
                      {m.subpermisos.map((sub) => {
                        const activo = Boolean(permisos[sub.id]);
                        return (
                          <div
                            key={sub.id}
                            className={`item-subpermiso ${activo ? 'activo' : ''}`}
                            onClick={(e) => toggleSubpermiso(m, sub.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={activo}
                              onChange={(e) => toggleSubpermiso(m, sub.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={disabled}
                            />
                            <div className="item-subpermiso-info">
                              <span className="item-subpermiso-nombre">{sub.nombre}</span>
                              <span className="item-subpermiso-desc">{sub.descripcion}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResumenPermisos({ operador }) {
  if (operador.rol === 'admin') {
    return <span className="chip exito" title="Acceso total irrestricto">👑 Acceso total</span>;
  }
  const perms = normalizarPermisos(operador.permisos, operador.rol);
  const totalSubpermisos = MODULOS_PERMISOS.reduce((acc, m) => acc + m.subpermisos.length, 0);
  const habilitados = MODULOS_PERMISOS.flatMap((m) => m.subpermisos).filter((s) => perms[s.id]);

  if (habilitados.length === 0) {
    return <span className="chip alerta" title="Sin accesos concedidos">🚫 Sin acceso</span>;
  }
  if (habilitados.length === totalSubpermisos) {
    return <span className="chip exito">Completo ({totalSubpermisos}/{totalSubpermisos})</span>;
  }

  const modulosResumen = MODULOS_PERMISOS.map((m) => {
    const act = m.subpermisos.filter((s) => perms[s.id]);
    if (act.length === 0) return null;
    const esCompleto = act.length === m.subpermisos.length;
    return {
      id: m.id,
      nombre: m.nombre,
      esCompleto,
      resumen: esCompleto ? m.nombre : `${m.nombre} (${act.length}/${m.subpermisos.length})`,
      detalle: act.map((s) => s.nombre).join(', '),
    };
  }).filter(Boolean);

  return (
    <div className="resumen-permisos-wrap" title={habilitados.map((p) => p.nombre).join(', ')}>
      <div className="resumen-permisos-chips">
        {modulosResumen.map((mr) => (
          <span
            key={mr.id}
            className={`chip-permiso-mini ${mr.esCompleto ? 'completo' : 'parcial'}`}
            title={`${mr.nombre}: ${mr.detalle}`}
          >
            {mr.resumen}
          </span>
        ))}
      </div>
      <small className="tenue">{habilitados.length} de {totalSubpermisos} sub-secciones</small>
    </div>
  );
}

export default function Admin({ operadorId, esSuperAdmin = true }) {
  const sesionOperador = leerSesion()?.operador;

  // Choferes
  const [choferes, setChoferes] = useState([]);
  const [nuevoChofer, setNuevoChofer] = useState('');
  const [editChofer, setEditChofer] = useState(null);

  // Operadores
  const [operadores, setOperadores] = useState([]);
  const [nuevoOp, setNuevoOp] = useState({
    usuario: '',
    nombre: '',
    password: '',
    rol: 'operador',
    permisos: { ...PERMISOS_DEFAULT_OPERADOR },
  });
  const [mostrarPermisosNuevo, setMostrarPermisosNuevo] = useState(false);
  const [editOp, setEditOp] = useState(null);

  // Catálogo curado de Calles de San José de Mayo
  const [calles, setCalles] = useState([]);
  const [busquedaCalle, setBusquedaCalle] = useState('');
  const [nuevaCalle, setNuevaCalle] = useState({ nombre: '', alias: '' });
  const [editCalle, setEditCalle] = useState(null);

  // Subtabs disponibles según permisos
  const SUBTABS_ADMIN = [
    { id: 'choferes', nombre: `🚖 Choferes (${choferes.length})`, permiso: 'admin_choferes' },
    { id: 'operadores', nombre: `👥 Operadores (${operadores.length})`, permiso: 'admin_operadores', soloSuperAdmin: true },
    { id: 'calles', nombre: `🗺️ Calles San José (${calles.length})`, permiso: 'admin_calles' },
    { id: 'configuracion', nombre: '⚙️ Configuración', permiso: 'admin_configuracion' },
    { id: 'identidad', nombre: '🎨 Identidad Corporativa', permiso: 'admin_identidad' },
  ];

  const subtabsDisponibles = SUBTABS_ADMIN.filter((t) => {
    if (t.soloSuperAdmin && !esSuperAdmin) return false;
    return tienePermiso(sesionOperador, t.permiso);
  });

  const [subtab, setSubtab] = useState(() => subtabsDisponibles[0]?.id || 'choferes');

  useEffect(() => {
    if (subtabsDisponibles.length > 0 && !subtabsDisponibles.some((t) => t.id === subtab)) {
      setSubtab(subtabsDisponibles[0].id);
    }
  }, [subtabsDisponibles, subtab]);

  // Identidad corporativa
  const [tema, setTema] = useState(leerTema);

  // Configuración general (aviso previo y visualización de campo nombre en recepción)
  const [minutosAviso, setMinutosAviso] = useState(5);
  const [mostrarNombreRecepcion, setMostrarNombreRecepcion] = useState(true);
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

  const cargarCalles = useCallback(async (q = '') => {
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const data = await api(`/calles${params}`);
      setCalles(data);
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
      if (cfg?.mostrarNombreRecepcion != null) {
        setMostrarNombreRecepcion(cfg.mostrarNombreRecepcion);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
    cargarCalles();
  }, [cargarConfiguracion, cargarCalles]);

  useEffect(() => {
    if (subtab === 'choferes') cargarChoferes();
    else if (subtab === 'operadores') cargarOperadores();
    else if (subtab === 'calles') cargarCalles(busquedaCalle);
    else if (subtab === 'configuracion') cargarConfiguracion();
  }, [subtab, cargarChoferes, cargarOperadores, cargarCalles, busquedaCalle, cargarConfiguracion]);

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
        body: {
          minutosAvisoProgramado: Number(minutosAviso),
          mostrarNombreRecepcion: Boolean(mostrarNombreRecepcion),
        },
      });
      setMinutosAviso(cfg.minutosAvisoProgramado);
      setMostrarNombreRecepcion(cfg.mostrarNombreRecepcion);
      mostrarExito('Configuración guardada correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoConfig(false);
    }
  }

  async function toggleMostrarNombre(nuevoValor) {
    setMostrarNombreRecepcion(nuevoValor);
    try {
      const cfg = await api('/configuracion', {
        method: 'PUT',
        body: { mostrarNombreRecepcion: nuevoValor },
      });
      setMostrarNombreRecepcion(cfg.mostrarNombreRecepcion);
      mostrarExito(
        cfg.mostrarNombreRecepcion
          ? 'Campo "Nombre" habilitado en la pantalla de Recepción'
          : 'Campo "Nombre" oculto en la pantalla de Recepción',
      );
    } catch (err) {
      setError(err.message);
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
      await api('/operadores', {
        method: 'POST',
        body: {
          usuario: nuevoOp.usuario,
          nombre: nuevoOp.nombre,
          password: nuevoOp.password,
          rol: nuevoOp.rol,
          permisos: nuevoOp.permisos,
        },
      });
      setNuevoOp({
        usuario: '',
        nombre: '',
        password: '',
        rol: 'operador',
        permisos: { ...PERMISOS_DEFAULT_OPERADOR },
      });
      setMostrarPermisosNuevo(false);
      mostrarExito('Operador creado correctamente con sus permisos');
      cargarOperadores();
    } catch (err) {
      setError(err.message);
    }
  }

  function iniciarEdicionOp(o) {
    setEditOp({
      ...o,
      password: '',
      permisos: normalizarPermisos(o.permisos, o.rol),
    });
  }

  async function guardarEdicionOp(e) {
    e?.preventDefault();
    if (!editOp.nombre?.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }
    try {
      await api(`/operadores/${editOp.id}`, {
        method: 'PUT',
        body: {
          nombre: editOp.nombre,
          rol: editOp.rol,
          activo: editOp.activo,
          password: editOp.password || undefined,
          permisos: editOp.permisos,
        },
      });
      setEditOp(null);
      mostrarExito('Operador y permisos actualizados correctamente');
      cargarOperadores();
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Calles Handlers ---
  async function agregarCalle(e) {
    e.preventDefault();
    if (!nuevaCalle.nombre.trim()) return;
    try {
      await api('/calles', {
        method: 'POST',
        body: { nombre: nuevaCalle.nombre, alias: nuevaCalle.alias },
      });
      setNuevaCalle({ nombre: '', alias: '' });
      mostrarExito('Calle agregada al catálogo de San José de Mayo');
      cargarCalles(busquedaCalle);
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarEdicionCalle(e) {
    e.preventDefault();
    if (!editCalle?.nombre?.trim()) return;
    try {
      await api(`/calles/${editCalle.id}`, {
        method: 'PUT',
        body: {
          nombre: editCalle.nombre,
          alias: editCalle.alias,
          activa: editCalle.activa,
        },
      });
      setEditCalle(null);
      mostrarExito('Calle actualizada (y direcciones históricas sincronizadas)');
      cargarCalles(busquedaCalle);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarCalleCatalogo(calle) {
    if (!window.confirm(`¿Eliminar "${calle.nombre}" del catálogo de calles?`)) return;
    try {
      await api(`/calles/${calle.id}`, { method: 'DELETE' });
      if (editCalle?.id === calle.id) setEditCalle(null);
      mostrarExito(`Calle "${calle.nombre}" eliminada del catálogo`);
      cargarCalles(busquedaCalle);
    } catch (err) {
      setError(err.message);
    }
  }

  async function restaurarCallesBase() {
    try {
      const res = await api('/calles/restaurar', { method: 'POST' });
      mostrarExito(`Catálogo verificado (${res.agregadas} calles agregadas · ${res.total} en total)`);
      cargarCalles(busquedaCalle);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-wrap">
      <div className="subtabs">
        {subtabsDisponibles.map((t) => (
          <button
            key={t.id}
            className={subtab === t.id ? 'tab activa' : 'tab'}
            onClick={() => { setSubtab(t.id); setError(''); }}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {mensaje && <div className="alerta exito">{mensaje}</div>}
      {error && <div className="alerta error">{error}</div>}

      {subtab === 'choferes' && tienePermiso(sesionOperador, 'admin_choferes') && (
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

      {subtab === 'operadores' && esSuperAdmin && tienePermiso(sesionOperador, 'admin_operadores') && (
        <div className="seccion-admin">
          {editOp ? (
            <div className="tarjeta edicion-op-panel">
              <div className="edicion-op-cabecera">
                <h4>
                  ✏️ Editando Operador: <code>{editOp.usuario}</code>
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn chico primario" onClick={guardarEdicionOp}>
                    💾 Guardar Cambios y Permisos
                  </button>
                  <button className="btn chico" onClick={() => setEditOp(null)}>
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="edicion-op-campos">
                <label className="campo">
                  <span>Nombre completo</span>
                  <input
                    value={editOp.nombre}
                    onChange={(e) => setEditOp({ ...editOp, nombre: e.target.value })}
                    required
                  />
                </label>

                <label className="campo">
                  <span>Nueva contraseña (opcional)</span>
                  <input
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    value={editOp.password || ''}
                    onChange={(e) => setEditOp({ ...editOp, password: e.target.value })}
                  />
                </label>

                <label className="campo">
                  <span>Rol en el sistema</span>
                  <select
                    value={editOp.rol}
                    onChange={(e) => {
                      const nuevoRol = e.target.value;
                      setEditOp({
                        ...editOp,
                        rol: nuevoRol,
                        permisos: normalizarPermisos(editOp.permisos, nuevoRol),
                      });
                    }}
                    disabled={editOp.id === operadorId}
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>

                <label className="campo" style={{ justifyContent: 'center' }}>
                  <span>Estado de cuenta</span>
                  <label className="label-checkbox" style={{ marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={editOp.activo}
                      onChange={(e) => setEditOp({ ...editOp, activo: e.target.checked })}
                      disabled={editOp.id === operadorId}
                    />
                    <b>Usuario Activo</b>
                  </label>
                </label>
              </div>

              <EditorPermisos
                permisos={editOp.permisos || {}}
                rol={editOp.rol}
                onChange={(p) => setEditOp({ ...editOp, permisos: p })}
                disabled={editOp.id === operadorId}
              />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn" onClick={() => setEditOp(null)}>
                  Cancelar
                </button>
                <button className="btn primario" onClick={guardarEdicionOp}>
                  💾 Guardar Operador y Permisos
                </button>
              </div>
            </div>
          ) : (
            <div className="tarjeta admin-form-tarjeta">
              <h3>Nuevo Operador</h3>
              <form onSubmit={agregarOperador}>
                <div className="form-horizontal-wrap">
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
                    onChange={(e) => {
                      const nuevoRol = e.target.value;
                      setNuevoOp({
                        ...nuevoOp,
                        rol: nuevoRol,
                        permisos: normalizarPermisos(nuevoOp.permisos, nuevoRol),
                      });
                    }}
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button className="btn primario" type="submit">
                    Crear Operador
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setMostrarPermisosNuevo(!mostrarPermisosNuevo)}
                  >
                    {mostrarPermisosNuevo ? 'Ocultar Permisos ▲' : 'Configurar Permisos ▼'}
                  </button>
                </div>

                {mostrarPermisosNuevo && (
                  <div style={{ marginTop: 16 }}>
                    <EditorPermisos
                      permisos={nuevoOp.permisos || {}}
                      rol={nuevoOp.rol}
                      onChange={(p) => setNuevoOp({ ...nuevoOp, permisos: p })}
                    />
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="tarjeta tabla-admin-tarjeta">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Permisos Concedidos</th>
                  <th style={{ width: 100 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {operadores.map((o) => {
                  const editando = editOp?.id === o.id;
                  return (
                    <tr key={o.id} className={editando ? 'fila-editando' : ''}>
                      <td><code>{o.usuario}</code></td>
                      <td><b>{o.nombre}</b></td>
                      <td>
                        <span className={o.rol === 'admin' ? 'chip alerta' : 'chip'}>
                          {o.rol === 'admin' ? 'Administrador' : 'Operador'}
                        </span>
                      </td>
                      <td>
                        <span className={o.activo ? 'chip exito' : 'chip'}>
                          {o.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <ResumenPermisos operador={o} />
                      </td>
                      <td>
                        <button
                          className={editando ? 'btn chico primario' : 'btn chico'}
                          onClick={() => iniciarEdicionOp(o)}
                        >
                          {editando ? 'Editando…' : 'Editar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subtab === 'identidad' && tienePermiso(sesionOperador, 'admin_identidad') && (
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
                      <b>Título corporativo "TAXI 26000 VEINTISEISMIL"</b>
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

      {subtab === 'calles' && tienePermiso(sesionOperador, 'admin_calles') && (
        <div className="seccion-admin">
          <div className="tarjeta admin-form-tarjeta">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3>🗺️ Catálogo Curado de Calles y Lugares (San José de Mayo)</h3>
                <p className="descripcion" style={{ marginTop: 4 }}>
                  Usado para autocompletar y normalizar direcciones respetando el orden <b>&lt;número&gt; &lt;calle&gt;</b> (ej: <b>450 Artigas</b>, <b>1200 Batlle y Ordóñez</b>).
                  Podés buscar cualquier calle y modificar su nombre principal manualmente (ej: cambiar <i>"José Batlle y Ordóñez"</i> por <i>"Batlle y Ordóñez"</i>).
                </p>
              </div>
              <button type="button" className="btn chico" onClick={restaurarCallesBase} title="Agrega calles del listado base que se hayan borrado, sin pisar tus ediciones">
                🔄 Restaurar faltantes del catálogo
              </button>
            </div>

            <form onSubmit={agregarCalle} className="form-horizontal-wrap" style={{ marginTop: 14 }}>
              <input
                placeholder="Nombre principal (ej: Batlle y Ordóñez)"
                value={nuevaCalle.nombre}
                onChange={(e) => setNuevaCalle({ ...nuevaCalle, nombre: e.target.value })}
                required
              />
              <input
                placeholder="Alias / nombres alternativos separados por coma (ej: José Batlle y Ordóñez, Batlle)"
                value={nuevaCalle.alias}
                onChange={(e) => setNuevaCalle({ ...nuevaCalle, alias: e.target.value })}
              />
              <button className="btn primario" type="submit">
                ➕ Agregar Calle / Lugar
              </button>
            </form>

            <div className="form-horizontal" style={{ marginTop: 14, alignItems: 'center' }}>
              <input
                style={{ maxWidth: 460 }}
                placeholder="🔎 Buscar calle o alias en el listado (ej: Batlle, Saravia, Ciganda, 18 de Julio)..."
                value={busquedaCalle}
                onChange={(e) => setBusquedaCalle(e.target.value)}
              />
              {busquedaCalle && (
                <button type="button" className="btn chico" onClick={() => setBusquedaCalle('')}>
                  ✖ Limpiar búsqueda
                </button>
              )}
              <span className="tenue">
                Mostrando <b>{calles.length}</b> entrada(s)
              </span>
            </div>
          </div>

          <div className="tarjeta tabla-admin-tarjeta">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Nombre Principal (se usa al guardar)</th>
                  <th style={{ width: '40%' }}>Alias / Nombres Alternativos reconocidos</th>
                  <th style={{ width: '12%' }}>Ejemplo</th>
                  <th style={{ width: '8%' }}>Estado</th>
                  <th style={{ width: 170 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {calles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vacio">
                      No se encontraron calles con "{busquedaCalle}".
                    </td>
                  </tr>
                ) : (
                  calles.map((c) => {
                    const editando = editCalle?.id === c.id;
                    return (
                      <tr key={c.id}>
                        <td>
                          {editando ? (
                            <input
                              value={editCalle.nombre}
                              onChange={(e) => setEditCalle({ ...editCalle, nombre: e.target.value })}
                              placeholder="Nombre principal"
                              autoFocus
                            />
                          ) : (
                            <b>{c.nombre}</b>
                          )}
                        </td>
                        <td>
                          {editando ? (
                            <input
                              value={editCalle.alias || ''}
                              onChange={(e) => setEditCalle({ ...editCalle, alias: e.target.value })}
                              placeholder="Variantes separadas por coma"
                            />
                          ) : c.alias ? (
                            <span className="tenue">{c.alias}</span>
                          ) : (
                            <span className="tenue">—</span>
                          )}
                        </td>
                        <td>
                          <span className="chip prog">450 {editando ? editCalle.nombre || c.nombre : c.nombre}</span>
                        </td>
                        <td>
                          {editando ? (
                            <label className="label-checkbox">
                              <input
                                type="checkbox"
                                checked={editCalle.activa}
                                onChange={(e) => setEditCalle({ ...editCalle, activa: e.target.checked })}
                              />
                              Activa
                            </label>
                          ) : (
                            <span className={c.activa ? 'chip exito' : 'chip'}>
                              {c.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          )}
                        </td>
                        <td>
                          {editando ? (
                            <div className="botones-accion-fila">
                              <button className="btn chico primario" onClick={guardarEdicionCalle}>
                                Guardar
                              </button>
                              <button className="btn chico" onClick={() => setEditCalle(null)}>
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="botones-accion-fila">
                              <button className="btn chico" onClick={() => setEditCalle({ ...c })}>
                                Editar
                              </button>
                              <button className="btn chico peligro" onClick={() => eliminarCalleCatalogo(c)}>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subtab === 'configuracion' && tienePermiso(sesionOperador, 'admin_configuracion') && (
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

          <div className="tarjeta admin-form-tarjeta" style={{ marginTop: 16 }}>
            <h3>👤 Campo "Nombre" en Recepción de Viajes</h3>
            <p className="descripcion" style={{ marginTop: 4, marginBottom: 16 }}>
              El campo <b>Nombre</b> permite identificar clientes que así lo deseen o pasajeros habituales (no es obligatorio).
              <b> Se verá siempre en la Ficha de Viaje y en el listado de Clientes</b> junto al teléfono (si existe).
              Desde aquí podés elegir si mostrarlo u ocultarlo en el formulario rápido de Recepción de Viajes.
            </p>

            <label className="opcion-identidad-item" style={{ maxWidth: 580, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mostrarNombreRecepcion}
                onChange={(e) => toggleMostrarNombre(e.target.checked)}
              />
              <div>
                <b>Mostrar campo "Nombre" en la Recepción de Viajes</b>
                <p className="descripcion">
                  {mostrarNombreRecepcion
                    ? 'Activado: Los operadores verán el campo "Nombre (opc)" en el formulario de Recepción para asignarlo inmediatamente al crear el viaje.'
                    : 'Oculto: El formulario de Recepción queda en modo ultrarrápido (Teléfono → Dirección → Chofer → Programado). El nombre se puede seguir viendo y cargando en la Ficha de Viaje y en Clientes.'}
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
