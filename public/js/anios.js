// Los años de experiencia se cuentan a la fecha de hoy, no quedan escritos.
// Esta cuenta la usan los dos lados: el servidor (server.js), al armar /api/portfolio,
// y la página, cuando el sitio está publicado sin servidor (GitHub Pages).

/** Años completos desde una fecha "AAAA-MM-DD" hasta hoy (en la hora local). */
export function aniosDesde(fecha, hoy = new Date()) {
  const [anio, mes = 1, dia = 1] = String(fecha).split('-').map(Number);
  if (!Number.isFinite(anio)) return 0;
  let anios = hoy.getFullYear() - anio;
  const mesHoy = hoy.getMonth() + 1;
  if (mesHoy < mes || (mesHoy === mes && hoy.getDate() < dia)) anios -= 1;
  return Math.max(0, anios);
}
