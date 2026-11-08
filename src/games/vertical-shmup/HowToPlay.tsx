import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Abrirte paso por las oleadas y derribar al jefe de cada fase.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Tu caza dispara solo; tú lo mueves por la parte baja de la pantalla.</li>
          <li>
            Solo el núcleo azul de la nave puede ser alcanzado: puedes rozar las balas con las alas.
          </li>
          <li>
            Los transportes amarillos sueltan mejoras: <strong>P</strong> amplía el abanico de
            disparo (hasta cinco) y <strong>B</strong> da una bomba.
          </li>
          <li>Una bomba borra las balas enemigas y daña a todos los enemigos de la pantalla.</li>
          <li>
            Tras un minuto de oleadas llega el jefe; al derribarlo empieza la fase siguiente, más
            dura. Tres vidas; una más cada 50 000 puntos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Arrastra el dedo por la pantalla (la nave va un poco por encima) · o flechas ·{' '}
          <kbd>X</kbd> o <kbd>Mayús</kbd> bomba · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Fight through the waves and bring down each stage’s boss.</p>
      <h3>How to play</h3>
      <ul>
        <li>Your fighter fires on its own; you fly it around the lower part of the screen.</li>
        <li>Only the ship’s blue core can be hit: bullets can graze the wings.</li>
        <li>
          Yellow carriers drop pickups: <strong>P</strong> widens your spread (up to five shots) and{' '}
          <strong>B</strong> gives a bomb.
        </li>
        <li>A bomb wipes out the enemy bullets and damages every enemy on screen.</li>
        <li>
          After a minute of waves the boss arrives; bringing it down starts the next, harder stage.
          Three lives; one more every 50 000 points.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Drag on the screen (the ship flies a little above your finger) · or arrows · <kbd>X</kbd> or{' '}
        <kbd>Shift</kbd> bomb · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
