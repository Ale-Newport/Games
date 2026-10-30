import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sé el primero en recorrer el tablero con tus siete piezas y sacarlas todas. Son las reglas
          que el asiriólogo Irving Finkel reconstruyó a partir de una tablilla cuneiforme.
        </p>
        <h3>Recorrido</h3>
        <p>
          Cada bando entra por su fila, avanza cuatro casillas propias hacia la izquierda, recorre
          la fila central compartida de izquierda a derecha y termina con dos casillas propias antes
          de salir (14 casillas y una más para salir).
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Se tiran cuatro dados piramidales: cuenta las puntas marcadas (de 0 a 4).</li>
          <li>Mueve una pieza exactamente ese número de casillas, o entra una pieza nueva.</li>
          <li>
            No puedes caer en una casilla con una pieza tuya. Para salir hace falta la tirada
            exacta.
          </li>
          <li>Si caes sobre una pieza rival en la fila central, vuelve al inicio.</li>
          <li>
            Las rosetas dan otra tirada; la roseta central además protege a la pieza que está en
            ella.
          </li>
          <li>Con un 0, o si ninguna pieza puede mover, pasa el turno.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>T</kbd> o <kbd>Espacio</kbd> tirar · toca una pieza marcada (o las piezas por entrar)
          · <kbd>E</kbd> entrar una pieza · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the first to race all seven of your pieces round the board and off. These are the rules
        the Assyriologist Irving Finkel reconstructed from a cuneiform tablet.
      </p>
      <h3>The route</h3>
      <p>
        Each side enters on its own row, runs four private squares to the left, travels the shared
        middle row from left to right, and finishes with two private squares before leaving (14
        squares, and one more to bear off).
      </p>
      <h3>A turn</h3>
      <ul>
        <li>Throw four pyramid dice: count the marked tips (0 to 4).</li>
        <li>Move one piece exactly that many squares, or enter a new piece.</li>
        <li>You cannot land on your own piece. Bearing off needs the exact throw.</li>
        <li>Landing on an opposing piece in the middle row sends it back to the start.</li>
        <li>Rosettes give another throw; the central rosette also protects the piece on it.</li>
        <li>A 0, or a throw no piece can use, passes the turn.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>T</kbd> or <kbd>Space</kbd> throw · tap a marked piece (or the pieces to enter) ·{' '}
        <kbd>E</kbd> enter a piece · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
