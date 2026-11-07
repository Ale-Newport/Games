import type { Locale } from '../../../core/i18n';

/** Rules for an N×N twisty cube; `solver` describes how hints are found. */
export function CubeRules({
  locale,
  size,
  solver,
}: {
  locale: Locale;
  size: number;
  solver: 'optimal' | 'twophase' | 'undo';
}) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Gira las caras del cubo de {size}×{size} hasta que cada cara sea de un solo color.
        </p>
        <h3>Giros</h3>
        <ul>
          <li>
            U (arriba), D (abajo), L (izquierda), R (derecha), F (frente) y B (detrás) giran esa
            cara un cuarto de vuelta en sentido horario, mirándola de frente; con ' (prima) en
            sentido antihorario.
          </li>
          {size >= 4 && (
            <li>Los giros dobles (Uw, Rw…) mueven las dos capas exteriores a la vez.</li>
          )}
          <li>Arrastra el cubo para mirarlo desde otro lado; no cambia nada.</li>
        </ul>
        <h3>Pistas</h3>
        <p>
          {solver === 'optimal'
            ? 'La pista sale de un solucionador que conoce el mínimo de giros desde cualquier posición.'
            : solver === 'twophase'
              ? 'La pista sale de un solucionador en dos fases que encuentra soluciones de unos 22 giros.'
              : 'La pista deshace la mezcla y tus giros (simplificados): siempre lleva a la solución, aunque no por el camino más corto.'}
        </p>
        <h3>Controles</h3>
        <p>
          Botones o teclas <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd>{' '}
          <kbd>B</kbd> (con <kbd>Mayús</kbd>, al revés){size >= 4 ? ', W giros dobles' : ''} ·{' '}
          <kbd>Z</kbd> deshacer · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Turn the faces of the {size}×{size} cube until every face shows a single color.
      </p>
      <h3>Turns</h3>
      <ul>
        <li>
          U (up), D (down), L (left), R (right), F (front) and B (back) turn that face a quarter
          turn clockwise as you look at it; with ' (prime), counter-clockwise.
        </li>
        {size >= 4 && <li>Wide turns (Uw, Rw…) move the two outer layers together.</li>}
        <li>Drag the cube to look at it from another side; that changes nothing.</li>
      </ul>
      <h3>Hints</h3>
      <p>
        {solver === 'optimal'
          ? 'Hints come from a solver that knows the fewest turns from any position.'
          : solver === 'twophase'
            ? 'Hints come from a two-phase solver that finds solutions of about 22 turns.'
            : 'Hints undo the scramble and your turns (simplified): they always lead to solved, though not by the shortest way.'}
      </p>
      <h3>Controls</h3>
      <p>
        Buttons or keys <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd>{' '}
        <kbd>B</kbd> (with <kbd>Shift</kbd>, the other way){size >= 4 ? ', W wide turns' : ''} ·{' '}
        <kbd>Z</kbd> undo · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
