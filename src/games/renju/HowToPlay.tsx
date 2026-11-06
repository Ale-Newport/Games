import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Forma una línea de cinco piedras. <strong>Negras</strong> necesitan{' '}
          <strong>exactamente cinco</strong>; <strong>blancas</strong> ganan con cinco o más.
        </p>
        <h3>Reglas (RIF)</h3>
        <ul>
          <li>Tablero de 15×15. Negras juegan primero y su primera piedra va en el centro (H8).</li>
          <li>
            Negras no pueden jugar en un punto <strong>prohibido</strong>:
            <ul>
              <li>
                <strong>3-3</strong>: crear dos treses a la vez (un tres es una línea que con una
                piedra más se convierte en un cuatro abierto).
              </li>
              <li>
                <strong>4-4</strong>: crear dos cuatros a la vez (también dos cuatros en la misma
                línea).
              </li>
              <li>
                <strong>Línea larga</strong>: seis o más piedras seguidas.
              </li>
            </ul>
          </li>
          <li>
            Hacer exactamente cinco siempre está permitido y gana, aunque forme a la vez una figura
            prohibida.
          </li>
          <li>Blancas no tienen restricciones. Si el tablero se llena sin ganador, es empate.</li>
        </ul>
        <p>Los puntos prohibidos para negras se marcan con una ✕ roja cuando les toca jugar.</p>
        <p>
          <em>Apertura:</em> se aplica la regla RIF de la primera piedra en el centro; no se usa el
          protocolo de torneo de intercambio y doble quinta jugada.
        </p>
        <h3>Controles</h3>
        <ul>
          <li>
            Haz clic en una intersección (en pantallas táctiles, toca dos veces el mismo punto).
          </li>
          <li>
            Flechas e <kbd>Intro</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd>{' '}
            reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Make a line of five stones. <strong>Black</strong> needs <strong>exactly five</strong>;{' '}
        <strong>White</strong> wins with five or more.
      </p>
      <h3>Rules (RIF)</h3>
      <ul>
        <li>15×15 board. Black moves first and its first stone goes on the center point (H8).</li>
        <li>
          Black may not play on a <strong>forbidden</strong> point:
          <ul>
            <li>
              <strong>3-3</strong>: making two threes at once (a three is a line one stone away from
              an open four).
            </li>
            <li>
              <strong>4-4</strong>: making two fours at once (including two fours in the same line).
            </li>
            <li>
              <strong>Overline</strong>: six or more stones in a row.
            </li>
          </ul>
        </li>
        <li>
          Making exactly five is always allowed and wins, even if it also forms a forbidden shape.
        </li>
        <li>White has no restrictions. If the board fills with no winner, the game is a draw.</li>
      </ul>
      <p>Black’s forbidden points are marked with a red ✕ when Black is to move.</p>
      <p>
        <em>Opening:</em> the RIF first-stone-in-the-center rule applies; the tournament swap and
        two-proposal fifth-move protocol is not used.
      </p>
      <h3>Controls</h3>
      <ul>
        <li>Click an intersection (on touch screens, tap the same point twice).</li>
        <li>
          Arrows and <kbd>Enter</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart
          · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
