import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue <strong>cinco fichas de tu color en línea</strong>: horizontal, vertical o
          diagonal. Cuatro no bastan; seis o más también ganan.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Tablero vertical de 9 columnas y 7 filas. Rojo juega primero en la primera ronda.</li>
          <li>
            En tu turno, suelta una ficha en una columna que no esté llena: cae hasta la casilla
            libre más baja.
          </li>
          <li>Si se llenan las 63 casillas sin cinco en línea, la partida es empate.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca o haz clic en una columna; <kbd>←</kbd>/<kbd>→</kbd> eligen columna, <kbd>↓</kbd>/
            <kbd>Intro</kbd> sueltan, <kbd>1</kbd>–<kbd>9</kbd> sueltan directamente.
          </li>
          <li>
            <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd>{' '}
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
        Line up <strong>five discs of your color</strong>: horizontally, vertically or diagonally.
        Four is not enough; six or more also wins.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Upright board of 9 columns and 7 rows. Red moves first in the first round.</li>
        <li>
          On your turn, drop a disc into a column that is not full; it falls to the lowest empty
          cell.
        </li>
        <li>If all 63 cells fill with no five in a row, the game is a draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap or click a column; <kbd>←</kbd>/<kbd>→</kbd> choose a column, <kbd>↓</kbd>/
          <kbd>Enter</kbd> drop, <kbd>1</kbd>–<kbd>9</kbd> drop directly.
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next round.
        </li>
      </ul>
    </>
  );
}
