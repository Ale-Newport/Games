import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Dar tres vueltas al circuito antes que los tres pilotos del ordenador.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>La carrera empieza al apagarse las tres luces rojas.</li>
          <li>
            Acelera y frena (si sigues frenando parado, das marcha atrás). El coche gira más cuanto
            más rápido va.
          </li>
          <li>Fuera del asfalto, la hierba te frena mucho: frena antes de las curvas cerradas.</li>
          <li>Los coches que se tocan rebotan y pierden velocidad.</li>
          <li>
            Tu puesto se ve arriba; la carrera acaba al cruzar tú la meta en la tercera vuelta.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>↑</kbd> acelera · <kbd>↓</kbd> frena · <kbd>←</kbd>/<kbd>→</kbd> giran · o señala con
          el dedo hacia dónde ir (el coche acelera solo) · <kbd>P</kbd> pausa · <kbd>R</kbd>{' '}
          reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Complete three laps of the circuit before the three computer drivers.</p>
      <h3>How to play</h3>
      <ul>
        <li>The race starts when the three red lights go out.</li>
        <li>
          Accelerate and brake (keep braking at a standstill to reverse). The car steers more
          sharply the faster it goes.
        </li>
        <li>Off the tarmac, the grass slows you right down: brake before the tight bends.</li>
        <li>Cars that touch bump apart and lose speed.</li>
        <li>
          Your place shows at the top; the race ends when you cross the line on your third lap.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>↑</kbd> throttle · <kbd>↓</kbd> brake · <kbd>←</kbd>/<kbd>→</kbd> steer · or point a
        finger where to go (the car accelerates by itself) · <kbd>P</kbd> pause · <kbd>R</kbd>{' '}
        restart.
      </p>
    </>
  );
}
