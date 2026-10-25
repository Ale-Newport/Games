import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Quitar las <strong>28 cartas de la pirámide</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            La pirámide tiene siete filas boca arriba; cada carta tapa a medias dos de la fila de
            arriba. El resto de la baraja forma el mazo.
          </li>
          <li>
            Una carta está libre cuando no la tapa ninguna de la fila de abajo. La de arriba del
            descarte también.
          </li>
          <li>
            Quita dos cartas libres que sumen <strong>13</strong> (as 1, jota 11, reina 12) o un{' '}
            <strong>rey</strong> solo.
          </li>
          <li>
            Toca el mazo para girar una carta al descarte. Puedes dar la vuelta al descarte dos
            veces (tres vueltas en total).
          </li>
          <li>Puntos: 5 por carta quitada y 50 por despejar la pirámide.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta libre y luego su pareja; un rey, tócalo dos veces. También puedes
            arrastrar una carta sobre su pareja.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> carta · <kbd>Intro</kbd> elegir / emparejar · <kbd>D</kbd>{' '}
            robar · <kbd>A</kbd> quitar · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>N</kbd>{' '}
            nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Remove all <strong>28 cards of the pyramid</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          The pyramid has seven face-up rows; each card half covers two cards of the row above. The
          rest of the deck is the stock.
        </li>
        <li>
          A card is free when no card of the row below covers it. The waste's top card is free too.
        </li>
        <li>
          Remove two free cards that add up to <strong>13</strong> (ace 1, jack 11, queen 12), or a{' '}
          <strong>king</strong> on its own.
        </li>
        <li>
          Tap the stock to turn a card onto the waste. The waste may go back into the stock twice
          (three passes in all).
        </li>
        <li>Score: 5 per card removed and 50 for clearing the pyramid.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a free card, then its partner; tap a king twice. You can also drag a card onto its
          partner.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> card · <kbd>Enter</kbd> pick / pair · <kbd>D</kbd> draw ·{' '}
          <kbd>A</kbd> remove · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
