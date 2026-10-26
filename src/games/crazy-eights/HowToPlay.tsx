import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Quedarte sin cartas el primero. Gana la partida el primero que llegue a 100 puntos.</p>
        <h3>Un turno</h3>
        <ul>
          <li>
            Juega una carta del palo actual o del mismo número que la carta de arriba del montón.
          </li>
          <li>
            Los <strong>ochos</strong> valen siempre: al jugar uno nombras el palo que hay que
            seguir.
          </li>
          <li>
            Si no puedes jugar, roba una carta; si te sirve puedes jugarla, si no, pasas. Cuando se
            acaba el mazo se baraja el montón (menos la carta de arriba).
          </li>
        </ul>
        <h3>Puntos</h3>
        <p>
          Quien se queda sin cartas suma lo que tienen los demás en la mano: ocho 50, figuras 10, as
          1 y el resto su número. Si nadie puede jugar ni robar, gana la mano más baja.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una carta para jugarla (con un ocho, elige el palo). <kbd>D</kbd> robar ·{' '}
          <kbd>P</kbd> pasar · <kbd>1</kbd>–<kbd>4</kbd> palo · <kbd>H</kbd> pista · <kbd>N</kbd>{' '}
          siguiente mano.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to empty your hand. The first to 100 points wins the game.</p>
      <h3>A turn</h3>
      <ul>
        <li>Play a card of the current suit, or of the same rank as the top card of the pile.</li>
        <li>
          <strong>Eights</strong> are wild: when you play one you name the suit to follow.
        </li>
        <li>
          If you cannot play, draw a card; you may play it if it fits, otherwise pass. When the
          stock runs out the pile (all but its top card) is shuffled into a new one.
        </li>
      </ul>
      <h3>Points</h3>
      <p>
        Whoever goes out scores the cards left in the other hands: eight 50, face cards 10, ace 1,
        others their number. If nobody can play or draw, the lowest hand wins.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a card to play it (for an eight, then pick the suit). <kbd>D</kbd> draw · <kbd>P</kbd>{' '}
        pass · <kbd>1</kbd>–<kbd>4</kbd> suit · <kbd>H</kbd> hint · <kbd>N</kbd> next hand.
      </p>
    </>
  );
}
