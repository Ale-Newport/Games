import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Ser quien <strong>trace la última curva</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Cada ronda empieza con 3 a 5 puntos; el primer turno se alterna.</li>
          <li>
            Traza una curva que una dos puntos, o un punto consigo mismo (un bucle). La curva no
            puede cruzar ni tocar otras curvas ni pasar por un punto.
          </li>
          <li>Sobre cada curva nueva aparece un punto nuevo.</li>
          <li>
            Ningún punto puede tener más de tres extremos de curva: los puntos iniciales tienen tres
            vidas y los nuevos, una (los puntitos verdes).
          </li>
          <li>Pierde quien no puede trazar ninguna curva. No hay tablas.</li>
          <li>
            Aquí se dibuja sobre una rejilla fina: las curvas dejan una celda libre alrededor de los
            puntos vivos, y un punto nuevo encajonado entre curvas por ambos lados ya no se puede
            usar.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Arrastra desde un punto hasta otro; vuelve sobre tu trazo para borrarlo.</li>
          <li>O toca un punto y luego otro (el mismo para un bucle): la curva se traza sola.</li>
          <li>
            <kbd>Tab</kbd> e <kbd>Intro</kbd> eligen puntos · <kbd>U</kbd> deshacer · <kbd>H</kbd>{' '}
            pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the one who <strong>draws the last curve</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Each round starts with 3 to 5 spots; the first turn alternates.</li>
        <li>
          Draw a curve joining two spots, or a spot to itself (a loop). It may not cross or touch
          other curves or pass through a spot.
        </li>
        <li>A new spot appears on every new curve.</li>
        <li>
          No spot may have more than three curve ends: starting spots have three lives and new spots
          one (the small green dots).
        </li>
        <li>Whoever cannot draw a curve loses. There are no draws.</li>
        <li>
          Here curves live on a fine grid: they keep one cell clear around living spots, and a new
          spot boxed in by curves on both sides cannot be used again.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Drag from a spot to another spot; go back over your line to rub it out.</li>
        <li>Or tap a spot, then another (the same one for a loop): the curve is drawn for you.</li>
        <li>
          <kbd>Tab</kbd> and <kbd>Enter</kbd> pick spots · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
