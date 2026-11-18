// El idioma de la página: español (el original) o inglés.
//
// Cuál va lo decide pre.js antes de dibujar nada: el que pide la dirección (…/?lang=en),
// el que la persona eligió la última vez o, si no, español. Acá se consulta, se cambia
// con el interruptor ES / EN del menú y se traducen los textos de la interfaz.

import { TEXTOS } from './textos.js';

export const IDIOMAS = ['es', 'en'];

const raiz = document.documentElement;
let actual = IDIOMAS.includes(raiz.dataset.idioma) ? raiz.dataset.idioma : 'es';

/** El idioma que se está mostrando: 'es' o 'en'. */
export const idioma = () => actual;

/** El otro idioma: al que se pasa con el interruptor. */
export const otroIdioma = () => (actual === 'es' ? 'en' : 'es');

/**
 * Un texto de la interfaz en el idioma actual: t('detalle.funciones', { n: 8 }).
 * Si a ese idioma le falta la clave, va el texto en español.
 */
export function t(clave, datos) {
  const texto = TEXTOS[actual][clave] ?? TEXTOS.es[clave] ?? clave;
  if (!datos || typeof texto !== 'string') return texto;
  return texto.replace(/\{(\w+)\}/g, (_, nombre) => datos[nombre] ?? '');
}

/**
 * Traduce lo que está escrito en el HTML:
 *   data-t="clave"                       → el texto del elemento
 *   data-t-attr="aria-label:clave; …"    → sus atributos
 */
export function aplicarTextos(dentroDe = document) {
  for (const el of dentroDe.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of dentroDe.querySelectorAll('[data-t-attr]')) {
    for (const par of el.dataset.tAttr.split(';')) {
      const [atributo, clave] = par.split(':').map((parte) => parte.trim());
      if (atributo && clave) el.setAttribute(atributo, t(clave));
    }
  }
}

/**
 * La dirección dice el idioma cuando no es español (…/?lang=en): así, quien copia el
 * enlace comparte la página en el idioma en que la está viendo.
 */
function anotarEnLaDireccion() {
  const url = new URL(location.href);
  if (actual === 'es') url.searchParams.delete('lang');
  else url.searchParams.set('lang', actual);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

/** Cambia el idioma y lo recuerda para la próxima visita. Los textos los repinta quien llama. */
export function fijarIdioma(nuevo) {
  if (!IDIOMAS.includes(nuevo)) return;
  actual = nuevo;
  raiz.dataset.idioma = nuevo;
  raiz.lang = nuevo === 'es' ? 'es-AR' : nuevo;
  try {
    localStorage.setItem('idioma', nuevo);
  } catch {
    /* sin almacenamiento: vale sólo para esta visita */
  }
  anotarEnLaDireccion();
}

anotarEnLaDireccion();
// Al volver atrás o adelante se llega a direcciones anotadas con el idioma de ese momento.
window.addEventListener('popstate', anotarEnLaDireccion);
