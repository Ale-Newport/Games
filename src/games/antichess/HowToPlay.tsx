import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Quedarte sin piezas</strong>, o sin jugadas legales en tu turno. Quien lo consigue
          gana.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Las piezas mueven como en el ajedrez; Blancas empiezan.</li>
          <li>
            <strong>Capturar es obligatorio:</strong> si puedes capturar, debes hacerlo. Si hay
            varias capturas, eliges cualquiera.
          </li>
          <li>
            El rey es una pieza normal: no hay jaque ni mate, se puede capturar y no hay enroque.
          </li>
          <li>Un peón que llega al final puede coronar también en rey.</li>
          <li>
            Tablas por triple repetición, por la regla de las 50 jugadas o cuando solo quedan
            alfiles de cada bando en casillas de distinto color (ya nunca podrán capturarse).
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza y luego su destino, o arrástrala. Cuando hay que capturar, solo se marcan
            las capturas.
          </li>
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
        <strong>Run out of pieces</strong> — or have no legal move on your turn. Whoever does wins.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Pieces move as in chess; White starts.</li>
        <li>
          <strong>Captures are compulsory:</strong> if you can capture, you must. With several
          captures you may choose any.
        </li>
        <li>The king is an ordinary piece: no check or mate, it can be captured, no castling.</li>
        <li>A pawn reaching the last rank may also promote to a king.</li>
        <li>
          Draws by threefold repetition, the fifty-move rule, or when only bishops on opposite
          square colors remain (they can never capture each other).
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a piece, then its destination, or drag it. When a capture is required only captures
          are marked.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
