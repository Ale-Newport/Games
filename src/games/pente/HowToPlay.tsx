import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Gana quien primero consiga <strong>cinco piedras en línea</strong> (o más) o{' '}
          <strong>capture cinco parejas</strong> del rival.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Tablero de 19×19. Negras juegan primero y su primera piedra va en el centro.</li>
          <li>
            <strong>Regla de torneo:</strong> la segunda piedra de negras debe estar al menos a tres
            puntos del centro.
          </li>
          <li>
            <strong>Captura:</strong> si al colocar una piedra encierras exactamente <em>dos</em>{' '}
            piedras rivales en línea (●○○●), las retiras. Vale en horizontal, vertical y diagonal, y
            una jugada puede capturar varias parejas.
          </li>
          <li>
            Colocar una piedra entre dos rivales no la hace capturable: solo captura quien coloca la
            piedra que cierra.
          </li>
          <li>Tres piedras seguidas no se capturan.</li>
          <li>Si el tablero se llena sin ganador, es empate.</li>
        </ul>
        <p>Los puntos de la última captura se marcan con un círculo rojo discontinuo.</p>
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
        Win by making <strong>five stones in a row</strong> (or more) or by{' '}
        <strong>capturing five pairs</strong> of your opponent's stones.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>19×19 board. Black moves first and its first stone goes on the center point.</li>
        <li>
          <strong>Tournament rule:</strong> Black's second stone must be at least three points away
          from the center.
        </li>
        <li>
          <strong>Capture:</strong> if your new stone brackets exactly <em>two</em> enemy stones in
          a line (●○○●), they are removed. This works horizontally, vertically and diagonally, and
          one move can capture several pairs.
        </li>
        <li>Moving into a bracket is safe: only the player placing the closing stone captures.</li>
        <li>Three stones in a row cannot be captured.</li>
        <li>If the board fills with no winner, the game is a draw.</li>
      </ul>
      <p>The points emptied by the last capture are marked with a dashed red circle.</p>
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
