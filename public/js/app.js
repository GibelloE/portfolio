// Arranque de la página: pide el contenido (api/portfolio.json, o api/portfolio.en.json en
// inglés) y lo dibuja. Con el interruptor ES / EN del menú se vuelve a dibujar en el otro idioma.
// Las direcciones son relativas: el sitio funciona igual en la raíz (con server.js)
// que dentro de una carpeta (en GitHub Pages queda en …/portfolio/).

import { h, cifra, dosCifras, alVer, sinMovimiento, pausarMovimiento } from './dom.js';
import { aniosDesde } from './anios.js';
import { icono } from './iconos.js';
import { idioma, otroIdioma, fijarIdioma, t, aplicarTextos } from './idioma.js';
import { destape, escalonar } from './destape.js';
import { activarLupa, figuraDeCaptura } from './capturas.js';
import { crearVisual } from './visuales.js';
import { crearDetalle } from './detalle.js';

/* ---------- El contenido, en cada idioma ---------- */

const ARCHIVOS = { es: 'api/portfolio.json', en: 'api/portfolio.en.json' };
const pedidos = new Map(); // idioma → la promesa de su contenido

/** El contenido en un idioma. Se pide una sola vez; si falla, la próxima se vuelve a pedir. */
function traerContenido(cual) {
  if (!pedidos.has(cual)) {
    const pedido = fetch(ARCHIVOS[cual], { headers: { Accept: 'application/json' } })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
        return respuesta.json();
      })
      .then((datos) => {
        // Con el servidor de Node los años ya vienen calculados; sin servidor, los calcula la página.
        datos.perfil.aniosExperiencia ??= aniosDesde(datos.perfil.experienciaDesde);
        return datos;
      });
    pedido.catch(() => pedidos.delete(cual));
    pedidos.set(cual, pedido);
  }
  return pedidos.get(cual);
}

/* ---------- Inicio ---------- */

let relojDeRoles = null;

/** Las ocupaciones pasan de costado, de a una. */
function rotarRoles(contenedor, roles) {
  clearInterval(relojDeRoles);
  const spans = roles.map((rol, i) => h('span', { class: i === 0 ? 'rol activo' : 'rol', text: rol }));
  contenedor.replaceChildren(...spans);
  if (spans.length < 2) return;
  let i = 0;
  relojDeRoles = setInterval(() => {
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

/** @param {boolean} estreno  la primera vez se escribe sola; al cambiar de idioma ya aparece escrita */
function pintarFicha(perfil, estreno) {
  const lista = document.getElementById('ficha');
  const filas = perfil.ficha.map((fila) => {
    const valor = fila.valor.replace('{anios}', perfil.aniosExperiencia);
    const dd = h('dd', {}, h('span', { class: 'escrito', text: valor }));
    return { valor, dd, el: h('div', { class: 'ficha__fila' }, h('dt', { text: fila.campo }), dd) };
  });
  lista.replaceChildren(...filas.map((fila) => fila.el));
  if (sinMovimiento()) return;
  if (!estreno) {
    filas.at(-1).el.classList.add('escribiendo'); // queda el cursor al final, como después de escribirse
    return;
  }

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

function pintarInicio(perfil, estreno) {
  document.title = `${perfil.nombre} — ${perfil.ocupacion}`;
  document.getElementById('hero-ocupacion').textContent = perfil.ocupacion;
  document.getElementById('hero-lugar').textContent = perfil.ubicacion;
  document.getElementById('pie-lugar').textContent = perfil.ubicacion;
  document.getElementById('presentacion').textContent = perfil.presentacion;
  // Lo que rota es decorativo: quien usa un lector de pantalla recibe la lista entera.
  document.getElementById('roles-leidos').textContent = `${perfil.roles.join(', ')}.`;
  rotarRoles(document.getElementById('roles'), perfil.roles);
  pintarFicha(perfil, estreno);

  const cifras = perfil.cifras.map((c) => cifra(c.clave === 'anios' ? { ...c, valor: perfil.aniosExperiencia } : c));
  const lista = document.getElementById('hero-cifras');
  lista.replaceChildren(...cifras.map((c) => c.el));
  if (estreno) alVer(lista, () => cifras.forEach((c) => c.animar()));
}

/* ---------- Productos: un rectángulo por producto, con su puerta ---------- */

function panelDeProducto(producto, i, abrir, estreno) {
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
      t('productos.verFunciones'),
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
    asoma: estreno,
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

  // Al cambiar de idioma el panel ya está a la vista: no vuelve a entrar de costado.
  return h('div', { class: estreno ? null : 'visible', data: { revelar: i % 2 === 0 ? 'izq' : 'der' } }, tapa.el);
}

function pintarProductos(productos, abrir, estreno) {
  document
    .getElementById('productos-lista')
    .replaceChildren(...productos.map((producto, i) => panelDeProducto(producto, i, abrir, estreno)));
}

/** Las bases técnicas con las que se desarrollan los productos: a la vista, sin tapa. */
function pintarBases(bases) {
  document.getElementById('bases').replaceChildren(
    h(
      'header',
      { class: 'bases__cabeza' },
      h('p', { class: 'rotulo', text: t('bases.rotulo') }),
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

/**
 * Un trabajo: puesto, lugar, cuándo y, si se detallan, lo que se hace ahí.
 * El "cuándo" sale de `desde` y `hasta`, salvo que el dato traiga su propio texto en `cuando`.
 * De un trabajo ya terminado sin fecha de fin no se dice nada: "desde…" daría a entender que sigue.
 */
function trabajo(item, terminado = false) {
  let cuando = item.cuando ?? '';
  if (!cuando && item.hasta) {
    cuando = item.desde ? `${item.desde} – ${item.hasta}` : t('trabajo.hasta', { fecha: item.hasta });
  } else if (!cuando && item.desde && !terminado) cuando = t('trabajo.desde', { fecha: item.desde });
  return h(
    'li',
    {},
    h('strong', { text: item.puesto }),
    item.lugar && h('span', { text: item.lugar }),
    cuando && h('small', { text: cuando }),
    item.tareas?.length > 0 && h('ul', { class: 'hoy__tareas' }, item.tareas.map((tarea) => h('li', { text: tarea }))),
  );
}

function pintarSobreMi(perfil, estreno) {
  const quien = destape({
    pregunta: t('sobre.quien'),
    sobre: t('sobre.quienSobre'),
    adornos: [icono('persona', 'destape__icono')],
    contenido: escalonar([
      ...perfil.resumen.map((parrafo, i) => h('p', { class: i === 0 ? 'texto-grande' : 'texto-tenue', text: parrafo })),
      h('dl', { class: 'extra' }, perfil.extra.map((item) => h('div', {}, h('dt', { text: item.campo }), h('dd', { text: item.valor })))),
    ]),
    direccion: 'izq',
    clase: 'destape--sobre',
    orden: 0,
    asoma: estreno,
  });

  // "+8 años" en español, "8+ years" en inglés.
  const anios = cifra({
    valor: perfil.aniosExperiencia,
    prefijo: t('sobre.aniosPrefijo'),
    sufijo: t('sobre.aniosSufijo'),
    etiqueta: t('sobre.aniosEtiqueta'),
  });
  const hoy = destape({
    pregunta: t('sobre.hoy'),
    sobre: t('sobre.hoySobre'),
    adornos: [icono('maletin', 'destape__icono')],
    contenido: escalonar([
      h('ul', { class: 'cifras cifras--chicas' }, anios.el),
      h('ol', { class: 'hoy' }, perfil.hoy.map((item) => trabajo(item))),
      // Los trabajos que ya terminaron van aparte, más apagados.
      perfil.antes?.length > 0 &&
        h(
          'div',
          { class: 'hoy-antes' },
          h('p', { class: 'rotulo', text: t('sobre.antes') }),
          h('ol', { class: 'hoy hoy--antes' }, perfil.antes.map((item) => trabajo(item, true))),
        ),
    ]),
    direccion: 'der',
    clase: 'destape--sobre',
    orden: 1,
    asoma: estreno,
    alDestapar: anios.animar,
  });

  const stack = destape({
    pregunta: t('sobre.stack'),
    sobre: t('sobre.stackSobre'),
    adornos: [icono('codigo', 'destape__icono')],
    // Una sola lista, de lo más importante a lo menos: el orden es el de data/portfolio.json.
    contenido: escalonar([
      h('p', { class: 'rotulo', text: t('sobre.stackOrden') }),
      h('ol', { class: 'chips chips--orden' }, perfil.stack.map((item) => h('li', { text: item }))),
    ]),
    direccion: 'der',
    clase: 'destape--sobre destape--ancho',
    orden: 2,
    asoma: estreno,
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

/** El botón del menú que pausa y reanuda todas las animaciones. Devuelve cómo repintarlo. */
function activarPausa() {
  const boton = document.getElementById('pausa');
  const pintar = () => {
    const pausado = sinMovimiento();
    const queHace = t(pausado ? 'pausa.reanudarTodo' : 'pausa.pausarTodo');
    boton.setAttribute('aria-pressed', String(pausado));
    boton.setAttribute('aria-label', queHace);
    boton.title = queHace;
    boton.replaceChildren(
      icono(pausado ? 'reproducir' : 'pausa'),
      h('span', { text: t(pausado ? 'pausa.reanudar' : 'pausa.pausar') }),
    );
  };
  boton.addEventListener('click', () => {
    pausarMovimiento(!sinMovimiento());
    pintar();
  });
  pintar();
  return { pintar };
}

/**
 * El interruptor ES / EN: el del menú y el que lleva el detalle de un producto, que tapa el menú.
 * La marca de color la corren los estilos, según <html data-idioma>; acá se avisa cuál se eligió
 * y se deja dicho cuál está activo.
 */
function activarIdioma(alElegir) {
  const botones = [...document.querySelectorAll('.idioma button')];
  const pintar = () => botones.forEach((boton) => boton.setAttribute('aria-pressed', String(boton.value === idioma())));
  for (const boton of botones) boton.addEventListener('click', () => alElegir(boton.value));
  pintar();
  return { pintar };
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

const quitarError = () => document.querySelector('.aviso-error')?.remove();

function mostrarError(error) {
  console.error(error);
  quitarError();
  document.getElementById('contenido').prepend(
    h(
      'div',
      { class: 'aviso-error', role: 'alert' },
      h('strong', { text: t('error.titulo') }),
      h('span', { text: t('error.consejo') }),
    ),
  );
}

/* ---------- La página entera, en un idioma ---------- */

let detalle = null;
let pausa = null;
let interruptor = null;

/**
 * Dibuja todo con el contenido de un idioma.
 * @param {boolean} estreno  es la primera vez: corren las animaciones de entrada.
 *                           Al cambiar de idioma no: sólo cambian los textos.
 */
function pintarTodo({ perfil, productos }, estreno) {
  quitarError();
  aplicarTextos();
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.descripcion'));
  pausa.pintar();
  interruptor.pintar();

  if (detalle) detalle.cambiar(productos);
  else detalle = crearDetalle(productos);

  pintarInicio(perfil, estreno);
  pintarProductos(productos, detalle.abrir, estreno);
  pintarBases(perfil.bases);
  pintarSobreMi(perfil, estreno);
  pintarContacto(perfil);
  document.documentElement.classList.add('con-contenido');
}

/**
 * Repinta sin que la página salte. Los textos no ocupan lo mismo en cada idioma: después de
 * repintar se acomoda el desplazamiento para que lo que se estaba mirando siga en su lugar.
 */
function conservarLugar(repintar) {
  const MARCAS = 'main > section, .titulo, #productos-lista > *, #bases, #sobre-lista > *';
  const arriba = (el) => el.getBoundingClientRect().top;
  const borde = document.getElementById('nav').offsetHeight;
  const marcas = [...document.querySelectorAll(MARCAS)];
  // La referencia es lo que la persona tiene delante: la primera marca que empieza en la mitad
  // de arriba de la pantalla o, si no hay ninguna, la última que empieza por encima del menú.
  let i = marcas.findIndex((el) => arriba(el) >= borde && arriba(el) < window.innerHeight / 2);
  if (i < 0) i = marcas.map((el) => arriba(el) < borde).lastIndexOf(true);
  const antes = i < 0 ? null : arriba(marcas[i]);
  repintar();
  const marca = document.querySelectorAll(MARCAS)[i];
  if (antes === null || !marca) return;
  window.scrollBy({ top: arriba(marca) - antes, behavior: 'instant' });
}

let cambiando = false;

async function cambiarIdioma(nuevo) {
  if (cambiando || nuevo === idioma()) return;
  cambiando = true;
  try {
    const datos = await traerContenido(nuevo);
    fijarIdioma(nuevo);
    conservarLugar(() => pintarTodo(datos, false));
  } catch (error) {
    mostrarError(error);
  } finally {
    cambiando = false;
  }
}

async function iniciar() {
  document.getElementById('anio').textContent = new Date().getFullYear();
  // Lo que está escrito en el HTML pasa al idioma elegido antes de pedir nada.
  aplicarTextos();
  document.documentElement.classList.add('con-textos');
  activarMenu();
  pausa = activarPausa();
  interruptor = activarIdioma(cambiarIdioma);
  activarLuz();
  activarLupa();

  try {
    pintarTodo(await traerContenido(idioma()), true);
  } catch (error) {
    mostrarError(error);
    document.documentElement.classList.add('con-contenido');
  }
  activarRevelado();

  // El otro idioma se trae de fondo: así el interruptor responde al instante.
  const cuandoHayaTiempo = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
  cuandoHayaTiempo(() => traerContenido(otroIdioma()).catch(() => {}));
}

iniciar();
