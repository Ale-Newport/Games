import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser el primero en llenar el <strong>campamento de la esquina opuesta</strong> con tus
          piezas.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 16 × 16. Cada jugador empieza con 19 piezas en su esquina; los campamentos
            están sombreados con el color de su dueño.
          </li>
          <li>
            En tu turno mueves una pieza: un paso a una casilla vecina vacía (en cualquiera de las
            ocho direcciones) <strong>o</strong> una serie de saltos.
          </li>
          <li>
            Un salto pasa por encima de una pieza vecina (tuya o del rival) a la casilla vacía justo
            detrás, en línea recta. Puedes encadenar saltos en distintas direcciones y parar cuando
            quieras. No se captura nada.
          </li>
          <li>
            Una pieza que ya ha llegado al campamento rival puede moverse dentro, pero no salir.
          </li>
          <li>
            Ganas cuando todas las casillas del campamento rival están ocupadas y al menos una por
            una pieza tuya (así nadie puede bloquearlo quedándose en casa).
          </li>
          <li>
            Tras 600 jugadas gana quien tenga sus piezas más cerca de la meta. Las rondas alternan
            quién empieza.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una de tus piezas y luego una de las casillas marcadas. Las marcas amarillas están
            dentro de tu meta.
          </li>
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
        Be the first to fill the <strong>opposite corner camp</strong> with your pieces.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 16 × 16 board. Each player starts with 19 pieces in their corner; the camps are shaded
          in their owner’s color.
        </li>
        <li>
          On your turn move one piece: a step to an empty neighboring square (in any of the eight
          directions) <strong>or</strong> a series of jumps.
        </li>
        <li>
          A jump goes over an adjacent piece (yours or your opponent’s) to the empty square right
          behind it, in a straight line. Chain jumps in different directions and stop whenever you
          like. Nothing is captured.
        </li>
        <li>A piece that has reached the opponent’s camp may move inside it but not leave.</li>
        <li>
          You win when every square of the opponent’s camp is occupied and at least one by your
          pieces (so nobody can block it by staying home).
        </li>
        <li>
          After 600 moves the player whose pieces are closer to their goal wins. Rounds alternate
          who starts.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap one of your pieces, then one of the marked squares. Yellow marks are inside your goal.
        </li>
        <li>
          Arrows move · <kbd>Enter</kbd> pick / move · <kbd>Esc</kbd> cancel · <kbd>U</kbd> undo ·{' '}
          <kbd>H</kbd> hint · <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
