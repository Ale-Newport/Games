import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Llevar las 52 cartas a las <strong>cuatro fundaciones</strong>, cada palo del as al rey.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete columnas de 1 a 7 cartas; solo la de arriba está boca arriba. El resto de la
            baraja forma el mazo.
          </li>
          <li>
            En las columnas se baja alternando colores (un 9 negro sobre un 10 rojo). Puedes mover
            cualquier escalera boca arriba; una columna vacía solo admite un rey.
          </li>
          <li>Al quedar arriba una carta boca abajo, se destapa sola.</li>
          <li>
            Toca el mazo para girar <strong>una carta</strong> al descarte; solo la de arriba se
            puede jugar. Con el mazo vacío, el descarte vuelve a él (sin límite de vueltas).
          </li>
          <li>Las cartas de las fundaciones pueden volver a las columnas.</li>
          <li>
            Puntos: descarte → columna +5, a fundación +10, destapar +5, fundación → columna −15,
            cada vuelta al mazo −100 (nunca por debajo de 0).
          </li>
          <li>
            Si solo queda robar y una vuelta completa al mazo no ofrece nada, la partida está
            perdida.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta para elegirla y luego el montón de destino; tócala otra vez (o doble
            clic) para enviarla a su mejor sitio. También puedes arrastrar.
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
        Bring all 52 cards to the <strong>four foundations</strong>, each suit from ace to king.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven columns of 1 to 7 cards, only the top one face up. The rest of the deck is the
          stock.
        </li>
        <li>
          Build down the columns in alternating colors (a black 9 on a red 10). Any face-up run can
          move; an empty column only takes a king.
        </li>
        <li>A face-down card left on top turns up by itself.</li>
        <li>
          Tap the stock to turn <strong>one card</strong> onto the waste; only its top card plays.
          When the stock runs out the waste goes back (unlimited passes).
        </li>
        <li>Foundation cards may come back down to the columns.</li>
        <li>
          Scoring: waste → column +5, to a foundation +10, turning a card up +5, foundation → column
          −15, each pass through the stock −100 (never below 0).
        </li>
        <li>
          If drawing is all that is left and a full pass through the stock offers nothing, the deal
          is lost.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card to pick it, then the pile to put it on; tap it again (or double-click) to send
          it to its best spot. You can also drag.
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
