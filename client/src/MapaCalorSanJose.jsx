import { useEffect, useRef, useState } from 'react';
import L from './leaflet-heat-setup.js';

const CENTRO_SAN_JOSE = [-34.3406, -56.7135];

export default function MapaCalorSanJose({ destinos = [], onSeleccionarDestino }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [modoVisualizacion, setModoVisualizacion] = useState('ambos'); // 'calor' | 'marcadores' | 'ambos'
  const [radioCalor, setRadioCalor] = useState(28);

  // Inicialización del mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CENTRO_SAN_JOSE,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: true,
    });

    // Capa base de OpenStreetMap con estilo limpio
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Forzar redimensionamiento adecuado tras montar
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualización de capas de calor y marcadores al cambiar destinos, modo o radio
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Limpiar capa previa de calor
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // 2. Limpiar marcadores previos
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (!destinos || destinos.length === 0) return;

    // Puntos para Leaflet.heat: [lat, lng, intensidad]
    const maxCantidad = Math.max(...destinos.map((d) => d.cantidad || 1), 1);
    const puntosCalor = destinos
      .filter((d) => d.lat && d.lng)
      .map((d) => {
        // Normalizar intensidad entre 0.3 y 1
        const intensidad = Math.min(1, Math.max(0.3, (d.cantidad || 1) / (maxCantidad * 0.75)));
        return [d.lat, d.lng, intensidad];
      });

    // Añadir capa de calor si corresponde
    if ((modoVisualizacion === 'calor' || modoVisualizacion === 'ambos') && puntosCalor.length > 0) {
      const heat = L.heatLayer(puntosCalor, {
        radius: radioCalor,
        blur: Math.round(radioCalor * 0.65),
        maxZoom: 16,
        max: 1.0,
        gradient: {
          0.2: '#3b82f6', // azul suave
          0.4: '#06b6d4', // cyan
          0.6: '#10b981', // verde lima
          0.8: '#f59e0b', // ámbar
          1.0: '#ef4444', // rojo intenso
        },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
    }

    // Añadir marcadores si corresponde (para los destinos principales)
    if (modoVisualizacion === 'marcadores' || modoVisualizacion === 'ambos') {
      const marcadoresDestinos = destinos.slice(0, 80); // limitar a los 80 más frecuentes para fluidez
      marcadoresDestinos.forEach((d) => {
        if (!d.lat || !d.lng) return;

        const tamaño = Math.min(36, Math.max(22, 18 + Math.log2(d.cantidad + 1) * 4));
        const colorFondo =
          d.cantidad >= 10 ? '#ef4444' : d.cantidad >= 5 ? '#f97316' : '#2563eb';

        const customIcon = L.divIcon({
          className: 'pin-marcador-wrap',
          html: `
            <div class="pin-marcador-punto" style="background:${colorFondo}; width:${tamaño}px; height:${tamaño}px;">
              <span>${d.cantidad}</span>
            </div>
          `,
          iconSize: [tamaño, tamaño],
          iconAnchor: [tamaño / 2, tamaño / 2],
        });

        const marker = L.marker([d.lat, d.lng], { icon: customIcon });

        const popupContent = `
          <div class="popup-mapa-destino">
            <h4>${d.direccion}</h4>
            <div class="popup-stats">
              <p><b>Viajes registrados:</b> ${d.cantidad}</p>
              ${d.ultimoViaje ? `<p><b>Último viaje:</b> ${d.ultimoViaje}</p>` : ''}
              ${d.cliente ? `<p><b>Cliente habitual:</b> ${d.cliente}</p>` : ''}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          onSeleccionarDestino?.(d);
        });

        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [destinos, modoVisualizacion, radioCalor, onSeleccionarDestino]);

  function centrarSanJose() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(CENTRO_SAN_JOSE, 14, { animate: true });
  }

  const destinosMapeados = destinos.filter((d) => d.lat && d.lng);

  return (
    <div className="contenedor-mapa-calor">
      <div className="barra-controles-mapa">
        <div className="grupo-controles-modo">
          <span className="etiqueta-control">Visualización:</span>
          <button
            type="button"
            className={modoVisualizacion === 'calor' ? 'btn chico primario' : 'btn chico'}
            onClick={() => setModoVisualizacion('calor')}
          >
            🔥 Mapa de calor
          </button>
          <button
            type="button"
            className={modoVisualizacion === 'marcadores' ? 'btn chico primario' : 'btn chico'}
            onClick={() => setModoVisualizacion('marcadores')}
          >
            📍 Marcadores
          </button>
          <button
            type="button"
            className={modoVisualizacion === 'ambos' ? 'btn chico primario' : 'btn chico'}
            onClick={() => setModoVisualizacion('ambos')}
          >
            ✨ Ambos
          </button>
        </div>

        {(modoVisualizacion === 'calor' || modoVisualizacion === 'ambos') && (
          <div className="control-slider-radio">
            <span className="etiqueta-control">Radio difuminado:</span>
            <input
              type="range"
              min="15"
              max="50"
              value={radioCalor}
              onChange={(e) => setRadioCalor(Number(e.target.value))}
              title="Ajustar el radio de calor de los puntos"
            />
            <span className="valor-radio">{radioCalor}px</span>
          </div>
        )}

        <div className="acciones-mapa-derecha">
          <span className="contador-destinos-mapa">
            <b>{destinosMapeados.length}</b> destinos mapeados
          </span>
          <button type="button" className="btn chico" onClick={centrarSanJose} title="Volver al centro de San José de Mayo">
            🎯 Centrar San José
          </button>
        </div>
      </div>

      <div className="marco-mapa-leaflet" ref={mapContainerRef} />

      <div className="leyenda-mapa-calor">
        <span className="leyenda-titulo">Densidad de demanda:</span>
        <div className="gradiente-leyenda">
          <span>Baja</span>
          <div className="barra-gradiente" />
          <span>Alta</span>
        </div>
      </div>
    </div>
  );
}
