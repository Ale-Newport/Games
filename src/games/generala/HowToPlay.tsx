import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Suma más puntos que los demás rellenando las once casillas, una por turno.</p>
        <h3>Turno</h3>
        <p>
          Tira los cinco dados; puedes guardar los que quieras y volver a tirar el resto, hasta tres
          tiradas. Después anota la jugada en una casilla libre, o táchala con un 0.
        </p>
        <h3>Casillas</h3>
        <ul>
          <li>Al 1 … al 6: la suma de los dados de ese número.</li>
          <li>
            Escalera (1-2-3-4-5, 2-3-4-5-6 o 3-4-5-6-1): 20. Full (tres y dos iguales): 30. Póker
            (cuatro iguales): 40.
          </li>
          <li>
            Hechas en la primera tirada (servidas), la escalera, el full y el póker valen 5 más.
          </li>
          <li>Generala (cinco iguales): 50. Servida, gana la partida al instante.</li>
          <li>Doble generala: 100, si la casilla de generala ya tiene 50.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca un dado para guardarlo · <kbd>R</kbd> o <kbd>Espacio</kbd> tirar · <kbd>1</kbd>–
          <kbd>5</kbd> guardar · toca la puntuación de una casilla para anotar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Score more than the others by filling the eleven boxes, one per turn.</p>
      <h3>A turn</h3>
      <p>
        Roll the five dice; hold any you like and roll the rest again, up to three rolls. Then score
        the hand in an open box, or cross one out with a 0.
      </p>
      <h3>Boxes</h3>
      <ul>
        <li>Ones … sixes: the sum of the dice showing that number.</li>
        <li>
          Straight (1-2-3-4-5, 2-3-4-5-6 or 3-4-5-6-1): 20. Full house (three and two alike): 30.
          Four of a kind: 40.
        </li>
        <li>
          Made on the first roll (served), the straight, full house and four of a kind score 5 more.
        </li>
        <li>Generala (five alike): 50. Served, it wins the game at once.</li>
        <li>Double generala: 100, once the generala box holds 50.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a die to hold it · <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>1</kbd>–<kbd>5</kbd>{' '}
        hold · tap a box's score to take it · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
