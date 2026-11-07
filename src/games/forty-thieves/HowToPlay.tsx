import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar las 104 cartas a las <strong>ocho fundaciones</strong>, cada palo del as al rey.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Dos barajas. Diez columnas de cuatro cartas boca arriba; las 64 restantes forman el
            mazo.
          </li>
          <li>
            Se baja del <strong>mismo palo</strong>, un rango menos, y solo se mueve{' '}
            <strong>una carta cada vez</strong>. Una columna vacía admite cualquier carta.
          </li>
          <li>
            Toca el mazo para girar una carta al descarte; solo la de arriba se puede jugar. El mazo
            se recorre <strong>una sola vez</strong>.
          </li>
          <li>
            Las fundaciones se construyen del as al rey por palo; lo que llega a casa no vuelve.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta y luego su destino, o tócala dos veces para moverla a su mejor sitio.
            También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> montón · <kbd>Intro</kbd> coger / soltar · <kbd>D</kbd> robar
            · <kbd>A</kbd> mover solo · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>F</kbd>{' '}
            terminar · <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring all 104 cards to the <strong>eight foundations</strong>, each suit from ace to king.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>Two decks. Ten columns of four face-up cards; the other 64 form the stock.</li>
        <li>
          Build down in the <strong>same suit</strong>, one rank lower, and move{' '}
          <strong>one card at a time</strong>. An empty column takes any card.
        </li>
        <li>
          Tap the stock to turn a card onto the waste; only its top card plays. The stock is gone
          through <strong>once</strong>.
        </li>
        <li>Foundations build up by suit from the ace; cards home stay home.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card, then where it goes, or tap it twice to send it to its best spot. You can also
          drag.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> pile · <kbd>Enter</kbd> pick / drop · <kbd>D</kbd> draw ·{' '}
          <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>F</kbd> finish ·{' '}
          <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
