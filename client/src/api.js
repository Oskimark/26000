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

export async function api(ruta, { method = 'GET', body } = {}) {
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
}

export function conectarSocket(token) {
  return io({ auth: { token } });
}
