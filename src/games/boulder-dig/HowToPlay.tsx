import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Reunir gemas suficientes para abrir la salida de cada cueva y salir antes de que acabe el
          tiempo.
        </p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Excava la tierra a tu paso. Las rocas se empujan de lado si detrás hay hueco.</li>
          <li>
            Las rocas y las gemas caen si no hay nada debajo y ruedan sobre otras rocas, gemas y
            muros. Una que cae sobre ti es fatal; una que ya descansa encima, no.
          </li>
          <li>
            Las chispas y las polillas recorren los huecos pegadas a las paredes: no te acerques.
            Una roca que les cae encima las hace estallar; las polillas dejan gemas.
          </li>
          <li>
            Al llegar a las gemas necesarias se abre la salida; los segundos que sobren son puntos.
            Si pierdes una vida, la cueva vuelve a empezar igual. Tres vidas; 150 segundos por
            cueva.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas o el panel táctil · o mantén un dedo hacia donde quieras ir · <kbd>P</kbd> pausa ·{' '}
          <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Collect enough gems to open each cave’s exit, and get out before the time runs out.</p>
      <h3>How to play</h3>
      <ul>
        <li>You dig through earth as you go. Boulders can be pushed sideways into empty space.</li>
        <li>
          Boulders and gems fall when nothing is under them, and roll off other boulders, gems and
          walls. One falling on you is fatal; one already resting on top of you is not.
        </li>
        <li>
          Sparks and moths roam the open pockets along the walls — keep your distance. A boulder
          dropped on one makes it burst; moths leave gems.
        </li>
        <li>
          Once you have the gems needed the exit opens; the seconds left are points. Losing a life
          starts the same cave again. Three lives; 150 seconds a cave.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows or the touch pad · or hold a finger towards where to go · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
