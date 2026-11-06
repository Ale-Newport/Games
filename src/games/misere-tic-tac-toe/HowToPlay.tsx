import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>No</strong> completes tres de tus marcas en línea. Quien completa una línea —fila,
          columna o diagonal— <strong>pierde</strong> al instante.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 3×3. X juega primero en la primera ronda; luego se alternan las casillas
            vacías.
          </li>
          <li>Si completas tres en línea con tus propias marcas, gana tu rival.</li>
          <li>Si el tablero se llena sin que nadie complete una línea, es empate.</li>
        </ul>
        <h3>Para saber</h3>
        <p>
          Con juego perfecto es empate. Para X, la única apertura que no pierde es el{' '}
          <strong>centro</strong>; después, X puede responder a cada jugada de O en la casilla
          simétrica respecto al centro.
        </p>
        <p>La línea completada se dibuja con el color de quien perdió.</p>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca o haz clic en una casilla; <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd>/
            <kbd>WASD</kbd> y <kbd>Intro</kbd>; <kbd>1</kbd>–<kbd>9</kbd> con la disposición del
            teclado numérico.
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
        <strong>Don't</strong> complete three of your marks in a line. Whoever completes a line —
        row, column or diagonal — <strong>loses</strong> immediately.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          3×3 board. X moves first in the first round; players then alternate filling empty cells.
        </li>
        <li>If you complete three in a row with your own marks, your opponent wins.</li>
        <li>If the board fills with nobody completing a line, the round is a draw.</li>
      </ul>
      <h3>Good to know</h3>
      <p>
        With perfect play the game is a draw. For X, the only opening that does not lose is the{' '}
        <strong>center</strong>; after it, X can answer each O move with the cell mirrored through
        the center.
      </p>
      <p>The completed line is drawn in the loser's color.</p>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap or click a cell; <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd>/<kbd>WASD</kbd>{' '}
          and <kbd>Enter</kbd>; <kbd>1</kbd>–<kbd>9</kbd> in numeric-keypad layout.
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next round.
        </li>
      </ul>
    </>
  );
}
