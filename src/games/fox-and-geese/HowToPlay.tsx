import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          <strong>Gansos</strong>: dejar al zorro sin jugadas. <strong>Zorro</strong>: capturar 8
          gansos.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero en cruz de 33 puntos, solo con líneas horizontales y verticales. 13 gansos
            arriba y el zorro en el centro. Empiezan los gansos.
          </li>
          <li>
            Los gansos avanzan un paso hacia abajo o hacia los lados, nunca hacia atrás, y no
            capturan.
          </li>
          <li>
            El zorro se mueve un paso en cualquier dirección o salta sobre un ganso vecino a un
            punto vacío justo detrás, capturándolo. Puede encadenar saltos o parar cuando quiera.
          </li>
          <li>
            Si los gansos se repiten (triple repetición) o se agotan las 250 jugadas sin atrapar al
            zorro, el zorro escapa y gana.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una pieza y luego un punto marcado en amarillo. Durante una cadena de saltos, pulsa
            «Terminar los saltos» para parar.
          </li>
          <li>
            Flechas, <kbd>Intro</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>R</kbd> reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        <strong>Geese</strong>: leave the fox without a move. <strong>Fox</strong>: capture 8 geese.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 33-point cross with horizontal and vertical lines only. 13 geese at the top, the fox in
          the center. The geese move first.
        </li>
        <li>Geese step down or sideways, never back up, and never capture.</li>
        <li>
          The fox steps one point in any direction, or jumps over an adjacent goose to the empty
          point just beyond it, capturing it. He may chain jumps or stop whenever he likes.
        </li>
        <li>
          If the geese repeat a position three times or 250 plies pass without trapping the fox, he
          escapes and wins.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a piece, then a point marked in yellow. During a jump chain, press “End the jumps” to
          stop.
        </li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
