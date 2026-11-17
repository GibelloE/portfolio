// Servidor del portfolio: Node.js puro, sin dependencias.
//
//   npm start        → http://localhost:4000 (sólo desde esta PC)
//   npm run dev      → lo mismo, y se reinicia solo al guardar server.js
//   npm run celular  → también desde el celular u otra PC de la misma wifi (muestra el enlace)
//
// Hace dos cosas:
//   1. Sirve los archivos de public/ (HTML, CSS, JavaScript, imágenes).
//   2. Entrega el contenido en /api/portfolio.json, leído de data/portfolio.json,
//      con los años de experiencia calculados a la fecha de hoy.
//
// El sitio también se puede publicar sin este servidor (npm run build, ver build.mjs):
// así es como queda en GitHub Pages.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { aniosDesde } from './public/js/anios.js';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUBLICO = join(RAIZ, 'public');
const DATOS = join(RAIZ, 'data', 'portfolio.json');

const PUERTO = Number(process.env.PORT) || 4000;
// En la PC escucha sólo en esta máquina (no salta el firewall de Windows).
// Con --red (npm run celular) o en un hosting (NODE_ENV=production), en todas las interfaces.
const EN_RED = process.argv.includes('--red');
const ANFITRION =
  process.env.HOST || (EN_RED || process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const CABECERAS_DE_SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; '),
};

let cache = null;

/** El contenido del portfolio; se vuelve a leer sólo si el archivo cambió. */
async function leerPortfolio() {
  const { mtimeMs } = await stat(DATOS);
  if (!cache || cache.mtimeMs !== mtimeMs) {
    cache = { mtimeMs, datos: JSON.parse(await readFile(DATOS, 'utf8')) };
  }
  const { perfil, productos } = cache.datos;
  return {
    perfil: { ...perfil, aniosExperiencia: aniosDesde(perfil.experienciaDesde) },
    productos,
  };
}

function responder(res, estado, cuerpo, cabeceras = {}) {
  res.writeHead(estado, { ...CABECERAS_DE_SEGURIDAD, ...cabeceras });
  res.end(cuerpo);
}

function responderJSON(res, estado, objeto) {
  responder(res, estado, JSON.stringify(objeto), {
    'Content-Type': TIPOS['.json'],
    'Cache-Control': 'no-store',
  });
}

function paginaDeError(estado, mensaje) {
  return `<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${estado}</title><link rel="stylesheet" href="/css/styles.css"><main class="error-pagina"><p class="rotulo">Error ${estado}</p><h1 class="neon">${mensaje}</h1><p><a class="boton" href="/">Volver al inicio</a></p></main></html>`;
}

/** La ruta de disco de un pedido, o null si se quiere salir de public/. */
function archivoPedido(rutaURL) {
  let ruta;
  try {
    ruta = decodeURIComponent(rutaURL);
  } catch {
    return null;
  }
  // Ni caracteres nulos ni ":" (en Windows abre flujos alternativos y unidades).
  if (ruta.includes('\0') || ruta.includes(':')) return null;
  const archivo = normalize(join(PUBLICO, ruta));
  if (archivo !== PUBLICO && !archivo.startsWith(PUBLICO + sep)) return null;
  return archivo;
}

async function servirArchivo(req, res, rutaURL) {
  let archivo = archivoPedido(rutaURL);
  if (!archivo) return responder(res, 403, paginaDeError(403, 'Acceso denegado'), { 'Content-Type': TIPOS['.html'] });

  let info;
  try {
    info = await stat(archivo);
    if (info.isDirectory()) {
      archivo = join(archivo, 'index.html');
      info = await stat(archivo);
    }
    if (!info.isFile()) throw new Error('no es un archivo');
  } catch {
    return responder(res, 404, paginaDeError(404, 'Página no encontrada'), { 'Content-Type': TIPOS['.html'] });
  }

  const etiqueta = `"${info.size.toString(16)}-${Math.round(info.mtimeMs).toString(16)}"`;
  const cabeceras = {
    'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    ETag: etiqueta,
  };
  if (req.headers['if-none-match'] === etiqueta) return responder(res, 304, null, cabeceras);
  if (req.method === 'HEAD') return responder(res, 200, null, { ...cabeceras, 'Content-Length': info.size });
  return responder(res, 200, await readFile(archivo), cabeceras);
}

const servidor = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return responder(res, 405, 'Método no permitido', { Allow: 'GET, HEAD', 'Content-Type': TIPOS['.txt'] });
    }
    const { pathname } = new URL(req.url, 'http://localhost');

    // La página pide api/portfolio.json: con ese nombre también existe como archivo cuando
    // el sitio se publica sin servidor. Sin la extensión sigue respondiendo igual.
    if (pathname === '/api/portfolio.json' || pathname === '/api/portfolio') {
      return responderJSON(res, 200, await leerPortfolio());
    }
    if (pathname.startsWith('/api/')) return responderJSON(res, 404, { error: 'No existe ese recurso.' });

    return await servirArchivo(req, res, pathname);
  } catch (error) {
    console.error(`[error] ${req.method} ${req.url}:`, error);
    if (res.headersSent) return res.end();
    return responder(res, 500, 'Error interno del servidor', { 'Content-Type': TIPOS['.txt'] });
  }
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PUERTO} ya está en uso. Probá con otro: PORT=4001 npm start`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

/** Las direcciones de esta PC en la red local: lo que hay que abrir desde el celular. */
function direccionesEnLaRed() {
  return Object.entries(networkInterfaces()).flatMap(([adaptador, direcciones]) =>
    (direcciones ?? [])
      .filter((d) => d.family === 'IPv4' && !d.internal)
      .map((d) => ({ adaptador, url: `http://${d.address}:${PUERTO}` })),
  );
}

servidor.listen(PUERTO, ANFITRION, () => {
  const nombre = ANFITRION === '0.0.0.0' || ANFITRION === '127.0.0.1' ? 'localhost' : ANFITRION;
  console.log(`Portfolio en http://${nombre}:${PUERTO}`);
  if (EN_RED) {
    console.log('Desde el celular, en la misma wifi:');
    for (const { adaptador, url } of direccionesEnLaRed()) console.log(`  ${url}  (${adaptador})`);
  }
});
