import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Fusiona fichas para hacer números cada vez mayores: 384 en el tablero de 4×4 (48 en el de
          3×3 y 1536 en el de 5×5). La partida sigue hasta que no queda ningún movimiento.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada movimiento desplaza las fichas una sola casilla en la dirección elegida.</li>
          <li>
            Un 1 y un 2 se fusionan en un 3; dos fichas iguales de 3 o más se fusionan en su doble.
          </li>
          <li>
            En cada fila (o columna) avanza la primera ficha que puede moverse y todas las de detrás
            la siguen; solo hay una fusión por línea.
          </li>
          <li>
            Después entra la siguiente ficha, que ves arriba, por el borde trasero de una de las
            líneas que se movieron.
          </li>
          <li>
            Las fichas salen de un mazo barajado con cuatro 1, cuatro 2 y cuatro 3; cuando ya tienes
            un 48 a veces sale una ficha extra más grande.
          </li>
        </ul>
        <h3>Puntuación</h3>
        <p>
          Al final, cada 3 vale 3 puntos y cada duplicación multiplica por tres: 6 vale 9, 12 vale
          27…
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
        Merge tiles into bigger and bigger numbers: a 384 on the 4×4 board (a 48 on 3×3, a 1536 on
        5×5). The game goes on until no move is left.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Every move shifts the tiles just one cell in the chosen direction.</li>
        <li>A 1 and a 2 merge into a 3; two equal tiles of 3 or more merge into their double.</li>
        <li>
          In each row (or column) the first tile that can move goes forward and every tile behind it
          follows; there is one merge per line at most.
        </li>
        <li>
          Then the next tile, shown at the top, enters at the back edge of one of the lines that
          moved.
        </li>
        <li>
          Tiles come from a shuffled deck of four 1s, four 2s and four 3s; once you hold a 48, a
          bigger bonus tile shows up now and then.
        </li>
      </ul>
      <h3>Scoring</h3>
      <p>
        At the end every 3 is worth 3 points and each doubling triples it: 6 is worth 9, 12 is 27…
      </p>
      <h3>Controls</h3>
      <p>
        Swipe on the board or press the arrows or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd>{' '}
        <kbd>D</kbd> · <kbd>U</kbd> undo once · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
