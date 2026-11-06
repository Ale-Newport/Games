import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue tres de tus marcas en línea: en una fila, una columna o una de las dos
          diagonales.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>El tablero es una cuadrícula de 3×3. X juega primero en la primera ronda.</li>
          <li>
            Por turnos, cada jugador coloca su marca en una casilla vacía. Las marcas no se mueven.
          </li>
          <li>
            Gana quien complete primero una línea de tres. Si el tablero se llena sin línea, es
            empate.
          </li>
          <li>Con «Alternar quién empieza», la marca que abre cambia en cada ronda.</li>
        </ul>
        <h3>Modos</h3>
        <ul>
          <li>
            <strong>Contra la CPU:</strong> Fácil, Medio o Perfecto. El nivel Perfecto analiza el
            árbol de juego completo y nunca pierde: empatar con él es jugar perfecto.
          </li>
          <li>
            <strong>Dos jugadores:</strong> por turnos en el mismo dispositivo.
          </li>
          <li>
            <strong>Ver a la IA:</strong> elige un agente para cada marca y observa la partida.
          </li>
        </ul>
        <h3>Estrategia</h3>
        <p>
          Crea una <em>horquilla</em>: una jugada que amenaza dos líneas a la vez. El rival solo
          puede bloquear una.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>Toca o haz clic en una casilla.</li>
          <li>
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> o <kbd>WASD</kbd> para moverte;{' '}
            <kbd>Intro</kbd>/<kbd>Espacio</kbd> para colocar.
          </li>
          <li>
            <kbd>1</kbd>–<kbd>9</kbd> colocan directamente con la disposición del teclado numérico (
            <kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> = fila superior).
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
        Get three of your marks in a line: across a row, down a column, or along either diagonal.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>The board is a 3×3 grid. X moves first in the first round.</li>
        <li>Players take turns placing their mark in an empty cell. Marks never move.</li>
        <li>
          The first player to complete a line of three wins. If the board fills with no line, the
          round is a draw.
        </li>
        <li>With “Alternate who starts”, the opening mark switches every round.</li>
      </ul>
      <h3>Modes</h3>
      <ul>
        <li>
          <strong>vs Computer:</strong> Easy, Medium or Perfect. Perfect searches the whole game
          tree and never loses — drawing it means you played perfectly.
        </li>
        <li>
          <strong>Two Players:</strong> take turns on one device.
        </li>
        <li>
          <strong>Watch AI:</strong> pick an agent for each mark and watch them play.
        </li>
      </ul>
      <h3>Strategy</h3>
      <p>
        Build a <em>fork</em>: one move that threatens two lines at once. Your opponent can block
        only one.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Tap or click a cell.</li>
        <li>
          <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> or <kbd>WASD</kbd> to move;{' '}
          <kbd>Enter</kbd>/<kbd>Space</kbd> to place.
        </li>
        <li>
          <kbd>1</kbd>–<kbd>9</kbd> place directly using numeric-keypad layout (<kbd>7</kbd>{' '}
          <kbd>8</kbd> <kbd>9</kbd> = top row).
        </li>
        <li>
          <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart round · <kbd>N</kbd> next
          round.
        </li>
      </ul>
    </>
  );
}
