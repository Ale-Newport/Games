import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Pasar al descarte las <strong>35 cartas</strong> de las siete columnas.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete columnas de cinco cartas boca arriba; solo la de abajo de cada columna se puede
            jugar. Una carta empieza el descarte y 16 quedan en el mazo.
          </li>
          <li>
            Juega una carta al descarte si es <strong>un rango mayor o menor</strong> que la de
            arriba, sin importar el palo. El rey y el as no se tocan.
          </li>
          <li>Si nada encaja, gira una carta del mazo. El mazo se usa una sola vez.</li>
          <li>
            Golpes: las cartas que quedan en la mesa; si la despejas, cada carta que sobre en el
            mazo cuenta como un golpe bajo par (−1). Menos es mejor.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>Toca una carta libre para jugarla; toca el mazo para robar.</li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> carta · <kbd>Intro</kbd> jugar · <kbd>D</kbd> robar ·{' '}
            <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Move all <strong>35 cards</strong> of the seven columns onto the waste.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven columns of five face-up cards; only the bottom card of each column can play. One
          card starts the waste; 16 stay in the stock.
        </li>
        <li>
          Play a card onto the waste if it is <strong>one rank higher or lower</strong> than its top
          card, whatever the suit. King and ace do not touch.
        </li>
        <li>When nothing fits, turn a card from the stock. The stock is used once.</li>
        <li>
          Strokes: the cards left on the table; if you clear it, every card left in the stock is a
          stroke under par (−1). Lower is better.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Tap a free card to play it; tap the stock to draw.</li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> card · <kbd>Enter</kbd> play · <kbd>D</kbd> draw · <kbd>U</kbd>{' '}
          undo · <kbd>H</kbd> hint · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
