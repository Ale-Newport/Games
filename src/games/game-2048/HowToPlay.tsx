import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue una ficha de 2048 en el tablero de 4×4 (256 en el de 3×3, 4096 en el de 5×5).
          Después puedes seguir jugando hasta que no quede ningún movimiento.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada movimiento desliza todas las fichas hasta el borde en la dirección elegida.</li>
          <li>
            Dos fichas iguales que chocan se fusionan en una con su suma; cada ficha se fusiona una
            sola vez por movimiento.
          </li>
          <li>
            Tras cada movimiento aparece un 2 (o, una de cada diez veces, un 4) en una casilla
            vacía.
          </li>
          <li>Cada fusión suma su valor a los puntos.</li>
        </ul>
        <h3>Truco</h3>
        <p>
          Guarda la ficha mayor en una esquina y mantén la fila de esa esquina llena y ordenada;
          evita el movimiento que la sacaría de allí.
        </p>
        <h3>Controles</h3>
        <p>
          Desliza sobre el tablero o pulsa las flechas o <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd>{' '}
          <kbd>D</kbd> · <kbd>U</kbd> deshacer una vez · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Make a 2048 tile on the 4×4 board (256 on 3×3, 4096 on 5×5). Then you can keep playing until
        no move is left.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Every move slides all the tiles as far as they go in the chosen direction.</li>
        <li>
          Two equal tiles that collide merge into one with their sum; each tile merges once per
          move.
        </li>
        <li>After every move a 2 (or, one time in ten, a 4) appears on an empty cell.</li>
        <li>Every merge adds its value to the score.</li>
      </ul>
      <h3>Tip</h3>
      <p>
        Keep the biggest tile in a corner and the row along it full and ordered; avoid the move that
        would pull it out.
      </p>
      <h3>Controls</h3>
      <p>
        Swipe on the board or press the arrows or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd>{' '}
        <kbd>D</kbd> · <kbd>U</kbd> undo once · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
