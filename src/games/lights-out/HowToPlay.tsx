import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Apaga todas las luces de la cuadrícula.</p>
        <h3>Pulsaciones</h3>
        <ul>
          <li>
            Pulsar una luz la cambia (encendida ↔ apagada) junto con sus cuatro vecinas de arriba,
            abajo, izquierda y derecha.
          </li>
          <li>En la variante diagonal cambian, en su lugar, las cuatro vecinas en diagonal.</li>
          <li>
            El orden no importa y pulsar dos veces la misma luz la deja igual: cada solución es un
            conjunto de luces.
          </li>
        </ul>
        <p>
          Cada puzle sale de pulsaciones al azar sobre el tablero apagado, así que siempre tiene
          solución; el marcador muestra el mínimo de pulsaciones.
        </p>
        <h3>Truco</h3>
        <p>
          «Persigue» las luces: pulsa debajo de cada luz encendida, fila a fila, hasta que solo
          queden luces en la última fila.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una luz. Flechas mover · <kbd>Espacio</kbd> pulsar · <kbd>U</kbd> deshacer ·{' '}
          <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Switch off every light on the grid.</p>
      <h3>Presses</h3>
      <ul>
        <li>
          Pressing a light switches it (on ↔ off) together with its four neighbours above, below,
          left and right.
        </li>
        <li>In the diagonal variant the four diagonal neighbours switch instead.</li>
        <li>
          Order does not matter and pressing a light twice undoes it: every solution is a set of
          lights.
        </li>
      </ul>
      <p>
        Every puzzle comes from random presses on the dark board, so it can always be solved; the
        counter shows the fewest presses.
      </p>
      <h3>Tip</h3>
      <p>
        “Chase” the lights: press below every lit light, row by row, until only the bottom row has
        lights left.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a light. Arrows move · <kbd>Space</kbd> press · <kbd>U</kbd> undo · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
