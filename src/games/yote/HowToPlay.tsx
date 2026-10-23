import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tomar <strong>todas las piezas rivales</strong>, las del tablero y las de la mano.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 5×6. Cada jugador empieza con 12 piezas en la mano. Empiezan las claras.
          </li>
          <li>
            En tu turno: coloca una pieza de la mano en una casilla vacía, mueve una pieza un paso
            en horizontal o vertical, o salta en línea sobre una pieza rival vecina a la casilla
            vacía de detrás para capturarla.
          </li>
          <li>
            Tras capturar, retira además otra pieza rival a tu elección del tablero; si no queda
            ninguna en el tablero, quita una de su mano.
          </li>
          <li>
            Pierde quien se queda sin piezas o sin jugadas. Con tres piezas o menos cada uno, o tras
            triple repetición o 200 jugadas: tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una casilla vacía para colocar; toca tu pieza y un destino (punto verde) para mover
            o saltar; para la retirada extra toca la pieza rival marcada en rojo.
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
        Take <strong>every enemy piece</strong>, on the board and in hand.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>A 5×6 board. Each player starts with 12 pieces in hand. Light moves first.</li>
        <li>
          On your turn: place a piece from hand on an empty square, step a piece one square
          horizontally or vertically, or jump in a line over an adjacent enemy piece to the empty
          square beyond to capture it.
        </li>
        <li>
          After a capture you also remove one more enemy piece of your choice from the board; if
          none is left on the board, take one from their hand.
        </li>
        <li>
          A side with no pieces or no move loses. With three pieces or fewer each, or after
          threefold repetition or 200 plies, it is a draw.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap an empty square to place; tap your piece and a destination (green dot) to step or
          jump; for the bonus removal tap the enemy piece outlined in red.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
