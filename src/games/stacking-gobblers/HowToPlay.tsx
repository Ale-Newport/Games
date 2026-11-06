import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue <strong>tres vasos visibles</strong> de tu color en fila, columna o diagonal.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Cada jugador tiene seis vasos: dos pequeños, dos medianos y dos grandes. Naranja
            empieza.
          </li>
          <li>
            En tu turno: coloca un vaso de tu reserva en una casilla vacía o <strong>encima</strong>{' '}
            de un vaso más pequeño (de cualquier color), <strong>o</strong> mueve uno de tus vasos
            visibles del tablero del mismo modo.
          </li>
          <li>
            Al levantar un vaso puedes destapar lo que había debajo. Si tras tu jugada el rival
            muestra tres en línea, gana él (aunque tú también hagas línea).
          </li>
          <li>Triple repetición o 120 jugadas: tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca un vaso de tu reserva o uno tuyo del tablero, y luego la casilla de destino (se
            iluminan las válidas). Los puntos de color indican vasos tapados.
          </li>
          <li>
            <kbd>Tab</kbd> recorre vasos y casillas · <kbd>Intro</kbd> elegir · <kbd>U</kbd>{' '}
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
        Get <strong>three visible cups</strong> of your color in a row, column or diagonal.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each player has six cups: two small, two medium and two large. Orange starts.</li>
        <li>
          On your turn: place a cup from your reserve on an empty cell or <strong>over</strong> a
          smaller cup (of either color), <strong>or</strong> move one of your visible cups on the
          board the same way.
        </li>
        <li>
          Lifting a cup may uncover what was underneath. If after your move your opponent shows
          three in a row, they win (even if you also make a line).
        </li>
        <li>Threefold repetition or 120 plies: draw.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a cup in your reserve or one of yours on the board, then its destination (valid cells
          light up). Colored dots show covered cups.
        </li>
        <li>
          <kbd>Tab</kbd> walks cups and cells · <kbd>Enter</kbd> choose · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
