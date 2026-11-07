import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Rellena cada casilla blanca con un número del 1 al 9. Cada <strong>tramo</strong> de
          casillas blancas seguidas (horizontal o vertical) debe <strong>sumar</strong> la pista de
          la casilla oscura donde empieza —arriba a la derecha la horizontal, abajo a la izquierda
          la vertical— y no puede repetir ningún número.
        </p>
        <p>
          Cada kakuro tiene una única solución. Si las sumas solas admitirían dos, se dan uno o
          varios números de partida (en negrita).
        </p>
        <h3>Trucos</h3>
        <ul>
          <li>
            Algunas sumas solo tienen una combinación: 3 en dos casillas es 1+2, 17 en dos es 8+9, 6
            en tres es 1+2+3. Debajo del tablero ves las combinaciones que siguen abiertas para los
            tramos de la casilla elegida.
          </li>
          <li>Una casilla está en dos tramos: su número tiene que valer para los dos.</li>
          <li>
            «Rellenar notas» apunta en cada casilla los números que admiten sus dos tramos. Un tramo
            marcado en rojo repite un número o se pasa de su suma.
          </li>
          <li>La pista explica el siguiente paso y lo coloca si quieres.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una casilla y luego un número. Flechas mover · números colocar · <kbd>Mayús</kbd>
          +número o <kbd>N</kbd> notas · <kbd>Retroceso</kbd> borrar · <kbd>U</kbd> deshacer ·{' '}
          <kbd>R</kbd> rehacer · <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Fill every white cell with a digit from 1 to 9. Each <strong>run</strong> of consecutive
        white cells (across or down) must <strong>add up</strong> to the clue in the dark cell where
        it starts — top right for across, bottom left for down — and may not repeat a digit.
      </p>
      <p>
        Every puzzle has exactly one solution. When the sums alone would allow two, one or more
        digits are given at the start (in bold).
      </p>
      <h3>Tips</h3>
      <ul>
        <li>
          Some sums have only one combination: 3 in two cells is 1+2, 17 in two is 8+9, 6 in three
          is 1+2+3. Below the board you see the combinations still open for the selected
          cell&rsquo;s runs.
        </li>
        <li>Every cell sits in two runs: its digit must suit both.</li>
        <li>
          &ldquo;Fill notes&rdquo; pencils in what both runs still allow. A run in red repeats a
          digit or overshoots its sum.
        </li>
        <li>A hint explains the next step and fills it in if you want.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a cell, then a digit. Arrows move · digits place · <kbd>Shift</kbd>+digit or{' '}
        <kbd>N</kbd> notes · <kbd>Backspace</kbd> erase · <kbd>U</kbd> undo · <kbd>R</kbd> redo ·{' '}
        <kbd>H</kbd> hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
