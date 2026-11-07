import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Dibuja un único <strong>lazo cerrado</strong> uniendo puntos vecinos por las líneas
          punteadas. El lazo no se cruza ni se toca a sí mismo. Cada <strong>número</strong> indica
          cuántos de los cuatro lados de su casilla forman parte del lazo; las casillas sin número
          pueden tener cualquier cantidad.
        </p>
        <p>Cada slitherlink tiene una única solución.</p>
        <h3>Trucos</h3>
        <ul>
          <li>Un 0 no tiene ningún lado en el lazo: tacha los cuatro.</li>
          <li>En cada punto entran 0 o 2 líneas: si ya hay dos, el resto se tacha.</li>
          <li>
            Si a un punto llega una línea y solo le queda una salida, la línea sigue por ella.
          </li>
          <li>Nunca cierres un lazo pequeño si quedan otras líneas fuera de él.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca entre dos puntos para trazar, otra vez para tachar (✕) y otra para borrar, o elige
          «Línea» / «Tachar». Arrastra de punto a punto para trazar varias líneas seguidas (si
          empiezas sobre una línea, la borras). <kbd>U</kbd> deshacer · <kbd>R</kbd> rehacer ·{' '}
          <kbd>H</kbd> pista · <kbd>Intro</kbd> aplicar la pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Draw a single <strong>closed loop</strong> joining neighbouring dots along the dotted lines.
        The loop never crosses or touches itself. Each <strong>number</strong> tells how many of its
        cell&rsquo;s four sides belong to the loop; cells without a number may have any count.
      </p>
      <p>Every puzzle has exactly one solution.</p>
      <h3>Tips</h3>
      <ul>
        <li>A 0 has no side on the loop: cross all four.</li>
        <li>Every dot has 0 or 2 lines: once it has two, cross the rest.</li>
        <li>When a line reaches a dot with only one way out, it continues that way.</li>
        <li>Never close a small loop while other lines remain outside it.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap between two dots to draw, again to cross (✕), again to clear — or pick
        &ldquo;Line&rdquo; / &ldquo;Cross&rdquo;. Drag from dot to dot to draw several lines at once
        (starting on a drawn line erases). <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint
        · <kbd>Enter</kbd> apply the hint · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
