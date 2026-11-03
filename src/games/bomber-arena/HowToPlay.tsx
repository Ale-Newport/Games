import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el último robot en pie. Quien gane dos rondas se lleva la partida.</p>
        <h3>Cómo se juega</h3>
        <ul>
          <li>Eres el robot blanco; los otros tres los maneja el ordenador.</li>
          <li>
            Pon una bomba: estalla a los 2,5 segundos en una cruz de llamas que paran los pilares y
            la primera caja que quema. Otras bombas en su camino estallan también.
          </li>
          <li>
            Las cajas pueden esconder una bomba extra, una llama más larga o más velocidad: pásate
            por encima para cogerlas.
          </li>
          <li>
            Las llamas eliminan a cualquiera, tú incluido. En los últimos 40 segundos la arena se
            cierra en espiral.
          </li>
          <li>
            10 puntos por caja, 200 por rival atrapado, 50 por mejora y 1000 por ronda ganada.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Flechas para moverte · <kbd>Espacio</kbd> pone una bomba · o el panel táctil ·{' '}
          <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the last blaster standing. The first to two rounds takes the match.</p>
      <h3>How to play</h3>
      <ul>
        <li>You are the white blaster; the other three are computer players.</li>
        <li>
          Drop a bomb: it bursts after 2.5 seconds into a cross of flame stopped by pillars and by
          the first crate it burns. Other bombs in its way go off too.
        </li>
        <li>
          Crates may hide an extra bomb, a longer flame or more speed: walk over them to pick them
          up.
        </li>
        <li>
          Flames knock anyone out, you included. In the last 40 seconds the arena closes in a
          spiral.
        </li>
        <li>10 points per crate, 200 per rival caught, 50 per power-up and 1000 per round won.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Arrows to move · <kbd>Space</kbd> drops a bomb · or the touch pad · <kbd>P</kbd> pause ·{' '}
        <kbd>R</kbd> restart.
      </p>
    </>
  );
}
