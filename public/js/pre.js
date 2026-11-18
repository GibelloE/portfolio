// Corre antes de dibujar la página.
//
// 1. Marca que hay JavaScript: las animaciones de entrada sólo esconden contenido
//    si después alguien lo va a mostrar.
// 2. Recuerda si la persona pausó las animaciones con el botón del menú.
//    (Que Windows tenga los "Efectos de animación" apagados no las apaga: sólo las
//    suaviza. Con todo quieto, las tapas que se corren parecerían rotas.)
// 3. Decide el idioma: el que pide la dirección (…/?lang=en), el que la persona eligió
//    la última vez con el interruptor ES / EN o, si no, español. Queda en <html data-idioma>;
//    de ahí lo toman los estilos (el interruptor ya aparece en su lugar) y js/idioma.js.
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('js');
  try {
    if (localStorage.getItem('movimiento') === 'quieto') raiz.dataset.movimiento = 'quieto';
  } catch (error) {
    /* sin almacenamiento (modo privado): arranca con las animaciones andando */
  }

  var idioma = null;
  try {
    idioma = new URLSearchParams(location.search).get('lang');
    if (idioma === 'es' || idioma === 'en') localStorage.setItem('idioma', idioma);
    else idioma = localStorage.getItem('idioma');
  } catch (error) {
    /* sin almacenamiento: vale lo que diga la dirección */
  }
  if (idioma !== 'en') idioma = 'es';
  raiz.dataset.idioma = idioma;
  if (idioma === 'en') {
    raiz.lang = 'en';
    // El HTML viene escrito en español: en inglés, esos textos esperan ocultos a que la página
    // los traduzca (con-textos) y traiga el contenido (con-contenido). Si algo falla, se muestran igual.
    setTimeout(function () {
      raiz.classList.add('con-textos', 'con-contenido');
    }, 4000);
  }
})();
