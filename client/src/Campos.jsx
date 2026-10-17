import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { api } from './api.js';

const normalizar = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');

/**
 * Dirección con sugerencias mientras se escribe.
 *  - Con teléfono conocido y campo vacío: muestra sus direcciones por asiduidad.
 *  - Flechas: recorrer sugerencias. Tab: usar la sugerencia resaltada.
 *  - Enter: si se eligió con flechas (o el campo está vacío) usa la sugerencia;
 *    si no, deja exactamente lo escrito (dirección nueva).
 */
export const CampoDireccion = forwardRef(function CampoDireccion({ valor, onCambio, telefono, onListo }, ref) {
  const inputRef = useRef(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [indice, setIndice] = useState(-1);
  const [navegado, setNavegado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const pedido = useRef(0);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // Buscar sugerencias (con pequeña espera para no saturar mientras se tipea)
  useEffect(() => {
    const id = ++pedido.current;
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: valor, telefono });
        const lista = await api(`/direcciones?${params}`);
        if (id !== pedido.current) return;
        setSugerencias(lista);
        setIndice(lista.length ? 0 : -1);
        setNavegado(false);
      } catch { /* sin sugerencias */ }
    }, valor ? 120 : 0);
    return () => clearTimeout(t);
  }, [valor, telefono]);

  const resaltada = abierto && indice >= 0 ? sugerencias[indice] : null;
  // Texto "fantasma": lo que falta de la sugerencia si empieza con lo escrito
  const fantasma =
    resaltada && valor && normalizar(resaltada.texto).startsWith(normalizar(valor))
      ? resaltada.texto.slice(valor.length)
      : '';

  function elegir(s) {
    onCambio(s.texto);
    setAbierto(false);
    onListo?.();
  }

  function onKeyDown(e) {
    const hay = abierto && sugerencias.length > 0;
    if (e.key === 'ArrowDown' && sugerencias.length) {
      e.preventDefault();
      setAbierto(true);
      setNavegado(true);
      setIndice((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp' && sugerencias.length) {
      e.preventDefault();
      setNavegado(true);
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (hay && resaltada) {
        e.preventDefault();
        elegir(resaltada);
      } else if (valor.trim()) {
        e.preventDefault();
        setAbierto(false);
        onListo?.();
      }
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      if (hay && resaltada && (navegado || !valor.trim())) elegir(resaltada);
      else if (valor.trim()) { setAbierto(false); onListo?.(); }
    } else if (e.key === 'Escape' && abierto) {
      e.stopPropagation();
      setAbierto(false);
    }
  }

  return (
    <div className="campo-auto">
      <div className="input-fantasma">
        <input
          ref={inputRef}
          value={valor}
          placeholder="Número y calle (ej: 450 Artigas)"
          onChange={(e) => { onCambio(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {fantasma && (
          <span className="fantasma" aria-hidden>
            <span className="invisible">{valor}</span>{fantasma}
          </span>
        )}
      </div>
      {abierto && sugerencias.length > 0 && (
        <ul className="sugerencias">
          {sugerencias.map((s, i) => (
            <li
              key={s.id}
              className={i === indice ? 'activa' : ''}
              onMouseDown={(e) => { e.preventDefault(); elegir(s); }}
            >
              <span>{s.texto}</span>
              <small>
                {s.usos_telefono
                  ? `★ ${s.usos_telefono} con este tel.`
                  : s.es_catalogo
                    ? '🗺️ Calle San José'
                    : `${s.veces_usada} usos`}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const OPCION_SIN_ASIGNAR = { id: null, nombre: 'Sin asignar' };

/** Selector de chofer filtrable con teclado, con "Sin asignar" por defecto. */
export const CampoChofer = forwardRef(function CampoChofer(
  { choferes, choferId, onCambio, onListo, deshabilitado, incluirSinAsignar = true },
  ref,
) {
  const inputRef = useRef(null);
  const opciones = incluirSinAsignar ? [OPCION_SIN_ASIGNAR, ...choferes] : choferes;
  const seleccionado = opciones.find((c) => c.id === (choferId ?? null));

  const [texto, setTexto] = useState(seleccionado?.nombre ?? '');
  const [indice, setIndice] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [interactuado, setInteractuado] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  useEffect(() => {
    setTexto(seleccionado?.nombre ?? (incluirSinAsignar ? 'Sin asignar' : ''));
  }, [choferId, seleccionado?.nombre, incluirSinAsignar]);

  const filtro = normalizar(texto);
  const filtrados =
    abierto && filtro && filtro !== normalizar(seleccionado?.nombre)
      ? opciones
          .filter((c) => normalizar(c.nombre).includes(filtro))
          .sort((a, b) => normalizar(b.nombre).startsWith(filtro) - normalizar(a.nombre).startsWith(filtro))
      : opciones;

  useEffect(() => {
    const i = filtrados.findIndex((c) => c.id === (choferId ?? null));
    setIndice(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, choferes.length, choferId]);

  function elegir(c) {
    onCambio(c.id);
    setTexto(c.nombre);
    setAbierto(false);
    onListo?.();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setInteractuado(true);
      setIndice((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAbierto(true);
      setInteractuado(true);
      setIndice((i) => Math.max(i - 1, 0));
    } else if ((e.key === 'Enter' && !e.ctrlKey) || (e.key === 'Tab' && !e.shiftKey)) {
      const c = filtrados[indice];
      const puedeElegir = abierto && c && !deshabilitado && (e.key === 'Enter' || interactuado);
      if (puedeElegir) {
        e.preventDefault();
        elegir(c);
      } else if (e.key === 'Tab' || seleccionado || deshabilitado) {
        e.preventDefault();
        setAbierto(false);
        onListo?.();
      } else {
        e.preventDefault();
        setAbierto(true);
      }
    } else if (e.key === 'Escape' && abierto) {
      e.stopPropagation();
      setAbierto(false);
    }
  }

  return (
    <div className="campo-auto">
      <input
        ref={inputRef}
        value={texto}
        placeholder={deshabilitado ? 'Sin asignar' : 'Sin asignar'}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          setInteractuado(true);
          if (seleccionado && e.target.value !== seleccionado.nombre) onCambio(null);
        }}
        onFocus={(e) => { setAbierto(true); setInteractuado(false); e.target.select(); }}
        onBlur={() => {
          setTimeout(() => {
            setAbierto(false);
            const actual = opciones.find((c) => c.id === (choferId ?? null));
            setTexto(actual?.nombre ?? (incluirSinAsignar ? 'Sin asignar' : ''));
          }, 150);
        }}
        onKeyDown={onKeyDown}
        className={deshabilitado ? 'atenuado' : ''}
        autoComplete="off"
        spellCheck={false}
      />
      {abierto && !deshabilitado && filtrados.length > 0 && (
        <ul className="sugerencias">
          {filtrados.map((c, i) => (
            <li
              key={c.id ?? 'sin-asignar'}
              className={`${i === indice ? 'activa' : ''} ${c.id === (choferId ?? null) ? 'elegida' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); elegir(c); }}
            >
              <span>{c.nombre}</span>
              {c.id === null && <small>por defecto</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
