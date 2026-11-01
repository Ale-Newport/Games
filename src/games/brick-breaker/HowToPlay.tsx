import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Limpiar los cinco muros con tres vidas.</p>
        <h3>Ladrillos</h3>
        <ul>
          <li>
            Azules: un golpe. Violetas: dos. Granates: tres (el número indica los golpes que
            faltan).
          </li>
          <li>Los bloques de oro no se rompen y no hace falta romperlos para limpiar el muro.</li>
        </ul>
        <h3>Cápsulas</h3>
        <p>
          A veces un ladrillo roto suelta una cápsula; atrápala con la pala: <strong>W</strong> pala
          ancha, <strong>M</strong> tres pelotas, <strong>S</strong> pelotas lentas,{' '}
          <strong>L</strong> láser (dispara con Espacio), <strong>+</strong> vida extra.
        </p>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd>, los botones táctiles o el dedo · <kbd>Espacio</kbd> lanza y
          dispara · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Clear all five walls with three lives.</p>
      <h3>Bricks</h3>
      <ul>
        <li>Blue: one hit. Violet: two. Plum: three (the number shows the hits left).</li>
        <li>Gold blocks never break, and a wall is clear without them.</li>
      </ul>
      <h3>Capsules</h3>
      <p>
        A broken brick sometimes drops a capsule; catch it with the paddle: <strong>W</strong> wide
        paddle, <strong>M</strong> three balls, <strong>S</strong> slow balls, <strong>L</strong>{' '}
        laser (fire with Space), <strong>+</strong> an extra life.
      </p>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd>, the touch buttons or a finger · <kbd>Space</kbd> launches and
        fires · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
