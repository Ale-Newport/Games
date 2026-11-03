import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Correr lo más lejos posible por los tejados y coger monedas por el camino.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>La mensajera corre sola, cada vez más deprisa. Tú solo saltas y te deslizas.</li>
          <li>Salta los huecos entre edificios, los tejados más altos y las chimeneas.</li>
          <li>Deslízate bajo los drones de reparto (o sáltalos con un salto largo).</li>
          <li>
            Mantén el salto pulsado para llegar más alto; deslizarte en el aire te hace caer más
            rápido.
          </li>
          <li>
            Cada 20 px son un metro y cada moneda vale 10 puntos. Caer o chocar acaba la carrera.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>Espacio</kbd> o <kbd>↑</kbd> saltan · <kbd>↓</kbd> desliza · en el móvil, toca arriba
          en la pantalla para saltar y abajo para deslizarte · <kbd>P</kbd> pausa · <kbd>R</kbd>{' '}
          reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Run as far as you can across the rooftops, picking up coins on the way.</p>
      <h3>How to play</h3>
      <ul>
        <li>The courier runs on her own, faster and faster. You only jump and slide.</li>
        <li>Jump the gaps between buildings, the higher roofs and the chimneys.</li>
        <li>Slide under the delivery drones (or clear them with a long jump).</li>
        <li>Hold the jump to go higher; sliding in mid-air drops you faster.</li>
        <li>
          Every 20 px is a metre and every coin is 10 points. Falling or crashing ends the run.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>Space</kbd> or <kbd>↑</kbd> jump · <kbd>↓</kbd> slide · on a phone, touch high on the
        screen to jump and low to slide · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
