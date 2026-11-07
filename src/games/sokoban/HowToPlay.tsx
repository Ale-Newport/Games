import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Lleva todas las cajas a las metas (los círculos rojos) del almacén.</p>
        <h3>Reglas</h3>
        <ul>
          <li>Te mueves en horizontal y vertical por el suelo; los muros no se cruzan.</li>
          <li>Empujas una caja al andar contra ella si la casilla de detrás está libre.</li>
          <li>Nunca puedes tirar de una caja ni empujar dos a la vez.</li>
          <li>
            Una caja en una esquina sin meta, o contra una pared sin metas, ya no podrá llegar: se
            marca en rojo.
          </li>
        </ul>
        <p>
          Los almacenes los crea el generador del juego: coloca las cajas en sus metas y las
          arrastra hacia atrás tan lejos como puede. El marcador muestra el mínimo de empujes.
        </p>
        <h3>Controles</h3>
        <p>
          Toca una casilla para ir andando, toca una caja junto a ti o desliza para empujar. Flechas
          o <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> mover · <kbd>U</kbd> deshacer · <kbd>R</kbd> reiniciar · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Move every crate in the warehouse onto a goal (the red circles).</p>
      <h3>Rules</h3>
      <ul>
        <li>You walk across and down the floor; walls cannot be crossed.</li>
        <li>Walking into a crate pushes it when the cell behind it is free.</li>
        <li>You can never pull a crate or push two at once.</li>
        <li>
          A crate in a corner without a goal, or against a wall with no goals along it, can never
          get out: it is marked in red.
        </li>
      </ul>
      <p>
        The warehouses come from the game’s generator: it puts the crates on their goals and drags
        them back as far as it can. The counter shows the fewest pushes possible.
      </p>
      <h3>Controls</h3>
      <p>
        Tap a cell to walk there, tap a crate next to you or swipe to push. Arrows or <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> move · <kbd>U</kbd> undo · <kbd>R</kbd> restart · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
