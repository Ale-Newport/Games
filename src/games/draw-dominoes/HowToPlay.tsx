import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el primero en llegar a 100 puntos, mano a mano.</p>
        <h3>La mano</h3>
        <ul>
          <li>
            Se juega con las 28 fichas del doble seis: siete por jugador entre dos, cinco entre tres
            o cuatro. El resto es el pozo.
          </li>
          <li>
            La primera mano la abre el doble más alto. Después sale quien ganó la mano anterior, con
            la ficha que quiera.
          </li>
          <li>
            En tu turno juega una ficha cuyo número case con uno de los dos extremos de la fila.
          </li>
          <li>
            Si no puedes, roba del pozo de una en una hasta que algo encaje. Solo pasas si el pozo
            está vacío.
          </li>
        </ul>
        <h3>Puntos</h3>
        <ul>
          <li>Quien se queda sin fichas se apunta la suma de puntos de las manos de los demás.</li>
          <li>
            Si nadie puede jugar (cierre), gana la mano con menos puntos y se apunta los de las
            demás menos los suyos.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una ficha iluminada para jugarla · <kbd>D</kbd> robar · <kbd>P</kbd> pasar ·{' '}
          <kbd>H</kbd> pista · <kbd>Intro</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach 100 points, hand by hand.</p>
      <h3>A hand</h3>
      <ul>
        <li>
          The 28 double-six tiles are shuffled: seven each for two players, five each for three or
          four. The rest is the boneyard.
        </li>
        <li>
          The highest double opens the first hand. After that the previous hand’s winner leads with
          any tile.
        </li>
        <li>On your turn play a tile with a number matching one of the line’s two open ends.</li>
        <li>
          If you cannot, draw from the boneyard one tile at a time until something fits. You pass
          only when it is empty.
        </li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>The player who goes out scores the pips left in everyone else’s hands.</li>
        <li>
          If nobody can play (a block), the lowest hand wins and scores the others’ pips minus its
          own.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a lit tile to play it · <kbd>D</kbd> draw · <kbd>P</kbd> pass · <kbd>H</kbd> hint ·{' '}
        <kbd>Enter</kbd> next hand.
      </p>
    </>
  );
}
