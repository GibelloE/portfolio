// Arranque de la página: pide el contenido (api/portfolio.json) y lo dibuja.
// Las direcciones son relativas: el sitio funciona igual en la raíz (con server.js)
// que dentro de una carpeta (en GitHub Pages queda en …/portfolio/).

import { h, cifra, dosCifras, alVer, sinMovimiento, pausarMovimiento } from './dom.js';
import { aniosDesde } from './anios.js';
import { icono } from './iconos.js';
import { destape, escalonar } from './destape.js';
import { activarLupa, figuraDeCaptura } from './capturas.js';
import { crearVisual } from './visuales.js';
import { crearDetalle } from './detalle.js';

/* ---------- Inicio ---------- */

/** Las ocupaciones pasan de costado, de a una. */
function rotarRoles(contenedor, roles) {
  const spans = roles.map((rol, i) => h('span', { class: i === 0 ? 'rol activo' : 'rol', text: rol }));
  contenedor.replaceChildren(...spans);
  if (spans.length < 2) return;
  let i = 0;
  setInterval(() => {
    if (sinMovimiento()) return;
    const sale = spans[i];
    i = (i + 1) % spans.length;
    const entra = spans[i];
    sale.classList.replace('activo', 'saliendo');
    entra.classList.remove('saliendo');
    entra.classList.add('activo');
    setTimeout(() => sale.classList.remove('saliendo'), 700);
  }, 2600);
}

/**
 * Escribe un texto letra por letra. El renglón no cambia de tamaño mientras tanto:
 * lo que falta ya está, invisible, ocupando su lugar.
 */
function escribir(el, texto, msPorLetra = 18) {
  const hecho = h('span', { class: 'escrito' });
  const falta = h('span', { class: 'fantasma', 'aria-hidden': 'true', text: texto });
  el.replaceChildren(hecho, falta);
  return new Promise((listo) => {
    let n = 0;
    const paso = () => {
      n += 1;
      hecho.textContent = texto.slice(0, n);
      falta.textContent = texto.slice(n);
      if (n < texto.length) setTimeout(paso, msPorLetra);
      else listo();
    };
    paso();
  });
}

function pintarFicha(perfil) {
  const lista = document.getElementById('ficha');
  const filas = perfil.ficha.map((fila) => {
    const valor = fila.valor.replace('{anios}', perfil.aniosExperiencia);
    const dd = h('dd', { text: valor });
    return { valor, dd, el: h('div', { class: 'ficha__fila' }, h('dt', { text: fila.campo }), dd) };
  });
  lista.replaceChildren(...filas.map((fila) => fila.el));
  if (sinMovimiento()) return;

  // Se escribe sola, renglón por renglón, cuando entra en pantalla.
  filas.forEach((fila) =>
    fila.dd.replaceChildren(h('span', { class: 'fantasma', 'aria-hidden': 'true', text: fila.valor })),
  );
  alVer(lista, async () => {
    for (const fila of filas) {
      fila.el.classList.add('escribiendo');
      await escribir(fila.dd, fila.valor);
      fila.el.classList.remove('escribiendo');
    }
    filas.at(-1).el.classList.add('escribiendo');
  });
}

function pintarInicio(perfil) {
  document.title = `${perfil.nombre} — ${perfil.ocupacion}`;
  document.getElementById('hero-ocupacion').textContent = perfil.ocupacion;
  document.getElementById('hero-lugar').textContent = perfil.ubicacion;
  document.getElementById('pie-lugar').textContent = perfil.ubicacion;
  document.getElementById('presentacion').textContent = perfil.presentacion;
  rotarRoles(document.getElementById('roles'), perfil.roles);
  pintarFicha(perfil);

  const cifras = perfil.cifras.map((c) => cifra(c.clave === 'anios' ? { ...c, valor: perfil.aniosExperiencia } : c));
  const lista = document.getElementById('hero-cifras');
  lista.replaceChildren(...cifras.map((c) => c.el));
  alVer(lista, () => cifras.forEach((c) => c.animar()));
}

/* ---------- Productos: un rectángulo por producto, con su puerta ---------- */

function panelDeProducto(producto, i, abrir) {
  // En la tarjeta van tres cifras, con su etiqueta corta; el detalle las explica enteras.
  const cifras = producto.cifras.slice(0, 3).map((c) => cifra({ ...c, etiqueta: c.corta ?? c.etiqueta }));
  const texto = escalonar([
    h('p', { class: 'rotulo', text: producto.tipo }),
    h('h3', { class: 'producto__nombre neon', text: producto.nombre }),
    h('p', { class: 'producto__bajada', text: producto.bajada }),
    h('p', { class: 'producto__resumen', text: producto.resumen }),
    producto.destacado &&
      h('p', { class: 'destacado' }, icono(producto.iconoDestacado ?? 'enchufe'), producto.destacado),
    h(
      'button',
      { class: 'boton', type: 'button', on: { click: () => verFunciones() } },
      'Ver funciones',
      icono('flecha', 'flecha'),
    ),
  ]);
  // Si hay una captura real del producto, va esa; si no, su dibujo animado.
  const visual = h(
    'div',
    { class: 'producto__visual' },
    h(
      'div',
      { class: 'aparece', vars: { '--k': 2 } },
      producto.captura ? figuraDeCaptura(producto.captura) : crearVisual(producto.visual),
    ),
    h('ul', { class: 'cifras cifras--tarjeta aparece', vars: { '--k': 4 } }, cifras.map((c) => c.el)),
  );

  // En la tapa, el nombre del producto va encendido: "¿Qué es [Cobro Flotante?]"
  const [antes, despues = ''] = producto.pregunta.split(producto.nombre);
  const titulo = [antes, h('span', { class: 'neon', text: producto.nombre + despues })];

  const tapa = destape({
    pregunta: producto.pregunta,
    titulo,
    sobre: producto.tipo,
    adornos: [h('span', { class: 'destape__num', 'aria-hidden': 'true', text: dosCifras(i + 1) })],
    contenido: h('div', { class: 'producto__cuerpo' }, h('div', { class: 'producto__texto' }, texto), visual),
    // La puerta de una cámara: se corre de izquierda a derecha y deja salir la niebla.
    direccion: 'der',
    boveda: true,
    clase: `destape--producto acento-${producto.acento}`,
    orden: i,
    alDestapar: () => cifras.forEach((c) => c.animar()),
  });

  function verFunciones() {
    if (!tapa.aPantallaCompleta()) {
      abrir(producto.id);
      return;
    }
    // En el celular la bóveda está abierta a pantalla completa: el detalle ocupa su lugar
    // (también en el historial), así al volver se llega directo a la lista de productos.
    // La bóveda se cierra sola cuando el detalle ya terminó de taparla.
    abrir(producto.id, 'reemplazar');
    setTimeout(() => tapa.fijar(false), sinMovimiento() ? 0 : 650);
  }

  return h('div', { data: { revelar: i % 2 === 0 ? 'izq' : 'der' } }, tapa.el);
}

function pintarProductos(productos, abrir) {
  document
    .getElementById('productos-lista')
    .replaceChildren(...productos.map((producto, i) => panelDeProducto(producto, i, abrir)));
}

/** Las bases técnicas con las que se desarrollan los productos: a la vista, sin tapa. */
function pintarBases(bases) {
  document.getElementById('bases').replaceChildren(
    h(
      'header',
      { class: 'bases__cabeza' },
      h('p', { class: 'rotulo', text: 'Cómo los desarrollo' }),
      h('h3', { class: 'bases__titulo', text: bases.titulo }),
      h('p', { class: 'bases__bajada', text: bases.bajada }),
    ),
    h(
      'ul',
      { class: 'bases__lista' },
      bases.items.map((base) =>
        h('li', { class: 'base' }, icono(base.icono), h('strong', { text: base.titulo }), h('span', { text: base.texto })),
      ),
    ),
  );
}

/* ---------- Sobre mí: tres tapas con lo básico del CV ---------- */

function pintarSobreMi(perfil) {
  const quien = destape({
    pregunta: '¿Quién soy?',
    sobre: '01 · Resumen',
    adornos: [icono('persona', 'destape__icono')],
    contenido: escalonar([
      ...perfil.resumen.map((parrafo, i) => h('p', { class: i === 0 ? 'texto-grande' : 'texto-tenue', text: parrafo })),
      h('dl', { class: 'extra' }, perfil.extra.map((item) => h('div', {}, h('dt', { text: item.campo }), h('dd', { text: item.valor })))),
    ]),
    direccion: 'izq',
    clase: 'destape--sobre',
    orden: 0,
  });

  const anios = cifra({ valor: perfil.aniosExperiencia, prefijo: '+', sufijo: ' años', etiqueta: 'de experiencia en IT' });
  const hoy = destape({
    pregunta: '¿Qué hago hoy?',
    sobre: '02 · Ocupación',
    adornos: [icono('maletin', 'destape__icono')],
    contenido: escalonar([
      h('ul', { class: 'cifras cifras--chicas' }, anios.el),
      h(
        'ol',
        { class: 'hoy' },
        perfil.hoy.map((item) =>
          h('li', {}, h('strong', { text: item.puesto }), h('span', { text: item.lugar }), h('small', { text: `desde ${item.desde}` })),
        ),
      ),
    ]),
    direccion: 'der',
    clase: 'destape--sobre',
    orden: 1,
    alDestapar: anios.animar,
  });

  const stack = destape({
    pregunta: '¿Con qué trabajo?',
    sobre: '03 · Stack',
    adornos: [icono('codigo', 'destape__icono')],
    // Una sola lista, de lo más importante a lo menos: el orden es el de data/portfolio.json.
    contenido: escalonar([
      h('p', { class: 'rotulo', text: 'De lo más importante a lo menos' }),
      h('ol', { class: 'chips chips--orden' }, perfil.stack.map((item) => h('li', { text: item }))),
    ]),
    direccion: 'der',
    clase: 'destape--sobre destape--ancho',
    orden: 2,
  });

  stack.el.id = 'stack';
  document.getElementById('sobre-lista').replaceChildren(quien.el, hoy.el, stack.el);
}

function pintarContacto(perfil) {
  const { email, linkedin, github } = perfil.contacto;
  const enlaceExterno = (texto, url, nombreIcono) =>
    h(
      'a',
      { class: 'boton boton--fantasma', href: url, target: '_blank', rel: 'noopener noreferrer' },
      icono(nombreIcono, 'flecha'),
      texto,
    );
  document
    .getElementById('contacto-acciones')
    .replaceChildren(
      ...[
        h('a', { class: 'boton', href: `mailto:${email}` }, icono('correo', 'flecha'), email),
        linkedin && enlaceExterno('LinkedIn', linkedin, 'linkedin'),
        github && enlaceExterno('GitHub', github, 'github'),
      ].filter(Boolean),
    );
}

/* ---------- Efectos de la página ---------- */

/** Las secciones entran de costado cuando llegan a la pantalla. */
function activarRevelado() {
  const elementos = document.querySelectorAll('[data-revelar]:not(.visible)');
  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
  );
  elementos.forEach((el) => observador.observe(el));
}

/** Marca en el menú la sección que se está mirando. */
function activarMenu() {
  const enlaces = new Map(
    [...document.querySelectorAll('.nav__lista a')].map((a) => [a.getAttribute('href').slice(1), a]),
  );
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        enlaces.forEach((a, id) => {
          if (id === entrada.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  ['inicio', ...enlaces.keys()].forEach((id) => {
    const seccion = document.getElementById(id);
    if (seccion) observador.observe(seccion);
  });

  const nav = document.getElementById('nav');
  const alDesplazar = () => nav.classList.toggle('nav--solida', window.scrollY > 24);
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
}

/** El botón del menú que pausa y reanuda todas las animaciones. */
function activarPausa() {
  const boton = document.getElementById('pausa');
  const pintar = () => {
    const pausado = sinMovimiento();
    boton.setAttribute('aria-pressed', String(pausado));
    boton.setAttribute('aria-label', pausado ? 'Reanudar las animaciones' : 'Pausar las animaciones');
    boton.title = pausado ? 'Reanudar las animaciones' : 'Pausar las animaciones';
    boton.replaceChildren(icono(pausado ? 'reproducir' : 'pausa'), h('span', { text: pausado ? 'Reanudar' : 'Pausar' }));
  };
  boton.addEventListener('click', () => {
    pausarMovimiento(!sinMovimiento());
    pintar();
  });
  pintar();
}

/** Un resplandor rojo que sigue al mouse. */
function activarLuz() {
  const luz = document.getElementById('luz');
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0;
  let y = 0;
  let pendiente = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        luz.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        luz.classList.add('visible');
      });
    },
    { passive: true },
  );
}

function mostrarError(error) {
  console.error(error);
  document.getElementById('contenido').prepend(
    h(
      'div',
      { class: 'aviso-error', role: 'alert' },
      h('strong', { text: 'No se pudo cargar el contenido.' }),
      h('span', { text: ' Probá recargar la página.' }),
    ),
  );
}

async function iniciar() {
  document.getElementById('anio').textContent = new Date().getFullYear();
  activarMenu();
  activarPausa();
  activarLuz();
  activarLupa();

  let datos;
  try {
    const respuesta = await fetch('api/portfolio.json', { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
    datos = await respuesta.json();
  } catch (error) {
    mostrarError(error);
    activarRevelado();
    return;
  }

  const { perfil, productos } = datos;
  // Con el servidor de Node los años ya vienen calculados; sin servidor, los calcula la página.
  perfil.aniosExperiencia ??= aniosDesde(perfil.experienciaDesde);
  const detalle = crearDetalle(productos);

  pintarInicio(perfil);
  pintarProductos(productos, detalle.abrir);
  pintarBases(perfil.bases);
  pintarSobreMi(perfil);
  pintarContacto(perfil);
  activarRevelado();
}

iniciar();
