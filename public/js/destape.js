// Un "destape": un rectángulo con una tapa que se corre de costado y deja ver lo que hay debajo.
//
//   ┌──────────────────────────┐        ┌──────────────────────┬──┐
//   │››  ¿Qué es Cobro         │   →    │ lo que hay debajo    │‹‹│
//   │    Flotante?             │        │ (texto, cifras…)     │  │
//   └──────────────────────────┘        └──────────────────────┴──┘
//
// Con mouse se destapa al pasar por encima; un clic lo deja fijo.
// En el celular (o en una ventana angosta) el rectángulo no crece: la tapa se corre en su
// lugar y lo de adentro se abre a pantalla completa (interior.js), sin mover la página.

import { h, s, alVer } from './dom.js';
import { crearInterior } from './interior.js';

// El destape al pasar el mouse sólo vale donde el rectángulo no cambia de alto al abrirse.
const destapaAlPasar = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 48rem)');
// Sin mouse o en pantalla angosta (la misma condición que usa el CSS): a pantalla completa.
const aPantallaCompleta = window.matchMedia('(hover: none), (max-width: 47.99rem)');
let serie = 0;

function tirador() {
  return h(
    'span',
    { class: 'destape__tirador', 'aria-hidden': 'true' },
    s(
      'svg',
      { viewBox: '0 0 30 12' },
      [3, 12, 21].map((x, n) => s('path', { d: `M${x} 1l5 5-5 5`, vars: { '--n': n } })),
    ),
  );
}

/**
 * Marca una lista de nodos para que, al destapar, aparezcan de costado y de a uno.
 * Devuelve los mismos nodos (sin los vacíos), listos para usar como contenido.
 */
export function escalonar(nodos) {
  return nodos
    .flat()
    .filter(Boolean)
    .map((nodo, k) => {
      nodo.classList.add('aparece');
      nodo.style.setProperty('--k', k);
      return nodo;
    });
}

/**
 * @param {object} opciones
 * @param {string} opciones.pregunta     lo que dice la tapa ("¿Qué es…?")
 * @param {(Node|string)[]} [opciones.titulo]  la pregunta con formato (si no, va el texto tal cual)
 * @param {string} [opciones.sobre]      rótulo chico arriba de la pregunta
 * @param {Node[]} [opciones.adornos]    lo demás que lleva la tapa (un número, un ícono)
 * @param {Node|Node[]} opciones.contenido  lo que queda debajo
 * @param {'der'|'izq'} [opciones.direccion]  hacia dónde se corre la tapa
 * @param {string} [opciones.clase]
 * @param {number} [opciones.orden]      su lugar en el grupo: escalona el "asomo" inicial
 * @param {boolean} [opciones.boveda]    la tapa es la puerta de una cámara: al abrirse sale niebla
 * @param {Node[]} [opciones.tapaPropia]  una tapa armada aparte (reemplaza al tirador, el rótulo y la pregunta)
 * @param {string} [opciones.titular]    lo que dice la barra de arriba a pantalla completa (si no, la pregunta)
 * @param {() => void} [opciones.alDestapar]  se llama la primera vez que se destapa
 */
export function destape({
  pregunta,
  titulo,
  sobre,
  adornos = [],
  contenido,
  direccion = 'der',
  clase = '',
  orden = 0,
  boveda = false,
  tapaPropia,
  titular = pregunta,
  alDestapar,
}) {
  const id = `destape-${(serie += 1)}`;
  let fijada = false;
  let encima = false;
  let abierta = false;
  let estrenada = false;
  let reloj = null;
  let interior = null;

  const cont = h('div', { class: 'destape__cont' }, contenido);
  const dentro = h('div', { class: 'destape__dentro' }, cont);
  const info = h('div', { class: 'destape__info', id, role: 'region', 'aria-label': pregunta, inert: true }, dentro);

  const tapa = tapaPropia
    ? h(
        'button',
        { class: 'destape__tapa', type: 'button', 'aria-expanded': 'false', 'aria-controls': id, 'aria-label': pregunta },
        tapaPropia,
      )
    : h(
        'button',
        { class: 'destape__tapa', type: 'button', 'aria-expanded': 'false', 'aria-controls': id },
        tirador(),
        h(
          'span',
          { class: 'destape__frente' },
          h('span', { class: 'destape__arriba' }, sobre && h('span', { class: 'destape__sobre', text: sobre }), adornos),
          titulo ? h('span', { class: 'destape__pregunta' }, titulo) : h('span', { class: 'destape__pregunta', text: pregunta }),
          h(
            'span',
            { class: 'destape__pista', 'aria-hidden': 'true' },
            h('span', { class: 'solo-mouse', text: 'Pasá el mouse' }),
            h('span', { class: 'solo-tactil', text: 'Tocá para abrir' }),
          ),
        ),
      );

  const el = h(
    'div',
    {
      class: `destape destape--${direccion} ${boveda ? 'destape--boveda' : ''} ${clase}`.replace(/\s+/g, ' ').trim(),
      data: { abierta: 'false' },
      vars: { '--orden': orden },
    },
    tapa,
    info,
    // Tres capas de niebla: la que sale por la rendija, la que rueda por el piso y un velo.
    boveda && h('div', { class: 'destape__niebla', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
  );

  /** Corre la tapa o la vuelve a su lugar. */
  function marcar(valor) {
    abierta = valor;
    el.dataset.abierta = String(valor);
    tapa.setAttribute('aria-expanded', String(valor));
    if (!valor) return;
    el.classList.remove('asoma');
    if (!estrenada) {
      estrenada = true;
      alDestapar?.();
    }
  }

  /** En su lugar: destapada si está fija o tiene el mouse encima. */
  function aplicar() {
    if (interior?.abierto) return; // a pantalla completa se cierra con sus propios botones
    const ahora = fijada || encima;
    if (ahora === abierta) return;
    marcar(ahora);
    info.inert = !ahora;
  }

  /** A pantalla completa: el diálogo se arma la primera vez que hace falta. */
  function abrirInterior() {
    interior ??= crearInterior({
      boveda: el,
      id,
      titular,
      cont,
      dentro,
      alAbrir: () => marcar(true),
      alCerrar: () => {
        fijada = false;
        encima = false;
        marcar(false);
      },
    });
    interior.abrir();
  }

  // Con mouse: se destapa al pasar por encima y se vuelve a tapar al irse.
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !destapaAlPasar.matches) return;
    clearTimeout(reloj);
    encima = true;
    aplicar();
  });
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      encima = false;
      aplicar();
    }, 160);
  });

  // La tapa es un botón: tocarla (o Enter) la abre, o la vuelve a cerrar.
  tapa.addEventListener('click', () => {
    if (aPantallaCompleta.matches && !abierta) {
      abrirInterior();
      return;
    }
    fijada = !fijada;
    if (!fijada) encima = false;
    aplicar();
  });
  // Un clic sobre lo destapado lo deja fijo, para leer tranquilo.
  info.addEventListener('click', (e) => {
    if (fijada || e.target.closest('a, button')) return;
    fijada = true;
    aplicar();
  });

  // La primera vez que entra en pantalla, la tapa se asoma un poco: avisa que se corre.
  alVer(el, () => !abierta && el.classList.add('asoma'), 0.35);

  return {
    el,
    /** Deja el destape fijo abierto en su lugar, o lo vuelve a tapar (si está a pantalla completa, de una). */
    fijar(valor) {
      if (interior?.abierto) {
        if (!valor) interior.cerrar({ ya: true });
        return;
      }
      fijada = valor;
      if (!valor) encima = false;
      aplicar();
    },
    estaAbierto: () => abierta,
    /** ¿Está abierto a pantalla completa? */
    aPantallaCompleta: () => Boolean(interior?.abierto),
  };
}
