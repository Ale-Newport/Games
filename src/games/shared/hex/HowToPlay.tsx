import type { Locale } from '../../../core/i18n';

/** Hex rules page shared by both board sizes. */
export function HexRulesText({ locale, size }: { locale: Locale; size: number }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Rojo</strong> debe unir el borde superior con el inferior y <strong>Azul</strong>{' '}
          el izquierdo con el derecho, con una cadena de piedras propias en el rombo de {size}×
          {size}.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Rojo empieza. Por turnos se coloca una piedra en cualquier casilla vacía.</li>
          <li>
            <strong>Regla de intercambio</strong>: tras la primera piedra roja, Azul puede
            «intercambiar» y quedársela (reflejada para que sirva a sus lados) en lugar de jugar.
            Así a Rojo no le conviene abrir demasiado fuerte.
          </li>
          <li>Las piedras nunca se mueven ni se capturan. No existen los empates.</li>
        </ul>
        <h3>Consejo</h3>
        <p>
          Dos piedras con dos casillas vacías comunes forman un <em>puente</em>: si el rival ocupa
          una, juega la otra.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>Toca una casilla para colocar; el botón «Intercambiar» aparece cuando es posible.</li>
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
        <strong>Red</strong> must join the top edge to the bottom edge and <strong>Blue</strong> the
        left edge to the right edge, with a chain of their own stones on the {size}×{size} rhombus.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Red starts. Players take turns placing a stone on any empty cell.</li>
        <li>
          <strong>Swap rule</strong>: after Red&apos;s first stone, Blue may “swap” and take it over
          (mirrored so it serves Blue&apos;s sides) instead of moving — so Red should not open too
          strongly.
        </li>
        <li>Stones never move and are never captured. Draws are impossible.</li>
      </ul>
      <h3>Tip</h3>
      <p>
        Two stones with two shared empty neighbors form a <em>bridge</em>: if your opponent takes
        one, play the other.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Tap a cell to place a stone; the “Swap” button appears when it is allowed.</li>
        <li>
          Arrows, <kbd>Enter</kbd> place · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd>{' '}
          restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
