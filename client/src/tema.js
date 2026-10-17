const CLAVE_TEMA = 'taxis.tema_identidad';

export const CONFIG_TEMA_DEFECTO = {
  modoOscuro: false,
  usarIdentidad: true,
  elementos: {
    marcosTarjetas: true, // Marco naranja en tarjetas y paneles
    bordeEtiquetas: true, // Borde naranja en etiquetas y pestañas
    botonesNaranja: true, // Botones principales en naranja corporativo
    mostrarTitulo: true,  // Título 26000 VEINTISEISMIL en la barra
  },
};

export function leerTema() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (!guardado) return CONFIG_TEMA_DEFECTO;
    const parseado = JSON.parse(guardado);
    return {
      modoOscuro: Boolean(parseado.modoOscuro),
      usarIdentidad: parseado.usarIdentidad ?? true,
      elementos: {
        ...CONFIG_TEMA_DEFECTO.elementos,
        ...(parseado.elementos || {}),
      },
    };
  } catch {
    return CONFIG_TEMA_DEFECTO;
  }
}

export function guardarTema(nuevoTema) {
  try {
    localStorage.setItem(CLAVE_TEMA, JSON.stringify(nuevoTema));
    window.dispatchEvent(new CustomEvent('cambio-tema', { detail: nuevoTema }));
  } catch (err) {
    console.error('Error al guardar tema:', err);
  }
}

