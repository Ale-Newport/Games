import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Mueve tus quince fichas alrededor del tablero hasta tu casa (los puntos 1–6, abajo a la
          derecha) y sácalas todas antes que tu rival, que mueve en sentido contrario.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Tira dos dados y mueve una ficha por cada dado (con dobles, cuatro movimientos).</li>
          <li>
            No puedes caer en un punto con dos o más fichas del rival. Si cae en una ficha sola, la
            golpeas y va a la barra.
          </li>
          <li>Con fichas en la barra, primero hay que entrarlas en la casa del rival.</li>
          <li>Hay que usar tantos dados como se pueda; si solo cabe uno, el mayor.</li>
          <li>
            Cuando todas tus fichas están en casa puedes sacarlas con el dado exacto, o con uno
            mayor desde la ficha más alejada.
          </li>
        </ul>
        <h3>Puntuación y cubo</h3>
        <p>
          Ganar vale 1 punto; 2 (gammon) si el rival no ha sacado ninguna ficha y 3 (backgammon) si
          además le queda alguna en tu casa o en la barra. Antes de tirar puedes doblar: el rival
          acepta (la partida vale el doble y el cubo pasa a él) o rechaza y pierde lo que valía. En
          un encuentro, la partida Crawford (justo cuando alguien queda a un punto) se juega sin
          cubo.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una ficha y luego un punto marcado · <kbd>R</kbd> tirar · <kbd>D</kbd> doblar ·{' '}
          <kbd>U</kbd> deshacer paso · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Move your fifteen checkers around the board into your home (points 1–6, bottom right) and
        bear them all off before your opponent, who moves the other way round.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>Roll two dice and move a checker for each die (doubles give four moves).</li>
        <li>
          You cannot land on a point with two or more of the opponent's checkers. Landing on a
          single one hits it to the bar.
        </li>
        <li>Checkers on the bar must first enter in the opponent's home.</li>
        <li>Use as many dice as you can; if only one fits, use the larger.</li>
        <li>
          Once all your checkers are home you bear off with the exact die, or with a higher one from
          your farthest checker.
        </li>
      </ul>
      <h3>Scoring and the cube</h3>
      <p>
        A win is worth 1 point; 2 (a gammon) if the loser has borne off nothing, and 3 (a
        backgammon) if the loser also still has a checker in your home or on the bar. Before rolling
        you may double: the opponent takes (the game is worth twice as much and the cube passes to
        them) or drops and loses what it was worth. In a match, the Crawford game (right after
        someone gets within one point) is played without the cube.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a checker, then a marked point · <kbd>R</kbd> roll · <kbd>D</kbd> double · <kbd>U</kbd>{' '}
        undo step · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
