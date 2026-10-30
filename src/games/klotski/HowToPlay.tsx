import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Lleva el bloque rojo grande (2×2) a la parte de abajo, en el centro de la bandeja: allí
          está la salida por la que escapa.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>
            La bandeja mide 4 casillas de ancho por 5 de alto y siempre quedan dos huecos libres.
          </li>
          <li>Los bloques se deslizan por los huecos; no se pueden levantar ni girar.</li>
          <li>
            Un movimiento es llevar un bloque a otro sitio por cualquier camino libre, aunque doble
            una esquina. Mover otra vez el mismo bloque justo después cuenta como el mismo
            movimiento.
          </li>
        </ul>
        <p>
          Cada puzle muestra su mínimo de movimientos, calculado recorriendo todas las posiciones.
          La disposición tradicional necesita 81.
        </p>
        <h3>Controles</h3>
        <p>
          Arrastra un bloque, o tócalo y toca uno de los huecos marcados · <kbd>Tab</kbd> siguiente
          bloque · flechas moverlo · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Bring the big red block (2×2) to the bottom middle of the tray: that is where the exit is.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>The tray is 4 cells wide and 5 tall, and there are always two free cells.</li>
        <li>Blocks slide through the free cells; they cannot be lifted or turned.</li>
        <li>
          A move takes one block anywhere along a free path, even round a corner. Moving the same
          block again right away counts as the same move.
        </li>
      </ul>
      <p>
        Each puzzle shows its fewest moves, worked out by visiting every position. The traditional
        layout needs 81.
      </p>
      <h3>Controls</h3>
      <p>
        Drag a block, or tap it and then one of the marked spots · <kbd>Tab</kbd> next block ·
        arrows move it · <kbd>U</kbd> undo · <kbd>H</kbd> hint.
      </p>
    </>
  );
}
