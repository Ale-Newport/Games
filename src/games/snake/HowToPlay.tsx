import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Crecer todo lo posible comiendo manzanas sin chocar.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La serpiente avanza sola; tú decides hacia dónde gira (nunca puede dar media vuelta en
            el sitio).
          </li>
          <li>
            Cada manzana la alarga una casilla y suma 10 puntos (más a medida que comes); cada
            cuatro manzanas va más rápida.
          </li>
          <li>Chocar con una pared o con tu propio cuerpo termina la partida.</li>
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
      <p>Grow as long as you can by eating apples without crashing.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The snake moves on its own; you choose where it turns (it can never turn straight back).
        </li>
        <li>
          Each apple adds a cell and 10 points (more as you go on); every four apples it gets
          faster.
        </li>
        <li>Running into a wall or your own body ends the run.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows, <kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or the touch pad · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
