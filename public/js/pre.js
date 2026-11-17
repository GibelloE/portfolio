// Corre antes de dibujar la página.
//
// 1. Marca que hay JavaScript: las animaciones de entrada sólo esconden contenido
//    si después alguien lo va a mostrar.
// 2. Recuerda si la persona pausó las animaciones con el botón del menú.
//    (Que Windows tenga los "Efectos de animación" apagados no las apaga: sólo las
//    suaviza. Con todo quieto, las tapas que se corren parecerían rotas.)
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('js');
  try {
    if (localStorage.getItem('movimiento') === 'quieto') raiz.dataset.movimiento = 'quieto';
  } catch (error) {
    /* sin almacenamiento (modo privado): arranca con las animaciones andando */
  }
})();
