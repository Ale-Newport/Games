import type { Locale } from '../../../core/i18n';

/** Rules for the tube-sorting puzzles (water pours whole runs; balls move one at a time). */
export function SortRules({ locale, look }: { locale: Locale; look: 'water' | 'balls' }) {
  const water = look === 'water';
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Deja cada tubo vacío o lleno de un solo color.</p>
        <h3>Movimientos</h3>
        <ul>
          <li>Toca un tubo para coger lo de arriba y otro tubo para soltarlo.</li>
          <li>Solo se puede soltar en un tubo vacío o cuyo color de arriba sea el mismo.</li>
          <li>
            {water
              ? 'El líquido se vierte entero: pasa toda la capa del mismo color que quepa.'
              : 'Las bolas se mueven de una en una.'}
          </li>
          <li>Cada tubo tiene una capacidad fija.</li>
        </ul>
        <p>Cada mezcla se comprueba con el solucionador, así que siempre tiene solución.</p>
        <h3>Controles</h3>
        <p>
          Toca los tubos o pulsa sus números (<kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd>) ·{' '}
          <kbd>U</kbd> deshacer · <kbd>H</kbd> pista · <kbd>Esc</kbd> cancelar.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Leave every tube empty or full of a single color.</p>
      <h3>Moves</h3>
      <ul>
        <li>Tap a tube to lift its top, then another tube to drop it.</li>
        <li>You may only drop into an empty tube or one whose top is the same color.</li>
        <li>
          {water
            ? 'Liquid pours as a whole: the full layer of that color moves, as much as fits.'
            : 'Balls move one at a time.'}
        </li>
        <li>Every tube has a fixed capacity.</li>
      </ul>
      <p>Every shuffle is checked by the solver, so it can always be sorted.</p>
      <h3>Controls</h3>
      <p>
        Tap tubes or press their numbers (<kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd>) · <kbd>U</kbd>{' '}
        undo · <kbd>H</kbd> hint · <kbd>Esc</kbd> cancel.
      </p>
    </>
  );
}
