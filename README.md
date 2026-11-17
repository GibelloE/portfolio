# Portfolio — Emanuel Gibello

Página personal: HTML, CSS y JavaScript sin librerías, servida con Node.js sin dependencias.
Muestra lo básico del CV y tres productos (Cobro Flotante, FRIGO y Preparador de listas),
cada uno con el resumen animado de sus funciones.

**En línea:** https://gibelloe.github.io/portfolio/

## Abrirla

Hace falta Node.js 18 o más. No hay nada que instalar.

```bash
npm start
```

Queda en `http://localhost:4000`. Con `npm run dev` el servidor se reinicia solo al guardar `server.js`.
Para usar otro puerto: `PORT=4001 npm start`.

### Verla desde el celular

```bash
npm run celular
```

Además de `localhost`, el servidor escucha en la red local y muestra el enlace para abrir desde el celular
(o cualquier equipo) conectado a la misma wifi, por ejemplo `http://192.168.0.15:4000`. Si aparecen varias
direcciones, la que sirve es la del adaptador de la wifi. La dirección puede cambiar de un día para otro: el
comando muestra siempre la actual. Sólo se ve dentro de esa red, y mientras el servidor esté corriendo.

## Dónde se cambia cada cosa

| Qué | Dónde |
| --- | --- |
| Textos, cifras, stack, productos y sus funciones | `data/portfolio.json` (se vuelve a leer solo: alcanza con recargar la página) |
| Estructura de la página | `public/index.html` |
| Colores, fuentes y animaciones | `public/css/styles.css` (las variables están arriba de todo) |
| Las tapas (bóvedas) que se corren al pasar el mouse o al tocarlas | `public/js/destape.js` |
| El detalle de cada producto y la bóveda de FRIGO Visión | `public/js/detalle.js` |
| Las capturas reales y la lupa que las amplía | `public/js/capturas.js`, imágenes en `public/img/capturas/` |
| Los dibujos animados de cada producto | `public/js/visuales.js` y la sección 9 de `styles.css` |
| Lo que se abre a pantalla completa en el celular, y el botón Atrás | `public/js/interior.js` y `public/js/historial.js` |
| El servidor y `/api/portfolio.json` | `server.js` |
| La versión sin servidor que se publica en GitHub Pages | `build.mjs` y `.github/workflows/pages.yml` |

En `data/portfolio.json`:

- **`perfil.stack`** es una sola lista, de lo más importante a lo menos. Las siete primeras van encendidas.
- **`perfil.experienciaDesde`** es la fecha desde la que se cuentan los años de experiencia: se calculan
  al día (`public/js/anios.js`), no hay que actualizarlos a mano.
- **`perfil.hoy`** son los trabajos actuales (la tapa "¿Qué hago hoy?"): `puesto`, `lugar`, `desde` y, si se
  quiere detallar, `tareas`. Con `cuando` se escribe el período a mano ("desde hace varios años…") en vez de
  armarlo con las fechas. **`perfil.antes`** son los que ya terminaron: llevan además `hasta` (sin `hasta` no
  se muestra ninguna fecha).
- Cada producto tiene su `pregunta` (lo que dice la tapa), sus `cifras` y sus `funciones`; cada función
  tiene la `pregunta` de su tapa, el `titulo`, los `puntos` y, si hace falta, un `flujo` o un `dato`.
- `acento` es el color de neón del producto: `rojo`, `cian` o `ambar`.
- **`perfil.bases`** son las bases técnicas que se muestran debajo de los productos.
- **`destacado`** es la condición que se resalta de un producto ("Adaptable a cualquier sistema de gestión");
  `iconoDestacado` cambia su ícono.
- **`problema`** es lo que dice la tapa "¿Qué problema resuelve?": un texto, o una lista de párrafos (el primero
  va en grande).
- **`captura`** (del producto) y **`capturas`** (de cada función) son las pantallas reales: `src` es la imagen
  entera, `mini` la miniatura 16:9, `alt` la descripción y `pie` lo que dice debajo. Una función con capturas
  ocupa todo el ancho. Para sumar una, poné los dos archivos `.webp` en `public/img/capturas/<producto>/`.
- **`especial`** (hoy sólo en FRIGO) es la bóveda con aspecto propio de FRIGO Visión. Su título es el `nombre`
  y, debajo, el `lema` ("Control de calidad impulsado por IA").

Las capturas de FRIGO son del recorrido de su demo (todo dice `[DEMO]`) y las de Cobro Flotante son la pantalla
del cliente del programa con datos inventados. El Preparador de listas todavía no tiene: en su lugar va su dibujo.

## Cómo está armado

- **Tapas** (`destape.js`): cada rectángulo tiene la información abajo y una tapa encima. Con mouse se
  destapa al pasar por arriba y un clic lo deja fijo. En el celular y la tablet no hay mouse: la tapa es un
  botón ("Tocá para abrir"), se corre en su lugar y lo de adentro se abre a pantalla completa
  (`interior.js`), sin mover la página. Se cierra con la cruz, con "Volver" o con el botón Atrás del
  celular (`historial.js`). "Destapar todo" las despliega en la página.
  Las de los productos son la puerta de una cámara: se corren de izquierda a derecha y sale niebla.
- **Bóveda de FRIGO Visión**: distinta de las demás. Es una compuerta verde con el lente de una cámara y un
  láser que la recorre; lleva el título a la vista y, al abrirla, se parte al medio.
- **Animaciones**: si Windows tiene los "Efectos de animación" apagados, la página no se queda quieta
  (las tapas parecerían rotas): se suaviza. El botón **Pausar** del menú frena todo y lo recuerda.
- **Detalle de un producto**: un diálogo a pantalla completa. Queda en la dirección (`#ver-frigo`), así
  que se puede compartir el enlace, y el botón Atrás lo cierra.
- **Servidor**: sirve `public/`, entrega el contenido en `/api/portfolio.json` y manda cabeceras de
  seguridad (entre ellas una política de contenido que sólo deja cargar scripts y estilos propios).

## Publicarla

### En GitHub Pages (así está publicada)

Cada vez que se sube algo a `main`, GitHub arma la versión sin servidor y la publica sola
(`.github/workflows/pages.yml`). Tarda cerca de un minuto y queda en https://gibelloe.github.io/portfolio/.

- `npm run build` arma esa misma versión en `dist/`, por si se la quiere revisar antes: copia `public/` y
  deja el contenido en `dist/api/portfolio.json`.
- GitHub Pages sólo entrega archivos, ahí no corre `server.js`. Por eso las direcciones de la página son
  relativas (funciona igual dentro de `/portfolio/`) y los años de experiencia los cuenta la propia página.
- Hace falta una sola vez, en el repositorio: **Settings → Pages → Source: GitHub Actions**.

### En un hosting de Node.js

Sirve cualquiera. El comando es `npm start`; con `NODE_ENV=production` el servidor escucha en todas las
interfaces y en el puerto que indique `PORT`.
