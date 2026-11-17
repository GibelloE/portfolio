// Ayudantes chicos para armar la página sin librerías.

/** ¿La persona pausó las animaciones con el botón del menú? */
export const sinMovimiento = () => document.documentElement.dataset.movimiento === 'quieto';

/** Pausa o reanuda las animaciones de toda la página, y lo recuerda para la próxima visita. */
export function pausarMovimiento(pausar) {
  if (pausar) document.documentElement.dataset.movimiento = 'quieto';
  else delete document.documentElement.dataset.movimiento;
  try {
    localStorage.setItem('movimiento', pausar ? 'quieto' : 'completo');
  } catch {
    /* sin almacenamiento: vale sólo para esta visita */
  }
}

let trabas = 0;

/**
 * Deja quieta la página de fondo mientras hay algo abierto encima (el detalle de un producto,
 * una bóveda a pantalla completa). Devuelve la función que la suelta: con varias cosas
 * abiertas a la vez, la página se libera recién cuando se soltó la última.
 */
export function trabarFondo() {
  trabas += 1;
  document.documentElement.classList.add('sin-scroll');
  let suelta = false;
  return () => {
    if (suelta) return;
    suelta = true;
    trabas -= 1;
    if (trabas === 0) document.documentElement.classList.remove('sin-scroll');
  };
}

const NS_SVG = 'http://www.w3.org/2000/svg';
const formato = new Intl.NumberFormat('es-AR');

function aplicar(el, props) {
  for (const [clave, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (clave === 'class') el.setAttribute('class', valor);
    else if (clave === 'text') el.textContent = valor;
    else if (clave === 'vars') {
      // Variables de CSS por el CSSOM: la política de seguridad no deja usar style="".
      for (const [nombre, v] of Object.entries(valor)) if (v != null) el.style.setProperty(nombre, v);
    } else if (clave === 'on') {
      for (const [evento, fn] of Object.entries(valor)) el.addEventListener(evento, fn);
    } else if (clave === 'data') Object.assign(el.dataset, valor);
    else el.setAttribute(clave, valor === true ? '' : valor);
  }
}

function agregar(el, hijos) {
  el.append(...hijos.flat(Infinity).filter((hijo) => hijo != null && hijo !== false && hijo !== ''));
  return el;
}

/** Crea un elemento HTML: h('p', { class: 'x', text: 'hola' }, hijo1, hijo2). */
export function h(etiqueta, props = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  aplicar(el, props);
  return agregar(el, hijos);
}

/** Lo mismo, para elementos SVG. */
export function s(etiqueta, props = {}, ...hijos) {
  const el = document.createElementNS(NS_SVG, etiqueta);
  aplicar(el, props);
  return agregar(el, hijos);
}

export const numero = (valor) => formato.format(valor);
export const dosCifras = (n) => String(n).padStart(2, '0');

/** Cuenta de 0 hasta `hasta` dentro de un elemento. */
export function contar(el, hasta, duracion = 1500) {
  if (sinMovimiento() || hasta === 0) {
    el.textContent = numero(hasta);
    return;
  }
  const inicio = performance.now();
  const paso = (ahora) => {
    const t = Math.min(1, (ahora - inicio) / duracion);
    const suave = 1 - (1 - t) ** 4;
    el.textContent = numero(Math.round(hasta * suave));
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Llama a `fn` cuando el elemento entra en pantalla (una sola vez). */
export function alVer(el, fn, umbral = 0.3) {
  if (!('IntersectionObserver' in window)) {
    fn();
    return;
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        observador.disconnect();
        fn();
      }
    },
    { threshold: umbral },
  );
  observador.observe(el);
}

/**
 * Una cifra con su etiqueta: { valor, prefijo, sufijo, etiqueta }.
 * Devuelve el <li> y `animar()`, que la cuenta desde cero.
 */
export function cifra({ valor, prefijo = '', sufijo = '', etiqueta }) {
  const num = h('span', { class: 'cifra__num', text: numero(valor) });
  const el = h(
    'li',
    { class: 'cifra' },
    h(
      'strong',
      { class: 'cifra__valor' },
      prefijo && h('span', { class: 'cifra__pre', text: prefijo }),
      num,
      sufijo && h('span', { class: 'cifra__suf', text: sufijo }),
    ),
    h('span', { class: 'cifra__etq', text: etiqueta }),
  );
  return { el, animar: () => contar(num, valor) };
}
