import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tú y tu compañero (enfrente) contra la otra pareja. Gana el primer equipo que llegue a 10
          puntos.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            Baraja de 24 cartas (del nueve al as). Cinco cartas a cada uno y se vuelve la siguiente.
          </li>
          <li>
            <strong>Triunfo</strong>: empezando a la izquierda del que reparte, cada uno pasa o{' '}
            <strong>pide</strong> que el que reparte se quede la carta vuelta (su palo será triunfo;
            el que reparte descarta una). Si todos pasan, cada uno puede nombrar otro palo; el que
            reparte no puede pasar. Quien hace el triunfo puede <strong>jugar solo</strong> (su
            compañero no juega).
          </li>
          <li>
            Orden del triunfo: la jota del triunfo (bower derecho), la jota del mismo color (bower
            izquierdo, que cuenta como triunfo), as, rey, dama, diez y nueve.
          </li>
          <li>
            Sale el de la izquierda del que reparte; hay que seguir el palo. Gana el triunfo más
            alto o la carta más alta del palo de salida.
          </li>
          <li>
            Si la pareja que hizo el triunfo gana 3 o 4 bazas suma 1; las cinco, 2 (4 si jugó solo).
            Si gana menos de 3 (euchre), la otra pareja suma 2.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Botones para pedir, pasar o nombrar palo (marca «Jugar solo» antes si quieres). Después
          toca tus cartas. <kbd>O</kbd> pedir · <kbd>P</kbd> pasar · <kbd>H</kbd> pista ·{' '}
          <kbd>N</kbd> siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>You and your partner (across) against the other pair. The first side to 10 points wins.</p>
      <h3>A hand</h3>
      <ul>
        <li>A 24-card deck (nine to ace). Five cards each; the next card is turned up.</li>
        <li>
          <strong>Trump</strong>: from the dealer&apos;s left, each player passes or{' '}
          <strong>orders up</strong> the turned card (its suit becomes trump; the dealer takes it
          and throws one card). If everyone passes, each may name another suit; the dealer may not
          pass. The player who makes trump may <strong>go alone</strong> (their partner sits out).
        </li>
        <li>
          Trump order: the jack of trump (right bower), the jack of the same colour (left bower,
          which counts as trump), ace, king, queen, ten, nine.
        </li>
        <li>
          The player left of the dealer leads; follow suit if you can. The highest trump wins, or
          the highest card of the led suit.
        </li>
        <li>
          The makers score 1 for three or four tricks, 2 for all five (4 alone). Fewer than three
          (euchred): the other side scores 2.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Buttons to order up, pass or name a suit (tick Go alone first if you like). Then tap your
        cards. <kbd>O</kbd> order up · <kbd>P</kbd> pass · <kbd>H</kbd> hint · <kbd>N</kbd> next
        hand.
      </p>
    </>
  );
}
