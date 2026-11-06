import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Gana quien da <strong>jaque mate</strong> o quien lleva primero su{' '}
          <strong>rey a la colina</strong>: d4, e4, d5 o e5 (marcadas en el tablero).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Todas las reglas del ajedrez: enroque, al paso, coronación, ahogado, repetición, 50
            jugadas, material insuficiente.
          </li>
          <li>
            Llegar a la colina debe ser una jugada legal: el rey nunca puede entrar en una casilla
            atacada.
          </li>
          <li>La partida termina en cuanto el rey pisa la colina.</li>
        </ul>
        <h3>Consejo</h3>
        <p>Un rey adelantado gana carreras pero recibe ataques: cambia damas antes de marchar.</p>
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
        Win by <strong>checkmate</strong> or by being first to bring your{' '}
        <strong>king to the hill</strong>: d4, e4, d5 or e5 (marked on the board).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          All the rules of chess: castling, en passant, promotion, stalemate, repetition, fifty
          moves, insufficient material.
        </li>
        <li>
          Reaching the hill must be a legal move: the king can never step onto an attacked square.
        </li>
        <li>The game ends the moment the king lands on the hill.</li>
      </ul>
      <h3>Tip</h3>
      <p>An advanced king wins races but draws attacks: trade queens before you march.</p>
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
