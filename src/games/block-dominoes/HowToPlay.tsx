import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Ser el primero en llegar a 50 puntos, mano a mano.</p>
        <h3>La mano</h3>
        <ul>
          <li>
            Se juega con las 28 fichas del doble seis; cada jugador recibe siete y el resto queda
            fuera, boca abajo.
          </li>
          <li>
            La primera mano la abre el doble más alto. Después sale quien ganó la mano anterior, con
            la ficha que quiera.
          </li>
          <li>
            En tu turno juega una ficha cuyo número case con uno de los dos extremos de la fila. Si
            no puedes, pasas.
          </li>
        </ul>
        <h3>Puntos</h3>
        <ul>
          <li>Quien se queda sin fichas se apunta la suma de puntos de las manos de los demás.</li>
          <li>
            Si nadie puede jugar (cierre), gana la mano con menos puntos y se apunta los de las
            demás menos los suyos. Si hay empate en la mano más baja, nadie puntúa.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca una ficha iluminada para jugarla; si cabe en los dos extremos, elige cuál ·{' '}
          <kbd>P</kbd> pasar · <kbd>H</kbd> pista · <kbd>Intro</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to reach 50 points, hand by hand.</p>
      <h3>A hand</h3>
      <ul>
        <li>
          The 28 double-six tiles are shuffled; each player takes seven and the rest stay out of
          play, face down.
        </li>
        <li>
          The highest double opens the first hand. After that the previous hand’s winner leads with
          any tile.
        </li>
        <li>
          On your turn play a tile with a number matching one of the line’s two open ends. If you
          cannot, you pass.
        </li>
      </ul>
      <h3>Scoring</h3>
      <ul>
        <li>The player who goes out scores the pips left in everyone else’s hands.</li>
        <li>
          If nobody can play (a block), the lowest hand wins and scores the others’ pips minus its
          own. A tie for the lowest scores nothing.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap a lit tile to play it; if it fits both ends, choose one · <kbd>P</kbd> pass ·{' '}
        <kbd>H</kbd> hint · <kbd>Enter</kbd> next hand.
      </p>
    </>
  );
}
