import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Consigue la mayor puntuación rellenando las trece casillas de tu hoja, una por turno.</p>
        <h3>Turno</h3>
        <p>
          Tira los cinco dados. Puedes guardar los que quieras y volver a tirar el resto, hasta tres
          tiradas en total. Después anota la jugada en una casilla libre (puede valer 0).
        </p>
        <h3>Casillas</h3>
        <ul>
          <li>
            Unos a seises: la suma de los dados de esa cara. Si la sección superior llega a 63, +35.
          </li>
          <li>Trío y póquer: tres o cuatro iguales; vale la suma de los cinco dados.</li>
          <li>
            Full (tres y dos iguales): 25. Escalera corta (cuatro seguidos): 30. Escalera larga
            (cinco seguidos): 40.
          </li>
          <li>
            Cinco iguales: 50. Cada cinco iguales más, con esa casilla en 50, suma 100 y sirve de
            comodín.
          </li>
          <li>Suerte: la suma de los dados, sin condiciones.</li>
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
      <p>Score the most points by filling the thirteen boxes of your card, one per turn.</p>
      <h3>A turn</h3>
      <p>
        Roll all five dice. You may hold any of them and roll the rest again, up to three rolls in
        all. Then score the hand in an open box (it may be worth 0).
      </p>
      <h3>Boxes</h3>
      <ul>
        <li>
          Ones to sixes: the sum of the dice showing that face. If the upper section reaches 63,
          +35.
        </li>
        <li>Three and four of a kind: three or four alike; scores the sum of all five dice.</li>
        <li>
          Full house (three and two alike): 25. Small straight (four in a row): 30. Large straight
          (five in a row): 40.
        </li>
        <li>
          Five of a kind: 50. Each further five of a kind, with that box at 50, adds 100 and acts as
          a joker.
        </li>
        <li>Chance: the sum of the dice, no conditions.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a die to hold it · <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>1</kbd>–<kbd>5</kbd>{' '}
        hold · tap a box's score to take it · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
