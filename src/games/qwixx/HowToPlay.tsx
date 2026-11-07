import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Consigue más puntos tachando muchos números en cada fila: cuantas más cruces en una fila,
          más vale cada una.
        </p>
        <h3>La tirada</h3>
        <ul>
          <li>
            Se tiran seis dados: dos blancos y uno por color. Primero, <strong>todos</strong> pueden
            tachar la suma de los dos blancos en una fila cualquiera (o pasar).
          </li>
          <li>
            Después, quien ha tirado puede además tachar un dado blanco más uno de color en la fila
            de ese color.
          </li>
          <li>
            Si quien ha tirado no tacha nada en toda la tirada, se lleva una penalización (−5).
          </li>
        </ul>
        <h3>Las filas</h3>
        <ul>
          <li>
            Rojo y amarillo van del 2 al 12; verde y azul, del 12 al 2. Se tacha siempre de
            izquierda a derecha: los números que te saltas se pierden.
          </li>
          <li>
            El último número de una fila solo se puede tachar con cinco cruces ya hechas en ella. Al
            tacharlo se cierra la fila (el candado cuenta como otra cruz) y su dado se retira.
          </li>
        </ul>
        <h3>Final y puntos</h3>
        <p>
          La partida acaba cuando alguien tiene cuatro penalizaciones o hay dos filas cerradas. Una
          fila con n cruces vale 1 + 2 + … + n puntos (1, 3, 6, 10, 15…), y cada penalización resta
          5.
        </p>
        <h3>Controles</h3>
        <p>
          Toca un número iluminado para tacharlo · <kbd>R</kbd> o <kbd>Espacio</kbd> tirar ·{' '}
          <kbd>P</kbd> pasar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Score the most points by crossing many numbers in each row: the more crosses in a row, the
        more each one is worth.
      </p>
      <h3>A throw</h3>
      <ul>
        <li>
          Six dice are thrown: two white and one per colour. First, <strong>everyone</strong> may
          cross the sum of the two white dice in any one row (or pass).
        </li>
        <li>
          Then the thrower may also cross a white die plus a coloured die in that colour’s row.
        </li>
        <li>If the thrower crosses nothing in the whole throw, they take a penalty (−5).</li>
      </ul>
      <h3>The rows</h3>
      <ul>
        <li>
          Red and yellow run from 2 to 12, green and blue from 12 to 2. Always cross left to right:
          numbers you skip are lost.
        </li>
        <li>
          The last number of a row may only be crossed once that row has five crosses. Crossing it
          locks the row (the lock counts as another cross) and its die is removed.
        </li>
      </ul>
      <h3>End and scoring</h3>
      <p>
        The game ends when someone has four penalties or two rows are locked. A row with n crosses
        scores 1 + 2 + … + n (1, 3, 6, 10, 15…), and each penalty costs 5.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a lit number to cross it · <kbd>R</kbd> or <kbd>Space</kbd> roll · <kbd>P</kbd> pass ·{' '}
        <kbd>H</kbd> hint.
      </p>
    </>
  );
}
