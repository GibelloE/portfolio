// El contenido está en dos archivos, uno por idioma:
//
//   data/portfolio.json      español (el original)
//   data/portfolio.en.json   inglés
//
// Tienen que tener la misma forma: las mismas claves, la misma cantidad de elementos en cada
// lista y los mismos números, imágenes, íconos y enlaces. Sólo cambian los textos. Esto lo
// controla, para que una función agregada en un idioma no quede faltando en el otro.
//
//   npm run revisar   → dice qué no coincide (y termina con error si hay algo)
//
// También lo usan build.mjs (no publica si no coinciden) y server.js (avisa al arrancar).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));

/** El archivo de contenido de cada idioma. */
export const ARCHIVOS = {
  es: join(RAIZ, 'data', 'portfolio.json'),
  en: join(RAIZ, 'data', 'portfolio.en.json'),
};

// Lo que no se traduce: tiene que ser idéntico en los dos idiomas.
const IGUALES = new Set([
  'id', 'src', 'mini', 'icono', 'iconoDestacado', 'acento', 'visual', 'color',
  'url', 'email', 'linkedin', 'github', 'experienciaDesde', 'clave',
]);
// Lo que puede estar en un idioma y no en el otro: "+10" en español es "10+" en inglés.
const OPCIONALES = new Set(['prefijo', 'sufijo']);

const tipoDe = (valor) => (Array.isArray(valor) ? 'lista' : valor === null ? 'nada' : typeof valor);

/** Lo que no coincide entre el contenido en español y el contenido en inglés: una lista de avisos. */
export function diferencias(es, en, ruta = 'portfolio') {
  if (tipoDe(es) !== tipoDe(en)) return [`${ruta}: en español es ${tipoDe(es)} y en inglés ${tipoDe(en)}`];

  if (tipoDe(es) === 'lista') {
    if (es.length !== en.length) return [`${ruta}: ${es.length} elementos en español y ${en.length} en inglés`];
    return es.flatMap((valor, i) => diferencias(valor, en[i], `${ruta}[${i}]`));
  }

  if (tipoDe(es) === 'object') {
    const claves = new Set([...Object.keys(es), ...Object.keys(en)]);
    return [...claves].flatMap((clave) => {
      const donde = `${ruta}.${clave}`;
      if (!(clave in es) || !(clave in en)) {
        return OPCIONALES.has(clave) ? [] : [`${donde}: falta en ${clave in es ? 'inglés' : 'español'}`];
      }
      if (IGUALES.has(clave) && JSON.stringify(es[clave]) !== JSON.stringify(en[clave])) {
        return [`${donde}: tiene que ser igual en los dos idiomas`];
      }
      return diferencias(es[clave], en[clave], donde);
    });
  }

  // Un texto se traduce; un número (o un sí/no) no cambia de un idioma al otro.
  if (tipoDe(es) === 'string') return en.trim() ? [] : [`${ruta}: está vacío en inglés`];
  return es === en ? [] : [`${ruta}: ${es} en español y ${en} en inglés`];
}

/** Lee el contenido de un idioma. Si el archivo tiene un error de sintaxis, falla acá. */
export async function leerContenido(idioma) {
  return JSON.parse(await readFile(ARCHIVOS[idioma], 'utf8'));
}

// Corrido a mano: node revisar.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const avisos = diferencias(await leerContenido('es'), await leerContenido('en'));
  if (avisos.length === 0) console.log('Los dos idiomas coinciden.');
  else {
    console.error(`El contenido en inglés no coincide con el español (${avisos.length}):`);
    for (const aviso of avisos) console.error(`  - ${aviso}`);
    process.exitCode = 1;
  }
}
