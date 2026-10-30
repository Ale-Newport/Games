import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Sé el primero en llevar tus cuatro fichas alrededor del tablero y por tu pasillo hasta
          casa.
        </p>
        <h3>Turno</h3>
        <ul>
          <li>Tira el dado. Con un 6 sacas una ficha del corral a tu casilla de salida.</li>
          <li>
            Mueve una ficha lo que marque el dado, en el sentido de las agujas del reloj; después
            entra por tu pasillo de color. A casa se llega con la tirada exacta.
          </li>
          <li>Un 6 da otra tirada, pero con tres seises seguidos pierdes el turno.</li>
          <li>
            Si caes sobre una ficha rival, vuelve a su corral, salvo en las casillas seguras: las de
            salida y las estrellas.
          </li>
          <li>Dos fichas tuyas juntas no se pueden comer.</li>
          <li>Comer una ficha o meter una en casa da otra tirada.</li>
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
      <p>Be the first to bring all four of your tokens round the board and up your home column.</p>
      <h3>A turn</h3>
      <ul>
        <li>Roll the die. A 6 brings a token out of your yard onto your start square.</li>
        <li>
          Move a token by the roll, clockwise; then up your coloured home column. Home needs the
          exact roll.
        </li>
        <li>A 6 gives another roll, but three sixes in a row lose the turn.</li>
        <li>
          Landing on a rival token sends it back to its yard, except on the safe squares: the start
          squares and the stars.
        </li>
        <li>Two of your tokens on one square cannot be captured.</li>
        <li>Capturing a token or bringing one home gives another roll.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        <kbd>R</kbd> or <kbd>Space</kbd> roll · tap a marked token or press <kbd>1</kbd>–
        <kbd>4</kbd> · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
