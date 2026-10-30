import { useState, useEffect, useCallback } from 'react';
import { api, leerSesion } from './api.js';
import { hora, formatearNumeroViaje } from './formato.js';
import TelefonoWhatsApp from './TelefonoWhatsApp.jsx';
import FichaViajeModal from './FichaViajeModal.jsx';
import { tienePermiso } from '../../shared/permisos.js';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatearDia(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatearMes(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  return `${MESES[idx] || m} ${y}`;
}

export default function Clientes({ socket }) {
  // Filtros por cada campo
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [destino, setDestino] = useState('');
  const [chofer, setChofer] = useState('');
  const [choferId, setChoferId] = useState('');
  const [operador, setOperador] = useState('');
  const [tipoTurno, setTipoTurno] = useState('');
  const [estado, setEstado] = useState('realizados');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Filtro rápido por período desde las estadísticas (día, mes o año)
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');

  // Vista de estadísticas: 'dia' | 'mes' | 'anio' | 'ranking'
  const [vistaStats, setVistaStats] = useState('dia');

  const [choferesLista, setChoferesLista] = useState([]);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [viajeFichaId, setViajeFichaId] = useState(null);

  useEffect(() => {
    api('/choferes')
      .then(setChoferesLista)
      .catch(() => {});
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (telefono.trim()) params.set('telefono', telefono.trim());
      if (nombre.trim()) params.set('nombre', nombre.trim());
      if (destino.trim()) params.set('destino', destino.trim());
      if (choferId) params.set('choferId', choferId);
      else if (chofer.trim()) params.set('chofer', chofer.trim());
      if (operador.trim()) params.set('operador', operador.trim());
      if (tipoTurno) params.set('tipoTurno', tipoTurno);
      if (estado) params.set('estado', estado);
      if (fechaDesde) params.set('fechaDesde', fechaDesde);
      if (fechaHasta) params.set('fechaHasta', fechaHasta);
      if (filtroDia) params.set('dia', filtroDia);
      if (filtroMes) params.set('mes', filtroMes);
      if (filtroAnio) params.set('anio', filtroAnio);

      const res = await api(`/clientes?${params.toString()}`);
      setDatos(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [
    telefono,
    nombre,
    destino,
    chofer,
    choferId,
    operador,
    tipoTurno,
    estado,
    fechaDesde,
    fechaHasta,
    filtroDia,
    filtroMes,
    filtroAnio,
  ]);

  // Debounce automático al cambiar filtros
  useEffect(() => {
    const t = setTimeout(() => {
      cargarDatos();
    }, 180);
    return () => clearTimeout(t);
  }, [cargarDatos]);

  // Actualizar en tiempo real cuando entran viajes nuevos
  useEffect(() => {
    if (!socket) return undefined;
    const alActualizar = () => cargarDatos();
    socket.on('viajes', alActualizar);
    return () => socket.off('viajes', alActualizar);
  }, [socket, cargarDatos]);

  function limpiarFiltros() {
    setTelefono('');
    setNombre('');
    setDestino('');
    setChofer('');
    setChoferId('');
    setOperador('');
    setTipoTurno('');
    setEstado('realizados');
    setFechaDesde('');
    setFechaHasta('');
    setFiltroDia('');
    setFiltroMes('');
    setFiltroAnio('');
  }

  const hayFiltros =
    telefono ||
    nombre ||
    destino ||
    chofer ||
    choferId ||
    operador ||
    tipoTurno ||
    estado !== 'realizados' ||
    fechaDesde ||
    fechaHasta ||
    filtroDia ||
    filtroMes ||
    filtroAnio;

  function exportarCSV() {
    if (!datos?.viajes?.length) return;
    const encabezados = [
      'Fecha',
      'Turno',
      'N°',
      'Hora inicio',
      'Asignado',
      'Chofer',
      'Estado',
      'Teléfono',
      'Cliente',
      'Destino',
      'Operador',
      'Estado',
    ];
    const filas = datos.viajes.map((v) => [
      v.fecha_turno,
      v.tipo_turno,
      v.numero != null ? (v.numero_formateado || formatearNumeroViaje(v.numero, v.tipo_turno)) : '',
      v.hora_toma ? hora(v.hora_toma) : '',
      v.hora_asignacion || v.hora_fin ? hora(v.hora_asignacion || v.hora_fin) : '',
      `"${(v.chofer || 'Sin asignar').replace(/"/g, '""')}"`,
      v.hora_avisado ? hora(v.hora_avisado) : '',
      `"${v.telefono || ''}"`,
      `"${(v.nombre_cliente || '').replace(/"/g, '""')}"`,
      `"${(v.direccion || '').replace(/"/g, '""')}"`,
      `"${(v.operador || '').replace(/"/g, '""')}"`,
      v.cancelado ? 'Anulado' : v.numero != null ? 'Realizado' : 'Pendiente',
    ]);
    const contenido = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes_viajes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const resumen = datos?.resumen || {
    realizados: 0,
    anulados: 0,
    programados: 0,
    clientes_unicos: 0,
    destinos_unicos: 0,
    choferes_unicos: 0,
  };
  const stats = datos?.estadisticas || {
    porDia: [],
    porMes: [],
    porAnio: [],
    topClientes: [],
    topDestinos: [],
    topChoferes: [],
  };
  const viajes = datos?.viajes || [];

  const maxDia = Math.max(1, ...stats.porDia.map((d) => d.realizados));
  const maxMes = Math.max(1, ...stats.porMes.map((m) => m.realizados));
  const maxAnio = Math.max(1, ...stats.porAnio.map((a) => a.realizados));

  return (
    <div className="clientes-wrap">
      {/* Panel de Búsqueda y Filtros por cada campo */}
      <section className="tarjeta clientes-filtros-tarjeta">
        <div className="clientes-cabecera-filtros">
          <div>
            <h2>🔎 Clientes y Buscador de Viajes</h2>
            <p className="descripcion">
              Filtrá viajes realizados por teléfono, destino, chofer o fechas, y consultá estadísticas por día, mes y año.
            </p>
          </div>
          <div className="acciones-rapidas">
            {hayFiltros && (
              <button className="btn" onClick={limpiarFiltros}>
                ✖ Limpiar filtros
              </button>
            )}
            {viajes.length > 0 && tienePermiso(leerSesion()?.operador, 'clientes_exportar') && (
              <button className="btn" onClick={exportarCSV}>
                📥 Exportar CSV ({viajes.length})
              </button>
            )}
          </div>
        </div>

        <div className="grilla-filtros-clientes">
          <label className="campo">
            <span>Teléfono</span>
            <input
              type="text"
              placeholder="Ej: 341555..."
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Nombre del cliente</span>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Destino / Dirección</span>
            <input
              type="text"
              placeholder="Calle, número o lugar..."
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Chofer (selector)</span>
            <select
              value={choferId}
              onChange={(e) => {
                setChoferId(e.target.value);
                if (e.target.value) setChofer('');
              }}
            >
              <option value="">Todos los choferes</option>
              {choferesLista.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Chofer (texto)</span>
            <input
              type="text"
              placeholder="Buscar nombre o móvil..."
              value={chofer}
              onChange={(e) => {
                setChofer(e.target.value);
                if (e.target.value) setChoferId('');
              }}
            />
          </label>

          <label className="campo">
            <span>Desde fecha</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Hasta fecha</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Turno</span>
            <select value={tipoTurno} onChange={(e) => setTipoTurno(e.target.value)}>
              <option value="">Ambos turnos (A y B)</option>
              <option value="A">Turno A (03:00 a 15:00)</option>
              <option value="B">Turno B (15:00 a 03:00)</option>
            </select>
          </label>

          <label className="campo">
            <span>Estado del viaje</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="realizados">Viajes realizados</option>
              <option value="todos">Todos los viajes</option>
              <option value="programados">Programados</option>
              <option value="anulados">Anulados</option>
            </select>
          </label>
        </div>

        {(filtroDia || filtroMes || filtroAnio) && (
          <div className="chips-filtros-activos">
            <span>Período seleccionado:</span>
            {filtroDia && (
              <span className="chip prog">
                Día: {formatearDia(filtroDia)}
                <button className="chip-cerrar" onClick={() => setFiltroDia('')}>×</button>
              </span>
            )}
            {filtroMes && (
              <span className="chip prog">
                Mes: {formatearMes(filtroMes)}
                <button className="chip-cerrar" onClick={() => setFiltroMes('')}>×</button>
              </span>
            )}
            {filtroAnio && (
              <span className="chip prog">
                Año: {filtroAnio}
                <button className="chip-cerrar" onClick={() => setFiltroAnio('')}>×</button>
              </span>
            )}
          </div>
        )}
      </section>

      {error && <div className="alerta error">{error}</div>}

      {/* Tarjetas de Resumen General (KPIs) */}
      <section className="grilla-kpis-clientes">
        <div className="tarjeta kpi-card">
          <span className="kpi-titulo">Viajes Realizados</span>
          <b className="kpi-valor">{resumen.realizados}</b>
          <span className="kpi-sub">
            {resumen.programados} programados · {resumen.anulados} anulados
          </span>
        </div>
        <div className="tarjeta kpi-card">
          <span className="kpi-titulo">Clientes Únicos</span>
          <b className="kpi-valor">{resumen.clientes_unicos}</b>
          <span className="kpi-sub">Teléfonos distintos registrados</span>
        </div>
        <div className="tarjeta kpi-card">
          <span className="kpi-titulo">Destinos Distintos</span>
          <b className="kpi-valor">{resumen.destinos_unicos}</b>
          <span className="kpi-sub">Direcciones visitadas</span>
        </div>
        <div className="tarjeta kpi-card">
          <span className="kpi-titulo">Choferes con Viajes</span>
          <b className="kpi-valor">{resumen.choferes_unicos}</b>
          <span className="kpi-sub">Móviles que intervinieron</span>
        </div>
      </section>

      {/* Panel de Estadísticas por Día, Mes, Año y Rankings */}
      <section className="tarjeta seccion-estadisticas-clientes">
        <div className="cabecera-estadisticas">
          <h3>📊 Estadísticas de Viajes</h3>
          <div className="selector-estadisticas">
            <button
              className={vistaStats === 'dia' ? 'btn chico primario' : 'btn chico'}
              onClick={() => setVistaStats('dia')}
            >
              📅 Por Día ({stats.porDia.length})
            </button>
            <button
              className={vistaStats === 'mes' ? 'btn chico primario' : 'btn chico'}
              onClick={() => setVistaStats('mes')}
            >
              📆 Por Mes ({stats.porMes.length})
            </button>
            <button
              className={vistaStats === 'anio' ? 'btn chico primario' : 'btn chico'}
              onClick={() => setVistaStats('anio')}
            >
              📈 Por Año ({stats.porAnio.length})
            </button>
            <button
              className={vistaStats === 'ranking' ? 'btn chico primario' : 'btn chico'}
              onClick={() => setVistaStats('ranking')}
            >
              🏆 Top Clientes / Destinos / Choferes
            </button>
          </div>
        </div>

        {vistaStats === 'dia' && (
          <div className="tabla-stats-wrap">
            {stats.porDia.length === 0 ? (
              <p className="vacio">No hay datos diarios para los filtros seleccionados.</p>
            ) : (
              <table className="tabla-viajes tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Viajes Realizados</th>
                    <th style={{ width: '32%' }}>Volumen</th>
                    <th>Clientes Únicos</th>
                    <th>Choferes</th>
                    <th>Programados</th>
                    <th>Anulados</th>
                    <th className="col-acc">Filtro</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.porDia.map((d) => {
                    const pct = Math.round((d.realizados / maxDia) * 100);
                    const activo = filtroDia === d.periodo;
                    return (
                      <tr key={d.periodo} className={activo ? 'fila-seleccionada' : ''}>
                        <td><b>{formatearDia(d.periodo)}</b></td>
                        <td><b>{d.realizados}</b></td>
                        <td>
                          <div className="barra-progreso-fondo">
                            <div className="barra-progreso-relleno" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td>{d.clientes_unicos}</td>
                        <td>{d.choferes_activos}</td>
                        <td>{d.programados}</td>
                        <td>{d.anulados}</td>
                        <td className="col-acc">
                          <button
                            className="btn-link chico"
                            onClick={() => {
                              setFiltroDia(activo ? '' : d.periodo);
                              setFiltroMes('');
                              setFiltroAnio('');
                            }}
                          >
                            {activo ? 'Quitar' : 'Ver día'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaStats === 'mes' && (
          <div className="tabla-stats-wrap">
            {stats.porMes.length === 0 ? (
              <p className="vacio">No hay datos mensuales para los filtros seleccionados.</p>
            ) : (
              <table className="tabla-viajes tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Viajes Realizados</th>
                    <th style={{ width: '30%' }}>Volumen</th>
                    <th>Prom. Diario</th>
                    <th>Clientes Únicos</th>
                    <th>Días Activos</th>
                    <th>Anulados</th>
                    <th className="col-acc">Filtro</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.porMes.map((m) => {
                    const pct = Math.round((m.realizados / maxMes) * 100);
                    const prom = m.dias_activos ? (m.realizados / m.dias_activos).toFixed(1) : '0';
                    const activo = filtroMes === m.periodo;
                    return (
                      <tr key={m.periodo} className={activo ? 'fila-seleccionada' : ''}>
                        <td><b>{formatearMes(m.periodo)}</b></td>
                        <td><b>{m.realizados}</b></td>
                        <td>
                          <div className="barra-progreso-fondo">
                            <div className="barra-progreso-relleno" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td>{prom} / día</td>
                        <td>{m.clientes_unicos}</td>
                        <td>{m.dias_activos}</td>
                        <td>{m.anulados}</td>
                        <td className="col-acc">
                          <button
                            className="btn-link chico"
                            onClick={() => {
                              setFiltroMes(activo ? '' : m.periodo);
                              setFiltroDia('');
                              setFiltroAnio('');
                            }}
                          >
                            {activo ? 'Quitar' : 'Ver mes'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaStats === 'anio' && (
          <div className="tabla-stats-wrap">
            {stats.porAnio.length === 0 ? (
              <p className="vacio">No hay datos anuales para los filtros seleccionados.</p>
            ) : (
              <table className="tabla-viajes tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th>Viajes Realizados</th>
                    <th style={{ width: '30%' }}>Volumen</th>
                    <th>Prom. Mensual</th>
                    <th>Clientes Únicos</th>
                    <th>Meses Activos</th>
                    <th>Anulados</th>
                    <th className="col-acc">Filtro</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.porAnio.map((a) => {
                    const pct = Math.round((a.realizados / maxAnio) * 100);
                    const prom = a.meses_activos ? (a.realizados / a.meses_activos).toFixed(1) : '0';
                    const activo = filtroAnio === a.periodo;
                    return (
                      <tr key={a.periodo} className={activo ? 'fila-seleccionada' : ''}>
                        <td><b>{a.periodo}</b></td>
                        <td><b>{a.realizados}</b></td>
                        <td>
                          <div className="barra-progreso-fondo">
                            <div className="barra-progreso-relleno" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td>{prom} / mes</td>
                        <td>{a.clientes_unicos}</td>
                        <td>{a.meses_activos}</td>
                        <td>{a.anulados}</td>
                        <td className="col-acc">
                          <button
                            className="btn-link chico"
                            onClick={() => {
                              setFiltroAnio(activo ? '' : a.periodo);
                              setFiltroDia('');
                              setFiltroMes('');
                            }}
                          >
                            {activo ? 'Quitar' : 'Ver año'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaStats === 'ranking' && (
          <div className="grilla-rankings-clientes">
            <div className="bloque-ranking">
              <h4>📱 Clientes más frecuentes</h4>
              {stats.topClientes.length === 0 ? (
                <p className="vacio">Sin clientes con teléfono registrado.</p>
              ) : (
                <table className="tabla-viajes">
                  <thead>
                    <tr>
                      <th>Teléfono</th>
                      <th>Destino frecuente</th>
                      <th>Viajes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topClientes.map((c) => (
                      <tr key={c.telefono}>
                        <td>
                          <div className="celda-tel-acciones">
                            <TelefonoWhatsApp telefono={c.telefono} nombre={c.nombre_cliente} />
                            <button
                              className="btn-filtro-mini"
                              title="Filtrar por este teléfono"
                              onClick={() => setTelefono(c.telefono)}
                            >
                              🔍
                            </button>
                          </div>
                        </td>
                        <td className="tenue">{c.destino_frecuente || c.ultimo_destino || '—'}</td>
                        <td><b>{c.realizados}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bloque-ranking">
              <h4>📍 Destinos más solicitados</h4>
              {stats.topDestinos.length === 0 ? (
                <p className="vacio">Sin destinos registrados.</p>
              ) : (
                <table className="tabla-viajes">
                  <thead>
                    <tr>
                      <th>Destino</th>
                      <th>Clientes</th>
                      <th>Viajes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topDestinos.map((d) => (
                      <tr key={d.direccion}>
                        <td>
                          <button
                            className="btn-texto-filtrable"
                            title="Click para filtrar por este destino"
                            onClick={() => setDestino(d.direccion)}
                          >
                            {d.direccion}
                          </button>
                        </td>
                        <td>{d.clientes_unicos}</td>
                        <td><b>{d.realizados}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bloque-ranking">
              <h4>🚕 Viajes por Chofer</h4>
              {stats.topChoferes.length === 0 ? (
                <p className="vacio">Sin choferes registrados.</p>
              ) : (
                <table className="tabla-viajes">
                  <thead>
                    <tr>
                      <th>Chofer</th>
                      <th>Clientes</th>
                      <th>Viajes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topChoferes.map((ch) => (
                      <tr key={ch.chofer_id || ch.chofer}>
                        <td>
                          <button
                            className="btn-texto-filtrable"
                            title="Click para filtrar por este chofer"
                            onClick={() => {
                              if (ch.chofer_id) {
                                setChoferId(String(ch.chofer_id));
                                setChofer('');
                              } else {
                                setChofer(ch.chofer);
                              }
                            }}
                          >
                            {ch.chofer}
                          </button>
                        </td>
                        <td>{ch.clientes_unicos}</td>
                        <td><b>{ch.realizados}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Listado de Viajes Filtrados */}
      <section className="tarjeta listado-tarjeta">
        <div className="listado-cabecera" style={{ marginBottom: 12 }}>
          <div className="titulos-listado">
            <h3>Listado de Viajes ({viajes.length})</h3>
            <span className="resumen-viajes">
              Hacé click en el teléfono para abrir WhatsApp o en la lupa/destino/chofer para filtrar.
            </span>
          </div>
        </div>

        {cargando ? (
          <p className="cargando">Buscando viajes y calculando estadísticas…</p>
        ) : viajes.length === 0 ? (
          <p className="vacio">No se encontraron viajes con los filtros aplicados.</p>
        ) : (
          <table className="tabla-viajes tabla-filas-clickeables">
            <thead>
              <tr>
                <th>Fecha / Turno</th>
                <th className="col-num">N°</th>
                <th className="col-hora">Hora Inicio</th>
                <th className="col-fin">Asignado</th>
                <th>Chofer</th>
                <th className="col-avisado">Estado</th>
                <th>Teléfono / Cliente</th>
                <th className="col-dir">Destino</th>
                <th>Operador</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((v) => (
                <tr
                  key={v.id}
                  className={v.cancelado ? 'fila-anulada fila-clickeable' : 'fila-clickeable'}
                  onClick={() => setViajeFichaId(v.id)}
                  title="Click para abrir la Ficha de Viaje y ver su historial"
                >
                  <td>
                    <b>{formatearDia(v.fecha_turno)}</b>
                    <div className="subtexto-op">Turno {v.tipo_turno}</div>
                  </td>
                  <td className="col-num">{v.numero != null ? (v.numero_formateado || formatearNumeroViaje(v.numero, v.tipo_turno)) : '—'}</td>
                  <td className="col-hora">
                    <b>{hora(v.hora_toma)}</b>
                  </td>
                  <td className="col-fin">{v.hora_asignacion || v.hora_fin ? hora(v.hora_asignacion || v.hora_fin) : '—'}</td>
                  <td><b>{v.chofer || <span className="tenue">Sin asignar</span>}</b></td>
                  <td className="col-avisado">{v.hora_avisado ? <b>{hora(v.hora_avisado)}</b> : <span className="tenue">—</span>}</td>
                  <td>
                    <div className="celda-tel-acciones">
                      <TelefonoWhatsApp telefono={v.telefono} nombre={v.nombre_cliente} />
                      {v.telefono && (
                        <button
                          className="btn-filtro-mini"
                          title={`Filtrar viajes del teléfono ${v.telefono}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTelefono(v.telefono);
                          }}
                        >
                          🔍
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="col-dir">
                    <span className="texto-direccion">{v.direccion}</span>
                  </td>
                  <td className="tenue">{v.operador || '—'}</td>
                  <td>
                    {v.cancelado ? (
                      <span className="chip alerta">Anulado</span>
                    ) : v.numero != null ? (
                      <span className="chip exito">Realizado</span>
                    ) : (
                      <span className="chip prog">Programado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {viajeFichaId != null && (
        <FichaViajeModal
          viajeId={viajeFichaId}
          choferes={choferesLista.filter((c) => c.activo)}
          editable={true}
          onClose={() => setViajeFichaId(null)}
          onGuardado={cargarDatos}
        />
      )}
    </div>
  );
}
