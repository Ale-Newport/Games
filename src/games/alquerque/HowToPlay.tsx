import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Capturar <strong>todas las piezas rivales</strong> o dejar al rival sin jugadas.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Tablero de 5×5 puntos con líneas (diagonales en puntos alternos). 12 piezas por bando;
            solo el centro está vacío. Empiezan las blancas, desde abajo.
          </li>
          <li>
            Sin capturar, una pieza avanza o se mueve de lado un punto a lo largo de una línea;
            nunca retrocede.
          </li>
          <li>
            Captura: salta en línea sobre una pieza rival vecina al punto vacío de detrás (en
            cualquier dirección, también hacia atrás) y retírala.
          </li>
          <li>
            Capturar es obligatorio, y si la pieza que saltó puede volver a capturar, debe seguir.
          </li>
          <li>
            Pierde quien se queda sin piezas o sin jugadas. Triple repetición o 200 jugadas sin
            capturas: tablas.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una pieza y un destino marcado. En una cadena, sigue tocando destinos.</li>
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
        Capture <strong>every enemy piece</strong>, or leave your opponent without a move.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          A 5×5 board of points with lines (diagonals through every other point). 12 pieces each;
          only the center is empty. White starts, from the bottom.
        </li>
        <li>
          Without capturing, a piece steps one point forward or sideways along a line; it never
          retreats.
        </li>
        <li>
          Capture: jump in a line over an adjacent enemy piece into the empty point beyond (any
          direction, backward included) and remove it.
        </li>
        <li>Capturing is compulsory, and if the jumping piece can capture again it must go on.</li>
        <li>
          A side with no pieces or no move loses. Threefold repetition or 200 plies without a
          capture is a draw.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a piece and a marked destination. During a chain, keep tapping destinations.</li>
        <li>
          Arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint ·{' '}
          <kbd>R</kbd> restart · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
