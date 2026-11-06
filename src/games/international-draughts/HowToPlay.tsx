import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Deja a tu rival <strong>sin piezas o sin jugadas</strong>.
        </p>
        <h3>Reglas (FMJD)</h3>
        <ul>
          <li>
            Tablero de 10×10; se juega en las 50 casillas oscuras. Cada jugador tiene 20 peones.
            Blancas empiezan.
          </li>
          <li>
            Los peones avanzan una casilla en diagonal, pero{' '}
            <strong>capturan hacia delante y hacia atrás</strong>.
          </li>
          <li>
            Las damas son <strong>voladoras</strong>: se mueven cualquier número de casillas libres
            en diagonal y capturan a distancia, aterrizando en cualquier casilla libre detrás de la
            pieza capturada.
          </li>
          <li>
            <strong>Capturar es obligatorio</strong> y rige la <strong>ley de la mayoría</strong>:
            hay que elegir la secuencia que capture más piezas (damas y peones cuentan igual).
          </li>
          <li>
            Las piezas capturadas se retiran al terminar la jugada: no se pueden saltar dos veces y
            bloquean el paso.
          </li>
          <li>
            Un peón solo corona si <em>termina</em> la jugada en la última fila.
          </li>
          <li>
            Pierde quien no puede mover. Tablas por triple repetición, por 25 jugadas de cada bando
            solo con damas y sin capturas, y por las cuentas de final de la FMJD.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza resaltada y luego cada casilla de aterrizaje en orden.</li>
          <li>
            Flechas, <kbd>Intro</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Leave your opponent <strong>without pieces or without legal moves</strong>.
      </p>
      <h3>Rules (FMJD)</h3>
      <ul>
        <li>
          10×10 board; play on the 50 dark squares. Each player has 20 men. White moves first.
        </li>
        <li>
          Men move one square diagonally forward, but <strong>capture forward and backward</strong>.
        </li>
        <li>
          Kings <strong>fly</strong>: they move any number of empty squares along a diagonal and
          capture at a distance, landing on any empty square beyond the captured piece.
        </li>
        <li>
          <strong>Captures are compulsory</strong> and the <strong>majority rule</strong> applies:
          you must choose the sequence that captures the most pieces (kings and men count the same).
        </li>
        <li>
          Captured pieces are removed when the move ends: they cannot be jumped twice and they block
          the way.
        </li>
        <li>
          A man is crowned only if it <em>ends</em> its move on the far row.
        </li>
        <li>
          A player who cannot move loses. Draws by threefold repetition, 25 king-only moves each
          without captures, and the FMJD endgame counts.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a highlighted piece, then each landing square in order.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
