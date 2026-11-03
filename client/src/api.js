import { io } from 'socket.io-client';

const CLAVE = 'taxis.sesion';

export function leerSesion() {
  try { return JSON.parse(localStorage.getItem(CLAVE)); } catch { return null; }
}
export function guardarSesion(s) {
  if (s) localStorage.setItem(CLAVE, JSON.stringify(s));
  else localStorage.removeItem(CLAVE);
}

let alExpirar = () => {};
export const onSesionExpirada = (fn) => { alExpirar = fn; };

// Seguimiento de asignaciones de chofer en curso para evitar condiciones de carrera con el botón avisar
const choferesEnVuelo = new Map();

export function registrarChoferEnVuelo(viajeId, choferId, promesa) {
  const numId = Number(viajeId);
  const info = {
    choferId: choferId != null && choferId !== '' ? Number(choferId) : null,
    promesa,
    timestamp: Date.now(),
  };
  choferesEnVuelo.set(numId, info);
  promesa.finally(() => {
    setTimeout(() => {
      const actual = choferesEnVuelo.get(numId);
      if (actual && actual.promesa === promesa) {
        choferesEnVuelo.delete(numId);
      }
    }, 1500);
  });
}

export function obtenerChoferEnVuelo(viajeId) {
  return choferesEnVuelo.get(Number(viajeId));
}

export async function esperarChoferEnVuelo(viajeId, msMinimo = 350) {
  const numId = Number(viajeId);
  const actual = choferesEnVuelo.get(numId);
  if (actual?.promesa) {
    try {
      await actual.promesa;
    } catch {
      // Ignorar fallo de chofer para no bloquear
    }
  }
  if (msMinimo > 0) {
    await new Promise((resolve) => setTimeout(resolve, msMinimo));
  }
}

export async function api(ruta, { method = 'GET', body } = {}) {
  const metodoUpper = method.toUpperCase();
  const matchChofer = metodoUpper === 'PUT' && ruta.match(/^\/viajes\/(\d+)\/chofer$/);
  const matchAvisado = metodoUpper === 'PUT' && ruta.match(/^\/viajes\/(\d+)\/avisado$/);

  const promesaFetch = (async () => {
    // Si se intenta avisar un viaje y hay una asignación de chofer en curso para ese viaje,
    // esperamos a que el chofer termine de persistirse antes de enviar el aviso
    if (matchAvisado && body?.avisado !== false) {
      const vId = Number(matchAvisado[1]);
      const vuelo = choferesEnVuelo.get(vId);
      if (vuelo?.promesa) {
        try {
          await vuelo.promesa;
        } catch {
          // Ignorar
        }
      }
    }

    const token = leerSesion()?.token;
    const res = await fetch(`/api${ruta}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const datos = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    if (res.status === 401 && ruta !== '/login') alExpirar();
    if (!res.ok) throw new Error(datos?.error || `Error ${res.status}`);
    return datos;
  })();

  if (matchChofer) {
    registrarChoferEnVuelo(matchChofer[1], body?.choferId, promesaFetch);
  }

  return promesaFetch;
}

export function conectarSocket(token) {
  return io({ auth: { token } });
}
