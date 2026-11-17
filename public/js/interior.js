// El interior de una bóveda, a pantalla completa.
//
// En el celular la bóveda no crece hacia abajo: la tapa se corre en su lugar y lo que guarda
// se abre encima de todo, creciendo desde su propio rectángulo. La página de atrás no se
// mueve, así que al cerrar se vuelve exactamente al mismo lugar.

import { h, sinMovimiento, trabarFondo } from './dom.js';
import { icono } from './iconos.js';
import { anotar, borrar } from './historial.js';

/**
 * @param {object} opciones
 * @param {HTMLElement} opciones.boveda   el rectángulo del que sale. El diálogo queda adentro
 *                                        suyo: hereda su color y los estilos de lo que guarda.
 * @param {string} opciones.id
 * @param {string} opciones.titular       lo que dice la barra de arriba
 * @param {HTMLElement} opciones.cont     lo que guarda la bóveda: pasa al diálogo mientras está abierto
 * @param {HTMLElement} opciones.dentro   adonde vuelve al cerrar
 * @param {() => void} opciones.alAbrir   arranca la apertura: ahí se corre la tapa
 * @param {() => void} opciones.alCerrar  terminó de cerrarse: ahí vuelve la tapa
 */
export function crearInterior({ boveda, id, titular, cont, dentro, alAbrir, alCerrar }) {
  let abierto = false;
  let cerrando = false;
  let soltarFondo = null;
  let reloj = null;

  const lugar = h('div', { class: 'interior__lugar' });
  const cuerpo = h(
    'div',
    { class: 'interior__cuerpo' },
    lugar,
    h(
      'button',
      { class: 'boton boton--fantasma interior__volver', type: 'button', on: { click: () => cerrar() } },
      icono('atras', 'flecha'),
      'Volver',
    ),
  );
  const dialogo = h(
    'dialog',
    { class: 'interior', 'aria-labelledby': `${id}-titular` },
    h(
      'div',
      { class: 'interior__barra' },
      h('h3', { class: 'interior__titular', id: `${id}-titular`, text: titular }),
      h(
        'button',
        { class: 'redondo redondo--chico', type: 'button', 'aria-label': 'Cerrar', on: { click: () => cerrar() } },
        icono('cerrar'),
      ),
    ),
    cuerpo,
  );
  boveda.append(dialogo);

  /** De dónde sale y adónde vuelve: el rectángulo de la bóveda dentro de la pantalla. */
  function medir() {
    const b = boveda.getBoundingClientRect();
    const d = dialogo.getBoundingClientRect();
    const borde = (n) => `${Math.max(0, Math.round(n))}px`;
    dialogo.style.setProperty('--i-arriba', borde(b.top - d.top));
    dialogo.style.setProperty('--i-der', borde(d.right - b.right));
    dialogo.style.setProperty('--i-abajo', borde(d.bottom - b.bottom));
    dialogo.style.setProperty('--i-izq', borde(b.left - d.left));
    dialogo.style.setProperty('--i-radio', getComputedStyle(boveda).borderTopLeftRadius);
  }

  function abrir() {
    if (abierto) return;
    abierto = true;
    // Lo de adentro pasa al diálogo todavía oculto, para que después aparezca de a poco.
    lugar.append(cont);
    soltarFondo = trabarFondo();
    dialogo.showModal();
    cuerpo.scrollTop = 0;
    medir();
    anotar(id, () => cerrar({ porHistorial: true }));
    // Con las medidas puestas, arranca: se corre la tapa y el interior crece desde la bóveda.
    dialogo.classList.add('abre');
    alAbrir();
  }

  /**
   * @param {object} [como]
   * @param {boolean} [como.ya]            sin animación
   * @param {boolean} [como.porHistorial]  la persona volvió atrás: el historial ya está al día
   */
  function cerrar({ ya = false, porHistorial = false } = {}) {
    if (!abierto) return;
    if (!porHistorial) borrar(id);
    if (ya || sinMovimiento()) {
      terminar();
      return;
    }
    if (cerrando) return;
    cerrando = true;
    medir(); // la pantalla pudo haber girado: vuelve al rectángulo de ahora
    dialogo.classList.remove('abre');
    dialogo.classList.add('cierra');
    reloj = setTimeout(terminar, 700); // por si la animación no avisa
  }

  function terminar() {
    if (!abierto) return;
    clearTimeout(reloj);
    abierto = false;
    cerrando = false;
    dialogo.classList.remove('abre', 'cierra');
    if (dialogo.open) dialogo.close();
    dentro.append(cont); // lo de adentro vuelve debajo de la tapa
    soltarFondo();
    alCerrar();
  }

  // Las animaciones del propio diálogo (no las de lo que tiene adentro, ni la del fondo).
  dialogo.addEventListener('animationend', (e) => {
    if (e.target !== dialogo || e.pseudoElement) return;
    // Si se cierra justo cuando terminaba de abrirse, ese aviso tardío no cuenta como cierre.
    const esDeCierre = e.animationName === 'interior-cierra' || e.animationName === 'desaparecer';
    if (esDeCierre) {
      if (cerrando) terminar();
    } else if (!cerrando) dialogo.classList.remove('abre'); // ya abierto del todo, queda sin recorte
  });
  // Esc, o el botón Atrás en Android: se cierra con su animación.
  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrar();
  });
  // Si el navegador lo cierra por su cuenta, todo vuelve a su lugar igual.
  dialogo.addEventListener('close', () => {
    if (!abierto) return;
    borrar(id);
    terminar();
  });

  return {
    abrir,
    cerrar,
    get abierto() {
      return abierto;
    },
  };
}
