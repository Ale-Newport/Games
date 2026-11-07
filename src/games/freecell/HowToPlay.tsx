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
            Todas las cartas se reparten boca arriba en ocho columnas (cuatro de 7 y cuatro de 6).
          </li>
          <li>
            En las columnas se baja alternando colores. Una columna vacía admite cualquier carta.
          </li>
          <li>
            Cada una de las <strong>cuatro celdas libres</strong> guarda una carta cualquiera.
          </li>
          <li>
            Se mueve una carta cada vez; una escalera se puede mover entera si hubiera sitio para
            moverla carta a carta: como mucho (celdas libres + 1) × 2<sup>columnas vacías</sup>.
          </li>
          <li>
            Las cartas que ya no hacen falta en las columnas suben solas a las fundaciones. Si no
            queda ninguna jugada, la partida está perdida.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta y luego su destino, o tócala dos veces para enviarla a su mejor sitio.
            También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> montón · <kbd>↑</kbd>/<kbd>↓</kbd> carta · <kbd>Intro</kbd>{' '}
            coger / soltar · <kbd>A</kbd> mover solo · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista ·{' '}
            <kbd>F</kbd> terminar · <kbd>N</kbd> nueva partida.
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
        <li>All cards are dealt face up into eight columns (four of 7 and four of 6).</li>
        <li>Build down the columns in alternating colors. An empty column takes any card.</li>
        <li>
          Each of the <strong>four free cells</strong> holds any one card.
        </li>
        <li>
          Cards move one at a time; a run may move whole if there would be room to move it card by
          card: at most (free cells + 1) × 2<sup>empty columns</sup>.
        </li>
        <li>
          Cards no column can still need go home by themselves. If no move is left, the deal is
          lost.
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
          drop · <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>F</kbd>{' '}
          finish · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
