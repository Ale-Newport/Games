import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue <strong>cuatro fichas de tu color en línea</strong>: en horizontal, vertical o
          diagonal.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            El tablero vertical tiene 7 columnas y 6 filas. Rojo juega primero en la primera ronda.
          </li>
          <li>
            En tu turno, suelta una ficha en cualquier columna que no esté llena: cae hasta la
            casilla libre más baja.
          </li>
          <li>
            Gana quien alinee primero cuatro fichas. Si se llenan las 42 casillas sin cuatro en
            línea, es empate.
          </li>
        </ul>
        <h3>Consejos</h3>
        <ul>
          <li>La columna central participa en más líneas que ninguna otra.</li>
          <li>
            Busca crear dos amenazas a la vez, y fíjate en qué casilla quedaría disponible encima de
            la que juegas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca o haz clic en cualquier parte de una columna.</li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> eligen columna; <kbd>↓</kbd>, <kbd>Intro</kbd> o{' '}
            <kbd>Espacio</kbd> sueltan; <kbd>1</kbd>–<kbd>7</kbd> sueltan directamente.
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
        Line up <strong>four discs of your color</strong>: horizontally, vertically or diagonally.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>The upright board has 7 columns and 6 rows. Red moves first in the first round.</li>
        <li>
          On your turn, drop a disc into any column that is not full; it falls to the lowest empty
          cell.
        </li>
        <li>
          The first to line up four wins. If all 42 cells fill without four in a row, the game is a
          draw.
        </li>
      </ul>
      <h3>Tips</h3>
      <ul>
        <li>The center column takes part in more lines than any other.</li>
        <li>
          Try to create two threats at once, and watch which cell becomes available above the one
          you play.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap or click anywhere in a column.</li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> choose a column; <kbd>↓</kbd>, <kbd>Enter</kbd> or{' '}
          <kbd>Space</kbd> drop; <kbd>1</kbd>–<kbd>7</kbd> drop directly.
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next round.
        </li>
      </ul>
    </>
  );
}
