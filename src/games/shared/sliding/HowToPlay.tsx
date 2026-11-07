import type { Locale } from '../../../core/i18n';

/** Rules for an n×n sliding puzzle. */
export function SlidingRules({ locale, size }: { locale: Locale; size: number }) {
  const last = size * size - 1;
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ordena las fichas del 1 al {last} de izquierda a derecha y de arriba abajo, con el hueco
          en la esquina inferior derecha.
        </p>
        <h3>Movimientos</h3>
        <ul>
          <li>Solo se mueven fichas hacia el hueco.</li>
          <li>
            Toca una ficha de la misma fila o columna que el hueco para deslizarla junto con las que
            haya entre ella y el hueco.
          </li>
          <li>
            Cada ficha deslizada cuenta como un movimiento; el marcador muestra el mínimo posible
            cuando el solucionador lo conoce.
          </li>
        </ul>
        <p>
          Las mezclas se generan con movimientos válidos o con una permutación resoluble, así que
          todas tienen solución. En «Imagen» las fichas forman un dibujo.
        </p>
        <h3>Controles</h3>
        <p>
          Toca las fichas o usa las flechas (deslizan hacia el hueco) · <kbd>U</kbd> deshacer ·{' '}
          <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Put the tiles in order from 1 to {last}, left to right and top to bottom, with the gap in
        the bottom-right corner.
      </p>
      <h3>Moves</h3>
      <ul>
        <li>Only tiles next to the gap can move into it.</li>
        <li>
          Tap a tile in the gap’s row or column to slide it together with the tiles between it and
          the gap.
        </li>
        <li>
          Every tile slid is one move; the counter shows the best possible when the solver knows it.
        </li>
      </ul>
      <p>
        Scrambles come from legal moves or a solvable permutation, so every puzzle can be solved.
        With “Picture” the tiles form a drawing.
      </p>
      <h3>Controls</h3>
      <p>
        Tap tiles or use the arrows (they slide toward the gap) · <kbd>U</kbd> undo · <kbd>H</kbd>{' '}
        hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
