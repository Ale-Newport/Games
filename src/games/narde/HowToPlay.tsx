import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Lleva tus quince fichas desde tu cabeza (el punto 24) alrededor del tablero hasta tu casa
          (los puntos 1–6) y sácalas todas antes que tu rival. Los dos bandos van en el mismo
          sentido y empiezan en esquinas opuestas.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Tira dos dados y mueve una ficha por cada dado (con dobles, cuatro movimientos).</li>
          <li>No hay golpes: una sola ficha del rival ya bloquea su punto.</li>
          <li>
            De la cabeza solo puede salir una ficha por turno. En el primer turno, con 6-6, 4-4 o
            3-3, pueden salir dos.
          </li>
          <li>
            No se pueden cerrar seis puntos seguidos salvo que alguna ficha del rival ya esté más
            allá de ellos.
          </li>
          <li>Hay que usar tantos dados como se pueda; si solo cabe uno, el mayor.</li>
          <li>
            Con las quince fichas en casa se sacan con el dado exacto, o con uno mayor desde la
            ficha más alejada.
          </li>
        </ul>
        <h3>Puntuación</h3>
        <p>Ganar vale 1 punto (oin); 2 (mars) si el rival aún no ha sacado ninguna ficha.</p>
        <h3>Controles</h3>
        <p>
          Toca una ficha y luego un punto marcado · <kbd>R</kbd> tirar · <kbd>U</kbd> deshacer paso
          · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring your fifteen checkers from your head (point 24) round the board into your home (points
        1–6) and bear them all off before your opponent. Both sides travel the same way round,
        starting in opposite corners.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>Roll two dice and move a checker for each die (doubles give four moves).</li>
        <li>There is no hitting: a single opposing checker already holds its point.</li>
        <li>
          Only one checker may leave the head each turn. On your first turn, 6-6, 4-4 or 3-3 let two
          leave.
        </li>
        <li>
          You may not close six points in a row unless an opposing checker is already past them.
        </li>
        <li>Use as many dice as you can; if only one fits, use the larger.</li>
        <li>
          Once all fifteen are home, bear off with the exact die, or a higher one from your farthest
          checker.
        </li>
      </ul>
      <h3>Scoring</h3>
      <p>
        A win is worth 1 point (oin); 2 (mars) if the opponent has not borne off a single checker.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a checker, then a marked point · <kbd>R</kbd> roll · <kbd>U</kbd> undo step ·{' '}
        <kbd>H</kbd> hint.
      </p>
    </>
  );
}
