import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Traza un único sendero que:</p>
        <ol>
          <li>
            Pase por todas las casillas exactamente una vez, moviéndose en horizontal o vertical.
          </li>
          <li>Empiece en el 1 y pase por los números en orden (1, 2, 3…) hasta el último.</li>
          <li>No cruce ningún muro (las líneas gruesas entre casillas).</li>
        </ol>
        <p>Cada puzle tiene un único sendero posible.</p>
        <h3>Trucos</h3>
        <ul>
          <li>Una casilla con solo dos entradas libres tiene que usar las dos.</li>
          <li>No dejes casillas aisladas: el sendero tendría que volver a ellas.</li>
          <li>Las esquinas y los rincones entre muros suelen decidir el camino.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Arrastra desde el final del sendero; vuelve por encima para deshacer o toca una casilla
          del sendero para recortarlo hasta ella. Flechas avanzar · <kbd>Retroceso</kbd> volver una
          · <kbd>H</kbd> pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Draw one trail that:</p>
      <ol>
        <li>Passes through every cell exactly once, moving across or down.</li>
        <li>Starts on 1 and passes the numbers in order (1, 2, 3…) up to the last one.</li>
        <li>Never crosses a wall (the thick lines between cells).</li>
      </ol>
      <p>Every puzzle has exactly one possible trail.</p>
      <h3>Tips</h3>
      <ul>
        <li>A cell with only two free ways in must use both.</li>
        <li>Never cut a cell off: the trail would have to come back to it.</li>
        <li>Corners and pockets between walls often decide the way.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Drag from the end of the trail; drag back over it to undo, or tap a trail cell to cut back
        to it. Arrows extend · <kbd>Backspace</kbd> back one · <kbd>H</kbd> hint · <kbd>P</kbd>{' '}
        pause.
      </p>
    </>
  );
}
