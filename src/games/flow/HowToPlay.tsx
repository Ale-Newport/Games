import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Une cada pareja de puntos del mismo color (y la misma letra) con un camino.</p>
        <h3>Reglas</h3>
        <ul>
          <li>Los caminos van de casilla en casilla en horizontal o vertical.</li>
          <li>Dos caminos nunca se cruzan ni comparten casilla.</li>
          <li>Al final, los caminos deben ocupar todas las casillas de la cuadrícula.</li>
        </ul>
        <p>
          Cada puzle se genera a partir de un camino que recorre toda la cuadrícula, cortado en
          tramos de colores, así que siempre tiene solución; cualquier forma de llenarla que una
          todas las parejas vale.
        </p>
        <h3>Controles</h3>
        <p>
          Arrastra desde un punto (o desde el final de un camino) hasta su gemelo. Vuelve sobre un
          camino para acortarlo; cruzar otro camino lo corta. La pista revela un camino completo.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Join every pair of dots of the same color (and letter) with a path.</p>
      <h3>Rules</h3>
      <ul>
        <li>Paths run from cell to cell, across or down.</li>
        <li>Two paths never cross or share a cell.</li>
        <li>In the end, the paths must cover every cell of the grid.</li>
      </ul>
      <p>
        Every puzzle is made from one path through the whole grid, cut into colored stretches, so it
        can always be solved; any filling that joins every pair counts.
      </p>
      <h3>Controls</h3>
      <p>
        Drag from a dot (or from the end of a path) to its twin. Go back over a path to shorten it;
        crossing another path cuts it. A hint reveals one whole path.
      </p>
    </>
  );
}
