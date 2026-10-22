import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tener <strong>más piezas</strong> que el rival cuando termine la partida.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Rojo empieza. Cada jugador tiene dos piezas en esquinas opuestas de un tablero de 7×7.
          </li>
          <li>
            <strong>Clonar</strong>: mueve a una casilla vacía vecina (también en diagonal); aparece
            una pieza nueva y la original se queda. <strong>Saltar</strong>: mueve a una casilla a
            distancia dos; la pieza deja su casilla.
          </li>
          <li>Todas las piezas rivales alrededor de la casilla de destino pasan a ser tuyas.</li>
          <li>Si no tienes jugadas, pasas.</li>
          <li>
            Termina cuando el tablero está lleno, un jugador se queda sin piezas, nadie puede mover
            o tras 400 jugadas. Gana quien tenga más piezas; triple repetición es tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca tu pieza: los puntos verdes son clonaciones y los anillos ámbar, saltos.</li>
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
        Have <strong>more pieces</strong> than your opponent when the game ends.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Red starts. Each player has two pieces in opposite corners of a 7×7 board.</li>
        <li>
          <strong>Clone</strong>: move to an empty neighboring cell (diagonals too); a new piece
          appears and the original stays. <strong>Jump</strong>: move to a cell two away; the piece
          leaves its cell.
        </li>
        <li>Every enemy piece around the destination becomes yours.</li>
        <li>If you have no move, you pass.</li>
        <li>
          It ends when the board is full, a player has no pieces, nobody can move, or after 400
          plies. The most pieces wins; threefold repetition is a draw.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap your piece: green dots are clones, amber rings are jumps.</li>
        <li>
          Arrows, <kbd>Enter</kbd> select / move, <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
