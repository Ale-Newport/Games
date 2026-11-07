import type { Locale } from '../../core/i18n';

export function Rules({ locale }: { locale: Locale }) {
  if (locale === 'es') {
    return (
      <>
        <h3>Objetivo</h3>
        <p>Sombrea casillas (el mar) hasta que se cumplan las reglas:</p>
        <ol>
          <li>
            Las casillas sin sombrear forman <strong>islas</strong>; cada isla contiene exactamente
            un número, igual a su número de casillas.
          </li>
          <li>Todo el mar está unido en una sola zona (por los lados).</li>
          <li>El mar nunca llena un bloque de 2×2.</li>
        </ol>
        <p>Cada nurikabe tiene una única solución.</p>
        <h3>Trucos</h3>
        <ul>
          <li>Una casilla que toca dos islas numeradas distintas es mar.</li>
          <li>Cuando una isla está completa, todo lo que la rodea es mar.</li>
          <li>Las casillas a las que ninguna isla puede llegar son mar.</li>
          <li>Si tres casillas de un 2×2 son mar, la cuarta es tierra.</li>
        </ul>
        <h3>Controles</h3>
        <p>
          Toca para sombrear (mar), otra vez para poner un punto (tierra) y otra para borrar; o
          elige «Mar» / «Tierra». Flechas mover · <kbd>Espacio</kbd> mar · <kbd>K</kbd> tierra ·{' '}
          <kbd>Retroceso</kbd> borrar · <kbd>U</kbd> deshacer · <kbd>R</kbd> rehacer · <kbd>H</kbd>{' '}
          pista · <kbd>P</kbd> pausa.
        </p>
      </>
    );
  }
  return (
    <>
      <h3>Goal</h3>
      <p>Shade cells (the sea) until the rules hold:</p>
      <ol>
        <li>
          The unshaded cells form <strong>islands</strong>; each island contains exactly one number,
          equal to its number of cells.
        </li>
        <li>All of the sea is one connected area (through sides).</li>
        <li>The sea never fills a 2×2 block.</li>
      </ol>
      <p>Every puzzle has exactly one solution.</p>
      <h3>Tips</h3>
      <ul>
        <li>A cell touching two different numbered islands is sea.</li>
        <li>Once an island is complete, everything around it is sea.</li>
        <li>Cells no island can reach are sea.</li>
        <li>If three cells of a 2×2 block are sea, the fourth is land.</li>
      </ul>
      <h3>Controls</h3>
      <p>
        Tap to shade (sea), again for a dot (land), again to clear — or pick &ldquo;Sea&rdquo; /
        &ldquo;Land&rdquo;. Arrows move · <kbd>Space</kbd> sea · <kbd>K</kbd> land ·{' '}
        <kbd>Backspace</kbd> clear · <kbd>U</kbd> undo · <kbd>R</kbd> redo · <kbd>H</kbd> hint ·{' '}
        <kbd>P</kbd> pause.
      </p>
    </>
  );
}
