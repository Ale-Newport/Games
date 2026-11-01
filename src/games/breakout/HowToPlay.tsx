import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Romper todos los ladrillos del muro, dos veces, con tres pelotas.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>
            La pelota rebota en las paredes, en los ladrillos (rompiéndolos) y en tu pala. El borde
            de la pala la desvía hasta 60°.
          </li>
          <li>
            Las filas valen 1, 3, 5 y 7 puntos de abajo arriba; al llegar a las filas altas la
            pelota se acelera.
          </li>
          <li>La primera vez que una pelota toca el techo, tu pala se reduce a la mitad.</li>
          <li>
            Si se te escapa la pelota, pierdes una; la siguiente espera en la pala hasta que la
            lanzas (o sale sola a los dos segundos).
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>←</kbd>/<kbd>→</kbd> o <kbd>A</kbd>/<kbd>D</kbd>, los botones táctiles o el dedo
          sobre el campo · <kbd>Espacio</kbd> lanza · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Break every brick of the wall — twice — with three balls.</p>
      <h3>How to play</h3>
      <ul>
        <li>
          The ball bounces off the walls, off bricks (breaking them) and off your paddle. The
          paddle’s edge turns it up to 60°.
        </li>
        <li>
          Rows score 1, 3, 5 and 7 points from the bottom up; reaching the upper rows makes the ball
          faster.
        </li>
        <li>The first time a ball reaches the top wall, your paddle shrinks to half its width.</li>
        <li>
          Miss the ball and it is gone; the next one waits on the paddle until you launch it (or
          leaves by itself after two seconds).
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>←</kbd>/<kbd>→</kbd> or <kbd>A</kbd>/<kbd>D</kbd>, the touch buttons, or a finger on
        the field · <kbd>Space</kbd> launches · <kbd>P</kbd> pause · <kbd>R</kbd> restart.
      </p>
    </>
  );
}
