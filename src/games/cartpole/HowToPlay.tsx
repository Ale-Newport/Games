import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Mantener el palo de pie sobre el carro el mayor tiempo posible.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            Empuja el carro a izquierda o derecha. Para enderezar un palo que se inclina a un lado,
            empuja hacia ese mismo lado.
          </li>
          <li>
            Se acaba si el palo pasa de 24° (la zona sombreada) o si el carro choca con un tope rojo
            del raíl.
          </li>
          <li>
            Los primeros 20 segundos son de calma; después llegan ráfagas de viento cada pocos
            segundos, cada vez más fuertes.
          </li>
          <li>El palo largo cae despacio; el corto, más rápido.</li>
          <li>La puntuación son las décimas de segundo que aguantas.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> (o el panel) empujan · o toca la mitad izquierda o derecha de la
          pantalla · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Keep the pole standing on the cart for as long as you can.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          Push the cart left or right. To straighten a pole leaning one way, push that same way.
        </li>
        <li>
          It is over if the pole leans past 24° (the shaded fan) or the cart hits a red stop at the
          end of the rail.
        </li>
        <li>
          The first 20 seconds are calm; then gusts of wind come every few seconds, harder and
          harder.
        </li>
        <li>The long pole falls slowly; the short one faster.</li>
        <li>The score is the tenths of a second you last.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> (or the pad) push · or touch the left or right half of the screen
        · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
