import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>coloque la última ficha</strong>: el rival se queda sin sitio y pierde.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cuadrícula de 5×6. Ambos jugadores colocan fichas en horizontal o en vertical.</li>
          <li>
            Cada ficha cubre dos casillas vacías vecinas. El primer turno se alterna por ronda.
          </li>
          <li>Quien no puede colocar ninguna ficha en su turno pierde. No hay tablas.</li>
          <li>
            Truco: en un tablero con un lado impar, quien empieza puede tapar el centro con una
            ficha y luego copiar cada jugada del rival en simetría respecto al centro.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una casilla y luego una vecina resaltada en verde. Si solo hay una posible, toca la
            misma casilla otra vez.
          </li>
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
        Be the one to <strong>place the last domino</strong>: your opponent runs out of room and
        loses.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>A 5×6 grid. Both players place dominoes horizontally or vertically.</li>
        <li>Each domino covers two empty neighboring cells. The first turn alternates by round.</li>
        <li>Whoever cannot place a domino on their turn loses. There are no draws.</li>
        <li>
          Trick: on a board with an odd side, the first player can cover the center with one domino
          and then copy every move of the opponent mirrored through the center.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a cell, then one of the neighbors highlighted in green. If only one fits, tap the same
          cell again.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
