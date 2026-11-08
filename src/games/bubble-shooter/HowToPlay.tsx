import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Vaciar el panal de burbujas antes de que llegue a la línea roja.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Apunta el cañón y dispara: la burbuja rebota en las paredes y se pega donde toca.</li>
          <li>
            Tres o más del mismo color que se tocan explotan (10 puntos cada una); lo que queda
            colgando de nada cae (20 cada una).
          </li>
          <li>Puedes cambiar la burbuja del cañón por la siguiente.</li>
          <li>
            Cada pocos disparos sin explotar nada (los puntos junto al cañón), una fila nueva empuja
            el panal hacia abajo.
          </li>
          <li>
            Vacía el tablero para ganar 1000 × nivel y pasar a uno más lleno con más colores. Si una
            burbuja pasa la línea, se acabó.
          </li>
          <li>
            Cada color lleva una marca (punto, aro, aspa, triángulo, cuadrado, cruz) para
            distinguirlos sin color.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> apuntan · <kbd>Espacio</kbd> dispara · <kbd>Mayús</kbd> o{' '}
          <kbd>X</kbd> cambia · o arrastra el dedo para apuntar y suéltalo para disparar ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Empty the honeycomb of bubbles before it reaches the red line.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Aim the cannon and fire: the bubble bounces off the walls and sticks where it touches.
        </li>
        <li>
          Three or more of a colour touching pop (10 points each); anything left hanging from
          nothing drops (20 each).
        </li>
        <li>You can swap the bubble in the cannon with the next one.</li>
        <li>
          Every few shots that pop nothing (the pips by the cannon), a new row pushes the honeycomb
          down.
        </li>
        <li>
          Empty the board for 1000 × level and a fuller board with more colours. A bubble past the
          line ends the game.
        </li>
        <li>
          Each colour has a mark (dot, ring, cross, triangle, square, plus) so they can be told
          apart without colour.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> aim · <kbd>Space</kbd> fire · <kbd>Shift</kbd> or <kbd>X</kbd>{' '}
        swap · or drag a finger to aim and lift it to fire · <kbd>P</kbd> pause · <kbd>R</kbd>{' '}
        restart.
      </p>
    </>
  );
}
