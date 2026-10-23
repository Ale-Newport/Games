import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Cabras</strong>: dejar a los cuatro tigres sin jugadas. <strong>Tigres</strong>:
          comer 5 cabras.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 5×5 puntos con diagonales en puntos alternos. Los tigres empiezan en las
            esquinas; las 20 cabras empiezan fuera.
          </li>
          <li>
            Empiezan las cabras. Mientras queden cabras en mano, cada turno de cabras coloca una en
            un punto vacío.
          </li>
          <li>Después, las cabras se mueven un paso a lo largo de una línea. Nunca capturan.</li>
          <li>
            Un tigre se mueve un paso o salta sobre una cabra vecina, en línea recta, al punto vacío
            de detrás, y se la come (un solo salto por turno).
          </li>
          <li>Triple repetición o 300 jugadas: tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Cabras en mano: toca un punto marcado para colocar. Para mover: toca la pieza y luego el
            destino.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        <strong>Goats</strong>: leave all four tigers without a move. <strong>Tigers</strong>: eat 5
        goats.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 5×5 board of points with diagonals through every other point. Tigers start in the
          corners; the 20 goats start off the board.
        </li>
        <li>
          The goats move first. While goats remain in hand, each goat turn places one on an empty
          point.
        </li>
        <li>After that, goats step one point along a line. They never capture.</li>
        <li>
          A tiger steps one point, or jumps over an adjacent goat in a straight line to the empty
          point beyond, eating it (one jump per turn).
        </li>
        <li>Threefold repetition or 300 plies is a draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Goats in hand: tap a marked point to place one. To move: tap a piece, then its
          destination.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
