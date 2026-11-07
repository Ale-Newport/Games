import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar las 52 cartas a las <strong>cuatro fundaciones</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            La <strong>reserva</strong> tiene 13 cartas; solo se ve la de arriba. Hay cuatro
            montones de una carta y una carta en la primera fundación: su rango es la{' '}
            <strong>base</strong>.
          </li>
          <li>
            Las fundaciones suben por palo desde la base y pasan del rey al as. Una carta del rango
            base empieza cualquier fundación vacía.
          </li>
          <li>
            Los montones bajan alternando colores (también del as al rey). Se puede mover cualquier
            escalera bien formada.
          </li>
          <li>
            Un montón vacío se llena solo con la carta de arriba de la reserva; sin reserva, admite
            cualquier carta.
          </li>
          <li>
            El mazo se gira de tres en tres sin límite de vueltas; la de arriba del descarte y la de
            la reserva se pueden jugar.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta y luego su destino, o tócala dos veces para moverla a su mejor sitio.
            También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> montón · <kbd>↑</kbd>/<kbd>↓</kbd> carta · <kbd>Intro</kbd>{' '}
            coger / soltar · <kbd>D</kbd> robar · <kbd>A</kbd> mover solo · <kbd>U</kbd> deshacer ·{' '}
            <kbd>H</kbd> pista · <kbd>F</kbd> terminar · <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring all 52 cards to the <strong>four foundations</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          The <strong>reserve</strong> holds 13 cards; only its top card shows. There are four
          one-card tableau piles and one card on the first foundation: its rank is the{' '}
          <strong>base</strong>.
        </li>
        <li>
          Foundations build up by suit from the base and wrap from king to ace. A card of the base
          rank starts any empty foundation.
        </li>
        <li>
          Tableau piles build down in alternating colors (also from ace to king). Any properly built
          run may move.
        </li>
        <li>
          An empty tableau pile fills itself from the top of the reserve; once the reserve is empty,
          it takes any card.
        </li>
        <li>
          The stock turns three cards at a time with unlimited passes; the tops of the waste and the
          reserve can be played.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card, then where it goes, or tap it twice to send it to its best spot. You can also
          drag.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> pile · <kbd>↑</kbd>/<kbd>↓</kbd> card · <kbd>Enter</kbd> pick /
          drop · <kbd>D</kbd> draw · <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd> hint
          · <kbd>F</kbd> finish · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
