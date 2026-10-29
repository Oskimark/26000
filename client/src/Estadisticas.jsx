import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './api.js';
import MapaCalorSanJose from './MapaCalorSanJose.jsx';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lun', completo: 'Lunes' },
  { id: 2, nombre: 'Mar', completo: 'Martes' },
  { id: 3, nombre: 'Mié', completo: 'Miércoles' },
  { id: 4, nombre: 'Jue', completo: 'Jueves' },
  { id: 5, nombre: 'Vie', completo: 'Viernes' },
  { id: 6, nombre: 'Sáb', completo: 'Sábado' },
  { id: 0, nombre: 'Dom', completo: 'Domingo' },
];

function fechaAISO(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Estadisticas() {
  // Filtros
  const [presetFecha, setPresetFecha] = useState('30dias');
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return fechaAISO(d);
  });
  const [hasta, setHasta] = useState(() => fechaAISO(new Date()));

  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5, 6, 0]);
  const [horaDesde, setHoraDesde] = useState(0);
  const [horaHasta, setHoraHasta] = useState(23);
  const [tipoTurno, setTipoTurno] = useState('');
  const [choferId, setChoferId] = useState('');
  const [cliente, setCliente] = useState('');

  // Datos
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [choferes, setChoferes] = useState([]);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);

  // Cargar lista de choferes para el selector
  useEffect(() => {
    api('/choferes')
      .then((lista) => setChoferes(lista || []))
      .catch(() => {});
  }, []);

  // Función para aplicar presets de fecha
  function aplicarPresetFecha(tipo) {
    setPresetFecha(tipo);
    const hoy = new Date();
    if (tipo === 'hoy') {
      const f = fechaAISO(hoy);
      setDesde(f);
      setHasta(f);
    } else if (tipo === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDesde(fechaAISO(d));
      setHasta(fechaAISO(hoy));
    } else if (tipo === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setDesde(fechaAISO(d));
      setHasta(fechaAISO(hoy));
    } else if (tipo === 'esteMes') {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setDesde(fechaAISO(d));
      setHasta(fechaAISO(hoy));
    } else if (tipo === 'todo') {
      setDesde('');
      setHasta('');
    }
  }

  // Toggle de días de la semana
  function toggleDia(diaId) {
    setDiasSeleccionados((prev) => {
      if (prev.includes(diaId)) {
        if (prev.length === 1) return prev; // mantener al menos 1
        return prev.filter((d) => d !== diaId);
      }
      return [...prev, diaId];
    });
  }

  function setDiasTodos() {
    setDiasSeleccionados([1, 2, 3, 4, 5, 6, 0]);
  }

  function setDiasHabiles() {
    setDiasSeleccionados([1, 2, 3, 4, 5]);
  }

  function setDiasFinSemana() {
    setDiasSeleccionados([6, 0]);
  }

  function aplicarPresetHoras(tipo) {
    if (tipo === 'todo') {
      setHoraDesde(0);
      setHoraHasta(23);
    } else if (tipo === 'madrugada') {
      setHoraDesde(0);
      setHoraHasta(6);
    } else if (tipo === 'manana') {
      setHoraDesde(6);
      setHoraHasta(12);
    } else if (tipo === 'tarde') {
      setHoraDesde(12);
      setHoraHasta(18);
    } else if (tipo === 'noche') {
      setHoraDesde(18);
      setHoraHasta(23);
    }
  }

  function limpiarFiltros() {
    aplicarPresetFecha('30dias');
    setDiasTodos();
    setHoraDesde(0);
    setHoraHasta(23);
    setTipoTurno('');
    setChoferId('');
    setCliente('');
  }

  // Carga de estadísticas desde la API
  const cargarEstadisticas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      if (diasSeleccionados.length < 7) {
        params.set('dias', diasSeleccionados.join(','));
      }
      if (horaDesde !== 0 || horaHasta !== 23) {
        params.set('horaDesde', String(horaDesde));
        params.set('horaHasta', String(horaHasta));
      }
      if (tipoTurno) params.set('tipoTurno', tipoTurno);
      if (choferId) params.set('choferId', String(choferId));
      if (cliente.trim()) params.set('cliente', cliente.trim());

      const res = await api(`/admin/estadisticas?${params.toString()}`);
      setDatos(res);
    } catch (err) {
      setError(err.message || 'Error al cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, diasSeleccionados, horaDesde, horaHasta, tipoTurno, choferId, cliente]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Cálculos de insights y planes de acción automáticos
  const insights = useMemo(() => {
    if (!datos || !datos.totales || datos.totales.totalViajes === 0) return null;

    // Hora con mayor demanda
    const horaMax = [...(datos.porHora || [])].sort((a, b) => b.cantidad - a.cantidad)[0];
    // Día con mayor demanda
    const diaMax = [...(datos.porDiaSemana || [])].sort((a, b) => b.cantidad - a.cantidad)[0];
    // Porcentaje del top 5 destinos
    const viajesTop5 = (datos.topDestinos || []).slice(0, 5).reduce((acc, d) => acc + d.cantidad, 0);
    const pctTop5 = Number(((viajesTop5 / datos.totales.totalViajes) * 100).toFixed(1));

    return {
      horaPico: horaMax?.cantidad > 0 ? `${horaMax.etiqueta} (${horaMax.cantidad} viajes)` : '—',
      diaFuerte: diaMax?.cantidad > 0 ? `${diaMax.nombre} (${diaMax.cantidad} viajes)` : '—',
      concentracionTop5: pctTop5,
    };
  }, [datos]);

  const maxHoraCantidad = Math.max(...(datos?.porHora || []).map((h) => h.cantidad), 1);
  const maxDiaCantidad = Math.max(...(datos?.porDiaSemana || []).map((d) => d.cantidad), 1);

  return (
    <div className="modulo-estadisticas">
      {/* 1. Panel de Filtros Multidimensionales */}
      <div className="tarjeta seccion-filtros-estadisticas">
        <div className="cabecera-panel-filtros">
          <div>
            <h3>🔍 Filtros de Segmentación</h3>
            <p className="descripcion-filtros">
              Ajustá los filtros para segmentar tu demanda por fechas, días, rangos horarios, turnos, chofer y cliente.
            </p>
          </div>
          <div className="acciones-filtros-top">
            <button type="button" className="btn chico" onClick={limpiarFiltros} title="Restablecer todos los filtros">
              ✖ Limpiar filtros
            </button>
            <button
              type="button"
              className="btn chico primario"
              onClick={cargarEstadisticas}
              disabled={cargando}
            >
              {cargando ? 'Cargando…' : '🔄 Actualizar datos'}
            </button>
          </div>
        </div>

        {/* Fila 1: Presets y Rango de Fechas */}
        <div className="grilla-filtros-fila">
          <div className="campo-filtro">
            <label>Rango de Fechas:</label>
            <div className="grupo-botones-preset">
              <button
                type="button"
                className={presetFecha === 'hoy' ? 'btn-preset activo' : 'btn-preset'}
                onClick={() => aplicarPresetFecha('hoy')}
              >
                Hoy
              </button>
              <button
                type="button"
                className={presetFecha === '7dias' ? 'btn-preset activo' : 'btn-preset'}
                onClick={() => aplicarPresetFecha('7dias')}
              >
                7 días
              </button>
              <button
                type="button"
                className={presetFecha === '30dias' ? 'btn-preset activo' : 'btn-preset'}
                onClick={() => aplicarPresetFecha('30dias')}
              >
                30 días
              </button>
              <button
                type="button"
                className={presetFecha === 'esteMes' ? 'btn-preset activo' : 'btn-preset'}
                onClick={() => aplicarPresetFecha('esteMes')}
              >
                Este mes
              </button>
              <button
                type="button"
                className={presetFecha === 'todo' ? 'btn-preset activo' : 'btn-preset'}
                onClick={() => aplicarPresetFecha('todo')}
              >
                Todo
              </button>
            </div>
          </div>

          <div className="campo-filtro fechas-inputs">
            <div>
              <label>Desde:</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setDesde(e.target.value);
                  setPresetFecha('personalizado');
                }}
              />
            </div>
            <div>
              <label>Hasta:</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setHasta(e.target.value);
                  setPresetFecha('personalizado');
                }}
              />
            </div>
          </div>

          <div className="campo-filtro">
            <label>Turno:</label>
            <select value={tipoTurno} onChange={(e) => setTipoTurno(e.target.value)}>
              <option value="">Ambos turnos (A y B)</option>
              <option value="A">Turno A (03:00 a 15:00)</option>
              <option value="B">Turno B (15:00 a 03:00)</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Días de la semana y Horas */}
        <div className="grilla-filtros-fila">
          <div className="campo-filtro">
            <div className="subcabecera-filtro">
              <label>Días de la semana:</label>
              <div className="atajos-dias">
                <button type="button" className="btn-link chico" onClick={setDiasTodos}>Todos</button>
                <span>·</span>
                <button type="button" className="btn-link chico" onClick={setDiasHabiles}>Lun-Vie</button>
                <span>·</span>
                <button type="button" className="btn-link chico" onClick={setDiasFinSemana}>Sáb-Dom</button>
              </div>
            </div>
            <div className="selector-dias-semana">
              {DIAS_SEMANA.map((d) => {
                const activo = diasSeleccionados.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`btn-dia-semana ${activo ? 'activo' : ''}`}
                    onClick={() => toggleDia(d.id)}
                    title={d.completo}
                  >
                    {d.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="campo-filtro">
            <div className="subcabecera-filtro">
              <label>Franja Horaria:</label>
              <div className="atajos-dias">
                <button type="button" className="btn-link chico" onClick={() => aplicarPresetHoras('todo')}>24h</button>
                <span>·</span>
                <button type="button" className="btn-link chico" onClick={() => aplicarPresetHoras('manana')}>Mañana</button>
                <span>·</span>
                <button type="button" className="btn-link chico" onClick={() => aplicarPresetHoras('tarde')}>Tarde</button>
                <span>·</span>
                <button type="button" className="btn-link chico" onClick={() => aplicarPresetHoras('noche')}>Noche</button>
              </div>
            </div>
            <div className="rango-horas-selectores">
              <select value={horaDesde} onChange={(e) => setHoraDesde(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 hs
                  </option>
                ))}
              </select>
              <span className="separador-horas">a</span>
              <select value={horaHasta} onChange={(e) => setHoraHasta(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:59 hs
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="campo-filtro">
            <label>Filtrar por Chofer:</label>
            <select value={choferId} onChange={(e) => setChoferId(e.target.value)}>
              <option value="">Todos los choferes ({choferes.length})</option>
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-filtro">
            <label>Filtrar por Cliente:</label>
            <input
              type="text"
              placeholder="Teléfono o nombre…"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="alerta error">{error}</div>}

      {/* 2. Tarjetas KPI de Métricas Clave */}
      <div className="grilla-kpis-estadisticas">
        <div className="tarjeta-kpi">
          <span className="kpi-etiqueta">Total de Viajes</span>
          <b className="kpi-valor">{datos?.totales?.totalViajes ?? '—'}</b>
          <span className="kpi-sub">en el período filtrado</span>
        </div>

        <div className="tarjeta-kpi">
          <span className="kpi-etiqueta">Clientes Únicos</span>
          <b className="kpi-valor">{datos?.totales?.totalClientes ?? '—'}</b>
          <span className="kpi-sub">atendidos en la base</span>
        </div>

        <div className="tarjeta-kpi">
          <span className="kpi-etiqueta">Promedio Diario</span>
          <b className="kpi-valor">{datos?.totales?.promedioDiario ?? '—'}</b>
          <span className="kpi-sub">viajes por día activo</span>
        </div>

        <div className="tarjeta-kpi">
          <span className="kpi-etiqueta">Choferes en Actividad</span>
          <b className="kpi-valor">{datos?.totales?.totalChoferes ?? '—'}</b>
          <span className="kpi-sub">con viajes asignados</span>
        </div>

        <div className="tarjeta-kpi destacada">
          <span className="kpi-etiqueta">Hora de Mayor Demanda</span>
          <b className="kpi-valor">{insights?.horaPico ?? '—'}</b>
          <span className="kpi-sub">pico horario registrado</span>
        </div>
      </div>

      {/* 3. Mapa de Calor de Destinos en San José de Mayo */}
      <section className="seccion-mapa-calor-wrap tarjeta">
        <div className="cabecera-seccion-mapa">
          <div>
            <h2>🗺️ Mapa de Calor de Destinos (San José de Mayo)</h2>
            <p className="descripcion-mapa">
              Visualización geoespacial de la demanda de viajes. Permite identificar zonas calientes, densidad de paradas y concentración de clientes.
            </p>
          </div>
        </div>

        <MapaCalorSanJose
          destinos={datos?.destinosMapa || []}
          onSeleccionarDestino={setDestinoSeleccionado}
        />

        {destinoSeleccionado && (
          <div className="ficha-destino-seleccionado">
            <span>📍 Destino seleccionado:</span> <b>{destinoSeleccionado.direccion}</b>
            <span>· Viajes: <b>{destinoSeleccionado.cantidad}</b></span>
            {destinoSeleccionado.cliente && <span>· Cliente: <b>{destinoSeleccionado.cliente}</b></span>}
            <button type="button" className="btn-link chico" onClick={() => setDestinoSeleccionado(null)}>
              ✕ Cerrar
            </button>
          </div>
        )}
      </section>

      {/* 4. Gráficas de Comportamiento de Demanda */}
      <div className="grilla-graficas-estadisticas">
        {/* Distribución por Hora (00 a 23 hs) */}
        <section className="tarjeta tarjeta-grafica">
          <div className="cabecera-grafica">
            <h3>⏰ Concentración por Hora del Día</h3>
            <span className="tenue">Frecuencia horaria (00 a 23 hs)</span>
          </div>

          <div className="grafica-barras-horas">
            {(datos?.porHora || []).map((h) => {
              const alturaPct = maxHoraCantidad > 0 ? (h.cantidad / maxHoraCantidad) * 100 : 0;
              const esPico = h.cantidad === maxHoraCantidad && h.cantidad > 0;
              return (
                <div key={h.hora} className="columna-barra-hora" title={`${h.etiqueta}: ${h.cantidad} viajes`}>
                  <div className="barra-relleno-wrap">
                    <div
                      className={`barra-relleno ${esPico ? 'pico' : ''}`}
                      style={{ height: `${Math.max(4, alturaPct)}%` }}
                    >
                      {h.cantidad > 0 && <span className="valor-barra">{h.cantidad}</span>}
                    </div>
                  </div>
                  <span className="etiqueta-hora">{h.hora}h</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Demanda por Día de la Semana */}
        <section className="tarjeta tarjeta-grafica">
          <div className="cabecera-grafica">
            <h3>📅 Demanda por Día de la Semana</h3>
            <span className="tenue">Distribución semanal</span>
          </div>

          <div className="grafica-barras-dias">
            {(datos?.porDiaSemana || []).map((d) => {
              const pct = datos?.totales?.totalViajes > 0
                ? ((d.cantidad / datos.totales.totalViajes) * 100).toFixed(1)
                : '0';
              const anchoPct = maxDiaCantidad > 0 ? (d.cantidad / maxDiaCantidad) * 100 : 0;
              return (
                <div key={d.dia} className="fila-barra-dia">
                  <span className="etiqueta-dia-nombre">{d.nombre}</span>
                  <div className="barra-progreso-track">
                    <div className="barra-progreso-fill" style={{ width: `${anchoPct}%` }} />
                  </div>
                  <span className="cantidad-dia-valor">
                    <b>{d.cantidad}</b> ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 5. Comparativa de Turnos y Destinos Top */}
      <div className="grilla-graficas-estadisticas">
        {/* Top 10 Destinos */}
        <section className="tarjeta tarjeta-grafica">
          <div className="cabecera-grafica">
            <h3>📍 Top Destinos Más Frecuentes</h3>
            <span className="tenue">Puntos con mayor volumen de llamadas</span>
          </div>

          <div className="tabla-ranking-destinos">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Destino / Dirección</th>
                  <th style={{ textAlign: 'right' }}>Viajes</th>
                  <th style={{ width: '120px' }}>% Total</th>
                </tr>
              </thead>
              <tbody>
                {(datos?.topDestinos || []).slice(0, 10).map((dest, i) => (
                  <tr key={dest.id || i}>
                    <td><b>{i + 1}</b></td>
                    <td><span className="texto-direccion">{dest.direccion}</span></td>
                    <td style={{ textAlign: 'right' }}><b>{dest.cantidad}</b></td>
                    <td>
                      <div className="barra-progreso-track mini">
                        <div className="barra-progreso-fill" style={{ width: `${Math.min(100, dest.porcentaje * 3)}%` }} />
                      </div>
                      <span className="porcentaje-mini">{dest.porcentaje}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top 10 Clientes y Participación por Chofer */}
        <section className="tarjeta tarjeta-grafica">
          <div className="cabecera-grafica">
            <h3>👥 Top Clientes Más Frecuentes</h3>
            <span className="tenue">Fidelidad y recurrencia</span>
          </div>

          <div className="tabla-ranking-destinos">
            <table className="tabla-viajes">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente / Teléfono</th>
                  <th style={{ textAlign: 'right' }}>Viajes</th>
                  <th>Último viaje</th>
                </tr>
              </thead>
              <tbody>
                {(datos?.topClientes || []).slice(0, 10).map((cli, i) => (
                  <tr key={cli.telefono || i}>
                    <td><b>{i + 1}</b></td>
                    <td>
                      <b>{cli.nombre || 'Cliente sin nombre'}</b>
                      <div className="subtexto-op">{cli.telefono || 'Sin teléfono'}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}><b>{cli.cantidad}</b></td>
                    <td><span className="tenue">{cli.ultimo_viaje || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 6. Planes de Acción e Insights para el Negocio */}
      <section className="tarjeta seccion-planes-accion">
        <div className="cabecera-planes-accion">
          <h3>💡 Diagnóstico y Planes de Acción Sugeridos</h3>
          <p className="tenue">Conclusiones estratégicas extraídas a partir del período analizado para optimizar despacho y flota.</p>
        </div>

        <div className="grilla-tarjetas-plan">
          <div className="tarjeta-plan">
            <div className="icono-plan">⚡</div>
            <div className="contenido-plan">
              <h4>Refuerzo en Horas Pico</h4>
              <p>
                La mayor concentración se registra a las <b>{insights?.horaPico || 'horas pico'}</b>.
                Se sugiere preasignar guardias de choferes adicionales 30 minutos antes para reducir tiempos de espera de llamadas.
              </p>
            </div>
          </div>

          <div className="tarjeta-plan">
            <div className="icono-plan">📍</div>
            <div className="contenido-plan">
              <h4>Puntos Estratégicos de Espera</h4>
              <p>
                El <b>{insights?.concentracionTop5 || 0}%</b> de los viajes tienen como origen o destino los 5 puntos principales del mapa de calor.
                Ubicar móviles libres en las inmediaciones de estas zonas calientes minimiza el tiempo de traslado inicial.
              </p>
            </div>
          </div>

          <div className="tarjeta-plan">
            <div className="icono-plan">📅</div>
            <div className="contenido-plan">
              <h4>Planificación Semanal</h4>
              <p>
                El día de mayor actividad es el <b>{insights?.diaFuerte || 'del ciclo'}</b>.
                Monitorear este patrón permite escalonar descansos y mantenimiento de móviles en los días con menor volumen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
