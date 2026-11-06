import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue <strong>cuatro</strong> de tus marcas en línea: en una fila, una columna o una de
          las dos diagonales largas. Tres en línea no cuentan.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>El tablero es de 4×4. X juega primero en la primera ronda.</li>
          <li>
            Por turnos, cada jugador coloca su marca en una casilla vacía. Las marcas no se mueven.
          </li>
          <li>Hay 10 líneas ganadoras: 4 filas, 4 columnas y 2 diagonales.</li>
          <li>Si el tablero se llena sin cuatro en línea, la ronda es empate.</li>
        </ul>
        <h3>Para saber</h3>
        <p>
          Con juego perfecto el resultado es empate: nuestro solucionador lo demuestra. Para ganar a
          un rival imperfecto, prepara una <em>amenaza doble</em>: dos casillas que completarían una
          línea a la vez.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>Toca o haz clic en una casilla.</li>
          <li>
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> o <kbd>WASD</kbd> para moverte;{' '}
            <kbd>Intro</kbd>/<kbd>Espacio</kbd> para colocar.
          </li>
          <li>
            <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar ronda · <kbd>N</kbd>{' '}
            siguiente ronda.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Get <strong>four</strong> of your marks in a line: across a row, down a column, or along
        either long diagonal. Three in a row does not count.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>The board is 4×4. X moves first in the first round.</li>
        <li>Players take turns placing their mark in an empty cell. Marks never move.</li>
        <li>There are 10 winning lines: 4 rows, 4 columns and 2 diagonals.</li>
        <li>If the board fills with no four in a row, the round is a draw.</li>
      </ul>
      <h3>Good to know</h3>
      <p>
        With perfect play the result is a draw — our solver proves it. To beat an imperfect
        opponent, build a <em>double threat</em>: two cells that would each complete a line.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Tap or click a cell.</li>
        <li>
          <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> or <kbd>WASD</kbd> to move;{' '}
          <kbd>Enter</kbd>/<kbd>Space</kbd> to place.
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart round · <kbd>N</kbd> next
          round.
        </li>
      </ul>
    </>
  );
}
