// Geocodificación y coordenadas urbanas para San José de Mayo, Uruguay.
// Coordenadas centrales aproximadas: -34.3406, -56.7135 (Plaza de los Treinta y Tres).

export const CENTRO_SAN_JOSE = { lat: -34.3406, lng: -56.7135 };

// Puntos de interés y sitios de referencia habituales en la ciudad
export const PUNTOS_REFERENCIA = {
  'plaza 33': { lat: -34.3406, lng: -56.7135 },
  'plaza de los treinta y tres': { lat: -34.3406, lng: -56.7135 },
  'plaza principal': { lat: -34.3406, lng: -56.7135 },
  'hospital': { lat: -34.3328, lng: -56.7088 },
  'hospital san jose': { lat: -34.3328, lng: -56.7088 },
  'asse san jose': { lat: -34.3328, lng: -56.7088 },
  'amsj': { lat: -34.3392, lng: -56.7145 },
  'sanatorio amsj': { lat: -34.3392, lng: -56.7145 },
  'asociacion medica': { lat: -34.3392, lng: -56.7145 },
  'terminal': { lat: -34.3347, lng: -56.7052 },
  'terminal de omnibus': { lat: -34.3347, lng: -56.7052 },
  'plaza artigas': { lat: -34.3475, lng: -56.7152 },
  'plaza de deportes': { lat: -34.3475, lng: -56.7152 },
  'parque rodo': { lat: -34.3540, lng: -56.7110 },
  'parque': { lat: -34.3540, lng: -56.7110 },
  'cementerio': { lat: -34.3480, lng: -56.7020 },
  'molino': { lat: -34.3315, lng: -56.7180 },
  'asociacion rural': { lat: -34.3510, lng: -56.7210 },
  'rural': { lat: -34.3510, lng: -56.7210 },
  'expo': { lat: -34.3510, lng: -56.7210 },
  'camino carreton': { lat: -34.3270, lng: -56.7320 },
  'carreton': { lat: -34.3270, lng: -56.7320 },
  'estacion': { lat: -34.3365, lng: -56.7032 },
  'estacion de tren': { lat: -34.3365, lng: -56.7032 },
  'paso del bote': { lat: -34.3550, lng: -56.7180 },
  'picada de las tunas': { lat: -34.3510, lng: -56.7340 },
  'bulevar aparicio saravia': { lat: -34.3585, lng: -56.7120 },
  'saravia': { lat: -34.3585, lng: -56.7120 },
};

// Calles principales con su orientación y eje de coordenadas
// 'NS': corre de Norte a Sur (latitud variable, longitud fija en eje base)
// 'EO': corre de Este a Oeste (longitud variable, latitud fija en eje base)
export const EJES_CALLES = {
  // Calles Norte-Sur (longitudes de Este a Oeste)
  'av larriera': { eje: 'NS', lng: -56.7000, latRef: -34.3300 },
  'larriera': { eje: 'NS', lng: -56.7000, latRef: -34.3300 },
  'bengoa': { eje: 'NS', lng: -56.7025, latRef: -34.3300 },
  'dr bengoa': { eje: 'NS', lng: -56.7025, latRef: -34.3300 },
  'vidal': { eje: 'NS', lng: -56.7050, latRef: -34.3300 },
  'batlle y ordoñez': { eje: 'NS', lng: -56.7075, latRef: -34.3300 },
  'batlle': { eje: 'NS', lng: -56.7075, latRef: -34.3300 },
  '25 de mayo': { eje: 'NS', lng: -56.7100, latRef: -34.3300 },
  'veinticinco de mayo': { eje: 'NS', lng: -56.7100, latRef: -34.3300 },
  '18 de julio': { eje: 'NS', lng: -56.7125, latRef: -34.3300 },
  'dieciocho de julio': { eje: 'NS', lng: -56.7125, latRef: -34.3300 },
  'treinta y tres': { eje: 'NS', lng: -56.7145, latRef: -34.3300 },
  '33': { eje: 'NS', lng: -56.7145, latRef: -34.3300 },
  'artigas': { eje: 'NS', lng: -56.7170, latRef: -34.3300 },
  'general artigas': { eje: 'NS', lng: -56.7170, latRef: -34.3300 },
  'colon': { eje: 'NS', lng: -56.7195, latRef: -34.3300 },
  'zorrilla de san martin': { eje: 'NS', lng: -56.7220, latRef: -34.3300 },
  'zorrilla': { eje: 'NS', lng: -56.7220, latRef: -34.3300 },
  'sarandi': { eje: 'NS', lng: -56.7245, latRef: -34.3300 },
  'cagancha': { eje: 'NS', lng: -56.7270, latRef: -34.3300 },
  'ituzaingo': { eje: 'NS', lng: -56.7295, latRef: -34.3300 },
  'av brasil': { eje: 'NS', lng: -56.7320, latRef: -34.3300 },
  'brasil': { eje: 'NS', lng: -56.7320, latRef: -34.3300 },
  'acosta y lara': { eje: 'NS', lng: -56.7180, latRef: -34.3350 },
  'aleman': { eje: 'NS', lng: -56.7265, latRef: -34.3350 },
  'francia': { eje: 'NS', lng: -56.7280, latRef: -34.3360 },
  'espana': { eje: 'NS', lng: -56.7255, latRef: -34.3370 },
  'ansina': { eje: 'NS', lng: -56.7210, latRef: -34.3410 },
  'asencio': { eje: 'NS', lng: -56.7230, latRef: -34.3430 },
  'montagne': { eje: 'NS', lng: -56.7250, latRef: -34.3450 },

  // Calles Este-Oeste (latitudes de Norte a Sur)
  'av manuel d rodriguez': { eje: 'EO', lat: -34.3300, lngRef: -56.7020 },
  'manuel d rodriguez': { eje: 'EO', lat: -34.3300, lngRef: -56.7020 },
  'rodriguez': { eje: 'EO', lat: -34.3300, lngRef: -56.7020 },
  'cebollati': { eje: 'EO', lat: -34.3325, lngRef: -56.7020 },
  'payan': { eje: 'EO', lat: -34.3345, lngRef: -56.7020 },
  'cipriano payan': { eje: 'EO', lat: -34.3345, lngRef: -56.7020 },
  'di martino': { eje: 'EO', lat: -34.3365, lngRef: -56.7020 },
  'duarte': { eje: 'EO', lat: -34.3385, lngRef: -56.7020 },
  'asamblea': { eje: 'EO', lat: -34.3405, lngRef: -56.7020 },
  '25 de agosto': { eje: 'EO', lat: -34.3425, lngRef: -56.7020 },
  'veinticinco de agosto': { eje: 'EO', lat: -34.3425, lngRef: -56.7020 },
  '19 de abril': { eje: 'EO', lat: -34.3445, lngRef: -56.7020 },
  'diecinueve de abril': { eje: 'EO', lat: -34.3445, lngRef: -56.7020 },
  'rincon': { eje: 'EO', lat: -34.3465, lngRef: -56.7020 },
  'mercedes': { eje: 'EO', lat: -34.3485, lngRef: -56.7020 },
  'misiones': { eje: 'EO', lat: -34.3505, lngRef: -56.7020 },
  'canelones': { eje: 'EO', lat: -34.3525, lngRef: -56.7020 },
  'rivera': { eje: 'EO', lat: -34.3545, lngRef: -56.7020 },
  'av lavalleja': { eje: 'EO', lat: -34.3565, lngRef: -56.7020 },
  'lavalleja': { eje: 'EO', lat: -34.3565, lngRef: -56.7020 },
  'aparicio saravia': { eje: 'EO', lat: -34.3585, lngRef: -56.7020 },
  'bulevar': { eje: 'EO', lat: -34.3585, lngRef: -56.7020 },
  'ciganda': { eje: 'EO', lat: -34.3390, lngRef: -56.7050 },
  'dr arriaga': { eje: 'EO', lat: -34.3375, lngRef: -56.7040 },
  'arriaga': { eje: 'EO', lat: -34.3375, lngRef: -56.7040 },
  'acuna de figueroa': { eje: 'EO', lat: -34.3380, lngRef: -56.7160 },
  'figueroa': { eje: 'EO', lat: -34.3380, lngRef: -56.7160 },
  'antonio pan': { eje: 'EO', lat: -34.3430, lngRef: -56.7150 },
  'pan': { eje: 'EO', lat: -34.3430, lngRef: -56.7150 },
};

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hash numérico simple para agregar una variación sutil determinista */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Geocodifica una dirección o sitio de San José de Mayo.
 * Devuelve { lat, lng } con precisión adecuada para mapas de calor.
 */
export function geocodificarDireccion(texto) {
  const norm = normalizar(texto);
  if (!norm) return { ...CENTRO_SAN_JOSE };

  // 1. Verificación directa con puntos de interés y referencias conocidas
  for (const [clave, coord] of Object.entries(PUNTOS_REFERENCIA)) {
    if (norm.includes(clave)) {
      const hash = hashString(norm);
      const jLat = ((hash % 100) - 50) * 0.000003;
      const jLng = (((hash >> 4) % 100) - 50) * 0.000003;
      return {
        lat: Number((coord.lat + jLat).toFixed(6)),
        lng: Number((coord.lng + jLng).toFixed(6)),
      };
    }
  }

  // 2. Intersección de dos calles (ej: "Artigas y Asamblea", "18 de julio esquina 25 de agosto")
  const conectores = [' y ', ' e ', ' esquina ', ' esq '];
  for (const c of conectores) {
    if (norm.includes(c)) {
      const partes = norm.split(c).map((s) => s.trim()).filter(Boolean);
      if (partes.length >= 2) {
        const c1 = EJES_CALLES[partes[0]] || Object.entries(EJES_CALLES).find(([k]) => partes[0].includes(k))?.[1];
        const c2 = EJES_CALLES[partes[1]] || Object.entries(EJES_CALLES).find(([k]) => partes[1].includes(k))?.[1];
        if (c1 && c2) {
          const lat = c1.eje === 'EO' ? c1.lat : c2.lat;
          const lng = c1.eje === 'NS' ? c1.lng : c2.lng;
          if (lat != null && lng != null) {
            return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
          }
        }
      }
    }
  }

  // 3. Calle con número de puerta (ej: "18 de julio 456", "720 artigas", "asamblea 530")
  // Ordenar claves por longitud descendente para emparejar calles compuestas antes de partes simples
  const clavesOrdenadas = Object.keys(EJES_CALLES).sort((a, b) => b.length - a.length);
  let entradaCalle = null;
  let restoTexto = norm;

  for (const k of clavesOrdenadas) {
    const rx = new RegExp(`(^|\\b)${escapeRegex(k)}(\\b|$)`, 'i');
    if (rx.test(norm)) {
      entradaCalle = EJES_CALLES[k];
      restoTexto = norm.replace(rx, ' ').trim();
      break;
    }
  }

  const matchNum = restoTexto.match(/\b(\d{1,5})\b/);
  const numero = matchNum ? parseInt(matchNum[1], 10) : null;

  if (entradaCalle) {
    const hash = hashString(norm);
    const jJitter = ((hash % 100) - 50) * 0.000004;

    if (entradaCalle.eje === 'NS') {
      const lng = entradaCalle.lng + jJitter;
      // En calles N-S, los números aumentan de Norte a Sur (aprox 100 nros por cuadra = ~0.001 grado)
      let lat = entradaCalle.latRef;
      if (numero && numero > 0 && numero < 3000) {
        lat = entradaCalle.latRef - (numero / 100) * 0.0019;
      } else {
        // Si no hay número, ubicar hacia el centro
        lat = CENTRO_SAN_JOSE.lat + ((hash % 100) - 50) * 0.00008;
      }
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    } else {
      const lat = entradaCalle.lat + jJitter;
      // En calles E-O, los números aumentan de Este a Oeste
      let lng = entradaCalle.lngRef;
      if (numero && numero > 0 && numero < 3000) {
        lng = entradaCalle.lngRef - (numero / 100) * 0.0022;
      } else {
        lng = CENTRO_SAN_JOSE.lng + ((hash % 100) - 50) * 0.00008;
      }
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 4. Fallback dentro del radio de la ciudad con dispersión determinista
  const hash = hashString(norm);
  const offsetLat = ((hash % 200) - 100) * 0.00008;
  const offsetLng = (((hash >> 3) % 200) - 100) * 0.00008;

  return {
    lat: Number((CENTRO_SAN_JOSE.lat + offsetLat).toFixed(6)),
    lng: Number((CENTRO_SAN_JOSE.lng + offsetLng).toFixed(6)),
  };
}
