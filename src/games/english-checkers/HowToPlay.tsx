import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Deja a tu rival <strong>sin piezas o sin jugadas</strong>.
        </p>
        <h3>Reglas (damas inglesas)</h3>
        <ul>
          <li>
            Tablero de 8×8; se juega en las casillas oscuras. Cada jugador tiene 12 peones. Negras
            empiezan.
          </li>
          <li>
            Los peones avanzan una casilla en diagonal. Las damas se mueven una casilla en diagonal
            hacia delante o hacia atrás.
          </li>
          <li>
            <strong>Capturar es obligatorio:</strong> se salta en diagonal una pieza rival adyacente
            hasta la casilla libre de detrás. Los peones solo capturan hacia delante; las damas en
            las cuatro direcciones.
          </li>
          <li>
            Si tras un salto se puede seguir saltando, hay que continuar (captura múltiple). Si
            existen varias capturas posibles, puedes elegir <em>cualquiera</em>.
          </li>
          <li>
            Un peón que llega a la última fila se corona dama. Si llega capturando, la jugada
            termina ahí.
          </li>
          <li>
            Pierde quien no puede mover. Hay tablas por triple repetición o tras 40 jugadas de cada
            bando sin capturas ni movimientos de peón.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza resaltada y luego la casilla de destino. En capturas múltiples, toca cada
            casilla de aterrizaje por orden.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> para seleccionar, <kbd>Esc</kbd> para cancelar · <kbd>U</kbd>{' '}
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
        Leave your opponent <strong>without pieces or without legal moves</strong>.
      </p>
      <h3>Rules (English draughts)</h3>
      <ul>
        <li>8×8 board; play on the dark squares. Each player has 12 men. Black moves first.</li>
        <li>
          Men move one square diagonally forward. Kings move one square diagonally forward or
          backward.
        </li>
        <li>
          <strong>Captures are compulsory:</strong> jump diagonally over an adjacent enemy piece
          into the empty square beyond. Men capture forward only; kings in all four directions.
        </li>
        <li>
          If another jump is available after a jump, you must continue (multi-jump). When several
          captures exist you may choose <em>any</em> of them.
        </li>
        <li>
          A man reaching the far row is crowned a king. If it gets there by capturing, the move
          ends.
        </li>
        <li>
          A player who cannot move loses. Draws by threefold repetition or after 40 moves by each
          side without a capture or a man move.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a highlighted piece, then its destination. For multi-jumps, tap each landing square in
          order.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
