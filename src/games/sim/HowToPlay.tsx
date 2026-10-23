import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>No completar un triángulo de tu color</strong>: obliga al rival a cerrar uno del
          suyo.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Seis puntos (A–F) y las 15 líneas que los unen. El primer turno se alterna por ronda.
          </li>
          <li>En tu turno colorea una línea libre de tu color.</li>
          <li>
            Si tres puntos quedan unidos por líneas de tu color, has cerrado un triángulo y pierdes.
            Solo cuentan los triángulos con vértices en los seis puntos.
          </li>
          <li>
            Con seis puntos siempre aparece un triángulo de un color (teorema de Ramsey), así que no
            hay tablas. Con juego perfecto gana quien mueve segundo.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una línea para colorearla. Al pasar por encima, se marca en rojo si te haría
            perder.
          </li>
          <li>
            Flechas para elegir línea, <kbd>Intro</kbd> colorear · <kbd>U</kbd> deshacer ·{' '}
            <kbd>H</kbd> pista · <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        <strong>Do not complete a triangle in your color</strong>: force your opponent to close one
        of theirs.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Six points (A–F) and the 15 lines joining them. The first turn alternates by round.</li>
        <li>On your turn color one free line in your color.</li>
        <li>
          If three of the points end up joined by lines of your color, you closed a triangle and
          lose. Only triangles with corners on the six points count.
        </li>
        <li>
          With six points a one-colored triangle always appears (Ramsey’s theorem), so there are no
          draws. With perfect play the second player wins.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a line to color it. On hover it turns red if it would make you lose.</li>
        <li>
          Arrows pick a line, <kbd>Enter</kbd> colors it · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
