import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Forma una línea ininterrumpida de <strong>cinco o más</strong> piedras de tu color:
          horizontal, vertical o diagonal.
        </p>
        <h3>Reglas (gomoku libre)</h3>
        <ul>
          <li>
            Tablero de 15×15; se juega en las intersecciones. Negras juegan primero en la primera
            ronda.
          </li>
          <li>
            Por turnos, cada jugador coloca una piedra en un punto vacío. Las piedras no se mueven
            ni se capturan.
          </li>
          <li>
            Las líneas de seis o más también ganan. Negras no tienen restricciones (eso es el
            renju).
          </li>
          <li>Si el tablero se llena sin cinco en línea, es empate.</li>
        </ul>
        <h3>Tácticas</h3>
        <ul>
          <li>
            Un <em>cuatro abierto</em> (cuatro piedras con ambos extremos libres) no se puede
            bloquear.
          </li>
          <li>
            Un <em>tres abierto</em> obliga a responder: si no se bloquea, se convierte en un cuatro
            abierto.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Haz clic en una intersección. En pantallas táctiles, el primer toque muestra la piedra y
            el segundo toque en el mismo punto la coloca.
          </li>
          <li>
            Flechas para moverte, <kbd>Intro</kbd>/<kbd>Espacio</kbd> para colocar · <kbd>U</kbd>{' '}
            deshacer · <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Make an unbroken line of <strong>five or more</strong> stones of your color: horizontally,
        vertically or diagonally.
      </p>
      <h3>Rules (freestyle Gomoku)</h3>
      <ul>
        <li>15×15 board; play on the intersections. Black moves first in the first round.</li>
        <li>
          Players take turns placing one stone on an empty point. Stones never move and are never
          captured.
        </li>
        <li>Lines of six or more also win. Black has no restrictions (that is Renju).</li>
        <li>If the board fills with no five in a row, the game is a draw.</li>
      </ul>
      <h3>Tactics</h3>
      <ul>
        <li>
          An <em>open four</em> (four stones with both ends empty) cannot be blocked.
        </li>
        <li>
          An <em>open three</em> must be answered: left alone, it becomes an open four.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Click an intersection. On touch screens the first tap previews the stone and a second tap
          on the same point places it.
        </li>
        <li>
          Arrows move, <kbd>Enter</kbd>/<kbd>Space</kbd> place · <kbd>U</kbd> undo · <kbd>H</kbd>{' '}
          hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
