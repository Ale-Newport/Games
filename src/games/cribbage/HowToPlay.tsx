import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Llegar el primero a 121 puntos; se avanza en el tablero según se anota.</p>
        <h3>Una mano</h3>
        <ul>
          <li>
            Seis cartas cada uno; los dos echan dos a la <strong>cuna</strong>, que es del que
            reparte. Se corta una carta: si es una jota, el que reparte suma 2.
          </li>
          <li>
            <strong>Juego</strong>: empezando por el que no reparte, se juegan cartas alternando y
            sumando la cuenta (figuras 10, as 1), sin pasar de 31. Se anota 2 por hacer 15 o 31,
            2/6/12 por parejas, tríos o cuatro iguales seguidos, y por escaleras entre las últimas
            cartas tantos puntos como cartas. Quien no puede jugar dice «go»; el último en jugar
            suma 1 y la cuenta vuelve a 0. La última carta de la mano vale 1.
          </li>
          <li>
            <strong>Recuento</strong>: cada mano de cuatro cartas, con el corte, suma 2 por cada
            combinación que haga 15, 2 por pareja, escaleras por su longitud, color 4 (5 con el
            corte; la cuna solo con 5) y 1 por la jota del palo del corte. Cuenta primero el que no
            reparte, luego el que reparte y su cuna.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca dos cartas y pulsa «Echar a la cuna»; después toca la carta que quieras jugar (las
          que harían pasar de 31 se ven atenuadas). <kbd>←</kbd>/<kbd>→</kbd> elegir ·{' '}
          <kbd>Intro</kbd> marcar o jugar · <kbd>T</kbd> echar · <kbd>H</kbd> pista · <kbd>N</kbd>{' '}
          siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to 121 points; pegs move along the board as you score.</p>
      <h3>A hand</h3>
      <ul>
        <li>
          Six cards each; both throw two into the <strong>crib</strong>, which belongs to the
          dealer. A starter is cut: a jack gives the dealer 2.
        </li>
        <li>
          <strong>Pegging</strong>: starting with the non-dealer, players lay cards in turn and add
          up the count (face cards 10, ace 1), never past 31. Score 2 for making 15 or 31, 2/6/12
          for a pair, three or four of a kind in a row, and for a run among the last cards one point
          per card. A player who cannot play says go; the last to play scores 1 and the count
          restarts. The last card of the hand scores 1.
        </li>
        <li>
          <strong>The show</strong>: each four-card hand, with the starter, scores 2 for every
          combination making 15, 2 per pair, runs by their length, a flush 4 (5 with the starter;
          the crib needs all 5) and 1 for the jack of the starter&apos;s suit. The non-dealer counts
          first, then the dealer and the crib.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap two cards and press Throw to the crib; then tap the card to play (cards that would pass
        31 are dimmed). <kbd>←</kbd>/<kbd>→</kbd> choose · <kbd>Enter</kbd> pick or play ·{' '}
        <kbd>T</kbd> throw · <kbd>H</kbd> hint · <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
