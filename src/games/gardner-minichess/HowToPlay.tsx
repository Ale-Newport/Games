import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Da <strong>jaque mate</strong> en un tablero de 5×5.
        </p>
        <h3>Posición inicial</h3>
        <p>
          Cada bando tiene torre, caballo, alfil, dama y rey en su primera fila (a–e) y cinco peones
          delante. Blancas empiezan.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Las piezas mueven como en el ajedrez.</li>
          <li>
            Los peones avanzan solo una casilla (no hay doble paso, por tanto tampoco captura al
            paso) y coronan en la última fila.
          </li>
          <li>No hay enroque.</li>
          <li>
            Mate, ahogado, triple repetición, 50 jugadas y material insuficiente como en el ajedrez.
          </li>
          <li>Se sabe que con juego perfecto termina en tablas; la CPU Experto no es perfecta.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza y luego su destino, o arrástrala.</li>
          <li>
            Flechas, <kbd>Intro</kbd> seleccionar / mover, <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Deliver <strong>checkmate</strong> on a 5×5 board.
      </p>
      <h3>Start position</h3>
      <p>
        Each side has a rook, knight, bishop, queen and king on its first rank (a–e) and five pawns
        in front. White moves first.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Pieces move as in chess.</li>
        <li>
          Pawns advance one square only (no double step, so no en passant) and promote on the last
          rank.
        </li>
        <li>There is no castling.</li>
        <li>
          Checkmate, stalemate, threefold repetition, fifty moves and dead positions as in chess.
        </li>
        <li>
          The game is known to be a draw with perfect play; the Expert computer is not perfect.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a piece, then its destination, or drag it.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
