import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>
          Dejar al rival <strong>sin ninguna casilla a la que moverse</strong>.
        </p>
        <h3>Reglas</h3>
        <ul>
          <li>Tablero de 7×7 casillas. Oro empieza en d1 y Jade en d7; Oro mueve primero.</li>
          <li>
            Cada turno tiene dos pasos: <strong>mueve</strong> tu peón una casilla en cualquiera de
            las ocho direcciones a una casilla libre, y luego <strong>retira</strong> cualquier
            casilla libre del tablero (también la que acabas de dejar).
          </li>
          <li>Las casillas retiradas no vuelven y nadie puede pisarlas.</li>
          <li>Pierde quien, al empezar su turno, no puede moverse. No hay tablas.</li>
        </ul>
        <h3>Controles</h3>
        <ul>
          <li>
            Paso 1: toca una casilla marcada con un punto. Paso 2: toca la casilla que quieres
            retirar.
          </li>
          <li>
            Flechas e <kbd>Intro</kbd> · <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>R</kbd>{' '}
            reiniciar · <kbd>N</kbd> siguiente.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>
        Leave your opponent with <strong>no tile to step to</strong>.
      </p>
      <h3>Rules</h3>
      <ul>
        <li>A 7×7 board of tiles. Gold starts on d1 and Jade on d7; Gold moves first.</li>
        <li>
          Each turn has two steps: <strong>move</strong> your pawn one cell in any of the eight
          directions onto a free tile, then <strong>remove</strong> any free tile from the board
          (the one you just left included).
        </li>
        <li>Removed tiles never come back and cannot be stepped on.</li>
        <li>A player who cannot move at the start of their turn loses. There are no draws.</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Step 1: tap a tile marked with a dot. Step 2: tap the tile you want to remove.</li>
        <li>
          Arrows and <kbd>Enter</kbd> · <kbd>U</kbd> undo · <kbd>H</kbd> hint · <kbd>R</kbd> restart
          · <kbd>N</kbd> next.
        </li>
      </ul>
    </>
  );
}
