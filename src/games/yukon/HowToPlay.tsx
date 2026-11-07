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
            Siete columnas: la primera con una carta y las demás con 1–6 cartas boca abajo y 5 boca
            arriba. No hay mazo.
          </li>
          <li>Se baja alternando colores, un rango menos.</li>
          <li>
            Puedes mover <strong>cualquier carta boca arriba con todas las que tiene encima</strong>
            , aunque no estén en orden. Una columna vacía solo admite un rey (con lo que lleve
            encima).
          </li>
          <li>
            Las cartas boca abajo se destapan solas. Si no queda ninguna jugada, la partida está
            perdida.
          </li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Toca una carta y luego su destino, o tócala dos veces para moverla a su mejor sitio.
            También puedes arrastrar.
          </li>
          <li>
            <kbd>←</kbd>/<kbd>→</kbd> columna · <kbd>↑</kbd>/<kbd>↓</kbd> carta · <kbd>Intro</kbd>{' '}
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
        <li>
          Seven columns: the first holds one card, the others 1–6 face-down cards under 5 face-up
          ones. There is no stock.
        </li>
        <li>Build down in alternating colors, one rank lower.</li>
        <li>
          You may move <strong>any face-up card together with all the cards on it</strong>, in order
          or not. An empty column takes only a king (with whatever is on it).
        </li>
        <li>Face-down cards turn up by themselves. If no move is left, the deal is lost.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card, then where it goes, or tap it twice to send it to its best spot. You can also
          drag.
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> column · <kbd>↑</kbd>/<kbd>↓</kbd> card · <kbd>Enter</kbd> pick
          / drop · <kbd>A</kbd> auto-move · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>F</kbd>{' '}
          finish · <kbd>N</kbd> new deal.
        </li>
      </ul>
    </>
  );
}
