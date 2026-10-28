import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Une todas las islas con puentes siguiendo estas reglas:</p>
        <ul>
          <li>Cada isla tiene tantos puentes como indica su número.</li>
          <li>Los puentes son rectos (horizontales o verticales) y unen dos islas enfrentadas.</li>
          <li>Entre dos islas hay como mucho dos puentes.</li>
          <li>Los puentes no se cruzan ni pasan por encima de otra isla.</li>
          <li>Al final todas las islas quedan conectadas en un solo grupo.</li>
        </ul>
        <p>Cada tablero tiene una única solución.</p>
        <h3>Trucos</h3>
        <ul>
          <li>Un 8 con cuatro vecinas lleva dos puentes a cada una; un 6 con tres, también.</li>
          <li>
            Si una isla no llega a su número sin una vecina, al menos un puente va hacia ella.
          </li>
          <li>
            Dos 1 juntos no se unen entre sí (quedarían aislados); dos 2 tampoco con dos puentes.
          </li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca el agua entre dos islas para añadir un puente; el segundo toque pone el doble y el
          tercero los quita. También puedes tocar una isla y luego otra. Las islas completas se
          tiñen de verde. <kbd>U</kbd> deshacer · <kbd>R</kbd> rehacer · <kbd>H</kbd> pista ·{' '}
          <kbd>Intro</kbd> aplicar la pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Connect all the islands with bridges following these rules:</p>
      <ul>
        <li>Each island has as many bridges as its number.</li>
        <li>Bridges are straight (horizontal or vertical) and join two facing islands.</li>
        <li>At most two bridges join the same two islands.</li>
        <li>Bridges never cross each other or pass over another island.</li>
        <li>In the end, all islands form one connected group.</li>
      </ul>
      <p>Every board has exactly one solution.</p>
      <h3>Tips</h3>
      <ul>
        <li>An 8 with four neighbours takes two bridges to each; so does a 6 with three.</li>
        <li>
          If an island cannot reach its number without a neighbour, at least one bridge goes there.
        </li>
        <li>
          Two 1s never join each other (they would be cut off); nor two 2s with a double bridge.
        </li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap the water between two islands to add a bridge; a second tap makes it double and a third
        removes it. You can also tap one island and then another. Finished islands turn green.{' '}
        <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint · <kbd>Enter</kbd> apply the hint
        · <kbd>P</kbd> pause.
      </p>
    </>
  );
}
