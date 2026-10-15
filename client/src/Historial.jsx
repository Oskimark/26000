import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import ListaViajes from './ListaViajes.jsx';
import { fechaISO } from '../../shared/turnos.js';

export default function Historial({ turnos }) {
  const [fecha, setFecha] = useState(() => turnos?.anterior?.fecha || fechaISO(new Date()));
  const [tipo, setTipo] = useState(() => turnos?.anterior?.tipo || 'A');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarTurno = useCallback(async () => {
    if (!fecha || !tipo) return;
    setCargando(true);
    setError('');
    try {
      const res = await api(`/turnos/${fecha}/${tipo}/viajes`);
      setDatos(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fecha, tipo]);

  useEffect(() => {
    cargarTurno();
  }, [cargarTurno]);

  function exportarCSV() {
    if (!datos?.viajes?.length) return;
    const encabezados = ['N°', 'Hora toma', 'Hora programada', 'Hora fin', 'Teléfono', 'Dirección', 'Chofer', 'Operador', 'Estado'];
    const filas = datos.viajes.map((v) => [
      v.numero ?? '',
      v.hora_toma ? new Date(v.hora_toma).toLocaleTimeString('es-AR') : '',
      v.hora_programada ? new Date(v.hora_programada).toLocaleTimeString('es-AR') : '',
      v.hora_fin ? new Date(v.hora_fin).toLocaleTimeString('es-AR') : '',
      `"${v.telefono || ''}"`,
      `"${v.direccion.replace(/"/g, '""')}"`,
      `"${v.chofer || ''}"`,
      `"${v.operador || ''}"`,
      v.cancelado ? 'Anulado' : v.numero ? 'Completado' : 'Pendiente',
    ]);
    const contenido = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viajes_${fecha}_turno_${tipo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const viajesValidos = datos?.viajes?.filter((v) => v.numero != null && !v.cancelado) || [];

  return (
    <div className="historial-wrap">
      <div className="tarjeta cabecera-historial">
        <div className="filtros-historial">
          <label>
            <span>Fecha del turno</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label>
            <span>Turno</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="A">Turno A (03:00 a 15:00)</option>
              <option value="B">Turno B (15:00 a 03:00 día siguiente)</option>
            </select>
          </label>
          <button className="btn primario" onClick={cargarTurno} disabled={cargando}>
            {cargando ? 'Buscando…' : 'Buscar turno'}
          </button>
        </div>

        {datos?.viajes?.length > 0 && (
          <div className="acciones-historial">
            <span className="resumen-viajes">
              <b>{viajesValidos.length}</b> viajes completados
            </span>
            <button className="btn" onClick={exportarCSV}>
              📥 Exportar CSV
            </button>
          </div>
        )}
      </div>

      {error && <div className="alerta error">{error}</div>}

      <div className="tarjeta listado-tarjeta">
        {cargando ? (
          <p className="cargando">Cargando registros históricos…</p>
        ) : datos ? (
          <ListaViajes viajes={datos.viajes} editable={false} />
        ) : null}
      </div>
    </div>
  );
}
