// Arma la versión del sitio que no necesita servidor, en dist/. Es la que publica GitHub Pages.
//
//   npm run build
//
// Copia public/ tal cual y deja el contenido de cada idioma en dist/api/ (portfolio.json en
// español y portfolio.en.json en inglés), que es lo que pide la página. Los años de experiencia
// no van calculados: sin servidor los cuenta la página en el momento (public/js/anios.js),
// así no quedan viejos.

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { diferencias, leerContenido } from './revisar.mjs';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const SALIDA = join(RAIZ, 'dist');

// Si el contenido tiene un error de sintaxis, se corta acá: no se publica una página rota.
const contenido = { es: await leerContenido('es'), en: await leerContenido('en') };

// Lo mismo si al inglés le falta (o le sobra) algo respecto del español.
const avisos = diferencias(contenido.es, contenido.en);
if (avisos.length > 0) {
  console.error(`El contenido en inglés no coincide con el español (${avisos.length}):`);
  for (const aviso of avisos) console.error(`  - ${aviso}`);
  process.exit(1);
}

await rm(SALIDA, { recursive: true, force: true });
await cp(join(RAIZ, 'public'), SALIDA, { recursive: true });
await mkdir(join(SALIDA, 'api'), { recursive: true });
await writeFile(join(SALIDA, 'api', 'portfolio.json'), JSON.stringify(contenido.es));
await writeFile(join(SALIDA, 'api', 'portfolio.en.json'), JSON.stringify(contenido.en));

console.log(`Listo: dist/ (${contenido.es.productos.length} productos, en español y en inglés).`);
