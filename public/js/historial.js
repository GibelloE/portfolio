// Lo que se abre encima de la página (una bóveda a pantalla completa, una captura ampliada)
// se anota en el historial del navegador. Así el botón Atrás, o el gesto de volver del
// celular, cierra lo que está más arriba en vez de sacar a la persona de la página.
//
// El detalle de un producto lleva su propia cuenta en detalle.js, porque además cambia
// la dirección (…/#ver-frigo).

const abiertas = new Map(); // clave → cómo se cierra

// Una recarga con algo abierto deja la anotación en el historial, pero ya no hay nada abierto.
if (history.state?.capas) {
  const { capas, ...resto } = history.state;
  history.replaceState(Object.keys(resto).length ? resto : null, '');
}

/** Anota que se abrió algo. `cerrar` se llama si la persona vuelve atrás. */
export function anotar(clave, cerrar) {
  abiertas.set(clave, cerrar);
  history.pushState({ ...history.state, capas: [...(history.state?.capas ?? []), clave] }, '');
}

/** Se cerró a mano (con su botón o con Esc): se saca su anotación, si es la de más arriba. */
export function borrar(clave) {
  if (!abiertas.delete(clave)) return;
  if (history.state?.capas?.at(-1) === clave) history.back();
}

window.addEventListener('popstate', () => {
  const quedan = history.state?.capas ?? [];
  // De arriba hacia abajo: primero se cierra lo último que se abrió.
  for (const [clave, cerrar] of [...abiertas].reverse()) {
    if (quedan.includes(clave)) continue;
    abiertas.delete(clave);
    cerrar();
  }
});
