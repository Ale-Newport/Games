import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Completar las <strong>cuatro escaleras</strong> del rey al as, cada una de un palo.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            Siete columnas de siete cartas; en las cuatro primeras, las tres de abajo están boca
            abajo. Quedan tres cartas de reserva.
          </li>
          <li>
            Se baja del <strong>mismo palo</strong>, un rango menos.
          </li>
          <li>
            Cualquier carta boca arriba se mueve con todo lo que tiene encima, esté en orden o no.
            Una columna vacía solo admite un rey.
          </li>
          <li>
            Toca el mazo para repartir las tres cartas de reserva sobre las tres primeras columnas.
          </li>
          <li>
            Una escalera completa del rey al as de un palo sale de la mesa sola. Las cartas boca
            abajo se destapan solas.
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
        Complete all <strong>four runs</strong> from king down to ace, each of one suit.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>
          Seven columns of seven cards; in the first four, the bottom three are face down. Three
          cards stay in reserve.
        </li>
        <li>
          Build down in the <strong>same suit</strong>, one rank lower.
        </li>
        <li>
          Any face-up card moves with everything on it, in order or not. An empty column takes only
          a king.
        </li>
        <li>Tap the stock to deal the three reserve cards onto the first three columns.</li>
        <li>
          A complete king-to-ace run of one suit leaves the table by itself. Face-down cards turn up
          by themselves.
        </li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>
          Tap a card, then where it goes, or tap it twice to send it to its best spot. You can also
          drag.
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
