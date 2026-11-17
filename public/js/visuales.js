// Las tres animaciones "firma": un dibujo en movimiento por producto, hecho con HTML y CSS.
// Son decorativas (aria-hidden): lo que cuentan también está escrito en el texto.

import { h, s } from './dom.js';

/** El marco común: adentro, las medidas van en proporción a su ancho (unidades cqw). */
const lienzo = (clase, ...hijos) =>
  h('div', { class: 'visual', 'aria-hidden': 'true' }, h('div', { class: `visual__lienzo ${clase}` }, hijos));

/** Cobro Flotante: el ícono del vendedor y el monitor del cliente. */
function cobro() {
  return lienzo(
    'v-cobro',
    h(
      'div',
      { class: 'vc-vendedor' },
      h(
        'div',
        { class: 'vc-boton' },
        s(
          'svg',
          { viewBox: '0 0 100 100' },
          s('circle', { class: 'vc-aro-fondo', cx: 50, cy: 50, r: 45 }),
          s('circle', { class: 'vc-aro', cx: 50, cy: 50, r: 45, pathLength: 1 }),
        ),
        h('span', { text: '$' }),
        h('i', { class: 'vc-onda' }),
      ),
      h(
        'div',
        { class: 'vc-globos' },
        h('div', { class: 'vc-globo vc-importe' }, h('small', { text: 'IMPORTE' }), h('b', { text: '$ 29.100' })),
        h('div', { class: 'vc-globo vc-aviso', text: '✓ LLEGÓ $ 29.100' }),
      ),
    ),
    h(
      'div',
      { class: 'vc-monitor' },
      h(
        'div',
        { class: 'vc-pantalla' },
        h('div', { class: 'vc-estado vc-espera' }, h('span', { text: 'Cobro Flotante' })),
        h(
          'div',
          { class: 'vc-estado vc-total' },
          h('small', { text: 'TOTAL' }),
          h('b', { text: '$ 29.100' }),
          h('small', { text: 'ALIAS' }),
          h('em', { text: 'tu.alias.mp' }),
        ),
        h('div', { class: 'vc-estado vc-recibido' }, h('i', { text: '✓' }), h('b', { text: 'PAGO RECIBIDO' })),
      ),
      h('div', { class: 'vc-pie' }),
    ),
  );
}

// Los colores son los de cada módulo en FRIGO.
const MODULOS_FRIGO = [
  ['Chacra', '#5fcb8a'],
  ['Báscula', '#e3c04b'],
  ['Empaque', '#f27a9b'],
  ['Frío', '#5db2f0'],
  ['Cargas', '#b49af0'],
];

// Una cámara de 10 x 4: 0 vacío, 1 pallet, 2 pallet de una carga (va con su color).
const CAMARA = [
  [1, 1, 2, 2, 1, 1, 0, 1, 1, 1],
  [1, 1, 2, 2, 1, 0, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 1, 1, 2, 2, 0],
  [1, 1, 1, 0, 1, 1, 1, 2, 2, 1],
];
const CLASE_DE_CELDA = ['', 'vf-pallet', 'vf-pallet vf-carga'];

/** FRIGO: la línea de la producción y el mapa de una cámara. */
function frigo() {
  const celdas = CAMARA.flat();
  const ocupadas = celdas.filter(Boolean).length + 1; // + el pallet que se está moviendo
  const porcentaje = Math.round((100 * ocupadas) / celdas.length);

  return lienzo(
    'v-frigo',
    h(
      'div',
      { class: 'vf-linea' },
      h('div', { class: 'vf-riel' }),
      MODULOS_FRIGO.map(([nombre, color], i) =>
        h('div', { class: 'vf-nodo', vars: { '--c': color, '--i': i } }, h('i'), h('span', { text: nombre })),
      ),
      h('div', { class: 'vf-viajero' }, h('i')),
    ),
    h(
      'div',
      { class: 'vf-camara' },
      h('div', { class: 'vf-rotulo' }, h('span', { text: 'CÁMARA 1' }), h('span', { text: `${porcentaje} % ocupada` })),
      h(
        'div',
        { class: 'vf-mapa' },
        celdas.map((tipo, n) => h('i', { class: CLASE_DE_CELDA[tipo] || null, vars: { '--n': n % 10 } })),
        h('em', { class: 'vf-mueve' }),
      ),
    ),
  );
}

/** Preparador de listas: los archivos pasan por la receta y el control. */
function listas() {
  return lienzo(
    'v-listas',
    h(
      'div',
      { class: 'vl-estaciones' },
      ['Descarga', 'Receta', 'Control', 'Sistema'].map((nombre, j) =>
        h('div', { class: 'vl-estacion', vars: { '--j': j } }, h('i'), h('span', { text: nombre })),
      ),
    ),
    h(
      'div',
      { class: 'vl-cinta' },
      ['.xlsx', '.zip', '.csv', '.dbf'].map((extension, i) =>
        h('div', { class: 'vl-carril', vars: { '--i': i } }, h('span', { class: 'vl-archivo', text: extension })),
      ),
    ),
    h(
      'div',
      { class: 'vl-reglas' },
      h('span', {}, h('b', { text: '> 20 %' }), ' de códigos faltan: no pasa'),
      h('span', {}, h('b', { text: '± 30 %' }), ' de precio: avisa'),
    ),
  );
}

// Cada fruta: [carril (0 a 2), demora en segundos, lo que marca la IA si tiene una falla].
const FRUTAS_EN_CAMARA = [
  [0, 0],
  [1, -1.4],
  [2, -2.6, 'GOLPE 92 %'],
  [0, -3.4],
  [1, -4.6],
  [2, -5.6],
  [0, -6.2, 'REVISAR 87 %'],
  [1, -7.3],
];

/** FRIGO Visión: lo que ve una cámara sobre la línea, con la IA marcando una posible falla. */
function vision() {
  return lienzo(
    'v-vision',
    h(
      'div',
      { class: 'vv-camara' },
      h('div', { class: 'vv-cinta' }),
      FRUTAS_EN_CAMARA.map(([carril, demora, falla]) =>
        h(
          'div',
          { class: falla ? 'vv-fruta vv-falla' : 'vv-fruta', vars: { '--carril': carril, '--demora': `${demora}s` } },
          falla && h('span', { class: 'vv-caja' }, h('b', { text: falla })),
        ),
      ),
      h('div', { class: 'vv-barrido' }),
      h('div', { class: 'vv-mira' }),
      h('div', { class: 'vv-hud vv-hud--izq', text: 'CÁM 1 · TAMBOR 1 · CAT1' }),
      h('div', { class: 'vv-hud vv-hud--der' }, h('i'), 'EN VIVO'),
    ),
    h('p', { class: 'vv-pie', text: 'Ilustración: así marca la IA una posible falla.' }),
  );
}

const VISUALES = { cobro, frigo, listas, vision };

export function crearVisual(nombre) {
  return (VISUALES[nombre] ?? cobro)();
}
