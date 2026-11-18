// El detalle de un producto: una pantalla completa con el resumen animado de sus funciones.
// Cada función es un rectángulo con una pregunta; al pasar el mouse (o tocarlo) la tapa
// se corre de costado y deja ver cómo funciona.

import { h, s, cifra, dosCifras, alVer, sinMovimiento, trabarFondo } from './dom.js';
import { icono } from './iconos.js';
import { t } from './idioma.js';
import { destape, escalonar } from './destape.js';
import { galeria } from './capturas.js';
import { crearVisual } from './visuales.js';

const PREFIJO_URL = '#ver-';

// Al abrir un producto, las tapas se asoman al entrar en pantalla. Al repintarlo porque
// cambió el idioma, no: sólo cambian los textos.
let estrenando = true;

/** La tapa de una función y lo que hay debajo. */
function tapaDeFuncion(funcion, i) {
  const cabeza = h(
    'div',
    { class: 'funcion__cabeza' },
    h('div', { class: 'funcion__marco' }, icono(funcion.icono, 'icono--trazo')),
    h(
      'div',
      {},
      funcion.estado && h('p', { class: 'sello', text: funcion.estado }),
      h('h4', { class: 'funcion__titulo', text: funcion.titulo }),
      h('p', { class: 'funcion__bajada', text: funcion.bajada }),
    ),
  );
  const puntos = funcion.puntos.map((texto) => h('li', { text: texto }));
  const flujo =
    funcion.flujo &&
    h(
      'ol',
      { class: 'flujo', 'aria-label': t('funcion.recorrido') },
      funcion.flujo.map((paso, n) => h('li', { vars: { '--i': n, '--c': paso.color }, text: paso.texto ?? paso })),
    );
  const dato =
    funcion.dato &&
    h('p', { class: 'dato' }, h('strong', { text: funcion.dato.valor }), h('span', { text: funcion.dato.etiqueta }));

  // Las capturas reales de esa función, si las hay: van al costado del texto.
  const capturas = funcion.capturas?.length ? galeria(funcion.capturas) : null;

  // Aparecen de a uno: la cabeza, cada renglón, el recorrido, el dato y las capturas.
  escalonar([cabeza, ...puntos, flujo, dato, capturas]);
  const texto = [cabeza, h('ul', { class: 'puntos' }, puntos), flujo, dato];

  return destape({
    pregunta: funcion.pregunta,
    sobre: t('funcion.sobre', { n: dosCifras(i + 1) }),
    adornos: [icono(funcion.icono, 'destape__icono')],
    contenido: capturas
      ? h('div', { class: 'funcion__cuerpo' }, h('div', { class: 'funcion__texto' }, texto), capturas)
      : texto,
    // Cada tapa se corre para un lado distinto: de a dos, parecen una puerta doble.
    direccion: i % 2 === 0 ? 'izq' : 'der',
    // Con capturas ocupa todo el ancho: el texto de un lado y las pantallas del otro.
    clase: capturas ? 'destape--funcion destape--ancho' : 'destape--funcion',
    orden: i + 1,
    asoma: estrenando,
  });
}

/* ---------- La bóveda de FRIGO Visión ----------
   Tiene aspecto propio: no es una tapa que se corre sino una compuerta verde de dos hojas
   que se separan, con el lente de una cámara y un láser que la recorre. El título va a
   la vista, como en las demás. */

function tapaEspecial(especial, orden) {
  // El lente: un ojo de cámara que mira desde la compuerta.
  const lente = s(
    'svg',
    { class: 'esp-lente', viewBox: '0 0 100 100', 'aria-hidden': 'true' },
    s('circle', { cx: 50, cy: 50, r: 46, class: 'esp-lente__aro' }),
    s('circle', { cx: 50, cy: 50, r: 33, class: 'esp-lente__iris' }),
    s('circle', { cx: 50, cy: 50, r: 13, class: 'esp-lente__pupila' }),
    s('path', { d: 'M50 4v12M50 84v12M4 50h12M84 50h12', class: 'esp-lente__marcas' }),
  );

  const etapas = h(
    'ol',
    { class: 'etapas', 'aria-label': t('especial.etapas') },
    especial.etapas.map((etapa, n) =>
      h(
        'li',
        { class: n < especial.etapaActual ? 'hecha' : null },
        h('span', { text: dosCifras(n + 1) }),
        etapa,
        n < especial.etapaActual && h('span', { class: 'oculto', text: t('especial.cumplida') }),
      ),
    ),
  );

  const texto = escalonar([
    h('p', { class: 'rotulo', text: especial.tipo }),
    h('h4', { class: 'esp-nombre neon', text: especial.nombre }),
    h('p', { class: 'esp-lema', text: especial.lema }),
    h('p', { class: 'esp-bajada', text: especial.bajada }),
    h('ul', { class: 'puntos' }, especial.puntos.map((punto) => h('li', { text: punto }))),
    h('p', { class: 'esp-nota', text: especial.nota }),
    h('div', { class: 'esp-estado' }, h('p', { class: 'rotulo', text: especial.estado }), etapas),
  ]);
  const lado = escalonar([crearVisual('vision'), galeria(especial.capturas)]);

  return destape({
    // Lo que anuncia el botón de la tapa: el título entero.
    pregunta: `${especial.nombre}: ${especial.lema}`,
    // A pantalla completa el título ya va adentro, en grande: la barra pregunta, como las demás.
    titular: t('especial.titular', { nombre: especial.nombre }),
    tapaPropia: [
      h('span', { class: 'esp-hoja esp-hoja--izq', 'aria-hidden': 'true' }),
      h('span', { class: 'esp-hoja esp-hoja--der', 'aria-hidden': 'true' }),
      h(
        'span',
        { class: 'esp-centro', 'aria-hidden': 'true' },
        lente,
        h('span', { class: 'esp-sobre', text: especial.tipo }),
        h('span', { class: 'esp-titulo neon', text: especial.nombre }),
        h('span', { class: 'esp-subtitulo', text: especial.lema }),
        h(
          'span',
          { class: 'esp-pista' },
          h('span', { class: 'solo-mouse', text: t('tapa.pistaMouse') }),
          h('span', { class: 'solo-tactil', text: t('tapa.pistaTactil') }),
        ),
      ),
      h('span', { class: 'esp-laser', 'aria-hidden': 'true' }),
    ],
    contenido: h('div', { class: 'esp-cuerpo' }, h('div', { class: 'esp-texto' }, texto), h('div', { class: 'esp-lado' }, lado)),
    clase: 'destape--especial destape--ancho acento-verde',
    orden,
    asoma: estrenando,
  });
}

function tapaDelProblema(producto) {
  // `problema` es un texto o varios párrafos. El primero va grande; si es uno solo,
  // lo acompaña el resumen del producto.
  const [principal, ...resto] = [].concat(producto.problema);
  const secundarios = resto.length ? resto : [producto.resumen];
  return destape({
    pregunta: t('detalle.problema'),
    sobre: t('detalle.problemaSobre'),
    adornos: [icono('pregunta', 'destape__icono')],
    contenido: escalonar([
      h('p', { class: 'texto-grande', text: principal }),
      ...secundarios.map((texto) => h('p', { class: 'texto-tenue', text: texto })),
    ]),
    clase: 'destape--ancho',
    orden: 0,
    asoma: estrenando,
  });
}

function tapaDeComoEstaHecho(producto, orden) {
  return destape({
    pregunta: t('detalle.hecho'),
    sobre: t('detalle.hechoSobre'),
    adornos: [icono('capas', 'destape__icono')],
    contenido: escalonar([
      h('ul', { class: 'puntos puntos--dos' }, producto.hecho.map((texto) => h('li', { text: texto }))),
      h('ul', { class: 'chips' }, producto.stack.map((t) => h('li', { text: t }))),
      producto.enlaces?.length > 0 &&
        h(
          'p',
          { class: 'enlaces' },
          producto.enlaces.map((enlace) =>
            h(
              'a',
              { class: 'boton boton--fantasma', href: enlace.url, target: '_blank', rel: 'noopener noreferrer' },
              enlace.texto,
              icono('externo', 'flecha'),
            ),
          ),
        ),
    ]),
    clase: 'destape--ancho',
    orden,
    asoma: estrenando,
  });
}

/**
 * Prepara el diálogo del detalle. Devuelve `abrir(id)` y `cambiar(productos)`, que reemplaza
 * los productos por los del otro idioma.
 * El botón Atrás del navegador (o del celular) cierra el detalle.
 */
export function crearDetalle(iniciales) {
  let productos = iniciales;
  const dialogo = document.getElementById('detalle');
  const cuerpo = document.getElementById('detalle-cuerpo');
  const posicion = document.getElementById('detalle-posicion');
  let cerrando = false;
  let mostrado = null; // el producto que está pintado ahora
  let soltarFondo = null;

  /** @param {boolean} estreno  se abre el producto (entra animado), o sólo cambió el idioma */
  function pintar(producto, estreno = true) {
    estrenando = estreno;
    const i = productos.indexOf(producto);
    const siguiente = productos[(i + 1) % productos.length];

    dialogo.className = `detalle acento-${producto.acento}`;
    posicion.textContent = `${dosCifras(i + 1)} / ${dosCifras(productos.length)}`;

    const cabeza = h(
      'header',
      { class: 'd-cabeza' },
      h(
        'div',
        { class: 'd-cabeza__texto' },
        h('p', { class: 'rotulo', text: producto.tipo }),
        h('h2', { class: 'd-nombre neon', id: 'detalle-nombre', text: producto.nombre }),
        producto.alias && h('p', { class: 'd-alias', text: t('detalle.tambien', { alias: producto.alias }) }),
        h('p', { class: 'd-bajada', text: producto.bajada }),
        h(
          'div',
          { class: 'd-sellos' },
          h('p', { class: 'd-estado' }, h('span', { class: 'punto' }), producto.estado),
          producto.destacado &&
            h('p', { class: 'destacado' }, icono(producto.iconoDestacado ?? 'enchufe'), producto.destacado),
        ),
      ),
      h('div', { class: 'd-cabeza__visual' }, crearVisual(producto.visual)),
    );

    const cifras = producto.cifras.map(cifra);
    const listaCifras = h('ul', { class: 'cifras d-cifras', 'aria-label': t('cifras') }, cifras.map((c) => c.el));

    const tapas = [
      tapaDelProblema(producto),
      ...producto.funciones.map(tapaDeFuncion),
      producto.especial && tapaEspecial(producto.especial, producto.funciones.length + 1),
      tapaDeComoEstaHecho(producto, producto.funciones.length + 2),
    ].filter(Boolean);
    const fijarTodas = (valor) => () => tapas.forEach((tapa) => tapa.fijar(valor));

    const preguntas = h(
      'section',
      { class: 'd-preguntas', 'aria-labelledby': 'preguntas-titulo' },
      h(
        'div',
        { class: 'd-preguntas__cabeza' },
        h(
          'div',
          {},
          h('p', { class: 'rotulo', text: t('detalle.funciones', { n: producto.funciones.length }) }),
          h('h3', { class: 'd-preguntas__titulo', id: 'preguntas-titulo', text: t('detalle.destapa') }),
          h(
            'p',
            { class: 'd-preguntas__pista' },
            h('span', { class: 'solo-mouse', text: t('detalle.pistaMouse') }),
            h('span', { class: 'solo-tactil', text: t('detalle.pistaTactil') }),
          ),
        ),
        h(
          'div',
          { class: 'd-preguntas__acciones' },
          h('button', { class: 'boton boton--chico', type: 'button', on: { click: fijarTodas(true) } }, t('detalle.destaparTodo')),
          h('button', { class: 'boton boton--chico boton--fantasma', type: 'button', on: { click: fijarTodas(false) } }, t('detalle.taparTodo')),
        ),
      ),
      h('div', { class: 'rejilla-destapes' }, tapas.map((tapa) => tapa.el)),
    );

    const pie = h(
      'footer',
      { class: 'd-pie' },
      h(
        'button',
        { class: `d-siguiente acento-${siguiente.acento}`, type: 'button', on: { click: () => abrir(siguiente.id, 'reemplazar') } },
        h('span', { class: 'rotulo', text: t('detalle.siguiente') }),
        h('span', { class: 'd-siguiente__nombre neon', text: siguiente.nombre }),
        icono('flecha', 'flecha'),
      ),
    );

    cuerpo.replaceChildren(cabeza, listaCifras, preguntas, pie);
    cuerpo.classList.remove('entra');
    if (!estreno) return;
    // Vuelve a correr la entrada de costado del contenido.
    void cuerpo.offsetWidth;
    cuerpo.classList.add('entra');

    alVer(listaCifras, () => cifras.forEach((c) => c.animar()));
  }

  /** @param {'empujar' | 'reemplazar' | 'nada'} historial */
  function abrir(id, historial = 'empujar') {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    pintar(producto);
    mostrado = id;
    if (!dialogo.open) {
      dialogo.showModal();
      soltarFondo = trabarFondo();
    }
    dialogo.scrollTop = 0;

    const estado = { producto: id };
    if (historial === 'empujar') history.pushState(estado, '', PREFIJO_URL + id);
    else if (historial === 'reemplazar') history.replaceState(estado, '', PREFIJO_URL + id);
  }

  function cerrar() {
    if (!dialogo.open || cerrando) return;
    if (sinMovimiento()) {
      dialogo.close();
      return;
    }
    cerrando = true;
    dialogo.classList.add('cerrando');
    const terminar = (e) => {
      if (e && (e.target !== dialogo || e.animationName !== 'barrer-fuera')) return;
      dialogo.removeEventListener('animationend', terminar);
      clearTimeout(reloj);
      if (dialogo.open) dialogo.close();
    };
    dialogo.addEventListener('animationend', terminar);
    const reloj = setTimeout(() => terminar(), 700);
  }

  // Todo cierre pasa por acá: el botón, Esc o el Atrás del navegador.
  dialogo.addEventListener('close', () => {
    cerrando = false;
    mostrado = null;
    dialogo.classList.remove('cerrando');
    soltarFondo?.();
    cuerpo.replaceChildren();
    if (history.state?.producto) history.back();
  });

  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrar();
  });
  document.getElementById('detalle-cerrar').addEventListener('click', cerrar);
  document.getElementById('detalle-volver').addEventListener('click', cerrar);

  /** El producto que nombra la dirección (…/#ver-frigo), si existe. */
  const productoDeLaDireccion = () => {
    if (!location.hash.startsWith(PREFIJO_URL)) return null;
    const id = decodeURIComponent(location.hash.slice(PREFIJO_URL.length));
    return productos.some((p) => p.id === id) ? id : null;
  };

  // Atrás y Adelante del navegador, o una dirección con #ver-… escrita a mano.
  window.addEventListener('popstate', () => {
    const id = history.state?.producto;
    if (id) {
      // Si es el que ya está a la vista (se cerró una bóveda o una captura que tenía encima),
      // no se vuelve a pintar: se perdería lo destapado y el lugar por donde se iba leyendo.
      if (id !== mostrado) abrir(id, 'nada');
    } else if (productoDeLaDireccion()) abrir(productoDeLaDireccion(), 'reemplazar');
    else cerrar();
  });

  // Un enlace directo a un producto lo abre al cargar; Atrás lo cierra y queda la página.
  const inicial = productoDeLaDireccion();
  if (location.hash.startsWith(PREFIJO_URL)) history.replaceState(null, '', location.pathname + location.search);
  if (inicial) abrir(inicial);

  /** Cambió el idioma: los mismos productos, con los textos del otro. */
  function cambiar(nuevos) {
    productos = nuevos;
    const abierto = productos.find((p) => p.id === mostrado);
    // Si hay uno a la vista se repinta en su lugar, sin la entrada animada.
    if (abierto) pintar(abierto, false);
  }

  return { abrir, cambiar };
}
