// Arma la versión del sitio que no necesita servidor, en dist/. Es la que publica GitHub Pages.
//
//   npm run build
//
// Copia public/ tal cual y deja el contenido en dist/api/portfolio.json, que es lo que pide
// la página. Los años de experiencia no van calculados: sin servidor los cuenta la página
// en el momento (public/js/anios.js), así no quedan viejos.

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const SALIDA = join(RAIZ, 'dist');

// Si el contenido tiene un error de sintaxis, se corta acá: no se publica una página rota.
const contenido = JSON.parse(await readFile(join(RAIZ, 'data', 'portfolio.json'), 'utf8'));

await rm(SALIDA, { recursive: true, force: true });
await cp(join(RAIZ, 'public'), SALIDA, { recursive: true });
await mkdir(join(SALIDA, 'api'), { recursive: true });
await writeFile(join(SALIDA, 'api', 'portfolio.json'), JSON.stringify(contenido));

console.log(`Listo: dist/ (${contenido.productos.length} productos).`);
