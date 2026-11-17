// Las capturas reales de cada producto: una miniatura dentro de la bóveda que,
// al tocarla, se abre entera en una lupa.

import { h } from './dom.js';
import { icono } from './iconos.js';
import { anotar, borrar } from './historial.js';

const lupa = () => document.getElementById('lupa');

/** Abre la captura entera. Esc, el botón, un toque afuera o el botón Atrás la cierran. */
function ampliar(captura) {
  const imagen = document.getElementById('lupa-imagen');
  imagen.src = captura.src;
  imagen.alt = captura.alt;
  imagen.width = captura.ancho;
  imagen.height = captura.alto;
  document.getElementById('lupa-pie').textContent = captura.pie;
  lupa().showModal();
  lupa().scrollTop = 0;
  anotar('lupa', () => lupa().close());
}

/** Deja lista la lupa: se llama una vez al cargar la página. */
export function activarLupa() {
  const dialogo = lupa();
  document.getElementById('lupa-cerrar').addEventListener('click', () => dialogo.close());
  // Un toque en el fondo oscuro (el propio diálogo, fuera del marco) también la cierra.
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });
  // Se cierre como se cierre, sale del historial.
  dialogo.addEventListener('close', () => borrar('lupa'));
}

/**
 * La miniatura de una captura: { src, mini, ancho, alto, alt, pie, sello }.
 * `sello` dice qué es ("Captura real" si no se indica otra cosa).
 */
export function figuraDeCaptura(captura) {
  return h(
    'figure',
    { class: 'captura' },
    h(
      'button',
      {
        class: 'captura__boton',
        type: 'button',
        'aria-label': `Ampliar: ${captura.pie}`,
        on: { click: () => ampliar(captura) },
      },
      h('img', { src: captura.mini, alt: captura.alt, width: 800, height: 450, loading: 'lazy', decoding: 'async' }),
      h('span', { class: 'captura__sello', text: captura.sello ?? 'Captura real' }),
      h('span', { class: 'captura__ampliar', 'aria-hidden': 'true' }, icono('ampliar')),
    ),
    h('figcaption', { text: captura.pie }),
  );
}

/** Una o más capturas juntas. */
export function galeria(capturas, clase = '') {
  return h('div', { class: `capturas ${clase}`.trim(), data: { cantidad: capturas.length } }, capturas.map(figuraDeCaptura));
}
