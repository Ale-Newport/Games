import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar antes que el ordenador a los puntos de la partida (3, 5 u 11).</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Mueves la pala de la izquierda; el ordenador, la de la derecha.</li>
          <li>
            Si la pelota pasa la pala de tu rival, es tu punto. El saque siguiente va hacia quien
            encajó el punto.
          </li>
          <li>
            Golpear con el centro de la pala devuelve la pelota recta; con los bordes, con ángulo
            (hasta 60°). Cada golpe la acelera un poco.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>↑</kbd>/<kbd>↓</kbd> o <kbd>W</kbd>/<kbd>S</kbd>, los botones táctiles, o arrastra el
          dedo sobre el campo · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Reach the game’s points (3, 5 or 11) before the computer does.</p>
      <h3>How to play</h3>
      <ul>
        <li>You move the left paddle; the computer moves the right one.</li>
        <li>
          A ball past your opponent’s paddle is your point. The next serve goes towards whoever
          conceded.
        </li>
        <li>
          The middle of the paddle sends the ball back straight, the edges at an angle (up to 60°).
          Every hit speeds it up a little.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>↑</kbd>/<kbd>↓</kbd> or <kbd>W</kbd>/<kbd>S</kbd>, the touch buttons, or drag a finger
        on the field · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
