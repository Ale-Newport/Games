import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Retira todas las fichas de la mesa, de dos en dos.</p>
        <h3>Fichas libres</h3>
        <ul>
          <li>
            Solo se pueden retirar fichas libres: sin ninguna ficha encima y con el lado izquierdo o
            el derecho sin ficha al lado.
          </li>
          <li>Las fichas libres se ven más claras; las tapadas, más oscuras.</li>
        </ul>
        <h3>Parejas</h3>
        <ul>
          <li>
            Retira dos fichas libres iguales: mismo palo y número (círculos, bambú, caracteres),
            mismo viento o mismo dragón.
          </li>
          <li>Las cuatro flores casan entre sí, igual que las cuatro estaciones.</li>
        </ul>
        <h3>Ayudas</h3>
        <p>
          Todos los repartos tienen solución. Si te atascas, puedes deshacer o barajar las fichas
          que quedan (tres veces por reparto; la nueva colocación también tiene solución). La pista
          marca una pareja.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una ficha libre y después su pareja · <kbd>H</kbd> pista · <kbd>U</kbd> deshacer ·{' '}
          <kbd>S</kbd> barajar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Clear every tile from the table, two at a time.</p>
      <h3>Free tiles</h3>
      <ul>
        <li>
          Only free tiles can be removed: nothing lies on them, and their left or right side has no
          tile next to it.
        </li>
        <li>Free tiles look brighter; blocked ones are shaded.</li>
      </ul>
      <h3>Pairs</h3>
      <ul>
        <li>
          Remove two identical free tiles: same suit and number (dots, bamboo, characters), the same
          wind or the same dragon.
        </li>
        <li>The four flowers match one another, and so do the four seasons.</li>
      </ul>
      <h3>Help</h3>
      <p>
        Every deal can be cleared. If you get stuck you can undo, or shuffle the remaining tiles
        (three times per deal; the new arrangement can be cleared too). A hint marks a pair.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a free tile, then its match · <kbd>H</kbd> hint · <kbd>U</kbd> undo · <kbd>S</kbd>{' '}
        shuffle.
      </p>
    </>
  );
}
