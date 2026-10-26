import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Tú y tu compañero (enfrente) contra la otra pareja. Gana el primer equipo que llegue a 500
          puntos; el que baje a −200 pierde.
        </p>
        <h3>Una mano</h3>
        <ul>
          <li>
            Trece cartas a cada uno. Las <strong>picas</strong> son siempre triunfo.
          </li>
          <li>
            <strong>Puja</strong>: cada jugador dice cuántas bazas hará (1–13) o{' '}
            <strong>nil</strong> (ninguna). El contrato de la pareja es la suma de sus pujas.
          </li>
          <li>
            Sale el jugador a la izquierda del que reparte. Hay que seguir el palo; quien no puede,
            puede fallar con una pica. No se puede salir de picas hasta que alguien haya jugado una
            (salvo que solo te queden picas). Gana la pica más alta o, si no hay picas, la carta más
            alta del palo de salida.
          </li>
          <li>
            <strong>Puntuación</strong>: si la pareja cumple su contrato gana 10 puntos por baza
            pujada y 1 por cada baza de más (un <em>saco</em>); cada 10 sacos restan 100. Si no lo
            cumple, pierde 10 por baza pujada. Un nil cumplido suma 100 y uno fallado resta 100.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Pulsa tu puja (o las teclas <kbd>0</kbd>–<kbd>9</kbd>) y después toca las cartas que
          quieras jugar; las que no puedes jugar se ven atenuadas. <kbd>H</kbd> pista, <kbd>N</kbd>{' '}
          siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        You and your partner (sitting across) against the other pair. The first side to 500 points
        wins; a side that falls to −200 loses.
      </p>
      <h3>A hand</h3>
      <ul>
        <li>
          Thirteen cards each. <strong>Spades</strong> are always trump.
        </li>
        <li>
          <strong>Bidding</strong>: each player says how many tricks they will take (1–13) or{' '}
          <strong>nil</strong> (none). A side&apos;s contract is the sum of its bids.
        </li>
        <li>
          The player left of the dealer leads. Follow suit if you can; if you cannot, you may trump
          with a spade. Spades may not be led until one has been played (unless you hold only
          spades). The highest spade wins, or else the highest card of the led suit.
        </li>
        <li>
          <strong>Scoring</strong>: a side that makes its contract scores 10 points per trick bid
          and 1 per extra trick (a <em>bag</em>); every 10 bags cost 100. A side that falls short
          loses 10 per trick bid. A successful nil scores 100, a failed one costs 100.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Press your bid (or the keys <kbd>0</kbd>–<kbd>9</kbd>), then tap the cards to play; cards
        you cannot play are dimmed. <kbd>H</kbd> hint, <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
