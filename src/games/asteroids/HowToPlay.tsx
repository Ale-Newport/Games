import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Limpiar campo tras campo de rocas y sumar todos los puntos que puedas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La nave gira y acelera; conserva la inercia y frena poco a poco. Todo lo que sale por un
            borde entra por el opuesto.
          </li>
          <li>
            Hasta cuatro disparos a la vez, que se apagan al segundo. Las rocas grandes (20) se
            parten en medianas (50) y estas en pequeñas (100).
          </li>
          <li>
            Los platillos (200) cruzan disparándote. El hiperespacio te lleva a un punto al azar… a
            veces peor.
          </li>
          <li>
            Tres naves y una más cada 10 000 puntos. Cada campo nuevo trae una roca grande más.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> girar · <kbd>↑</kbd> acelerar · <kbd>Espacio</kbd> disparar ·{' '}
          <kbd>Mayús</kbd> o <kbd>X</kbd> hiperespacio · botones táctiles · <kbd>P</kbd> pausa ·{' '}
          <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Clear field after field of rocks and score as much as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The ship turns and thrusts; it keeps its momentum and slows only a little. Whatever leaves
          one edge comes back from the other.
        </li>
        <li>
          Up to four shots at a time, fading after a second. Large rocks (20) split into medium
          (50), medium into small (100).
        </li>
        <li>
          Saucers (200) cross shooting at you. Hyperspace jumps you to a random spot — sometimes a
          worse one.
        </li>
        <li>
          Three ships and one more every 10 000 points. Each new field brings one more large rock.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> turn · <kbd>↑</kbd> thrust · <kbd>Space</kbd> fire ·{' '}
        <kbd>Shift</kbd> or <kbd>X</kbd> hyperspace · touch buttons · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
