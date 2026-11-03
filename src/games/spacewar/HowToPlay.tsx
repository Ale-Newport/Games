import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Destruir la nave rival cinco veces antes de que ella te destruya a ti.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La estrella del centro atrae a las dos naves, más cuanto más cerca. La pantalla da la
            vuelta por los bordes.
          </li>
          <li>
            Gira y enciende el motor para mantener una órbita; nada te frena salvo el propio motor.
          </li>
          <li>Lanza torpedos (hasta cuatro a la vez): vuelan recto dos segundos.</li>
          <li>
            El hiperespacio te hace desaparecer y reaparecer en otro sitio, pero uno de cada cuatro
            saltos sale mal. Tres saltos por ronda.
          </li>
          <li>Caer en la estrella, un torpedo o chocar con el rival te cuestan la ronda.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> giran · <kbd>↑</kbd> motor · <kbd>Espacio</kbd> torpedo ·{' '}
          <kbd>↓</kbd> o <kbd>X</kbd> hiperespacio · o el panel táctil · <kbd>P</kbd> pausa ·{' '}
          <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Destroy the rival ship five times before it destroys you.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The star in the middle pulls both ships, harder the closer they are. The screen wraps at
          the edges.
        </li>
        <li>Turn and burn to hold an orbit; nothing slows you down but your own engine.</li>
        <li>Fire torpedoes (up to four at a time): they fly straight for two seconds.</li>
        <li>
          Hyperspace makes you vanish and reappear elsewhere, but one jump in four goes wrong. Three
          jumps a round.
        </li>
        <li>Falling into the star, a torpedo or ramming the rival loses you the round.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> turn · <kbd>↑</kbd> engine · <kbd>Space</kbd> torpedo ·{' '}
        <kbd>↓</kbd> or <kbd>X</kbd> hyperspace · or the touch pad · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
