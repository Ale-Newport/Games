import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el primero en quedarte sin fichas en el atril.</p>
        <h3>Las fichas</h3>
        <p>
          Números del 1 al 13 en cuatro colores, dos de cada, y dos comodines (★) que valen por
          cualquier ficha. Empiezas con 14.
        </p>
        <h3>Juegos</h3>
        <ul>
          <li>
            <strong>Escalera</strong>: tres o más números seguidos del mismo color (el 13 no enlaza
            con el 1).
          </li>
          <li>
            <strong>Grupo</strong>: tres o cuatro fichas del mismo número en colores distintos.
          </li>
        </ul>
        <h3>Tu turno</h3>
        <ul>
          <li>
            Pasa fichas de tu atril a la mesa. Puedes reorganizar la mesa entera —partir escaleras,
            mover fichas de un juego a otro— siempre que al terminar todos los juegos sean válidos y
            hayas puesto al menos una ficha tuya.
          </li>
          <li>Si no quieres o no puedes jugar, roba una ficha del pozo (si está vacío, pasas).</li>
          <li>
            Tu primera jugada tiene que ser con juegos nuevos de tus propias fichas que sumen al
            menos 30.
          </li>
        </ul>
        <h3>Final</h3>
        <p>
          Quien vacía su atril gana y se apunta lo que les queda a los demás (el comodín vale 30);
          ellos pierden eso. Si el pozo se acaba y nadie puede jugar, gana el atril más bajo.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una ficha y después un juego, «Juego nuevo» o tu atril para moverla ·{' '}
          <kbd>Intro</kbd> jugar · <kbd>D</kbd> robar · <kbd>R</kbd> deshacer · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to empty your rack.</p>
      <h3>The tiles</h3>
      <p>
        Numbers 1 to 13 in four colours, two of each, and two jokers (★) that stand for any tile.
        You start with 14.
      </p>
      <h3>Sets</h3>
      <ul>
        <li>
          <strong>Run</strong>: three or more consecutive numbers of one colour (13 does not wrap to
          1).
        </li>
        <li>
          <strong>Group</strong>: three or four tiles of one number in different colours.
        </li>
      </ul>
      <h3>Your turn</h3>
      <ul>
        <li>
          Move tiles from your rack to the table. You may rearrange the whole table — split runs,
          move tiles between sets — as long as every set is valid when you finish and at least one
          of your tiles went down.
        </li>
        <li>
          If you cannot or would rather not play, draw a tile from the pool (when it is empty,
          pass).
        </li>
        <li>Your first play must be new sets of your own tiles worth at least 30.</li>
      </ul>
      <h3>End</h3>
      <p>
        Whoever empties their rack wins and scores what the others still hold (a joker counts 30);
        they lose that much. If the pool runs out and nobody can play, the lowest rack wins.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a tile, then a set, “New set” or your rack to move it · <kbd>Enter</kbd> play ·{' '}
        <kbd>D</kbd> draw · <kbd>R</kbd> reset · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
