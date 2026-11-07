import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Formar y retirar las <strong>ocho escaleras</strong> del rey al as.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Dos barajas completas con los cuatro palos (104 cartas). Diez columnas: las cuatro
            primeras con 6 cartas y el resto con 5, solo la de arriba boca arriba. Quedan 50 en el
            mazo.
          </li>
          <li>
            Una carta va sobre otra un rango más alta, de cualquier palo. Una columna vacía admite
            cualquier carta.
          </li>
          <li>
            Varias cartas se mueven juntas solo si forman una escalera descendente del mismo palo.
          </li>
          <li>
            Toca el mazo para repartir una carta en cada columna (no se puede con columnas vacías).
          </li>
          <li>
            Una escalera completa del rey al as de un mismo palo sale de la mesa sola. Las cartas
            boca abajo se destapan solas.
          </li>
          <li>Puntos: empiezas con 500, −1 por jugada y +100 por escalera completa.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta (y las que tiene encima) y luego la columna de destino, o tócala dos
            veces para moverla a su mejor sitio. También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> columna · <kbd>↑</kbd>/<kbd>↓</kbd> carta · <kbd>Intro</kbd>{' '}
            coger / soltar · <kbd>D</kbd> repartir · <kbd>A</kbd> mover solo · <kbd>U</kbd> deshacer
            · <kbd>H</kbd> pista · <kbd>N</kbd> nueva partida.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Build and clear all <strong>eight runs</strong> from king down to ace.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Two full decks with all four suits (104 cards). Ten columns: the first four get 6 cards
          and the rest 5, only the top card face up. 50 cards stay in the stock.
        </li>
        <li>A card goes onto one a rank higher, of any suit. An empty column takes any card.</li>
        <li>Several cards move together only as a descending run of one suit.</li>
        <li>Tap the stock to deal one card onto every column (not while a column is empty).</li>
        <li>
          A complete king-to-ace run of one suit leaves the table by itself. Face-down cards turn up
          by themselves.
        </li>
        <li>Score: 500 to start, −1 per move, +100 per run completed.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card (and those on it), then the column to move it to, or tap it twice to send it to
          its best spot. You can also drag.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> column · <kbd>↑</kbd>/<kbd>↓</kbd> card · <kbd>Enter</kbd> pick
          / drop · <kbd>D</kbd> deal · <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd>{' '}
          hint · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
