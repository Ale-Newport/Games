import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Acabar con las orugas que bajan por el huerto antes de que te alcancen.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La oruga avanza de lado y, al topar con una piedra o con el borde, baja una fila y da la
            vuelta. En tu parcela sube y baja.
          </li>
          <li>
            Riega hacia arriba (solo una gota en el aire a la vez). Cada segmento alcanzado se
            vuelve piedra y parte la oruga: 10 puntos, 100 si es la cabeza.
          </li>
          <li>
            Las piedras aguantan tres gotas. El escarabajo zigzaguea por tu parcela y se las come.
          </li>
          <li>
            Si tu parcela se queda sin piedras, caen bellotas que dejan piedras a su paso. Tocar la
            oruga, el escarabajo o una bellota cuesta una vida (tres; una más cada 12 000 puntos).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas para moverte · <kbd>Espacio</kbd> riega · o mantén un dedo en la pantalla para ir
          hacia él regando · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Stop the caterpillars winding down the garden before they reach you.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          A caterpillar crawls sideways; at a stone or the edge it drops a row and turns. In your
          patch it goes up and down.
        </li>
        <li>
          Squirt upwards (one drop in the air at a time). Each segment hit turns into a stone and
          splits the caterpillar: 10 points, 100 for a head.
        </li>
        <li>Stones take three drops. The beetle zigzags through your patch eating them.</li>
        <li>
          When your patch runs out of stones, acorns fall, leaving stones behind. Touching a
          segment, the beetle or an acorn costs a life (three; one more every 12 000 points).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows to move · <kbd>Space</kbd> squirts · or hold a finger on the screen to walk towards
        it squirting · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
