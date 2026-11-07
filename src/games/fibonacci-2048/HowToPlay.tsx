import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue una ficha de 2584 en el tablero de 4×4 (144 en el de 3×3, 4181 en el de 5×5).
          Después puedes seguir jugando hasta que no quede ningún movimiento.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada movimiento desliza todas las fichas hasta el borde en la dirección elegida.</li>
          <li>
            Dos fichas que chocan se fusionan si son vecinas en la sucesión de Fibonacci (1, 1, 2,
            3, 5, 8, 13…): 1+1, 1+2, 2+3, 3+5… dan la siguiente. Dos fichas iguales mayores que 1 no
            se fusionan.
          </li>
          <li>
            Cada ficha se fusiona una sola vez por movimiento y cada fusión suma su valor a los
            puntos.
          </li>
          <li>
            Tras cada movimiento aparece un 1 (o, una de cada cuatro veces, un 2) en una casilla
            vacía.
          </li>
        </ul>
        <h3>Truco</h3>
        <p>
          Ordena las fichas en una esquina como en la sucesión: cada ficha junto a su vecina de
          Fibonacci, para que las fusiones encadenen.
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
        Make a 2584 tile on the 4×4 board (144 on 3×3, 4181 on 5×5). Then you can keep playing until
        no move is left.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Every move slides all the tiles as far as they go in the chosen direction.</li>
        <li>
          Two tiles that collide merge when they are neighbours in the Fibonacci sequence (1, 1, 2,
          3, 5, 8, 13…): 1+1, 1+2, 2+3, 3+5… make the next one. Two equal tiles above 1 do not
          merge.
        </li>
        <li>Each tile merges once per move, and every merge adds its value to the score.</li>
        <li>After every move a 1 (or, one time in four, a 2) appears on an empty cell.</li>
      </ul>
      <h3>Tip</h3>
      <p>
        Line the tiles up in a corner like the sequence: each tile next to its Fibonacci neighbour,
        so that merges chain.
      </p>
      <h3>Controls</h3>
      <p>
        Swipe on the board or press the arrows or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd>{' '}
        <kbd>D</kbd> · <kbd>U</kbd> undo once · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
