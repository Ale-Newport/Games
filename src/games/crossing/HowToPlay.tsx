import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar al erizo a las cinco madrigueras del seto, al otro lado de la carretera y del río.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Cada pulsación es un salto de una casilla; mantener pulsado repite.</li>
          <li>En la carretera, que no te pille ningún coche ni camión.</li>
          <li>
            En el río solo puedes pisar troncos y tortugas, que te llevan con ellos; el agua y salir
            por un borde te cuestan una vida. Algunas tortugas se sumergen: parpadean antes.
          </li>
          <li>
            Entra en una madriguera libre (el seto y las ocupadas no valen). Tienes 30 segundos por
            cruce.
          </li>
          <li>
            10 puntos por cada fila nueva, 50 y el tiempo que sobre por madriguera, 200 por el
            escarabajo, 1000 por llenar las cinco, y el siguiente nivel va más rápido. Tres vidas;
            una más a los 5000 puntos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> o el panel táctil ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Get the hedgehog into the five burrows in the hedge, across the road and the river.</p>
      <h3>How to play</h3>
      <ul>
        <li>Each press is a one-cell hop; holding repeats.</li>
        <li>On the road, don’t get caught by a car or a lorry.</li>
        <li>
          In the river you can only stand on logs and turtles, which carry you along; the water and
          being carried off an edge cost a life. Some turtles dive: they flash first.
        </li>
        <li>
          Hop into a free burrow (the hedge and filled burrows don’t count). You have 30 seconds per
          crossing.
        </li>
        <li>
          10 points per new row, 50 plus the time left per burrow, 200 for the beetle, 1000 for
          filling all five — and the next level is faster. Three lives; one more at 5000 points.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or the touch pad · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
