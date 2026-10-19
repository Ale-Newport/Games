import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Gana tres <strong>tableros pequeños</strong> en línea en el tablero grande: fila, columna
          o diagonal.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Hay nueve tableros de tres en raya dispuestos en una cuadrícula de 3×3. X juega primero,
            en cualquier casilla.
          </li>
          <li>
            <strong>Envío:</strong> la casilla en la que juegas indica el tablero donde debe jugar
            tu rival. Si juegas en la esquina superior derecha de un tablero, tu rival juega en el
            tablero de la esquina superior derecha.
          </li>
          <li>
            <strong>Elección libre:</strong> si ese tablero ya está decidido (ganado o lleno), el
            rival puede jugar en cualquier tablero abierto.
          </li>
          <li>
            Quien hace tres en raya en un tablero pequeño lo gana: se cierra y cuenta como su marca
            en el tablero grande.
          </li>
          <li>Un tablero pequeño lleno sin línea queda empatado y no cuenta para nadie.</li>
          <li>
            Si todos los tableros están decididos y nadie tiene tres en línea, la partida es empate.
          </li>
        </ul>
        <p>
          Los tableros donde se puede jugar brillan. Los tableros ganados muestran una gran marca;
          los empatados, un rayado.
        </p>
        <h3>Estrategia</h3>
        <p>
          Piensa en dónde envías a tu rival: evita mandarlo a un tablero donde pueda ganar, y no le
          regales elecciones libres.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>Toca o haz clic en una casilla de un tablero que brille.</li>
          <li>
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> o <kbd>WASD</kbd> recorren la
            cuadrícula de 9×9; <kbd>Intro</kbd>/<kbd>Espacio</kbd> colocan.
          </li>
          <li>
            <kbd>1</kbd>–<kbd>9</kbd> colocan en la casilla correspondiente del tablero obligado
            (disposición del teclado numérico).
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
        Win three <strong>small boards</strong> in a line on the big board: a row, a column or a
        diagonal.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Nine Tic-Tac-Toe boards sit in a 3×3 grid. X moves first, anywhere.</li>
        <li>
          <strong>Sending:</strong> the cell you play in tells your opponent which board they must
          play in next. Play the top-right cell of a board and your opponent must play in the
          top-right board.
        </li>
        <li>
          <strong>Free choice:</strong> if that board is already decided (won or full), your
          opponent may play in any open board.
        </li>
        <li>
          Getting three in a row on a small board wins it: it closes and counts as your mark on the
          big board.
        </li>
        <li>A small board that fills up with no line is drawn and counts for nobody.</li>
        <li>
          If every board is decided and nobody has three in a row on the big board, the game is a
          draw.
        </li>
      </ul>
      <p>Boards you may play in glow. Won boards show a large mark; drawn boards are hatched.</p>
      <h3>Strategy</h3>
      <p>
        Think about where you send your opponent: avoid sending them to a board they can win, and
        don&apos;t hand out free choices.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Tap or click a cell in a glowing board.</li>
        <li>
          <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> or <kbd>WASD</kbd> move across the 9×9
          grid; <kbd>Enter</kbd>/<kbd>Space</kbd> place.
        </li>
        <li>
          <kbd>1</kbd>–<kbd>9</kbd> place in that cell of the forced board (numeric-keypad layout).
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next round.
        </li>
      </ul>
    </>
  );
}
