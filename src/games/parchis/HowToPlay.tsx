import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sé el primero en llevar tus cuatro fichas alrededor del tablero y por tu pasillo hasta la
          meta.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>
            Tira el dado. Con un 5 sacas una ficha de casa a tu salida, y si puedes sacar, debes
            hacerlo.
          </li>
          <li>Mueve una ficha lo que marque el dado. A la meta se llega con la tirada exacta.</li>
          <li>
            Un 6 da otra tirada; si ya tienes todas las fichas fuera de casa, el 6 cuenta 7. Con
            tres seises seguidos, la última ficha que moviste vuelve a casa (si no está en el
            pasillo).
          </li>
          <li>
            Si caes sobre una ficha rival fuera de un seguro, te la comes: vuelve a su casa y tú
            cuentas 20 con cualquier ficha.
          </li>
          <li>Meter una ficha en la meta te da 10 para mover otra.</li>
          <li>
            Dos fichas del mismo color en una casilla forman una barrera: nadie puede pasarla ni
            caer en ella.
          </li>
          <li>Los seguros (las salidas y las casillas marcadas con ★) no permiten comer.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · toca una ficha marcada o pulsa <kbd>1</kbd>–
          <kbd>4</kbd> · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Be the first to bring all four of your pawns round the board and up your corridor to the
        goal.
      </p>
      <h3>A turn</h3>
      <ul>
        <li>
          Roll the die. A 5 brings a pawn out of home onto your exit square — and if you can bring
          one out, you must.
        </li>
        <li>Move a pawn by the roll. The goal needs the exact roll.</li>
        <li>
          A 6 rolls again; once all your pawns are out of home a 6 counts 7. Three sixes in a row
          send the last pawn you moved home (unless it is in its corridor).
        </li>
        <li>
          Landing on a rival pawn off a safe square captures it: it goes home and you move any pawn
          20.
        </li>
        <li>Bringing a pawn to the goal lets you move another 10.</li>
        <li>
          Two pawns of one colour on a square make a barrier: no one can pass it or land on it.
        </li>
        <li>The safe squares (the exits and the squares marked ★) allow no captures.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · tap a marked pawn or press <kbd>1</kbd>–<kbd>4</kbd>{' '}
        · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
