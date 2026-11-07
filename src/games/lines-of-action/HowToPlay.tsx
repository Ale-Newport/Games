import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Unir <strong>todas tus fichas en un solo grupo</strong> (tocándose en horizontal, vertical
          o diagonal).
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 8 × 8. Las negras empiezan en las filas superior e inferior y las blancas en
            las columnas laterales (sin esquinas), doce cada una. Empiezan las negras.
          </li>
          <li>
            Una ficha se mueve en línea recta (8 direcciones) <strong>exactamente</strong> tantas
            casillas como fichas de cualquier color haya en toda esa línea.
          </li>
          <li>
            Puede saltar sobre tus fichas pero no sobre las del rival. Puede caer sobre una ficha
            rival (la captura), nunca sobre una tuya.
          </li>
          <li>
            Si una jugada une los dos bandos a la vez, gana quien la hizo. Quien no tiene jugadas
            pierde. Tras 300 jugadas, tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una de tus fichas y luego un destino marcado (rojo: captura).</li>
          <li>
            Flechas mover · <kbd>Intro</kbd> elegir / mover · <kbd>Esc</kbd> cancelar · <kbd>U</kbd>{' '}
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
        Join <strong>all your pieces into one group</strong> (touching orthogonally or diagonally).
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          An 8 × 8 board. Black starts on the top and bottom rows and White on the side columns
          (corners empty), twelve each. Black moves first.
        </li>
        <li>
          A piece moves in a straight line (8 directions) <strong>exactly</strong> as many squares
          as there are pieces of either color on that whole line.
        </li>
        <li>
          It may jump over your own pieces but not the opponent’s. It may land on an opponent’s
          piece (capturing it), never on your own.
        </li>
        <li>
          If a move joins both sides at once, the mover wins. A player with no move loses. After 300
          moves the game is drawn.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap one of your pieces, then a marked destination (red: capture).</li>
        <li>
          Arrows move · <kbd>Enter</kbd> pick / move · <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
