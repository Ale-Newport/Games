import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Pasar entre tantos farallones como puedas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>El frailecillo flota hasta el primer aleteo; después, la gravedad tira de él.</li>
          <li>Cada toque es un aleteo hacia arriba (mantener pulsado no cuenta como varios).</li>
          <li>
            Cada hueco superado vale un punto. Tocar la roca, el mar o el cielo termina el vuelo.
          </li>
          <li>
            A partir de 25 puntos los huecos se estrechan; a partir de 50, los farallones van más
            rápido.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca la pantalla, pulsa <kbd>Espacio</kbd> o <kbd>↑</kbd>, o el botón de aletear ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Fly between as many sea stacks as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>The puffin hovers until the first flap; after that, gravity pulls it down.</li>
        <li>Each tap is one flap upwards (holding the button doesn’t count as more).</li>
        <li>Each gap passed is a point. Touching the rock, the sea or the sky ends the flight.</li>
        <li>From 25 points the gaps narrow; from 50 the stacks come faster.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap the screen, press <kbd>Space</kbd> or <kbd>↑</kbd>, or the flap button · <kbd>P</kbd>{' '}
        pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
