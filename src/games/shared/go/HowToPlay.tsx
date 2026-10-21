import type { Locale } from '../../../core/i18n';

/** Go rules page shared by the three board sizes. */
export function GoRulesText({
  locale,
  size,
  komi,
}: {
  locale: Locale;
  size: number;
  komi: number;
}) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Rodear más <strong>área</strong> que el rival en un tablero de {size}×{size}: tus piedras
          más los puntos vacíos rodeados solo por ellas. Blancas reciben {komi} puntos de komi.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Negras empiezan. Por turnos se coloca una piedra en una intersección vacía, o se pasa.
          </li>
          <li>
            Una cadena de piedras sin libertades (puntos vacíos adyacentes) se captura y se retira.
          </li>
          <li>
            Está prohibido el suicidio (dejar sin libertades a tu propia cadena, salvo que capture)
            y repetir una posición anterior del tablero (superko posicional; incluye el ko).
          </li>
          <li>
            La partida termina cuando ambos pasan seguidos. Se cuenta el área (reglas Tromp–Taylor):
            todas las piedras que quedan cuentan como vivas, así que captura las piedras muertas del
            rival antes de pasar.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una intersección para colocar (en pantallas táctiles, toca dos veces para
            confirmar). «Pasar» está bajo el tablero. Al final se muestra el territorio contado.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd> colocar · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
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
        Surround more <strong>area</strong> than your opponent on a {size}×{size} board: your stones
        plus the empty points surrounded only by them. White receives {komi} points of komi.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Black starts. Players take turns placing a stone on an empty intersection, or passing.
        </li>
        <li>
          A chain of stones with no liberties (adjacent empty points) is captured and removed.
        </li>
        <li>
          Suicide (leaving your own chain without liberties unless it captures) and repeating an
          earlier board position (positional superko, which covers ko) are not allowed.
        </li>
        <li>
          The game ends after two passes in a row. The area is counted (Tromp–Taylor rules): every
          stone still on the board counts as alive, so capture your opponent&apos;s dead stones
          before passing.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap an intersection to place a stone (on touch screens tap twice to confirm). “Pass” is
          below the board. At the end the counted territory is shown.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd> place · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd>{' '}
          restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
