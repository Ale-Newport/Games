import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Derribar a los jinetes rivales oleada tras oleada sin caer en la lava.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Cada aleteo te eleva; la gravedad tira de ti. Te desplazas con inercia y los lados de la
            pantalla se unen.
          </li>
          <li>
            Al chocar con un rival gana la lanza más alta: si estás por encima, lo derribas (500,
            750 o 1500 según su rango); si estás debajo, te derriba a ti; a la par, rebotáis.
          </li>
          <li>
            Cada rival derribado deja un huevo: cógelo (250, 500, 750…) antes de que salga un jinete
            más fiero.
          </li>
          <li>
            La lava del fondo es fatal. Despejar una oleada da 3000 puntos. Tres vidas; una más cada
            20 000 puntos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>Espacio</kbd> o <kbd>↑</kbd> aletea · <kbd>←</kbd>/<kbd>→</kbd> dirigen · o toca
          junto a tu jinete, en el lado al que quieras ir · <kbd>P</kbd> pausa · <kbd>R</kbd>{' '}
          reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Unhorse the rival riders wave after wave without falling into the lava.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Each flap lifts you; gravity pulls you down. You drift with momentum, and the screen’s
          sides join up.
        </li>
        <li>
          When you meet a rival, the higher lance wins: above it, you unhorse it (500, 750 or 1500
          by rank); below, it unhorses you; level, you bounce apart.
        </li>
        <li>
          Each rival unhorsed leaves an egg: grab it (250, 500, 750…) before a fiercer rider
          hatches.
        </li>
        <li>
          The lava at the bottom is fatal. Clearing a wave pays 3000. Three lives; one more every 20
          000.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>Space</kbd> or <kbd>↑</kbd> flaps · <kbd>←</kbd>/<kbd>→</kbd> steer · or tap beside
        your rider on the side you want to go · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
